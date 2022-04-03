<template>
  <q-dialog ref="dialogRef" :maximized="maximized" @hide="onDialogHide">
    <q-card style="width: 700px">
      <q-card-section>
        <div class="row">
          <div class="text-h6">{{ $t(title) }}</div>
          <q-space />
          <q-btn
            ref="closeBtn"
            v-close-popup
            icon="fas fa-times"
            flat
            round
            dense
          />
        </div>
        <div class="row full-width">
          <form-main-todo
            v-if="form === 'todo'"
            :ids="ids"
            :date="date"
            @on-success="onDialogOK()"
          ></form-main-todo>
          <form-main-apiary
            v-else-if="form === 'apiary'"
            :id="id"
            :latlng="latlng"
            @on-success="(value) => onDialogOK(value)"
          ></form-main-apiary>
          <form-main-hive
            v-else-if="form === 'hive'"
            :ids="ids"
            @on-success="(value) => onDialogOK(value)"
          ></form-main-hive>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import FormMainApiary from './FormMainApiary.vue';
import FormMainTodo from './FormMainTodo.vue';
import FormMainHive from '~/components/FormMainHive.vue';

import dayjs from 'dayjs';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

defineProps({
  title: {
    type: String,
    required: true,
  },
  form: {
    type: String,
    required: true,
  },
  ids: {
    type: Array,
    default: null,
  },
  id: {
    type: Number,
    default: 0,
  },
  date: {
    type: String,
    default: dayjs().format('YYYY-MM-DD'),
  },
  latlng: {
    type: Object,
    default: null,
  },
  maximized: {
    type: Boolean,
    default: false,
  },
});

defineEmits([...useDialogPluginComponent.emits, 'onSuccess']);
</script>
