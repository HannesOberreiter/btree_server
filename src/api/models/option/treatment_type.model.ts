import { BaseOptionModel } from '@models/option/baseoption.model';

export class TreatmentType extends BaseOptionModel {
  static tableName = 'treatment_types';

  constructor() {
    super();
  }
}
