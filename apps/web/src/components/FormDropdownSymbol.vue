<script setup lang="ts">
import type { PropType } from 'vue';
import { useVModels } from '@vueuse/core';
import { filter, isEmpty } from 'lodash-es';
import { computed, ref, toRefs, watch } from 'vue';
import { formCheckMultipleValues } from '../helpers';

const props = defineProps({
	modelValue: {
		type: String as PropType<string | undefined | null>,
		default: 'venus',
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

const OPTIONS = [
	'venus',
	'chess-queen',
	'crown',
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
];

const { modelValue } = useVModels(props, emit);
const { values, reset } = toRefs(props);
const multipleValues = computed(() =>
	formCheckMultipleValues(values.value, 'symbol'),
);
const disable = ref(multipleValues.value);

watch(
	[values, reset],
	() => {
		setValues();
	},
	{
		immediate: true,
	},
);

function setValues() {
	disable.value = multipleValues.value;
	if (values.value && !isEmpty(values.value)) {
		setOptions(values.value[0].symbol);
	}
	else if (modelValue.value && typeof modelValue.value !== 'object') {
		setOptions(modelValue.value);
	}
	else {
		setOptions();
	}
}

function setOptions(id = '') {
	if (multipleValues.value) {
		editValues(true);
	}
	else if (id === '') {
		modelValue.value = OPTIONS[0] as string;
	}
	else {
		const res = filter(OPTIONS, (obj) => {
			return obj === id;
		});
		modelValue.value = res[0] as string;
	}
}

function editValues(val: boolean) {
	disable.value = val;
	modelValue.value = disable.value ? null : modelValue.value;
}
</script>

<template>
	<q-icon v-if="disable" name="fas fa-venus" />
	<q-icon
		v-else
		:name="`fas fa-${modelValue}`"
		color="pink"
		:style="disable ? '' : 'cursor: pointer'"
	/>
	<q-menu v-if="!disable">
		<q-list v-for="(option, index) in OPTIONS" :key="index">
			<q-item v-close-popup clickable @click="modelValue = option">
				<q-item-section>
					<q-icon :name="`fas fa-${option}`" size="md" />
				</q-item-section>
			</q-item>
		</q-list>
	</q-menu>
</template>
