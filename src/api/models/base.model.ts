import { Model } from 'objection';
import { AjvValidator } from 'objection';
import addFormats from 'ajv-formats';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
dayjs.extend(utc);

export class BaseModel extends Model {
  constructor() {
    super();
  }
  // Fix to change date-time from ISOFormat to MySQL Format
  $beforeValidate(jsonSchema, json, _opt) {
    Object.keys(jsonSchema.properties).map(function (key, _index) {
      const format = jsonSchema.properties[key].format;
      if (
        format &&
        typeof format !== 'undefined' &&
        format === 'iso-date-time'
      ) {
        const valueToValidate = json[key];
        if (valueToValidate !== null && valueToValidate instanceof Date) {
          json[key] = valueToValidate
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ');
        } else if (valueToValidate) {
          json[key] = new Date(valueToValidate)
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ');
        }
      }
    });
    return jsonSchema;
  }
  // Using formats package to evaluate json type formats
  // https://ajv.js.org/options.html#usage
  static createValidator() {
    return new AjvValidator({
      onCreateAjv: (ajv) => {
        addFormats.default(ajv);
      },
      options: {
        allErrors: true,
        validateSchema: true,
        ownProperties: true,
      },
    });
  }
}

export class ExtModel extends BaseModel {
  created_at!: string;
  updated_at!: string;

  // small helper to prevent error on timestamp if tables are joined
  // eg. ER_NON_UNIQ_ERROR: Column 'updated_at' in field list is ambiguous
  getTablename() {
    return this.constructor['tableName'];
  }

  constructor() {
    super();
  }

  // https://github.com/Vincit/objection.js/issues/647
  $beforeInsert() {
    if (this.updated_at) {
      delete this.updated_at;
    }
    if (this.created_at) {
      return;
    }
    this[`${this.getTablename()}.created_at`] = dayjs
      .utc()
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
  }

  $beforeUpdate() {
    if (this.created_at) {
      delete this.created_at;
    }
    if (this.updated_at) {
      return;
    }
    this[`${this.getTablename()}.updated_at`] = dayjs
      .utc()
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    delete this.created_at;
  }
}
