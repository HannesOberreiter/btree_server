<template>
  <q-btn-group v-if="!isEdit" spread>
    <q-btn
      unelevated
      size="md"
      color="secondary"
      :loading="isSubmitting"
      :label="$t('save')"
      @click="onSubmit"
    />
    <q-btn
      unelevated
      size="md"
      color="warning"
      :label="$t('reset')"
      @click="emit('reset')"
    />
    <q-btn
      v-if="lastInsert"
      unelevated
      size="md"
      color="info"
      :loading="isSubmitting"
      :label="$t('undo')"
      @click="onUndo"
    />
  </q-btn-group>
  <q-btn-group v-else spread>
    <q-btn
      unelevated
      size="md"
      color="secondary"
      :loading="isSubmitting"
      :label="$t('update')"
      @click="onUpdate"
    ></q-btn>
    <q-btn
      unelevated
      size="md"
      color="warning"
      :label="$t('reset')"
      @click="emit('reset')"
    />
  </q-btn-group>
</template>

<script setup lang="ts">
import { api } from '~/boot/axios';
import { useFormCleanup } from '~/composables/useFormCleanup';
import { useNotification } from '~/composables/useResponseText';

const notification = useNotification();
const isSubmitting = ref(false);
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

  await api.patch(`/v1/${form.value}`, JSON.stringify(data)).then(
    async (response: any) => {
      lastInsert.value = response.data;
      emit('change');
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
  return;
}

async function onUndo() {
  isSubmitting.value = true;
  const data = JSON.stringify({ ids: lastInsert.value });
  await api
    .patch(`/v1/${lastInsertTable.value}/batchDelete?hard=true`, data)
    .then(
      (_response: any) => {
        lastInsert.value = null;
        emit('change');
        notification.open('positive', '');
      },
      (error) => {
        notification.open('negative', error.response);
      }
    );
  isSubmitting.value = false;
  return;
}

async function onSubmit() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }
  const data = cleanup.cleanup();
  await api.post(`/v1/${form.value}`, JSON.stringify(data)).then(
    async (response: any) => {
      lastInsert.value = response.data;
      lastInsertTable.value = unref(form.value);
      emit('change');
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
}
</script>
