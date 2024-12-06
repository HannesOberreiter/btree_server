import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  getMovements,
  getRearings,
  getScaleData,
  getTask,
  getTodos,
} from '../utils/calendar.util.js';

export default class CalendarController {
  static async getRearings(req: FastifyRequest, _reply: FastifyReply) {
    const result = await getRearings(req.query, req.session.user);
    return result;
  }

  static async getTodos(req: FastifyRequest, _reply: FastifyReply) {
    const result = await getTodos(req.query, req.session.user);
    return result;
  }

  static async getMovements(req: FastifyRequest, _reply: FastifyReply) {
    const result = await getMovements(req.query, req.session.user);
    return result;
  }

  static async getCheckups(req: FastifyRequest, _reply: FastifyReply) {
    const result = await getTask(req.query, req.session.user, 'checkup');
    return result;
  }

  static async getTreatments(req: FastifyRequest, _reply: FastifyReply) {
    const result = await getTask(req.query, req.session.user, 'treatment');
    return result;
  }

  static async getHarvests(req: FastifyRequest, _reply: FastifyReply) {
    const result = await getTask(req.query, req.session.user, 'harvest');
    return result;
  }

  static async getFeeds(req: FastifyRequest, _reply: FastifyReply) {
    const result = await getTask(req.query, req.session.user, 'feed');
    return result;
  }

  static async getScaleData(req: FastifyRequest, _reply: FastifyReply) {
    const result = await getScaleData(req.query, req.session.user);
    return result;
  }
}
