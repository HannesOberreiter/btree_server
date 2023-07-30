import { checkMySQLError } from '@utils/error.util';
import { FieldSetting } from '@models/field_setting.model';
import { FastifyReply, FastifyRequest } from 'fastify';

export default class FieldSettingController {
  static async get(req: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await FieldSetting.query()
        .select('settings')
        .first()
        .where({ bee_id: req.user.bee_id });
      reply.send(result ? result : false);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async patch(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const trx = await FieldSetting.startTransaction();
    try {
      const settings = JSON.parse(body.settings);
      const current = await FieldSetting.query()
        .first()
        .where('bee_id', req.user.bee_id);
      if (current) {
        await FieldSetting.query(trx)
          .where('bee_id', req.user.bee_id)
          .patch({ settings: settings });
      } else {
        await FieldSetting.query(trx).insert({
          bee_id: req.user.bee_id,
          settings: settings,
        });
      }
      await trx.commit();
      reply.send(settings);
    } catch (e) {
      await trx.rollback();
      reply.send(checkMySQLError(e));
    }
  }
}
