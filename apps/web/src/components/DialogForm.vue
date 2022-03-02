<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <q-card-section class="">
        <div class="row">
          <div class="text-h6">{{ t(title) }}</div>
          <q-space />
          <q-btn
            ref="closeBtn"
            icon="fas fa-times"
            flat
            round
            dense
            v-close-popup
          />
        </div>
        <div class="row full-width">
          <form-main-todo
            v-if="todo"
            :form-data="todo"
            @onSuccess="onDialogOK()"
          ></form-main-todo>
          <form-main-apiary
            v-if="apiary"
            :form-data="apiary"
            @onSuccess="(value) => onDialogOK(value)"
          ></form-main-apiary>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { Apiary, Todo } from '../types';
import FormMainTodo from './FormMainTodo.vue';
import FormMainApiary from './FormMainApiary.vue';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const { t } = useI18n();

defineProps({
  title: {
    type: String,
    required: true,
  },
  todo: {
    type: Object as PropType<Todo>,
    default: null,
  },
  apiary: {
    type: Object as PropType<Apiary>,
    default: null,
  },
});
defineEmits([...useDialogPluginComponent.emits, 'onSuccess']);
</script>
