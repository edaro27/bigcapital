import { Knex } from 'knex';

type ColumnPrecision = {
  tableName: string;
  columns: Array<{
    name: string;
    precision: number;
    scale: number;
    unsigned?: boolean;
  }>;
};

/**
 * Four-decimal unit prices can produce extended amounts with up to eight
 * decimal places when multiplied by the supported three-decimal quantity.
 * Keep that precision in operational tables; ledger postings are still
 * normalized to the currency's minor unit (two decimals for USD).
 */
const expandedColumns: ColumnPrecision[] = [
  {
    tableName: 'items',
    columns: [
      { name: 'sell_price', precision: 15, scale: 5, unsigned: true },
      { name: 'cost_price', precision: 15, scale: 5, unsigned: true },
    ],
  },
  {
    tableName: 'sales_invoices',
    columns: [
      { name: 'balance', precision: 19, scale: 8 },
      { name: 'payment_amount', precision: 19, scale: 8 },
      { name: 'credited_amount', precision: 19, scale: 8 },
      { name: 'writtenoff_amount', precision: 19, scale: 8 },
      { name: 'tax_amount_withheld', precision: 19, scale: 8 },
    ],
  },
  {
    tableName: 'bills',
    columns: [
      { name: 'amount', precision: 19, scale: 8 },
      { name: 'payment_amount', precision: 19, scale: 8 },
      { name: 'landed_cost_amount', precision: 19, scale: 8 },
      { name: 'allocated_cost_amount', precision: 19, scale: 8 },
      { name: 'credited_amount', precision: 19, scale: 8 },
      { name: 'tax_amount_withheld', precision: 19, scale: 8 },
    ],
  },
  {
    tableName: 'sales_receipts',
    columns: [
      { name: 'amount', precision: 19, scale: 8 },
      { name: 'tax_amount_withheld', precision: 19, scale: 8 },
    ],
  },
  {
    tableName: 'sales_estimates',
    columns: [{ name: 'amount', precision: 19, scale: 8 }],
  },
  {
    tableName: 'credit_notes',
    columns: [
      { name: 'amount', precision: 19, scale: 8 },
      { name: 'refunded_amount', precision: 19, scale: 8 },
      { name: 'invoices_amount', precision: 19, scale: 8 },
      { name: 'tax_amount_withheld', precision: 19, scale: 8 },
    ],
  },
  {
    tableName: 'vendor_credits',
    columns: [
      { name: 'amount', precision: 19, scale: 8 },
      { name: 'refunded_amount', precision: 19, scale: 8 },
      { name: 'invoiced_amount', precision: 19, scale: 8 },
      { name: 'tax_amount_withheld', precision: 19, scale: 8 },
    ],
  },
  {
    tableName: 'items_entries',
    columns: [
      {
        name: 'allocated_cost_amount',
        precision: 19,
        scale: 8,
      },
    ],
  },
  {
    tableName: 'inventory_transactions',
    columns: [{ name: 'rate', precision: 15, scale: 5, unsigned: true }],
  },
  {
    tableName: 'inventory_cost_lot_tracker',
    columns: [
      { name: 'rate', precision: 15, scale: 5 },
      { name: 'cost', precision: 19, scale: 8 },
    ],
  },
  {
    tableName: 'expenses_transactions',
    columns: [
      { name: 'total_amount', precision: 19, scale: 8 },
      { name: 'landed_cost_amount', precision: 19, scale: 8 },
      { name: 'allocated_cost_amount', precision: 19, scale: 8 },
    ],
  },
  {
    tableName: 'expense_transaction_categories',
    columns: [
      { name: 'amount', precision: 19, scale: 8 },
      { name: 'allocated_cost_amount', precision: 19, scale: 8 },
    ],
  },
  {
    tableName: 'bill_located_costs',
    columns: [{ name: 'amount', precision: 19, scale: 8, unsigned: true }],
  },
  {
    tableName: 'bill_located_cost_entries',
    columns: [{ name: 'cost', precision: 19, scale: 8, unsigned: true }],
  },
  {
    tableName: 'inventory_adjustments_entries',
    columns: [
      { name: 'cost', precision: 15, scale: 5, unsigned: true },
      { name: 'value', precision: 19, scale: 8, unsigned: true },
    ],
  },
  {
    tableName: 'payment_receives',
    columns: [{ name: 'amount', precision: 19, scale: 8 }],
  },
  {
    tableName: 'payment_receives_entries',
    columns: [
      { name: 'payment_amount', precision: 19, scale: 8, unsigned: true },
    ],
  },
  {
    tableName: 'bills_payments',
    columns: [{ name: 'amount', precision: 19, scale: 8 }],
  },
  {
    tableName: 'bills_payments_entries',
    columns: [
      { name: 'payment_amount', precision: 19, scale: 8, unsigned: true },
    ],
  },
  {
    tableName: 'credit_note_applied_invoice',
    columns: [{ name: 'amount', precision: 19, scale: 8 }],
  },
  {
    tableName: 'vendor_credit_applied_bill',
    columns: [{ name: 'amount', precision: 19, scale: 8 }],
  },
  {
    tableName: 'refund_credit_note_transactions',
    columns: [{ name: 'amount', precision: 19, scale: 8 }],
  },
  {
    tableName: 'refund_vendor_credit_transactions',
    columns: [{ name: 'amount', precision: 19, scale: 8 }],
  },
];

