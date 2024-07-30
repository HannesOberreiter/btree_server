<template>
  <div class="row justify-center">
    <div v-if="isLoading" class="col-1">
      <global-loading></global-loading>
    </div>
    <div v-else class="col-12">
      <q-tabs
        v-model="activeTab"
        dense
        active-color="secondary"
        indicator-color="secondary"
        align="justify"
        narrow-indicator
        no-caps
        outside-arrows
      >
        <q-tab name="map" :label="$t('observation', 2)" />
        <q-tab name="identification" :label="$t('identification')" />
      </q-tabs>
      <q-separator />
      <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel name="map">
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

              <velutina-map-layers :recent-count="recentCount">
                <q-select
                  v-model="year"
                  :options="yearOptions"
                  :dense="true"
                  :filled-input="true"
                  :label="$t('year')"
                  color="dark"
                  :dark="false"
                  popup-content-class="text-dark"
                ></q-select>
              </velutina-map-layers>

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
                  >
                    <l-popup>
                      <div class="text-h6">
                        <b>{{ value.name }}</b> [
                        <span v-if="value.hive_count">{{
                          value.hive_count.count +
                          value.hive_count.grouphivescount
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
          </div>
        </q-tab-panel>
        <q-tab-panel name="identification">
          <iframe
            :src="identifyDocument"
            style="width: 100%; height: 800px"
          ></iframe>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
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
import L, { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import { useApiariesQuery } from '~/composables/useQuery';
import { useNotification } from '~/composables/useNotification';
import {
  LMap,
  LPopup,
  LCircle,
  LCircleMarker,
  LFeatureGroup,
  LMarker,
} from '@vue-leaflet/vue-leaflet';
import { useApiFetch } from '~/composables/useApi';
import MapButtons from '~/components/MapButtons.vue';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import VelutinaMapLayers from '~/components/VelutinaMapLayers.vue';

const { locale, t } = useI18n();

const identifyDocument = computed(() => {
  if (locale.value === 'de') {
    return 'https://frelonasiatique.mnhn.fr/wp-content/uploads/sites/10/2015/07/Identifizierungshilfe_Vespa_velutina_MNHN.pdf';
  } else if (locale.value === 'fr') {
    return 'https://frelonasiatique.mnhn.fr/wp-content/uploads/sites/10/2021/10/Fiches_Identification_Vespa_velutina_MNHN.pdf';
  } else if (locale.value === 'it') {
    return 'https://frelonasiatique.mnhn.fr/wp-content/uploads/sites/10/2015/07/Scheda_identi_cativa_Vespa_velutina_MNHN.pdf';
  } else {
    return 'https://frelonasiatique.mnhn.fr/wp-content/uploads/sites/10/2020/05/Vespa_velutina_Identification_Sheet_MNHN.pdf';
  }
});

const api = useApiFetch();
const { isLoading, data: apiaries } = useApiariesQuery({ modus: null });
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

const activeTab = ref('map');
const zoom = computed(() => (isLoading.value ? 2 : 6));
const circleRadius = ref(1000);
const circleOpacity = 0.3;
const mapRef = ref(null as any);
const location = ref(null as any);
const userLocationLoading = ref(false);
const showInactive = ref(false);
const daysRecent = 7;

let map = {} as any;

const recentCount = ref(0);

const onMapReady = () => {
  cluster.clearLayers();
  layerRecent.clearLayers();

  map = mapRef.value.leafletObject;
  map.doubleClickZoom.disable();
  map.scrollWheelZoom.enable();

  let url = '/v1/public/velutina/observations/recent';
  if (year.value.value) {
    url = '/v1/public/velutina/observations/year/' + year.value.value;
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

    map.addLayer(layerRecent);
    map.addLayer(cluster);
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

.leaflet-marker-pane {
  z-index: 200;
}
</style>
