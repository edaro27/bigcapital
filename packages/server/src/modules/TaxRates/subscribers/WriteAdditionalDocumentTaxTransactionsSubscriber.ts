import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { events } from '@/common/events/events';
import {
  ISaleReceiptCreatedPayload,
  ISaleReceiptEditedPayload,
  ISaleReceiptEventDeletedPayload,
} from '@/modules/SaleReceipts/types/SaleReceipts.types';
import {
  ICreditNoteCreatedPayload,
  ICreditNoteDeletedPayload,
  ICreditNoteEditedPayload,
} from '@/modules/CreditNotes/types/CreditNotes.types';
import {
  IVendorCreditCreatedPayload,
  IVendorCreditDeletedPayload,
  IVendorCreditEditedPayload,
} from '@/modules/VendorCredit/types/VendorCredit.types';
import { WriteTaxTransactionsItemEntries } from '../WriteTaxTransactionsItemEntries';
import { CommandTaxRatesValidators } from '../commands/CommandTaxRatesValidator.service';

/** Keeps tax-rate reporting rows synchronized for all item-based documents. */
@Injectable()
export class WriteAdditionalDocumentTaxTransactionsSubscriber {
  constructor(
    private readonly writeTaxTransactions: WriteTaxTransactionsItemEntries,
    private readonly taxValidators: CommandTaxRatesValidators,
  ) {}

  private async validateEntries(entries) {
    await this.taxValidators.validateItemEntriesTaxCode(entries);
    await this.taxValidators.validateItemEntriesTaxCodeId(entries);
  }

  @OnEvent(events.saleReceipt.onCreating)
  async validateSaleReceiptCreate({ saleReceiptDTO }) {
    await this.validateEntries(saleReceiptDTO.entries);
  }

  @OnEvent(events.saleReceipt.onEditing)
  async validateSaleReceiptEdit({ saleReceiptDTO }) {
    await this.validateEntries(saleReceiptDTO.entries);
  }

  @OnEvent(events.creditNote.onCreating)
  async validateCreditNoteCreate({ creditNoteDTO }) {
    await this.validateEntries(creditNoteDTO.entries);
  }

  @OnEvent(events.creditNote.onEditing)
  async validateCreditNoteEdit({ creditNoteEditDTO }) {
    await this.validateEntries(creditNoteEditDTO.entries);
  }

  @OnEvent(events.vendorCredit.onCreating)
  async validateVendorCreditCreate({ vendorCreditCreateDTO }) {
    await this.validateEntries(vendorCreditCreateDTO.entries);
  }

  @OnEvent(events.vendorCredit.onEditing)
  async validateVendorCreditEdit({ vendorCreditDTO }) {
    await this.validateEntries(vendorCreditDTO.entries);
  }

  @OnEvent(events.saleReceipt.onCreated)
  async onSaleReceiptCreated({ saleReceipt, trx }: ISaleReceiptCreatedPayload) {
    await this.writeTaxTransactions.writeTaxTransactionsFromItemEntries(
      saleReceipt.entries,
      trx,
    );
  }

  @OnEvent(events.saleReceipt.onEdited)
  async onSaleReceiptEdited({ saleReceipt, trx }: ISaleReceiptEditedPayload) {
    await this.writeTaxTransactions.rewriteTaxRateTransactionsFromItemEntries(
      saleReceipt.entries,
      'SaleReceipt',
      saleReceipt.id,
      trx,
    );
  }

  @OnEvent(events.saleReceipt.onDeleted)
  async onSaleReceiptDeleted({
    saleReceiptId,
    trx,
  }: ISaleReceiptEventDeletedPayload) {
    await this.writeTaxTransactions.removeTaxTransactionsFromItemEntries(
      saleReceiptId,
      'SaleReceipt',
      trx,
    );
  }

  @OnEvent(events.creditNote.onCreated)
  async onCreditNoteCreated({ creditNote, trx }: ICreditNoteCreatedPayload) {
    await this.writeTaxTransactions.writeTaxTransactionsFromItemEntries(
      creditNote.entries,
      trx,
    );
  }

  @OnEvent(events.creditNote.onEdited)
  async onCreditNoteEdited({ creditNote, trx }: ICreditNoteEditedPayload) {
    await this.writeTaxTransactions.rewriteTaxRateTransactionsFromItemEntries(
      creditNote.entries,
      'CreditNote',
      creditNote.id,
      trx,
    );
  }

  @OnEvent(events.creditNote.onDeleted)
  async onCreditNoteDeleted({ creditNoteId, trx }: ICreditNoteDeletedPayload) {
    await this.writeTaxTransactions.removeTaxTransactionsFromItemEntries(
      creditNoteId,
      'CreditNote',
      trx,
    );
  }

  @OnEvent(events.vendorCredit.onCreated)
  async onVendorCreditCreated({
    vendorCredit,
    trx,
  }: IVendorCreditCreatedPayload) {
    await this.writeTaxTransactions.writeTaxTransactionsFromItemEntries(
      vendorCredit.entries,
      trx,
    );
  }

  @OnEvent(events.vendorCredit.onEdited)
  async onVendorCreditEdited({
    vendorCredit,
    trx,
  }: IVendorCreditEditedPayload) {
    await this.writeTaxTransactions.rewriteTaxRateTransactionsFromItemEntries(
      vendorCredit.entries,
      'VendorCredit',
      vendorCredit.id,
      trx,
    );
  }

  @OnEvent(events.vendorCredit.onDeleted)
  async onVendorCreditDeleted({
    vendorCreditId,
    trx,
  }: IVendorCreditDeletedPayload) {
    await this.writeTaxTransactions.removeTaxTransactionsFromItemEntries(
      vendorCreditId,
      'VendorCredit',
      trx,
    );
  }
}
