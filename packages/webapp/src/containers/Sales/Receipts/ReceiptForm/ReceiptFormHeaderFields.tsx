import { Position, Classes } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { Theme, useTheme } from '@emotion/react';
import classNames from 'classnames';
import { useFormikContext } from 'formik';
import React from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import type { Customer } from '@bigcapital/sdk-ts';
import { ReceiptExchangeRateInputField } from './components';
import { useReceiptFormContext } from './ReceiptFormProvider';
import { ReceiptFormReceiptNumberField } from './ReceiptFormReceiptNumberField';
import { accountsFieldShouldUpdate, customersFieldShouldUpdate } from './utils';
import type { ReceiptFormValues } from './utils';
import {
  FFormGroup,
  AccountsSelect,
  CustomersSelect,
  FieldRequiredHint,
  Icon,
  CustomerDrawerLink,
  FormattedMessage as T,
  FInputGroup,
  Stack,
  FDateInput,
} from '@/components';
import { ACCOUNT_TYPE } from '@/constants/accountTypes';

const getEstimateFieldsStyle = (theme: Theme & { bpPrefix?: string }) => css`
  .${theme.bpPrefix}-form-group {
    margin-bottom: 0;

    &.${theme.bpPrefix}-inline {
      max-width: 450px;
    }
    .${theme.bpPrefix}-label {
      min-width: 150px;
      font-weight: 500;
    }
    .${theme.bpPrefix}-form-content {
      width: 100%;
    }
  }
`;

/**
 * Receipt form header fields.
 */
export function ReceiptFormHeader() {
  const theme = useTheme();
  const receiptFieldsClassName = getEstimateFieldsStyle(theme);
  const { accounts } = useReceiptFormContext();

  return (
    <Stack spacing={18} flex={1} className={receiptFieldsClassName}>
      {/* ----------- Customer name ----------- */}
      <ReceiptFormCustomerSelect />

      {/* Manual compatibility for legacy foreign-currency customers. */}
      <ReceiptExchangeRateInputField />

      {/* ----------- Deposit account ----------- */}
      <FFormGroup
        label={intl.get('deposit_account')}
        inline={true}
        labelInfo={<FieldRequiredHint />}
        name={'depositAccountId'}
      >
        <AccountsSelect
          items={accounts}
          name={'depositAccountId'}
          placeholder={<T id={'select_deposit_account'} />}
          filterByTypes={[
            ACCOUNT_TYPE.CASH,
            ACCOUNT_TYPE.BANK,
            ACCOUNT_TYPE.OTHER_CURRENT_ASSET,
          ]}
          allowCreate={true}
          fill={true}
          fastField={true}
          shouldUpdate={accountsFieldShouldUpdate}
        />
      </FFormGroup>

      {/* ----------- Receipt date ----------- */}
      <FFormGroup
        name={'receiptDate'}
        label={intl.get('receipt_date')}
        inline
        fastField
      >
        <FDateInput
          name={'receiptDate'}
          formatDate={(date) => date.toLocaleDateString()}
          parseDate={(str) => new Date(str)}
          popoverProps={{ position: Position.BOTTOM_LEFT, minimal: true }}
          inputProps={{
            leftIcon: <Icon icon={'date-range'} />,
            fill: true,
          }}
          fill
          fastField
        />
      </FFormGroup>

      {/* ----------- Receipt number ----------- */}
      <ReceiptFormReceiptNumberField />

      {/* ----------- Reference ----------- */}
      <FFormGroup
        label={intl.get('reference')}
        inline={true}
        name={'referenceNo'}
      >
        <FInputGroup name={'referenceNo'} />
      </FFormGroup>
    </Stack>
  );
}

/**
 * Customer select field of receipt form.
 * @returns {React.ReactNode}
 */
function ReceiptFormCustomerSelect() {
  const { setFieldValue, values } = useFormikContext<ReceiptFormValues>();
  const { customers } = useReceiptFormContext();

  // Handles the customer item change.
  const handleItemChange = (
    customer: Pick<Customer, 'id' | 'currencyCode'>,
  ) => {
    setFieldValue('customerId', customer.id);
    setFieldValue('currencyCode', customer.currencyCode);
    setFieldValue('exchangeRate', 1);
  };

  return (
    <FFormGroup
      name={'customerId'}
      label={intl.get('customer_name')}
      labelInfo={<FieldRequiredHint />}
      inline={true}
    >
      <>
        <CustomersSelect
          name={'customerId'}
          items={customers}
          placeholder={<T id={'select_customer_account'} />}
          onItemChange={handleItemChange}
          popoverFill={true}
          allowCreate={true}
          fastField={true}
          shouldUpdate={customersFieldShouldUpdate}
          shouldUpdateDeps={{ items: customers }}
        />
        {values.customerId && (
          <CustomerButtonLink customerId={values.customerId}>
            <T id={'view_customer_details'} />
          </CustomerButtonLink>
        )}
      </>
    </FFormGroup>
  );
}

const CustomerButtonLink = styled(CustomerDrawerLink)`
  font-size: 11px;
  margin-top: 6px;
`;
