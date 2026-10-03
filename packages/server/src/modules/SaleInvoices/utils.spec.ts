// @ts-nocheck
import { transformInvoiceToPdfTemplate } from './utils';
import { GetInvoicePaymentMailAttributesTransformer } from './queries/GetInvoicePaymentMailAttributes.transformer';

describe('invoice internal fields', () => {
  it('does not expose the sales channel to the invoice PDF template', () => {
    const output = transformInvoiceToPdfTemplate({
      salesChannelId: 1,
      salesChannel: { id: 1, name: 'Phone' },
      dueDateFormatted: '2026-08-31',
      paymentTerm: 'net_30',
      invoiceDateFormatted: '2026-08-27',
      invoiceNo: 'INV-1',
      referenceNo: 'PO-1001',
      totalFormatted: '$100.00',
      subtotalFormatted: '$100.00',
      paymentAmountFormatted: '$0.00',
      dueAmountFormatted: '$100.00',
      termsConditions: '',
      invoiceMessage: '',
      discountAmountFormatted: '$0.00',
      discountPercentageFormatted: '',
      entries: [],
      taxes: [],
      customer: {},
    });

    expect(output).not.toHaveProperty('salesChannel');
    expect(output).not.toHaveProperty('salesChannelId');
    expect(JSON.stringify(output)).not.toContain('Phone');
    expect(output).toHaveProperty('paymentTerm', 'Net 30');
    expect(output).toHaveProperty('purchaseOrderNumber', 'PO-1001');
  });

  it('does not include the sales channel in invoice email attributes', () => {
    const transformer = new GetInvoicePaymentMailAttributesTransformer();

    expect(transformer.includeAttributes()).not.toContain('salesChannel');
    expect(transformer.includeAttributes()).not.toContain('salesChannelId');
    expect(transformer.excludeAttributes()).toContain('*');
  });
});
