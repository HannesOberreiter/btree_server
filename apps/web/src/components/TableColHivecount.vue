<script setup lang="ts">
import TooltipBase from './TooltipBase.vue';

defineProps({
	hivecount: {
		type: Object,
		default: null,
	},
});
</script>

<template>
	<q-td v-if="hivecount">
		{{ hivecount.count }}

		<span v-if="hivecount.grouphivescount > 0">
			[{{ hivecount.grouphivescount }}]
			<TooltipBase>
				{{ $t('hivecountTooltip') }}
			</TooltipBase>
		</span>
	</q-td>
	<q-td v-else />
</template>
