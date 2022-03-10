<template>
  <div class="row">
    <div v-if="isLoading" class="col-12 fixed-center">
      <q-spinner-pie color="orange" size="5.5em" />
    </div>
    <div v-else class="col-12">
      <div class="map">
        <l-map
          ref="mapRef"
          :zoom="apiaries.length > 0 ? 10 : zoom"
          :center="
            apiaries.length > 0
              ? [apiaries[0].latitude, apiaries[0].longitude]
              : center
          "
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
              @click="loadLocation"
              icon="fas fa-map-marker-alt"
            >
            </q-btn>
            <q-btn
              size="sm"
              color="black"
              class="bg-white"
              fab-mini
              flat
              @click="showInactive = !showInactive"
              :icon="!showInactive ? `fas fa-eye` : `fas fa-eye-slash`"
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
              url="//tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=fb76a3b8e45a7fc6b60d9b9767a88966"
              name="Perception"
              attribution="| Weather data &copy; <a href='https://openweathermap.org'>OpenWeatherMap</a>"
              layer-type="overlay"
              :max-zoom="zoomMax"
              :visible="false"
            ></l-tile-layer>
            <l-tile-layer
              url="//tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=fb76a3b8e45a7fc6b60d9b9767a88966"
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
              :fill-opacity="0.9"
              :radius="1"
            />
            <l-circle-marker
              :lat-lng="location.latlng"
              :radius="location.accuracy / 2"
              :stroke="false"
              :fill-opacity="0.3"
              color="black"
            />
          </template>
          <l-feature-group>
            <template v-for="value in apiaries" :key="value.id">
              <l-marker
                v-if="value.modus || showInactive"
                :lat-lng="[value.latitude, value.longitude]"
                :draggable="true"
                @dragstart="moveApiaryStart(value)"
                @dragend="moveApiaryEnd"
              >
                <l-popup>
                  <b>{{ value.name }}</b> [
                  <span v-if="value.hive_count">{{
                    value.hive_count.count + value.hive_count.grouphivescount
                  }}</span>
                  <span v-else>0</span>
                  ]
                  <br />
                  <small>{{ value.description }}</small>
                  <br />
                  <small>{{ value.note }}</small>
                  <br />
                  <q-btn
                    flat
                    dense
                    size="xs"
                    text-color="negative"
                    v-if="!value.hive_count && userStore.isAdmin"
                    @click="deleteApiary(value.id)"
                    >{{ t('delete') }}
                  </q-btn>
                </l-popup>
              </l-marker>
            </template>
          </l-feature-group>
          <l-feature-group>
            <template v-for="value in apiaries" :key="value.id">
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
  <dialog-hint :hint="t('map.hint')" v-model="showInfo"></dialog-hint>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css';
import { api } from 'boot/axios';
import { computed, ref } from 'vue';
import { remove } from 'lodash';
import { useApiariesQuery } from 'src/query';
import { useAuthUserStore } from '../stores/auth';
import { useI18n } from 'vue-i18n';
import { useNotification } from '../composables/useResponseText';
import { useQuasar } from 'quasar';
import DialogForm from 'src/components/DialogForm.vue';
import DialogHint from 'src/components/DialogHint.vue';
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

const { isLoading, data: apiaries } = useApiariesQuery();
const { t } = useI18n();
const $q = useQuasar();
const userStore = useAuthUserStore();
const notification = useNotification();

const paidStatus = computed(() => userStore.getPaidStatus);
const zoom = 2;
const zoomMax = 18;
const center = [47.4751336, 13.5968839];
const circleRadius = ref(1000);
const circleOpacity = 0.3;
const mapRef = ref(null as any);
const location = ref(null as any);
const userLocationLoading = ref(false);
const showInactive = ref(false);
const showInfo = ref(false);
let map = {} as any;
let dragObject = {} as any;
let oldLocation = {} as any;

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
  console.log('Could not access User Location');
}

function createApiaryForm(e: any) {
  if (userStore.isAdmin) {
    $q.dialog({
      component: DialogForm,
      componentProps: {
        title: 'newApiary',
        apiary: {
          name: '',
          description: '',
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
          url: '',
          note: '',
        },
      },
    }).onOk((e) => {
      apiaries.value.push(e);
    });
  }
}

function deleteApiary(value: string) {
  api.delete('/v1/apiary/' + value).then(
    (_response: any) => {
      remove(apiaries.value, { id: value });
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error);
    }
  );
}

function moveApiaryStart(value: any) {
  dragObject = value;
  oldLocation.value = { ...apiaries.value };
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
        (response: any) => {
          remove(apiaries.value, { id: response.data.id });
          apiaries.value.push(response.data);
          notification.open('positive', '');
        },
        (error) => {
          apiaries.value = oldLocation.value;
          notification.open('negative', error);
        }
      );
    })
    .onCancel(() => {
      apiaries.value = oldLocation.value;
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
