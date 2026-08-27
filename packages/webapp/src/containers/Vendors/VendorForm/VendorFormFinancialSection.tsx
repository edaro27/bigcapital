import { Position, ControlGroup } from '@blueprintjs/core';
import { ErrorMessage, useFormikContext } from 'formik';
import intl from 'react-intl-universal';
import {
  openingBalanceFieldShouldUpdate,
  useSetPrimaryBranchToForm,
} from './utils';
import type { VendorFormValues } from './utils';
import { useVendorFormContext } from './VendorFormProvider';
import { VendorFormSectionTitle } from './VendorFormSectionTitle';
import {
  FFormGroup,
  FormattedMessage as T,
  InputPrependText,
  BranchSelect,
  FeatureCan,
  FMoneyInputGroup,
  FDateInput,
  Icon,
  Box,
} from '@/components';
import { Features } from '@/constants';

export function VendorFormFinancialSection() {
  const { vendorId, branches } = useVendorFormContext();

  // Sets the primary branch to form.
  useSetPrimaryBranchToForm();

  return (
    <Box data-section-id="financial">
      <VendorFormSectionTitle>
        <T id={'financial_details'} />
      </VendorFormSectionTitle>

      <VendorOpeningBalanceField />
      <VendorOpeningBalanceAtField />

      <FeatureCan feature={Features.Branches}>
        <FFormGroup
          label={intl.get('vendor.label.opening_branch')}
          name={'openingBalanceBranchId'}
          inline
        >
          <BranchSelect
            name={'openingBalanceBranchId'}
            branches={branches}
            popoverProps={{ minimal: true }}
          />
        </FFormGroup>
      </FeatureCan>
    </Box>
  );
}

/**
 * Vendor opening balance at date field.
 */
function VendorOpeningBalanceAtField() {
  const { vendorId } = useVendorFormContext();

  // Cannot continue if the vendor id is defined.
  if (vendorId) return null;

  return (
    <FFormGroup
      name={'openingBalanceAt'}
      label={intl.get('opening_balance_at')}
      inline
      helperText={<ErrorMessage name="openingBalanceAt" />}
    >
      <FDateInput
        name={'openingBalanceAt'}
        popoverProps={{ position: Position.BOTTOM, minimal: true }}
        disabled={Boolean(vendorId)}
        formatDate={(date: Date) => date.toLocaleDateString()}
        parseDate={(str: string) => new Date(str)}
        inputProps={{
          leftIcon: <Icon icon={'date-range'} />,
        }}
        fill={true}
      />
    </FFormGroup>
  );
}

function VendorOpeningBalanceField() {
  const { vendorId } = useVendorFormContext();
  const { values } = useFormikContext<VendorFormValues>();

  // Cannot continue if the vendor id is defined.
  if (vendorId) return null;

  return (
    <FFormGroup
      label={intl.get('opening_balance')}
      name={'openingBalance'}
      inline
      // @ts-expect-error shouldUpdate is forwarded to FastField at runtime; FormGroupProps type doesn't expose it
      shouldUpdate={openingBalanceFieldShouldUpdate}
      shouldUpdateDeps={{ currencyCode: values.currencyCode }}
      fastField={true}
    >
      <ControlGroup fill>
        <InputPrependText text={values.currencyCode} />
        <FMoneyInputGroup
          name={'openingBalance'}
          fastField
          inputGroupProps={{ fill: true }}
        />
      </ControlGroup>
    </FFormGroup>
  );
}
