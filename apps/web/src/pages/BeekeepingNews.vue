<script setup lang="ts">
import { useFetch, useStorage } from '@vueuse/core';
import { truncate } from 'lodash-es';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import GlobalLoading from '../components/GlobalLoading.vue';
import { useDateFormat } from '../composables/useDate';
import { useKeyNews } from '../composables/useKey';

interface NewsItem {
	id: number;
	title: string;
	preview: string;
	link: string;
	creator: string;
	published_at: string;
	source: string;
	source_key: string;
	language: string;
}

interface CategoryConfig {
	slug: string;
	name_en: string;
	name_de: string;
}

interface NewsConfig {
	categories: CategoryConfig[];
	languages: string[];
}

const endpoint = 'https://www.beekeeping-news.com/api';
const pageSize = 30;
const searchQuery = ref('');
const page = ref(1);
useKeyNews(page);
const dateFormat = useDateFormat();
const { locale } = useI18n();

const newsStorage = useStorage('bee-news-v2', {
	categories: [] as string[],
	lang: '' as string,
});

const { data: configData } = useFetch<NewsConfig>(
	`${endpoint}/config`,
)
	.get()
	.json();

const langOptions = computed(() => {
	if (!configData.value)
		return [];
	return configData.value.languages.map((lang: string) => ({
		value: lang,
		label: lang === 'en' ? 'English' : lang === 'de' ? 'Deutsch' : lang,
	}));
});

const categoryOptions = computed(() => {
	if (!configData.value)
		return [];
	return configData.value.categories.map((cat: CategoryConfig) => ({
		value: cat.slug,
		label: locale.value === 'de' ? cat.name_de : cat.name_en,
	}));
});

const urlNews = computed(() => {
	const params = new URLSearchParams();
	if (newsStorage.value.lang)
		params.set('lang', newsStorage.value.lang);
	if (newsStorage.value.categories?.length) {
		for (const cat of newsStorage.value.categories)
			params.append('category', cat);
	}
	params.set('limit', String(pageSize));
	params.set('offset', String((page.value - 1) * pageSize));
	return `${endpoint}/news?${params.toString()}`;
});

const { isFetching, error, data } = useFetch<NewsItem[]>(urlNews, {
	refetch: true,
})
	.get()
	.json();

const filteredData = computed(() => {
	if (!data.value)
		return [];
	if (!searchQuery.value)
		return data.value;
	const q = searchQuery.value.toLowerCase();
	return data.value.filter(
		(item: NewsItem) =>
			item.title?.toLowerCase().includes(q)
			|| item.preview?.toLowerCase().includes(q),
	);
});

const hasMore = computed(() => {
	return data.value && data.value.length >= pageSize;
});

watch([() => newsStorage.value.lang, () => newsStorage.value.categories], () => {
	page.value = 1;
});

function openLink(link: string) {
	window.open(link, '_blank');
}

function isToday(date: string) {
	return (
		new Date(date).toISOString().slice(0, 10)
			=== new Date().toISOString().slice(0, 10)
	);
}

function isLatestNews(date: string) {
	return +new Date(date) > new Date().setDate(new Date().getDate() - 7);
}
</script>

<template>
	<q-card flat>
		<div class="row q-pa-sm justify-center">
			<div class="col-12">
				<div class="text-h5 q-pb-sm text-center">
					{{ $t('beekeepingNews') }}
				</div>
				<div class="text-subtitle2 q-pb-sm text-center">
					{{ $t('beekeepingNewsSubtitle') }}
				</div>

				<div v-if="error" class="text-center">
					<div class="text-negative text-h5">
						{{ $t('error.noData') }} 😱
					</div>
					<div>
						{{ error }}
					</div>
				</div>
				<q-input
					v-model="searchQuery"
					dense
					debounce="300"
					:placeholder="$t('search')"
				>
					<template #append>
						<q-icon name="fas fa-search" />
					</template>
				</q-input>
				<div class="row justify-between">
					<q-select
						v-model="newsStorage.categories"
						multiple
						:options="categoryOptions"
						:clearable="true"
						emit-value
						map-options
						style="width: 100%"
						:label="$t('category')"
					/>

					<q-select
						v-model="newsStorage.lang"
						:options="langOptions"
						:clearable="true"
						emit-value
						map-options
						style="width: 100%"
						:label="$t('language')"
					/>
				</div>
				<div v-if="isFetching" class="text-center">
					<GlobalLoading />
				</div>
				<div v-else-if="filteredData.length > 0">
					<div v-for="item in filteredData" :key="item.id">
						<q-card flat bordered>
							<q-card-section>
								<div
									class="text-h6 show-pointer"
									@click="openLink(item.link)"
								>
									<span v-if="isToday(item.published_at)"> 🔥 </span>
									<span
										v-else-if="isLatestNews(item.published_at)"
										style="opacity: 0.5"
									>
										🔥
									</span>
									{{ item.title }}
								</div>
								<div class="text-caption">
									{{ item.source }}
									<span class="text-weight-medium">|</span>
									{{ dateFormat.displayFormat(item.published_at) }}
								</div>
							</q-card-section>
							<q-card-section v-if="item.preview">
								<div class="text-subtitle2" style="line-break: loose">
									{{ truncate(item.preview, { length: 500 }) }}
								</div>
							</q-card-section>
							<q-card-section>
								<div class="row justify-between">
									<q-btn
										flat
										color="primary"
										:label="$t('readMore')"
										@click="openLink(item.link)"
									/>
								</div>
							</q-card-section>
						</q-card>
					</div>
					<div class="row justify-between q-pb-xl q-pt-sm">
						<div>
							<q-btn
								v-if="page > 1"
								flat
								color="primary"
								icon="fas fa-chevron-left"
								:label="$t('previous')"
								@click="page--"
							/>
						</div>
						<div>
							<q-btn
								v-if="hasMore"
								flat
								color="primary"
								icon-right="fas fa-chevron-right"
								:label="$t('next')"
								@click="page++"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</q-card>
</template>
