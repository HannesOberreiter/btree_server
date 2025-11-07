<script setup lang="ts">
import type { FormHive } from '../types';
import useVuelidate from '@vuelidate/core';
import { toRefs } from '@vueuse/core';
import dayjs from 'dayjs';
import { flatten, map, merge } from 'lodash-es';
import { computed, ref, unref } from 'vue';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import { useHivesQuery } from '../composables/useQuery';
import BtnBase from './BtnBase.vue';
import FormButtons from './FormButtons.vue';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormDropdownOption from './FormDropdownOption.vue';
import FormInputCheckbox from './FormInputCheckbox.vue';
import FormInputDate from './FormInputDate.vue';
import FormInputNote from './FormInputNote.vue';
import FormInputNumeric from './FormInputNumeric.vue';
import FormInputText from './FormInputText.vue';
import TooltipBase from './TooltipBase.vue';

const props = defineProps({
	ids: {
		type: Array,
		default: null,
	},
	copy: {
		type: Boolean,
		default: false,
	},
});
const emit = defineEmits(['onSuccess']);
function getNames(v: any) {
	return v.map((o: any) => o.name).join(', ');
}
const stateDefault = {
	name: '',
	date: dayjs().format('YYYY-MM-DD'),
	position: 0,
	grouphive: 0,
	note: '',
	modus: true,
	modusDate: dayjs().format('YYYY-MM-DD'),
};

const notification = useNotification();
const showInterval = ref(false);
const api = useApiFetch();
const values = ref({});
const reset = ref(0);
const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;
const { ids, copy } = toRefs(props);
const isEdit = computed(() => {
	if (copy.value)
		return false;
	if (ids.value === null)
		return false;
	if (ids.value.length === 0)
		return false;
	return true;
});

const isCopy = computed(() => {
	if (copy.value)
		return true;
	return false;
});

if (isEdit.value || isCopy.value)
	getEdit(unref(ids.value));

const { data: hives, refetch } = useHivesQuery({
	limit: 3,
	order: ['id'],
	direction: ['desc'],
	enabled: !isEdit.value,
	modus: null,
});
const lastNames = computed(() =>
	hives.value ? getNames(hives.value.results) : '',
);
const state = ref<FormHive>({
	start: 0,
	repeat: 0,
	apiary: undefined as any,
	type: undefined as any,
	source: undefined as any,
	...stateDefault,
});
const sampleName = computed(() => {
	let hintText = '';
	if (state.value.name !== '' && state.value.repeat > 0) {
		for (let i = 0; i < state.value.repeat; i++) {
			hintText += `${state.value.name + (state.value.start + i)} `;
			if (i > 2) {
				hintText += '...';
				break;
			}
		}
	}
	return hintText;
});

const rules = {};
const v = useVuelidate(rules, state, { $autoDirty: true });

async function getEdit(id: unknown[]) {
	return await api.post('/v1/hive/batchGet', { ids: id }).then(
		(response: any) => {
			if (isEdit.value) {
				const editIds = map(response, (row: any) => [
					{ value: row.id, label: `ID: ${row.id} / (${row.name})` },
				]);
				editOptions.value = flatten(editIds);
				editOptionsCopy.value = [...unref(editOptions.value)];
			}
			// Little helper to set current date if user edits one entry and wants to set inactive state, otherwise it would be the creation date
			if (response.length === 1 && response[0]?.modus) {
				response[0].modus_date = dayjs().format('YYYY-MM-DD');
			}
			values.value = response;
		},
		(error) => {
			notification.open('negative', error);
		},
	);
}

function changeInterval() {
	showInterval.value = !showInterval.value;
}

function onReset() {
	if (!isEdit.value) {
		merge(state.value, stateDefault);
	}
	if (showInterval.value)
		changeInterval();
	reset.value++;
	notification.open('info', 'successReset');
}

async function onChange() {
	emit('onSuccess', true);
	refetch();
}
</script>

