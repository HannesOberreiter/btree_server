<script setup lang="ts">
import type { PropType } from 'vue';
import type { Task } from '../types';
import useVuelidate from '@vuelidate/core';
import dayjs from 'dayjs';
import { flatten, map, merge } from 'lodash-es';
import { computed, ref, unref } from 'vue';
import { useRouter } from 'vue-router';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import { useFieldsettingStore } from '../stores/fieldsetting';
import FormButtons from './FormButtons.vue';
import FormCheckupFrames from './FormCheckupFrames.vue';
import FormCheckupQueen from './FormCheckupQueen.vue';
import FormCheckupRating from './FormCheckupRating.vue';
import FormCheckupTemperature from './FormCheckupTemperature.vue';
import FormCheckupVarroa from './FormCheckupVarroa.vue';
import FormCheckupWeight from './FormCheckupWeight.vue';
import FormDropdownEdit from './FormDropdownEdit.vue';
import FormDropdownHive from './FormDropdownHive.vue';
import FormDropdownOption from './FormDropdownOption.vue';
import FormInputAmount from './FormInputAmount.vue';
import FormInputCheckbox from './FormInputCheckbox.vue';
import FormInputDates from './FormInputDates.vue';
import FormInputNote from './FormInputNote.vue';

import FormInputNumeric from './FormInputNumeric.vue';
import FormInputText from './FormInputText.vue';
import FormInputUrl from './FormInputUrl.vue';

const props = defineProps({
	task: {
		type: String as PropType<Task>,
		required: true,
	},
	ids: {
		type: Array as PropType<any[] | null>,
		default: null,
	},
});

const emit = defineEmits(['onSuccess']);

const stateDefault = {
	date: dayjs().format('YYYY-MM-DD'),
	enddate: dayjs().format('YYYY-MM-DD'),
	interval: 0,
	repeat: 0,
	amount: 0,
	amount_type: 'single',
	amount_calc: 0,
	url: '',
	note: '',
	done: true,

	checkup_queen: [] as any,
	checkup_rating: {
		brood: 0,
		pollen: 0,
		comb: 0,
		temper: 0,
		calm_comb: 0,
		swarm: 0,
	},
	checkup_frames: {
		broodframes: 0,
		honeyframes: 0,
		foundation: 0,
		emptyframes: 0,
	},
	checkup_varroa: 0,
	checkup_strong: 0,
	checkup_weight_amount: 0,
	checkup_weight_time: dayjs().format('HH:mm'),
	checkup_temperature: 0,

	harvest_frames: 0,
	harvest_amount_type: 'single',
	harvest_amount_calc: 0,
	harvest_water: 0,
	harvest_charge: '',

	treatment_wait: 0,
	treatment_temperature: 0,
};

const fields = useFieldsettingStore();
const notification = useNotification();

const v = useVuelidate();
const api = useApiFetch();
const router = useRouter();
const values = ref({});
const reset = ref(0);
const formEvent = ref<string>('');

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
if (!isEdit.value && router.currentRoute.value.name === 'edit-quicktool')
	router.push({ name: 'new-quicktool' });

const editOptions = ref([]) as any;
const editOptionsCopy = ref([]) as any;

const state = ref({
	hive: [] as any,
	type: null as any,
	treatment_disease: null as any,
	treatment_vet: null as any,
	...stateDefault,
});

