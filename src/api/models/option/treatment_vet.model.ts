import { BaseOptionModel } from '@models/option/baseoption.model';

export class TreatmentVet extends BaseOptionModel {
  static tableName = 'treatment_vets';

  constructor() {
    super();
    const newSchema: any = BaseOptionModel.jsonSchema;
    newSchema.properties.note = { type: 'string' };
    TreatmentVet.jsonSchema = newSchema;
  }
}
