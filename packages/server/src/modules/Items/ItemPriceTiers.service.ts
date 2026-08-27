import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { TenantModelProxy } from '../System/models/TenantBaseModel';
import { ItemPriceTierDto } from './dtos/Item.dto';
import { ItemPriceTier } from './models/ItemPriceTier';

@Injectable()
export class ItemPriceTiersService {
  constructor(
    @Inject(ItemPriceTier.name)
    private readonly itemPriceTierModel: TenantModelProxy<typeof ItemPriceTier>,
  ) {}

  /**
   * Replaces all quantity price tiers for an item in the current transaction.
   */
  public async replacePriceTiers(
    itemId: number,
    priceTiers: ItemPriceTierDto[] = [],
    trx?: Knex.Transaction,
  ): Promise<void> {
    await this.itemPriceTierModel().query(trx).where({ itemId }).delete();

    if (!priceTiers.length) {
      return;
    }
    const normalizedPriceTiers = [...priceTiers]
      .sort((a, b) => Number(a.minimumQuantity) - Number(b.minimumQuantity))
      .map((priceTier) => ({
        itemId,
        minimumQuantity: Number(priceTier.minimumQuantity),
        price: Number(priceTier.price),
      }));

    for (const priceTier of normalizedPriceTiers) {
      await this.itemPriceTierModel().query(trx).insert(priceTier);
    }
  }
}
