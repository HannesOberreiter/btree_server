import type { FastifyReply, FastifyRequest } from 'fastify';

import { FieldSetting } from '../models/field_setting.model.js';

export default class FieldSettingController {
  static async get(req: FastifyRequest, _reply: FastifyReply) {
    const result = await FieldSetting.query()
      .select('settings')
      .first()
      .where({ bee_id: req.session.user.bee_id });
    return result || false;
  }

  static async patch(req: FastifyRequest, _reply: FastifyReply) {
    const body = req.body as any;
    const trx = await FieldSetting.startTransaction();
    try {
      const settings = JSON.parse(body.settings);
      const current = await FieldSetting.query(trx)
        .first()
        .where('bee_id', req.session.user.bee_id);
      if (current) {
        await FieldSetting.query(trx)
          .where('bee_id', req.session.user.bee_id)
          .patch({ settings });
      }
      else {
        await FieldSetting.query(trx).insert({
          bee_id: req.session.user.bee_id,
          settings,
        });
      }
      await trx.commit();
      return settings;
    }
    catch (e) {
      await trx.rollback();
      throw e;
    }
  }
}
