import { Model } from 'objection';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AjvValidator = require('objection').AjvValidator;
import addFormats from 'ajv-formats';

export class BaseModel extends Model {
  constructor() {
    super();
  }
  // Fix to change date-time from ISOFormat to MySQL Format
  $beforeValidate(jsonSchema, json, _opt) {
    Object.keys(jsonSchema.properties).map(function (key, _index) {
      const format = jsonSchema.properties[key].format;
      if (format && typeof format !== 'undefined' && format === 'date-time') {
        const valueToValidate = json[key];
        if (valueToValidate !== null && valueToValidate instanceof Date) {
          json[key] = valueToValidate
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
        addFormats(ajv);
      },
      options: {
        allErrors: true,
        validateSchema: true,
        ownProperties: true,
        v5: false
      }
    });
  }
}

export class ExtModel extends BaseModel {
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
