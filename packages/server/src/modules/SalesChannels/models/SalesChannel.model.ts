import { TenantBaseModel } from '@/modules/System/models/TenantBaseModel';
import { InjectModelMeta } from '@/modules/Tenancy/TenancyModels/decorators/InjectModelMeta.decorator';
import { SalesChannelMeta } from './SalesChannel.meta';

@InjectModelMeta(SalesChannelMeta)
export class SalesChannel extends TenantBaseModel {
  public name: string;
  public active: boolean;
  public sortOrder: number;
  public createdAt?: Date;
  public updatedAt?: Date;

  static get tableName() {
    return 'sales_channels';
  }

  get timestamps() {
    return ['createdAt', 'updatedAt'];
  }
}
