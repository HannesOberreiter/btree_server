import { ExtModel } from '@models/base.model';
import { Hive } from '@models/hive.model';
import { User } from '@models/user.model';
import { TreatmentType } from '@models/option/treatment_type.model';
import { TreatmentDisease } from '@models/option/treatment_disease.model';
import { TreatmentVet } from '@models/option/treatment_vet.model';
import { TreatmentApiary } from '@models/treatment_apiary.model';
export class Treatment extends ExtModel {
  id!: number;
  date!: Date;
  enddate!: Date;
  amount!: number;
  wait!: number;
  note!: string;
  url!: string;
  done!: boolean;
  deleted!: boolean;
  edit_id!: number;

  static tableName = 'treatments';
  static idColumn = 'id';

  type?: TreatmentType;
  disease?: TreatmentDisease;
  vet?: TreatmentVet;
  treatment_apiary?: TreatmentApiary;
  company?: Hive;
  creator?: User;
  editor?: User;

  static jsonSchema = {
    type: 'object',
    required: ['date', 'hive_id'],
    properties: {
      id: { type: 'integer' },
      date: { type: 'string', format: 'date' },
      enddate: { type: 'string', format: 'date' },
      amount: { type: 'number' },
      wait: { type: 'number' },

      note: { type: 'string', maxLength: 2000 },
      url: { type: 'string', maxLength: 512 },

      done: { type: 'boolean' },

      deleted: { type: 'boolean' },
      deleted_at: { type: 'string', format: 'date-time' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },

      type_id: { type: 'integer' }, // Type FK
      vet_id: { type: 'integer' }, // Vets FK
      disease_id: { type: 'integer' }, // Diseases FK
      user_id: { type: 'integer' }, // Company FK
      bee_id: { type: 'integer' }, // Creator Bee FK
      edit_id: { type: 'integer' } // Updater Bee FK
    }
  };

  static relationMappings = () => ({
    type: {
      relation: ExtModel.HasOneRelation,
      modelClass: TreatmentType,
      join: {
        from: ['treatments.type_id'],
        to: ['treatment_types.id']
      }
    },
    disease: {
      relation: ExtModel.HasOneRelation,
      modelClass: TreatmentDisease,
      join: {
        from: ['treatments.disease_id'],
        to: ['treatment_diseases.id']
      }
    },
    vet: {
      relation: ExtModel.HasOneRelation,
      modelClass: TreatmentVet,
      join: {
        from: ['treatments.vet_id'],
        to: ['treatment_vets.id']
      }
    },
    hive: {
      relation: ExtModel.HasOneRelation,
      modelClass: Hive,
      join: {
        from: ['treatments.hive_id'],
        to: ['hives.id']
      }
    },
    treatment_apiary: {
      relation: ExtModel.HasOneRelation,
      modelClass: TreatmentApiary,
      join: {
        from: ['treatments_apiaries.treatment_id'],
        to: ['treatments.id']
      }
    },
    creator: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['treatments.bee_id'],
        to: ['bees.id']
      }
    },
    editor: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['treatments.edit_id'],
        to: ['bees.id']
      }
    }
  });
}
