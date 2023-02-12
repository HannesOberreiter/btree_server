<template>
  <q-card>
    <div class="row q-pa-sm justify-center">
      <div class="col-6">
        <div class="text-h5 text-left">
          {{ $t('statistic') }} {{ $t(props.kind) }}
        </div>
      </div>
      <div class="col-6 text-right">
        <btn-base-group>
          <btn-base
            :color="filter ? 'negative' : 'warning'"
            :label="$t('filter')"
            :icon-right="
              filter ? 'fas fa-filter' : 'fas fa-filter-circle-xmark'
            "
            @click="openFilter"
          >
          </btn-base>
          <btn-base
            :disable="tab === 'year'"
            label="-"
            color="blue-5"
            @click="changeYear(-1)"
          ></btn-base>
          <btn-base
            label="+"
            color="blue-8"
            :disable="filterYear > new Date().getFullYear() || tab === 'year'"
            @click="changeYear(1)"
          ></btn-base>
          <tooltip-base>{{ $t('change') + ' ' + $t('year') }}</tooltip-base>
        </btn-base-group>
      </div>
    </div>
    <q-separator></q-separator>
    <q-tabs
      v-model="tab"
      :no-caps="true"
      align="justify"
      active-bg-color="secondary"
      indicator-color="secondary"
      class="bg-grey-8 text-white"
    >
      <q-tab name="year" :label="$t('yearly')" />
      <q-tab name="apiary" :label="$t('apiary', 2)" />
      <q-tab name="type" :label="$t('type', 2)" />
    </q-tabs>
    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="year" class="no-padding">
        <statistic-task-year :kind="kind"></statistic-task-year>
      </q-tab-panel>
      <q-tab-panel name="apiary" class="no-padding">
        <statistic-task-apiary :kind="kind"></statistic-task-apiary>
      </q-tab-panel>
      <q-tab-panel name="type" class="no-padding">
        <statistic-task-type :kind="kind"></statistic-task-type>
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useTableFilterStore } from '~/stores/tableFilter';
import DialogFilter from '~/components/DialogFilter.vue';

import StatisticTaskYear from '~/components/StatisticTaskYear.vue';
import StatisticTaskApiary from '~/components/StatisticTaskApiary.vue';
import StatisticTaskType from '~/components/StatisticTaskType.vue';
import { toRef, ref, unref, computed } from 'vue';

const props = defineProps({
  kind: {
    type: String,
    required: true,
  },
});

const kind = toRef(props, 'kind');

const $q = useQuasar();
const tab = ref('year');
const storeFilter = useTableFilterStore();
const STATSSTORE = 'statistic_' + unref(kind);
storeFilter.reset(STATSSTORE);
const filter = computed(() => storeFilter.table(STATSSTORE) !== '');
const filterYear = computed(() => storeFilter.field(STATSSTORE, 'year'));

function changeYear(change: number) {
  storeFilter.updateYear(STATSSTORE, change);
}

function openFilter() {
  $q.dialog({
    component: DialogFilter,
    componentProps: {
      form: STATSSTORE,
    },
  });
}
</script>
