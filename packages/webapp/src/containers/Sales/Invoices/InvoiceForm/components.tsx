import { Button } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import intl from 'react-intl-universal';
import React from 'react';
import { useInvoiceIsForeignCustomer } from './utils';
import type { InvoiceFormValues } from './utils';
import { ExchangeRateInputGroup } from '@/components';
import { useUpdateEffect } from '@/hooks';
import { useCurrentOrganizationBaseCurrency } from '@/hooks/query';
import { transactionNumber } from '@/utils';
import { useInvoiceFormContext } from './InvoiceFormProvider';

type InvoiceExchangeRateInputFieldProps = Omit<
  React.ComponentProps<typeof ExchangeRateInputGroup>,
  'name' | 'fromCurrency' | 'toCurrency'
>;

/** Manual exchange-rate entry retained for legacy foreign-currency records. */
export function InvoiceExchangeRateInputField({
  ...props
}: InvoiceExchangeRateInputFieldProps) {
  const baseCurrency = useCurrentOrganizationBaseCurrency();
  const { values } = useFormikContext<InvoiceFormValues>();

  if (!useInvoiceIsForeignCustomer()) return null;

  return (
    <ExchangeRateInputGroup
      {...props}
      name={'exchangeRate'}
      fromCurrency={values.currencyCode}
      toCurrency={baseCurrency ?? 'USD'}
      formGroupProps={{ label: ' ', inline: true }}
    />
  );
}

/**
 * Invoice project select.
 * @returns {JSX.Element}
 */
export function InvoiceProjectSelectButton({ label }: { label?: string }) {
  return <Button text={label ?? intl.get('select_project')} />;
}

/**
 * Syncs invoice auto-increment settings to invoice form once update.
 */
export const InvoiceNoSyncSettingsToForm = () => {
  const { invoiceSettings } = useInvoiceFormContext();
  const invoiceAutoIncrement = invoiceSettings?.autoIncrement as
    | boolean
    | undefined;
  const invoiceNextNumber = invoiceSettings?.nextNumber as number | undefined;
  const invoiceNumberPrefix = invoiceSettings?.numberPrefix as
    | string
    | undefined;
  const { setFieldValue } = useFormikContext<InvoiceFormValues>();

  useUpdateEffect(() => {
    // Do not update if the invoice auto-increment mode is disabled.
    if (!invoiceAutoIncrement) return;

    setFieldValue(
      'invoiceNo',
      transactionNumber(invoiceNumberPrefix, invoiceNextNumber),
    );
  }, [setFieldValue, invoiceNumberPrefix, invoiceNextNumber]);

  return null;
};
