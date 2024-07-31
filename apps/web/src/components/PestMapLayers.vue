<template>
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
      <slot></slot>

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
  </l-control>
</template>

<script setup lang="ts">
import { ref, toRefs, watch } from 'vue';
import { LTileLayer, LControlLayers, LControl } from '@vue-leaflet/vue-leaflet';
import { useApiFetch } from '~/composables/useApi';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

const api = useApiFetch();
const $q = useQuasar();
const { t } = useI18n();

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
      (source) =>
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
