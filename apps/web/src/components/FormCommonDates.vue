<template>
  <div class="row">
    <div class="col-xs-12 col-md-5 q-pr-sm">
      <form-common-start
        v-model="state.start"
        label="dateStart"
        :mark="state.end"
        @update:model-value="updateStart"
      ></form-common-start>
    </div>
    <div class="col-xs-11 col-md-5">
      <form-common-end
        v-model="state.end"
        label="dateEnd"
        :mark="state.start"
        @update:model-value="updateEnd"
      ></form-common-end>
    </div>
    <div class="col-1 text-center">
      <q-btn
        flat
        round
        icon="fas fa-retweet"
        @click="changeInterval"
        :color="showInterval ? 'secondary' : 'grey'"
      ></q-btn>
    </div>
  </div>
  <div v-if="showInterval" class="row">
    <div class="col-6">
      <q-input
        v-model.number="state.interval"
        type="number"
        :label="t('interval')"
        :hint="t('intervalText')"
        input-class="text-right"
      >
      </q-input>
    </div>
    <div class="col-6">
      <q-input
        v-model.number="state.repeat"
        type="number"
        :label="t('repeat')"
        :hint="t('repeatText')"
        input-class="text-right"
      >
      </q-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import FormCommonStart from './FormCommonDate.vue';
import FormCommonEnd from './FormCommonDate.vue';

const { t } = useI18n();
const props = defineProps({
  startValue: {
    type: String,
    default: dayjs().format('YYYY-MM-DD'),
  },
  endValue: {
    type: String,
    default: dayjs().format('YYYY-MM-DD'),
  },
});

const showInterval = ref(false);

const state = ref({
  start: props.startValue,
  end: props.endValue,
  interval: 0,
  repeat: 0,
});

function updateStart() {
  if (dayjs(state.value.start) > dayjs(state.value.end))
    state.value.end = state.value.start;
}
function updateEnd() {
  if (dayjs(state.value.start) > dayjs(state.value.end))
    state.value.start = state.value.end;
}

function changeInterval() {
  if (showInterval.value) {
    state.value.interval = 0;
    state.value.repeat = 0;
  }
  showInterval.value = !showInterval.value;
}
</script>
