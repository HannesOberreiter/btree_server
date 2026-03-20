import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useScanningStore } from '../stores/scanning';
import { useNotification } from './useNotification';

// Type definitions for Web NFC
// Project: https://github.com/w3c/web-nfc
// Definitions by: Takefumi Yoshii <https://github.com/takefumi-yoshii>
// TypeScript Version: 3.9

// This type definitions referenced to WebIDL.
// https://w3c.github.io/web-nfc/#actual-idl-index

declare class NDEFMessage {
	constructor(messageInit: NDEFMessageInit);
	records: ReadonlyArray<NDEFRecord>;
}
declare interface NDEFMessageInit {
	records: NDEFRecordInit[];
}

declare type NDEFRecordDataSource = string | BufferSource | NDEFMessageInit;
declare class NDEFRecord {
	constructor(recordInit: NDEFRecordInit);
	readonly recordType: string;
	readonly mediaType?: string;
	readonly id?: string;
	readonly data?: DataView;
	readonly encoding?: string;
	readonly lang?: string;
	toRecords?: () => NDEFRecord[];
}
declare interface NDEFRecordInit {
	recordType: string;
	mediaType?: string;
	id?: string;
	encoding?: string;
	lang?: string;
	data?: NDEFRecordDataSource;
}

declare type NDEFMessageSource = string | BufferSource | NDEFMessageInit;

declare class NDEFReader extends EventTarget {
	constructor();
	onreading: (this: this, event: NDEFReadingEvent) => any;
	onreadingerror: (this: this, error: Event) => any;
	scan: (options?: NDEFScanOptions) => Promise<void>;
	write: (
		message: NDEFMessageSource,
		options?: NDEFWriteOptions,
	) => Promise<void>;

	makeReadOnly: (options?: NDEFMakeReadOnlyOptions) => Promise<void>;
}

declare class NDEFReadingEvent extends Event {
	constructor(type: string, readingEventInitDict: NDEFReadingEventInit);
	serialNumber: string;
	message: NDEFMessage;
}
interface NDEFReadingEventInit extends EventInit {
	serialNumber?: string;
	message: NDEFMessageInit;
}

interface NDEFWriteOptions {
	overwrite?: boolean;
	signal?: AbortSignal;
}
interface NDEFMakeReadOnlyOptions {
	signal?: AbortSignal;
}
interface NDEFScanOptions {
	signal: AbortSignal;
}

const state = reactive({
	writing: false,
	writingDone: false,
	writingContent: '',
	clearing: false,
	reading: false,
	getContent: false,
	content: [] as any,
});

const abortSignals = [] as AbortController[];
const writeTimeouts: ReturnType<typeof setTimeout>[] = [];
let ndef: undefined | NDEFReader;
const decoder = new TextDecoder();

