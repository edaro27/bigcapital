export const InvoicePaymentTerm = {
  Net30: "net_30",
  Discover: "discover",
  Amex: "amex",
  Visa: "visa",
  Mastercard: "mastercard",
} as const;

export type InvoicePaymentTerm =
  (typeof InvoicePaymentTerm)[keyof typeof InvoicePaymentTerm];

export const InvoicePaymentTermLabels: Record<InvoicePaymentTerm, string> = {
  [InvoicePaymentTerm.Net30]: "Net 30",
  [InvoicePaymentTerm.Discover]: "Discover",
  [InvoicePaymentTerm.Amex]: "Amex",
  [InvoicePaymentTerm.Visa]: "Visa",
  [InvoicePaymentTerm.Mastercard]: "Mastercard",
};

export const InvoicePaymentTermOptions = Object.values(InvoicePaymentTerm).map(
  (value) => ({ value, label: InvoicePaymentTermLabels[value] }),
);

/**
 * Calculates the invoice due date without applying a local timezone offset.
 * Net 30 is thirty calendar days after the invoice date; card payments are due
 * on the invoice date.
 */
export function calculateInvoiceDueDate(
  invoiceDate: string | Date,
  paymentTerm: InvoicePaymentTerm,
): string {
  const datePart =
    invoiceDate instanceof Date
      ? [
          invoiceDate.getUTCFullYear(),
          String(invoiceDate.getUTCMonth() + 1).padStart(2, "0"),
          String(invoiceDate.getUTCDate()).padStart(2, "0"),
        ].join("-")
      : String(invoiceDate).slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);

  if (!match) {
    throw new Error(`Invalid invoice date: ${invoiceDate}`);
  }
  const [, year, month, day] = match;
  const dueDate = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );

  if (
    Number.isNaN(dueDate.getTime()) ||
    dueDate.getUTCFullYear() !== Number(year) ||
    dueDate.getUTCMonth() !== Number(month) - 1 ||
    dueDate.getUTCDate() !== Number(day)
  ) {
    throw new Error(`Invalid invoice date: ${invoiceDate}`);
  }
  if (paymentTerm === InvoicePaymentTerm.Net30) {
    dueDate.setUTCDate(dueDate.getUTCDate() + 30);
  }
  return dueDate.toISOString().slice(0, 10);
}

export function formatInvoicePaymentTerm(
  paymentTerm?: InvoicePaymentTerm | null,
): string {
  return paymentTerm
    ? (InvoicePaymentTermLabels[paymentTerm] ?? paymentTerm)
    : "";
}
