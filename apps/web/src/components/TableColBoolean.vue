<script setup lang="ts">
defineProps({
	value: {
		type: Boolean,
		default: false,
	},
});
</script>

<template>
	<q-td class="text-center">
		<div v-if="value">
			{{ $t('yes') }}
		</div>
	</q-td>
</template>
