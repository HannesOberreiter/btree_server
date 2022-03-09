<template>
  <q-table
    grid
    :rows="rows"
    :title="t('news')"
    :filter="filter"
    :rows-per-page-options="[10]"
  >
    <template v-slot:item="props">
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
              :news="props.row.news.toString()"
              :key="props.row.date"
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
    <template v-slot:top-right>
      <q-input dense debounce="300" v-model="filter" :placeholder="t('search')">
        <template v-slot:append>
          <q-icon name="fas fa-search" />
        </template>
      </q-input>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import news from 'src/assets/news.json';
import { ref } from 'vue';
import NewsDirective from 'src/components/NewsDirective.vue';

const { t } = useI18n();
const filter = ref('');

const rows = news.aaData;
</script>
