import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Correct the historical seed typo before enforcing slug uniqueness.
  await knex('accounts')
    .where({ slug: 'owner-drawings', code: '20003' })
    .update({ slug: 'loan' });

  await knex.schema.alterTable('accounts', (table) => {
    table.unique(['slug'], 'uq_accounts_slug');
  });
  await knex.schema.alterTable('tax_rates', (table) => {
    table.unique(['code'], 'uq_tax_rates_code');
  });
  await knex.schema.alterTable('payment_receives_entries', (table) => {
    table.unique(
      ['payment_receive_id', 'invoice_id'],
      'uq_payment_receive_invoice',
    );
  });
  await knex.schema.alterTable('bills_payments_entries', (table) => {
    table.unique(['bill_payment_id', 'bill_id'], 'uq_bill_payment_bill');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('bills_payments_entries', (table) => {
    table.dropUnique(['bill_payment_id', 'bill_id'], 'uq_bill_payment_bill');
  });
  await knex.schema.alterTable('payment_receives_entries', (table) => {
    table.dropUnique(
      ['payment_receive_id', 'invoice_id'],
      'uq_payment_receive_invoice',
    );
  });
  await knex.schema.alterTable('tax_rates', (table) => {
    table.dropUnique(['code'], 'uq_tax_rates_code');
  });
  await knex.schema.alterTable('accounts', (table) => {
    table.dropUnique(['slug'], 'uq_accounts_slug');
  });
}
