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
  'checkups.type_id': storeFilter.field(props.form, 'checkups.type_id'),
  'treatments.type_id': storeFilter.field(props.form, 'treatments.type_id'),
  'treatments.disease_id': storeFilter.field(
    props.form,
    'treatments.disease_id'
  ),
  'feeds.type_id': storeFilter.field(props.form, 'feeds.type_id'),
  'harvests.type_id': storeFilter.field(props.form, 'harvests.type_id'),

  'queens.mating_id': storeFilter.field(props.form, 'queens.mating_id'),
  'queens.race_id': storeFilter.field(props.form, 'queens.race_id'),
  'queens.date': storeFilter.field(props.form, 'queens.date'),
  'queens.hive_id': storeFilter.field(props.form, 'queens.hive_id'),
  'hive_location.apiary_id': storeFilter.field(
    props.form,
    'hive_location.apiary_id'
  ),

  type_id: storeFilter.field(props.form, 'type_id'),
  source_id: storeFilter.field(props.form, 'source_id'),
  apiary_id: storeFilter.field(props.form, 'apiary_id'),
  hive_id: storeFilter.field(props.form, 'hive_id'),
  date: storeFilter.field(props.form, 'date'),
}) as any;

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
  queen: [
    {
      comp: FormDropdownType,
      model: 'queens.mating_id',
      props: {
        table: 'queen_matings',
        label: 'mating',
        'allow-empty': 'filterEmpty',
      },
    },
    {
      comp: FormDropdownType,
      model: 'queens.race_id',
      props: {
        table: 'queen_races',
        label: 'race',
        'allow-empty': 'filterEmpty',
      },
    },
    {
      comp: FormDropdownType,
      model: 'queens.hive_id',
      props: {
        table: 'hive',
        label: 'hive',
        'allow-empty': 'filterEmpty',
      },
    },
    {
      comp: FormDropdownType,
      model: 'hive_location.apiary_id',
      props: {
        table: 'apiary',
        label: 'apiary',
        'allow-empty': 'filterEmpty',
      },
    },
    {
      comp: FormInputDateRange,
      model: 'queens.date',
      props: {
        label: 'daterange',
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
  todo: [
    {
      comp: FormInputDateRange,
      model: 'date',
      props: {
        label: 'daterange',
      },
    },
  ],
  feed: [
    {
      comp: FormDropdownType,
      model: 'feeds.type_id',
      props: {
        table: 'feed_types',
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
  harvest: [
    {
      comp: FormDropdownType,
      model: 'harvests.type_id',
      props: {
        table: 'harvest_types',
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
  treatment: [
    {
      comp: FormDropdownType,
      model: 'treatments.type_id',
      props: {
        table: 'treatment_types',
        'allow-empty': 'filterEmpty',
      },
    },
    {
      comp: FormDropdownType,
      model: 'treatments.disease_id',
      props: {
        table: 'treatment_diseases',
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
  checkup: [
    {
      comp: FormDropdownType,
      model: 'checkups.type_id',
      props: {
        table: 'checkup_types',
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
  charge: [
    {
      comp: FormDropdownType,
      model: 'type_id',
      props: {
        table: 'charge_types',
        'allow-empty': 'filterEmpty',
      },
    },
  ],
  scale_data: [
    {
      comp: FormDropdownType,
      model: 'scale_id',
      props: {
        table: 'scale',
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
