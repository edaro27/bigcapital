import { Button } from '@blueprintjs/core';
import { FieldArray, useFormikContext } from 'formik';
import styled from 'styled-components';
import type { ItemFormValues } from './types';
import { FFormGroup, FMoneyInputGroup } from '@/components';
import { useCurrentOrganizationBaseCurrency } from '@/hooks/query';

export function ItemFormPriceTiers() {
  const baseCurrency = useCurrentOrganizationBaseCurrency();
  const { values, errors, touched } = useFormikContext<ItemFormValues>();
  const priceTiersError = errors.priceTiers;
  const showPriceTiersError =
    touched.priceTiers && typeof priceTiersError === 'string';

  return (
    <FFormGroup
      name={'priceTiers'}
      label={'Quantity price tiers'}
      helperText={
        showPriceTiersError
          ? priceTiersError
          : 'The regular selling price applies below the first minimum quantity.'
      }
      inline
    >
      <FieldArray name={'priceTiers'}>
        {({ push, remove }) => (
          <PriceTiers>
            {values.priceTiers.length > 0 && (
              <PriceTierHeader>
                <span>Minimum quantity</span>
                <span>Unit price ({baseCurrency})</span>
                <span />
              </PriceTierHeader>
            )}

            {values.priceTiers.map((_priceTier, index) => (
              <PriceTierRow key={index}>
                <FMoneyInputGroup
                  name={`priceTiers.${index}.minimumQuantity`}
                  decimalsLimit={3}
                  allowNegativeValue={false}
                  disabled={!values.sellable}
                  fill
                />
                <FMoneyInputGroup
                  name={`priceTiers.${index}.price`}
                  decimalsLimit={4}
                  allowNegativeValue={false}
                  disabled={!values.sellable}
                  fill
                />
                <Button
                  type={'button'}
                  icon={'trash'}
                  minimal
                  intent={'danger'}
                  disabled={!values.sellable}
                  aria-label={`Remove price tier ${index + 1}`}
                  onClick={() => remove(index)}
                />
              </PriceTierRow>
            ))}

            <Button
              type={'button'}
              icon={'plus'}
              minimal
              small
              disabled={!values.sellable}
              onClick={() => push({ minimumQuantity: '', price: '' })}
            >
              Add price tier
            </Button>
          </PriceTiers>
        )}
      </FieldArray>
    </FFormGroup>
  );
}

const PriceTiers = styled.div`
  width: 100%;
  max-width: 520px;
`;

const PriceTierHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(130px, 1fr) minmax(150px, 1fr) 30px;
  gap: 8px;
  margin-bottom: 6px;
  color: #5f6b7c;
  font-size: 12px;
  font-weight: 600;
`;

const PriceTierRow = styled.div`
  display: grid;
  grid-template-columns: minmax(130px, 1fr) minmax(150px, 1fr) 30px;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
`;
