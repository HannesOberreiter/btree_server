import { badData, badImplementation, conflict, notFound, badRequest} from "boom";

const {
  ValidationError,
  NotFoundError,
  DBError,
  ConstraintViolationError,
  UniqueViolationError,
  NotNullViolationError,
  ForeignKeyViolationError,
  CheckViolationError,
  DataError
} = require('objection');

import { IError } from "@interfaces/IError.interface";

const checkMySQLError = (err: any) => {
  // https://vincit.github.io/objection.js/recipes/error-handling.html#examples
  let error;
  if (err instanceof ValidationError) {
    switch (err.type) {
      case 'ModelValidation':
        error = badRequest(err.message);
        error.output.payload.message = {
          "type": err.type, 
          "data": err.data
          };
        break;
      case 'RelationExpression':
        error = badRequest(err.message);
        error.output.payload.message = {
          "type": 'RelationExpression', 
          "data": {}
          };
        break;
      case 'UnallowedRelation':
        error = badRequest(err.message);
        error.output.payload.message = {
          "type": err.type, 
          "data": {}
          };
        break;
      case 'InvalidGraph':
        error = badRequest(err.message);
        error.output.payload.message = {
          "type": err.type, 
          "data": {}
          };
        break;
      default:
        error = badRequest(err.message);
        error.output.payload.message = {
          "type": "UnknownValidationError",
          "data": {}
          };
        break;
    }
  } else if (err instanceof NotFoundError) {
    error = notFound(err.message);
    error.output.payload.message = {
      "type": "NotFound",
      "data": {}
    };
  } else if (err instanceof UniqueViolationError) {
    error = conflict(err.message);
    error.output.payload.message = {
      "type": "UniqueViolation",
      "data": {
        "columns": err.columns,
        "table": err.table,
        "constriant": err.constraint
      }
    };
  } else if (err instanceof NotNullViolationError) {
    error = badRequest(err.message);
    error.output.payload.message = {
      "type": "NotNullViolation",
      "data": {
        "columns": err.columns,
        "table": err.table
      }
    };
  } else if (err instanceof ForeignKeyViolationError) {
    error = conflict(err.message);
    error.output.payload.message = {
      "type": "ForeignKeyViolation",
      "data": {
        "table": err.table,
        "constriant": err.constraint
      }
    };
  } else if (err instanceof CheckViolationError) {
    error = badRequest(err.message);
    error.output.payload.message = {
      "type": "CheckViolation",
      "data": {
        "table": err.table,
        "constriant": err.constraint
      }
    };
  } else if (err instanceof DataError) {
    error = badRequest(err.message);
    error.output.payload.message = {
      "type": "InvalidData",
      "data": {
      }
    };
  } else if (err instanceof DBError) {
    error = badImplementation(err.message);
    error.output.payload.message = {
      "type": "UnknownDatabaseError",
      "data": {
      }
    };
  } else {
    error = badImplementation(err.message);
    error.output.payload.message = {
      "type": "UnknownError",
      "data": {
      }
    };
  }
  
  return error;
}


/**
 * @description Get error status code
 * @param {Object} error Error object
 * @returns {Number} HTTP status code 
 */
const getErrorStatusCode = (error): number => {
  if(typeof(error.statusCode) !== 'undefined') return error.statusCode;
  if(typeof(error.status) !== 'undefined') return error.status;
  if(error.isBoom) return error.output.statusCode;
  return 500;
};

/**
 * @description Get error object for output
 * @param {Object} error Error object
 * @returns {IError} Formalized error object
 */
const getErrorOutput = (error): IError => {

  // JS native ( Error | EvalError | RangeError | SyntaxError | TypeError | URIError )
  if (!error.httpStatusCode && !error.statusCode && !error.status && !error.isBoom) { 
  console.log("test");
    switch(error.constructor.name) {
      case 'Error': 
      case 'EvalError': 
      case 'TypeError': 
      case 'SyntaxError': 
      case 'RangeError': 
      case 'URIError': 
        error = badImplementation(error.message);
      break;
      default:
        error = badImplementation(error.message);
    }
  }

  if (error.isBoom) {
    return {
      statusCode: getErrorStatusCode(error),
      statusText: error.output.payload.error,
      // was before inside array, removed it because I want to throw error with boom and validator [error.output.payload.message]
      errors: error.output.payload.message 
    }; 
  }

};

export { checkMySQLError, getErrorStatusCode, getErrorOutput };