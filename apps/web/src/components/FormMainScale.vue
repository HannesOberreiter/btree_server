<script setup lang="ts">
import type { FormScale } from '../types';
import useVuelidate from '@vuelidate/core';
import { flatten, map, merge } from 'lodash-es';
import { computed, ref, unref } from 'vue';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import FormButtons from './FormButtons.vue';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormDropdownOption from './FormDropdownOption.vue';
import FormInputText from './FormInputText.vue';

const props = defineProps({
	ids: {
		type: Array,
		default: null,
	},
});
const emit = defineEmits<{
	(e: 'onSuccess', value: boolean): void;
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
};

const state = ref<FormScale>({
	hive: undefined as any,
	...stateDefault,
});

async function getEdit(id: unknown[]) {
	return await api.get(`/v1/scale/${id[0]}`).then(
		(response: any) => {
			const editIds = map(response, (row: any) => {
				return [{ value: row.id, label: `ID: ${row.id} / (${row.name})` }];
			});
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
	<q-form class="full-width" data-cy="form-scale" @submit.prevent.stop="">
		<FormDropdownEdit
			v-if="isEdit"
			v-model="editOptions"
			:options="editOptionsCopy"
			off-label="name"
		/>
		<FormInputText
			v-model="state.name"
			label="name"
			name="scale"
			icon="fas fa-passport"
			:hint="$t('scale.nameHint')"
			:values="values"
			:reset="reset"
			:required="true"
		/>
		<FormDropdownOption
			v-model="state.hive"
			table="hive"
			label="hive"
			table-id="hive_id"
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
		form="scale"
		@reset="onReset"
		@change="emit('onSuccess', true)"
	/>
</template>
