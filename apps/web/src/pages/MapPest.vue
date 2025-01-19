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
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import MapPest from '../components/MapPest.vue';

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
      return '/documents/aethina_tumida_de.pdf';
    }
    return '/documents/aethina_tumida_en.pdf';
  }
  /** Vespa velutina is default identify documents */
  if (locale.value === 'de') {
    return '/documents/vespa_velutina_de.pdf';
  } else if (locale.value === 'fr') {
    return '/documents/vespa_velutina_fr.pdf';
  } else if (locale.value === 'it') {
    return '/documents/vespa_velutina_it.pdf';
  }
  return '/documents/vespa_velutina_en.pdf';
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
