<script setup lang="ts">
import { Ref, computed, ref, watch } from 'vue';
import { stringify } from 'qs';
import { useFetch, useStorage, watchOnce } from '@vueuse/core';
import { truncate } from 'lodash-es';
import { useDateFormat } from '~/composables/useDate';
import GlobalLoading from '~/components/GlobalLoading.vue';
import ChipBeeNews, { Feedsource } from '~/components/ChipBeeNews.vue';
import { useKeyNews } from '~/composables/useKey';

type FeedItem = {
  id: number;
  attributes: {
    title: string;
    preview: string;
    link: string;
    creator: string;
    sponsored: boolean;
    published: string;
    createdAt: string;
    updatedAt: string;
    feedsource: {
      data: Feedsource;
    };
  };
};

type Pagination = {
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
};

type APIResponse = {
  data: FeedItem[];
  meta: Pagination;
};

const endpoint = 'https://api.beekeeping-news.com';
const bearer = process.env.BEEKEEPING_NEWS_BEARER;
const searchQuery = ref('');
const page = ref(1);
useKeyNews(page);
const dateFormat = useDateFormat();
const newsStorage = useStorage('bee-news', {
  sourceIds: [],
  langIds: [],
});
const langOptions = ref([
  {
    value: '1',
    label: 'English',
  },
  {
    value: '3',
    label: 'Deutsch',
  },
]);
const sourceOptions = ref([]);
const sourceParams = createParams('sources');
const sourceParamsString = stringify(sourceParams.params, {
  arrayFormat: 'indices',
  encode: false,
});
const { data: sourceData } = useFetch(
  `${endpoint}/api/${sourceParams.url}?${sourceParamsString}`,
  {
    beforeFetch: (url) => {
      url.options.headers = {
        Authorization: 'Bearer ' + bearer,
      };
    },
  },
)
  .get()
  .json();

watchOnce(sourceData, () => {
  if (sourceData.value) {
    sourceOptions.value = sourceData.value.data.map((item: any) => {
      return { value: item.id, label: item.attributes.source };
    });
  }
});

const urlNews = computed(() => {
  const params = {
    filters: {
      sponsored: false,
      $and: [
        {
          $or: [
            {
              title: {
                $containsi: searchQuery.value,
              },
            },
            {
              preview: {
                $containsi: searchQuery.value,
              },
            },
          ],
          feedsource: {
            id: {
              $in: newsStorage.value.sourceIds ?? [],
            },
            language: {
              id: {
                $in: newsStorage.value.langIds ?? [],
              },
            },
          },
        },
      ],
    },
    sort: ['createdAt:desc'],
    populate: [
      'feedsource',
      'feedsource.categories',
      'feedsource.categories.localizations',
      'feedsource.language',
      'feedsource.language.localizations',
    ],
    pagination: {
      page: page.value,
      pageSize: 10,
    },
  };
  return `${endpoint}/api/newsitems?${stringify(params, {
    arrayFormat: 'indices',
    encode: false,
  })}`;
});

const {
  isFetching,
  error,
  data,
}: { isFetching: Ref<boolean>; error: Ref<any>; data: Ref<APIResponse> } =
  useFetch(urlNews, {
    refetch: true,
    beforeFetch: (url) => {
      url.options.headers = {
        Authorization: 'Bearer ' + bearer,
      };
    },
  })
    .get()
    .json();

watch(data, () => {
  if (data.value) {
    page.value = data.value.meta.pagination.page;
  }
});

function openLink(link: string) {
  window.open(link, '_blank');
}

function isToday(date: string) {
  return (
    new Date(date).toISOString().slice(0, 10) ===
    new Date().toISOString().slice(0, 10)
  );
}

function isLatestNews(date: string) {
  return +new Date(date) > new Date().setDate(new Date().getDate() - 7);
}

function createParams(name: string) {
  if (name === 'sources') {
    return {
      url: 'feedsources',
      params: {
        filters: {
          enabled: true,
        },
        sort: ['source:asc'],
        pagination: {
          page: 1,
          pageSize: 500,
        },
      },
    };
  } else {
    return {
      url: name,
      params: {
        populate: ['localizations'],
        sort: ['name:asc'],
        pagination: {
          page: 1,
          pageSize: 500,
        },
      },
    };
  }
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
          <div class="text-negative text-h5">{{ $t('error.noData') }} 😱</div>
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
            v-model="newsStorage.sourceIds"
            multiple
            :options="sourceOptions"
            :clearable="true"
            emit-value
            map-options
            style="width: 100%"
            :label="$t('source')"
          />

          <q-select
            v-model="newsStorage.langIds"
            :options="langOptions"
            :clearable="true"
            emit-value
            map-options
            style="width: 100%"
            :label="$t('language')"
          />
        </div>
        <div v-if="isFetching" class="text-center">
          <global-loading></global-loading>
        </div>
        <div v-else-if="data">
          <div v-for="item in data.data" :key="item.id">
            <q-card flat bordered>
              <q-card-section>
                <div
                  class="text-h6 show-pointer"
                  @click="openLink(item.attributes.link)"
                >
                  <span v-if="isToday(item.attributes.createdAt)"> 🔥 </span>
                  <span
                    v-else-if="isLatestNews(item.attributes.createdAt)"
                    style="opacity: 0.5"
                  >
                    🔥
                  </span>
                  {{ item.attributes.title }}
                </div>
                <div class="text-caption">
                  {{ item.attributes.feedsource.data.attributes.source }}
                  <span class="text-weight-medium">|</span>
                  {{ dateFormat.displayFormat(item.attributes.createdAt) }}
                </div>
              </q-card-section>
              <q-card-section v-if="item.attributes.preview">
                <div class="text-subtitle2" style="line-break: loose">
                  {{ truncate(item.attributes.preview, { length: 500 }) }}
                </div>
              </q-card-section>
              <q-card-section>
                <div class="row justify-between">
                  <chip-bee-news
                    :data="item.attributes.feedsource.data"
                  ></chip-bee-news>

                  <q-btn
                    flat
                    color="primary"
                    :label="$t('readMore')"
                    @click="openLink(item.attributes.link)"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="row justify-between q-pb-xl">
            <div class="col-6">
              <q-pagination
                v-model="page"
                :max="data.meta.pagination.pageCount"
                input
              />
            </div>
            <div class="col-6 text-right">
              {{ $t('total') }}: {{ data.meta.pagination.total }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-card>
</template>
