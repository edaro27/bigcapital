export const MAX_EMAIL_LIST_ADDRESSES = 20;
export const MAX_EMAIL_LIST_LENGTH = 1000;

/**
 * Parses a user-entered email list while preserving the first occurrence's
 * casing. Commas are the canonical separator; semicolons and newlines are
 * accepted to make pasted recipient lists forgiving.
 */
export function parseEmailList(value?: string | null): string[] {
  if (typeof value !== "string") {
    return [];
  }

  const seen = new Set<string>();

  return value
    .split(/[,;\r\n]+/)
    .map((address) => address.trim())
    .filter(Boolean)
    .filter((address) => {
      const normalizedAddress = address.toLowerCase();

      if (seen.has(normalizedAddress)) {
        return false;
      }
      seen.add(normalizedAddress);
      return true;
    });
}

/**
 * Returns the canonical persisted representation of a customer email list.
 */
export function normalizeEmailList(value?: string | null): string {
  return parseEmailList(value).join(", ");
}
