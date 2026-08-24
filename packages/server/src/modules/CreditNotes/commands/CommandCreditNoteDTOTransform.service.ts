import { Injectable } from '@nestjs/common';
import { omit } from 'lodash';
import * as moment from 'moment';
import * as composeAsync from 'async/compose';
import * as R from 'ramda';
import { ERRORS } from '../constants';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ItemsEntriesService } from '@/modules/Items/ItemsEntries.service';
import { BranchTransactionDTOTransformer } from '@/modules/Branches/integrations/BranchTransactionDTOTransform';
import { WarehouseTransactionDTOTransform } from '@/modules/Warehouses/Integrations/WarehouseTransactionDTOTransform';
import { BrandingTemplateDTOTransformer } from '../../PdfTemplate/BrandingTemplateDTOTransformer';
import { assocItemEntriesDefaultIndex } from '@/utils/associate-item-entries-index';
import { formatDateFields } from '@/utils/format-date-fields';
import { CreditNoteAutoIncrementService } from './CreditNoteAutoIncrement.service';
import { CreditNote } from '../models/CreditNote';
import { ItemEntriesTaxTransactions } from '@/modules/TaxRates/ItemEntriesTaxTransactions.service';
import { CreateCreditNoteDto, EditCreditNoteDto } from '../dtos/CreditNote.dto';

@Injectable()
export class CommandCreditNoteDTOTransform {
  /**
   * @param {ItemsEntriesService} itemsEntriesService - The items entries service.
   * @param {BranchTransactionDTOTransformer} branchDTOTransform - The branch transaction DTO transformer.
   * @param {WarehouseTransactionDTOTransform} warehouseDTOTransform - The warehouse transaction DTO transformer.
   * @param {BrandingTemplateDTOTransformer} brandingTemplatesTransformer - The branding template DTO transformer.
   * @param {CreditNoteAutoIncrementService} creditNoteAutoIncrement - The credit note auto increment service.
   */
  constructor(
    private readonly itemsEntriesService: ItemsEntriesService,
    private readonly branchDTOTransform: BranchTransactionDTOTransformer,
    private readonly warehouseDTOTransform: WarehouseTransactionDTOTransform,
    private readonly brandingTemplatesTransformer: BrandingTemplateDTOTransformer,
    private readonly creditNoteAutoIncrement: CreditNoteAutoIncrementService,
    private readonly taxDTOTransformer: ItemEntriesTaxTransactions,
  ) {}

  /**
   * Transforms the credit/edit DTO to model.
   * @param {ICreditNoteNewDTO | ICreditNoteEditDTO} creditNoteDTO
   * @param {string} customerCurrencyCode -
   */
  public transformCreateEditDTOToModel = async (
    creditNoteDTO: CreateCreditNoteDto | EditCreditNoteDto,
    customerCurrencyCode: string,
    oldCreditNote?: CreditNote,
  ): Promise<CreditNote> => {
    // Retrieve the total amount of the given items entries.
    const amount = this.itemsEntriesService.getTotalItemsEntries(
      creditNoteDTO.entries,
    );
    const initialEntries = creditNoteDTO.entries.map((entry) => ({
      ...entry,
      referenceType: 'CreditNote',
      isInclusiveTax: creditNoteDTO.isInclusiveTax,
    }));
    const asyncEntries = await composeAsync(
      this.taxDTOTransformer.assocTaxRateFromTaxIdToEntries,
      this.taxDTOTransformer.assocTaxRateIdFromCodeToEntries,
      this.itemsEntriesService.setItemsEntriesDefaultAccounts,
    )(initialEntries);
    const entries = R.compose(
      R.map(R.omit(['taxCode'])),
      // Associate the default index to each item entry.
      assocItemEntriesDefaultIndex,
    )(asyncEntries);

    // Retrieves the next credit note number.
    const autoNextNumber = this.creditNoteAutoIncrement.getNextCreditNumber();

    // Determines the credit note number.
    const creditNoteNumber =
      creditNoteDTO.creditNoteNumber ||
      oldCreditNote?.creditNoteNumber ||
      autoNextNumber;

    const initialDTO = {
      ...formatDateFields(omit(creditNoteDTO, ['open', 'attachments']), [
        'creditNoteDate',
      ]),
      creditNoteNumber,
      amount,
      currencyCode: customerCurrencyCode,
      exchangeRate: creditNoteDTO.exchangeRate || 1,
      entries,
      ...(creditNoteDTO.open &&
        !oldCreditNote?.openedAt && {
          openedAt: moment().toMySqlDateTime(),
        }),
      // Only initialize usage columns on create; editing must not clobber them.
      ...(!oldCreditNote && {
        refundedAmount: 0,
        invoicesAmount: 0,
      }),
    };
    const asyncDto = (await composeAsync(
      this.branchDTOTransform.transformDTO<CreditNote>,
      this.warehouseDTOTransform.transformDTO<CreditNote>,

      // Assigns the default branding template id to the invoice DTO.
      this.brandingTemplatesTransformer.assocDefaultBrandingTemplate(
        'CreditNote',
      ),
    )(initialDTO)) as CreditNote;

    return this.taxDTOTransformer.assocTaxAmountWithheldFromEntries(asyncDto);
  };

  /**
   * Validate the credit note remaining amount.
   * @param {ICreditNote} creditNote
   * @param {number} amount
   */
  public validateCreditRemainingAmount = (
    creditNote: CreditNote,
    amount: number,
  ) => {
    if (creditNote.creditsRemaining < amount) {
      throw new ServiceError(ERRORS.CREDIT_NOTE_HAS_NO_REMAINING_AMOUNT);
    }
  };

  /**
   * Validates the new credit note amount is not smaller than the already
   * refunded and applied-to-invoices amounts.
   * @param {CreditNote} creditNote
   * @param {number} newAmount
   */
  public validateCreditAmountNotBelowUsed = (
    creditNote: CreditNote,
    newTotal: number,
  ) => {
    const usedAmount = creditNote.refundedAmount + creditNote.invoicesAmount;

    if (newTotal < usedAmount) {
      throw new ServiceError(ERRORS.CREDIT_NOTE_AMOUNT_SMALLER_THAN_USED);
    }
  };
}
