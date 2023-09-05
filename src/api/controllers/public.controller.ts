import { FastifyRequest, FastifyReply } from 'fastify';
import { Observation } from '../models/observation.model.js';
import { raw } from 'objection';
import { RedisServer } from '../../servers/redis.server.js';

export default class PublicController {
  static async getVelutinaObservationsRecent(
    _req: FastifyRequest,
    reply: FastifyReply,
  ) {
    reply.header('Cache-Control', 'public, max-age=21600');

    const redis = RedisServer.client;
    const cached = await redis.get('cache:velutinaObservationsRecent');
    if (cached) {
      return cached;
    }

    const start = new Date(Date.now() - 1000 * 60 * 60 * 24 * 182);
    const end = new Date(Date.now());
    const result = await Observation.query()
      .select(
        'location',
        raw('JSON_EXTRACT(data, "$.uri") as uri'),
        'observed_at',
      )
      .whereBetween('observed_at', [start, end]);

    redis.set(
      'cache:velutinaObservationsRecent',
      JSON.stringify(result),
      'EX',
      21600,
    );

    return result;
  }

  static async getVelutinaObservationsStats(
    _req: FastifyRequest,
    reply: FastifyReply,
  ) {
    reply.header('Cache-Control', 'public, max-age=21600');
    const res = await Observation.query().count('id as count');
    return res[0];
  }

  static async getVelutinaObservationsArray(
    _req: FastifyRequest,
    reply: FastifyReply,
  ) {
    reply.header('Cache-Control', 'public, max-age=21600');

    const redis = RedisServer.client;
    const cached = await redis.get('cache:velutinaObservationsArray');
    if (cached) {
      return cached;
    }

    const result = await Observation.query().select('location');
    const res = [];
    for (const r of result) {
      res.push([(r as any).location.x, (r as any).location.y]);
    }

    redis.set(
      'cache:velutinaObservationsArray',
      JSON.stringify(res),
      'EX',
      21600,
    );

    return res;
  }
}
