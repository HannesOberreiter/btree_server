import { User } from '@models/user.model';
import { Model } from 'objection';

export class LoginAttemp extends Model {

  id!: number;
  time!: Date;
  bee_id!: number;

  user?: User

  static tableName = 'login_attempts';

  static idColumn = 'id';

  static jsonSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        time: { type: 'date-time' },
        bee_id: { type: 'integer' }, // User FK
    },
  }

 static relationMappings = () => ({
    user: {
        relation: Model.HasOneRelation,
        modelClass: User,
        join: {
            from: [
            'login_attempts.bee_id'
            ],
            to: [
            'bees.id'
            ]
        }
    }
  });

}