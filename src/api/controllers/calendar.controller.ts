import type { FastifyReply, FastifyRequest } from 'fastify';

import type {
  CalendarRangeQuery,
  CalendarRearingQuery,
} from '../schemas/calendar.schema.js';
import {
  getMovements,
  getRearings,
  getScaleData,
  getTask,
  getTodos,
} from '../utils/calendar.util.js';

export default class CalendarController {
  static async getRearings(req: FastifyRequest, _reply: FastifyReply) {
    const query = req.query as CalendarRearingQuery;
    const result = await getRearings(query, req.session.user);
    return result;
  }

  static async getTodos(req: FastifyRequest, _reply: FastifyReply) {
    const query = req.query as CalendarRangeQuery;
    const result = await getTodos(query, req.session.user);
    return result;
  }

  static async getMovements(req: FastifyRequest, _reply: FastifyReply) {
    const query = req.query as CalendarRangeQuery;
    const result = await getMovements(query, req.session.user);
    return result;
  }

  static async getCheckups(req: FastifyRequest, _reply: FastifyReply) {
    const query = req.query as CalendarRangeQuery;
    const result = await getTask(query, req.session.user, 'checkup');
    return result;
  }

  static async getTreatments(req: FastifyRequest, _reply: FastifyReply) {
    const query = req.query as CalendarRangeQuery;
    const result = await getTask(query, req.session.user, 'treatment');
    return result;
  }

  static async getHarvests(req: FastifyRequest, _reply: FastifyReply) {
    const query = req.query as CalendarRangeQuery;
    const result = await getTask(query, req.session.user, 'harvest');
    return result;
  }

  static async getFeeds(req: FastifyRequest, _reply: FastifyReply) {
    const query = req.query as CalendarRangeQuery;
    const result = await getTask(query, req.session.user, 'feed');
    return result;
  }

  static async getScaleData(req: FastifyRequest, _reply: FastifyReply) {
    const query = req.query as CalendarRangeQuery;
    const result = await getScaleData(query, req.session.user);
    return result;
  }
}
