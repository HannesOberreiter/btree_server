import { useScanningStore } from '~/stores/scanning';
import { useNotification } from './useNotification';

// Type definitions for Web NFC
// Project: https://github.com/w3c/web-nfc
// Definitions by: Takefumi Yoshii <https://github.com/takefumi-yoshii>
// TypeScript Version: 3.9

// This type definitions referenced to WebIDL.
// https://w3c.github.io/web-nfc/#actual-idl-index

// eslint-disable-next-line no-use-before-define
declare type NDEFRecordDataSource = string | BufferSource | NDEFMessageInit;

declare interface NDEFRecordInit {
  recordType: string;
  mediaType?: string;
  id?: string;
  encoding?: string;
  lang?: string;
  data?: NDEFRecordDataSource;
}

declare interface NDEFMessageInit {
  records: NDEFRecordInit[];
}

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

declare class NDEFMessage {
  constructor(messageInit: NDEFMessageInit);
  records: ReadonlyArray<NDEFRecord>;
}

declare type NDEFMessageSource = string | BufferSource | NDEFMessageInit;

interface NDEFReadingEventInit extends EventInit {
  serialNumber?: string;
  message: NDEFMessageInit;
}

declare class NDEFReadingEvent extends Event {
  constructor(type: string, readingEventInitDict: NDEFReadingEventInit);
  serialNumber: string;
  message: NDEFMessage;
}

interface NDEFWriteOptions {
  overwrite?: boolean;
  signal?: AbortSignal;
}

interface NDEFScanOptions {
  signal: AbortSignal;
}

declare class NDEFReader extends EventTarget {
  constructor();
  onreading: (this: this, event: NDEFReadingEvent) => any;
  onreadingerror: (this: this, error: Event) => any;
  scan: (options?: NDEFScanOptions) => Promise<void>;
  write: (
    message: NDEFMessageSource,
    options?: NDEFWriteOptions
  ) => Promise<void>;
}

const state = reactive({
  writing: false,
  reading: false,
});

const useNFC = () => {
  const notification = useNotification();
  const router = useRouter();
  const storeScanning = useScanningStore();

  let controller = new AbortController();
  let ndef = null;
  // Functional logic adapted from
  // Project: https://github.com/maevsi/maevsi
  // Commit: https://github.com/maevsi/maevsi/commit/6e132cda75127166f48859c6da29eb0f1ba6c099#diff-9bc2c5cb71c26f59ef0c2e9a0024abb2b895c1ce889fa890116b9fd2c1ed32a5

  const isSupported = () => 'NDEFReader' in window;

  function abort(message = true) {
    state.reading = false;
    state.writing = false;
    ndef = null;
    if (message) notification.open('negative', 'nfc.aborted');
    controller.abort();
  }

  async function read() {
    if (state.reading || state.writing) abort(false);
    if ('NDEFReader' in window) {
      ndef = new NDEFReader();
      try {
        state.reading = true;
        controller = new AbortController();
        ndef.scan({ signal: controller.signal });
        notification.open('positive', 'nfc.active');
        ndef.onreading = (event: any) => {
          const decoder = new TextDecoder();
          for (const record of event.message.records) {
            console.log('Record type:  ' + record.recordType);
            console.log('MIME type:    ' + record.mediaType);
            console.log('ID:    ' + record.id);
            console.log('=== data ===\n' + decoder.decode(record.data));
          }
          const record = event.message.records[0];
          if (record.id) {
            /**
                If a hive dropdown is active visible it will try to make a selection based on the tag,
                otherwise a redirect will happen.
             */
            if (
              storeScanning.hiveDropdownActive &&
              storeScanning.extractUrl(record.id)
            ) {
              return true;
            } else {
              notification.open('positive', record.id, true);
              router.push(record.id);
            }
          }
        };
      } catch (error) {
        console.error(error);
        state.reading = false;
        notification.open('negative', '');
      }
    } else {
      notification.open('negative', 'error.nfcNotSupported');
    }
  }
  async function check(): Promise<boolean> {
    if (!('NDEFReader' in window)) {
      notification.open('negative', 'error.nfcNotSupported');
      return Promise.resolve(false);
    }
    if (!navigator.permissions) {
      notification.open('negative', 'error.permission');
      return Promise.resolve(false);
    } else {
      const nfcPermissionStatus = await navigator.permissions.query({
        name: 'nfc' as PermissionName,
      });
      if (nfcPermissionStatus.state === 'granted') {
        return Promise.resolve(true);
      } else {
        notification.open('negative', nfcPermissionStatus.state);
        return Promise.resolve(false);
      }
    }
  }
  async function write(url: string | null, shortUrl = ''): Promise<void> {
    if (state.reading || state.writing) abort(false);
    if (await check()) {
      try {
        controller = new AbortController();
        state.writing = true;
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
          : 'b.tree';
        await new NDEFReader().write(records, {
          signal: controller.signal,
          overwrite: true,
        });
        state.writing = false;
        notification.open('positive', '');
      } catch (error: any) {
        console.error(error.name);
        console.error(error);
        state.writing = false;
        if (error.name !== 'AbortError') notification.open('negative', '');
      }
    }
  }

  return {
    state,
    abort,
    isSupported,
    read,
    write,
    check,
  };
};

export { useNFC };
