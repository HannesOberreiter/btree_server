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
          <component
            :is="layout.comp"
            :ids="ids"
            v-bind="layout.props"
            @on-success="(value: any) => onDialogOK(value)"
          >
          </component>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import FormMainApiary from './FormMainApiary.vue';
import FormMainTodo from './FormMainTodo.vue';
import FormMainHive from '~/components/FormMainHive.vue';
import FormMainMovement from './FormMainMovement.vue';
import FormMainQueen from './FormMainQueen.vue';
import { useDialogPluginComponent } from 'quasar';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const props = defineProps({
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

  maximized: {
    type: Boolean,
    default: false,
  },
  selected: {
    type: Array,
    default: null,
  },
  date: {
    type: String,
    default: '',
  },
  latlng: {
    type: Object,
    default: null,
  },
});

const layouts = {
  todo: {
    comp: FormMainTodo,
    props: {
      date: props.date,
    },
  },
  apiary: {
    comp: FormMainApiary,
    props: {
      latlng: props.latlng,
    },
  },
  hive: {
    comp: FormMainHive,
    props: {},
  },
  queen: {
    comp: FormMainQueen,
    props: {
      selected: props.selected,
    },
  },
  movedate: {
    comp: FormMainMovement,
    props: {
      selected: props.selected,
    },
  },
} as any;

const layout = computed(() => layouts[props.form]);

defineEmits([...useDialogPluginComponent.emits, 'onSuccess']);
</script>
