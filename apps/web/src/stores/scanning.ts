import { acceptHMRUpdate, defineStore } from 'pinia';

export const useScanningStore = defineStore('scanning', {
  state: () => ({
    hiveDropdownActive: false,
    scannedId: null as string,
  }),
  getters: {},
  actions: {
    extractUrl(url: string) {
      if (url.indexOf('detail/hive') !== -1 && this.hiveDropdownActive) {
        try {
          const reg = /(hive\/)(\d+)/g;
          const hive_id = reg.exec(url)[2];
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

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useScanningStore, import.meta.hot));
}
