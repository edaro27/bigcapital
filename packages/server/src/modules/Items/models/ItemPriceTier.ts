import { TenantBaseModel } from '@/modules/System/models/TenantBaseModel';

export class ItemPriceTier extends TenantBaseModel {
  public readonly itemId: number;
  public readonly minimumQuantity: number;
  public readonly price: number;

  static get tableName() {
    return 'item_price_tiers';
  }

  get timestamps() {
    return ['createdAt', 'updatedAt'];
  }
}
