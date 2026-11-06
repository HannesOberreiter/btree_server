/**
  (c) https://github.com/DanHulton/vue-deepunref
  v 1.0.1
 */

import { isRef, unref } from 'vue';

const isObject = (val: any) => val !== null && typeof val === 'object';
const isArray = Array.isArray;
/**
 * Unref an array, recursively.
 *
 * @param {Array} arr - The array to unref.
 *
 * @return {Array}
 */
const unrefArray = (arr: any) => arr.map(smartUnref);

/**
 * Deeply unref a value, recursing into objects and arrays.
 *
 * @param {Mixed} val - The value to deeply unref.
 *
 * @return {Mixed}
 */
export function deepUnref(val: any) {
  const checkedVal = isRef(val) ? unref(val) : val;

  if (!isObject(checkedVal)) {
    return checkedVal;
  }

  if (isArray(checkedVal)) {
    return unrefArray(checkedVal);
  }

  return unrefObject(checkedVal);
}

/**
 * Unref a value, recursing into it if it's an object.
 *
 * @param {Mixed} val - The value to unref.
 *
 * @return {Mixed}
 */
function smartUnref(val: any) {
  // Non-ref object?  Go deeper!
  if (val !== null && !isRef(val) && typeof val === 'object') {
    return deepUnref(val);
  }

  return unref(val);
}

/**
 * Unref an object, recursively.
 *
 * @param {object} obj - The object to unref.
 *
 * @return {object}
 */
function unrefObject(obj: any) {
  const unreffed = {} as any;

  // Object? un-ref it!
  Object.keys(obj).forEach(key => {
    unreffed[key as keyof typeof unreffed] = smartUnref(obj[key]);
  });

  return unreffed;
}
