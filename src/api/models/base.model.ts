import { Model } from 'objection';

export class BaseModel extends Model {
  created_at!: string;
  updated_at!: string;

  constructor() {
    super();
  }

  // https://github.com/Vincit/objection.js/issues/647
  $beforeInsert() {
    this.created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    delete this.updated_at;
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    delete this.created_at;
  }
}
