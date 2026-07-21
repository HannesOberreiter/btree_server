import { sql } from 'kysely';

/**
 * Use database UTC time while keeping timestamps application-controlled.
 * MariaDB returns the existing `YYYY-MM-DD HH:mm:ss` wire format through
 * mysql2's `dateStrings` configuration.
 */
export function insertTimestamps() {
  const now = sql<Date>`UTC_TIMESTAMP()`;
  return { created_at: now, updated_at: now };
}

export function updateTimestamp() {
  return { updated_at: sql<Date>`UTC_TIMESTAMP()` };
}
