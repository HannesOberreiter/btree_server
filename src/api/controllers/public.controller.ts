import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Taxa } from '../models/observation.model.js';
import createHttpError from 'http-errors';
import { raw } from 'objection';
import { RedisServer } from '../../servers/redis.server.js';
import { Observation } from '../models/observation.model.js';

function mapTaxa(req: FastifyRequest) {
  const paramTaxa = (req.params as any).taxa as any;
  if (!paramTaxa) {
    throw createHttpError(400, 'Taxa is required');
  }
  const taxa: Taxa
    = paramTaxa === 'velutina' ? 'Vespa velutina' : 'Aethina tumida';
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
      return cached;
    }

    const query = Observation.query().select(
      'location',
      raw('JSON_EXTRACT(data, "$.uri") as uri'),
      'observed_at',
    );

    const start = new Date(Date.now() - 1000 * 60 * 60 * 24 * 182);
    const end = new Date(Date.now());
    query.whereBetween('observed_at', [start, end]);
    query.where('taxa', taxa);

    const result = await query;

    redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);

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
    const year = params.year;

    const query = Observation.query()
      .select(
        'location',
        raw('JSON_EXTRACT(data, "$.uri") as uri'),
        'observed_at',
      )
      .whereBetween('observed_at', [`${year}-01-01`, `${year}-12-31`])
      .where('taxa', taxa);

    const result = await query;

    return result;
  }

  static async getPestObservationsStats(
    req: FastifyRequest,
    reply: FastifyReply,
  ) {
    const taxa = mapTaxa(req);

    reply.header('Cache-Control', 'public, max-age=3600');
    const res = await Observation.query()
      .count('id as count')
      .where('taxa', taxa);
    return res[0];
  }
}
