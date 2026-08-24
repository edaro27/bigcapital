import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
import { CreatePaymentReceiveStripePayment } from '../CreatePaymentReceivedStripePayment';
import {
  StripeCheckoutSessionCompletedEventPayload,
  StripeWebhookEventPayload,
} from '../StripePayment.types';
import { events } from '@/common/events/events';
import { PaymentIntegration } from '../models/PaymentIntegration.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { TenantModel } from '@/modules/System/models/TenantModel';
import { SystemUser } from '@/modules/System/models/SystemUser';
import { fromCurrencyMinorUnits } from '@/utils/money';

@Injectable()
export class StripeWebhooksSubscriber {
  constructor(
    private readonly createPaymentReceiveStripePayment: CreatePaymentReceiveStripePayment,
    private readonly clsService: ClsService,

    @Inject(SystemUser.name)
    private readonly systemUserModel: typeof SystemUser,

    @Inject(PaymentIntegration.name)
    private readonly paymentIntegrationModel: TenantModelProxy<
      typeof PaymentIntegration
    >,

    @Inject(TenantModel.name)
    private readonly tenantModel: typeof TenantModel,
  ) {}

  /**
   * Handles the checkout session completed webhook event.
   * @param {StripeCheckoutSessionCompletedEventPayload} payload -
   */
  @OnEvent(events.stripeWebhooks.onCheckoutSessionCompleted)
  async handleCheckoutSessionCompleted({
    event,
  }: StripeCheckoutSessionCompletedEventPayload) {
    const session = event.data.object;
    const { metadata } = session;

    if (
      session.payment_status !== 'paid' ||
      !metadata?.tenantId ||
      !metadata?.saleInvoiceId ||
      session.amount_total == null ||
      !session.currency
    ) {
      return;
    }
    const tenantId = parseInt(metadata.tenantId, 10);
    const saleInvoiceId = parseInt(metadata.saleInvoiceId, 10);

    const tenant = await this.tenantModel
      .query()
      .findOne({ id: tenantId })
      .throwIfNotFound();

    const user = await this.systemUserModel
      .query()
      .findOne({
        tenantId: tenant.id,
      })
      .modify('active')
      .throwIfNotFound();

    this.clsService.set('organizationId', tenant.organizationId);
    this.clsService.set('userId', user.id);

    // Get the amount from the event
    const amount = fromCurrencyMinorUnits(
      session.amount_total,
      session.currency,
    );

    // Creates a new payment received transaction.
    await this.createPaymentReceiveStripePayment.createPaymentReceived(
      saleInvoiceId,
      amount,
      session.currency,
      event.id,
      new Date(event.created * 1000),
    );
  }

  /**
   * Handles the account updated.
   * @param {StripeWebhookEventPayload}
   */
  @OnEvent(events.stripeWebhooks.onAccountUpdated)
  async handleAccountUpdated({ event }: StripeWebhookEventPayload) {
    const { metadata } = event.data.object;
    const account = event.data.object;

    if (!metadata?.paymentIntegrationId || !metadata.tenantId) return;
    const tenantId = parseInt(metadata.tenantId, 10);

    // Find the tenant or throw not found error.
    await this.tenantModel.query().findById(tenantId).throwIfNotFound();

    // Check if the account capabilities are active
    if (account.capabilities.card_payments === 'active') {
      // Marks the payment method integration as active.
      await this.paymentIntegrationModel()
        .query()
        .findById(metadata?.paymentIntegrationId)
        .patch({
          active: true,
        });
    }
  }
}
