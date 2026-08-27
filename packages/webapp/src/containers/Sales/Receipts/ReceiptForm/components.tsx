import { Button } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import React from 'react';
import intl from 'react-intl-universal';
import { useReceiptIsForeignCustomer } from './utils';
import type { ReceiptFormValues } from './utils';
import { ExchangeRateInputGroup } from '@/components';
import { useUpdateEffect } from '@/hooks';
import { useCurrentOrganizationBaseCurrency } from '@/hooks/query';
import { transactionNumber } from '@/utils';
import { useReceiptFormContext } from './ReceiptFormProvider';

type ReceiptExchangeRateInputFieldProps = Omit<
  React.ComponentProps<typeof ExchangeRateInputGroup>,
  'name' | 'fromCurrency' | 'toCurrency'
>;

/** Manual exchange-rate entry retained for legacy foreign-currency records. */
export function ReceiptExchangeRateInputField({
  ...props
}: ReceiptExchangeRateInputFieldProps) {
  const baseCurrency = useCurrentOrganizationBaseCurrency();
  const { values } = useFormikContext<ReceiptFormValues>();

  if (!useReceiptIsForeignCustomer()) return null;

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
 * Receipt project select.
 * @returns {JSX.Element}
 */
export function ReceiptProjectSelectButton({ label }: { label?: string }) {
  return <Button text={label ?? intl.get('select_project')} />;
}

type ReceiptSyncIncrementSettingsToFormProps = Record<string, never>;

/**
 * Syncs receipt auto-increment settings to form.
 * @return {React.ReactNode}
 */
export const ReceiptSyncIncrementSettingsToForm =
  ({}: ReceiptSyncIncrementSettingsToFormProps) => {
    const { receiptSettings } = useReceiptFormContext();
    const receiptAutoIncrement = receiptSettings?.autoIncrement as
      | boolean
      | undefined;
    const receiptNextNumber = receiptSettings?.nextNumber as number | undefined;
    const receiptNumberPrefix = receiptSettings?.numberPrefix as
      | string
      | undefined;
    const { setFieldValue } = useFormikContext<ReceiptFormValues>();

    useUpdateEffect(() => {
      // Do not update if the receipt auto-increment mode is disabled.
      if (!receiptAutoIncrement) return;

      setFieldValue(
        'receiptNumber',
        transactionNumber(receiptNumberPrefix, receiptNextNumber),
      );
    }, [
      setFieldValue,
      receiptNumberPrefix,
      receiptAutoIncrement,
      receiptNextNumber,
    ]);

    return null;
  };
