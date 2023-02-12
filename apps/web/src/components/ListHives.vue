<template>
  <div v-if="!hives">
    {{ $t('error.noData') }}
  </div>
  <div v-else-if="hives.length === 0">
    {{ $t('error.noData') }}
  </div>
  <div v-else>
    <div
      v-for="(hive, index) in hives"
      :key="hive.id"
      :class="hive.active ? 'bg-info' : ''"
    >
      <div
        class="row flex-center q-pa-sm"
        style="border: 0.01em; border-style: solid"
        :class="index > 0 ? 'border-top-none' : ''"
      >
        <div
          class="col-12 col-sm-2 col-md-2"
          :class="$q.platform.is.mobile ? 'text-right' : ''"
        >
          <btn-base-group :spread="false">
            <btn-base
              flat
              color="secondary"
              icon="fas fa-info"
              @click.stop="showInfo(hive.id)"
            />
            <btn-base
              flat
              color="grey"
              icon="fas fa-truck"
              @click.stop="onMovement(hive.id)"
            />
          </btn-base-group>
        </div>
        <div
          class="col-12 col-sm-10 col-md-8"
          style="cursor: pointer"
          @click="setActiveStep(hive.id, hive.active ? false : true)"
        >
          <q-item-label class="text-bold">
            {{ hive.name }}
            <span v-if="hive.queen_name" class="text-caption">
              [{{ hive.queen_name }}
              <span v-if="hive.mark_colour">({{ hive.mark_colour }})</span>]
              <span v-if="hive.queen_modus === false">RIP</span>
            </span>
          </q-item-label>
          {{ $t('position') }}: {{ hive.position }}
        </div>

        <div class="col-12 col-md-2 text-right">
          <btn-base-group :spread="false">
            <btn-base
              flat
              :color="hive.active ? 'primary' : 'grey'"
              icon="fas fa-arrow-up"
              :disable="index === 0 || !hive.active"
              @click="onMove(index, index - 1)"
            />
            <btn-base
              flat
              :color="hive.active ? 'secondary' : 'grey'"
              icon="fas fa-arrow-down"
              :disable="index === hives.length - 1 || !hive.active"
              @click="onMove(index, index + 1)"
            />
          </btn-base-group>
        </div>
      </div>
    </div>
    <btn-base
      size="sm"
      class="float-right bg-orange-7"
      @click.stop="onSave(true)"
      >{{ $t('updatePosition') }}</btn-base
    >
  </div>
</template>

<script setup lang="ts">
import { map } from 'lodash-es';
import { useApiFetch } from '~/composables/useApi';
import { useNotification } from '~/composables/useNotification';
import DialogForm from './DialogForm.vue';
import { useQuasar } from 'quasar';
import { usePreventNavigation } from '~/composables/usePreventNavgiation';
import { clearCache } from '~/composables/useQuery';

import { useRouter } from 'vue-router';
import { ref, watch } from 'vue';

const usePrevent = usePreventNavigation();
const $q = useQuasar();
const hives = ref(null);
const api = useApiFetch();
const router = useRouter();
const notification = useNotification();
const emit = defineEmits(['change']);
const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

watch(
  () => props.data,
  (cur) => (hives.value = cur ? cur.hives : null),
  {
    immediate: true,
  }
);

function onMovement(id: number) {
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title: 'movedate',
      form: 'movedate',
      selected: [id],
    },
  });
}

function setActiveStep(id: number, set = true) {
  hives.value = map(hives.value, (obj: any) => {
    return { ...obj, active: obj.id === id ? set : false };
  });
  if (!set) onSave();
}

function showInfo(id: number) {
  router.push({ name: 'detail-hive', params: { id: id } });
}

function onMove(oldIndex: number, newIndex: number) {
  const f = hives.value.splice(oldIndex, 1)[0];
  // insert stored item into position `to`
  hives.value.splice(newIndex, 0, f);
  usePrevent.unsavedPosition(hives.value);
}

function resetActiveStep() {
  hives.value.values = map(hives.value.values, (obj) => {
    obj.active = false;
    return obj;
  });
  usePrevent.state.value = false;
}

function onSave(force = false) {
  if (!usePrevent.state.value && !force) {
    resetActiveStep();
  } else {
    const patch = map(hives.value, (obj, index) => {
      return { id: obj.id, position: index + 1 };
    });
    api.patch('/v1/hive/updatePosition', { data: patch }).then(
      () => {
        notification.open('positive', 'updated');
        resetActiveStep();
        clearCache('hive');
        emit('change');
      },
      () => notification.open('negative', '')
    );
  }
}
</script>
