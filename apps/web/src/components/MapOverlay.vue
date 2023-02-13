<template>
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
</template>

<script lang="ts">
const zoomMax = 18;
const OPENWEATHER_API = process.env.OPENWEATHER_APP_ID;
</script>

<script setup lang="ts">
import { useAuthUserStore } from '~/stores/auth';
import { LTileLayer, LControlLayers } from '@vue-leaflet/vue-leaflet';
import { computed } from 'vue';

const userStore = useAuthUserStore();
const paidStatus = computed(() => userStore.getPaidStatus);
</script>
