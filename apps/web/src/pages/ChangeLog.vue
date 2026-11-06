<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNews } from '../composables/useNews';

const { isFetching, error, getNews } = useNews();
const { locale } = useI18n();

const lang = computed(() => {
  const l = locale.value;
  return l.startsWith('de') ? 'de' : 'en';
});

const dataFetched = computed(() => getNews(lang.value));

const filter = ref('');
</script>

<template>
  <div v-if="error" class="text-center">
    <div class="text-negative text-h5"> {{ $t('error.noData') }} 😱 </div>
    <div>
      {{ error }}
    </div>
  </div>
  <q-table
    v-else
    grid
    :rows="dataFetched"
    :title="$t('changelog')"
    :filter="filter"
    :rows-per-page-options="[10]"
    :loading="isFetching"
  >
    <template #item="props">
      <div class="q-pa-xs col-12">
        <q-card flat :bordered="true">
          <q-card-section class="text-left">
            <div v-for="(item, index) in props.row.items" :key="index">
              <b>{{ item.title }}</b>
              {{ item.description }}
            </div>
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
