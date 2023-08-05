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
      done(new httpErrors.NotFound());
      return;
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
      done(httpErrors.NotFound());
      return;
    }
    done();
  };
  static isPremium = async (req: FastifyRequest, reply: FastifyReply) => {
    const premium = await isPremium(req.session.user.user_id);
    if (!premium) {
      reply.send(httpErrors.PaymentRequired());
      return reply;
    }
    return;
  };
}
