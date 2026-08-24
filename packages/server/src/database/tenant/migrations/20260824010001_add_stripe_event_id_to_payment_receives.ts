/** Adds tenant-level idempotency for Stripe-created payments. */
exports.up = function (knex) {
  return knex.schema.alterTable('payment_receives', (table) => {
    table.string('stripe_event_id').nullable().unique();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('payment_receives', (table) => {
    table.dropUnique(['stripe_event_id']);
    table.dropColumn('stripe_event_id');
  });
};
