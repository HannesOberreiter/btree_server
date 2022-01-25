import { BaseOptionModel } from '@models/option/baseoption.model';

export class HiveSource extends BaseOptionModel {
  static tableName = 'hive_sources';

  constructor() {
    super();
  }
}
