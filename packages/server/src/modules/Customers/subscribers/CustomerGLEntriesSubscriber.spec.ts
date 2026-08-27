import { CustomerWriteGLOpeningBalanceSubscriber } from './CustomerGLEntriesSubscriber';

describe('CustomerWriteGLOpeningBalanceSubscriber', () => {
  const makeSubscriber = () => {
    const storage = {
      writeCustomerOpeningBalance: jest.fn(),
      rewriteCustomerOpeningBalance: jest.fn(),
      revertCustomerOpeningBalance: jest.fn(),
    };
    return {
      storage,
      subscriber: new CustomerWriteGLOpeningBalanceSubscriber(storage as any),
    };
  };

  it('does not post a zero decimal-string opening balance', async () => {
    const { storage, subscriber } = makeSubscriber();

    await subscriber.handleWriteOpenBalanceEntries({
      customer: { id: 1, openingBalance: '0.00000' },
      trx: undefined,
    } as any);

    expect(storage.writeCustomerOpeningBalance).not.toHaveBeenCalled();
  });

  it('posts a non-zero decimal-string opening balance', async () => {
    const { storage, subscriber } = makeSubscriber();

    await subscriber.handleWriteOpenBalanceEntries({
      customer: { id: 1, openingBalance: '12.34000' },
      trx: undefined,
    } as any);

    expect(storage.writeCustomerOpeningBalance).toHaveBeenCalledWith(
      1,
      undefined,
    );
  });
});
