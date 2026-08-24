import { Knex } from 'knex';

const TABLES = ['sales_receipts', 'credit_notes', 'vendor_credits'];

export async function up(knex: Knex): Promise<void> {
  for (const tableName of TABLES) {
    await knex.schema.alterTable(tableName, (table) => {
      table.boolean('is_inclusive_tax').notNullable().defaultTo(false);
      table.decimal('tax_amount_withheld', 13, 3).notNullable().defaultTo(0);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const tableName of [...TABLES].reverse()) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropColumn('tax_amount_withheld');
      table.dropColumn('is_inclusive_tax');
    });
  }
}
