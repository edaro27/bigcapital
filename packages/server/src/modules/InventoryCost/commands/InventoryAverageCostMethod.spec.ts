import { InventoryAverageCostMethod } from './InventoryAverageCostMethod';

describe('InventoryAverageCostMethod precision', () => {
  it('retains four-decimal unit cost through inventory valuation', () => {
    const transactions = new InventoryAverageCostMethod().trackingCostTransactions(
      [
        {
          id: 1,
          direction: 'IN',
          quantity: 1000,
          rate: 0.1765,
        },
        {
          id: 2,
          direction: 'OUT',
          quantity: 250,
          rate: 1,
        },
      ] as any,
    );

    expect(transactions[0].cost).toBeCloseTo(176.5, 8);
    expect(transactions[1].cost).toBeCloseTo(44.125, 8);
  });
});
