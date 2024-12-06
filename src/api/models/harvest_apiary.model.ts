import { Model } from 'objection';
import { Company } from './company.model.js';
import { Harvest } from './harvest.model.js';

export class HarvestApiary extends Model {
  apiary_id!: number;
  apiary_name!: string;
  user_id!: number;
  harvest_id!: number;
  harvest_date!: string;

  company?: Company;
  harvest?: Harvest;

  static tableName = 'harvests_apiaries';
  static idColumn = 'harvest_id';

  static jsonSchema = {};

  static relationMappings = () => ({
    company: {
      relation: Model.BelongsToOneRelation,
      modelClass: Company,
      join: {
        from: 'harvests_apiaries.user_id',
        to: 'companies.id',
      },
    },
    harvest: {
      relation: Model.BelongsToOneRelation,
      modelClass: Harvest,
      join: {
        from: 'harvests_apiaries.harvest_id',
        to: 'harvests.id',
      },
    },
  });
}
