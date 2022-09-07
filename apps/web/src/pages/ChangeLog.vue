<template>
  <div v-if="error" class="text-center">
    <div class="text-negative text-h5">{{ $t('error.noData') }} 😱</div>
    <div>
      {{ error }}
    </div>
  </div>
  <q-table
    v-else
    grid
    :rows="data"
    :title="$t('changelog')"
    :filter="filter"
    :rows-per-page-options="[10]"
    :loading="isFetching"
  >
    <template #item="props">
      <div class="q-pa-xs col-12">
        <q-card
          flat
          :bordered="true"
          :class="
            props.row.version === data[0].version
              ? 'bg-orange-3 text-black'
              : ''
          "
        >
          <q-card-section class="text-left">
            <q-icon
              v-if="props.row.version === data[0].version"
              square
              color="orange"
              name="fas fa-star"
              :size="$q.screen.gt.xs ? 'lg' : 'xs'"
              class="absolute-top-right q-pa-sm"
            >
              <tooltip-base>{{ $t('latest') }}</tooltip-base>
            </q-icon>
            <ul>
              <li v-for="(item, index) in props.row.news" :key="index">
                <b>{{ item.substring(0, item.indexOf(' ')) }}</b>
                {{ item.substring(item.indexOf(' ') + 1) }}
              </li>
            </ul>
          </q-card-section>

          <q-card-section class="q-pa-xs text-right">
            <span class="text-weight-medium">{{ $t('version') }}:</span>
            {{ props.row.version }},
            <span class="text-weight-medium">{{ $t('date') }}:</span>
            {{ props.row.date }}
          </q-card-section>
        </q-card>
      </div>
    </template>
    <template #top-right>
      <q-input
        v-model="filter"
        dense
        debounce="300"
        :placeholder="$t('search')"
      >
        <template #append>
          <q-icon name="fas fa-search" />
        </template>
      </q-input>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { useFetch } from '@vueuse/core';

const { isFetching, error, data }: any = useFetch(
  '/news.json?cache=' + Date.now()
)
  .get()
  .json();

const filter = ref('');
</script>
