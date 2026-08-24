import { DiscountType } from '@/common/types/Discount';
import { ItemEntry } from './ItemEntry';

describe('ItemEntry accounting amounts', () => {
  it('applies a fixed line discount before exclusive tax', () => {
    const entry = Object.assign(new ItemEntry(), {
      quantity: 2,
      rate: 10,
      discountType: DiscountType.Amount,
      discount: 2,
      taxRate: 10,
      isInclusiveTax: 0,
    });

    expect(entry.amountAfterDiscount).toBe(18);
    expect(entry.taxAmount).toBeCloseTo(1.8);
    expect(entry.totalExcludingTax).toBe(18);
    expect(entry.total).toBeCloseTo(19.8);
  });

  it('extracts tax from a tax-inclusive discounted line', () => {
    const entry = Object.assign(new ItemEntry(), {
      quantity: 1,
      rate: 11,
      discountType: DiscountType.Percentage,
      discount: 0,
      taxRate: 10,
      isInclusiveTax: 1,
    });

    expect(entry.taxAmount).toBeCloseTo(1);
    expect(entry.totalExcludingTax).toBeCloseTo(10);
    expect(entry.total).toBeCloseTo(11);
  });

  it('does not treat a fixed discount as a percentage', () => {
    expect(
      ItemEntry.calcAmount({
        quantity: 4,
        rate: 25,
        discountType: DiscountType.Amount,
        discount: 15,
      }),
    ).toBe(85);
  });
});