async function getEdit(id: any[] | null) {
	if (!id)
		return;
	return await api.post(`/v1/${props.task}/batchGet`, { ids: id }).then(
		(response: any) => {
			const editIds = map(response, (row: any) => [
				{ value: row.id, label: `ID: ${row.id} / (${row.hive.name})` },
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
		state.value.checkup_queen = []; // merge seems to not clear the array so we manually reset it here
	}
	reset.value++;
	notification.open('positive', 'successReset');
}

function onChange(type: 'update' | 'insert' = 'update') {
	formEvent.value = type;
	emit('onSuccess', true);
}
</script>

<template>
	<q-form data-cy="form-quicktool" class="full-width" @submit.prevent.stop="">
		<FormDropdownEdit
			v-if="isEdit"
			v-model="editOptions"
			:options="editOptionsCopy"
		/>
		<FormDropdownHive
			v-else
			v-model="state.hive"
			:form-event="formEvent"
		/>

		<div class="q-pt-xs">
			<FormInputDates
				v-model:start-value="state.date"
				v-model:end-value="state.enddate"
				v-model:model-interval="state.interval"
				v-model:model-repeat="state.repeat"
				:values="values"
				:reset="reset"
			/>
		</div>
		<div class="q-mb-sm">
			<!-- Main Dropdowns -->
			<div v-if="task === 'checkup'">
				<FormDropdownOption
					v-if="task === 'checkup'"
					v-model="state.type"
					:values="values"
					:reset="reset"
					table="checkup_types"
				/>
			</div>
			<div v-else-if="task === 'harvest'" class="row">
				<div class="col-12 q-pb-sm">
					<FormDropdownOption
						v-model="state.type"
						:values="values"
						:reset="reset"
						table="harvest_types"
					/>
				</div>
			</div>
			<div v-else-if="task === 'treatment'" class="row">
				<div class="col-12 q-pb-sm">
					<FormDropdownOption
						v-model="state.type"
						:values="values"
						:reset="reset"
						table="treatment_types"
					/>
				</div>
				<div class="col-12 q-pb-sm">
					<FormDropdownOption
						v-model="state.treatment_disease"
						:values="values"
						:reset="reset"
						table="treatment_diseases"
						label="disease"
						table-id="disease_id"
					/>
				</div>
			</div>
			<div v-else-if="task === 'feed'" class="row">
				<div class="col-12 q-pb-sm">
					<FormDropdownOption
						v-model="state.type"
						:values="values"
						:reset="reset"
						table="feed_types"
					/>
				</div>
			</div>
			<!-- Main Amount Field -->
			<div v-if="task !== 'checkup'" class="row">
				<div class="col-12 col-md-7 q-pt-sm">
					<FormInputAmount
						v-model="state.amount"
						v-model:model-type="state.amount_type"
						v-model:model-calc="state.amount_calc"
						:hive-count="state.hive.length"
						:reset="reset"
						:values="values"
					/>
				</div>
			</div>
			<!-- Additional optional fields -->
			<div v-if="task === 'checkup'">
				<FormCheckupQueen
					v-if="fields.settings.checkup.queen || fields.someCheckboxTrue"
					v-model="state.checkup_queen"
					:values="values"
					:reset="reset"
				/>
				<FormCheckupRating
					v-if="fields.settings.checkup.rating || fields.someRatingTrue"
					v-model="state.checkup_rating"
					:reset="reset"
					:values="values"
				/>
				<FormCheckupFrames
					v-if="fields.settings.checkup.frames || fields.someFrameTrue"
					v-model="state.checkup_frames"
					:values="values"
					:reset="reset"
				/>
				<div class="row q-pt-sm q-pb-sm">
					<div class="col-12 col-md-7">
						<FormCheckupVarroa
							v-if="fields.settings.checkup.varroa"
							v-model="state.checkup_varroa"
							:reset="reset"
							:values="values"
							:hive="state.hive"
						/>
					</div>
				</div>
				<div
					v-if="fields.settings.checkup.strength"
					class="row q-pt-sm q-pb-sm"
				>
					<div class="col-12 col-md-6">
						<FormInputNumeric
							v-model="state.checkup_strong"
							:values="values"
							:reset="reset"
							label="strong"
							icon="fas fa-dumbbell"
						/>
					</div>
				</div>
				<div v-if="fields.settings.checkup.weight" class="q-pt-sm q-pb-sm">
					<FormCheckupWeight
						v-model="state.checkup_weight_amount"
						v-model:model-time="state.checkup_weight_time"
						:reset="reset"
						:values="values"
					/>
				</div>
				<div
					v-if="fields.settings.checkup.temperature"
					class="row q-pt-sm q-pb-sm"
				>
					<div class="col-12 col-md-7">
						<FormCheckupTemperature
							v-model="state.checkup_temperature"
							:hive="state.hive"
							:reset="reset"
							:values="values"
						/>
					</div>
				</div>
			</div>
			<div v-else-if="task === 'harvest'">
				<div v-if="fields.settings.harvest.frames" class="row">
					<div class="col-12 col-md-7">
						<FormInputAmount
							v-model="state.harvest_frames"
							v-model:model-type="state.harvest_amount_type"
							v-model:model-calc="state.harvest_amount_calc"
							:reset="reset"
							:values="values"
							:hive-count="state.hive.length"
							label="frame"
							table-id="frames"
						/>
					</div>
				</div>
				<div v-if="fields.settings.harvest.water" class="row">
					<div class="col-12 col-md-6">
						<FormInputNumeric
							v-model="state.harvest_water"
							:values="values"
							:reset="reset"
							label="water"
							icon="fas fa-droplet"
							shadow-text="%"
						/>
					</div>
				</div>
				<div class="row">
					<div class="col-12 col-md-6">
						<FormInputText
							v-model="state.harvest_charge"
							label="charge"
							icon="fas fa-receipt"
							:values="values"
							:reset="reset"
						/>
					</div>
				</div>
			</div>
			<div v-else-if="task === 'treatment'" class="row">
				<div v-if="fields.settings.treatment.vet" class="col-12 q-pb-sm">
					<FormDropdownOption
						v-model="state.treatment_vet"
						:values="values"
						:reset="reset"
						table-id="vet_id"
						table="treatment_vets"
						label="vet"
					/>
				</div>
				<div v-if="fields.settings.treatment.wait" class="col-12 col-md-6">
					<FormInputNumeric
						v-model="state.treatment_wait"
						:values="values"
						:reset="reset"
						label="waitTime"
						:shadow-text="$t('day', 2)"
						icon="fas fa-circle-pause"
						:max-valid="365"
					/>
				</div>
				<div
					v-if="fields.settings.treatment.temperature"
					class="col-12 col-md-7"
				>
					<FormCheckupTemperature
						v-model="state.treatment_temperature"
						:hive="state.hive"
						:reset="reset"
						:values="values"
					/>
				</div>
			</div>
		</div>
		<FormInputUrl
			v-model="state.url"
			:values="values"
			:reset="reset"
		/>
		<FormInputNote
			v-model="state.note"
			:values="values"
			:reset="reset"
		/>
		<FormInputCheckbox
			v-model="state.done"
			:values="values"
			:reset="reset"
		/>
	</q-form>

	<FormButtons
		:state="state"
		:is-edit="isEdit"
		:edit-ids="editOptions"
		:v="v"
		:form="props.task"
		@reset="onReset"
		@change="(val: 'update' | 'insert') => onChange(val)"
	/>
</template>
