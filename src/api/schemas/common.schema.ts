import { z } from 'zod';

/** Serialize database Date instances exactly as JSON.stringify did before. */
export const jsonDateSchema = z.codec(
  z.union([z.string(), z.date()]),
  z.string(),
  {
    decode: (value) => (value instanceof Date ? value.toISOString() : value),
    encode: (value) => value,
  },
);

/**
 * Compatibility schema for existing JSON endpoints whose response shape has
 * not been narrowed yet. Parsing unknown values leaves runtime output intact.
 * Replace this route-by-route with a named response schema.
 */
export const permissiveJsonResponseSchema = z.unknown();

/** Preserve existing bodies while still routing them through Zod. */
export const permissiveRequestSchema = z.unknown();

/** Preserve existing query and path keys without coercion or stripping. */
export const permissiveObjectSchema = z.object({}).loose();
