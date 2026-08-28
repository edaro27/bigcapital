import {
  MAX_EMAIL_LIST_ADDRESSES,
  MAX_EMAIL_LIST_LENGTH,
  parseEmailList,
} from '@bigcapital/utils';
import intl from 'react-intl-universal';
import * as Yup from 'yup';

const singleEmailSchema = Yup.string().email();

export const isValidCustomerEmailList = (value?: string | null): boolean => {
  if (!value) {
    return true;
  }
  if (value.length > MAX_EMAIL_LIST_LENGTH) {
    return false;
  }
  const addresses = parseEmailList(value);

  return (
    addresses.length > 0 &&
    addresses.length <= MAX_EMAIL_LIST_ADDRESSES &&
    addresses.every((address) => singleEmailSchema.isValidSync(address))
  );
};

const Schema = Yup.object().shape({
  customerType: Yup.string()
    .required()
    .trim()
    .label(intl.get('customer_type_')),
  salutation: Yup.string().trim(),
  firstName: Yup.string().trim(),
  lastName: Yup.string().trim(),
  companyName: Yup.string().trim(),
  displayName: Yup.string().trim().required().label(intl.get('display_name_')),
  code: Yup.string().trim(),

  email: Yup.string()
    .nullable()
    .test(
      'email-list',
      'Enter valid email addresses separated by commas.',
      isValidCustomerEmailList,
    ),
  workPhone: Yup.string().nullable(),
  personalPhone: Yup.string().nullable(),
  website: Yup.string().url().nullable(),

  active: Yup.boolean(),
  note: Yup.string().trim(),

  billingAddressCountry: Yup.string().trim(),
  billingAddress1: Yup.string().trim(),
  billingAddress2: Yup.string().trim(),
  billingAddressCity: Yup.string().trim(),
  billingAddressState: Yup.string().trim(),
  billingAddressPostcode: Yup.string().nullable(),
  billingAddressPhone: Yup.string().nullable(),

  shippingAddressCountry: Yup.string().trim(),
  shippingAddress1: Yup.string().trim(),
  shippingAddress2: Yup.string().trim(),
  shippingAddressCity: Yup.string().trim(),
  shippingAddressState: Yup.string().trim(),
  shippingAddressPostcode: Yup.string().nullable(),
  shippingAddressPhone: Yup.string().nullable(),

  openingBalance: Yup.number().nullable(),
  currencyCode: Yup.string(),
  openingBalanceAt: Yup.date(),
  openingBalanceBranchId: Yup.mixed(),
  openingBalanceExchangeRate: Yup.number().nullable(),
});

export const CreateCustomerForm = Schema;
export const EditCustomerForm = Schema;
