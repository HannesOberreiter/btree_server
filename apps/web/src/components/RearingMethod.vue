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
          {{ $t('add') }}
        </btn-base>
        <btn-base color="secondary" @click="onEdit">
          {{ $t('rename') }}
        </btn-base>
        <btn-base color="negative" @click="onDelete">
          {{ $t('delete') }}
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
    <list-rearing-steps
      :method-steps="model.step"
      :method-id="model.id"
      @change="refetch()"
    ></list-rearing-steps>
  </div>
</template>

<script setup lang="ts">
import filter from 'lodash-es/filter';
import { useQuasar } from 'quasar';
import { useApiFetch } from '~/composables/useApi';
import { useNotification } from '~/composables/useNotification';
import { useRearingTypesQuery } from '~/composables/useQuery';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import DialogForm from './DialogForm.vue';
import ListRearingSteps from './ListRearingSteps.vue';

const notification = useNotification();
const api = useApiFetch();
const $q = useQuasar();
const model = ref(null);
const options = ref(null);
const { t } = useI18n();

const { isLoading, data, refetch } = useRearingTypesQuery({});
watch(
  data,
  () => {
    if (data.value) {
      options.value = data.value.results;
      if (!model.value && options.value.length > 0)
        model.value = options.value[0];
      else if (model.value && options.value.length > 0)
        model.value = filter(options.value, { id: model.value.id })[0];
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
  if (model.value) dialogForm('edit', [model.value.id]);
}

function onDelete() {
  $q.dialog({
    title: t('delete'),
    message: t('deleteConfirm'),
    cancel: true,
  }).onOk(() => {
    api.patch('/v1/rearing_type/batchDelete', { ids: [model.value.id] }).then(
      () => {
        notification.open('positive', 'deleted');
        model.value = null;
        refetch.value();
      },
      () => notification.open('negative', 'error.unknown')
    );
  });
}
</script>
