<script setup lang="ts">
import type { PropType } from 'vue';
import type { Option } from '../types';
import { useQuasar } from 'quasar';
import { computed, ref, toRefs, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApiFetch } from '../composables/useApi';
import { useFormCleanup } from '../composables/useFormCleanup';
import { useNotification } from '../composables/useNotification';
import { useInvalidateQueries } from '../composables/useQuery';
import BtnBase from './BtnBase.vue';
import BtnBaseGroup from './BtnBaseGroup.vue';

const props = defineProps({
  state: {
    type: Object,
    default: null
  },
  v: {
    type: Object,
    default: null
  },
  editIds: {
    type: Array,
    required: true
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  form: {
    type: String,
    required: true
  },
  formOption: {
    type: String as PropType<Option>,
    default: ''
  }
});
// needed on quicktool form to handle multiple "forms"
const emit = defineEmits(['change', 'reset']);
const { dialog } = useQuasar();
const { t } = useI18n();
const useInvalidate = useInvalidateQueries();
const notification = useNotification();
const isSubmitting = ref(false);
const api = useApiFetch();
const lastInsert = ref(null);
const lastInsertTable = ref<string | null>(null);
const { state, editIds, isEdit, v, form } = toRefs(props);
const cleanup = useFormCleanup(form, state, props.isEdit);
const numberOfTasks = computed(() => {
  let count = 0;
  if (
    ['feed', 'harvest', 'treatment', 'checkup', 'movedate'].includes(form.value)
  ) {
    if (state.value && state.value.hive) {
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
  const data = {
    ids: id,
    data: cleanup.cleanup()
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
    error => {
      notification.open('negative', error);
    }
  );
  isSubmitting.value = false;
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
    error => {
      notification.open('negative', error);
    }
  );
  isSubmitting.value = false;
}

async function onSubmit() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value?.$validate();
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
      lastInsert.value =
        Array.isArray(response) && response.length === 0 ? null : response;
      lastInsertTable.value = unref(form.value);

      dataChanged('insert', response);
    },
    error => {
      notification.open('negative', error);
    }
  );
  isSubmitting.value = false;
}

function dataChanged(
  type: 'update' | 'insert' = 'update',
  response: unknown = null
) {
  useInvalidate.invalidate(form.value);
  notification.open('positive', '');
  emit('change', type, response);
}

function onReset() {
  dialog({
    title: t('reset'),
    message: t('resetConfirm'),
    ok: {
      label: t('yes'),
      class: 'btn-confirm'
    },
    cancel: true,
    persistent: false
  }).onOk(() => {
    emit('reset');
  });
}
</script>

<template>
  <div v-if="!isEdit" class="q-pt-md full-width">
    <!-- Save button standalone on small screens -->
    <div class="lt-md">
      <BtnBase
        color="secondary"
        :loading="isSubmitting"
        :label="`${$t('save')} (${numberOfTasks})`"
        data-cy="btn-form-save-mobile"
        class="full-width q-mb-lg"
        size="md"
        @click="onSubmit"
      />
      <BtnBaseGroup size="md" class="q-mb-lg">
        <BtnBase
          :disable="lastInsert === null ? true : false"
          color="info"
          :loading="isSubmitting"
          :label="$t('undo')"
          tabindex="-1"
          data-cy="btn-form-undo-mobile"
          @click="onUndo"
        />
        <BtnBase
          color="warning"
          :label="$t('reset')"
          tabindex="-1"
          @click="onReset"
        />
      </BtnBaseGroup>
    </div>
    <!-- grouped layout for medium and larger screens -->
    <BtnBaseGroup size="md" class="full-width gt-sm">
      <BtnBase
        :disable="lastInsert === null ? true : false"
        color="info"
        :loading="isSubmitting"
        :label="$t('undo')"
        tabindex="-1"
        data-cy="btn-form-undo"
        @click="onUndo"
      />
      <BtnBase
        class="q-mr-lg"
        color="warning"
        :label="$t('reset')"
        tabindex="-1"
        @click="onReset"
      />
      <BtnBase
        color="secondary"
        :loading="isSubmitting"
        :label="`${$t('save')} (${numberOfTasks})`"
        data-cy="btn-form-save"
        @click="onSubmit"
      />
    </BtnBaseGroup>
  </div>
  <div v-else class="q-pt-md full-width">
    <!-- button standalone on small screens -->
    <div class="lt-md">
      <BtnBase
        color="secondary"
        :loading="isSubmitting"
        :label="`${$t('update')} (${numberOfEdits})`"
        data-cy="btn-form-update-mobile"
        class="full-width q-mb-lg"
        size="md"
        @click="onUpdate"
      />
      <BtnBaseGroup size="md" class="q-mb-lg">
        <BtnBase
          color="warning"
          :label="$t('reset')"
          tabindex="-1"
          @click="onReset"
        />
      </BtnBaseGroup>
    </div>
    <!--  grouped layout for medium and larger screens -->
    <BtnBaseGroup class="full-width gt-sm" size="md">
      <BtnBase
        color="warning"
        class="q-mr-lg"
        :label="$t('reset')"
        tabindex="-1"
        @click="onReset"
      />
      <BtnBase
        color="secondary"
        :loading="isSubmitting"
        :label="`${$t('update')} (${numberOfEdits})`"
        data-cy="btn-form-update"
        @click="onUpdate"
      />
    </BtnBaseGroup>
  </div>
</template>
