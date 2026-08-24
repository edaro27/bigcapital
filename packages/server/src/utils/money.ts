const FALLBACK_CURRENCY_DECIMAL_PLACES = 2;
const MAX_LEDGER_DECIMAL_PLACES = 3;

/**
 * Returns the ISO-4217 minor-unit precision supported by the ledger schema.
 * The fallback keeps custom/unknown currencies compatible with the existing
 * two-decimal behaviour.
 */
export function getCurrencyDecimalPlaces(currencyCode?: string): number {
  if (!currencyCode) return FALLBACK_CURRENCY_DECIMAL_PLACES;

  try {
    const options = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
    }).resolvedOptions();

    return Math.min(options.maximumFractionDigits, MAX_LEDGER_DECIMAL_PLACES);
  } catch {
    return FALLBACK_CURRENCY_DECIMAL_PLACES;
  }
}

/**
 * Rounds a monetary amount to the currency's minor unit.
 */
export function roundCurrency(amount: number, currencyCode?: string): number {
  if (!Number.isFinite(amount)) {
    throw new TypeError('Monetary amount must be a finite number.');
  }
  const factor = 10 ** getCurrencyDecimalPlaces(currencyCode);

  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

/**
 * Converts a monetary amount to integer minor units for exact comparisons.
 */
export function toCurrencyMinorUnits(
  amount: number,
  currencyCode?: string,
): number {
  const factor = 10 ** getCurrencyDecimalPlaces(currencyCode);

  return Math.round(roundCurrency(amount, currencyCode) * factor);
}

/** Converts an integer minor-unit amount back to its currency value. */
export function fromCurrencyMinorUnits(
  amount: number,
  currencyCode?: string,
): number {
  const factor = 10 ** getCurrencyDecimalPlaces(currencyCode);

  return Number(amount || 0) / factor;
}
