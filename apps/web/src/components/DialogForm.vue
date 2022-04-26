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
          <suspense>
            <template #fallback>
              <global-loading></global-loading>
            </template>
            <component
              :is="layout.comp"
              :ids="ids"
              v-bind="layout.props"
              @on-success="(value: any) => onDialogOK(value)"
            >
            </component>
          </suspense>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import dayjs from 'dayjs';
import { PropType } from 'vue';
import { Option } from '~/types';

const FormMainApiary = defineAsyncComponent(
  () => import('./FormMainApiary.vue')
);
const FormMainTodo = defineAsyncComponent(() => import('./FormMainTodo.vue'));
const FormMainHive = defineAsyncComponent(() => import('./FormMainHive.vue'));
const FormMainMovement = defineAsyncComponent(
  () => import('./FormMainMovement.vue')
);
const FormMainTask = defineAsyncComponent(() => import('./FormMainTask.vue'));
const FormMainQueen = defineAsyncComponent(() => import('./FormMainQueen.vue'));
const FormMainScaleData = defineAsyncComponent(
  () => import('./FormMainScaleData.vue')
);
const FormMainOption = defineAsyncComponent(
  () => import('./FormMainOption.vue')
);
const FormMainCharge = defineAsyncComponent(
  () => import('./FormMainCharge.vue')
);
const FormMainScale = defineAsyncComponent(() => import('./FormMainScale.vue'));

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
    default: dayjs().format('YYYY-MM-DD'),
  },
  latlng: {
    type: Object,
    default: null,
  },
  option: {
    type: String as PropType<Option>,
    default: '',
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
  feed: {
    comp: FormMainTask,
    props: {
      task: props.form,
    },
  },
  harvest: {
    comp: FormMainTask,
    props: {
      task: props.form,
    },
  },
  checkup: {
    comp: FormMainTask,
    props: {
      task: props.form,
    },
  },
  treatment: {
    comp: FormMainTask,
    props: {
      task: props.form,
    },
  },
  charge: {
    comp: FormMainCharge,
    props: {},
  },
  scale_data: {
    comp: FormMainScaleData,
    props: {},
  },
  scale: {
    comp: FormMainScale,
    props: {},
  },
  option: {
    comp: FormMainOption,
    props: {
      option: props.option,
    },
  },
} as any;

const layout = computed(() => layouts[props.form]);

defineEmits([...useDialogPluginComponent.emits, 'onSuccess']);
</script>
