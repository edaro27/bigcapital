import { Customer } from '@/modules/Customers/models/Customer';
import { ContactMailNotification } from './ContactMailNotification';

describe('ContactMailNotification', () => {
  it('uses every saved customer email as a default recipient', async () => {
    const customer = Object.assign(new Customer(), {
      displayName: 'Test Customer',
      email: 'owner@example.com, accounting@example.com, orders@example.com',
    });
    const query = {
      findById: jest.fn().mockReturnThis(),
      throwIfNotFound: jest.fn().mockResolvedValue(customer),
    };
    const customerModel = jest.fn(() => ({
      query: jest.fn(() => query),
    }));
    const mailTenancy = {
      senders: jest.fn().mockResolvedValue([
        {
          mail: 'invoices@business.example',
          label: 'Business',
          primary: true,
        },
      ]),
    };
    const service = new ContactMailNotification(
      mailTenancy as never,
      {} as never,
      customerModel as never,
    );

    const result = await service.getDefaultMailOptions(1);

    expect(result.to).toEqual([
      'owner@example.com',
      'accounting@example.com',
      'orders@example.com',
    ]);
    expect(result.toOptions).toEqual([
      {
        mail: 'owner@example.com',
        label: 'Test Customer',
        primary: true,
      },
      {
        mail: 'accounting@example.com',
        label: 'Test Customer',
        primary: false,
      },
      {
        mail: 'orders@example.com',
        label: 'Test Customer',
        primary: false,
      },
    ]);
  });
});
