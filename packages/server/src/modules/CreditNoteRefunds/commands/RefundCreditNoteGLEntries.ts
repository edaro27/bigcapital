import { LedgerStorageService } from '@/modules/Ledger/LedgerStorage.service';
import { Inject, Injectable } from '@nestjs/common';
import { RefundCreditNote } from '../models/RefundCreditNote';
import { Ledger } from '@/modules/Ledger/Ledger';
import { Knex } from 'knex';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { Account } from '@/modules/Accounts/models/Account.model';
import { ILedgerEntry } from '@/modules/Ledger/types/Ledger.types';
import { AccountNormal } from '@/interfaces/Account';
import { AccountRepository } from '@/modules/Accounts/repositories/Account.repository';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';

@Injectable()
export class RefundCreditNoteGLEntries {
  constructor(
    private readonly ledgerStorage: LedgerStorageService,
    private readonly accountRepository: AccountRepository,
    private readonly tenancyContext: TenancyContext,

    @Inject(Account.name)
    private readonly accountModel: TenantModelProxy<typeof Account>,

    @Inject(RefundCreditNote.name)
    private readonly refundCreditNoteModel: TenantModelProxy<
      typeof RefundCreditNote
    >,
  ) {}

  /**
   * Retrieves the refund credit common GL entry.
   * @param {IRefundCreditNote} refundCreditNote
   * @returns
   */
  private getRefundCreditCommonGLEntry = (
    refundCreditNote: RefundCreditNote,
  ) => {
    return {
      currencyCode: refundCreditNote.currencyCode,
      exchangeRate: refundCreditNote.exchangeRate,

      transactionType: 'RefundCreditNote',
      transactionId: refundCreditNote.id,
      date: refundCreditNote.date,
      userId: refundCreditNote.userId,

      referenceNumber: refundCreditNote.referenceNo,

      createdAt: refundCreditNote.createdAt,
      indexGroup: 10,

      credit: 0,
      debit: 0,

      note: refundCreditNote.description,
      branchId: refundCreditNote.branchId,
    };
  };

  /**
   * Retrieves the refudn credit receivable GL entry.
   * @param   {IRefundCreditNote} refundCreditNote
   * @param   {number} ARAccountId
   * @returns {ILedgerEntry}
   */
  private getRefundCreditGLReceivableEntry = (
    refundCreditNote: RefundCreditNote,
    ARAccountId: number,
  ): ILedgerEntry => {
    const commonEntry = this.getRefundCreditCommonGLEntry(refundCreditNote);

    return {
      ...commonEntry,
      debit: refundCreditNote.amount * refundCreditNote.creditNote.exchangeRate,
      accountId: ARAccountId,
      contactId: refundCreditNote.creditNote.customerId,
      index: 1,
      accountNormal: AccountNormal.DEBIT,
    };
  };

  /**
   * Retrieves the refund credit withdrawal GL entry.
   * @param   {number} refundCreditNote
   * @returns {ILedgerEntry}
   */
  private getRefundCreditGLWithdrawalEntry = (
    refundCreditNote: RefundCreditNote,
  ): ILedgerEntry => {
    const commonEntry = this.getRefundCreditCommonGLEntry(refundCreditNote);

    return {
      ...commonEntry,
      credit: refundCreditNote.amount * refundCreditNote.exchangeRate,
      accountId: refundCreditNote.fromAccountId,
      index: 2,
      accountNormal: AccountNormal.DEBIT,
    };
  };

  /**
   * Retrieve the refund credit note GL entries.
   * @param {IRefundCreditNote} refundCreditNote
   * @param {number} receivableAccount
   * @returns {ILedgerEntry[]}
   */
  public getRefundCreditGLEntries(
    refundCreditNote: RefundCreditNote,
    ARAccountId: number,
    exchangeGainLossAccountId: number,
    baseCurrencyCode: string,
  ): ILedgerEntry[] {
    const receivableEntry = this.getRefundCreditGLReceivableEntry(
      refundCreditNote,
      ARAccountId,
    );
    const withdrawalEntry =
      this.getRefundCreditGLWithdrawalEntry(refundCreditNote);
    const difference = receivableEntry.debit - withdrawalEntry.credit;
    const exchangeGainLossEntry: ILedgerEntry = {
      ...this.getRefundCreditCommonGLEntry(refundCreditNote),
      currencyCode: baseCurrencyCode,
      exchangeRate: 1,
      debit: difference < 0 ? Math.abs(difference) : 0,
      credit: difference > 0 ? difference : 0,
      accountId: exchangeGainLossAccountId,
      accountNormal: AccountNormal.DEBIT,
      index: 3,
    };

    return difference
      ? [receivableEntry, withdrawalEntry, exchangeGainLossEntry]
      : [receivableEntry, withdrawalEntry];
  }

  /**
   * Creates refund credit GL entries.
   * @param {IRefundCreditNote} refundCreditNote
   * @param {Knex.Transaction} trx
   */
  public createRefundCreditGLEntries = async (
    refundCreditNoteId: number,
    trx?: Knex.Transaction,
  ) => {
    // Retrieve the refund with associated credit note.
    const refundCreditNote = await this.refundCreditNoteModel()
      .query(trx)
      .findById(refundCreditNoteId)
      .withGraphFetched('creditNote');

    // Receivable account A/R for the transaction currency.
    const receivableAccount =
      await this.accountRepository.findOrCreateAccountReceivable(
        refundCreditNote.currencyCode,
        {},
        trx,
      );
    const exchangeGainLossAccount = await this.accountModel()
      .query(trx)
      .findOne('slug', 'exchange-grain-loss')
      .throwIfNotFound();
    const tenantMeta = await this.tenancyContext.getTenantMetadata();
    // Retrieve refund credit GL entries.
    const refundGLEntries = this.getRefundCreditGLEntries(
      refundCreditNote,
      receivableAccount.id,
      exchangeGainLossAccount.id,
      tenantMeta.baseCurrency,
    );
    const ledger = new Ledger(refundGLEntries);

    // Saves refund ledger entries.
    await this.ledgerStorage.commit(ledger, trx);
  };

  /**
   * Reverts refund credit note GL entries.
   * @param {number} refundCreditNoteId
   * @param {number} receivableAccount
   * @param {Knex.Transaction} trx
   */
  public revertRefundCreditGLEntries = async (
    refundCreditNoteId: number,
    trx?: Knex.Transaction,
  ) => {
    await this.ledgerStorage.deleteByReference(
      refundCreditNoteId,
      'RefundCreditNote',
      trx,
    );
  };
}
