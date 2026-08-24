import { Plan } from '../models/Plan';
import { NewSubscriptionService } from './NewSubscription.service';

describe('NewSubscriptionService', () => {
  it('creates a non-expiring subscription when MariaDB returns a free price as a decimal string', async () => {
    const plan = Object.assign(new Plan(), {
      id: 1,
      price: '0.00',
      invoiceInternal: undefined,
      invoicePeriod: undefined,
    });
    const relatedQuery = {
      modify: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(undefined),
    };
    const tenant = {
      id: 1,
      $relatedQuery: jest.fn().mockReturnValue(relatedQuery),
    };
    const planQuery = {
      findOne: jest.fn().mockReturnThis(),
      throwIfNotFound: jest.fn().mockResolvedValue(plan),
    };
    const planModel = {
      query: jest.fn().mockReturnValue(planQuery),
    };
    const subscriptionRepository = {
      newSubscription: jest.fn().mockResolvedValue(undefined),
    };
    const service = new NewSubscriptionService(
      {} as never,
      { getTenant: jest.fn().mockResolvedValue(tenant) } as never,
      subscriptionRepository as never,
      planModel as never,
    );

    await service.execute('free');

    expect(subscriptionRepository.newSubscription).toHaveBeenCalledWith(
      tenant.id,
      plan.id,
      plan.invoiceInternal,
      Infinity,
      'main',
      undefined,
    );
  });
});
