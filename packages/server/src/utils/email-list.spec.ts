import { normalizeEmailList, parseEmailList } from '@bigcapital/utils';

describe('customer email lists', () => {
  it('parses comma-separated addresses in their entered order', () => {
    expect(parseEmailList('owner@example.com, accounting@example.com')).toEqual(
      ['owner@example.com', 'accounting@example.com'],
    );
  });

  it('accepts pasted semicolon and newline separators', () => {
    expect(
      parseEmailList(
        'owner@example.com; accounting@example.com\norders@example.com',
      ),
    ).toEqual([
      'owner@example.com',
      'accounting@example.com',
      'orders@example.com',
    ]);
  });

  it('trims and removes duplicates without changing first-entry casing', () => {
    expect(
      normalizeEmailList(
        'Owner@Example.com, owner@example.com, accounting@example.com',
      ),
    ).toBe('Owner@Example.com, accounting@example.com');
  });
});
