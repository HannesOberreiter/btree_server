import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
interface Checkup {
  rating: boolean;
  queen: boolean;
  strength: boolean;
  weight: boolean;
  temperature: boolean;
  varroa: boolean;
  frames: boolean;
}

interface Harvest {
  water: boolean;
  frames: boolean;
}

interface Treatment {
  wait: boolean;
  vet: boolean;
}

interface Charge {
  price: boolean;
  bestbefore: boolean;
}

interface General {
  url: boolean;
}

interface Fieldsetting {
  checkup: Checkup;
  harvest: Harvest;
  treatment: Treatment;
  charge: Charge;
  general: General;
}

const resetSettings = {
  checkup: {
    rating: false,
    queen: false,
    strength: false,
    weight: false,
    temperature: false,
    varroa: false,
    frames: false,
  },
  harvest: {
    water: false,
    frames: false,
  },
  treatment: {
    wait: false,
    vet: false,
  },
  charge: {
    price: false,
    bestbefore: false,
  },
  general: {
    url: false,
  },
};

export const useFieldsettingStore = defineStore('fieldsetting', {
  state: () => ({
    settings: useStorage<Fieldsetting>('fieldsetting', resetSettings),
  }),
  getters: {
    get: (state) => state.settings,
  },
  actions: {
    patch(_payload: any) {
      // console.log(payload);
    },
    reset() {
      this.settings = resetSettings;
      return resetSettings;
    },
    refresh(data: any) {
      if (data) {
        this.settings = data.settings;
      }
    },
  },
});

export type useFieldsettingStore = ReturnType<typeof useFieldsettingStore>;
export type { Fieldsetting };

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useFieldsettingStore, import.meta.hot)
  );
}