<template>
	<q-form class="full-width" data-cy="form-hive" @submit.prevent.stop="">
		<div class="row">
			<FormDropdownEdit
				v-if="isEdit"
				v-model="editOptions"
				class="col-12"
				:options="editOptionsCopy"
			/>

			<FormInputText
				v-model="state.name"
				:values="values"
				:reset="reset"
				:class="isEdit ? 'col-12' : 'col-11'"
				:required="isEdit ? false : true"
				label="name"
				name="hive"
				icon="fas fa-passport"
				:hint="isEdit ? '' : `${$t('lastAdded')}: ${lastNames}`"
				:max-valid="36"
			/>
			<div v-if="!isEdit" class="col-1 text-center">
				<BtnBase
					flat
					round
					icon="fas fa-retweet"
					:color="showInterval ? 'secondary' : 'grey'"
					data-cy="btn-repeat"
					@click="changeInterval"
				/>
			</div>

			<div v-if="showInterval && !isEdit" class="col-12">
				<div class="row">
					<div class="col-12 col-md-6">
						<FormInputNumeric
							v-model.number="state.start"
							label="start"
							:hint="$t('startNumberNote')"
							:max-valid="10000"
							icon="fas fa-arrow-down-1-9"
							numeric-valid="integer"
						/>
					</div>
					<div class="col-12 col-md-6">
						<FormInputNumeric
							v-model.number="state.repeat"
							label="numberHives"
							:hint="sampleName"
							shadow-text="x"
							icon="fas fa-infinity"
							:max-valid="100"
							numeric-valid="integer"
						/>
					</div>
				</div>
			</div>
		</div>

		<div v-if="!isEdit" class="row q-pb-md">
			<div class="col-12 col-md-6">
				<FormDropdownOption
					v-model="state.apiary"
					label="apiary"
					table="apiary"
					table-id="apiary_id"
				/>
			</div>
			<div class="col-12 col-md-6">
				<FormInputDate
					v-model="state.date"
					label="movedate"
					:hint="$t('movementInfo')"
				/>
			</div>
		</div>

		<FormDropdownOption
			v-model="state.type"
			table="hive_types"
			label="type"
			:values="values"
			:reset="reset"
		/>
		<div class="col-12 q-pb-sm">
			<FormDropdownOption
				v-model="state.source"
				table="hive_sources"
				table-id="source_id"
				label="status"
				:values="values"
				:reset="reset"
			/>
		</div>

		<div class="col-12 col-md-6 q-pt-sm q-pb-sm">
			<FormInputNumeric
				v-model="state.position"
				label="position"
				:hint="$t('positionNote')"
				icon="fas fa-arrow-down-1-9"
				numeric-valid="integer"
				:values="values"
				:reset="reset"
				:max-valid="9999"
			/>
		</div>
		<div class="col-12 col-md-6 q-pt-sm q-pb-sm">
			<FormInputNumeric
				v-model="state.grouphive"
				label="grouphive"
				:hint="$t('grouphiveNote')"
				icon="fas fa-city"
				numeric-valid="integer"
				:values="values"
				:reset="reset"
				:max-valid="9999"
			/>
		</div>

		<FormInputNote
			v-model="state.note"
			class="q-pt-sm"
			:values="values"
			:reset="reset"
		/>
		<div class="row q-pt-sm q-pb-md">
			<div class="col-12 col-md-6">
				<TooltipBase>{{ $t('hiveModeTooltip') }}</TooltipBase>
				<FormInputCheckbox
					v-model="state.modus"
					label="modus"
					status-active="active"
					status-inactive="inactive"
					:values="values"
					:reset="reset"
				/>
			</div>
			<div class="col-12 col-md-6">
				<FormInputDate
					v-show="!state.modus"
					v-model="state.modusDate"
					:values="values"
					:reset="reset"
					label="modusDate"
					table-id="modus_date"
				/>
			</div>
		</div>
	</q-form>

	<FormButtons
		:state="state"
		:is-edit="isEdit"
		:edit-ids="editOptions"
		:v="v"
		form="hive"
		@reset="onReset"
		@change="onChange"
	/>
</template>
