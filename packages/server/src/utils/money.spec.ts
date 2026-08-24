import {
  fromCurrencyMinorUnits,
  getCurrencyDecimalPlaces,
  roundCurrency,
  toCurrencyMinorUnits,
} from './money';

describe('currency precision', () => {
  it('uses ISO minor units within the three-decimal ledger capacity', () => {
    expect(getCurrencyDecimalPlaces('JPY')).toBe(0);
    expect(getCurrencyDecimalPlaces('USD')).toBe(2);
    expect(getCurrencyDecimalPlaces('KWD')).toBe(3);
  });

  it('round-trips Stripe minor units without floating comparisons', () => {
    expect(toCurrencyMinorUnits(12.345, 'KWD')).toBe(12345);
    expect(fromCurrencyMinorUnits(12345, 'KWD')).toBe(12.345);
    expect(roundCurrency(10.005, 'USD')).toBe(10.01);
  });
});
