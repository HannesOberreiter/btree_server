"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberSchema = exports.booleanParamSchema = void 0;
const zod_1 = require("zod");
// https://github.com/colinhacks/zod/issues/1630
exports.booleanParamSchema = zod_1.z
    .enum(['true', 'false'])
    .transform((value) => value === 'true');
exports.numberSchema = zod_1.z.preprocess(Number, zod_1.z.number());
