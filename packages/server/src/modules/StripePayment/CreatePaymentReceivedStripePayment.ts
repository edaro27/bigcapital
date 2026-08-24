import { Knex } from 'knex';
import { GetSaleInvoice } from '../SaleInvoices/queries/GetSaleInvoice.service';
import { CreatePaymentReceivedService } from '../PaymentReceived/commands/CreatePaymentReceived.serivce';
import { UnitOfWork } from '../Tenancy/TenancyDB/UnitOfWork.service';
import { Injectable } from '@nestjs/common';
import { AccountRepository } from '../Accounts/repositories/Account.repository';
import { Inject } from '@nestjs/common';
import { PaymentReceived } from '../PaymentReceived/models/PaymentReceived';
import { TenantModelProxy } from '../System/models/TenantBaseModel';

@Injectable()
export class CreatePaymentReceiveStripePayment {
  constructor(
    private readonly getSaleInvoiceService: GetSaleInvoice,
    private readonly createPaymentReceivedService: CreatePaymentReceivedService,
    private readonly uow: UnitOfWork,
    private readonly accountRepository: AccountRepository,

    @Inject(PaymentReceived.name)
    private readonly paymentReceivedModel: TenantModelProxy<
      typeof PaymentReceived
    >,
  ) {}

  /**
   * Creates a payment received transaction associated to the given invoice.
   * @param {number} saleInvoiceId - Sale invoice id.
   * @param {number} paidAmount - Paid amount.
   */
  async createPaymentReceived(
    saleInvoiceId: number,
    paidAmount: number,
    currencyCode: string,
    stripeEventId: string,
    paymentDate: Date,
  ) {
    // Create a payment received transaction under UOW envirement.
    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      const existingPayment = await this.paymentReceivedModel()
        .query(trx)
        .findOne('stripeEventId', stripeEventId);
      if (existingPayment) return existingPayment;

      // Finds or creates a new stripe payment clearing account (current asset).
      const stripeClearingAccount =
        await this.accountRepository.findOrCreateStripeClearing({}, trx);

      // Retrieves the given invoice to create payment transaction associated to it.
      const invoice = await this.getSaleInvoiceService.getSaleInvoice(
        saleInvoiceId,
        trx,
      );

      if (invoice.currencyCode.toLowerCase() !== currencyCode.toLowerCase()) {
        throw new Error('Stripe payment currency does not match the invoice.');
      }

      const paymentReceivedDTO = {
        customerId: invoice.customerId,
        paymentDate,
        amount: paidAmount,
        exchangeRate: invoice.exchangeRate || 1,
        referenceNo: `stripe:${stripeEventId}`,
        statement: 'Stripe Checkout payment',
        stripeEventId,
        depositAccountId: stripeClearingAccount.id,
        branchId: invoice.branchId,
        entries: [{ invoiceId: saleInvoiceId, paymentAmount: paidAmount }],
      };
      // Create a payment received transaction associated to the given invoice.
      return this.createPaymentReceivedService.createPaymentReceived(
        paymentReceivedDTO,
        trx,
      );
    });
  }
}
