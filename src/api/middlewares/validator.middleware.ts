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
      throw new httpErrors.NotFound();
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
      throw httpErrors.NotFound();
    }
    done();
  };
  static isPremium = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.session.user) {
      throw httpErrors.Unauthorized();
    }
    const premium = await isPremium(req.session.user.user_id).catch((_err) => {
      throw httpErrors.PaymentRequired();
    });
    if (!premium) {
      throw httpErrors.PaymentRequired();
    }
    return;
  };
}
