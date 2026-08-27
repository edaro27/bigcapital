import { VendorsWriteGLOpeningSubscriber } from './VendorGLEntriesSubscriber';

describe('VendorsWriteGLOpeningSubscriber', () => {
  const makeSubscriber = () => {
    const storage = {
      writeVendorOpeningBalance: jest.fn(),
      rewriteVendorOpeningBalance: jest.fn(),
      revertVendorOpeningBalance: jest.fn(),
    };
    return {
      storage,
      subscriber: new VendorsWriteGLOpeningSubscriber(storage as any),
    };
  };

  it('does not post a zero decimal-string opening balance', async () => {
    const { storage, subscriber } = makeSubscriber();

    await subscriber.handleWriteOpeningBalanceEntries({
      vendor: { id: 1, openingBalance: '0.00000' },
      trx: undefined,
    } as any);

    expect(storage.writeVendorOpeningBalance).not.toHaveBeenCalled();
  });

  it('posts a non-zero decimal-string opening balance', async () => {
    const { storage, subscriber } = makeSubscriber();

    await subscriber.handleWriteOpeningBalanceEntries({
      vendor: { id: 1, openingBalance: '12.34000' },
      trx: undefined,
    } as any);

    expect(storage.writeVendorOpeningBalance).toHaveBeenCalledWith(
      1,
      undefined,
    );
  });
});
