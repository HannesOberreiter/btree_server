import { FastifyReply, FastifyRequest } from 'fastify';

import {
  getTask,
  getMovements,
  getTodos,
  getRearings,
  getScaleData,
} from '../utils/calendar.util.js';

export default class CalendarController {
  static async getRearings(req: FastifyRequest, reply: FastifyReply) {
    const result = await getRearings(req.query, req.session.user);
    return result;
  }

  static async getTodos(req: FastifyRequest, reply: FastifyReply) {
    const result = await getTodos(req.query, req.session.user);
    return result;
  }

  static async getMovements(req: FastifyRequest, reply: FastifyReply) {
    const result = await getMovements(req.query, req.session.user);
    return result;
  }

  static async getCheckups(req: FastifyRequest, reply: FastifyReply) {
    const result = await getTask(req.query, req.session.user, 'checkup');
    return result;
  }

  static async getTreatments(req: FastifyRequest, reply: FastifyReply) {
    const result = await getTask(req.query, req.session.user, 'treatment');
    return result;
  }

  static async getHarvests(req: FastifyRequest, reply: FastifyReply) {
    const result = await getTask(req.query, req.session.user, 'harvest');
    return result;
  }

  static async getFeeds(req: FastifyRequest, reply: FastifyReply) {
    const result = await getTask(req.query, req.session.user, 'feed');
    return result;
  }

  static async getScaleData(req: FastifyRequest, reply: FastifyReply) {
    const result = await getScaleData(req.query, req.session.user);
    return result;
  }
}
