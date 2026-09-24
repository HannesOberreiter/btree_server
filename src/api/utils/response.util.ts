import type { FastifyRequest } from 'fastify';
import { ResponseSerializationError } from 'fastify-type-provider-zod';
import type { output, ZodType } from 'zod';

export function parseResponse<T extends ZodType>(
  schema: T,
  value: unknown,
  request: Pick<FastifyRequest, 'method' | 'url' | 'routeOptions'>,
): output<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ResponseSerializationError(
      request.method,
      request.routeOptions.url ?? request.url,
      { cause: result.error },
    );
  }
  return result.data;
}
