<template>
  <div class="row">
    <div class="col-8 col-md-5 col-lg-3">
      <q-item v-ripple tag="label">
        <q-item-section>
          <q-item-label>{{ t('status') }}:</q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-toggle
            v-model="state"
            color="blue"
            val="true"
            size="lg"
            :label="state === false ? t('open') : t('done')"
          ></q-toggle>
        </q-item-section>
      </q-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const state = ref(props.modelValue);
</script>
