<template>
  <head>
    <title>b.tree - Professional Beekeeping Database - Map Velutina</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <div ref="iframeRef" class="iframe-container">
    <l-map
      ref="mapRef"
      :zoom="5"
      :center="[49.4582838, 15.2718234]"
      loading-control="true"
      @ready="onMapReady"
    >
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
        attribution="Map data &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors, <a href='http://creativecommons.org/licenses/by-sa/2.0/''>CC-BY-SA</a>"
        :max-zoom="18"
      ></l-tile-layer>
      <l-tile-layer
        url="https://api.inaturalist.org/v2/heatmap/{z}/{x}/{y}.png?taxon_id=119019"
        layer-type="overlay"
        name="Heatmap - iNaturalist"
        :max-zoom="18"
        attribution="Heatmap data &copy; <a href='https://www.inaturalist.org/'>iNaturalist</a>"
        :visible="false"
      ></l-tile-layer>
      <l-control-layers />
      <l-control position="bottomleft">
        <div
          class="leaflet-control-attribution"
          style="margin-bottom: 24px !important"
        >
          <div>
            <b
              >Service by
              <a href="https://www.btree.at" target="_blank">b.tree</a></b
            >
          </div>

          <div>Recent observations: {{ recentCount }} (last 6 months)</div>
          <div>Total observations in our database: {{ totalCount }}</div>
          <div><b>Only the recent observations are shown on the map.</b></div>
          <div>
            DataSources:<br />
            <a href="https://www.inaturalist.org/home" target="_blank"
              >iNaturalist</a
            >,
            <a
              href="https://frelonasiatique.mnhn.fr/visualisateur"
              target="_blank"
              >PatriNat</a
            >,
            <a href="https://www.artenfinder.net" target="_blank"
              >artenfinder.net</a
            >,
            <a href="https://wwww.observation.org" target="_blank"
              >observation.org</a
            >
            <a href="https://lepus.infofauna.ch/carto/" target="_blank">
              infofauna.ch
            </a>
          </div>
        </div>
      </l-control>
    </l-map>
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
import {
  LMap,
  LTileLayer,
  LControl,
  LControlLayers,
} from '@vue-leaflet/vue-leaflet';
import { useApiFetch } from '~/composables/useApi';
import { onBeforeUnmount, ref, onMounted } from 'vue';

const api = useApiFetch();
const cluster = (L as any).markerClusterGroup({
  chunkedLoading: true,
});

const mapRef = ref(null as any);
const iframeRef = ref<HTMLIFrameElement | null>(null);
let map = {} as any;
const recentCount = ref(0);
const totalCount = ref(0);

api.get('/v1/public/velutina/observations/stats').then((response) => {
  totalCount.value = response.count;
});

const onMapReady = () => {
  map = mapRef.value.leafletObject;
  map.doubleClickZoom.disable();
  map.scrollWheelZoom.enable();
  api.get('/v1/public/velutina/observations/recent').then((response) => {
    const data = response.map((item: any) => {
      return {
        ...item,
        localDate: new Date(item.observed_at).toLocaleDateString(),
        isRecentObservation:
          new Date(item.observed_at) >
          new Date(Date.now() - 1000 * 60 * 60 * 24 * 365),
      } as Observation;
    });
    recentCount.value = data.length;
    data.map((item: Observation) => {
      const circleMarker = L.circleMarker(
        [item.location.x, item.location.y] as LatLngTuple,
        {
          radius: 5,
          color: item.isRecentObservation ? 'red' : 'blue',
          fillOpacity: 0.5,
        },
      );
      const uri = JSON.parse(item.uri);
      circleMarker.bindPopup(
        `${item.localDate}<br/><a href="${uri}" target="_blank">${uri}</a>`,
      );
      cluster.addLayer(circleMarker);
    });
    map.addLayer(cluster);
  });
};

onMounted(() => {
  resizeIframe();
  window.addEventListener('resize', resizeIframe);
});
onBeforeUnmount(() => {
  map.removeLayer(cluster);
  window.removeEventListener('resize', resizeIframe);
});

function resizeIframe() {
  if (iframeRef.value) {
    iframeRef.value.style.height = `${iframeRef.value.scrollHeight}px`;
  }
}
</script>

<style>
.iframe-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.leaflet-top,
.leaflet-bottom {
  z-index: 900;
}
</style>
