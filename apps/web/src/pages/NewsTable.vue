<template>
  <q-table
    grid
    :rows="rows"
    :title="t('news')"
    :filter="filter"
    :rows-per-page-options="[10]"
  >
    <template #item="props">
      <div class="q-pa-xs col-12">
        <q-card
          flat
          :bordered="true"
          :class="
            props.row.version === rows[0].version
              ? 'bg-orange-3 text-black'
              : ''
          "
        >
          <q-card-section class="text-left">
            <q-chip
              v-if="props.row.version === rows[0].version"
              square
              color="orange"
              text-color="white"
              icon-right="fas fa-star"
              class="absolute-top-right"
            >
              {{ t('latest') }}
            </q-chip>
            <news-directive
              :key="props.row.date"
              :news="props.row.news.toString()"
            ></news-directive>
          </q-card-section>

          <q-card-section class="q-pa-xs text-right">
            <span class="text-weight-medium">{{ t('version') }}:</span>
            {{ props.row.version }},
            <span class="text-weight-medium">{{ t('date') }}:</span>
            {{ props.row.date }}
          </q-card-section>
        </q-card>
      </div>
    </template>
    <template #top-right>
      <q-input v-model="filter" dense debounce="300" :placeholder="t('search')">
        <template #append>
          <q-icon name="fas fa-search" />
        </template>
      </q-input>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import news from '~/assets/news.json';
import NewsDirective from '~/components/NewsDirective.vue';

const { t } = useI18n();
const filter = ref('');

const rows = news.aaData;
</script>
