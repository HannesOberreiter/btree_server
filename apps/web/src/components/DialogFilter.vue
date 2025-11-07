<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { computed, reactive, watch } from 'vue';
import { useTableFilterStore } from '../stores/tableFilter';
import BtnBase from './BtnBase.vue';
import BtnCloseDialog from './BtnCloseDialog.vue';
import FormDropdownType from './FormDropdownOption.vue';
import FormDropdownOptionMultiple from './FormDropdownOptionMultiple.vue';
import FormDropdownYear from './FormDropdownYear.vue';
import FormInputDateRange from './FormInputDateRange.vue';

const props = defineProps({
	form: {
		type: String,
		required: true,
	},
});

defineEmits([...useDialogPluginComponent.emits]);

const storeFilter = useTableFilterStore();

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const state = reactive({
	'checkups.type_id': storeFilter.field(props.form, 'checkups.type_id'),
	'treatments.type_id': storeFilter.field(props.form, 'treatments.type_id'),
	'treatments.disease_id': storeFilter.field(
		props.form,
		'treatments.disease_id',
	),
	'feeds.type_id': storeFilter.field(props.form, 'feeds.type_id'),
	'harvests.type_id': storeFilter.field(props.form, 'harvests.type_id'),

	'queens.mating_id': storeFilter.field(props.form, 'queens.mating_id'),
	'queens.race_id': storeFilter.field(props.form, 'queens.race_id'),
	'queens.date': storeFilter.field(props.form, 'queens.date'),
	'queens.hive_id': storeFilter.field(props.form, 'queens.hive_id'),
	'hive_location.apiary_id': storeFilter.field(
		props.form,
		'hive_location.apiary_id',
	),

	'type_id': storeFilter.field(props.form, 'type_id'),
	'source_id': storeFilter.field(props.form, 'source_id'),
	'apiary_id': storeFilter.field(props.form, 'apiary_id'),
	'hive_id': storeFilter.field(props.form, 'hive_id'),

	'apiary_id_array': storeFilter.field(props.form, 'apiary_id_array'),
	'hive_id_array': storeFilter.field(props.form, 'hive_id_array'),
	'hive_id_array_exclude': storeFilter.field(props.form, 'hive_id_array_exclude'),

	'date': storeFilter.field(props.form, 'date'),
	'year': storeFilter.field(props.form, 'year'),
}) as any;

