import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CommandItemDto } from './Item.dto';

const makeItem = (prices: { costPrice: number; sellPrice: number }) =>
  plainToInstance(CommandItemDto, {
    name: 'Precision item',
    type: 'service',
    purchasable: true,
    sellable: true,
    costAccountId: 1001,
    sellAccountId: 1002,
    ...prices,
  });

describe('CommandItemDto price precision', () => {
  it('accepts four-decimal cost and selling prices', async () => {
    const errors = await validate(
      makeItem({ costPrice: 7.4321, sellPrice: 19.8765 }),
    );

    expect(errors).toHaveLength(0);
  });

  it('rejects cost and selling prices beyond four decimals', async () => {
    const errors = await validate(
      makeItem({ costPrice: 7.43219, sellPrice: 19.87659 }),
    );

    expect(errors.map(({ property }) => property).sort()).toEqual([
      'costPrice',
      'sellPrice',
    ]);
  });
});
