import { Ledger } from './Ledger';
import { LedgerStorageService } from './LedgerStorage.service';

const makeService = () => {
  const accounts = [
    {
      id: 1,
      accountType: 'accounts-receivable',
      accountNormal: 'debit',
    },
    { id: 2, accountType: 'income', accountNormal: 'credit' },
  ];
  const accountModel = () => ({
    query: () => ({
      whereIn: async () => accounts,
    }),
  });

  return new LedgerStorageService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    { getTenantMetadata: async () => ({ baseCurrency: 'USD' }) } as any,
    {} as any,
    accountModel as any,
  );
};

describe('LedgerStorageService invariants', () => {
  it('allocates only a rounding residual and preserves the control total', async () => {
    const service = makeService();
    const ledger = new Ledger([
      {
        accountId: 1,
        debit: 0.999,
        credit: 0,
        contactId: 10,
        index: 1,
        exchangeRate: 1,
      },
      ...[0, 1, 2].map((index) => ({
        accountId: 2,
        debit: 0,
        credit: 0.333,
        index: index + 2,
        exchangeRate: 1,
      })),
    ] as any);

    const normalized = await (service as any).normalizeLedger(
      ledger,
      {} as any,
      true,
    );

    expect(normalized.getClosingDebit()).toBeCloseTo(1);
    expect(normalized.getClosingCredit()).toBeCloseTo(1);
    expect(normalized.getEntries()[0].debit).toBe(1);
  });

  it('rejects a genuinely unbalanced source journal', async () => {
    const service = makeService();
    const ledger = new Ledger([
      { accountId: 1, debit: 1, credit: 0, exchangeRate: 1 },
      { accountId: 2, debit: 0, credit: 0.99, exchangeRate: 1 },
    ] as any);

    await expect(
      (service as any).normalizeLedger(ledger, {} as any, true),
    ).rejects.toMatchObject({ errorType: 'LEDGER_UNBALANCED' });
  });
});
