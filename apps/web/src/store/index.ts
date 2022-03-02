/* eslint-disable @typescript-eslint/no-unused-vars */
import { store } from 'quasar/wrappers';
import { InjectionKey } from 'vue';
import { createPinia, Pinia } from 'pinia';

// provide typings for `this.$store`
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: Pinia;
  }
}

declare module '@quasar/app' {
  interface BootFileParams<TState> {
    store: Pinia;
  }
  interface PreFetchOptions<TState> {
    store: Pinia;
  }
}

// provide typings for `useStore` helper
export const storeKey: InjectionKey<Pinia> = Symbol('pinia-key');
export default store(function () {
  return createPinia();
});
