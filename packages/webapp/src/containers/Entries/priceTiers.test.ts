import assert from 'node:assert/strict';
import { getQuantityPrice, updateEntryQuantityPrice } from './priceTiers';

const itemA = {
  id: 1,
  sellPrice: 0.25,
  priceTiers: [
    { minimumQuantity: 250, price: 0.228 },
    { minimumQuantity: 500, price: 0.21 },
    { minimumQuantity: 1000, price: 0.194 },
    { minimumQuantity: 2000, price: 0.176 },
  ],
};

const itemAPriceCases: Array<[number, number]> = [
  [249.999, 0.25],
  [250, 0.228],
  [499.999, 0.228],
  [500, 0.21],
  [999.999, 0.21],
  [1000, 0.194],
  [1999.999, 0.194],
  [2000, 0.176],
  [5000, 0.176],
];

itemAPriceCases.forEach(([quantity, expectedPrice]) => {
  assert.equal(
    getQuantityPrice(itemA.priceTiers, quantity, itemA.sellPrice),
    expectedPrice,
  );
});

const itemBPriceTiers = [
  { minimumQuantity: 100, price: 0.45 },
  { minimumQuantity: 500, price: 0.398 },
];

assert.equal(getQuantityPrice(itemBPriceTiers, 99, 0.5), 0.5);
assert.equal(getQuantityPrice(itemBPriceTiers, 100, 0.5), 0.45);
assert.equal(getQuantityPrice(itemBPriceTiers, 499, 0.5), 0.45);
assert.equal(getQuantityPrice(itemBPriceTiers, 500, 0.5), 0.398);

assert.deepEqual(
  updateEntryQuantityPrice(0, 500, [itemA])([
    { itemId: 1, quantity: 250, rate: 0.228 },
  ]),
  [{ itemId: 1, quantity: 500, rate: 0.21 }],
);

assert.deepEqual(
  updateEntryQuantityPrice(0, 500, [itemA])([
    { itemId: 1, quantity: 250, rate: 0.22 },
  ]),
  [{ itemId: 1, quantity: 500, rate: 0.22 }],
);

console.log('Quantity price tier tests passed.');
