<script setup lang="ts">
import type { PropType } from 'vue';
import useVuelidate from '@vuelidate/core';
import { useVModels } from '@vueuse/core';
import { isEmpty } from 'lodash-es';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { formCheckMultipleValues, validationErrors } from '../helpers';
import {
	decimal,
	integer,
	maxValue,
	minValue,
	numeric,
} from '../helpers/i18n-validators';
import BtnBase from './BtnBase.vue';
import BtnMultipleValues from './BtnMultipleValues.vue';

const props = defineProps({
	modelValue: {
		type: null as unknown as PropType<number | null>,
		validator: (v: any) => typeof v === 'number' || v === null,
		default: 0,
	},
	reset: {
		type: Number,
		default: 0,
	},
	values: {
		type: Object,
		default: null,
	},
	label: {
		type: String,
		required: true,
	},
	tableId: {
		type: String,
		default: null,
	},
	labelPlural: {
		type: Number,
		default: 1,
	},
	icon: {
		type: String,
		required: true,
	},
	maxValid: {
		default: 100,
	},
	minValid: {
		default: 0,
	},
	numericValid: {
		default: 'numeric',
	},
});
const emit = defineEmits(['update:modelValue']);
const { modelValue } = useVModels(props, emit);
const resetValue = unref(modelValue.value);
const { values, reset } = toRefs(props);
const multipleValues = computed(() => {
	return formCheckMultipleValues(values.value, props.tableId ?? props.label);
});
const disable = ref(multipleValues.value);

const state = {
	[props.label]: modelValue,
};
const rules = computed(() => {
	if (props.numericValid === 'numeric') {
		return {
			[props.label]: {
				minValue: minValue(props.minValid),
				maxValue: maxValue(props.maxValid),
				numeric,
			},
		};
	}
	else if (props.numericValid === 'decimal') {
		return {
			[props.label]: {
				minValue: minValue(props.minValid),
				maxValue: maxValue(props.maxValid),
				decimal,
			},
		};
	}
	else {
		return {
			[props.label]: {
				minValue: minValue(props.minValid),
				maxValue: maxValue(props.maxValid),
				integer,
			},
		};
	}
});
const v = useVuelidate(rules as any, state, { $autoDirty: true });

watch(values, () => {
	setValues();
});

watch(reset, () => {
	setValues();
});

function setValues() {
	disable.value = multipleValues.value;
	if (multipleValues.value) {
		editValues(true);
	}
	else if (values.value && !isEmpty(values.value)) {
		modelValue.value
			= values.value[0][props.tableId ? props.tableId : props.label];
	}
	else {
		modelValue.value = resetValue;
	}
}

function editValues(val: boolean) {
	disable.value = val;
	modelValue.value = disable.value ? null : modelValue.value;
}
</script>

<template>
	<q-input
		v-model.number="modelValue"
		:error="v[props.label].$error"
		:error-message="validationErrors(v[props.label])"
		:no-error-icon="true"
		:label="
			disable
				? `${$t(label, labelPlural)} - ${$t('multipleValues')}`
				: $t(label, labelPlural)
		"
		:disable="disable"
		:name="label"
		type="number"
		:min="minValid"
		:max="maxValid"
		filled
		@update:model-value="
			(val) => $emit('update:modelValue', val === '' ? 0 : val)
		"
	>
		<template v-if="icon !== ''" #before>
			<q-icon v-if="!multipleValues" :name="icon" />
			<BtnMultipleValues
				v-else
				:disable="disable"
				@click="editValues(!disable)"
			/>
		</template>
		<template #append>
			<BtnBase
				round
				flat
				dense
				icon="fas fa-plus"
				:disable="modelValue === null || modelValue >= maxValid"
				@click="
					() => {
						if (modelValue !== null) modelValue++;
					}
				"
			/>
			<BtnBase
				round
				flat
				dense
				icon="fas fa-minus"
				:disable="modelValue === null || modelValue <= minValid"
				@click="
					() => {
						if (modelValue !== null) modelValue--;
					}
				"
			/>
		</template>
		<template #after>
			<slot name="deepAfter" />
		</template>
	</q-input>
</template>
