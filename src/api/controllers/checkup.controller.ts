import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { CheckupTable } from '@datatables/checkup.table';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { checkItemUser } from '@utils/datatables.util';

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
}
