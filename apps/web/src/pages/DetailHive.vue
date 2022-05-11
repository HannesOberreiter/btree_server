<template>
  <q-card>
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
      <q-card-section>
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
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="task">
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
                <q-select
                  v-model="filter"
                  :options="KINDS"
                  :label="$t('filter')"
                  :option-label="(label) => $t(label)"
                ></q-select>
              </div>
            </div>
            <list-tasks :id="id" :year="year" :filter="filter"></list-tasks>
          </q-tab-panel>
          <q-tab-panel name="info">
            <div class="row">
              <div class="col-12">
                <hive-info-movements :id="id"></hive-info-movements>
              </div>
            </div>
            <q-separator class="q-mt-sm q-mb-sm"></q-separator>
            <div class="row">
              <div class="col-12">
                <hive-info-queens :id="id"></hive-info-queens>
              </div>
            </div>
            <div class="row">
              <div class="col-12">
                <hive-info-harvest :id="id"></hive-info-harvest>
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </div>
  </q-card>
</template>

<script lang="ts">
import { KINDS } from '~/constants';
import { generateArrayOfYears } from '~/helpers';
</script>

<script setup lang="ts">
import { useMeta } from 'quasar';
import { useHiveQuery } from '~/composables/useQuery';
import dayjs from 'dayjs';

const { t } = useI18n();
const tab = ref('task');
const year = ref(dayjs().year());
const filter = ref('filterEmpty');

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
      : 2000
  )
);

watch(data, () => console.log(data.value));

useMeta(() => {
  return {
    title: data.value
      ? `${t('hive')}: ${data.value.name} - b.tree`
      : t('hive') + ' - b.tree',
  };
});
</script>
