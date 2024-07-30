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
      <pest-map-layers
        :recent-count="recentCount"
        :is-public="true"
        taxa="velutina"
      >
        <div>
          <b>
            Service by
            <a href="https://www.btree.at" target="_blank">b.tree</a>
          </b>
        </div>
      </pest-map-layers>
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
import { LMap } from '@vue-leaflet/vue-leaflet';
import { useApiFetch } from '~/composables/useApi';
import { onBeforeUnmount, ref, onMounted } from 'vue';
import PestMapLayers from '~/components/PestMapLayers.vue';

const api = useApiFetch();
const cluster = (L as any).markerClusterGroup({
  chunkedLoading: true,
  maxClusterRadius: 50,
});
const layerRecent = (L as any).layerGroup();

const mapRef = ref(null as any);
const iframeRef = ref<HTMLIFrameElement | null>(null);
let map = {} as any;
const recentCount = ref(0);
const daysRecent = 7;

const onMapReady = () => {
  cluster.clearLayers();
  layerRecent.clearLayers();

  map = mapRef.value.leafletObject;
  map.doubleClickZoom.disable();
  map.scrollWheelZoom.enable();

  api.get('/v1/public/velutina/observations/recent').then((response) => {
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

.leaflet-marker-pane {
  z-index: 200;
}
</style>
