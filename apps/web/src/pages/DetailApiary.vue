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
          <q-tab name="hive" :label="$t('hive', 2)" />
          <q-tab name="weather" :label="$t('weather')" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="hive">
            <list-hives
              v-if="data"
              :data="data"
              @change="refetch()"
            ></list-hives>
          </q-tab-panel>
          <q-tab-panel name="weather">
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

<script setup lang="ts">
import { useApiaryQuery } from '~/composables/useQuery';
import { useMeta } from 'quasar';

const { t } = useI18n();
const tab = ref('hive');

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});
const id = toRef(props, 'id');
const { isLoading, data, refetch } = useApiaryQuery({ id: id });

useMeta(() => {
  return {
    title: data.value
      ? `${t('apiary')}: ${data.value.name} - b.tree`
      : t('apiary') + ' - b.tree',
  };
});
</script>
