import type { FastifyReply, FastifyRequest } from 'fastify';
import createHttpError from 'http-errors';

import { RedisServer } from '../../servers/redis.server.js';
import type { Taxa } from '../models/observation.model.js';
import { ObservationModel } from '../models/observation.model.js';

function mapTaxa(req: FastifyRequest): Taxa {
  const paramTaxa = (req.params as any).taxa as any;
  if (!paramTaxa) {
    throw createHttpError(400, 'Taxa is required');
  }
  const taxa: Taxa =
    paramTaxa === 'velutina' ? 'Vespa velutina' : 'Aethina tumida';
  return taxa;
}

export function buildRedisCacheKeyObservationsRecent(taxa: Taxa) {
  return `cache:${taxa}ObservationsRecent`;
}

export default class PublicController {
  static async getPestObservationsRecent(
    req: FastifyRequest,
    reply: FastifyReply,
  ) {
    const taxa = mapTaxa(req);

    reply.header('Cache-Control', 'public, max-age=3600');
    const cacheKey = buildRedisCacheKeyObservationsRecent(taxa);

    const redis = RedisServer.client;
    const cached = await redis.get(cacheKey);
    if (cached) {
      reply.header('Content-Type', 'application/json');
      return reply.send(cached);
    }

    const result = await ObservationModel.getRecent(taxa);

    redis.set(cacheKey, JSON.stringify(result), { EX: 3600 });

    return result;
  }

  static async getPestObservationsYear(
    req: FastifyRequest,
    reply: FastifyReply,
  ) {
    const taxa = mapTaxa(req);

    reply.header('Cache-Control', 'public, max-age=3600');
    const params = req.params as any;
    if (!params.year) {
      return [];
    }
    const year = Number(params.year);

    const cacheKey = `cache:${taxa}ObservationsYear:${year}`;
    const redis = RedisServer.client;
    const cached = await redis.get(cacheKey);
    if (cached) {
      reply.header('Content-Type', 'application/json');
      return reply.send(cached);
    }

    const result = await ObservationModel.getByYear(taxa, year);

    redis.set(cacheKey, JSON.stringify(result), { EX: 3600 });

    return result;
  }

  static async getPestObservationsStats(
    req: FastifyRequest,
    reply: FastifyReply,
  ) {
    const taxa = mapTaxa(req);

    reply.header('Cache-Control', 'public, max-age=3600');
    const result = await ObservationModel.countByTaxa(taxa);
    return result;
  }
}
