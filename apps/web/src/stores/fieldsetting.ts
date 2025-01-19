import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import refreshService from '../services/refresh.service';
import { useApiFetch } from '../composables/useApi';
import defaultsDeep from 'lodash-es/defaultsDeep';

interface Rating {
  brood: boolean;
  calm_comb: boolean;
  comb: boolean;
  pollen: boolean;
  swarm: boolean;
  temper: boolean;
  max: number;
}

interface Checkbox {
  queen: boolean;
  queencells: boolean;
  capped_brood: boolean;
  eggs: boolean;
}

interface Frame {
  broodframes: boolean;
  honeyframes: boolean;
  foundation: boolean;
  emptyframes: boolean;
}

interface Checkup {
  ratings: Rating;
  rating?: boolean;
  queen?: boolean;
  checkboxes: Checkbox;
  strength: boolean;
  weight: boolean;
  temperature: boolean;
  varroa: boolean;
  frames?: boolean;
  frame: Frame;
}

interface Harvest {
  water: boolean;
  frames: boolean;
}

interface Treatment {
  wait: boolean;
  vet: boolean;
  temperature: boolean;
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
    ratings: {
      brood: false,
      calm_comb: false,
      comb: false,
      pollen: false,
      swarm: false,
      temper: false,
      max: 5,
    },
    checkboxes: {
      queen: false,
      queencells: false,
      capped_brood: false,
      eggs: false,
    },
    frame: {
      broodframes: false,
      honeyframes: false,
      foundation: false,
      emptyframes: false,
    },
    strength: false,
    weight: false,
    temperature: false,
    varroa: false,
  },
  harvest: {
    water: false,
    frames: false,
  },
  treatment: {
    wait: false,
    vet: false,
    temperature: false,
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
    someRatingTrue: (state) =>
      Object.values(state.settings.checkup.ratings).some((val) => val === true),
    someCheckboxTrue: (state) =>
      Object.values(state.settings.checkup.checkboxes).some(
        (val) => val === true,
      ),
    someFrameTrue: (state) =>
      Object.values(state.settings.checkup.frame).some((val) => val === true),
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
        // Migrate old field settings to new separate ratings
        if (data.settings.checkup?.rating) {
          data.settings.checkup.ratings = {
            brood: true,
            calm_comb: true,
            comb: true,
            pollen: true,
            swarm: true,
            temper: true,
          };
          delete data.settings.checkup.rating;
        }
        // Migrate old field settings to new separate queens checkboxes
        if (data.settings.checkup?.queen) {
          data.settings.checkup.checkboxes = {
            queen: true,
            queencells: true,
            capped_brood: true,
            eggs: true,
          };
          delete data.settings.checkup.queen;
        }
        // Migrate old field settings to new separate frames
        if (data.settings.checkup?.frames) {
          data.settings.checkup.frame = {
            broodframes: true,
            honeyframes: true,
            foundation: true,
            emptyframes: true,
          };
          delete data.settings.checkup.frames;
        }
        if ('rating' in data.settings.checkup)
          delete data.settings.checkup.rating;
        if ('queen' in data.settings.checkup)
          delete data.settings.checkup.queen;
        if ('frames' in data.settings.checkup)
          delete data.settings.checkup.frames;
        this.settings = defaultsDeep(data.settings, resetSettings);
      } else {
        this.settings = defaultsDeep(this.settings, resetSettings);
      }
    },
    async reload() {
      const api = useApiFetch();
      return await refreshService.fieldsetting(api);
    },
  },
});

export type useFieldsettingStore = ReturnType<typeof useFieldsettingStore>;
export type { Fieldsetting };
