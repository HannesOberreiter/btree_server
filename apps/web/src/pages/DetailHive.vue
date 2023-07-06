<template>
  <q-card flat>
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
        <btn-previous-next :data="data" link="hive"></btn-previous-next>
        <div class="row justify-center">
          <!-- Hive Header -->
          <div class="col-12 col-md-8 q-pt-sm">
            <expansion-hive :data="data" @refetch="refetch()"></expansion-hive>
          </div>
        </div>
        <!-- Queen Header -->
        <div v-if="data.queen_location" class="row justify-center">
          <div class="col-12 col-md-8">
            <expansion-queen
              :data="data"
              @refetch="refetch()"
            ></expansion-queen>
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
          <q-tab name="task" :label="$t('task', 2)" />
          <q-tab name="info" :label="$t('info')" />
          <btn-dropdown-task
            @refetch="() => refetchCounter++"
          ></btn-dropdown-task>
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
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
              :year="year"
              :filter="filter"
              :filter-state="filterState"
              :opened="opened"
              :refetch="refetchCounter"
            ></list-tasks>
          </q-tab-panel>
          <q-tab-panel name="info" class="q-pa-xs">
            <div class="row">
              <div class="col-12 col-sm-6">
                <hive-info-movements :id="id"></hive-info-movements>
              </div>
              <div class="col-12 col-sm-6">
                <hive-info-queens :id="id"></hive-info-queens>
              </div>
            </div>
            <q-separator class="q-mt-sm q-mb-sm"></q-separator>
            <div class="row">
              <div class="col-12 col-sm-6">
                <hive-info-task :id="id" kind="harvest"></hive-info-task>
              </div>
              <div class="col-12 col-sm-6">
                <hive-info-task :id="id" kind="feed"></hive-info-task>
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
      <q-btn-dropdown
        size="sm"
        color="grey"
        icon="fas fa-cog"
        class="absolute-bottom-right print-hide"
      >
        <q-list>
          <q-item
            v-close-popup
            clickable
            class="print-hide"
            @click="opened = !opened"
          >
            <q-item-section>
              <q-item-label>{{ $t('toggle') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-close-popup clickable class="print-hide" @click="onPrint()">
            <q-item-section>
              <q-item-label>{{ $t('print') }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
    </div>
  </q-card>
</template>

<script lang="ts">
import { KINDS, STATUS } from '~/constants';
import { generateArrayOfYears } from '~/helpers';
import { Filter, FilterState } from '~/types';
</script>

<script setup lang="ts">
import { useMeta } from 'quasar';
import { useHiveQuery } from '~/composables/useQuery';
import dayjs from 'dayjs';

import HiveInfoMovements from '~/components/HiveInfoMovements.vue';
import HiveInfoQueens from '~/components/HiveInfoQueens.vue';
import HiveInfoTask from '~/components/HiveInfoTask.vue';
import ExpansionQueen from '~/components/ExpansionQueen.vue';
import ExpansionHive from '~/components/ExpansionHive.vue';
import BtnPreviousNext from '~/components/BtnPreviousNext.vue';
import BtnDropdownTask from '~/components/BtnDropdownTask.vue';

import ListTasks from '~/components/ListTasks.vue';
import { useI18n } from 'vue-i18n';
import { ref, computed, toRef } from 'vue';

const { t } = useI18n();
const tab = ref('task');
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
const { isLoading, data, refetch } = useHiveQuery({ id: id });

const years = computed(() =>
  generateArrayOfYears(
    data.value
      ? data.value.firstMovedate
        ? dayjs(data.value.firstMovedate.date).year()
        : 2000
      : 2000,
  ),
);

useMeta(() => {
  return {
    title: data.value
      ? `${t('hive')}: ${data.value.name} - b.tree`
      : t('hive') + ' - b.tree',
  };
});

function onPrint() {
  window.print();
}
</script>