const layouts = {
	hive: [
		{
			comp: FormDropdownType,
			model: 'type_id',
			props: {
				'table': 'hive_types',
				'label': 'type',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormDropdownType,
			model: 'source_id',
			props: {
				'table': 'hive_sources',
				'label': 'source',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormDropdownType,
			model: 'hive_location.apiary_id',
			props: {
				'table': 'apiary',
				'label': 'apiary',
				'allow-empty': 'filterEmpty',
			},
		},
	],
	queen: [
		{
			comp: FormDropdownType,
			model: 'queens.mating_id',
			props: {
				'table': 'queen_matings',
				'label': 'mating',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormDropdownType,
			model: 'queens.race_id',
			props: {
				'table': 'queen_races',
				'label': 'race',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormDropdownType,
			model: 'queens.hive_id',
			props: {
				'table': 'hive',
				'label': 'hive',
				'allow-empty': 'filterEmpty',
				'filter-empty': 'noHive',
			},
		},
		{
			comp: FormDropdownType,
			model: 'hive_location.apiary_id',
			props: {
				'table': 'apiary',
				'label': 'apiary',
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
				'table': 'hive',
				'label': 'hive',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormDropdownType,
			model: 'apiary_id',
			props: {
				'table': 'apiary',
				'label': 'apiary',
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
				'table': 'feed_types',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormDropdownType,
			model: 'feed_apiary.apiary_id',
			props: {
				'table': 'apiary',
				'label': 'apiary',
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
				'table': 'harvest_types',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormDropdownType,
			model: 'harvest_apiary.apiary_id',
			props: {
				'table': 'apiary',
				'label': 'apiary',
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
				'table': 'treatment_types',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormDropdownType,
			model: 'treatment_apiary.apiary_id',
			props: {
				'table': 'apiary',
				'label': 'apiary',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormDropdownType,
			model: 'treatments.disease_id',
			props: {
				'table': 'treatment_diseases',
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
				'table': 'checkup_types',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormDropdownType,
			model: 'checkup_apiary.apiary_id',
			props: {
				'table': 'apiary',
				'label': 'apiary',
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
			model: 'charges.type_id',
			props: {
				'table': 'charge_types',
				'allow-empty': 'filterEmpty',
			},
		},
	],
	scale_data: [
		{
			comp: FormDropdownType,
			model: 'scale_id',
			props: {
				'table': 'scale',
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
	statistic_harvest: [
		{
			comp: FormDropdownYear,
			model: 'year',
			props: {},
		},
		{
			comp: FormDropdownType,
			model: 'harvests.type_id',
			props: {
				'table': 'harvest_types',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormDropdownOptionMultiple,
			model: 'hive_id_array',
			props: {
				table: 'hive',
				label: 'hive',
			},
		},
		{
			comp: FormDropdownOptionMultiple,
			model: 'hive_id_array_exclude',
			props: {
				table: 'hive',
				label: 'excludeHive',
			},
		},
		{
			comp: FormDropdownOptionMultiple,
			model: 'apiary_id_array',
			props: {
				table: 'apiary',
				label: 'apiary',
			},
		},
	],
	statistic_harvest_table: [
		{
			comp: FormDropdownYear,
			model: 'year',
			props: {
				'allow-empty': 'allYears',
				'select-empty': true,
			},
		},
		{
			comp: FormDropdownType,
			model: 'harvests.type_id',
			props: {
				'table': 'harvest_types',
				'allow-empty': 'filterEmpty',
			},
		},
	],
	statistic_feed: [
		{
			comp: FormDropdownYear,
			model: 'year',
			props: {},
		},
		{
			comp: FormDropdownType,
			model: 'feeds.type_id',
			props: {
				'table': 'feed_types',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormDropdownOptionMultiple,
			model: 'hive_id_array',
			props: {
				table: 'hive',
				label: 'hive',
			},
		},
		{
			comp: FormDropdownOptionMultiple,
			model: 'hive_id_array_exclude',
			props: {
				table: 'hive',
				label: 'excludeHive',
			},
		},
		{
			comp: FormDropdownOptionMultiple,
			model: 'apiary_id_array',
			props: {
				table: 'apiary',
				label: 'apiary',
			},
		},
	],
	statistic_feed_table: [
		{
			comp: FormDropdownYear,
			model: 'year',
			props: {
				'allow-empty': 'allYears',
				'select-empty': true,
			},
		},
		{
			comp: FormDropdownType,
			model: 'feeds.type_id',
			props: {
				'table': 'feed_types',
				'allow-empty': 'filterEmpty',
			},
		},
	],
	statistic_treatment: [
		{
			comp: FormDropdownYear,
			model: 'year',
			props: {},
		},
		{
			comp: FormDropdownType,
			model: 'treatments.type_id',
			props: {
				'table': 'treatment_types',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormDropdownType,
			model: 'treatments.disease_id',
			props: {
				'label': 'disease',
				'table': 'treatment_diseases',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormDropdownOptionMultiple,
			model: 'hive_id_array',
			props: {
				table: 'hive',
				label: 'hive',
			},
		},
		{
			comp: FormDropdownOptionMultiple,
			model: 'hive_id_array_exclude',
			props: {
				table: 'hive',
				label: 'excludeHive',
			},
		},
		{
			comp: FormDropdownOptionMultiple,
			model: 'apiary_id_array',
			props: {
				table: 'apiary',
				label: 'apiary',
			},
		},
	],
	statistic_treatment_table: [
		{
			comp: FormDropdownYear,
			model: 'year',
			props: {
				'allow-empty': 'allYears',
				'select-empty': true,
			},
		},
		{
			comp: FormDropdownType,
			model: 'treatments.type_id',
			props: {
				'table': 'treatment_types',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormDropdownType,
			model: 'treatments.disease_id',
			props: {
				'label': 'disease',
				'table': 'treatment_diseases',
				'allow-empty': 'filterEmpty',
			},
		},
	],
	statistic_rating_table: [
		{
			comp: FormDropdownYear,
			model: 'year',
			props: {
				'allow-empty': 'allYears',
				'select-empty': true,
			},
		},
	],
	statistic_queen_table: [
		{
			comp: FormDropdownType,
			model: 'queens.mating_id',
			props: {
				'table': 'queen_matings',
				'label': 'mating',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormDropdownType,
			model: 'queens.race_id',
			props: {
				'table': 'queen_races',
				'label': 'race',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormDropdownType,
			model: 'queens.hive_id',
			props: {
				'table': 'hive',
				'label': 'hive',
				'allow-empty': 'filterEmpty',
				'filter-empty': 'noHive',
			},
		},
		{
			comp: FormDropdownType,
			model: 'hive_location.apiary_id',
			props: {
				'table': 'apiary',
				'label': 'apiary',
				'allow-empty': 'filterEmpty',
			},
		},
		{
			comp: FormInputDateRange,
			model: 'queens.move_date',
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
</script>

<template>
	<q-dialog
		ref="dialogRef"
		:maximized="$q.platform.is.mobile"
		@hide="onDialogHide"
	>
		<q-card style="width: 700px">
			<q-card-section>
				<div class="row">
					<div class="text-h6">
						{{ $t('filter') }}
					</div>
					<q-space />
					<BtnCloseDialog />
				</div>
				<div class="row full-width">
					<div v-for="(o, i) in layout" :key="i" class="col-12">
						<component :is="o.comp" v-model="state[o.model]" v-bind="o.props" />
					</div>
				</div>
			</q-card-section>
			<q-card-actions align="center">
				<BtnBase color="primary" @click="onDialogOK()">
					{{ $t('filter') }}
				</BtnBase>
				<BtnBase color="negative darken-1" @click="resetFilter()">
					{{ $t('filterRemove') }}
				</BtnBase>
			</q-card-actions>
		</q-card>
	</q-dialog>
</template>
