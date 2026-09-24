import Fastify from 'fastify';
import {
  isResponseSerializationError,
  ResponseSerializationError,
  serializerCompiler,
} from 'fastify-type-provider-zod';
import { describe, expect, it } from 'vitest';

import { apiaryPaginatedResponseSchema } from '../../src/api/schemas/apiary.schema.js';
import { parseResponse } from '../../src/api/utils/response.util.js';

const apiary = {
  id: 7,
  name: 'North apiary',
  latitude: 48,
  longitude: 14,
  modus: false,
  deleted: false,
  description: null,
  created_at: new Date('2026-09-14T12:00:00.000Z'),
  extra: 'Preserve loose response fields',
};

function createServer(value: unknown, guarded: boolean, fallbackUrl = false) {
  const server = Fastify();
  const errors: Error[] = [];
  server.setSerializerCompiler(serializerCompiler);
  server.addHook('onError', (_request, _reply, error, done) => {
    errors.push(error);
    done();
  });
  server.get(
    '/apiaries/:id',
    { schema: { response: { 200: apiaryPaginatedResponseSchema } } },
    async (request) => {
      if (!guarded) return value;
      return parseResponse(
        apiaryPaginatedResponseSchema,
        value,
        fallbackUrl
          ? {
              method: request.method,
              url: request.url,
              routeOptions: { ...request.routeOptions, url: undefined },
            }
          : request,
      );
    },
  );
  return { server, errors };
}

const url = '/apiaries/7?details=true';

describe('HTTP response boundary', () => {
  it('preserves valid output through both parsing passes, including the real Date codec', async () => {
    const value = { results: [apiary], total: 1 };
    const baseline = createServer(value, false);
    const guarded = createServer(value, true);
    try {
      const before = await baseline.server.inject({ method: 'GET', url });
      const after = await guarded.server.inject({ method: 'GET', url });

      expect(before.statusCode).toBe(200);
      expect(after.statusCode).toBe(200);
      expect(after.body).toBe(before.body);
      expect(after.json()).toEqual({
        results: [{ ...apiary, created_at: apiary.created_at.toISOString() }],
        total: 1,
      });
      expect(apiary.created_at).toBeInstanceOf(Date);
      expect(baseline.errors).toEqual([]);
      expect(guarded.errors).toEqual([]);
    } finally {
      await Promise.all([baseline.server.close(), guarded.server.close()]);
    }
  });

  it.each(['name', 'modus', 'latitude'] as const)(
    'keeps null %s failures classified as response serialization errors without dropping rows',
    async (field) => {
      const value = {
        results: [apiary, { ...apiary, [field]: null }],
        total: 2,
      };
      const baseline = createServer(value, false);
      const guarded = createServer(value, true);
      try {
        const before = await baseline.server.inject({ method: 'GET', url });
        const after = await guarded.server.inject({ method: 'GET', url });

        expect(before.statusCode).toBe(500);
        expect(after.statusCode).toBe(500);
        expect(after.body).toBe(before.body);
        expect(after.json()).toMatchObject({
          code: 'FST_ERR_RESPONSE_SERIALIZATION',
          message: "Response doesn't match the schema",
          statusCode: 500,
        });
        expect(baseline.errors).toHaveLength(1);
        expect(guarded.errors).toHaveLength(1);
        const original = baseline.errors[0];
        const error = guarded.errors[0];
        expect(original).toBeInstanceOf(ResponseSerializationError);
        expect(error).toBeInstanceOf(ResponseSerializationError);
        if (
          !(original instanceof ResponseSerializationError) ||
          !(error instanceof ResponseSerializationError)
        ) {
          throw new Error('Expected response serialization errors');
        }
        expect(isResponseSerializationError(error)).toBe(true);
        expect(error.method).toBe(original.method);
        expect(error.method).toBe('GET');
        expect(error.url).toBe(original.url);
        expect(error.url).toBe('/apiaries/:id');
        expect(error.cause.issues).toEqual(original.cause.issues);
        expect(error.cause.issues[0]?.path).toEqual(['results', 1, field]);
      } finally {
        await Promise.all([baseline.server.close(), guarded.server.close()]);
      }
    },
  );

  it('uses the request URL when route URL is unavailable', async () => {
    const { server, errors } = createServer(
      { results: [{ ...apiary, name: null }], total: 1 },
      true,
      true,
    );
    try {
      const response = await server.inject({ method: 'GET', url });
      expect(response.statusCode).toBe(500);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeInstanceOf(ResponseSerializationError);
      expect(errors[0]).toMatchObject({
        code: 'FST_ERR_RESPONSE_SERIALIZATION',
        method: 'GET',
        url,
      });
    } finally {
      await server.close();
    }
  });
});
