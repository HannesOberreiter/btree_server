<template>
  <div class="row justify-center">
    <div v-if="isLoading" class="col-1">
      <global-loading></global-loading>
    </div>
    <div v-else class="col-12">
      <div class="map">
        <l-map
          v-if="!isLoading"
          ref="mapRef"
          :zoom="zoom"
          :center="apiaries.center"
          loading-control="true"
          @ready="onMapReady"
          @locationfound="onLocationFound"
          @locationerror="onLocationError"
        >
          <l-control position="bottomleft" class="d-print-none">
            <q-btn
              size="sm"
              color="black"
              class="bg-white"
              fab-mini
              flat
              :loading="userLocationLoading"
              icon="fas fa-map-marker-alt"
              @click="loadLocation"
            >
            </q-btn>
            <q-btn
              size="sm"
              color="black"
              class="bg-white"
              fab-mini
              flat
              :icon="!showInactive ? `fas fa-eye` : `fas fa-eye-slash`"
              @click="showInactive = !showInactive"
            >
            </q-btn>
            <q-btn
              size="sm"
              color="black"
              class="bg-white"
              fab-mini
              flat
              icon="fas fa-question"
              @click="showInfo = !showInfo"
            ></q-btn>
          </l-control>
          <l-control position="bottomright">
            <q-slider
              v-model="circleRadius"
              color="secondary"
              :min="0"
              :max="4000"
              :step="50"
              :label-value="t('map.radius') + ' ' + circleRadius + 'm'"
              label-always
              style="min-width: 20vh"
            >
            </q-slider>
          </l-control>

          <l-tile-layer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            layer-type="base"
            name="OpenStreetMap"
            attribution="Map data &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors, <a href='http://creativecommons.org/licenses/by-sa/2.0/''>CC-BY-SA</a>"
            :max-zoom="zoomMax"
          ></l-tile-layer>
          <l-tile-layer
            url="//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            layer-type="base"
            name="Esri"
            attribution="&copy; <a href='http://www.esri.com/'>Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            :max-zoom="zoomMax"
            :visible="false"
          ></l-tile-layer>
          <template v-if="paidStatus.status">
            <l-tile-layer
              :url="`//tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API}`"
              name="Perception"
              attribution="| Weather data &copy; <a href='https://openweathermap.org'>OpenWeatherMap</a>"
              layer-type="overlay"
              :max-zoom="zoomMax"
              :visible="false"
            ></l-tile-layer>
            <l-tile-layer
              :url="`//tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API}`"
              name="Temperature"
              attribution="| Weather data &copy; <a href='https://openweathermap.org'>OpenWeatherMap</a>"
              layer-type="overlay"
              :max-zoom="zoomMax"
              :visible="false"
            ></l-tile-layer>
          </template>
          <l-control-layers />
          <template v-if="location">
            <l-circle-marker
              :lat-lng="location.latlng"
              color="black"
              :radius="location.accuracy ? location.accuracy : 50"
            />
          </template>
          <l-feature-group v-if="apiaries" :key="updateTimestamp">
            <template v-for="value in apiaries.result" :key="value.id">
              <l-marker
                v-if="value.modus || showInactive"
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
                  <q-btn-group v-if="userStore.isAdmin" spread class="q-mt-sm">
                    <q-btn
                      unelevated
                      size="sm"
                      color="secondary"
                      @click="editApiaryForm(value.id)"
                      >{{ t('edit') }}
                    </q-btn>
                    <q-btn
                      v-if="!value.hive_count"
                      unelevated
                      size="sm"
                      color="negative"
                      @click="deleteApiary(value.id)"
                      >{{ t('delete') }}
                    </q-btn>
                  </q-btn-group>
                </l-popup>
              </l-marker>
            </template>
          </l-feature-group>
          <l-feature-group v-if="apiaries" :key="updateTimestamp + 'radius'">
            <template v-for="value in apiaries.result" :key="value.id">
              <l-circle
                v-if="value.modus || showInactive"
                :lat-lng="[value.latitude, value.longitude]"
                :radius="circleRadius"
                :fill="true"
                :color="value.modus ? 'green' : 'red'"
                :fill-opacity="circleOpacity"
              >
              </l-circle>
            </template>
          </l-feature-group>
        </l-map>
      </div>
    </div>
  </div>
  <dialog-hint v-model="showInfo" :hint="t('map.hint')"></dialog-hint>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css';
import { api } from '~/boot/axios';
import { computed, ref } from 'vue';
import { useApiariesQuery } from '~/query';
import { useAuthUserStore } from '~/stores/auth';
import { useI18n } from 'vue-i18n';
import { useNotification } from '~/composables/useResponseText';
import { useQuasar } from 'quasar';
import DialogForm from '~/components/DialogForm.vue';
import DialogHint from '~/components/DialogHint.vue';
import GlobalLoading from '~/components/GlobalLoading.vue';
import {
  LMap,
  LTileLayer,
  LPopup,
  LControlLayers,
  LCircle,
  LCircleMarker,
  LControl,
  LFeatureGroup,
  LMarker,
} from '@vue-leaflet/vue-leaflet';

const { isLoading, data: apiaries, refetch } = useApiariesQuery();
const updateTimestamp = ref(Date()); // helper to update layer

const { t } = useI18n();
const $q = useQuasar();
const userStore = useAuthUserStore();
const notification = useNotification();

const zoomMax = 18;
const paidStatus = computed(() => userStore.getPaidStatus);
const zoom = ref(apiaries.value.result.length > 0 ? 9 : 2);
const circleRadius = ref(1000);
const circleOpacity = 0.3;
const mapRef = ref(null as any);
const location = ref(null as any);
const userLocationLoading = ref(false);
const showInactive = ref(false);
const showInfo = ref(false);
let map = {} as any;
let dragObject = {} as any;

const OPENWEATHER_API = process.env.OPENWEATHER_APP_ID;
const onMapReady = () => {
  zoom.value = apiaries.value.result.length > 0 ? 9 : 2;
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
  console.log('Could not access User Location');
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
      refetch.value().then(
        () => console.log(e),
        (error) => console.log(error)
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
        id: e,
      },
    }).onOk((e) => {
      refetch.value().then(
        () => console.log(e),
        (error) => console.log(error)
      );
    });
  }
}
function deleteApiary(value: string) {
  api.delete('/v1/apiary/' + value).then(
    async (_response: any) => {
      await refetch.value();
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error);
    }
  );
}

function moveApiaryStart(value: any) {
  dragObject = value;
  map.closePopup();
}
function moveApiaryEnd(e: any) {
  const data = JSON.stringify({
    id: dragObject.id,
    latitude: e.target._latlng.lat,
    longitude: e.target._latlng.lng,
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
          await refetch.value();
          notification.open('positive', '');
        },
        (error) => {
          updateTimestamp.value = Date();
          notification.open('negative', error);
        }
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
