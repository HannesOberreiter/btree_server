<template>
  <q-card data-cy="page-detail-apiary" flat>
    <q-card-section v-if="isLoading">
      <global-loading v-if="isLoading"></global-loading>
    </q-card-section>
    <q-card-section v-else-if="!data">
      <div class="row">
        <div class="col-12 text-h5">{{ $t('error404') }}</div>
      </div>
    </q-card-section>
    <div v-else>
      <q-card-section>
        <btn-previous-next :data="data" link="apiary"></btn-previous-next>
        <div class="row justify-center">
          <!-- Apiary Header -->
          <div class="col-12 col-md-8 q-pt-sm">
            <expansion-apiary
              :data="data"
              @refetch="refetch()"
            ></expansion-apiary>
          </div>
        </div>
      </q-card-section>
      <q-card-section class="q-pa-xs">
        <q-tabs
          v-model="tab"
          dense
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab name="hive" :label="$t('hive', 2)" />
          <q-tab name="task" :label="$t('task', 2)" />
          <q-tab name="weather" icon="fas fa-cloud-sun-rain">
            <tooltip-base>{{ $t('weather') }}</tooltip-base>
          </q-tab>
          <btn-dropdown-task
            @refetch="() => refetchCounter++"
          ></btn-dropdown-task>
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="hive" class="q-pa-xs">
            <list-hives
              v-if="data"
              :data="data"
              @change="refetch()"
            ></list-hives>
          </q-tab-panel>
          <q-tab-panel name="task" class="q-pa-xs">
            <div class="row">
              <div class="col-12 col-md-6">
                <q-select v-model="year" :options="years" :label="$t('year')">
                  <template #before>
                    <btn-base
                      icon="fas fa-arrow-left"
                      @click="year--"
                    ></btn-base>
                    <btn-base
                      icon="fas fa-arrow-right"
                      @click="year++"
                    ></btn-base>
                  </template>
                </q-select>
              </div>
              <div class="col-12 col-md-6">
                <div class="row">
                  <div class="col-6">
                    <q-select
                      v-model="filter"
                      :options="KINDS"
                      :label="$t('filter') + ' ' + $t('task')"
                      :option-label="(label) => $t(label)"
                    ></q-select>
                  </div>
                  <div class="col-6">
                    <q-select
                      v-model="filterState"
                      :options="STATUS"
                      :label="$t('filter') + ' ' + $t('status')"
                      :option-label="(label) => $t(label)"
                    ></q-select>
                  </div>
                </div>
              </div>
            </div>
            <list-tasks
              :id="id"
              :apiary="true"
              :year="year"
              :filter="filter"
              :filter-state="filterState"
              :opened="opened"
              :refetch="refetchCounter"
            ></list-tasks>
          </q-tab-panel>
          <q-tab-panel name="weather" class="q-pa-xs">
            <div class="row">
              <div class="col-12">
                <iframe-weather
                  :latlng="{
                    latitude: data.latitude,
                    longitude: data.longitude,
                  }"
                ></iframe-weather>
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </div>
  </q-card>
</template>

<script lang="ts">
import { KINDS, STATUS } from '~/constants';
import { generateArrayOfYears } from '~/helpers';
import { Filter, FilterState } from '~/types';
</script>

<script setup lang="ts">
import { useApiaryQuery } from '~/composables/useQuery';
import { useMeta } from 'quasar';
import dayjs from 'dayjs';

import BtnPreviousNext from '~/components/BtnPreviousNext.vue';
import ExpansionApiary from '~/components/ExpansionApiary.vue';
import ListHives from '~/components/ListHives.vue';
import ListTasks from '~/components/ListTasks.vue';
import BtnDropdownTask from '~/components/BtnDropdownTask.vue';

import IframeWeather from '~/components/IframeWeather.vue';

import { useI18n } from 'vue-i18n';
import { ref, computed, toRef } from 'vue';

const { t } = useI18n();
const tab = ref('hive');
const year = ref(dayjs().year());
const filter = ref<Filter>('filterEmpty');
const filterState = ref<FilterState>(STATUS[0]);
const opened = ref(false);
const refetchCounter = ref(0);

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});
const id = toRef(props, 'id');
const { isLoading, data, refetch } = useApiaryQuery({ id: id });

const years = computed(() =>
  generateArrayOfYears(
    data.value
      ? data.value.firstMovedate
        ? dayjs(data.value.firstMovedate.date).year()
        : 2000
      : 2000
  )
);

useMeta(() => {
  return {
    title: data.value
      ? `${t('apiary')}: ${data.value.name} - b.tree`
      : t('apiary') + ' - b.tree',
  };
});
</script>
