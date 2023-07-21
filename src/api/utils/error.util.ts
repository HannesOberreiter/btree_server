import {
  ValidationError,
  NotFoundError,
  DBError,
  UniqueViolationError,
  NotNullViolationError,
  ForeignKeyViolationError,
  CheckViolationError,
  DataError,
} from 'objection';

import httpErrors from 'http-errors';

export const checkMySQLError = (err: any) => {
  // https://vincit.github.io/objection.js/recipes/error-handling.html#examples
  let error;
  if (err instanceof ValidationError) {
    switch (err.type) {
      case 'ModelValidation':
        error = httpErrors.BadRequest(err.message);
        error.output.payload.message = {
          type: err.type,
          data: err.data,
        };
        break;
      case 'RelationExpression':
        error = httpErrors.BadRequest(err.message);
        error.output.payload.message = {
          type: 'RelationExpression',
          data: {},
        };
        break;
      case 'UnallowedRelation':
        error = httpErrors.BadRequest(err.message);
        error.output.payload.message = {
          type: err.type,
          data: {},
        };
        break;
      case 'InvalidGraph':
        error = httpErrors.BadRequest(err.message);
        error.output.payload.message = {
          type: err.type,
          data: {},
        };
        break;
      default:
        error = httpErrors.BadRequest(err.message);
        error.output.payload.message = {
          type: 'UnknownValidationError',
          data: {},
        };
        break;
    }
  } else if (err instanceof NotFoundError) {
    error = httpErrors.NotFound(err.message);
    error.output.payload.message = {
      type: 'NotFound',
      data: {},
    };
  } else if (err instanceof UniqueViolationError) {
    error = httpErrors.Conflict(err.message);
    error.output.payload.message = {
      type: 'UniqueViolation',
      data: {
        columns: err.columns,
        table: err.table,
        constriant: err.constraint,
      },
    };
  } else if (err instanceof NotNullViolationError) {
    error = httpErrors.BadRequest(err.message);
    error.output.payload.message = {
      type: 'NotNullViolation',
      data: {
        columns: err.column,
        table: err.table,
      },
    };
  } else if (err instanceof ForeignKeyViolationError) {
    error = httpErrors.Conflict(err.message);
    error.output.payload.message = {
      type: 'ForeignKeyViolation',
      data: {
        table: err.table,
        constriant: err.constraint,
      },
    };
  } else if (err instanceof CheckViolationError) {
    error = httpErrors.BadRequest(err.message);
    error.output.payload.message = {
      type: 'CheckViolation',
      data: {
        table: err.table,
        constriant: err.constraint,
      },
    };
  } else if (err instanceof DataError) {
    error = httpErrors.BadRequest(err.message);
    error.output.payload.message = {
      type: 'InvalidData',
      data: {},
    };
  } else if (err instanceof DBError) {
    error = httpErrors[500](err.message);
    error.output.payload.message = {
      type: 'UnknownDatabaseError',
      data: {},
    };
  } else if (err instanceof Error) {
    return err;
  } else {
    error = httpErrors[500](err.message);
    error.output.payload.message = {
      type: 'UnknownError',
      data: {},
    };
  }

  return error;
};
