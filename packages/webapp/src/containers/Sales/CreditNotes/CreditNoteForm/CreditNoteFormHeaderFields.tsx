import { Position } from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';
import { css } from '@emotion/css';
import { Theme, useTheme } from '@emotion/react';
import { FastField, ErrorMessage, useFormikContext } from 'formik';
import React from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import type { Customer } from '@bigcapital/sdk-ts';
import { CreditNoteExchangeRateInputField } from './components';
import { useCreditNoteFormContext } from './CreditNoteFormProvider';
import { CreditNoteTransactionNoField } from './CreditNoteTransactionNoField';
import { customerNameFieldShouldUpdate } from './utils';
import type { CreditNoteFormValues } from './utils';
import {
  FieldRequiredHint,
  Icon,
  FormattedMessage as T,
  CustomerDrawerLink,
  FFormGroup,
  FInputGroup,
  CustomersSelect,
  Stack,
  FDateInput,
} from '@/components';
import { CLASSES } from '@/constants/classes';

const getCreditNoteFieldsStyle = (theme: Theme & { bpPrefix?: string }) => css`
  .${theme.bpPrefix}-form-group {
    margin-bottom: 0;

    &.${theme.bpPrefix}-inline {
      max-width: 450px;
    }
    .${theme.bpPrefix}-label {
      min-width: 150px;
    }
    .${theme.bpPrefix}-form-content {
      width: 100%;
    }
  }
`;

/**
 * Credit note form header fields.
 */
export function CreditNoteFormHeaderFields() {
  const theme = useTheme();
  const styleClassName = getCreditNoteFieldsStyle(theme);

  return (
    <Stack spacing={18} flex={1} className={styleClassName}>
      {/* ----------- Customer name ----------- */}
      <CreditNoteCustomersSelect />

      {/* Manual compatibility for legacy foreign-currency customers. */}
      <CreditNoteExchangeRateInputField />

      {/* ----------- Credit note date ----------- */}
      <FFormGroup
        name={'creditNoteDate'}
        label={intl.get('credit_note.label_credit_note_date')}
        labelInfo={<FieldRequiredHint />}
        inline
        fastField
      >
        <FDateInput
          name={'creditNoteDate'}
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

      {/* ----------- Credit note # ----------- */}
      <CreditNoteTransactionNoField />

      {/* ----------- Reference ----------- */}
      <FFormGroup name={'referenceNo'} label={intl.get('reference_no')} inline>
        <FInputGroup name={'referenceNo'} />
      </FFormGroup>
    </Stack>
  );
}

/**
 * Customer select field of credit note form.
 */
function CreditNoteCustomersSelect() {
  // Credit note form context.
  const { setFieldValue, values } = useFormikContext<CreditNoteFormValues>();
  const { customers } = useCreditNoteFormContext();

  // Handles item change.
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
      fastField={true}
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
          shouldUpdate={customerNameFieldShouldUpdate}
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
