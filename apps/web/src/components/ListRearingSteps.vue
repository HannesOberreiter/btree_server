<template>
  <div class="col-12">
    <q-list v-if="steps" bordered separator>
      <q-item
        v-for="(step, index) in steps"
        :key="step.id"
        :class="step.active ? 'bg-info' : ''"
        class="q-pa-xs"
      >
        <q-item-section
          v-if="$q.screen.gt.xs"
          avatar
          @click="
            (e: Event) => setActiveStep(step.id, step.active ? false : true, e)
          "
        >
          <btn-base-group>
            <btn-base
              flat
              class="ignore-click"
              :color="step.active ? 'primary' : 'grey'"
              icon="fas fa-arrow-up"
              :disable="index === 0 || !step.active"
              @click="onMove(index, index - 1)"
            />
            <btn-base
              flat
              class="ignore-click"
              :color="step.active ? 'secondary' : 'grey'"
              icon="fas fa-arrow-down"
              :disable="index === steps.length - 1 || !step.active"
              @click="onMove(index, index + 1)"
            />
          </btn-base-group>
        </q-item-section>
        <q-item-section
          @click="
            (e: Event) => setActiveStep(step.id, step.active ? false : true, e)
          "
        >
          <q-item-label>
            <span class="text-bold show-pointer">
              {{ step.detail.job }}
            </span>
            <span v-if="$q.screen.xs">
              <br />
            </span>
            <span v-show="index > 0">
              <span class="ignore-click show-pointer" @click="editSleep(index)">
                <q-tooltip>
                  {{ $t('total') }}:
                  <helper-day-and-hour :hour="getCurrentSum(index)">
                  </helper-day-and-hour>
                </q-tooltip>
                {{ $t('after') }}
                <helper-day-and-hour :hour="step.sleep_before">
                </helper-day-and-hour>
              </span>
              <btn-base
                flat
                class="ignore-click"
                :color="step.active ? 'primary' : 'grey'"
                icon="fas fa-plus"
                @pointerdown="
                  step.active
                    ? onSleepChange(index, step.sleep_before, 'plus')
                    : () => {}
                "
                @pointerup="holdingButton = false"
              />
              <btn-base
                flat
                class="ignore-click"
                :color="step.active ? 'secondary' : 'grey'"
                icon="fas fa-minus"
                @pointerdown="
                  step.active
                    ? onSleepChange(index, step.sleep_before, 'minus')
                    : () => {}
                "
                @pointerup="holdingButton = false"
              />
            </span>
          </q-item-label>
          {{ step.note }}
        </q-item-section>
        <q-item-section avatar>
          <btn-base-group v-if="!$q.screen.gt.xs">
            <btn-base
              flat
              :color="step.active ? 'primary' : 'grey'"
              icon="fas fa-arrow-up"
              :disable="index === 0 || !step.active"
              @click="onMove(index, index - 1)"
            />
            <btn-base
              flat
              :color="step.active ? 'secondary' : 'grey'"
              icon="fas fa-arrow-down"
              :disable="index === steps.length - 1 || !step.active"
              @click="onMove(index, index + 1)"
            />
          </btn-base-group>
          <btn-base-group>
            <btn-base
              flat
              :color="step.active ? 'secondary' : 'grey'"
              icon="fas fa-info"
              @click="showInfo(step.detail.note)"
            />
            <btn-base
              flat
              :color="step.active ? 'negative' : 'grey'"
              :disable="!step.active"
              icon="fas fa-xmark"
              @click="onDelete(step.id)"
            />
          </btn-base-group>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
  <div class="col-12 q-pt-md">
    <btn-base-group>
      <btn-base color="primary" @click="onSave(true)">
        {{ $t('save') }}
      </btn-base>
      <btn-base color="secondary" @click="onAdd">
        {{ $t('add') }} {{ $t('step') }}
      </btn-base>
    </btn-base-group>
  </div>
</template>

<script setup lang="ts">
import filter from 'lodash-es/filter';
import map from 'lodash-es/map';
import { useQuasar } from 'quasar';
import { useApiFetch } from '~/composables/useApi';
import { useNotification } from '~/composables/useNotification';
import { usePreventNavigation } from '~/composables/usePreventNavgiation';
import { useI18n } from 'vue-i18n';
import { watch, ref, toRefs } from 'vue';

import DialogSelectOption from './DialogSelectOption.vue';
import helperDayAndHour from './HelperDayAndHour.vue';
import { sleep } from '~/helpers';

