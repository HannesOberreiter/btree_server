import { BaseModel } from '@models/base.model';
import { Company } from '@models/company.model';
import { CompanyBee } from '@models/company_bee.model';

export class User extends BaseModel {

  id!: number;
  password!: string;
  reset!: string;
  salt!: string;
  state!: number;
  saved_company!: number;

  last_visit!: Date;

  company?: Company[]
  company_bee?: CompanyBee[]

  static tableName = 'bees';
  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    required: ['email', 'password', 'salt'],
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

  // Omit fields for json response from model
  $formatJson(user: User): User {

    super.$formatJson(user);

    delete user.password;
    delete user.salt;
    delete user.reset;

    return user;

  };

  static relationMappings = () => ({
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
    },
    company_bee: {
      relation: BaseModel.HasManyRelation,
      modelClass: CompanyBee,
      join: {
        from: 'bees.id',
        to: 'company_bee.id'
      }
    }
  });

}