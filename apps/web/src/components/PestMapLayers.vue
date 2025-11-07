<script setup lang="ts">
import { LControl, LControlLayers, LTileLayer } from '@vue-leaflet/vue-leaflet';
import { useQuasar } from 'quasar';
import { ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApiFetch } from '../composables/useApi';

const props = defineProps({
	recentCount: {
		type: Number,
		required: true,
	},
	isPublic: {
		type: Boolean,
		default: false,
	},
	taxa: {
		type: String,
		required: true,
	},
});
const api = useApiFetch();
const $q = useQuasar();
const { t } = useI18n();

const { recentCount, taxa } = toRefs(props);
const totalCount = ref(0);

watch(
	taxa,
	(taxa) => {
		api.get(`/v1/public/${taxa}/observations/stats`).then((response) => {
			totalCount.value = response.count;
		});
	},
	{ immediate: true },
);

function onShowSources() {
	const sources = [
		{
			name: 'iNaturalist',
			url: 'https://www.inaturalist.org/home',
		},
		{
			name: 'artenfinder.net',
			url: 'https://www.artenfinder.net',
		},
		{
			name: 'observation.org',
			url: 'https://wwww.observation.org',
		},
		{
			name: 'infofauna.ch',
			url: 'https://lepus.infofauna.ch/carto/',
		},
	];

	if (taxa.value === 'velutina') {
		sources.push({
			name: 'PatriNat',
			url: 'https://frelonasiatique.mnhn.fr/visualisateur',
		});
	}

	const sourcesHtml = sources
		.map(
			source =>
				`<li><a href="${source.url}" target="_blank">${source.name}</a></li>`,
		)
		.join('');

	$q.dialog({
		title: t('source', 2),
		message: `<ul>${sourcesHtml}</ul>`,
		html: true,
		ok: 'Close',
	});
}
</script>

<template>
	<LTileLayer
		url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
		layer-type="base"
		name="OpenStreetMap"
		attribution="Map data &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors, <a href='http://creativecommons.org/licenses/by-sa/2.0/''>CC-BY-SA</a>"
		:max-zoom="18"
	/>
	<LTileLayer
		url="https://api.inaturalist.org/v2/heatmap/{z}/{x}/{y}.png?taxon_id=119019"
		layer-type="overlay"
		name="Heatmap - iNaturalist"
		:max-zoom="18"
		attribution="Heatmap data &copy; <a href='https://www.inaturalist.org/'>iNaturalist</a>"
		:visible="false"
	/>
	<LControlLayers />

	<LControl position="bottomleft">
		<div
			class="leaflet-control-attribution"
			style="margin-bottom: 24px !important"
		>
			<slot />

			<div>{{ $t('recentObservations') }}: {{ recentCount }}</div>
			<div>{{ $t('total') }}: {{ totalCount }}</div>
			<div v-if="props.isPublic">
				<b>{{ $t('velutinaMapPublicText') }}</b>
			</div>
			<div>
				{{ $t('source', 2) }}:
				<a href="#" @click="onShowSources">{{ $t('show') }}</a>
			</div>
		</div>
	</LControl>
</template>
