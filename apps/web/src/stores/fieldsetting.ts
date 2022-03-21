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
  calibrate: boolean;
}

interface Fieldsetting {
  checkup: Checkup;
  harvest: Harvest;
  treatment: Treatment;
  charge: Charge;
}

export const useFieldsettingStore = defineStore('fieldsetting', {
  state: () => ({
    settings: useStorage<Fieldsetting>('fieldsetting', {
      checkup: {
        rating: true,
        queen: true,
        strength: true,
        weight: true,
        temperature: true,
        varroa: true,
        frames: true,
      },
      harvest: {
        water: true,
        frames: true,
      },
      treatment: {
        wait: true,
        vet: true,
      },
      charge: {
        price: true,
        bestbefore: true,
        calibrate: true,
      },
    }),
  }),
  getters: {
    get: (state) => state.settings,
  },
  actions: {
    patch(_payload: any) {
      // console.log(payload);
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
