<template>
  <div class="row justify-center">
    <div class="col-12">
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
            <map-pest></map-pest>
          </div>
        </q-tab-panel>
        <q-tab-panel name="identification">
          <iframe
            id="identifyDocument"
            style="width: 100%; height: 800px"
          ></iframe>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watchOnce } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import MapPest from '~/components/MapPest.vue';

const { locale } = useI18n();
const router = useRouter();

const taxa = computed(() => {
  const name = router.currentRoute.value.name;
  if (name === 'map-velutina' || name === 'map-velutina-public') {
    return 'velutina';
  } else if (name === 'map-aethina-tumida') {
    return 'aethina_tumida';
  }
  return 'velutina';
});

const identifyDocument = computed(() => {
  if (taxa.value === 'aethina_tumida') {
    if (locale.value === 'de') {
      return '/documents/Informationsbroschüre_Kleiner_Bienenstockkaefer.pdf';
    }
    return '/documents/BPG_9_small_hive_beetle_v4_Layout_1.pdf';
  }
  /** Vespa velutina is default identify documents */
  if (locale.value === 'de') {
    return '/documents/Identifizierungshilfe_Vespa_velutina_MNHN.pdf';
  } else if (locale.value === 'fr') {
    return '/documents/Fiches_Identification_Vespa_velutina_MNHN.pdf';
  } else if (locale.value === 'it') {
    return '/documents/Scheda_identi_cativa_Vespa_velutina_MNHN.pdf';
  }
  return '/documents/Vespa_velutina_Identification_Sheet_MNHN.pdf';
});

const activeTab = ref('map');

watch([taxa, activeTab], async () => {
  if (activeTab.value === 'identification') {
    const result = await fetch(identifyDocument.value);
    if (result.ok) {
      const blob = await result.blob();
      const url = URL.createObjectURL(blob);
      const iframe = document.getElementById(
        'identifyDocument',
      ) as HTMLIFrameElement;
      iframe.src = url;
    }
  }
});
</script>

<style>
.map {
  height: 85vh;
}
</style>
