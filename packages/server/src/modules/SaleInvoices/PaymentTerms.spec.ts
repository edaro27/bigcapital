import {
  calculateInvoiceDueDate,
  formatInvoicePaymentTerm,
  InvoicePaymentTerm,
} from '@bigcapital/utils';

describe('invoice payment terms', () => {
  it('sets Net 30 to thirty calendar days after the invoice date', () => {
    expect(
      calculateInvoiceDueDate('2026-01-31', InvoicePaymentTerm.Net30),
    ).toBe('2026-03-02');
  });

  it.each([
    InvoicePaymentTerm.Discover,
    InvoicePaymentTerm.Amex,
    InvoicePaymentTerm.Visa,
    InvoicePaymentTerm.Mastercard,
  ])('sets %s card payments due on the invoice date', (paymentTerm) => {
    expect(calculateInvoiceDueDate('2026-08-28', paymentTerm)).toBe(
      '2026-08-28',
    );
  });

  it('formats stored values for invoices and exports', () => {
    expect(formatInvoicePaymentTerm(InvoicePaymentTerm.Net30)).toBe('Net 30');
    expect(formatInvoicePaymentTerm(InvoicePaymentTerm.Amex)).toBe('Amex');
  });
});
