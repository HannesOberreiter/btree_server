<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <q-card-section class="">
        <div class="row">
          <div class="text-h6">{{ t(title) }}</div>
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
            :form-data="todo"
            @on-success="onDialogOK()"
          ></form-main-todo>
          <form-main-apiary
            v-if="form === 'apiary'"
            :edit-id="editId"
            :form-data="apiary"
            @on-success="(value) => onDialogOK(value)"
          ></form-main-apiary>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { Apiary, Todo } from '~/types';
import { PropType } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import FormMainApiary from './FormMainApiary.vue';
import FormMainTodo from './FormMainTodo.vue';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const { t } = useI18n();

defineProps({
  title: {
    type: String,
    required: true,
  },
  form: {
    type: String,
    required: true,
  },
  editId: {
    type: Number,
    default: 0,
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
