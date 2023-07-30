import { OPTION, SOURCE } from '@/config/constants.config';
import { isPremium } from '../utils/premium.util';
import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';
import httpErrors from 'http-errors';

export class Validator {
  static handleOption = (
    req: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction,
  ) => {
    const params = req.params as any;
    if (!(params.table in OPTION)) {
      reply.send(new httpErrors.NotFound());
    }
    done();
  };
  static handleSource = (
    req: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction,
  ) => {
    const params = req.params as any;
    if (!(params.source in SOURCE)) {
      reply.send(new httpErrors.NotFound());
    }
    done();
  };
  static isPremium = async (
    req: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction,
  ) => {
    if (!(await isPremium(req.user.user_id))) {
      reply.send(httpErrors.PaymentRequired());
    }
    done();
  };
}
