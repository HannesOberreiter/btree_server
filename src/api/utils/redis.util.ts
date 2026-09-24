import type { Buffer } from 'node:buffer';

/** Normalize the text and cursor forms handled by Redis consumers. */
export function redisValueToString(value: string | Buffer | number): string {
  return typeof value === 'string' ? value : value.toString();
}
