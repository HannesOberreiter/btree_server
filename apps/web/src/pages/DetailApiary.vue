<template>
  <q-card data-cy="page-detail-apiary">
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
          <q-tab name="weather" :label="$t('weather')" />
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
                <q-select
                  v-model="filter"
                  :options="KINDS"
                  :label="$t('filter')"
                  :option-label="(label) => $t(label)"
                ></q-select>
              </div>
            </div>
            <list-tasks
              :id="id"
              :apiary="true"
              :year="year"
              :filter="filter"
              :opened="opened"
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
import { KINDS } from '~/constants';
import { generateArrayOfYears } from '~/helpers';
</script>

<script setup lang="ts">
import { useApiaryQuery } from '~/composables/useQuery';
import { useMeta } from 'quasar';
import dayjs from 'dayjs';

const { t } = useI18n();
const tab = ref('hive');
const year = ref(dayjs().year());
const filter = ref('filterEmpty');
const opened = ref(false);

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
