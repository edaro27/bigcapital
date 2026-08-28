import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MAX_EMAIL_LIST_ADDRESSES } from '@bigcapital/utils';
import { EditCustomerDto } from './EditCustomer.dto';

const makeCustomer = (email: string) =>
  plainToInstance(EditCustomerDto, {
    customerType: 'business',
    displayName: 'Test Customer',
    email,
  });

describe('customer email list validation', () => {
  it('accepts and normalizes multiple valid email addresses', async () => {
    const customer = makeCustomer(
      ' owner@example.com; accounting@example.com\nOWNER@example.com ',
    );
    const errors = await validate(customer);

    expect(errors).toHaveLength(0);
    expect(customer.email).toBe('owner@example.com, accounting@example.com');
  });

  it('rejects the list when any address is invalid', async () => {
    const errors = await validate(
      makeCustomer('owner@example.com, invalid-address'),
    );

    expect(errors.map(({ property }) => property)).toContain('email');
  });

  it('rejects recipient lists above the supported limit', async () => {
    const email = Array.from(
      { length: MAX_EMAIL_LIST_ADDRESSES + 1 },
      (_, index) => `recipient-${index}@example.com`,
    ).join(', ');
    const errors = await validate(makeCustomer(email));

    expect(errors.map(({ property }) => property)).toContain('email');
  });
});
