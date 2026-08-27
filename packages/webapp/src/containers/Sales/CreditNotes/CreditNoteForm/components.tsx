import { useFormikContext } from 'formik';
import React, { useEffect } from 'react';
import {
  useCreditNoteIsForeignCustomer,
  type CreditNoteFormValues,
} from './utils';
import { ExchangeRateInputGroup } from '@/components';
import { useCurrentOrganizationBaseCurrency } from '@/hooks/query';
import { transactionNumber } from '@/utils';
import { useCreditNoteFormContext } from './CreditNoteFormProvider';

type CreditNoteExchangeRateInputFieldProps = Omit<
  React.ComponentProps<typeof ExchangeRateInputGroup>,
  'name' | 'fromCurrency' | 'toCurrency'
>;

/** Manual exchange-rate entry retained for legacy foreign-currency records. */
export function CreditNoteExchangeRateInputField({
  ...props
}: CreditNoteExchangeRateInputFieldProps) {
  const baseCurrency = useCurrentOrganizationBaseCurrency();
  const { values } = useFormikContext<CreditNoteFormValues>();

  if (!useCreditNoteIsForeignCustomer()) return null;

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

type CreditNoteSyncIncrementSettingsProps = Record<string, never>;

/**
 * Syncs credit note auto-increment settings to form.
 */
export const CreditNoteSyncIncrementSettingsToForm =
  ({}: CreditNoteSyncIncrementSettingsProps) => {
    const { creditNoteSettings } = useCreditNoteFormContext();
    const creditAutoIncrement = creditNoteSettings?.autoIncrement as
      | boolean
      | undefined;
    const creditNextNumber = creditNoteSettings?.nextNumber as
      | number
      | undefined;
    const creditNumberPrefix = creditNoteSettings?.numberPrefix as
      | string
      | undefined;
    const { setFieldValue } = useFormikContext<CreditNoteFormValues>();

    useEffect(() => {
      // Do not update if the credit note auto-increment mode is disabled.
      if (!creditAutoIncrement) return;

      setFieldValue(
        'creditNoteNumber',
        transactionNumber(creditNumberPrefix, creditNextNumber),
      );
    }, [
      setFieldValue,
      creditNumberPrefix,
      creditNextNumber,
      creditAutoIncrement,
    ]);

    return null;
  };
