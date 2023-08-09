import { Company } from './company.model.js';
import { Checkup } from './checkup.model.js';
import { Model } from 'objection';

export class CheckupApiary extends Model {
  apiary_id!: number;
  apiary_name!: string;
  user_id!: number;
  checkup_id!: number;
  checkup_date!: string;

  company?: Company;
  checkup?: Checkup;

  static tableName = 'checkups_apiaries';
  static idColumn = 'checkup_id';

  static jsonSchema = {};

  static relationMappings = () => ({
    company: {
      relation: Model.BelongsToOneRelation,
      modelClass: Company,
      join: {
        from: 'checkups_apiaries.user_id',
        to: 'companies.id',
      },
    },
    checkup: {
      relation: Model.BelongsToOneRelation,
      modelClass: Checkup,
      join: {
        from: 'checkups_apiaries.checkup_id',
        to: 'checkups.id',
      },
    },
  });
}
