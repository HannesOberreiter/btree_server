import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';
import httpErrors from 'http-errors';

import { OPTION, SOURCE } from '../../config/constants.config.js';
import { isPremium } from '../utils/premium.util.js';

export class Validator {
  static handleOption = (
    req: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction,
  ) => {
    const params = req.params as any;
    if (!(params.table in OPTION)) {
      throw httpErrors.NotFound(`Unknown option table '${params.table}'. Valid tables: ${Object.keys(OPTION).join(', ')}`);
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
      throw httpErrors.NotFound(`Unknown source '${params.source}'. Valid sources: ${Object.keys(SOURCE).join(', ')}`);
    }
    done();
  };

  static isPremium = async (req: FastifyRequest, _reply: FastifyReply) => {
    if (!req.session.user) {
      throw httpErrors.Unauthorized('Not authenticated');
    }
    const premium = await isPremium(req.session.user.user_id).catch((_err) => {
      throw httpErrors.PaymentRequired('Could not verify premium status');
    });
    if (!premium) {
      throw httpErrors.PaymentRequired('This endpoint requires an active premium subscription');
    }
  };
}
