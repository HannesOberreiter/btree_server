import { z } from 'zod';

import { numberSchema } from '../utils/zod.util.js';

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

const nullableQueryStringSchema = z.string().nullable().optional();
const nullableQueryBooleanSchema = z.boolean().nullable().optional();
const nullableQueryNumberSchema = numberSchema.nullable().optional();
const queryStringListSchema = z
  .union([z.string(), z.array(z.string())])
  .nullable()
  .optional();
const queryDirectionSchema = z
  .union([z.enum(['asc', 'desc']), z.array(z.enum(['asc', 'desc']))])
  .nullable()
  .optional();

/**
 * Shared compatibility shape for legacy list/filter endpoints. Unknown keys stay
 * intact while common inputs gain validation, coercion, and OpenAPI types.
 */
export const compatibilityQuerySchema = z
  .object({
    order: queryStringListSchema,
    direction: queryDirectionSchema,
    offset: nullableQueryNumberSchema,
    limit: nullableQueryNumberSchema,
    q: nullableQueryStringSchema,
    filters: nullableQueryStringSchema,
    deleted: nullableQueryBooleanSchema,
    done: nullableQueryBooleanSchema,
    details: nullableQueryBooleanSchema,
    modus: nullableQueryBooleanSchema,
    latest: nullableQueryBooleanSchema,
    hard: nullableQueryBooleanSchema,
    restore: nullableQueryBooleanSchema,
    date: nullableQueryStringSchema,
    start: nullableQueryStringSchema,
    end: nullableQueryStringSchema,
    from: nullableQueryStringSchema,
    to: nullableQueryStringSchema,
    year: nullableQueryNumberSchema,
    apiary: nullableQueryNumberSchema,
    type: nullableQueryNumberSchema,
    action: nullableQueryStringSchema,
    datetime: nullableQueryStringSchema,
    weight: nullableQueryStringSchema,
    temp1: nullableQueryStringSchema,
    temp2: nullableQueryStringSchema,
    hum: nullableQueryStringSchema,
    rain: nullableQueryStringSchema,
    note: nullableQueryStringSchema,
    latitude: nullableQueryStringSchema,
    longitude: nullableQueryStringSchema,
    start_date: nullableQueryStringSchema,
    end_date: nullableQueryStringSchema,
  })
  .loose();

export type CompatibilityQuery = z.infer<typeof compatibilityQuerySchema>;

/** Common numeric path parameter. */
export const idParamsSchema = z.object({ id: numberSchema });
