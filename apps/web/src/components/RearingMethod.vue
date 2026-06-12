<script setup lang="ts">
import filter from 'lodash-es/filter';
import { useQuasar } from 'quasar';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import { useRearingTypesQuery } from '../composables/useQuery';
import BtnBase from './BtnBase.vue';
import BtnBaseGroup from './BtnBaseGroup.vue';
import DialogForm from './DialogForm.vue';
import ListRearingSteps from './ListRearingSteps.vue';

const notification = useNotification();
const api = useApiFetch();
const $q = useQuasar();
const model = ref<any>(null);
const options = ref<any>(null);
const { t } = useI18n();

const { isLoading, data, refetch } = useRearingTypesQuery({});
watch(
  data,
  () => {
    if (data.value) {
      options.value = data.value.results;
      if (!model.value && options.value.length > 0) {
        model.value = options.value[0];
      } else if (model.value && options.value.length > 0) {
        model.value = filter(options.value, { id: model.value.id })[0];
      }
    }
  },
  {
    immediate: true
  }
);

function dialogForm(
  title: string,
  ids: any[] | null,
  form = 'rearing_type',
  selected = null as any
) {
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title,
      form,
      selected,
      ids,
      maximized: false
    }
  }).onOk(() => refetch());
}

function onNew() {
  dialogForm('new', null);
}
function onEdit() {
  if (model.value) {
    dialogForm('edit', [model.value.id]);
  }
}

function onDelete() {
  $q.dialog({
    title: t('delete'),
    message: t('deleteConfirm'),
    cancel: true
  }).onOk(() => {
    api.patch('/v1/rearing_type/batchDelete', { ids: [model.value.id] }).then(
      () => {
        notification.open('positive', 'deleted');
        model.value = null;
        refetch();
      },
      () => notification.open('negative', 'error.unknown')
    );
  });
}
</script>

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
      />
    </div>
  </div>
  <div class="row">
    <div class="col-12">
      <BtnBaseGroup>
        <BtnBase color="negative" @click="onDelete">
          {{ $t('delete') }}
        </BtnBase>
        <BtnBase color="secondary" @click="onEdit">
          {{ $t('rename') }}
        </BtnBase>
        <BtnBase color="primary" @click="onNew">
          {{ $t('add') }}
        </BtnBase>
      </BtnBaseGroup>
    </div>
  </div>
  <q-separator class="q-ma-sm" />
  <div v-if="model" class="row">
    <div class="col-12">
      <div class="text-bold"> {{ $t('note') }}: </div>
      <pre v-if="model.note">{{ model.note }}</pre>
      <pre v-else> - </pre>
      <div class="text-bold"> {{ $t('step', 2) }}: </div>
    </div>
    <ListRearingSteps
      :method-steps="model.step"
      :method-id="model.id"
      @change="refetch()"
    />
  </div>
</template>
