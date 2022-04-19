import { Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { FieldSetting } from '@models/field_setting.model';
import { OK } from 'http-status';
export class FieldSettingController extends Controller {
  constructor() {
    super();
  }
  async get(req: IUserRequest, res: Response, next) {
    try {
      const result = await FieldSetting.query()
        .select('settings')
        .findById(req.user.bee_id);
      res.locals.data = result ? result : false;
      next();
    } catch (e) {
      next();
    }
  }
  async patch(req: IUserRequest, res: Response, next) {
    const trx = await FieldSetting.startTransaction();
    try {
      const settings = JSON.parse(req.body.settings);
      console.log(settings);
      const current = await FieldSetting.query().findById(req.user.bee_id);
      if (current) {
        await FieldSetting.query(trx)
          .findById(req.user.bee_id)
          .patch({ settings: settings });
      } else {
        await FieldSetting.query(trx).insert({
          bee_id: req.user.bee_id,
          settings: settings,
        });
      }
      const result = await trx.commit();
      res.locals.data = result;
      next();
    } catch (e) {
      await trx.rollback();
      next(checkMySQLError(e));
    }
  }
}
