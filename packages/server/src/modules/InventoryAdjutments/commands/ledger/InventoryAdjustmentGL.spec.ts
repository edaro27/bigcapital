import { InventoryAdjustmentsGL } from './InventoryAdjustmentGL';
import { InventoryAdjustment } from '../../models/InventoryAdjustment';

const makeAdjustment = (type: 'increment' | 'decrement') =>
  Object.assign(new InventoryAdjustment(), {
    id: 1,
    type,
    adjustmentAccountId: 500,
    entries: [
      {
        quantity: 3,
        cost: 4,
        item: { inventoryAccountId: 300 },
      },
    ],
  });

describe('InventoryAdjustmentsGL', () => {
  it('debits inventory for an increment', () => {
    const entries = new InventoryAdjustmentsGL(makeAdjustment('increment'))
      .setBaseCurrency('USD')
      .getAdjustmentGL()
      .getEntries();

    expect(entries.find((entry) => entry.accountId === 300)?.debit).toBe(12);
    expect(entries.find((entry) => entry.accountId === 500)?.credit).toBe(12);
  });

  it('credits inventory for a decrement', () => {
    const entries = new InventoryAdjustmentsGL(makeAdjustment('decrement'))
      .setBaseCurrency('USD')
      .getAdjustmentGL()
      .getEntries();

    expect(entries.find((entry) => entry.accountId === 300)?.credit).toBe(12);
    expect(entries.find((entry) => entry.accountId === 500)?.debit).toBe(12);
  });
});
