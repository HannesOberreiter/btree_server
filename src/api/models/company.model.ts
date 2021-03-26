import { BaseModel } from '@models/base.model';
import { User } from '@models/user.model';
import { CompanyBee } from '@models/company_bee.model';
import Moment from 'moment';
export class Company extends BaseModel {

  id!: number;
  name!: string;
  dropbox_auth!: string;
  image!: string;
  paid!: string;

  static tableName = "companies";
  static idColumn = "id";

  user?: User[]

  isPaid(): boolean {
    return Moment(this.paid) > Moment();
  }

  static jsonSchema = {
    type: 'object',
    required: ['name'],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', minLength: 1, maxLength: 45 },
      paid: { type: 'date' },

      image: { type: 'string', minLength: 1, maxLength: 65 },
      api_key: { type: 'string', minLength: 1, maxLength: 65 },
      dropbox_auth: { type: 'string', minLength: 1, maxLength: 65 },

      created_at: { type: 'date-time' },
      updated_at: { type: 'date-time' }
    }
  };

  // Omit fields for json response from model
  $formatJson(company: Company): Company {

    super.$formatJson(company);

    delete company.dropbox_auth;
    delete company.image;

    return company;

  }

  static relationMappings = () => ({
    user: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: User,
      join: {
        from: 'companies.id',
        through: {
          modelClass: CompanyBee,
          from: 'company_bee.user_id',
          to: 'company_bee.bee_id'
        },
        to: 'bees.id'
      }
    }
  });

}