const originalColumns: ColumnPrecision[] = expandedColumns.map((table) => ({
  ...table,
  columns: table.columns.map((column) => ({
    ...column,
    precision:
      table.tableName === 'items' ||
      (table.tableName === 'inventory_adjustments_entries' &&
        column.name === 'cost') ||
      (table.tableName === 'inventory_transactions' &&
        column.name === 'rate') ||
      (table.tableName === 'inventory_cost_lot_tracker' &&
        column.name === 'rate')
        ? 13
        : table.tableName === 'sales_invoices' || table.tableName === 'bills'
          ? column.name === 'tax_amount_withheld'
            ? 13
            : 13
          : 13,
    scale:
      (table.tableName === 'sales_invoices' || table.tableName === 'bills') &&
      column.name === 'tax_amount_withheld'
        ? 2
        : 3,
  })),
}));

type ColumnMetadata = {
  IS_NULLABLE: 'YES' | 'NO';
  COLUMN_DEFAULT: string | number | null;
};

async function alterColumns(knex: Knex, tables: ColumnPrecision[]) {
  for (const table of tables) {
    for (const column of table.columns) {
      // Use raw identifiers here because the application-wide Objection
      // snake-case mapper would rewrite INFORMATION_SCHEMA column names.
      const [rows] = await knex.raw(
        'SELECT IS_NULLABLE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1',
        [table.tableName.toUpperCase(), column.name.toUpperCase()],
      );
      const metadata = rows[0] as ColumnMetadata | undefined;

      if (!metadata) {
        throw new Error(
          `Cannot change precision: ${table.tableName}.${column.name} does not exist.`,
        );
      }
      const nullability = metadata.IS_NULLABLE === 'NO' ? ' NOT NULL' : ' NULL';
      const unsigned = column.unsigned ? ' UNSIGNED' : '';
      const hasDefault =
        metadata.COLUMN_DEFAULT !== null &&
        String(metadata.COLUMN_DEFAULT).toUpperCase() !== 'NULL';
      const defaultClause = hasDefault ? ' DEFAULT ?' : '';
      const bindings = [
        table.tableName,
        column.name,
        ...(hasDefault ? [metadata.COLUMN_DEFAULT] : []),
      ];

      await knex.raw(
        `ALTER TABLE ?? MODIFY COLUMN ?? DECIMAL(${column.precision}, ${column.scale})${unsigned}${nullability}${defaultClause}`,
        bindings,
      );
    }
  }
}

export async function up(knex: Knex): Promise<void> {
  await alterColumns(knex, expandedColumns);
}

export async function down(knex: Knex): Promise<void> {
  await alterColumns(knex, [...originalColumns].reverse());
}
