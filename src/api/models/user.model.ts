import { BaseModel } from '@models/base.model';
import { Company } from '@models/company.model';
import { CompanyBee } from '@models/company_bee.model';

export class User extends BaseModel {

  password!: string;
  reset!: string;
  salt!: string;

  static get tableName() {
    return 'bees';
  }

  static get idColumn() {
    return 'id';
  }


  static get jsonSchema() {
    return {
      properties: {
        id: { type: 'integer' },
        firstName: { type: 'string', minLength: 1, maxLength: 45 },
        lastName: { type: 'string', minLength: 1, maxLength: 45 },
        email: { type: 'string', format: 'email', minLength: 1, maxLength: 100 },

        password: { type: 'string', minLength: 1, maxLength: 128 },
        salt: { type: 'string', minLength: 1, maxLength: 128 },

        reset: { type: 'string', minLength: 1, maxLength: 128 },
        reset_timestamp: { type: 'date-time' },

        state: { type: 'integer' },
        lang: { type: 'string', minLength: 1, maxLength:3 },
        acdate: { type: 'boolean' },
        newsletter: { type: 'boolean' },
        todo: { type: 'boolean' },
        sound: { type: 'boolean' },
        tablexscroll: { type: 'boolean' },

        source: { type: 'string', minLength: 1, maxLength: 45 },

        saved_company: { type: 'integer' },

        last_visit: { type: 'date-time' },
        created_at: { type: 'date-time' },
        updated_at: { type: 'date-time' }
      }
    };
  }


    // Omit fields for json response from model
  $formatJson(user: User): User {

    super.$formatJson(user);

    delete user.password;
    delete user.salt;
    delete user.reset;

    return user;

  }

  static get relationMappings() {
    return {
      company: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: Company,
        join: {
          from: 'bees.id',
          through: {
            modelClass: CompanyBee,
            from: 'company_bee.bee_id',
            to: 'company_bee.user_id'
          },
          to: 'companies.id'
        }
      }
    }
  }

}