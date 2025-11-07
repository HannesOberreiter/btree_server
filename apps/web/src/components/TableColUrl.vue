<script setup lang="ts">
import { useQuasar } from 'quasar';
import DialogFileShow from './DialogFileShow.vue';

defineProps({
	value: {
		required: true,
	},
});

const $q = useQuasar();

function showFile(value: string) {
	if (value && value !== '') {
		$q.dialog({
			component: DialogFileShow,
			componentProps: {
				value,
			},
		});
	}
}
</script>

<template>
	<q-td>
		<div
			v-if="value"
			style="cursor: pointer"
			@click="showFile(value as string)"
		>
			{{ value }}
		</div>
	</q-td>
</template>
