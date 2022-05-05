<template>
  <div class="row">
    <div class="col-12">
      <q-select
        v-model="model"
        :label="$t('method')"
        name="type"
        :loading="isLoading"
        :disable="isLoading"
        :options="options"
        option-value="id"
        filled
        class="q-pb-md"
      >
      </q-select>
    </div>
  </div>
  <div class="row">
    <div class="col-12">
      <btn-base-group>
        <btn-base color="primary" @click="onNew">
          {{ $t('new') }} {{ $t('method') }}
        </btn-base>
        <btn-base color="secondary" @click="onEdit">
          {{ $t('rename') }} {{ $t('method') }}
        </btn-base>
        <btn-base color="negative">
          {{ $t('delete') }} {{ $t('method') }}
        </btn-base>
      </btn-base-group>
    </div>
  </div>
  <q-separator class="q-ma-sm" />
  <div v-if="model" class="row">
    <div class="col-12">
      <div class="text-bold">{{ $t('note') }}:</div>
      <pre v-if="model.note">{{ model.note }}</pre>
      <pre v-else> - </pre>
      <div class="text-bold">{{ $t('step', 2) }}:</div>
    </div>
    <div class="col-12">
      <q-list v-if="model.step" bordered separator>
        <q-item v-for="(step, index) in model.step" :key="index">
          <q-item-section avatar>
            <btn-base
              flat
              color="primary"
              icon="fas fa-arrow-up"
              :disable="index === 0"
              @click="onMove(index, index - 1)"
            />
          </q-item-section>
          <q-item-section avatar>
            <btn-base
              flat
              color="secondary"
              icon="fas fa-arrow-down"
              :disable="index === model.step.length - 1"
              @click="onMove(index, index + 1)"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ step.detail.job }} [
              <helper-day-and-hour :hour="step.detail.hour">
              </helper-day-and-hour>
              ]
            </q-item-label>
            {{ step.note }}
          </q-item-section>
          <q-item-section avatar>
            <btn-base flat color="negative" icon="fas fa-xmark" />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <div class="row q-pt-md">
      <div class="col-12">
        <btn-base-group>
          <btn-base color="primary" @click="onAddStep">
            {{ $t('add') }} {{ $t('step') }}
          </btn-base>
        </btn-base-group>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useRearingTypesQuery } from '~/composables/useQuery';
import DialogForm from './DialogForm.vue';

const $q = useQuasar();
const model = ref(null);
const options = ref(null);

const { isLoading, data, refetch } = useRearingTypesQuery({});
watch(
  data,
  () => {
    if (data.value) {
      options.value = data.value.results;
      if (!model.value && options.value.length > 0)
        model.value = options.value[0];
    }
  },
  {
    immediate: true,
  }
);

const dialogForm = (
  title: string,
  ids: any[],
  form = 'rearing_type',
  selected = null as any
) => {
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title: title,
      form: form,
      selected: selected,
      ids: ids,
      maximized: false,
    },
  }).onOk(() => refetch.value());
};

function onNew() {
  dialogForm('new', null);
}
function onEdit() {
  console.log(model.value);
  if (model.value) dialogForm('edit', [model.value.id]);
}

function onAddStep() {
  // test
}

function onMove(oldIndex: number, newIndex: number) {
  var f = model.value.step.splice(oldIndex, 1)[0];
  // insert stored item into position `to`
  console.log(f);
  model.value.step.splice(newIndex, 0, f);
  console.log(model.value.step);
}
</script>
