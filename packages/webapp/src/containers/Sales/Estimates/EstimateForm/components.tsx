import { Button } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import React from 'react';
import intl from 'react-intl-universal';
import { useEstimateIsForeignCustomer } from './utils';
import type { EstimateFormValues } from './utils';
import { ExchangeRateInputGroup } from '@/components';
import { useUpdateEffect } from '@/hooks';
import { useCurrentOrganizationBaseCurrency } from '@/hooks/query';
import { transactionNumber } from '@/utils';
import { useEstimateFormContext } from './EstimateFormProvider';

type EstimateExchangeRateInputFieldProps = Omit<
  React.ComponentProps<typeof ExchangeRateInputGroup>,
  'name' | 'fromCurrency' | 'toCurrency'
>;

/** Manual exchange-rate entry retained for legacy foreign-currency records. */
export function EstimateExchangeRateInputField({
  ...props
}: EstimateExchangeRateInputFieldProps) {
  const baseCurrency = useCurrentOrganizationBaseCurrency();
  const { values } = useFormikContext<EstimateFormValues>();

  if (!useEstimateIsForeignCustomer()) return null;

  return (
    <ExchangeRateInputGroup
      {...props}
      name={'exchangeRate'}
      fromCurrency={values.currencyCode ?? ''}
      toCurrency={baseCurrency ?? 'USD'}
      formGroupProps={{ label: ' ', inline: true }}
    />
  );
}

type EstimateProjectSelectButtonProps = { label?: string };

/**
 * Estimate project select.
 * @returns {JSX.Element}
 */
export function EstimateProjectSelectButton({
  label,
}: EstimateProjectSelectButtonProps) {
  return <Button text={label ?? intl.get('select_project')} />;
}

type EstimateIncrementSyncSettingsToFormProps = Record<string, never>;

/**
 * Syncs the estimate auto-increment settings to estimate form.
 * @returns {React.ReactNode}
 */
export const EstimateIncrementSyncSettingsToForm =
  ({}: EstimateIncrementSyncSettingsToFormProps) => {
    const { estimatesSettings } = useEstimateFormContext();
    const estimateNextNumber = estimatesSettings?.nextNumber as
      | number
      | undefined;
    const estimateNumberPrefix = estimatesSettings?.numberPrefix as
      | string
      | undefined;
    const estimateAutoIncrement = estimatesSettings?.autoIncrement as
      | boolean
      | undefined;
    const { setFieldValue } = useFormikContext<EstimateFormValues>();

    useUpdateEffect(() => {
      // Do not update if the estimate auto-increment mode is disabled.
      if (!estimateAutoIncrement) return;

      setFieldValue(
        'estimateNumber',
        transactionNumber(estimateNumberPrefix, estimateNextNumber),
      );
    }, [
      setFieldValue,
      estimateNumberPrefix,
      estimateNextNumber,
      estimateAutoIncrement,
    ]);

    return null;
  };