function useNFC() {
	const notification = useNotification();
	const router = useRouter();
	const storeScanning = useScanningStore();

	// Functional logic adapted from
	// Project: https://github.com/maevsi/maevsi
	// Commit: https://github.com/maevsi/maevsi/commit/6e132cda75127166f48859c6da29eb0f1ba6c099#diff-9bc2c5cb71c26f59ef0c2e9a0024abb2b895c1ce889fa890116b9fd2c1ed32a5

	const isSupported = () => 'NDEFReader' in window;

	async function initScan() {
		const isAllowed = await check();
		if (!isAllowed)
			return false;
		if (ndef)
			return true;

		try {
			ndef = new NDEFReader();
			ndef.onreadingerror = (e) => {
				console.error(
					'Argh! Cannot read data from the NFC tag. Try another one?',
				);
				console.error(e);
			};
			const ctrl = new AbortController();
			ctrl.signal.onabort = () => {
				console.log('NFC scan aborted');
			};
			await ndef.scan({ signal: ctrl.signal });
			abortSignals.push(ctrl);

			return true;
		}
		catch (e) {
			console.error(e);
			return false;
		}
	}

	function abort(message: string | boolean = 'nfc.aborted') {
		state.reading = false;
		state.writing = false;
		state.writingDone = false;
		state.getContent = false;
		state.clearing = false;
		state.writingContent = '';
		state.content = [];

		try {
			abortSignals.forEach(signal => signal.abort(message ?? 'nfc.aborted'));
		}
		catch (e) {
			console.error(e);
		}

		abortSignals.splice(0, abortSignals.length);
		ndef = undefined;

		if (message)
			notification.open('negative', message);
	}

	function anyStateTrue() {
		return (
			state.reading
			|| state.writing
			|| state.writingDone
			|| state.getContent
			|| state.clearing
		);
	}

	async function getContent() {
		if (state.getContent)
			return;
		if (anyStateTrue())
			abort(false);
		const result = await initScan();
		if (result) {
			try {
				state.getContent = true;
				abortSignals.push(new AbortController());
				if (!ndef)
					throw new Error('NFC reader not initialized');
				let signal = {};
				if (abortSignals.at(-1)) {
					signal = { signal: abortSignals.at(-1)!.signal };
				}
				ndef.addEventListener(
					'reading',
					(event: any) => {
						try {
							const result = [] as any;
							for (const record of event.message.records) {
								const item = {
									name: `Record type:  ${record.recordType}`,
									type: `MIME type:    ${record.mediaType}`,
									id: `ID:    ${record.id}`,
									data: record.data
										? `=== data ===\n${decoder.decode(record.data)}`
										: '',
								};
								result.push(item);
							}
							state.content = result;
						}
						catch (e) {
							console.error(e);
						}
					},
					signal,
				);
			}
			catch (error) {
				console.error(error);
				state.getContent = false;
				notification.open('negative', '');
				return false;
			}
		}
		return true;
	}

	async function read() {
		if (state.reading)
			return;
		if (anyStateTrue())
			abort(false);
		if (!(await check()))
			return false;

		const result = await initScan();
		if (result) {
			try {
				state.reading = true;
				notification.open('positive', 'nfc.active');
				abortSignals.push(new AbortController());
				if (!ndef)
					throw new Error('NFC reader not initialized');
				let signal = {};
				if (abortSignals.at(-1)) {
					signal = { signal: abortSignals.at(-1)!.signal };
				}
				ndef.addEventListener(
					'reading',
					(event: any) => {
						for (const record of event.message.records) {
							console.log(`Record type:  ${record.recordType}`);
							console.log(`MIME type:    ${record.mediaType}`);
							console.log(`ID:    ${record.id}`);
							if (record.data)
								console.log(`=== data ===\n${decoder.decode(record.data)}`);
						}
						const record = event.message.records[0];

						if (!record)
							return false;
						let id = record.id ? record.id : '';
						const decodedData = record.data ? decoder.decode(record.data) : '';

						if (id === '' && decodedData) {
							const deleteBase = /^(.*?)btree.at(?:\/app)?/i;
							const generatedId = decodedData.replace(deleteBase, '');
							if (
								decodedData.indexOf('/detail/hive') > 0
								|| decodedData.indexOf('/detail/apiary') > 0
								|| decodedData.indexOf('app.btree.at') > 0
							) {
								/*
                   Generate a custom ID if it is an old NFC tag with detail link or
                    if user did only write URL, eg. custom NFC tool
                   */
								id = generatedId;
							}
						}
						if (id && id !== '') {
							/**
                If a hive dropdown is active visible it will try to make a selection based on the tag,
                otherwise a redirect will happen.
							 */
							if (
								storeScanning.hiveDropdownActive
								&& storeScanning.extractUrl(id)
							) {
								return true;
							}
							else {
								notification.open('positive', id, true);
								router.push(id);
							}
						}
					},
					signal,
				);
			}
			catch (error) {
				console.error(error);
				state.reading = false;
				notification.open('negative', '');
				return false;
			}
		}
		else {
			notification.open('negative', 'error.nfcNotSupported');
			return false;
		}
		return true;
	}

	async function write(url: string | null, shortUrl = ''): Promise<void> {
		abort(false);
		const result = await initScan();
		if (result) {
			try {
				const records = {
					records: [
						{
							recordType: 'empty',
						},
					],
				} as any;
				if (url) {
					state.writing = true;
					state.writingContent = url;
					records.records = [
						{
							recordType: 'url',
							id: shortUrl,
							data: url,
						},
					];
				}
				else {
					state.clearing = true;
				}

				const ctrlWrite = new AbortController();
				ctrlWrite.signal.onabort = () => 'timeout';
				writeTimeouts.push(
					setTimeout(() => {
						if (ctrlWrite)
							ctrlWrite.abort();
					}, 10_000),
				);
				abortSignals.push(ctrlWrite);
				if (!ndef)
					throw new Error('NFC reader not initialized');
				let signal = {};
				if (abortSignals.at(-1)) {
					signal = { signal: abortSignals.at(-1)!.signal };
				}
				ndef.addEventListener(
					'reading',
					(_event) => {
						console.log('Currently waiting for write to finish...');
					},
					signal,
				);

				await ndef
					.write(records, signal)
					.then(() => {
						notification.open('positive', '');
						state.writingDone = true;
					})
					.catch((e) => {
						console.log(e);
						if (e === 'timeout') {
							if (!state.writingDone)
								notification.open('negative', 'nfc.timeout', false);
						}
						else if (e === 'nfc.aborted') {
							// do nothing
						}
						else {
							console.error(e);
							notification.open('negative', '');
						}
						state.writingDone = false;
					})
					.finally(() => {
						state.writing = false;
						state.writingContent = '';
						state.clearing = false;
					});
			}
			catch (error: any) {
				state.writing = false;
				state.writingContent = '';
				state.clearing = false;
				console.error(error);
			}
		}
	}

	async function check(): Promise<boolean> {
		try {
			if (!('NDEFReader' in window)) {
				notification.open('negative', 'error.nfcNotSupported');
				return Promise.resolve(false);
			}
			if (!navigator.permissions) {
				notification.open('negative', 'error.permission');
				return Promise.resolve(false);
			}
			else {
				const permission = await navigator.permissions.query({
					name: 'nfc' as PermissionName,
				});
				if (permission.state === 'granted' || permission.state === 'prompt')
					return Promise.resolve(true);
				notification.open('negative', permission.state, true);
				return Promise.resolve(false);
			}
		}
		catch (e) {
			console.error(e);
			return Promise.resolve(false);
		}
	}

	return {
		ndef,
		state,
		abort,
		isSupported,
		read,
		write,
		getContent,
		check,
	};
}

export { useNFC };
