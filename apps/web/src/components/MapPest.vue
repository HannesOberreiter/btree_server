<template>
  <l-map
    ref="mapRef"
    :zoom="zoom"
    :center="apiaries?.center ?? [49.4582838, 15.2718234]"
    loading-control="true"
    @ready="onMapReady"
    @locationfound="onLocationFound"
    @locationerror="onLocationError"
  >
    <map-buttons
      v-model:modelRadius="circleRadius"
      :user-location-loading="userLocationLoading"
      :is-public="isPublic"
      @locate="loadLocation"
      @toggle="(v) => (showInactive = v)"
    >
    </map-buttons>

    <pest-map-layers
      :recent-count="recentCount"
      :taxa="taxa"
      :is-public="isPublic"
    >
      <q-select
        v-if="!isPublic"
        v-model="year"
        :options="yearOptions"
        :dense="true"
        :filled-input="true"
        :label="$t('year')"
        color="dark"
        :dark="false"
        popup-content-class="text-dark"
      ></q-select>
      <div v-else>
        <b>
          Service by
          <a href="https://www.btree.at" target="_blank">b.tree</a>
        </b>
      </div>
    </pest-map-layers>

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
          :draggable="false"
          :icon="icon"
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
          </l-popup>
        </l-marker>
      </template>
    </l-feature-group>
  </l-map>
</template>

<script lang="ts">
type Observation = {
  location: {
    x: number;
    y: number;
  };
  uri: string;
  observed_at: string;
  localDate: string;
  isRecentObservation: boolean;
};
</script>

<script setup lang="ts">
import type { LatLngTuple } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import { useApiariesQuery } from '../composables/useQuery';
import { useNotification } from '../composables/useNotification';
import {
  LMap,
  LPopup,
  LCircle,
  LCircleMarker,
  LFeatureGroup,
  LMarker,
} from '@vue-leaflet/vue-leaflet';
import { useApiFetch } from '../composables/useApi';
import MapButtons from './MapButtons.vue';
import { computed, onBeforeUnmount, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import PestMapLayers from './PestMapLayers.vue';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();
let map = undefined as any;

const props = defineProps({
  isPublic: {
    type: Boolean,
    default: false,
  },
});
const { isPublic } = toRefs(props);

const icon = new L.Icon.Default() as any;
icon.options.shadowSize = [0, 0];

const taxa = computed(() => {
  const name = router.currentRoute.value.name;
  if (name === 'map-velutina' || name === 'map-velutina-public') {
    return 'velutina';
  } else if (name === 'map-aethina-tumida') {
    return 'aethina_tumida';
  }
  return 'velutina';
});

watch(taxa, () => {
  if (map) onMapReady();
});

const api = useApiFetch();
const { isLoading, data: apiaries } = useApiariesQuery({
  modus: null,
  enabled: !isPublic.value,
});
const updateTimestamp = ref(Date()); // helper to update layer

const year = ref({
  value: '',
  label: t('velutinaRecent'),
});
const curYear = new Date().getFullYear();
const yearOptions = [
  {
    value: '',
    label: t('velutinaRecent'),
  },
  { value: curYear, label: curYear },
  { value: curYear - 1, label: curYear - 1 },
  { value: curYear - 2, label: curYear - 2 },
  { value: curYear - 3, label: curYear - 3 },
  { value: curYear - 4, label: curYear - 4 },
];

const notification = useNotification();

watch(year, () => {
  onMapReady();
});

const cluster = (L as any).markerClusterGroup({
  chunkedLoading: true,
  maxClusterRadius: 50,
});
const layerRecent = (L as any).layerGroup();

const zoom = computed(() => (isLoading.value ? 2 : 6));
const circleRadius = ref(1000);
const circleOpacity = 0.3;
const mapRef = ref(null as any);
const location = ref(null as any);
const userLocationLoading = ref(false);
const showInactive = ref(false);
const daysRecent = 7;

const recentCount = ref(0);

const onMapReady = () => {
  cluster.clearLayers();
  layerRecent.clearLayers();

  map = mapRef.value.leafletObject;
  map.doubleClickZoom.disable();
  map.scrollWheelZoom.enable();

  let url = `/v1/public/${taxa.value}/observations/recent`;
  if (year.value.value) {
    url = `/v1/public/${taxa.value}/observations/year/${year.value.value}`;
  }
  api.get(url).then((response) => {
    map.removeLayer(cluster);
    map.removeLayer(layerRecent);

    let countRecent = 0;
    response.map((item: any) => {
      const obs = {
        ...item,
        localDate: new Date(item.observed_at).toLocaleDateString(),
        isRecentObservation:
          new Date(item.observed_at) >
          new Date(Date.now() - 1000 * 60 * 60 * 24 * daysRecent),
      } as Observation;

      if (obs.isRecentObservation) countRecent++;

      const circleMarker = L.circleMarker(
        [obs.location.x, obs.location.y] as LatLngTuple,
        {
          radius: obs.isRecentObservation ? 10 : 5,
          color: obs.isRecentObservation ? 'red' : 'blue',
          fillOpacity: 0.5,
        },
      );

      const uri = JSON.parse(obs.uri);
      circleMarker.bindPopup(
        `${obs.localDate}<br/><a href="${uri}" target="_blank">${uri}</a>`,
      );
      if (obs.isRecentObservation) layerRecent.addLayer(circleMarker);
      else cluster.addLayer(circleMarker);
    });
    recentCount.value = countRecent;

    map.addLayer(cluster);
    map.addLayer(layerRecent);
  });
};

onBeforeUnmount(() => {
  map.removeLayer(cluster);
  map.removeLayer(layerRecent);
});

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
