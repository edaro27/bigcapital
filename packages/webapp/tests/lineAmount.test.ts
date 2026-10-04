import assert from 'node:assert/strict';
import { calcItemEntryRateFromTotal } from '../src/containers/Entries/lineAmount.ts';

assert.equal(calcItemEntryRateFromTotal(100, 4, 0), 25);
assert.equal(calcItemEntryRateFromTotal(90, 10, 10), 10);
assert.equal(calcItemEntryRateFromTotal(100, 3, 0), 33.3333);
assert.equal(calcItemEntryRateFromTotal('', 2, 0), 0);
assert.equal(calcItemEntryRateFromTotal(100, 0, 0), null);
assert.equal(calcItemEntryRateFromTotal(100, 5, 100), null);

console.log('Invoice line amount calculation tests passed.');
