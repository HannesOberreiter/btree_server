<script setup lang="ts">
import type { FormRearing } from '../types';
import useVuelidate from '@vuelidate/core';
import dayjs from 'dayjs';
import { flatten, map, merge } from 'lodash-es';
import { computed, ref, unref } from 'vue';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import FormButtons from './FormButtons.vue';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormDropdownRearing from './FormDropdownRearing.vue';
import FormDropdownSymbol from './FormDropdownSymbol.vue';
import FormInputDate from './FormInputDate.vue';
import FormInputNote from './FormInputNote.vue';
import FormInputNumeric from './FormInputNumeric.vue';
import FormInputText from './FormInputText.vue';

const props = defineProps({
	ids: {
		type: Array,
		default: null,
	},
});
const emit = defineEmits(['onSuccess']);
const stateDefault = {
	name: '',
	symbol: 'venus',
	date: dayjs().format('YYYY-MM-DD HH:mm'),
	larvae: 0,
	hatch: 0,
	mated: 0,
	note: '',
};
const notification = useNotification();
const api = useApiFetch();
const values = ref({});
const reset = ref(0);
const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;
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

const state = ref<FormRearing>({
	detail: undefined as any,
	type: undefined as any,
	...stateDefault,
});

const rules = {};
const v = useVuelidate(rules, state, { $autoDirty: true });

async function getEdit(id: unknown[]) {
	return await api.post('/v1/rearing/batchGet', { ids: id }).then(
		(response: any) => {
			const editIds = map(response, (row: any) => [
				{
					value: row.id,
					label: `ID: ${row.id} / (${dayjs(row.date).format(
						'YYYY-MM-DD HH:mm',
					)})`,
				},
			]);
			editOptions.value = flatten(editIds);
			editOptionsCopy.value = [...unref(editOptions.value)];
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
	reset.value++;
	notification.open('info', 'successReset');
}
</script>

<template>
	<q-form class="full-width" data-cy="form-rearing" @submit.prevent.stop="">
		<FormDropdownEdit
			v-if="isEdit"
			v-model="editOptions"
			off-label="date"
			class="col-12"
			:options="editOptionsCopy"
		/>
		<FormInputText
			v-model="state.name"
			:values="values"
			:reset="reset"
			:required="false"
			label="name"
			name="rearingName"
			icon="none"
			:max-valid="24"
		>
			<template #deepBefore>
				<FormDropdownSymbol
					v-model="state.symbol"
					:values="values"
					:reset="reset"
				/>
			</template>
		</FormInputText>
		<FormInputDate
			v-model="state.date"
			date-format="YYYY-MM-DD HH:mm"
			label="date"
			:values="values"
			:reset="reset"
		/>
		<FormDropdownRearing
			v-model="state.type"
			v-model:model-detail="state.detail"
			v-model:model-date="state.date"
			:values="values"
			:reset="reset"
		/>
		<div class="row q-pt-md">
			<div class="col-12 col-md-4 q-pr-xs">
				<FormInputNumeric
					v-model="state.larvae"
					label="larvae"
					icon="fas fa-egg"
					numeric-valid="integer"
					:values="values"
					:reset="reset"
				/>
			</div>
			<div class="col-12 col-md-4 q-pr-xs">
				<FormInputNumeric
					v-model="state.hatch"
					label="hatch"
					icon="fas fa-cake-candles"
					numeric-valid="integer"
					:values="values"
					:reset="reset"
				/>
			</div>
			<div class="col-12 col-md-4 q-pr-xs">
				<FormInputNumeric
					v-model="state.mated"
					label="mated"
					icon="fas fa-thumbs-up"
					numeric-valid="integer"
					:values="values"
					:reset="reset"
				/>
			</div>
		</div>

		<FormInputNote
			v-model="state.note"
			class="q-pt-sm"
			:values="values"
			:reset="reset"
		/>
	</q-form>

	<FormButtons
		:state="state"
		:is-edit="isEdit"
		:edit-ids="editOptions"
		:v="v"
		form="rearing"
		@reset="onReset"
		@change="emit('onSuccess', true)"
	/>
</template>
