import { RearingStep } from '../models/rearing/rearing_step.model';
import { FastifyRequest, FastifyReply } from 'fastify';

export default class RearingStepController {
  static async post(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const result = await RearingStep.transaction(async (trx) => {
      return await RearingStep.query(trx).insert({
        ...body,
      });
    });
    return { ...result };
  }

  static async delete(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as any;
    const result = await RearingStep.transaction(async (trx) => {
      const result = await RearingStep.query(trx)
        .delete()
        .withGraphJoined('detail')
        .where('detail.user_id', req.session.user.user_id)
        .findById(params.id);
      return result;
    });
    return result;
  }

  static async updatePosition(req: FastifyRequest, reply: FastifyReply) {
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
            .where('detail.user_id', req.session.user.user_id),
        );
      }
      return res;
    });
    return result;
  }
}
