"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listNumber = exports.list = void 0;
/**
 * @description List enum values
 * @param {enum} en Enum to list
 */
const list = (en) => {
    const list = [];
    for (const item in en) {
        list.push(en[item]);
    }
    return list;
};
exports.list = list;
const listNumber = (en) => {
    const list = [];
    for (const item in en) {
        list.push(en[item]);
    }
    return list;
};
exports.listNumber = listNumber;
