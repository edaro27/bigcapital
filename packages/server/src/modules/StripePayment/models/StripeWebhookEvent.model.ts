import { SystemModel } from '@/modules/System/models/SystemModel';

export class StripeWebhookEvent extends SystemModel {
  eventId!: string;
  eventType!: string;
  status!: 'processing' | 'processed' | 'failed' | 'requires_review';
  processingToken!: string;
  tenantId?: number;
  externalObjectId?: string;
  connectedAccountId?: string;
  amount?: number;
  currencyCode?: string;
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;

  static get tableName() {
    return 'stripe_webhook_events';
  }

  static get timestamps() {
    return ['createdAt', 'updatedAt'];
  }
}
