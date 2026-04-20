import dayjs from 'dayjs';
import { includes, map, some, uniq } from 'lodash-es';

/*
    Helper function for validating forms returns array
    of error messages from vuelidate which is given to
    vuetify as messages.
*/
export function validationErrors(validation: any) {
	if (!validation.$error)
		return '';
	return map(validation.$errors, '$message').join(', ');
}
// https://stackoverflow.com/a/56363526/5316675
export function includesValue(val: string, obj: any) {
	return some(obj, v => includes(v, val));
}

// https://stackoverflow.com/a/39914235/5316675
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Evaluation if multiple values are present
// data = response from server
// name = object name of interest
export function formCheckMultipleValues(data: any, name: string) {
	const r = map(data, (row: any) => row[name]);
	const u = uniq(r);
	if (u.length === 1) {
		// Hack if date by any chance is broken, which results in 0000-00-00
		if (u[0] === '0000-00-00') {
			return true;
		}
	}
	return u.length > 1;
}

// Create combined field eg. test@test.com (1982-04-01 05:11) || 1982-04-01 05:11
export function tableMeta(date: string, name: any, dateFormat: string) {
	if (dayjs(date).isValid() === false)
		return '';
	if (name) {
		return `${name.username ? name.username : name.email} (${dayjs(date).format(
			dateFormat,
		)})`;
	}
	else {
		return dayjs(date).format(dateFormat);
	}
}

// Check table if all selected rows are actually visible on the table (happens when the data updates and moves the pages)
export function tableCheckSelected(selected: any[], rows: any) {
	const rowIds = rows.map((o: any) => o.id);
	return selected.filter((o: any) => rowIds.includes(o.id));
}

// https://stackoverflow.com/questions/10473185/regex-javascript-image-file-extension
export function isImage(filename: string) {
	return /\.(?:gif|jpe?g|tiff?|png|webp|bmp|pdf)(?=\?.|$)/i.test(filename);
}

export function isVideo(filename: string) {
	return /\.(?:mp4|mov|webm|avi|mkv|m4v|3gp)(?=\?.|$)/i.test(filename);
}

export function generateArrayOfYears(min = 2000) {
	const max = new Date().getFullYear();
	const years = [];
	for (let i = max; i >= min; i--) {
		years.push(i);
	}
	return years;
}

// https://stackoverflow.com/a/43467144/5316675
export function isValidURL(string: string) {
	let url;
	try {
		url = new URL(string);
	}
	catch (e) {
		console.error(e);
		return false;
	}
	return url.protocol === 'http:' || url.protocol === 'https:';
}

/**
 * @description Convert strings to numbers for backend, which expects the ids to be numbers
 */
export function convertIdsToNumbers(ids: string | string[] | undefined): number[] {
	if (!ids)
		return [];
	if (Array.isArray(ids)) {
		return ids.map(id => Number.parseInt(id)).filter(id => !Number.isNaN(id));
	}
	else {
		const id = Number.parseInt(ids);
		return Number.isNaN(id) ? [] : [id];
	}
}
