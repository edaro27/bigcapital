import { Knex } from 'knex';

const DOCUMENT_NUMBERS = [
  ['sales_invoices', 'invoice_no', 'uq_sales_invoices_invoice_no'],
  ['bills', 'bill_number', 'uq_bills_bill_number'],
  ['sales_receipts', 'receipt_number', 'uq_sales_receipts_receipt_number'],
  [
    'payment_receives',
    'payment_receive_no',
    'uq_payment_receives_payment_receive_no',
  ],
  ['bills_payments', 'payment_number', 'uq_bills_payments_payment_number'],
  ['credit_notes', 'credit_note_number', 'uq_credit_notes_credit_note_number'],
  [
    'vendor_credits',
    'vendor_credit_number',
    'uq_vendor_credits_vendor_credit_number',
  ],
  ['manual_journals', 'journal_number', 'uq_manual_journals_journal_number'],
  ['sales_estimates', 'estimate_number', 'uq_sales_estimates_estimate_number'],
] as const;

export async function up(knex: Knex): Promise<void> {
  for (const [tableName, columnName, constraintName] of DOCUMENT_NUMBERS) {
    await knex.schema.alterTable(tableName, (table) => {
      table.unique([columnName], constraintName);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const [tableName, columnName, constraintName] of [
    ...DOCUMENT_NUMBERS,
  ].reverse()) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropUnique([columnName], constraintName);
    });
  }
}
