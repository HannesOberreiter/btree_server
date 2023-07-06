import { Company } from '@models/company.model';
import { Treatment } from '@models/treatment.model';
import { Model } from 'objection';

export class TreatmentApiary extends Model {
  apiary_id!: number;
  apiary_name!: string;
  user_id!: number;
  treatment_id!: number;
  treatment_date!: string;

  company?: Company;
  treatment?: Treatment;

  static tableName = 'treatments_apiaries';
  static idColumn = 'treatment_id';

  static jsonSchema = {};

  static relationMappings = () => ({
    company: {
      relation: Model.BelongsToOneRelation,
      modelClass: Company,
      join: {
        from: 'treatments_apiaries.user_id',
        to: 'companies.id',
      },
    },
    treatment: {
      relation: Model.BelongsToOneRelation,
      modelClass: Treatment,
      join: {
        from: 'treatments_apiaries.treatment_id',
        to: 'treatments_id.id',
      },
    },
  });
}
