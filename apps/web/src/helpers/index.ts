import dayjs from 'dayjs';
import { map, some, uniq, includes } from 'lodash-es';

/*
    Helper function for validating forms returns array
    of error messages from vuelidate which is given to
    vuetify as messages.
*/
export const validationErrors = (validation: any) => {
  if (!validation.$error) return '';
  return map(validation.$errors, '$message').join(', ');
};
// https://stackoverflow.com/a/56363526/5316675
export const includesValue = (val: string, obj: any) =>
  some(obj, (v) => includes(v, val));

// https://stackoverflow.com/a/39914235/5316675
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Evaluation if multiple values are present
// data = response from server
// name = object name of interest
export const formCheckMultipleValues = (data: any, name: string) => {
  const r = map(data, (row: any) => row[name]);
  const u = uniq(r);
  return u.length > 1;
};

// Create combined field eg. test@test.com (1982-04-01 05:11) || 1982-04-01 05:11
export const tableMeta = (date: string, name: any) => {
  if (dayjs(date).isValid() === false) return '';
  if (name) {
    return `${name.email} (${dayjs(date).format('YYYY-MM-DD HH:mm')})`;
  } else {
    return dayjs(date).format('YYYY-MM-DD HH:mm');
  }
};

// Check table if all selected rows are actually visible on the table (happens when the data updates and moves the pages)
export const tableCheckSelected = (selected: any[], rows: any) => {
  const rowIds = rows.map((o: any) => o.id);
  return selected.filter((o: any) => rowIds.includes(o.id));
};
