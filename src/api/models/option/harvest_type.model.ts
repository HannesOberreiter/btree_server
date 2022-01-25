import { BaseOptionModel } from '@models/option/baseoption.model';

export class HarvestType extends BaseOptionModel {
  static tableName = 'harvest_types';

  constructor() {
    super();
  }
}
