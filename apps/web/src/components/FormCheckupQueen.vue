<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import { isEmpty } from 'lodash-es';
import { useQuasar } from 'quasar';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { formCheckMultipleValues } from '../helpers';
import { useFieldsettingStore } from '../stores/fieldsetting';
import BtnMultipleValues from './BtnMultipleValues.vue';

const props = defineProps({
	modelValue: {
		type: Array,
		default: () => [],
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
const fields = useFieldsettingStore();
const $q = useQuasar();
const { t } = useI18n();
const { modelValue } = useVModels(props, emit);
const resetValue = unref(modelValue.value);
const { values, reset } = toRefs(props);
const multipleValues = computed(
	() =>
		formCheckMultipleValues(values.value, 'queen')
		|| formCheckMultipleValues(values.value, 'queencells')
		|| formCheckMultipleValues(values.value, 'capped_brood')
		|| formCheckMultipleValues(values.value, 'eggs'),
);
const disable = ref(multipleValues.value);

const checkboxes = [
	{ label: t('queen'), value: 'queen', trueValue: true },
	{ label: t('queencell', 2), value: 'queencells', trueValue: true },
	{ label: t('egg', 2), value: 'eggs', trueValue: true },
	{ label: t('cappedBrood'), value: 'capped_brood', trueValue: true },
];

const options = computed(() => {
	return checkboxes.filter(
		checkbox =>
			fields.settings.checkup.checkboxes[
				checkbox.value as keyof typeof fields.settings.checkup.checkboxes
			],
	);
});

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
		const original = [];
		for (const option of options.value) {
			if (values.value[0][option.value] === true)
				original.push(option.value);
		}
		modelValue.value = original;
	}
	else {
		modelValue.value = resetValue;
	}
}

function editValues(val: boolean) {
	disable.value = val;
	modelValue.value = disable.value ? [null] : resetValue;
}
</script>

<template>
	<div
		class="row q-field--labeled"
		:class="$q.dark.isActive ? 'q-field--dark' : 'q-field'"
	>
		<div
			class="q-field__before q-field__marginal items-center"
			:class="$q.screen.gt.sm ? '' : 'col-1'"
		>
			<q-icon v-if="!multipleValues" name="fas fa-venus" />
			<BtnMultipleValues
				v-else
				:disable="disable"
				@click="editValues(!disable)"
			/>
		</div>
		<div :class="$q.screen.gt.sm ? '' : 'col-11'">
			<q-option-group
				v-model="modelValue"
				:options="options"
				:disable="disable"
				type="checkbox"
				color="primary"
				name="queen"
				inline
			/>
		</div>
	</div>
</template>
