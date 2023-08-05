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
    const result = await getRearings(req.params, req.session.user);
    return result;
  }

  static async getTodos(req: FastifyRequest, reply: FastifyReply) {
    const result = await getTodos(req.params, req.session.user);
    return result;
  }

  static async getMovements(req: FastifyRequest, reply: FastifyReply) {
    const result = await getMovements(req.params, req.session.user);
    return result;
  }

  static async getCheckups(req: FastifyRequest, reply: FastifyReply) {
    const result = await getTask(req.params, req.session.user, 'checkup');
    return result;
  }

  static async getTreatments(req: FastifyRequest, reply: FastifyReply) {
    const result = await getTask(req.params, req.session.user, 'treatment');
    return result;
  }

  static async getHarvests(req: FastifyRequest, reply: FastifyReply) {
    const result = await getTask(req.params, req.session.user, 'harvest');
    return result;
  }

  static async getFeeds(req: FastifyRequest, reply: FastifyReply) {
    const result = await getTask(req.params, req.session.user, 'feed');
    return result;
  }

  static async getScaleData(req: FastifyRequest, reply: FastifyReply) {
    const result = await getScaleData(req.params, req.session.user);
    return result;
  }
}
