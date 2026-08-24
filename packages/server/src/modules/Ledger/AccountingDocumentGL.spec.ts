import { DiscountType } from '@/common/types/Discount';
import { CreditNoteGL } from '@/modules/CreditNotes/commands/CreditNoteGL';
import { CreditNote } from '@/modules/CreditNotes/models/CreditNote';
import { SaleReceiptGL } from '@/modules/SaleReceipts/ledger/SaleReceiptGL';
import { SaleReceipt } from '@/modules/SaleReceipts/models/SaleReceipt';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';
import { VendorCreditGL } from '@/modules/VendorCredit/commands/VendorCreditGL';
import { VendorCredit } from '@/modules/VendorCredit/models/VendorCredit';

const makeTaxedEntry = () =>
  Object.assign(new ItemEntry(), {
    itemId: 1,
    quantity: 1,
    rate: 100,
    discount: 0,
    discountType: DiscountType.Percentage,
    taxRate: 10,
    taxRateId: 5,
    isInclusiveTax: 0,
    sellAccountId: 401,
    costAccountId: 501,
    item: {
      type: 'service',
      sellAccountId: 401,
      costAccountId: 501,
      inventoryAccountId: 301,
    },
  });

const expectBalanced = (entries) => {
  const debit = entries.reduce((total, entry) => total + (entry.debit || 0), 0);
  const credit = entries.reduce(
    (total, entry) => total + (entry.credit || 0),
    0,
  );
  expect(debit).toBeCloseTo(credit, 8);
};

describe('taxed receipt and credit ledgers', () => {
  it('posts receipt tax to the liability account in base currency', () => {
    const receipt = Object.assign(new SaleReceipt(), {
      id: 11,
      amount: 100,
      taxAmountWithheld: 10,
      isInclusiveTax: false,
      discount: 0,
      discountType: DiscountType.Percentage,
      adjustment: 0,
      exchangeRate: 1.25,
      currencyCode: 'CAD',
      depositAccountId: 101,
      entries: [makeTaxedEntry()],
    });
    const entries = new SaleReceiptGL(receipt)
      .setDiscountAccountId(601)
      .setOtherChargesAccountId(602)
      .setTaxPayableAccountId(201)
      .getIncomeLedger()
      .getEntries();

    expectBalanced(entries);
    expect(entries.find((entry) => entry.accountId === 201)?.credit).toBe(12.5);
  });

  it('reverses sales tax when issuing a customer credit note', () => {
    const credit = Object.assign(new CreditNote(), {
      id: 12,
      amount: 100,
      taxAmountWithheld: 10,
      isInclusiveTax: false,
      discount: 0,
      discountType: DiscountType.Percentage,
      adjustment: 0,
      exchangeRate: 1.25,
      currencyCode: 'CAD',
      entries: [makeTaxedEntry()],
    });
    const entries = new CreditNoteGL(credit)
      .setARAccountId(102)
      .setDiscountAccountId(601)
      .setAdjustmentAccountId(602)
      .setTaxPayableAccountId(201)
      .getCreditNoteLedger()
      .getEntries();

    expectBalanced(entries);
    expect(entries.find((entry) => entry.accountId === 201)?.debit).toBe(12.5);
  });

  it('reverses input tax when issuing a vendor credit', () => {
    const credit = Object.assign(new VendorCredit(), {
      id: 13,
      amount: 100,
      taxAmountWithheld: 10,
      isInclusiveTax: false,
      discount: 0,
      discountType: DiscountType.Percentage,
      adjustment: 0,
      exchangeRate: 1.25,
      currencyCode: 'CAD',
      entries: [makeTaxedEntry()],
    });
    const entries = new VendorCreditGL(credit)
      .setAPAccountId(202)
      .setPurchaseDiscountAccountId(603)
      .setOtherExpensesAccountId(604)
      .setTaxPayableAccountId(201)
      .getVendorCreditLedger()
      .getEntries();

    expectBalanced(entries);
    expect(entries.find((entry) => entry.accountId === 201)?.credit).toBe(12.5);
  });
});
