<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import FormInputText from './FormInputText.vue';

const props = defineProps({
	modelValue: {
		default: '',
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
const { modelValue } = useVModels(props, emit);
</script>

<template>
	<FormInputText
		v-model="modelValue"
		label="note"
		type="textarea"
		:max-valid="2000"
		icon="fas fa-align-left"
		:reset="reset"
		:values="values"
	/>
</template>
