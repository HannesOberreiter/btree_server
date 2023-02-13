import { useScanningStore } from '~/stores/scanning';
import { useNotification } from './useNotification';
import { reactive } from 'vue';
import { useRouter } from 'vue-router';

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
    options?: NDEFWriteOptions
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
  reading: false,
  getContent: false,
  content: [] as any,
});

const useNFC = () => {
  const notification = useNotification();
  const router = useRouter();
  const storeScanning = useScanningStore();

  let controller = new AbortController();
  let ndef = null as null | NDEFReader;
  // Functional logic adapted from
  // Project: https://github.com/maevsi/maevsi
  // Commit: https://github.com/maevsi/maevsi/commit/6e132cda75127166f48859c6da29eb0f1ba6c099#diff-9bc2c5cb71c26f59ef0c2e9a0024abb2b895c1ce889fa890116b9fd2c1ed32a5

  const isSupported = () => 'NDEFReader' in window;

  function abort(message: string | boolean = 'nfc.aborted') {
    state.reading = false;
    state.writing = false;
    state.getContent = false;
    if (controller) {
      try {
        controller.abort('AbortError');
      } catch (e) {
        console.error(e);
      }
    }
    ndef = null;
    controller = null;
    if (message) notification.open('negative', message);
  }

  async function getContent() {
    if (state.getContent) {
      state.content = [];
      abort(false);
      return false;
    }
    if (state.reading || state.writing || state.getContent) abort(false);
    if (await check()) {
      try {
        state.getContent = true;
        ndef = new NDEFReader();
        controller = new AbortController();
        ndef.scan({ signal: controller.signal });
        const result = [] as any;
        ndef.onreadingerror = (e) => {
          console.error(
            'Argh! Cannot read data from the NFC tag. Try another one?'
          );
          console.error(e);
        };
        ndef.onreading = (event: any) => {
          const decoder = new TextDecoder();
          for (const record of event.message.records) {
            const item = {
              name: 'Record type:  ' + record.recordType,
              type: 'MIME type:    ' + record.mediaType,
              id: 'ID:    ' + record.id,
              data: '=== data ===\n' + decoder.decode(record.data),
            };
            result.push(item);
          }
          state.content = result;
        };
      } catch (error) {
        console.error(error);
        state.getContent = false;
        notification.open('negative', '');
        return false;
      }
    }
    return true;
  }

  async function read() {
    state.content = [];
    if (state.reading || state.writing || state.getContent) abort(false);
    if (await check()) {
      try {
        ndef = new NDEFReader();
        state.reading = true;
        controller = new AbortController();
        ndef.scan({ signal: controller.signal });
        notification.open('positive', 'nfc.active');
        ndef.onreadingerror = (e) => {
          console.error(
            'Argh! Cannot read data from the NFC tag. Try another one?'
          );
          console.error(e);
        };
        ndef.onreading = (event: any) => {
          const decoder = new TextDecoder();
          for (const record of event.message.records) {
            console.log('Record type:  ' + record.recordType);
            console.log('MIME type:    ' + record.mediaType);
            console.log('ID:    ' + record.id);
            console.log('=== data ===\n' + decoder.decode(record.data));
          }
          const record = event.message.records[0];

          if (!record) return false;
          let id = record.id ? record.id : '';
          const decodedData = record.data ? decoder.decode(record.data) : '';

          if (id === '' && decodedData) {
            const deleteBase = new RegExp(/^(.*?)btree.at(?:\/app)?/i);
            const generatedId = decodedData.replace(deleteBase, '');
            if (
              decodedData.indexOf('/detail/hive') > 0 ||
              decodedData.indexOf('/detail/apiary') > 0 ||
              decodedData.indexOf('app.btree.at') > 0
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
              storeScanning.hiveDropdownActive &&
              storeScanning.extractUrl(id)
            ) {
              return true;
            } else {
              notification.open('positive', id, true);
              router.push(id);
            }
          }
        };
      } catch (error) {
        console.error(error);
        state.reading = false;
        notification.open('negative', '');
        return false;
      }
    } else {
      notification.open('negative', 'error.nfcNotSupported');
      return false;
    }
    return true;
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
      } else {
        const permission = await navigator.permissions.query({
          name: 'nfc' as PermissionName,
        });
        if (permission.state === 'granted' || permission.state === 'prompt')
          return Promise.resolve(true);
        notification.open('negative', permission.state, true);
        return Promise.resolve(false);
      }
    } catch (e) {
      console.error(e);
      return Promise.resolve(false);
    }
  }

  async function write(url: string | null, shortUrl = ''): Promise<boolean> {
    state.content = [];
    if (state.reading || state.writing || state.getContent) abort(false);
    if (await check()) {
      try {
        state.writing = true;
        controller = new AbortController();
        const records = url
          ? {
              records: [
                {
                  recordType: 'url',
                  id: shortUrl,
                  data: url,
                },
              ],
            }
          : {
              records: [
                {
                  recordType: 'empty',
                },
              ],
            };

        ndef = new NDEFReader();
        controller = new AbortController();
        setTimeout(() => controller.abort('timeout'), 10_000);
        await ndef.write(records, { signal: controller.signal });
        notification.open('positive', '');
        abort(false);
      } catch (error: any) {
        if (error === 'timeout') {
          abort('nfc.timeout');
        } else {
          abort();
        }
        console.error(error);
      } finally {
        state.writing = false;
      }
    }
    return true;
  }

  return {
    state,
    abort,
    isSupported,
    read,
    write,
    getContent,
    check,
  };
};

export { useNFC };
