<script setup lang="ts">
import TooltipBase from './TooltipBase.vue';

defineProps({
	disable: {
		type: Boolean,
		default: false,
	},
});
</script>

<template>
	<q-icon
		name="fas fa-pen"
		:color="disable ? '' : 'secondary'"
		style="cursor: pointer"
	>
		<TooltipBase> {{ $t('multipleValuesText') }} </TooltipBase>
	</q-icon>
</template>
