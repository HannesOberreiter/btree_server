<template>
  <btn-base-group v-if="!isEdit" size="md">
    <btn-base
      color="secondary"
      :loading="isSubmitting"
      :label="$t('save') + ` (${numberOfTasks})`"
      data-cy="btn-form-save"
      @click="onSubmit"
    />
    <btn-base color="warning" :label="$t('reset')" @click="emit('reset')" />
    <btn-base
      v-if="lastInsert"
      color="info"
      :loading="isSubmitting"
      :label="$t('undo')"
      data-cy="btn-form-undo"
      @click="onUndo"
    />
  </btn-base-group>
  <btn-base-group v-else>
    <btn-base
      color="secondary"
      :loading="isSubmitting"
      :label="$t('update') + ` (${numberOfEdits})`"
      data-cy="btn-form-update"
      @click="onUpdate"
    ></btn-base>
    <btn-base color="warning" :label="$t('reset')" @click="emit('reset')" />
  </btn-base-group>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import { useApiFetch } from '~/composables/useApi';
import { useFormCleanup } from '~/composables/useFormCleanup';
import { useNotification } from '~/composables/useNotification';
import { useInvalidateQueries } from '~/composables/useQuery';
import { Option } from '~/types';
import { ref, toRefs, computed, unref } from 'vue';

const useInvalidate = useInvalidateQueries();
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
const numberOfTasks = computed(() => {
  let count = 0;
  if (
    ['feed', 'harvest', 'treatment', 'checkup', 'movedate'].includes(form.value)
  ) {
    if (state.value.hive) {
      count = state.value.hive.length;
      if (state.value.repeat) {
        count = count * state.value.repeat;
      }
    }
  } else if (['charge', 'scale_data'].includes(form.value)) {
    count = 1;
  } else if (
    ['hive', 'queen', 'apiary', 'todo', 'scale', 'option'].includes(form.value)
  ) {
    if (state.value.name) {
      count = 1;
      if (state.value.repeat) {
        count = count * state.value.repeat;
      }
    }
  } else if (['rearing_detail'].includes(form.value)) {
    if (state.value.job) {
      count = 1;
    }
  } else if (['rearing'].includes(form.value)) {
    count = 1;
  }
  return count;
});

const numberOfEdits = computed(() => {
  let count = 0;
  if (editIds.value) {
    count = editIds.value.length;
  }
  return count;
});

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
      dataChanged();
    },
    (error) => {
      notification.open('negative', error);
    },
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
      dataChanged();
    },
    (error) => {
      notification.open('negative', error);
    },
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

      dataChanged('insert');
    },
    (error) => {
      notification.open('negative', error);
    },
  );
  isSubmitting.value = false;
}

function dataChanged(type: 'update' | 'insert' = 'update') {
  useInvalidate.invalidate(form.value);
  notification.open('positive', '');
  emit('change', type);
}
</script>
