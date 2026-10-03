import { BillDTOTransformer } from './BillDTOTransformer.service';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';

describe('BillDTOTransformer landed costs', () => {
  it('stores the total of entries marked as landed cost', () => {
    const transformer = new BillDTOTransformer(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      (() => ItemEntry) as any,
      {} as any,
    );
    const billDTO = {
      entries: [
        { quantity: 2, rate: 1.2345, discount: 0, landedCost: true },
        { quantity: 1, rate: 10, discount: 0, landedCost: false },
      ],
    };

    expect((transformer as any).getBillLandedCostAmount(billDTO)).toBeCloseTo(
      2.469,
      8,
    );
  });
});
