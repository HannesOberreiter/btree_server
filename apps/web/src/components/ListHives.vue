<template>
  {{ usePrevent.state }}
  <div v-if="!hives">
    {{ $t('error.noData') }}
  </div>
  <div v-else-if="hives.length === 0">
    {{ $t('error.noData') }}
  </div>
  <div v-else>
    <q-item
      v-for="(hive, index) in hives"
      :key="hive.id"
      :class="hive.active ? 'bg-info' : ''"
    >
      <q-item-section avatar>
        <btn-base-group>
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
      </q-item-section>
      <q-item-section
        style="cursor: pointer"
        @click="setActiveStep(hive.id, hive.active ? false : true)"
      >
        <q-item-label class="text-bold">
          {{ hive.name }}
          <span v-if="hive.queen_name" class="text-caption">
            [{{ hive.queen_name }}]
            <span v-if="hive.queen_modus === false">RIP</span>
          </span>
        </q-item-label>
        {{ $t('position') }}: {{ hive.position }}
      </q-item-section>
      <q-item-section avatar>
        <btn-base-group>
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
      </q-item-section>
    </q-item>
  </div>
</template>

<script setup lang="ts">
import { map } from 'lodash-es';
import { useApiFetch } from '~/composables/useApi';
import { useNotification } from '~/composables/useNotification';
import DialogForm from './DialogForm.vue';
import { useQuasar } from 'quasar';
import { usePreventNavigation } from '~/composables/usePreventNavgiation';

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
  hives.value = map(hives.value, (obj) => {
    obj.active = obj.id === id ? set : false;
    return obj;
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
  hives.values = map(hives.values, (obj) => {
    obj.active = false;
    return obj;
  });
  usePrevent.state.value = false;
}

function onSave() {
  if (!usePrevent.state) {
    resetActiveStep();
  } else {
    const patch = map(hives.value, (obj, index) => {
      return { id: obj.id, position: index + 1 };
    });
    api.patch('/v1/hive/updatePosition', { data: patch }).then(
      () => {
        notification.open('positive', 'updated');
        resetActiveStep();
        emit('change');
      },
      () => notification.open('negative', '')
    );
  }
}
</script>
