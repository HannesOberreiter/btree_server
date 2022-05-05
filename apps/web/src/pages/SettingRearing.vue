<template>
  <q-card>
    <q-tabs
      v-model="activeTab"
      dense
      active-color="secondary"
      indicator-color="secondary"
      align="justify"
      narrow-indicator
    >
      <q-tab name="method" :label="$t('method')" />
      <q-tab name="step" :label="$t('step')" />
    </q-tabs>
    <q-separator />

    <q-tab-panels v-model="activeTab" animated>
      <q-tab-panel name="method">
        <div class="row justify-center">
          <div class="col-12 col-sm-10 col-md-8">
            <div class="text-body2 q-pb-sm text-center">
              {{ $t('rearing') }} {{ $t('methods') }}
            </div>
            <rearing-method></rearing-method>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="step">
        <div class="row justify-center">
          <div class="col-12 col-sm-10 col-md-8">
            <div class="text-body2 q-pb-sm text-center">
              {{ $t('rearing') }} {{ $t('step') }}
            </div>
            <rearing-step></rearing-step>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>

<script setup lang="ts">
const prop = defineProps({
  tab: {
    type: String,
    default: 'method',
  },
});
const activeTab = ref(prop.tab ? prop.tab : 'method');
</script>
