export interface QuantityPriceTier {
  minimumQuantity: number | string;
  price: number | string;
}

export interface TierPricedItem {
  id: number | string;
  sellPrice: number | string;
  priceTiers?: QuantityPriceTier[];
}

export interface TierPricedEntry {
  itemId: number | string;
  quantity: number | string;
  rate: number | string;
  [key: string]: unknown;
}

const toFiniteNumber = (value: unknown): number | undefined => {
  const number = Number(value);

  return Number.isFinite(number) ? number : undefined;
};

/**
 * Returns the price at the highest quantity breakpoint that does not exceed
 * the requested quantity. The regular selling price is used below the first
 * breakpoint.
 */
export const getQuantityPrice = (
  priceTiers: QuantityPriceTier[] | undefined,
  quantity: number | string,
  regularPrice: number | string,
): number => {
  const numericQuantity = toFiniteNumber(quantity) ?? 0;
  const numericRegularPrice = toFiniteNumber(regularPrice) ?? 0;

  return (priceTiers ?? [])
    .map((priceTier) => ({
      minimumQuantity: toFiniteNumber(priceTier.minimumQuantity),
      price: toFiniteNumber(priceTier.price),
    }))
    .filter(
      (priceTier): priceTier is { minimumQuantity: number; price: number } =>
        priceTier.minimumQuantity !== undefined &&
        priceTier.price !== undefined,
    )
    .sort((a, b) => a.minimumQuantity - b.minimumQuantity)
    .reduce(
      (price, priceTier) =>
        numericQuantity >= priceTier.minimumQuantity ? priceTier.price : price,
      numericRegularPrice,
    );
};

const ratesMatch = (left: unknown, right: unknown): boolean => {
  const numericLeft = toFiniteNumber(left);
  const numericRight = toFiniteNumber(right);

  return (
    numericLeft !== undefined &&
    numericRight !== undefined &&
    Math.abs(numericLeft - numericRight) < 0.000001
  );
};

/**
 * Updates an entry's quantity and automatic tier price. A manually edited rate
 * is preserved by only changing it when it still matches the automatic price
 * for the previous quantity.
 */
export const updateEntryQuantityPrice = (
  rowIndex: number,
  quantity: number | string,
  items: TierPricedItem[] = [],
) => {
  return (entries: TierPricedEntry[]): TierPricedEntry[] => {
    const entry = entries[rowIndex];
    const item = items.find(
      (candidate) => String(candidate.id) === String(entry?.itemId),
    );

    if (!entry || !item?.priceTiers?.length) {
      return entries.map((candidate, index) =>
        index === rowIndex ? { ...candidate, quantity } : candidate,
      );
    }
    const previousAutomaticPrice = getQuantityPrice(
      item.priceTiers,
      entry.quantity,
      item.sellPrice,
    );
    const nextAutomaticPrice = getQuantityPrice(
      item.priceTiers,
      quantity,
      item.sellPrice,
    );
    const shouldUpdateRate = ratesMatch(entry.rate, previousAutomaticPrice);

    return entries.map((candidate, index) =>
      index === rowIndex
        ? {
            ...candidate,
            quantity,
            ...(shouldUpdateRate ? { rate: nextAutomaticPrice } : {}),
          }
        : candidate,
    );
  };
};
