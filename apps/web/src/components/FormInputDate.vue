<script setup lang="ts">
import type { PropType } from 'vue';
import useVuelidate from '@vuelidate/core';
import { useVModels } from '@vueuse/core';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { isEmpty } from 'lodash-es';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDateFormat } from '../composables/useDate';
import { formCheckMultipleValues, validationErrors } from '../helpers';
import { requiredField } from '../helpers/i18n-validators';
import BtnBase from './BtnBase.vue';
import BtnDateAutoClose from './BtnDateAutoClose.vue';
import BtnMultipleValues from './BtnMultipleValues.vue';

const props = defineProps({
	dateFormat: {
		type: String,
		default: 'YYYY-MM-DD',
	},
	modelValue: {
		type: String as PropType<string | null>,
		default: dayjs().format('YYYY-MM-DD'),
	},
	mark: {
		type: String as PropType<string | null>,
		default: dayjs().format('YYYY-MM-DD'),
	},
	label: {
		type: String,
		default: 'date',
	},
	tableId: {
		type: String as PropType<string | null>,
		default: null,
	},
	reset: {
		type: Number,
		default: 0,
	},
	values: {
		type: Object,
		default: null,
	},
	icon: {
		type: String,
		default: 'fas fa-calendar',
	},
	required: {
		type: Boolean,
		default: false,
	},
});
const emit = defineEmits(['update:modelValue']);
dayjs.extend(customParseFormat); // Needed to validate if date is even possible
const { t } = useI18n();
const qDateProxy = ref(false);
const autoClose = ref(false);
const date = useDateFormat();

const { modelValue } = useVModels(props, emit);
const resetValue = unref(modelValue.value);
const { values, reset, dateFormat } = toRefs(props);
const multipleValues = computed(() =>
	formCheckMultipleValues(
		values.value,
		props.tableId ? props.tableId : props.label,
	),
);
const disable = ref(multipleValues.value);

const state = {
	[props.label]: modelValue,
};

const rules = computed(() => {
	if (props.required) {
		return {
			[props.label]: {
				required: requiredField(t(props.label)),
				minValue: (value: string) => {
					return dayjs(value, props.dateFormat, true).isValid();
				},
			},
		};
	}
	else {
		return {
			[props.label]: {
				minValue: (value: string) => {
					return !value || dayjs(value, props.dateFormat, true).isValid();
				},
			},
		};
	}
});

const v = useVuelidate(rules, state, { $autoDirty: true });

const maskFormat = computed(() => {
	if (!modelValue.value)
		return '';
	switch (dateFormat.value) {
		case 'YYYY-MM-DD':
			return date.displayFormat(modelValue.value, 'date');
		case 'YYYY-MM-DD HH:mm':
			return date.displayFormat(modelValue.value, 'date-time');
		case 'YYYY-MM-DD HH:mm:ss':
			return date.displayFormat(modelValue.value, 'date-time-seconds');
		default:
			return date.formats.value.date;
	}
});

watch([reset, values], () => {
	setValues();
});

function setValues() {
	disable.value = multipleValues.value;

	if (multipleValues.value) {
		editValues(true);
	}
	else if (values.value && !isEmpty(values.value)) {
		modelValue.value = dayjs(
			values.value[0][props.tableId ? props.tableId : props.label],
		).format(props.dateFormat);
	}
	else {
		modelValue.value = resetValue;
	}
}

function editValues(val: boolean) {
	disable.value = val;
	modelValue.value = disable.value
		? null
		: (modelValue.value ?? dayjs().format('YYYY-MM-DD'));
}
function markDate(date: string) {
	return dayjs(date).isSame(props.mark);
}
</script>

<template>
	<q-input
		v-model="maskFormat"
		:error="v[props.label].$error"
		:error-messages="validationErrors(v[props.label])"
		:label="disable ? $t('multipleValues') : $t(label)"
		input-class="text-center"
		type="text"
		:disable="disable"
		readonly
		filled
		no-error-icon
		@click="qDateProxy = !qDateProxy"
	>
		<template #before>
			<BtnMultipleValues
				v-if="multipleValues"
				:disable="disable"
				@click="editValues(!disable)"
			/>
			<q-icon :name="icon" class="cursor-pointer">
				<q-popup-proxy
					v-model="qDateProxy"
					:cover="true"
					transition-show="scale"
					transition-hide="scale"
				>
					<div class="row wrap justify-start items-center content-center">
						<div class="col">
							<q-date
								v-model="modelValue"
								:events="markDate"
								:mask="dateFormat"
								:disable="disable"
								:cover="true"
								today-btn
								no-unset
								:flat="true"
								@update:model-value="() => (qDateProxy = !autoClose)"
							>
								<div class="row items-center justify-end">
									<BtnDateAutoClose
										@change="(v: boolean) => (autoClose = v)"
									/>
									<BtnBase
										v-close-popup
										:label="$t('close')"
										color="primary"
										flat
									/>
								</div>
							</q-date>
						</div>
						<div class="col">
							<q-time
								v-if="
									dateFormat === 'YYYY-MM-DD HH:mm:ss'
										|| dateFormat === 'YYYY-MM-DD HH:mm'
								"
								v-model="modelValue"
								:mask="dateFormat"
								:with-seconds="
									dateFormat === 'YYYY-MM-DD HH:mm:ss' ? true : false
								"
								:format24h="true"
								color="purple"
								:flat="true"
							/>
						</div>
					</div>
				</q-popup-proxy>
			</q-icon>
		</template>
		<template #after>
			<slot name="deepAfter" />
		</template>
	</q-input>
</template>
