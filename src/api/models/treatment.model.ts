import { ExtModel } from './base.model.js';
import { Hive } from './hive.model.js';
import { User } from './user.model.js';
import { TreatmentType } from './option/treatment_type.model.js';
import { TreatmentDisease } from './option/treatment_disease.model.js';
import { TreatmentVet } from './option/treatment_vet.model.js';
import { TreatmentApiary } from './treatment_apiary.model.js';
export class Treatment extends ExtModel {
  id!: number;
  date!: Date;
  enddate!: Date;
  amount!: number;
  wait!: number;
  temperature!: number;
  note!: string;
  url!: string;
  done!: boolean;
  deleted!: boolean;

  user_id!: number;
  edit_id!: number;
  bee_id!: number;
  hive_id!: number;

  static tableName = 'treatments';
  static idColumn = 'id';

  type?: TreatmentType;
  disease?: TreatmentDisease;
  vet?: TreatmentVet;
  treatment_apiary?: TreatmentApiary;
  hive?: Hive;
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
      temperature: { type: 'number' },

      note: { type: 'string', maxLength: 2000 },
      url: { type: 'string', maxLength: 512 },

      done: { type: 'boolean' },

      deleted: { type: 'boolean' },
      deleted_at: { type: 'string', format: 'date-time' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },

      user_id: { type: 'integer' }, // Company FK
      hive_id: { type: 'integer' }, // Hive FK
      type_id: { type: 'integer' }, // Type FK
      vet_id: { type: 'integer' }, // Vets FK
      disease_id: { type: 'integer' }, // Diseases FK
      bee_id: { type: 'integer' }, // Creator Bee FK
      edit_id: { type: 'integer' }, // Updater Bee FK
    },
  };

  static relationMappings = () => ({
    type: {
      relation: ExtModel.HasOneRelation,
      modelClass: TreatmentType,
      join: {
        from: ['treatments.type_id'],
        to: ['treatment_types.id'],
      },
    },
    disease: {
      relation: ExtModel.HasOneRelation,
      modelClass: TreatmentDisease,
      join: {
        from: ['treatments.disease_id'],
        to: ['treatment_diseases.id'],
      },
    },
    vet: {
      relation: ExtModel.HasOneRelation,
      modelClass: TreatmentVet,
      join: {
        from: ['treatments.vet_id'],
        to: ['treatment_vets.id'],
      },
    },
    hive: {
      relation: ExtModel.HasOneRelation,
      modelClass: Hive,
      join: {
        from: ['treatments.hive_id'],
        to: ['hives.id'],
      },
    },
    treatment_apiary: {
      relation: ExtModel.HasOneRelation,
      modelClass: TreatmentApiary,
      join: {
        from: ['treatments.id'],
        to: ['treatments_apiaries.treatment_id'],
      },
    },
    creator: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['treatments.bee_id'],
        to: ['bees.id'],
      },
    },
    editor: {
      relation: ExtModel.HasOneRelation,
      modelClass: User,
      join: {
        from: ['treatments.edit_id'],
        to: ['bees.id'],
      },
    },
  });
}
