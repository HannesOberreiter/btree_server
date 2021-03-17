import { badData, badImplementation, conflict, notFound } from "boom";

import { IError } from "@interfaces/IError.interface";

const checkMySQLError = (error: any) => {
  if (error.name === 'QueryFailedError') { 
    if([1052, 1062, 1452].includes(error.errno)) {
      return conflict( 'MySQL validation error', { // 409
        errors: [{
          field: getErrorColumnName(error),
          location: 'body',
          messages: [error.sqlMessage],
        }]
      });
    }
    if([1364, 1406].includes(error.errno)) {
      return badData( 'MySQL validation error', { // 422
        errors: [{
          field: getErrorColumnName(error),
          location: 'body',
          messages: [error.sqlMessage],
        }]
      });
    }
  }
  if (error.name === 'EntityNotFound') {
    return notFound(error.message)
  }
  return error;
}

const getErrorColumnName = (error): string => {
  const start = parseInt(error.sqlMessage.indexOf("'"), 10);
  const restart = parseInt(error.sqlMessage.substring(start + 1).indexOf("'"), 10);
  return error.sqlMessage.substring(start + 1, start + restart + 1);
};

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

export { checkMySQLError, getErrorColumnName, getErrorStatusCode, getErrorOutput };