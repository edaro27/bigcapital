import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSaleInvoiceDto } from './SaleInvoice.dto';

const makeInvoice = (quantity: number) =>
  plainToInstance(CreateSaleInvoiceDto, {
    customerId: 1,
    invoiceDate: '2026-08-28',
    dueDate: '2026-09-27',
    entries: [{ index: 0, itemId: 1, rate: 0.25, quantity }],
  });

describe('sale invoice quantity validation', () => {
  it('accepts a whole-number quantity', async () => {
    await expect(validate(makeInvoice(500))).resolves.toHaveLength(0);
  });

  it('rejects a fractional quantity', async () => {
    const errors = await validate(makeInvoice(1.5));
    const entriesError = errors.find(({ property }) => property === 'entries');
    const quantityErrors = entriesError?.children?.[0]?.children ?? [];

    expect(quantityErrors.map(({ property }) => property)).toContain(
      'quantity',
    );
  });
});
