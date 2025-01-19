import { useFetch } from '@vueuse/core';
import type { Ref } from 'vue';
import { computed, ref } from 'vue';

type News = {
  version: string;
  date: string;
  news: string[];
};

const currentVersion = ref<News>();

const {
  isFetching,
  error,
  data,
}: { isFetching: Ref<boolean>; error: Ref<any>; data: Ref<News[] | null> } =
  useFetch('/news.json?cache=' + Date.now())
    .get()
    .json();

export const useNews = () => {
  async function loadCurrentNews() {
    const local = await fetch('/news.json');
    const file = (await local.json()) as News[];
    return (currentVersion.value = file[0]);
  }

  const isOutdated = computed(() => {
    if (!data.value) return false;
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
};
