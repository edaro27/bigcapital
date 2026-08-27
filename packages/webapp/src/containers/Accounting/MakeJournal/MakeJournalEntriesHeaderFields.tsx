import { Position } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { useTheme } from '@emotion/react';
import { Theme } from '@xstyled/emotion';
import intl from 'react-intl-universal';
import { JournalExchangeRateInputField } from './components';
import { MakeJournalTransactionNoField } from './MakeJournalTransactionNoField';
import {
  Hint,
  FieldRequiredHint,
  Icon,
  FormattedMessage as T,
  FFormGroup,
  FInputGroup,
  FDateInput,
  Stack,
} from '@/components';

const getFieldsStyle = (theme: Theme) => css`
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
 * Make journal entries header fields.
 */
export function MakeJournalEntriesHeader() {
  const theme = useTheme();
  const fieldsClassName = getFieldsStyle(theme);

  return (
    <Stack spacing={18} flex={1} className={fieldsClassName}>
      {/*------------ Posting date -----------*/}
      <FFormGroup
        name={'date'}
        label={intl.get('posting_date')}
        labelInfo={<FieldRequiredHint />}
        inline
        fastField
      >
        <FDateInput
          name={'date'}
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

      {/*------------ Journal number -----------*/}
      <MakeJournalTransactionNoField />

      {/*------------ Reference -----------*/}
      <FFormGroup
        name={'reference'}
        label={intl.get('reference')}
        labelInfo={
          <Hint
            content={<T id={'journal_reference_hint'} />}
            position={Position.RIGHT}
          />
        }
        inline
        fastField
      >
        <FInputGroup name={'reference'} fill />
      </FFormGroup>

      {/*------------ Journal type  ----------- */}
      <FFormGroup
        name={'journalType'}
        label={intl.get('journal_type')}
        inline
        fastField
      >
        <FInputGroup name={'journalType'} fill />
      </FFormGroup>

      {/* Manual compatibility for legacy foreign-currency journals. */}
      <JournalExchangeRateInputField
        name={'exchangeRate'}
        formGroupProps={{ label: ' ', inline: true }}
      />
    </Stack>
  );
}
