import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { TreatmentTable } from '@datatables/treatment.table';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
export class TreatmentController extends Controller {
  constructor() {
    super();
  }

  async getTable(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      let editor = TreatmentTable.table(req);

      editor.on('preDelete', (_editor, _values) => {
        Guard.authorize([ROLES.admin])(req, res, next);
      });
      editor.on('preCreate', (_editor, _values) => {
        Guard.authorize([ROLES.user, ROLES.admin])(req, res, next);
      });
      editor.on('preEdit', (_editor, _values) => {
        Guard.authorize([ROLES.user, ROLES.admin])(req, res, next);
      });

      await editor.process(req.body);
      res.locals.data = editor.data();
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
