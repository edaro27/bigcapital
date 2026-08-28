import { MAX_EMAIL_LIST_LENGTH } from '@bigcapital/utils';
import { ControlGroup } from '@blueprintjs/core';
import intl from 'react-intl-universal';
import { FFormGroup, FInputGroup } from '@/components';

export function CustomerFormAfterPrimarySection() {
  return (
    <div>
      {/*------------ Customer email -----------*/}
      <FFormGroup
        name={'email'}
        label={intl.get('customer_email')}
        helperText={'Separate multiple email addresses with commas.'}
        inline
      >
        <FInputGroup
          name={'email'}
          placeholder={'owner@example.com, accounting@example.com'}
          maxLength={MAX_EMAIL_LIST_LENGTH}
          fill
        />
      </FFormGroup>

      {/*------------ Phone number -----------*/}
      <FFormGroup
        name={'personalPhone'}
        label={intl.get('phone_number')}
        inline
      >
        <ControlGroup fill>
          <FInputGroup
            name={'personalPhone'}
            placeholder={intl.get('personal')}
            fill
          />
          <FInputGroup name={'workPhone'} placeholder={intl.get('work')} fill />
        </ControlGroup>
      </FFormGroup>

      {/*------------ Customer website -----------*/}
      <FFormGroup name={'website'} label={intl.get('website')} inline>
        <FInputGroup name={'website'} placeholder={'http://'} fill />
      </FFormGroup>
    </div>
  );
}
