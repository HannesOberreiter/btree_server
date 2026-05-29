<script setup lang="ts">
import type { PropType } from 'vue';
import type { FormOption, Option } from '../types';
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge } from 'lodash-es';
import { computed, ref, unref } from 'vue';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import FormButtons from './FormButtons.vue';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormInputCheckbox from './FormInputCheckbox.vue';
import FormInputNote from './FormInputNote.vue';
import FormInputText from './FormInputText.vue';

const props = defineProps({
	ids: {
		type: Array,
		default: null,
	},
	option: {
		type: String as PropType<Option>,
		default: '',
	},
});
const emit = defineEmits<{
	(e: 'success', value: boolean): void;
}>();
const notification = useNotification();
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
	name: '',
	unit: null as any,
	note: null as any,
	modus: true,
	favorite: false,
};

const state = ref<FormOption>({
	...stateDefault,
});

async function getEdit(id: unknown[]) {
	return await api
		.post(`/v1/option/${props.option}/batchGet`, { ids: id })
		.then(
			(response: any) => {
				const editIds = map(response, (row: any) => [
					{ value: row.id, label: `ID: ${row.id} / (${row.name})` },
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
	<q-form class="full-width" data-cy="form-option" @submit.prevent.stop="">
		<FormDropdownEdit
			v-if="isEdit"
			v-model="editOptions"
			:options="editOptionsCopy"
			off-label="name"
		/>
		<FormInputText
			v-model="state.name"
			label="name"
			:name="option"
			icon="fas fa-passport"
			:values="values"
			:reset="reset"
			:required="isEdit ? false : true"
			:max-valid="45"
		/>
		<FormInputText
			v-if="option === 'charge_types'"
			v-model="state.unit"
			label="unit"
			icon="fas fa-wine-bottle"
			:values="values"
			:reset="reset"
			:required="isEdit ? false : true"
			:max-valid="45"
		/>
		<FormInputNote
			v-if="option === 'treatment_vets'"
			v-model="state.note"
			:values="values"
			:reset="reset"
		/>
		<FormInputCheckbox
			v-model="state.modus"
			label="active"
			:values="values"
			:reset="reset"
			status-active="yes"
			status-inactive="no"
		/>
		<FormInputCheckbox
			v-model="state.favorite"
			label="favorite"
			:values="values"
			:reset="reset"
			status-active="yes"
			status-inactive="no"
		/>
	</q-form>
	<FormButtons
		class="q-pt-md"
		:state="state"
		:is-edit="isEdit"
		:edit-ids="editOptions"
		:v="v"
		form="option"
		:form-option="props.option"
		@reset="onReset"
		@change="emit('success', true)"
	/>
</template>
