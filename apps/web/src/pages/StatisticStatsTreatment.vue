<template>
  <q-card>
    <div class="row q-pa-sm justify-center">
      <div class="col-12">
        <div class="text-h5 text-center">
          {{ $t('statistic') }} {{ $t('treatment') }}
          <btn-base
            :color="filter ? 'negative' : 'warning'"
            :label="$t('filter')"
            :icon-right="
              filter ? 'fas fa-filter' : 'fas fa-filter-circle-xmark'
            "
            class="float-right"
            @click="openFilter"
          >
          </btn-base>
        </div>
      </div>
    </div>
    <q-separator></q-separator>
    <q-tabs
      v-model="tab"
      :no-caps="true"
      align="justify"
      active-bg-color="secondary"
      indicator-color="secondary"
      class="bg-grey-8 text-white shadow-2"
    >
      <q-tab name="year" :label="$t('yearly')" />
      <q-tab name="apiary" :label="$t('apiary', 2)" />
      <q-tab name="type" :label="$t('type', 2)" />
    </q-tabs>
    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="year">
        <q-card-section>
          <statistic-task-year :kind="KIND"></statistic-task-year>
        </q-card-section>
      </q-tab-panel>
      <q-tab-panel name="apiary">
        <q-card-section>
          <suspense>
            <statistic-task-apiary :kind="KIND"></statistic-task-apiary>
          </suspense>
        </q-card-section>
      </q-tab-panel>
      <q-tab-panel name="type">
        <q-card-section>
          <suspense>
            <statistic-task-type :kind="KIND"></statistic-task-type>
          </suspense>
        </q-card-section>
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useTableFilterStore } from '~/stores/tableFilter';
import DialogFilter from '~/components/DialogFilter.vue';

const $q = useQuasar();
const tab = ref('year');
const storeFilter = useTableFilterStore();
const KIND = 'treatment';
const STATSSTORE = 'statistic_' + KIND;
storeFilter.reset(STATSSTORE);
const filter = computed(() => storeFilter.table(STATSSTORE) !== '');

function openFilter() {
  $q.dialog({
    component: DialogFilter,
    componentProps: {
      form: STATSSTORE,
    },
  });
}
</script>
