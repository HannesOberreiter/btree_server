<template>
  <q-btn-group v-if="!isEdit" size="md" unelevated spread>
    <q-btn
      color="secondary"
      :loading="isSubmitting"
      :label="$t('save')"
      @click="onSubmit"
    />
    <q-btn color="warning" :label="$t('reset')" @click="emit('reset')" />
    <q-btn
      v-if="lastInsert"
      color="info"
      :loading="isSubmitting"
      :label="$t('undo')"
      @click="onUndo"
    />
  </q-btn-group>
  <q-btn-group v-else unelevated spread>
    <q-btn
      color="secondary"
      :loading="isSubmitting"
      :label="$t('update')"
      @click="onUpdate"
    ></q-btn>
    <q-btn color="warning" :label="$t('reset')" @click="emit('reset')" />
  </q-btn-group>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import { useApiFetch } from '~/composables/useApi';
import { useFormCleanup } from '~/composables/useFormCleanup';
import { useNotification } from '~/composables/useResponseText';
import { Option } from '~/types';

const notification = useNotification();
const isSubmitting = ref(false);
const api = useApiFetch();
const lastInsert = ref(null);
const lastInsertTable = ref(null); // needed on quicktool form to handle multiple "forms"
const emit = defineEmits(['change', 'reset']);
const props = defineProps({
  state: {
    default: null,
  },
  v: {
    default: null,
  },
  editIds: {
    type: Array,
    required: true,
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
  form: {
    type: String,
    required: true,
  },
  formOption: {
    type: String as PropType<Option>,
    default: '',
  },
});
const { state, editIds, isEdit, v, form } = toRefs(props);
const cleanup = useFormCleanup(form, state, props.isEdit);

async function onUpdate() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }

  const id = editIds.value.map((obj: any) => obj.value);
  let data = {
    ids: id,
    data: cleanup.cleanup(),
  };
  const url =
    form.value === 'option'
      ? `/v1/${form.value}/${props.formOption}`
      : `/v1/${form.value}`;
  await api.patch(url, JSON.stringify(data)).then(
    async (response: any) => {
      lastInsert.value = response;
      emit('change');
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error);
    }
  );
  isSubmitting.value = false;
  return;
}

async function onUndo() {
  isSubmitting.value = true;
  const data = JSON.stringify({ ids: lastInsert.value });
  const url =
    form.value === 'option'
      ? `/v1/${form.value}/${props.formOption}/batchDelete?hard=true`
      : `/v1/${form.value}/batchDelete?hard=true`;

  await api.patch(url, data).then(
    (_response: any) => {
      lastInsert.value = null;
      emit('change');
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error);
    }
  );
  isSubmitting.value = false;
  return;
}

async function onSubmit() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    notification.open('negative', v.value.$errors[0].$message, true);
    isSubmitting.value = false;
    return;
  }
  const data = cleanup.cleanup();
  const url =
    form.value === 'option'
      ? `/v1/${form.value}/${props.formOption}`
      : `/v1/${form.value}`;
  await api.post(url, JSON.stringify(data)).then(
    async (response: any) => {
      lastInsert.value = response;
      lastInsertTable.value = unref(form.value);
      emit('change');
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error);
    }
  );
  isSubmitting.value = false;
}
</script>
