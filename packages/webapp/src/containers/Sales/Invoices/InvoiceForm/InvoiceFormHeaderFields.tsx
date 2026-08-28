import { Position, Classes } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { Theme, useTheme } from '@emotion/react';
import classNames from 'classnames';
import { useFormikContext } from 'formik';
import React from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import type { Customer } from '@bigcapital/sdk-ts';
import { InvoiceExchangeRateInputField } from './components';
import { InvoiceFormInvoiceNumberField } from './InvoiceFormInvoiceNumberField';
import { useInvoiceFormContext } from './InvoiceFormProvider';
import { customerNameFieldShouldUpdate } from './utils';
import type { InvoiceFormValues } from './utils';
import {
  FFormGroup,
  FormattedMessage as T,
  CustomerDrawerLink,
  FieldRequiredHint,
  CustomersSelect,
  Stack,
  FInputGroup,
  Icon,
  FDateInput,
  FSelect,
} from '@/components';

const getInvoiceFieldsStyle = (theme: Theme & { bpPrefix?: string }) => css`
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
 * Invoice form header fields.
 */
export function InvoiceFormHeaderFields() {
  const theme = useTheme();
  const { values } = useFormikContext<InvoiceFormValues>();
  const invoiceFieldsClassName = getInvoiceFieldsStyle(theme);

  return (
    <Stack spacing={18} flex={1} className={invoiceFieldsClassName}>
      {/* ----------- Customer name ----------- */}
      <InvoiceFormCustomerSelect />

      {/* Manual compatibility for legacy foreign-currency customers. */}
      <InvoiceExchangeRateInputField />

      {/* ----------- Invoice date ----------- */}
      <FFormGroup
        name={'invoiceDate'}
        label={intl.get('invoice_date')}
        labelInfo={<FieldRequiredHint />}
        inline
        fastField
      >
        <FDateInput
          name={'invoiceDate'}
          formatDate={(date) => date.toLocaleDateString()}
          parseDate={(str) => new Date(str)}
          popoverProps={{
            position: Position.BOTTOM_LEFT,
            minimal: true,
            fill: true,
          }}
          inputProps={{
            leftIcon: <Icon icon={'date-range'} />,
          }}
          fill
          fastField
        />
      </FFormGroup>

      {/* ----------- Due date ----------- */}
      <FFormGroup
        name={'dueDate'}
        label={intl.get('due_date')}
        labelInfo={<FieldRequiredHint />}
        inline
        fastField
      >
        <FDateInput
          name={'dueDate'}
          formatDate={(date) => date.toLocaleDateString()}
          parseDate={(str) => new Date(str)}
          popoverProps={{
            position: Position.BOTTOM_LEFT,
            minimal: true,
            fill: true,
          }}
          inputProps={{
            leftIcon: <Icon icon={'date-range'} />,
            fill: true,
          }}
          fill
          fastField
        />
      </FFormGroup>

      {/* ----------- Invoice number ----------- */}
      <InvoiceFormInvoiceNumberField />

      {/* ----------- Reference ----------- */}
      <FFormGroup name={'referenceNo'} label={intl.get('reference')} inline>
        <FInputGroup
          name={'referenceNo'}
          data-testId="invoice-reference-input"
        />
      </FFormGroup>

      {/* Internal classification only; excluded from invoice PDFs and emails. */}
      <InvoiceSalesChannelSelect />
    </Stack>
  );
}

function InvoiceSalesChannelSelect() {
  const { salesChannels } = useInvoiceFormContext();

  return (
    <FFormGroup
      name={'salesChannelId'}
      label={intl.get('invoice.field.sales_channel')}
      inline
      fastField
    >
      <FSelect
        name={'salesChannelId'}
        items={salesChannels}
        valueAccessor={'id'}
        textAccessor={'name'}
        placeholder={intl.get('invoice.sales_channel.select')}
        popoverProps={{ minimal: true }}
        filterable={false}
        fastField
      />
    </FFormGroup>
  );
}

/**
 * Customer select field of the invoice form.
 * @returns {React.ReactNode}
 */
function InvoiceFormCustomerSelect() {
  const { values, setFieldValue } = useFormikContext<InvoiceFormValues>();
  const { customers } = useInvoiceFormContext();

  // Handles the customer item change.
  const handleItemChange = (
    customer: Pick<Customer, 'id' | 'currencyCode'>,
  ) => {
    // If the customer id has changed change the customer id and currency code.
    if (values.customerId !== customer.id) {
      setFieldValue('customerId', customer.id);
      setFieldValue('currencyCode', customer.currencyCode);
      setFieldValue('exchangeRate', 1);
    }
  };

  return (
    <FFormGroup
      name={'customerId'}
      label={intl.get('customer_name')}
      inline={true}
      labelInfo={<FieldRequiredHint />}
      fastField={true}
    >
      <>
        <CustomersSelect
          name={'customerId'}
          items={customers}
          placeholder={<T id={'select_customer_account'} />}
          onItemChange={handleItemChange}
          allowCreate={true}
          fastField={true}
          shouldUpdate={customerNameFieldShouldUpdate}
          shouldUpdateDeps={{ items: customers }}
          buttonProps={{ 'data-testId': 'invoice-customer-select' }}
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
