<script setup lang="ts">
import { LControl } from '@vue-leaflet/vue-leaflet';
import { useVModels } from '@vueuse/core';
import { ref, toRef } from 'vue';
import BtnBase from './BtnBase.vue';

// AFB is enabled by default
const props = defineProps({
  userLocationLoading: {
    type: Boolean,
    required: true
  },
  modelRadius: {
    type: Number,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isApiaryMap: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits([
  'update:modelRadius',
  'locate',
  'toggle',
  'toggleAfb'
]);
const showInactive = ref(false);
const showAfb = ref(true);
const { modelRadius } = useVModels(props, emit);
const userLocationLoading = toRef(props, 'userLocationLoading');
function toggleInactive() {
  showInactive.value = !showInactive.value;
  emit('toggle', showInactive.value);
}
function toggleAfb() {
  showAfb.value = !showAfb.value;
  emit('toggleAfb', showAfb.value);
}
function onPrint() {
  window.print();
}
</script>

<template>
  <LControl position="bottomleft" class="d-print-none">
    <BtnBase
      size="sm"
      color="black"
      class="bg-white"
      fab-mini
      flat
      :loading="userLocationLoading"
      icon="fas fa-map-marker-alt"
      @click="emit('locate')"
    >
      <q-tooltip>{{ $t('map.locateMe') }}</q-tooltip>
    </BtnBase>
    <BtnBase
      v-if="!isPublic && isApiaryMap"
      size="sm"
      color="black"
      class="bg-white"
      fab-mini
      flat
      :icon="!showInactive ? `fas fa-eye` : `fas fa-eye-slash`"
      @click="toggleInactive"
    >
      <q-tooltip>
        {{ `${$t('apiary')} ${showInactive ? $t('inactive') : $t('active')}` }}
      </q-tooltip>
    </BtnBase>
    <BtnBase
      v-if="!isPublic && isApiaryMap"
      size="sm"
      :color="showAfb ? 'black' : 'gray'"
      class="bg-white"
      fab-mini
      flat
      icon="fas fa-exclamation-triangle"
      :title="$t('map.afb')"
      @click="toggleAfb"
    >
      <q-tooltip>
        {{ $t('map.afb') }}
      </q-tooltip>
    </BtnBase>
    <BtnBase
      size="sm"
      color="black"
      class="bg-white"
      fab-mini
      flat
      icon="fas fa-print"
      @click="onPrint()"
    />
  </LControl>
  <LControl position="bottomright">
    <q-slider
      v-if="!isPublic && isApiaryMap"
      v-model="modelRadius"
      color="secondary"
      :min="0"
      :max="4000"
      :step="50"
      :label-value="`${$t('map.radius')} ${modelRadius}m`"
      label-always
      style="min-width: 20vh"
    />
  </LControl>
</template>
