<script setup lang="ts">
import { LControlLayers, LTileLayer } from '@vue-leaflet/vue-leaflet';
import { computed } from 'vue';
import { useAuthUserStore } from '../stores/auth';

const zoomMax = 18;
const OPENWEATHER_API = process.env.OPENWEATHER_APP_ID;

const userStore = useAuthUserStore();
const paidStatus = computed(() => userStore.getPaidStatus);
</script>

<template>
	<LTileLayer
		url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
		layer-type="base"
		name="OpenStreetMap"
		attribution="Map data &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors, <a href='http://creativecommons.org/licenses/by-sa/2.0/''>CC-BY-SA</a>"
		:max-zoom="zoomMax"
	/>
	<LTileLayer
		url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
		layer-type="base"
		name="Esri"
		attribution="&copy; <a href='http://www.esri.com/'>Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
		:max-zoom="zoomMax"
		:visible="false"
	/>
	<template v-if="paidStatus.status">
		<LTileLayer
			:url="`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API}`"
			name="Perception"
			attribution="| Weather data &copy; <a href='https://openweathermap.org'>OpenWeatherMap</a>"
			layer-type="overlay"
			:max-zoom="zoomMax"
			:visible="false"
		/>
		<LTileLayer
			:url="`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API}`"
			name="Temperature"
			attribution="| Weather data &copy; <a href='https://openweathermap.org'>OpenWeatherMap</a>"
			layer-type="overlay"
			:max-zoom="zoomMax"
			:visible="false"
		/>
	</template>
	<LControlLayers />
</template>
