import _ from 'lodash';
/*
    Helper function for validating forms returns array
    of error messages from vuelidate which is given to
    vuetify as messages.
*/
function validationErrors(validation: any) {
  if (!validation.$error) return '';
  return _.map(validation.$errors, '$message').join(', ');
}
// https://stackoverflow.com/a/56363526/5316675
const includesValue = (val: string, obj: any) =>
  _.some(obj, (v) => _.includes(v, val));

// https://stackoverflow.com/a/39914235/5316675
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export { validationErrors, includesValue, sleep };
