<script setup lang="ts">
import type { FormScaleData } from '../types';
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge } from 'lodash-es';
import { computed, ref, unref } from 'vue';
import { useApiFetch } from '../composables/useApi';
import { useDateFormat } from '../composables/useDate';
import { useNotification } from '../composables/useNotification';
import FormButtons from './FormButtons.vue';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormDropdownOption from './FormDropdownOption.vue';
import FormInputDate from './FormInputDate.vue';
import FormInputNote from './FormInputNote.vue';
import FormInputNumeric from './FormInputNumeric.vue';

const props = defineProps({
	ids: {
		type: Array,
		default: null,
	},
});
const emit = defineEmits<{
	(e: 'success', value: boolean): void;
}>();
const notification = useNotification();
const useDate = useDateFormat();
const values = ref({});
const api = useApiFetch();
const reset = ref(0);
const ids = ref(props.ids);
const isEdit = computed(() => {
	if (ids.value === null)
		return false;
	if (ids.value.length === 0)
		return false;
	return true;
});
if (isEdit.value)
	getEdit(unref(ids.value));

const v = useVuelidate();

const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;

const stateDefault = {
	datetime: useDate.isoFormat(useDate.getCurrent(), 'date-time-seconds'),
	weight: 0,
	temp1: 0,
	temp2: 0,
	humidity: 0,
	rain: 0,
	note: '',
};

const state = ref<FormScaleData>({
	scale: undefined as any,
	...stateDefault,
});

async function getEdit(id: unknown[]) {
	return await api.post('/v1/scale_data/batchGet', { ids: id }).then(
		(response: any) => {
			const editIds = map(response, (row: any) => [
				{ value: row.id, label: `ID: ${row.id} / (${row.scale.name})` },
			]);
			editOptions.value = flatten(editIds);
			editOptionsCopy.value = flatten(editIds);
			values.value = response;
		},
		(error) => {
			notification.open('negative', error);
		},
	);
}

function onReset() {
	if (!isEdit.value) {
		merge(state.value, stateDefault);
	}
	notification.open('positive', 'successReset');
	reset.value++;
}
</script>

<template>
	<q-form class="full-width" data-cy="form-scale-data" @submit.prevent.stop="">
		<FormDropdownEdit
			v-if="isEdit"
			v-model="editOptions"
			:options="editOptionsCopy"
			off-label="name"
		/>
		<FormInputDate
			v-model="state.datetime"
			:readonly="false"
			:values="values"
			:reset="reset"
			label="datetime"
			date-format="YYYY-MM-DD HH:mm:ss"
		/>

		<FormDropdownOption
			v-model="state.scale"
			table="scale"
			label="scale.name"
			:values="values"
			:reset="reset"
		/>

		<FormInputNumeric
			v-model="state.weight"
			label="weight"
			icon="fas fa-weight"
			numeric-valid="decimal"
			:max-valid="1000"
			:values="values"
			:reset="reset"
		/>
		<FormInputNumeric
			v-model="state.temp1"
			label="temperature"
			table-id="temp1"
			icon="fas fa-temperature-high"
			numeric-valid="decimal"
			:min-valid="-100"
			:values="values"
			:reset="reset"
		/>
		<FormInputNumeric
			v-model="state.temp2"
			label="temperature"
			table-id="temp2"
			icon="fas fa-temperature-low"
			numeric-valid="decimal"
			:min-valid="-100"
			:values="values"
			:reset="reset"
		/>
		<FormInputNumeric
			v-model="state.humidity"
			label="humidity"
			icon="fas fa-percent"
			numeric-valid="decimal"
			:values="values"
			:reset="reset"
		/>
		<FormInputNumeric
			v-model="state.rain"
			label="rain"
			icon="fas fa-cloud-rain"
			numeric-valid="decimal"
			:values="values"
			:reset="reset"
		/>
		<FormInputNote
			v-model="state.note"
			:values="values"
			:reset="reset"
		/>
	</q-form>
	<FormButtons
		class="q-pt-md"
		:state="state"
		:is-edit="isEdit"
		:edit-ids="editOptions"
		:v="v"
		form="scale_data"
		@reset="onReset"
		@change="emit('success', true)"
	/>
</template>
