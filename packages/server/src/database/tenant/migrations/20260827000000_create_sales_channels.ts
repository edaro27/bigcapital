import { Knex } from 'knex';

const DEFAULT_SALES_CHANNELS = ['E-commerce', 'Phone', 'Email'];

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sales_channels', (table) => {
    table.increments('id');
    table.string('name', 120).notNullable();
    table.boolean('active').notNullable().defaultTo(true);
    table.integer('sort_order').unsigned().notNullable().defaultTo(0);
    table.timestamps();

    table.unique(['name'], 'uq_sales_channels_name');
    table.index(['active', 'sort_order'], 'idx_sales_channels_active_sort');
  });

  await knex('sales_channels').insert(
    DEFAULT_SALES_CHANNELS.map((name, index) => ({
      name,
      active: true,
      sort_order: index,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    })),
  );

  await knex.schema.alterTable('sales_invoices', (table) => {
    table
      .integer('sales_channel_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('sales_channels')
      .onDelete('RESTRICT');
    table.index(['sales_channel_id'], 'idx_sales_invoices_sales_channel');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sales_invoices', (table) => {
    table.dropIndex(['sales_channel_id'], 'idx_sales_invoices_sales_channel');
    table.dropForeign(['sales_channel_id']);
    table.dropColumn('sales_channel_id');
  });
  await knex.schema.dropTableIfExists('sales_channels');
}