const usePrevent = usePreventNavigation();
const api = useApiFetch();
const notification = useNotification();
const $q = useQuasar();
const { t } = useI18n();
const holdingButton = ref(false);

const props = defineProps({
  methodSteps: {
    type: Array<any>,
    required: true,
  },
  methodId: {
    type: Number,
    required: true,
  },
});
const emit = defineEmits(['change']);
const { methodSteps, methodId } = toRefs(props);
const steps = ref(null);
watch(
  methodSteps,
  () => (steps.value = methodSteps.value ? methodSteps.value : null),
  { immediate: true },
);

function setActiveStep(id: number, set = true, event: any) {
  const offsetClass: string | undefined =
    event?.target?.offsetParent?.className;
  const targetClass: string | undefined = event?.target?.className;
  if (offsetClass) {
    if (
      (offsetClass.includes('ignore-click') ||
        targetClass.includes('ignore-click')) &&
      set === false
    ) {
      return;
    }
  }
  steps.value = steps.value.map(function (obj: any) {
    return { ...obj, active: obj.id === id ? set : false };
  });
  if (set === false) {
    holdingButton.value = false;
    onSave();
  }
}

function showInfo(info: string) {
  $q.dialog({ message: info, html: false });
}

function onMove(oldIndex: number, newIndex: number) {
  const f = steps.value.splice(oldIndex, 1)[0];
  // insert stored item into position `to`
  steps.value.splice(newIndex, 0, f);
  usePrevent.unsavedPosition(steps.value);
}

function editSleep(index: number) {
  $q.dialog({
    title: t('edit'),
    message: t('editSleep'),
    prompt: {
      model: steps.value[index].sleep_before,
      type: 'number',
      isValid: (val) => {
        try {
          const num = parseInt(val);
          return num >= 0 && num <= 9000;
        } catch (e) {
          console.error(e);
          return false;
        }
      },
    },
  }).onOk((data: any) => {
    steps.value[index].sleep_before = parseInt(data);
    usePrevent.state.value = true;
    setActiveStep(index, false, undefined);
  });
}

async function onSleepChange(
  index: number,
  value: number,
  type: 'minus' | 'plus',
) {
  holdingButton.value = true;
  usePrevent.state.value = true;
  let cycleCount = 0;
  while (holdingButton.value) {
    cycleCount++;
    if (holdingButton.value) {
      if (type === 'minus') {
        value--;
      } else {
        value++;
      }
      if (value < 0) {
        holdingButton.value = false;
        return;
      }
      if (value > 9000) {
        holdingButton.value = false;
        return;
      }
      steps.value[index].sleep_before = value;
    }
    await sleep(cycleCount < 5 ? 200 : 100);
  }
}

function onAdd() {
  $q.dialog({
    component: DialogSelectOption,
    componentProps: {
      label: 'step',
      text: 'dialogSelectOptionAdd',
      table: 'rearing_detail',
    },
  }).onOk((obj) => {
    api
      .post('/v1/rearing_step', {
        type_id: methodId.value,
        detail_id: obj.id,
        position: steps.value.length + 1,
      })
      .then(
        () => {
          notification.open('positive', '');
          emit('change');
        },
        () => notification.open('negative', 'error'),
      );
  });
}

function resetActiveStep() {
  steps.value.map((obj: any) => {
    obj.active = false;
    return obj;
  });
  usePrevent.state.value = false;
}

function onSave(force = false) {
  if (!usePrevent.state.value && !force) {
    resetActiveStep();
  } else {
    const patch = map(steps.value, (obj, index) => {
      return {
        id: obj.id,
        position: index + 1,
        sleep_before: obj.sleep_before,
      };
    });
    api.patch('/v1/rearing_step/updatePosition', { data: patch }).then(
      () => {
        notification.open('positive', 'updated');
        resetActiveStep();
        emit('change');
      },
      () => notification.open('negative', 'error'),
    );
  }
}

function onDelete(id: number) {
  $q.dialog({
    title: t('delete'),
    message: t('deleteConfirm'),
    cancel: true,
  }).onOk(() => {
    api.remove(`/v1/rearing_step/${id}`).then(
      () => {
        notification.open('positive', 'deleted');
        steps.value = filter(steps.value, (o) => o.id != id);
      },
      () => notification.open('negative', 'error.unknown'),
    );
  });
}

function getCurrentSum(index: number) {
  let sum = 0;
  for (let i = 0; i < index + 1; i++) {
    sum += steps.value[i].sleep_before;
  }
  return sum;
}
</script>
