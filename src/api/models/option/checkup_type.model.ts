import { BaseOptionModel } from '@models/option/baseoption.model';

export class CheckupType extends BaseOptionModel {
  static tableName = 'checkup_types';

  constructor() {
    super();
  }
}
