const RATE_DECIMAL_PLACES = 4;

/**
 * Calculates the unit rate needed to produce a requested line total.
 *
 * Line totals are stored indirectly as quantity, rate, and percentage
 * discount, so the calculation reverses:
 *   total = quantity * rate * (1 - discount / 100)
 */
export const calcItemEntryRateFromTotal = (
  total: unknown,
  quantity: unknown,
  discount: unknown,
): number | null => {
  const numericTotal = Number(total ?? 0);
  const numericQuantity = Number(quantity ?? 0);
  const numericDiscount = Number(discount ?? 0);
  const discountedQuantity = numericQuantity * (1 - numericDiscount / 100);

  if (
    !Number.isFinite(numericTotal) ||
    !Number.isFinite(discountedQuantity) ||
    discountedQuantity === 0
  ) {
    return null;
  }
  const rate = numericTotal / discountedQuantity;

  return Number.isFinite(rate)
    ? Number(rate.toFixed(RATE_DECIMAL_PLACES))
    : null;
};
