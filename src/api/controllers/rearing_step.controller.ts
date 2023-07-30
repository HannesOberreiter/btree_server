import { checkMySQLError } from '@utils/error.util';
import { RearingStep } from '../models/rearing/rearing_step.model';
import { FastifyRequest, FastifyReply } from 'fastify';

export default class RearingStepController {
  static async post(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const result = await RearingStep.transaction(async (trx) => {
        return await RearingStep.query(trx).insert({
          ...body,
        });
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async delete(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as any;
      const result = await RearingStep.transaction(async (trx) => {
        return await RearingStep.query(trx)
          .withGraphJoined('detail')
          .delete()
          .where('detail.user_id', req.user.user_id)
          .findById(params.id);
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async updatePosition(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const steps = body.data;
      const result = await RearingStep.transaction(async (trx) => {
        const res = [];
        for (const step of steps) {
          res.push(
            await RearingStep.query(trx)
              .withGraphJoined('detail')
              .patch({
                position: step.position,
                sleep_before: step.sleep_before,
              })
              .findById(step.id)
              .where('detail.user_id', req.user.user_id),
          );
        }
        return res;
      });
      reply.send(result);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }
}
