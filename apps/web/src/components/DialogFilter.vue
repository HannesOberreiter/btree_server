<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="width: 700px">
      <q-card-section>
        <div class="row">
          <div class="text-h6">{{ $t('filter') }}</div>
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
          <div v-for="(o, i) in layout" :key="i" class="col-12">
            <component :is="o.comp" v-model="state[o.model]" v-bind="o.props">
            </component>
          </div>
        </div>
      </q-card-section>
      <q-card-actions>
        <q-btn color="primary" @click="onDialogOK()">
          {{ $t('filter') }}
        </q-btn>
        <q-btn color="negative darken-1" @click="resetFilter()">
          {{ $t('filterRemove') }}
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useTableFilterStore } from '~/stores/tableFilter';
import FormDropdownType from './FormDropdownOption.vue';
import FormInputDateRange from './FormInputDateRange.vue';

const storeFilter = useTableFilterStore();

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const props = defineProps({
  form: {
    type: String,
    required: true,
  },
});

const state = reactive({
  type_id: storeFilter.field(props.form, 'type_id'),
  source_id: storeFilter.field(props.form, 'source_id'),
  apiary_id: storeFilter.field(props.form, 'apiary_id'),
  hive_id: storeFilter.field(props.form, 'hive_id'),
  date: storeFilter.field(props.form, 'date'),
});

const layouts = {
  hive: [
    {
      comp: FormDropdownType,
      model: 'type_id',
      props: {
        table: 'hive_types',
        label: 'type',
        'allow-empty': 'filterEmpty',
      },
    },
    {
      comp: FormDropdownType,
      model: 'source_id',
      props: {
        table: 'hive_sources',
        label: 'source',
        'allow-empty': 'filterEmpty',
      },
    },
  ],
  movedate: [
    {
      comp: FormDropdownType,
      model: 'hive_id',
      props: {
        table: 'hive',
        label: 'hive',
        'allow-empty': 'filterEmpty',
      },
    },
    {
      comp: FormDropdownType,
      model: 'apiary_id',
      props: {
        table: 'apiary',
        label: 'apiary',
        'allow-empty': 'filterEmpty',
      },
    },
    {
      comp: FormInputDateRange,
      model: 'date',
      props: {
        label: 'daterange',
      },
    },
  ],
} as any;

const layout = computed(() => layouts[props.form]);

watch(state, (cur) => {
  storeFilter.update(props.form, cur);
});

function resetFilter() {
  storeFilter.reset(props.form);
  onDialogHide();
}

defineEmits([...useDialogPluginComponent.emits]);
</script>
