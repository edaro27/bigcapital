import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { SalesChannel } from './models/SalesChannel.model';
import {
  CreateSalesChannelDto,
  EditSalesChannelDto,
} from './dtos/SalesChannel.dto';

@Injectable()
export class SalesChannelsService {
  constructor(
    @Inject(SalesChannel.name)
    private readonly salesChannelModel: TenantModelProxy<typeof SalesChannel>,
  ) {}

  public list(includeInactive = false) {
    return this.salesChannelModel()
      .query()
      .onBuild((query) => {
        if (!includeInactive) query.where('active', true);
      })
      .orderBy('sortOrder', 'asc')
      .orderBy('name', 'asc');
  }

  public async create(dto: CreateSalesChannelDto) {
    const name = dto.name.trim();
    await this.ensureNameUnique(name);

    const maxSort = await this.salesChannelModel()
      .query()
      .max('sortOrder as maxSort')
      .first();
    const nextSortOrder = Number((maxSort as any)?.maxSort ?? -1) + 1;

    return this.salesChannelModel()
      .query()
      .insertAndFetch({
        name,
        active: true,
        sortOrder: dto.sortOrder ?? nextSortOrder,
      });
  }

  public async edit(id: number, dto: EditSalesChannelDto) {
    const existing = await this.findById(id);
    const name = dto.name?.trim();

    if (
      name &&
      name.toLocaleLowerCase() !== existing.name.toLocaleLowerCase()
    ) {
      await this.ensureNameUnique(name, id);
    }
    return this.salesChannelModel()
      .query()
      .patchAndFetchById(id, {
        ...(name ? { name } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      });
  }

  public async setActive(id: number, active: boolean) {
    await this.findById(id);
    return this.salesChannelModel().query().patchAndFetchById(id, { active });
  }

  public async findById(id: number) {
    const channel = await this.salesChannelModel().query().findById(id);
    if (!channel) throw new NotFoundException('Sales channel not found.');
    return channel;
  }

  private async ensureNameUnique(name: string, excludeId?: number) {
    if (!name) throw new BadRequestException('Sales channel name is required.');

    const duplicate = await this.salesChannelModel()
      .query()
      .whereRaw('LOWER(??) = LOWER(?)', ['name', name])
      .onBuild((query) => {
        if (excludeId) query.whereNot('id', excludeId);
      })
      .first();

    if (duplicate) {
      throw new ConflictException(
        'A sales channel with this name already exists.',
      );
    }
  }
}

@Injectable()
export class SalesChannelValidator {
  constructor(private readonly salesChannels: SalesChannelsService) {}

  public async validateSelectable(
    salesChannelId?: number | null,
    currentSalesChannelId?: number | null,
  ) {
    if (!salesChannelId) return;

    const channel = await this.salesChannels.findById(salesChannelId);
    if (!channel.active && channel.id !== currentSalesChannelId) {
      throw new BadRequestException(
        'Inactive sales channels cannot be assigned to new invoices.',
      );
    }
  }
}
