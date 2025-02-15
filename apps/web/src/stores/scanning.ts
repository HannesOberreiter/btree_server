import { defineStore } from 'pinia';

export const useScanningStore = defineStore('scanning', {
  state: () => ({
    hiveDropdownActive: false,
    scannedId: null as string | null,
  }),
  getters: {},
  actions: {
    extractUrl(url: string) {
      if (url.indexOf('detail/hive') !== -1 && this.hiveDropdownActive) {
        try {
          const reg = /(hive\/)(\d+)/g;
          const exec = reg.exec(url);
          const hive_id = exec ? exec[2] : null;
          if (hive_id) {
            this.scannedId = hive_id;
            return true;
          }
        } catch (e) {
          console.error(e);
          return false;
        }
      }
      return false;
    },
  },
});
