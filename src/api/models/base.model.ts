import { Model } from 'objection';
import Moment from 'moment';
export class BaseModel extends Model {

  created_at!: string;
  updated_at!: string;

  constructor() { super(); }

  // https://github.com/Vincit/objection.js/issues/647
  $beforeInsert() {
    this.created_at = Moment().format();
    delete this.updated_at;
  }

  $beforeUpdate() {
    this.updated_at = Moment().format();
    delete this.created_at;
  }

  
}