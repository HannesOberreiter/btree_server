<script setup lang="ts">
import type { PropType } from 'vue';
import { useVModels } from '@vueuse/core';
import { isEmpty } from 'lodash-es';
import { useQuasar } from 'quasar';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { formCheckMultipleValues } from '../helpers';
import BtnMultipleValues from './BtnMultipleValues.vue';

const props = defineProps({
	modelValue: {
		type: String as PropType<string | null>,
		default: 'in',
	},
	label: {
		default: 'status',
	},
	falseValue: {
		type: String,
		default: 'out',
	},
	trueValue: {
		type: String,
		default: 'in',
	},
	statusActive: {
		default: 'open',
	},
	statusInactive: {
		default: 'done',
	},
	reset: {
		type: Number,
		default: 0,
	},
	values: {
		type: Object,
		default: null,
	},
});
const emit = defineEmits(['update:modelValue']);
const $q = useQuasar();
const { modelValue } = useVModels(props, emit);
const resetValue = unref(modelValue.value);
const { values, reset } = toRefs(props);
const multipleValues = computed(() =>
	formCheckMultipleValues(values.value, props.label),
);
const disable = ref(multipleValues.value);

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
			= values.value[0][props.label === 'status' ? 'done' : props.label];
	}
	else {
		modelValue.value = resetValue;
	}
}

function editValues(val: boolean) {
	disable.value = val;
	modelValue.value = disable.value ? null : modelValue.value;
}

defineExpose({ $q });
</script>

<template>
	<div class="row">
		<div class="col-8 col-md-5">
			<q-item v-ripple tag="label">
				<q-item-section>
					<q-item-label>
						<BtnMultipleValues
							v-if="multipleValues"
							:disable="disable"
							@click="editValues(!disable)"
						/>

						{{ $t(label) }}:
					</q-item-label>
				</q-item-section>
				<q-item-section>
					<q-toggle
						v-model="modelValue"
						:keep-color="true"
						color="primary"
						:false-value="falseValue"
						:true-value="trueValue"
						size="lg"
						:disable="disable"
						:label="
							modelValue === falseValue ? $t(statusInactive) : $t(statusActive)
						"
					/>
				</q-item-section>
			</q-item>
		</div>
	</div>
</template>
