<template>
  <div v-if="isLoading || isError">
    <global-loading></global-loading>
  </div>
  <div v-else>
    <q-form class="full-width" @submit.prevent.stop="onSubmit">
      <div class="row">
        <div class="col-12">
          <form-common-name v-model="state.name"></form-common-name>
        </div>
        <div class="col-12">
          <q-input
            v-model="state.description"
            :error="v.description.$error"
            :error-message="validationErrors(v.description)"
            :no-error-icon="true"
            :label="t('description')"
            name="description"
            type="text"
            filled
          >
          </q-input>
        </div>
        <div class="col-6">
          <q-input
            v-model="state.latitude"
            :error="v.latitude.$error"
            :error-message="validationErrors(v.latitude)"
            :no-error-icon="true"
            :label="t('latitude')"
            name="latitude"
            :min="-90"
            :max="90"
            type="number"
            filled
          >
          </q-input>
        </div>
        <div class="col-6">
          <q-input
            v-model="state.longitude"
            :error="v.longitude.$error"
            :error-message="validationErrors(v.longitude)"
            :no-error-icon="true"
            :label="t('longitude')"
            :min="-90"
            :max="90"
            name="longitude"
            type="number"
            filled
          >
          </q-input>
        </div>
        <div class="col-12">
          <form-common-note v-model="state.note"></form-common-note>
        </div>
      </div>
    </q-form>
    <q-btn
      v-if="editId === 0"
      unelevated
      size="md"
      color="secondary"
      type="submit"
      :loading="isSubmitting"
      :label="t('save')"
      class="full-width text-white"
      @click="onSubmit"
    />
    <q-btn-group v-else spread>
      <q-btn
        unelevated
        size="md"
        color="secondary"
        :loading="isSubmitting"
        :label="t('save')"
        class="full-width text-white"
        @click="onEdit"
      />
      <q-btn
        unelevated
        size="md"
        :color="state.modus ? 'orange' : 'primary'"
        :loading="isSubmitting"
        :label="state.modus ? t('deactivate') : t('activate')"
        class="full-width text-white"
        @click="onModus"
      />
      <q-btn
        v-if="!apiary.hive_count"
        unelevated
        size="md"
        color="negative"
        :loading="isSubmitting"
        :label="t('delete')"
        class="full-width text-white"
        @click="onDelete"
      />
    </q-btn-group>
  </div>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { required, maxLength, between } from '~/helpers/i18n-validators';
import { validationErrors } from '~/helpers';
import { useNotification } from '~/composables/useResponseText';
import { api } from '~/boot/axios';
import { computed, PropType, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Apiary } from '~/types';

import FormCommonName from './FormCommonName.vue';
import FormCommonNote from './FormCommonNote.vue';
import { useApiaryQuery } from '~/query';
import GlobalLoading from './GlobalLoading.vue';

const { t } = useI18n();
const notification = useNotification();

const props = defineProps({
  editId: {
    type: Number,
    default: 0,
  },
  formData: {
    type: Object as PropType<Apiary>,
    default: () => {
      return {
        name: '',
        description: '',
        latitude: 0,
        longitude: 0,
        note: '',
        url: '',
        modus: true,
      };
    },
  },
});
const emit = defineEmits(['onSuccess']);

const {
  isLoading,
  data: apiary,
  isError,
  refetch,
} = useApiaryQuery(props.editId, {
  enabled: computed(() => props.editId !== 0),
});

const state = ref({
  ...props.formData,
});

watch(props, (cur) => {
  state.value = cur.formData;
});

if (apiary.value) {
  state.value = {
    name: apiary.value.name,
    description: apiary.value.description,
    latitude: apiary.value.latitude,
    longitude: apiary.value.longitude,
    note: apiary.value.note,
    url: apiary.value.url,
    modus: apiary.value.modus,
  };
} else {
  watch(apiary, () => {
    state.value = {
      name: apiary.value.name,
      description: apiary.value.description,
      latitude: apiary.value.latitude,
      longitude: apiary.value.longitude,
      note: apiary.value.note,
      url: apiary.value.url,
      modus: apiary.value.modus,
    };
  });
}

const rules = {
  description: { maxLengthValue: maxLength(512) },
  latitude: { required, betweenValue: between(-90, 90) },
  longitude: { required, betweenValue: between(-90, 90) },
  note: { maxLengthValue: maxLength(2000) },
};
const v = useVuelidate(rules, state, { $autoDirty: true });

const isSubmitting = ref(false);

async function onEdit() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }
  let data = { ...state.value } as any;
  data.id = props.editId;
  await api.patch('/v1/apiary', JSON.stringify(data)).then(
    async (response: any) => {
      notification.open('positive', '');
      await refetch.value();
      emit('onSuccess', response.data);
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
}

async function onModus() {
  isSubmitting.value = true;
  const data = {
    id: props.editId,
    modus: !state.value.modus,
  };
  await api.patch('/v1/apiary', data).then(
    async (response: any) => {
      notification.open('positive', '');
      await refetch.value();
      emit('onSuccess', response.data);
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
}

function onDelete() {
  api.delete(`/v1/apiary/${props.editId}`).then(
    (response: any) => {
      notification.open('positive', '');
      emit('onSuccess', response.data);
    },
    (error) => {
      notification.open('negative', error);
    }
  );
}

async function onSubmit() {
  isSubmitting.value = true;
  const isFormCorrect = await v.value.$validate();
  if (!isFormCorrect) {
    isSubmitting.value = false;
    return;
  }
  const data = JSON.stringify(state.value);
  await api.post('/v1/apiary', data).then(
    (response: any) => {
      notification.open('positive', '');
      emit('onSuccess', response.data);
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
}
</script>
