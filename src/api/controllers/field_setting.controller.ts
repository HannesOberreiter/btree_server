import { FieldSetting } from '@models/field_setting.model';
import { FastifyReply, FastifyRequest } from 'fastify';

export default class FieldSettingController {
  static async get(req: FastifyRequest, reply: FastifyReply) {
    const result = await FieldSetting.query()
      .select('settings')
      .first()
      .where({ bee_id: req.session.user.bee_id });
    return result ? result : false;
  }

  static async patch(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as any;
    const trx = await FieldSetting.startTransaction();
    try {
      const settings = JSON.parse(body.settings);
      const current = await FieldSetting.query()
        .first()
        .where('bee_id', req.session.user.bee_id);
      if (current) {
        await FieldSetting.query(trx)
          .where('bee_id', req.session.user.bee_id)
          .patch({ settings: settings });
      } else {
        await FieldSetting.query(trx).insert({
          bee_id: req.session.user.bee_id,
          settings: settings,
        });
      }
      await trx.commit();
      return settings;
    } catch (e) {
      await trx.rollback();
      throw e;
    }
  }
}
