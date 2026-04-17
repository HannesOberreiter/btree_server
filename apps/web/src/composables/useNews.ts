import type { Ref } from 'vue';
import { useFetch } from '@vueuse/core';

interface NewsItem {
	title: string;
	description: string;
}

interface News {
	version: string;
	date: string;
	items: NewsItem[];
}

interface NewsJson {
	en: News[];
	de: News[];
}

const NEWS_URL = 'https://www.btree.at/news.json';

const {
	isFetching,
	error,
	data,
}: { isFetching: Ref<boolean>; error: Ref<any>; data: Ref<NewsJson | null> }
	= useFetch(`${NEWS_URL}?cache=${Date.now()}`)
		.get()
		.json();

export function useNews() {
	function getNews(lang: string): News[] {
		if (!data.value)
			return [];
		return lang === 'de' ? data.value.de : data.value.en;
	}

	return {
		data,
		isFetching,
		error,
		getNews,
	};
}
