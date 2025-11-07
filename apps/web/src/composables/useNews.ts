import type { Ref } from 'vue';
import { useFetch } from '@vueuse/core';
import { computed, ref } from 'vue';

interface News {
	version: string;
	date: string;
	news: string[];
}

const currentVersion = ref<News>();

const {
	isFetching,
	error,
	data,
}: { isFetching: Ref<boolean>; error: Ref<any>; data: Ref<News[] | null> }
	= useFetch(`/news.json?cache=${Date.now()}`)
		.get()
		.json();

export function useNews() {
	async function loadCurrentNews() {
		const local = await fetch('/news.json');
		const file = (await local.json()) as News[];
		return (currentVersion.value = file[0]);
	}

	const isOutdated = computed(() => {
		if (!data.value)
			return false;
		return data.value[0]?.version !== currentVersion.value?.version;
	});

	return {
		data,
		isFetching,
		error,
		loadCurrentNews,
		currentVersion,
		isOutdated,
	};
}
