import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sales_invoices', (table) => {
    table.string('payment_term', 32).nullable();
    table.index(['payment_term'], 'idx_sales_invoices_payment_term');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sales_invoices', (table) => {
    table.dropIndex(['payment_term'], 'idx_sales_invoices_payment_term');
    table.dropColumn('payment_term');
  });
}
