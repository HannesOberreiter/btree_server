import { BaseModel } from '@models/base.model';

export class CompanyBee extends BaseModel {

  static get tableName() {
    return 'company_bee';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      properties: {
        id: { type: 'integer' },
        user_id: { type: 'integer' }, // Company FK
        bee_id: { type: 'integer' }, // User FK
        rank: { type: 'integer' }
      }
    };
  }

}