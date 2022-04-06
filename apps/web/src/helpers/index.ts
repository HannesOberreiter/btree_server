import dayjs from 'dayjs';
import _ from 'lodash';

/*
    Helper function for validating forms returns array
    of error messages from vuelidate which is given to
    vuetify as messages.
*/
export const validationErrors = (validation: any) => {
  if (!validation.$error) return '';
  return _.map(validation.$errors, '$message').join(', ');
};
// https://stackoverflow.com/a/56363526/5316675
export const includesValue = (val: string, obj: any) =>
  _.some(obj, (v) => _.includes(v, val));

// https://stackoverflow.com/a/39914235/5316675
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Evaluation if multiple values are present
// data = response.data from server
// name = object name of interest
export const formCheckMultipleValues = (data: any, name: string) => {
  const r = _.map(data, (row: any) => row[name]);
  const u = _.uniq(r);
  return u.length > 1;
};

// Create combined field eg. test@test.com (1982-04-01 05:11) || 1982-04-01 05:11
export const rowTableMeta = (date: string, name: any) => {
  if (dayjs(date).isValid() === false) return '';
  if (name) {
    return `${name.email} (${dayjs(date).format('YYYY-MM-DD HH:mm')})`;
  } else {
    return dayjs(date).format('YYYY-MM-DD HH:mm');
  }
};
