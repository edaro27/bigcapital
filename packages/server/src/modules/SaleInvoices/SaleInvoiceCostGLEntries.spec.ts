import { SaleInvoiceCostGLEntries } from './SaleInvoiceCostGLEntries';

const makeQuery = (rows: unknown[]) => {
  const query: any = {
    where: jest.fn().mockReturnThis(),
    modify: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    withGraphFetched: jest.fn().mockReturnThis(),
  };
  query.then = (resolve, reject) => Promise.resolve(rows).then(resolve, reject);
  return query;
};

describe('SaleInvoiceCostGLEntries', () => {
  it('does not commit an empty ledger when the shared cost event has no invoice lots', async () => {
    const ledgerStorage = { commit: jest.fn() };
    const inventoryCostLotTracker = () => ({
      query: () => makeQuery([]),
    });
    const service = new SaleInvoiceCostGLEntries(
      ledgerStorage as any,
      inventoryCostLotTracker as any,
    );

    await service.writeInventoryCostJournalEntries(new Date(), 1);

    expect(ledgerStorage.commit).not.toHaveBeenCalled();
  });
});
