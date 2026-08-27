import { TransactionLandedCostEntriesService } from './TransactionLandedCostEntries.service';
import { ServiceError } from '@/modules/Items/ServiceError';

describe('TransactionLandedCostEntriesService', () => {
  const service = new TransactionLandedCostEntriesService();
  const allocatedEntry = {
    id: 7,
    amount: 100,
    allocatedCostAmount: 40,
  };

  it('rejects deleting an expense or bill entry with allocated landed cost', () => {
    expect(() =>
      service.validateLandedCostEntriesNotDeleted([allocatedEntry], []),
    ).toThrow(ServiceError);
  });

  it('rejects reducing an entry below its allocated landed cost', () => {
    expect(() =>
      service.validateLocatedCostEntriesSmallerThanNewEntries(
        [allocatedEntry],
        [{ id: 7, amount: 39.9999 }],
      ),
    ).toThrow(ServiceError);
  });

  it('allows a retained entry whose amount covers the allocation', () => {
    expect(() =>
      service.validateLocatedCostEntriesSmallerThanNewEntries(
        [allocatedEntry],
        [{ id: 7, amount: 40 }],
      ),
    ).not.toThrow();
  });
});
