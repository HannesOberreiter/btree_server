import type { Task } from '../types';
import { useStorage } from '@vueuse/core';
import { acceptHMRUpdate, defineStore } from 'pinia';

export const useQuicktoolStore = defineStore('quicktool', {
	state: () => ({
		link: useStorage<Task>('quicktool', 'checkup'),
	}),
	getters: {
		getLink: state => state.link,
	},
	actions: {},
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useQuicktoolStore, import.meta.hot));
}
