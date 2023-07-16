<template>
  <div class="row justify-center">
    <div v-if="isLoading" class="col-1">
      <global-loading></global-loading>
    </div>
    <div v-else class="col-12">
      <div class="map">
        <l-map
          ref="mapRef"
          :zoom="zoom"
          :center="apiaries.center"
          loading-control="true"
          @ready="onMapReady"
          @locationfound="onLocationFound"
          @locationerror="onLocationError"
        >
          <map-buttons
            v-model:modelRadius="circleRadius"
            :user-location-loading="userLocationLoading"
            @locate="loadLocation"
            @toggle="(v) => (showInactive = v)"
          >
          </map-buttons>
          <map-overlay></map-overlay>

          <l-circle-marker
            v-if="location"
            :lat-lng="location.latlng"
            color="black"
            :radius="location.accuracy ? location.accuracy : 50"
          />
          <l-feature-group v-if="apiaries" :key="updateTimestamp">
            <template v-for="value in apiaries.results" :key="value.id">
              <l-circle
                v-if="value.modus || showInactive"
                :lat-lng="[value.latitude, value.longitude]"
                :radius="circleRadius"
                :fill="true"
                :color="value.modus ? 'green' : 'red'"
                :fill-opacity="circleOpacity"
              >
              </l-circle>
              <l-marker
                v-if="value.modus || showInactive"
                :options="{ alt: value.name }"
                :lat-lng="[value.latitude, value.longitude]"
                :draggable="true"
                @dragstart="moveApiaryStart(value)"
                @dragend="moveApiaryEnd"
              >
                <l-popup>
                  <div class="text-h6">
                    <b>{{ value.name }}</b> [
                    <span v-if="value.hive_count">{{
                      value.hive_count.count + value.hive_count.grouphivescount
                    }}</span>
                    <span v-else>0</span>
                    ]
                  </div>
                  <div v-if="value.description" class="text-caption">
                    {{ value.description }}
                  </div>
                  <div v-if="value.note">{{ value.note }}</div>
                  <btn-base-group
                    v-if="userStore.isAdmin"
                    class="q-mt-sm"
                    size="sm"
                  >
                    <btn-base
                      color="secondary"
                      @click="editApiaryForm(value.id)"
                      >{{ t('edit') }}
                    </btn-base>
                    <btn-base
                      v-if="!value.hive_count"
                      color="negative"
                      :data-cy="`btn-delete-${value.name}`"
                      @click="deleteApiary(value.id)"
                      >{{ t('delete') }}
                    </btn-base>
                  </btn-base-group>
                </l-popup>
              </l-marker>
            </template>
          </l-feature-group>
        </l-map>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApiariesQuery, useInvalidateQueries } from '~/composables/useQuery';
import { useAuthUserStore } from '~/stores/auth';
import { useNotification } from '~/composables/useNotification';
import DialogForm from '~/components/DialogForm.vue';
import {
  LMap,
  LPopup,
  LCircle,
  LCircleMarker,
  LFeatureGroup,
  LMarker,
} from '@vue-leaflet/vue-leaflet';
import { useApiFetch } from '~/composables/useApi';
import { useQuasar } from 'quasar';

import MapButtons from '~/components/MapButtons.vue';
import MapOverlay from '~/components/MapOverlay.vue';

import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';

const api = useApiFetch();
const {
  isLoading,
  data: apiaries,
  refetch,
} = useApiariesQuery({ modus: null });
const updateTimestamp = ref(Date()); // helper to update layer

const { t } = useI18n();
const $q = useQuasar();
const userStore = useAuthUserStore();
const notification = useNotification();
const useInvalidate = useInvalidateQueries();

const zoom = computed(() => (isLoading.value ? 2 : 9));
const circleRadius = ref(1000);
const circleOpacity = 0.3;
const mapRef = ref(null as any);
const location = ref(null as any);
const userLocationLoading = ref(false);
const showInactive = ref(false);
let map = {} as any;
let dragObject = {} as any;

const onMapReady = () => {
  map = mapRef.value.leafletObject;
  map.doubleClickZoom.disable();
  map.scrollWheelZoom.enable();
  map.on('dblclick', function (e: any) {
    createApiaryForm(e);
  });
};

function loadLocation() {
  userLocationLoading.value = true;
  map.locate();
}
function onLocationFound(e: any) {
  userLocationLoading.value = false;
  location.value = e;
  map.setView(location.value.latlng, 10);
}
function onLocationError() {
  userLocationLoading.value = false;
  notification.open('negative', 'locationError');
}

function createApiaryForm(e: any) {
  if (userStore.isAdmin) {
    $q.dialog({
      component: DialogForm,
      componentProps: {
        title: 'newApiary',
        form: 'apiary',
        latlng: e.latlng,
      },
    }).onOk((e) => {
      refetch().then(
        () => console.log(e),
        (error) => console.error(error),
      );
    });
  }
}
function editApiaryForm(e: any) {
  if (userStore.isAdmin) {
    $q.dialog({
      component: DialogForm,
      componentProps: {
        title: 'apiaryEdit',
        form: 'apiary',
        ids: [e],
      },
    }).onOk((e) => {
      refetch().then(
        () => console.log(e),
        (error) => console.error(error),
      );
    });
  }
}
function deleteApiary(value: string) {
  api.patch('/v1/apiary/batchDelete', { ids: [value] }).then(
    async (_response: any) => {
      useInvalidate.invalidate('apiary');
      //await refetch();
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error);
    },
  );
}
function moveApiaryStart(value: any) {
  dragObject = value;
  map.closePopup();
}
function moveApiaryEnd(e: any) {
  const data = JSON.stringify({
    ids: [dragObject.id],
    data: {
      latitude: e.target._latlng.lat,
      longitude: e.target._latlng.lng,
    },
  });
  $q.dialog({
    title: t('confirm'),
    message: t('map.move', { msg: dragObject.name }),
    cancel: true,
    persistent: true,
  })
    .onOk(() => {
      api.patch('/v1/apiary', data).then(
        async (_response: any) => {
          await refetch();
          notification.open('positive', '');
        },
        (error) => {
          updateTimestamp.value = Date();
          notification.open('negative', error);
        },
      );
    })
    .onCancel(async () => {
      updateTimestamp.value = Date();
    });
}
</script>

<style>
.map {
  height: 85vh;
}

.leaflet-top,
.leaflet-bottom {
  z-index: 900;
}
</style>
