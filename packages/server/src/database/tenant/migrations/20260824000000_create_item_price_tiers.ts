/**
 * Creates per-item quantity price tiers.
 *
 * A tier applies when the sale quantity is greater than or equal to its
 * minimum quantity. The item's regular selling price remains the fallback
 * below the first tier.
 */
exports.up = function (knex) {
  return knex.schema.createTable('item_price_tiers', (table) => {
    table.increments('id');
    table
      .integer('item_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('items')
      .onDelete('CASCADE');
    table.decimal('minimum_quantity', 13, 3).unsigned().notNullable();
    table.decimal('price', 15, 4).unsigned().notNullable();
    table.timestamps();

    table.unique(['item_id', 'minimum_quantity']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('item_price_tiers');
};
