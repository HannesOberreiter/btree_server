import { checkMySQLError } from '@utils/error.util';
import {
  getTask,
  getMovements,
  getTodos,
  getRearings,
  getScaleData,
} from '@utils/calendar.util';
import { FastifyReply, FastifyRequest } from 'fastify';
export default class CalendarController {
  static async getRearings(req: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await getRearings(req as any);
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async getTodos(req: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await getTodos(req as any);
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async getMovements(req: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await getMovements(req as any);
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async getCheckups(req: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await getTask(req as any, 'checkup');
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async getTreatments(req: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await getTask(req as any, 'treatment');
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async getHarvests(req: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await getTask(req as any, 'harvest');
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async getFeeds(req: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await getTask(req as any, 'feed');
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async getScaleData(req: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await getScaleData(req as any);
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }
}
