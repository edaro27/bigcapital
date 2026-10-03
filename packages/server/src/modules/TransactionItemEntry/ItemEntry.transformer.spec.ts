import { ItemEntryTransformer } from './ItemEntry.transformer';

describe('ItemEntryTransformer quantity formatting', () => {
  it('supports whole-number invoice quantity formatting', () => {
    const transformer = new ItemEntryTransformer();
    transformer.context = { currencyCode: 'USD' } as typeof transformer.context;
    transformer.options = { quantityPrecision: 0 };

    const output = transformer.work({ quantity: 500 });

    expect(output.quantityFormatted).toBe('500');
  });
});
