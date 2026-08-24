/** Stores Stripe delivery IDs without retaining the payment payload. */
exports.up = function (knex) {
  return knex.schema.createTable('stripe_webhook_events', (table) => {
    table.increments('id').primary();
    table.string('event_id').notNullable().unique();
    table.string('event_type').notNullable();
    table.string('status', 20).notNullable().defaultTo('processing');
    table.string('processing_token', 36).notNullable();
    table.integer('tenant_id').nullable().index();
    table.string('external_object_id').nullable().index();
    table.string('connected_account_id').nullable().index();
    table.bigInteger('amount').nullable();
    table.string('currency_code', 3).nullable();
    table.text('error').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('stripe_webhook_events');
};
