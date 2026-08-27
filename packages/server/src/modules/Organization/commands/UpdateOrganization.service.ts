import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { UpdateOrganizationDto } from '../dtos/Organization.dto';
import { throwIfTenantNotExists } from '../Organization/_utils';
import { TenantRepository } from '@/modules/System/repositories/Tenant.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UpdateOrganizationService {
  constructor(
    private readonly tenancyContext: TenancyContext,
    private readonly tenantRepository: TenantRepository,
  ) {}

  /**
   * Updates organization information.
   * @param {UpdateOrganizationDto} organizationDTO
   */
  public async execute(organizationDTO: UpdateOrganizationDto): Promise<void> {
    const tenant = await this.tenancyContext.getTenant(true);

    // Throw error if the tenant not exists.
    throwIfTenantNotExists(tenant);

    // This internal deployment does not allow currency changes. Preserve the
    // stored value so a legacy organization cannot be silently relabeled USD.
    const baseCurrency = tenant.metadata?.baseCurrency || 'USD';

    await this.tenantRepository.saveMetadata(tenant.id, {
      ...organizationDTO,
      baseCurrency,
    });
  }
}
