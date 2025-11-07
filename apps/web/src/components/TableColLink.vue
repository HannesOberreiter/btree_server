<script setup lang="ts">
import type { PropType } from 'vue';
import { RouterLink } from 'vue-router';

type Link = 'hive' | 'apiary' | 'queen';

defineProps({
	id: {
		type: [Number, String],
		required: true,
	},
	label: {
		type: String,
		required: true,
	},
	link: {
		type: String as PropType<Link>,
		required: true,
	},
});
</script>

<template>
	<q-td>
		<RouterLink
			:to="{ name: `detail-${link}`, params: { id } }"
			class="text-bold"
			style="text-decoration: none; color: inherit"
		>
			{{ label }}
		</RouterLink>
	</q-td>
</template>
