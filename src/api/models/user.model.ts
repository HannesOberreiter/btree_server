import { ExtModel } from '@models/base.model';
import { Company } from '@models/company.model';
import { CompanyBee } from '@models/company_bee.model';
import { ModelObject } from 'objection';

export class User extends ExtModel {
  id!: number;
  email!: string;
  username!: string;
  password!: string;
  reset!: string;
  salt!: string;
  lang!: string;
  state!: number;
  acdate!: boolean;
  format!: number;
  newsletter!: boolean;
  sound!: boolean;
  saved_company!: number;
  reset_timestamp!: Date;
  last_visit!: Date;
  reminder_premium!: Date;
  reminder_deletion!: Date;
  reminder_vis!: Date;
  notice_bruteforce!: Date;

  company?: Company[];
  company_bee?: CompanyBee[];

  static tableName = 'bees';
  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    required: ['email', 'password', 'salt'],
    properties: {
      id: { type: 'integer' },
      username: { type: 'string', maxLength: 45 },
      email: { type: 'string', format: 'email', minLength: 5, maxLength: 100 },

      password: { type: 'string', minLength: 6, maxLength: 128 },
      salt: { type: 'string', minLength: 10, maxLength: 128 },

      reset: { type: 'string', maxLength: 128 },
      reset_timestamp: { type: 'string', format: 'date-time' },

      state: { type: 'integer' },
      lang: {
        type: 'string',
        minLength: 2,
        maxLength: 3,
        enum: ['de', 'en', 'it', 'fr'],
      },
      format: { type: 'number', enum: [1, 2] },
      acdate: { type: 'boolean' },
      newsletter: { type: 'boolean' },
      todo: { type: 'boolean' },
      sound: { type: 'boolean' },
      tablexscroll: { type: 'boolean' },

      source: { type: 'string', minLength: 1, maxLength: 20 },

      saved_company: { type: 'integer' },

      last_visit: { type: 'string', format: 'date-time' },
      reminder_premium: { type: 'string', format: 'date-time' },
      reminder_deletion: { type: 'string', format: 'date-time' },
      reminder_vis: { type: 'string', format: 'date-time' },
      notice_bruteforce: { type: 'string', format: 'date-time' },

      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  };

  // Omit fields for json response from model
  $formatJson(user: User): User {
    super.$formatJson(user);

    delete user.password;
    delete user.salt;
    delete user.reset;

    return user;
  }

  static get modifiers() {
    return {
      identifier(builder) {
        builder.select('email', 'username');
      },
    };
  }

  static relationMappings = () => ({
    company: {
      relation: ExtModel.ManyToManyRelation,
      modelClass: Company,
      join: {
        from: 'bees.id',
        through: {
          modelClass: CompanyBee,
          from: 'company_bee.bee_id',
          to: 'company_bee.user_id',
        },
        to: 'companies.id',
      },
    },
    company_bee: {
      relation: ExtModel.HasManyRelation,
      modelClass: CompanyBee,
      join: {
        from: 'bees.id',
        to: 'company_bee.bee_id',
      },
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type UserShape = ModelObject<User>;
