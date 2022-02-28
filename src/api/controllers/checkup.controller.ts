import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { CheckupTable } from '@datatables/checkup.table';
import { Checkup } from '@models/checkup.model';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { checkItemUser } from '@utils/datatables.util';
import { map } from 'lodash';
export class CheckupController extends Controller {
  constructor() {
    super();
  }

  async getTable(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      let editor = CheckupTable.table(req);

      editor.validator(async (editor, action, data) => {
        let allowed = true;
        if (action !== undefined && action !== 'remove') {
          allowed = Guard.authorizeDataTables([ROLES.user, ROLES.admin])(
            req,
            res
          );
          if (!allowed) {
            return 'Not enough rights!';
          }
        }
        if (action === 'remove') {
          const check = await checkItemUser(data.data, req);
          allowed = Guard.authorizeDataTables([ROLES.admin])(req, res);
          if (!check || !allowed) {
            return 'Not allowed to delete or modify data!';
          }
        }
      });

      await editor.process(req.body);
      res.locals.data = editor.data();
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
  async updateStatus(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Checkup.transaction(async (trx) => {
        return Checkup.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            done: req.body.status
          })
          .findByIds(req.body.ids)
          .leftJoinRelated('checkup_apiary')
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
  async updateDate(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Checkup.transaction(async (trx) => {
        return Checkup.query(trx)
          .patch({
            edit_id: req.user.bee_id,
            date: req.body.start,
            enddate: req.body.end
          })
          .findByIds(req.body.ids)
          .leftJoinRelated('checkup_apiary')
          .where('user_id', req.user.user_id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async batchDelete(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Checkup.transaction(async (trx) => {
        const res = await Checkup.query(trx)
          .findByIds(req.body.ids)
          .select('id', 'deleted')
          .withGraphJoined('checkup_apiary')
          .where('user_id', req.user.user_id);

        const softIds = [];
        const hardIds = [];
        map(res, (obj) => {
          if (obj.deleted) hardIds.push(obj.id);
          else softIds.push(obj.id);
        });

        if (hardIds.length > 0) await Checkup.query(trx).deleteById(hardIds);
        if (softIds.length > 0)
          await Checkup.query(trx)
            .patch({
              deleted: true,
              edit_id: req.user.bee_id
            })
            .findByIds(softIds);

        return res;
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
