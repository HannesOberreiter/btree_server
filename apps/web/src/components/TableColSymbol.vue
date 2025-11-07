<script setup lang="ts">
defineProps({
	value: {
		required: true,
	},
});
</script>

<template>
	<q-td class="text-center">
		<q-icon
			:name="value ? `fas fa-${value}` : 'fas fa-venus'"
			size="sm"
		/>
	</q-td>
</template>
