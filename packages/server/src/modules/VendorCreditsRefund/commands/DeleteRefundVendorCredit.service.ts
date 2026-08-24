import { Knex } from 'knex';
import { Inject, Injectable } from '@nestjs/common';
import {
  IRefundVendorCreditDeletedPayload,
  IRefundVendorCreditDeletePayload,
  IRefundVendorCreditDeletingPayload,
} from '../types/VendorCreditRefund.types';
import { RefundVendorCredit } from '../models/RefundVendorCredit';
// import { RefundVendorCreditService } from './RefundVendorCredit.service';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { events } from '@/common/events/events';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';

@Injectable()
export class DeleteRefundVendorCreditService {
  /**
   * @param {UnitOfWork} uow - Unit of work service.
   * @param {EventEmitter2} eventPublisher - Event emitter service.
   * @param {typeof RefundVendorCredit} refundVendorCreditModel - Refund vendor credit model.
   */
  constructor(
    private readonly uow: UnitOfWork,
    private readonly eventPublisher: EventEmitter2,

    @Inject(RefundVendorCredit.name)
    private readonly refundVendorCreditModel: TenantModelProxy<
      typeof RefundVendorCredit
    >,
  ) {}

  /**
   * Deletes the refund vendor credit.
   * @param {number} refundCreditId - Refund credit id.
   * @returns {Promise<void>}
   */
  public async deleteRefundVendorCreditRefund(
    refundCreditId: number,
  ): Promise<void> {
    // Deletes the refund vendor credit under unit-of-work environment.
    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      const oldRefundCredit = await this.refundVendorCreditModel()
        .query(trx)
        .findById(refundCreditId)
        .forUpdate()
        .throwIfNotFound();

      await this.eventPublisher.emitAsync(events.vendorCredit.onRefundDelete, {
        refundCreditId,
        oldRefundCredit,
        trx,
      } as IRefundVendorCreditDeletePayload);

      const eventPayload = {
        trx,
        refundCreditId,
        oldRefundCredit,
      } as IRefundVendorCreditDeletingPayload;

      // Triggers `onVendorCreditRefundDeleting` event.
      await this.eventPublisher.emitAsync(
        events.vendorCredit.onRefundDeleting,
        eventPayload,
      );
      // Deletes the refund vendor credit graph from the storage.
      await this.refundVendorCreditModel()
        .query(trx)
        .findById(refundCreditId)
        .delete();

      // Triggers `onVendorCreditRefundDeleted` event.
      await this.eventPublisher.emitAsync(
        events.vendorCredit.onRefundDeleted,
        eventPayload as IRefundVendorCreditDeletedPayload,
      );
    });
  }
}
