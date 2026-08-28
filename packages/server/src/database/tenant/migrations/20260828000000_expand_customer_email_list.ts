import { Knex } from 'knex';

const CUSTOMER_EMAIL_LIST_LENGTH = 1000;

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('contacts', (table) => {
    table.string('email', CUSTOMER_EMAIL_LIST_LENGTH).nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('contacts', (table) => {
    table.string('email', 255).nullable().alter();
  });
}
