import {
  calculateInvoiceDueDate,
  InvoicePaymentTermOptions,
} from '@bigcapital/utils';
import { Position, Classes } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { Theme, useTheme } from '@emotion/react';
import classNames from 'classnames';
import { useFormikContext } from 'formik';
import React from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { InvoiceExchangeRateInputField } from './components';
import { InvoiceFormInvoiceNumberField } from './InvoiceFormInvoiceNumberField';
import { useInvoiceFormContext } from './InvoiceFormProvider';
import { customerNameFieldShouldUpdate } from './utils';
import type { InvoiceFormValues } from './utils';
import type { Customer } from '@bigcapital/sdk-ts';
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
  const invoiceFieldsClassName = getInvoiceFieldsStyle(theme);

  return (
    <Stack spacing={18} flex={1} className={invoiceFieldsClassName}>
      <InvoicePaymentTermDueDateSync />

      {/* ----------- Customer name ----------- */}
      <InvoiceFormCustomerSelect />

      {/* ----------- Customer billing address ----------- */}
      <InvoiceCustomerBillingAddress />

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
          parseDate={parseFormDate}
          formFormatDate={formatFormDate}
          formParseDate={parseFormDate}
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

      {/* ----------- Payment terms ----------- */}
      <FFormGroup
        name={'paymentTerm'}
        label={intl.get('invoice.field.payment_term')}
        labelInfo={<FieldRequiredHint />}
        inline
        fastField
      >
        <FSelect
          name={'paymentTerm'}
          items={InvoicePaymentTermOptions}
          valueAccessor={'value'}
          textAccessor={'label'}
          placeholder={intl.get('invoice.payment_term.select')}
          popoverProps={{ minimal: true }}
          filterable={false}
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
          parseDate={parseFormDate}
          formFormatDate={formatFormDate}
          formParseDate={parseFormDate}
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

      {/* The invoice reference stores the customer's purchase-order number. */}
      <FFormGroup name={'referenceNo'} label={intl.get('po_number')} inline>
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

function InvoicePaymentTermDueDateSync() {
  const { values, setFieldValue } = useFormikContext<InvoiceFormValues>();
  const previousAutomaticInputs = React.useRef({
    invoiceDate: values.invoiceDate,
    paymentTerm: values.paymentTerm,
  });

  React.useEffect(() => {
    const previousInputs = previousAutomaticInputs.current;
    const automaticInputsChanged =
      previousInputs.invoiceDate !== values.invoiceDate ||
      previousInputs.paymentTerm !== values.paymentTerm;

    previousAutomaticInputs.current = {
      invoiceDate: values.invoiceDate,
      paymentTerm: values.paymentTerm,
    };

    // Preserve an existing invoice's manually customized due date. New invoice
    // defaults are already calculated in `defaultInvoice`.
    if (!automaticInputsChanged) return;
    if (!values.invoiceDate || !values.paymentTerm) return;

    const dueDate = calculateInvoiceDueDate(
      values.invoiceDate,
      values.paymentTerm,
    );

    setFieldValue('dueDate', dueDate, false);
  }, [values.invoiceDate, values.paymentTerm, setFieldValue]);

  return null;
}

/**
 * Parses an API date-only value as a local calendar date. `new Date('YYYY-MM-DD')`
 * is parsed as UTC and renders as the previous day in timezones west of UTC.
 */
function parseFormDate(value: string): Date | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Keeps Formik date values in the API's date-only format. */
function formatFormDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
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

/** Displays the selected customer's billing address for invoice entry. */
function InvoiceCustomerBillingAddress() {
  const { values } = useFormikContext<InvoiceFormValues>();
  const { customers } = useInvoiceFormContext();

  if (!values.customerId) return null;

  const customer = customers.find(
    ({ id }) => String(id) === String(values.customerId),
  );
  const locality = [customer?.billingAddressCity, customer?.billingAddressState]
    .filter(Boolean)
    .join(', ');
  const localityAndPostcode = [locality, customer?.billingAddressPostcode]
    .filter(Boolean)
    .join(' ');
  const addressLines = [
    customer?.billingAddress1,
    customer?.billingAddress2,
    localityAndPostcode,
    customer?.billingAddressCountry,
  ].filter((line): line is string => Boolean(line));

  return (
    <FFormGroup
      name={'billingAddressDisplay'}
      label={intl.get('billing_address')}
      inline
    >
      <BillingAddressDisplay
        className={classNames(Classes.TEXT_MUTED)}
        aria-live="polite"
        data-testId="invoice-customer-billing-address"
      >
        {addressLines.length > 0
          ? addressLines.map((line, index) => (
              <div key={`${index}-${line}`}>{line}</div>
            ))
          : intl.get('invoice.no_billing_address')}
      </BillingAddressDisplay>
    </FFormGroup>
  );
}

const CustomerButtonLink = styled(CustomerDrawerLink)`
  font-size: 11px;
  margin-top: 6px;
`;

const BillingAddressDisplay = styled.div`
  width: 100%;
  min-height: 32px;
  padding: 7px 10px;
  border: 1px solid rgba(92, 112, 128, 0.25);
  border-radius: 3px;
  background: rgba(191, 204, 214, 0.12);
  line-height: 1.45;
`;
