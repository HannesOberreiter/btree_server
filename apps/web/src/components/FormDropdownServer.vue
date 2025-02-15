<template>
  <q-select v-model="modelValue" :options="options" option-value="id" filled class="q-pb-md" :hint="(props.form === 'register'
    ? $t('server.hint.register')
    : $t('server.hint.visitor')) + ' ' + $t('server.hint.ping', { ping })
    ">
    <template #prepend>
      <q-icon name="fas fa-server" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useBackend } from '../composables/useBackend';

const props = defineProps({
  form: { type: String, default: 'visitor' },
  overwriteCountry: { type: String, default: '' },
});

const backend = useBackend();
const options = backend.options;
const ping = ref<number | string>('');

/** Only allow overwrite if there is no server query param */
const overwriteOption =
  props.overwriteCountry && !backend.isServerParam
    ? backend.findOption(props.overwriteCountry)
    : null;
const modelValue = ref(overwriteOption || backend.getOption());

watch(modelValue, () => {
  if (modelValue.value) backend.setBackend(modelValue.value.id);
  updatePing();
});

updatePing();
function updatePing () {
  backend.ping().then((value) => {
    ping.value = `${value}ms`;
  }).catch((error) => {
    ping.value = 'Offline';
    console.error(error);
  });
}
</script>
