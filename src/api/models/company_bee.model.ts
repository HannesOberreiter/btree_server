import { User } from '@models/user.model';
import { Company } from '@models/company.model';
import { Model } from 'objection';

export class CompanyBee extends Model {
  id!: number;
  user_id!: number;
  bee_id!: number;
  rank!: number;

  company?: Company;
  user?: User;

  static tableName = 'company_bee';
  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      user_id: { type: 'integer' }, // Company FK
      bee_id: { type: 'integer' }, // User FK
      rank: { type: 'integer' }
    }
  };

  static relationMappings = () => ({
    company: {
      relation: Model.BelongsToOneRelation,
      modelClass: Company,
      join: {
        from: 'company_bee.user_id',
        to: 'companies.id'
      }
    },
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'company_bee.bee_id',
        to: 'bees.id'
      }
    }
  });
}
