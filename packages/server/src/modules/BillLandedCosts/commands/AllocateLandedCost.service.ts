import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import {
  IAllocatedLandedCostCreatedPayload,
  ILandedCostDTO,
} from '../types/BillLandedCosts.types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { Bill } from '@/modules/Bills/models/Bill';
import { BillLandedCost } from '../models/BillLandedCost';
import { BaseLandedCostService } from '../BaseLandedCost.service';
import { events } from '@/common/events/events';
import { AllocateBillLandedCostDto } from '../dtos/AllocateBillLandedCost.dto';

@Injectable()
export class AllocateLandedCostService extends BaseLandedCostService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly eventPublisher: EventEmitter2,

    @Inject(Bill.name)
    private readonly billModel: TenantModelProxy<typeof Bill>,

    @Inject(BillLandedCost.name)
    protected readonly billLandedCostModel: TenantModelProxy<
      typeof BillLandedCost
    >,
  ) {
    super();
  }

  /**
   * =================================
   * - Allocate landed cost.
   * =================================
   * - Validates the allocate cost not the same purchase invoice id.
   * - Get the given bill (purchase invoice) or throw not found error.
   * - Get the given landed cost transaction or throw not found error.
   * - Validate landed cost transaction has enough unallocated cost amount.
   * - Validate landed cost transaction entry has enough unallocated cost amount.
   * - Validate allocate entries existance and associated with cost bill transaction.
   * - Writes inventory landed cost transaction.
   * - Increment the allocated landed cost transaction.
   * - Increment the allocated landed cost transaction entry.
   * --------------------------------
   * @param {ILandedCostDTO} landedCostDTO - Landed cost DTO.
   * @param {number} tenantId - Tenant id.
   * @param {number} billId - Purchase invoice id.
   */
  public async allocateLandedCost(
    allocateCostDTO: AllocateBillLandedCostDto,
    billId: number,
  ): Promise<BillLandedCost> {
    // Saves landed cost transactions with associated tranasctions under
    // unit-of-work eniverment.
    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      const amount = this.getAllocateItemsCostTotal(allocateCostDTO);
      const bill = await this.billModel()
        .query(trx)
        .findById(billId)
        .forUpdate()
        .withGraphFetched('entries')
        .throwIfNotFound();
      const costTransaction = await this.getLandedCostOrThrowError(
        allocateCostDTO.transactionType,
        allocateCostDTO.transactionId,
        trx,
      );
      const costTransactionEntry = await this.getLandedCostEntry(
        allocateCostDTO.transactionType,
        allocateCostDTO.transactionId,
        allocateCostDTO.transactionEntryId,
        trx,
      );

      this.validateAllocateCostItems(bill.entries, allocateCostDTO.items);
      this.validateLandedCostEntryAmount(
        costTransactionEntry.unallocatedCostAmount,
        amount,
      );
      const billLandedCostObj = this.transformToBillLandedCost(
        allocateCostDTO,
        bill,
        costTransaction,
        costTransactionEntry,
      );

      // Save the bill landed cost model.
      const billLandedCost = await this.billLandedCostModel()
        .query(trx)
        .insertGraph(billLandedCostObj);
      // Triggers `onBillLandedCostCreated` event.
      await this.eventPublisher.emitAsync(events.billLandedCost.onCreated, {
        bill,
        billLandedCostId: billLandedCost.id,
        billLandedCost,
        costTransaction,
        costTransactionEntry,
        trx,
      } as IAllocatedLandedCostCreatedPayload);

      return billLandedCost;
    });
  }
}
