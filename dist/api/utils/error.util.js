"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMySQLError = void 0;
const objection_1 = require("objection");
const http_errors_1 = __importDefault(require("http-errors"));
const checkMySQLError = (err) => {
    // https://vincit.github.io/objection.js/recipes/error-handling.html#examples
    let error;
    if (err instanceof objection_1.ValidationError) {
        switch (err.type) {
            case 'ModelValidation':
                error = http_errors_1.default.BadRequest(err.message);
                error.cause = {
                    type: err.type,
                    data: err.data,
                };
                break;
            case 'RelationExpression':
                error = http_errors_1.default.BadRequest(err.message);
                error.cause = {
                    type: 'RelationExpression',
                    data: {},
                };
                break;
            case 'UnallowedRelation':
                error = http_errors_1.default.BadRequest(err.message);
                error.cause = {
                    type: err.type,
                    data: {},
                };
                break;
            case 'InvalidGraph':
                error = http_errors_1.default.BadRequest(err.message);
                error.cause = {
                    type: err.type,
                    data: {},
                };
                break;
            default:
                error = http_errors_1.default.BadRequest(err.message);
                error.cause = {
                    type: 'UnknownValidationError',
                    data: {},
                };
                break;
        }
    }
    else if (err instanceof objection_1.NotFoundError) {
        error = http_errors_1.default.NotFound(err.message);
        error.cause = {
            type: 'NotFound',
            data: {},
        };
    }
    else if (err instanceof objection_1.UniqueViolationError) {
        error = http_errors_1.default.Conflict(err.message);
        error.cause = {
            type: 'UniqueViolation',
            data: {
                columns: err.columns,
                table: err.table,
                constriant: err.constraint,
            },
        };
    }
    else if (err instanceof objection_1.NotNullViolationError) {
        error = http_errors_1.default.BadRequest(err.message);
        error.cause = {
            type: 'NotNullViolation',
            data: {
                columns: err.column,
                table: err.table,
            },
        };
    }
    else if (err instanceof objection_1.ForeignKeyViolationError) {
        error = http_errors_1.default.Conflict(err.message);
        error.cause = {
            type: 'ForeignKeyViolation',
            data: {
                table: err.table,
                constriant: err.constraint,
            },
        };
    }
    else if (err instanceof objection_1.CheckViolationError) {
        error = http_errors_1.default.BadRequest(err.message);
        error.cause = {
            type: 'CheckViolation',
            data: {
                table: err.table,
                constriant: err.constraint,
            },
        };
    }
    else if (err instanceof objection_1.DataError) {
        error = http_errors_1.default.BadRequest(err.message);
        error.cause = {
            type: 'InvalidData',
            data: {},
        };
    }
    else if (err instanceof objection_1.DBError) {
        error = http_errors_1.default[500](err.message);
        error.cause = {
            type: 'UnknownDatabaseError',
            data: {},
        };
    }
    else if (err instanceof Error) {
        return err;
    }
    else {
        error = http_errors_1.default[500](err.message);
        error.cause = {
            type: 'UnknownError',
            data: {},
        };
    }
    return error;
};
exports.checkMySQLError = checkMySQLError;
