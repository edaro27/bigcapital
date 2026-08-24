import {
  Controller,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { StripePaymentService } from './StripePaymentService';
import { events } from '@/common/events/events';
import {
  StripeCheckoutSessionCompletedEventPayload,
  StripeWebhookEventPayload,
} from './StripePayment.types';
import { PublicRoute } from '../Auth/guards/jwt.guard';
import { StripeWebhookEvent } from './models/StripeWebhookEvent.model';
import { randomUUID } from 'crypto';

@Controller('/webhooks/stripe')
@ApiTags('stripe')
@PublicRoute()
export class StripePaymentWebhooksController {
  constructor(
    private readonly stripePaymentService: StripePaymentService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,

    @Inject(StripeWebhookEvent.name)
    private readonly stripeWebhookEventModel: typeof StripeWebhookEvent,
  ) {}

  /**
   * Handles incoming Stripe webhook events.
   * Verifies the webhook signature, processes the event based on its type,
   * and triggers appropriate actions or events in the system.
   * @param {Request} req - The Express request object containing the webhook payload.
   * @param {Response} res - The Express response object.
   * @returns {Promise<Response>}
   */
  @Post('/')
  @HttpCode(200)
  @ApiOperation({ summary: 'Listen to Stripe webhooks' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      const rawBody = req.rawBody || req.body;
      const webhooksSecret = this.configService.get(
        'stripePayment.webhooksSecret',
      );
      if (!webhooksSecret) {
        throw new HttpException(
          'Stripe webhook secret is not configured',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (!signature) {
        throw new HttpException(
          'Stripe signature header is missing',
          HttpStatus.BAD_REQUEST,
        );
      }
      let event;

      // Verify webhook signature and extract the event.
      // See https://stripe.com/docs/webhooks#verify-events for more information.
      try {
        event = this.stripePaymentService.stripe.webhooks.constructEvent(
          rawBody,
          signature,
          webhooksSecret,
        );
      } catch (err) {
        throw new HttpException(
          `Webhook Error: ${err.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      const existingEvent = await this.stripeWebhookEventModel
        .query()
        .findOne('eventId', event.id);
      const processingToken = randomUUID();
      if (
        existingEvent?.status === 'processed' ||
        existingEvent?.status === 'requires_review'
      ) {
        return { received: true, duplicate: true };
      }
      if (existingEvent?.status === 'processing') {
        const processingStartedAt = new Date(
          existingEvent.updatedAt || existingEvent.createdAt,
        ).getTime();
        const processingLeaseMs = 5 * 60 * 1000;

        if (Date.now() - processingStartedAt < processingLeaseMs) {
          return { received: true, duplicate: true, processing: true };
        }
      }
      if (existingEvent) {
        const claimQuery = this.stripeWebhookEventModel
          .query()
          .findById(existingEvent.id);
        if (existingEvent.processingToken) {
          claimQuery.where('processingToken', existingEvent.processingToken);
        } else {
          claimQuery.whereNull('processingToken');
        }
        const claimed = await claimQuery.patch({
          status: 'processing',
          error: null,
          processingToken,
        });
        if (!claimed) {
          return { received: true, duplicate: true, processing: true };
        }
      } else {
        try {
          await this.stripeWebhookEventModel.query().insert({
            eventId: event.id,
            eventType: event.type,
            status: 'processing',
            processingToken,
            tenantId: Number(event.data.object?.metadata?.tenantId) || null,
            externalObjectId: event.data.object?.id || null,
            connectedAccountId: event.account || null,
            amount:
              event.data.object?.amount_refunded ??
              event.data.object?.amount ??
              event.data.object?.amount_total ??
              null,
            currencyCode: event.data.object?.currency || null,
          });
        } catch (error) {
          // Another webhook worker may have inserted this delivery first. The
          // tenant-level Stripe event key still prevents duplicate payments.
          const concurrentEvent = await this.stripeWebhookEventModel
            .query()
            .findOne('eventId', event.id);
          if (concurrentEvent) {
            return {
              received: true,
              duplicate: true,
              processing: concurrentEvent.status === 'processing',
            };
          }
          throw error;
        }
      }
      // Handle the event based on its type
      try {
        switch (event.type) {
          case 'checkout.session.completed':
          case 'checkout.session.async_payment_succeeded':
            // Triggers `onStripeCheckoutSessionCompleted` event.
            await this.eventEmitter.emitAsync(
              events.stripeWebhooks.onCheckoutSessionCompleted,
              {
                event,
              } as StripeCheckoutSessionCompletedEventPayload,
            );
            break;
          case 'account.updated':
            // Triggers `onStripeAccountUpdated` event.
            await this.eventEmitter.emitAsync(
              events.stripeWebhooks.onAccountUpdated,
              {
                event,
              } as StripeWebhookEventPayload,
            );
            break;

          case 'checkout.session.async_payment_failed':
          case 'checkout.session.expired':
            // No accounting entry was created, so these are terminal no-ops.
            break;

          default:
            console.log(`Unhandled event type ${event.type}`);
        }
        const requiresAccountingReview = [
          'charge.refunded',
          'charge.dispute.created',
          'charge.dispute.closed',
          'payout.paid',
          'payout.failed',
          'balance.available',
          'application_fee.created',
        ].includes(event.type);
        await this.stripeWebhookEventModel
          .query()
          .findOne('eventId', event.id)
          .where('processingToken', processingToken)
          .patch({
            status: requiresAccountingReview ? 'requires_review' : 'processed',
            error: requiresAccountingReview
              ? 'Stripe settlement event requires reconciliation.'
              : null,
          });
      } catch (error) {
        await this.stripeWebhookEventModel
          .query()
          .findOne('eventId', event.id)
          .where('processingToken', processingToken)
          .patch({
            status: 'failed',
            error: String(error?.message || error).slice(0, 2000),
          });
        throw error;
      }
      return { received: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
