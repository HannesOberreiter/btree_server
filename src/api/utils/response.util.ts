import type { FastifyRequest } from 'fastify';
import { ResponseSerializationError } from 'fastify-type-provider-zod';
import type { input, output, ZodType } from 'zod';
import { safeEncode } from 'zod/v4/core';

export function parseResponse<T extends ZodType>(
  schema: T,
  value: unknown,
  request: Pick<FastifyRequest, 'method' | 'url' | 'routeOptions'>,
): input<T> {
  // safeEncode validates the unknown response despite requiring a typed input.
  const result = safeEncode(schema, value as output<T>);
  if (!result.success) {
    throw new ResponseSerializationError(
      request.method,
      request.routeOptions.url ?? request.url,
      { cause: result.error },
    );
  }
  return result.data;
}
