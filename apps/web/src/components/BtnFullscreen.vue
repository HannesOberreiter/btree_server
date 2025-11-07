<script setup lang="ts">
import { useFullscreen } from '@vueuse/core';
import BtnBase from './BtnBase.vue';
import TooltipBase from './TooltipBase.vue';

const { isSupported, isFullscreen, toggle } = useFullscreen();
</script>

<template>
	<BtnBase
		v-if="isSupported"
		flat
		dense
		color="white"
		size="md"
		data-cy="btn-fullscreen"
		:icon="isFullscreen ? 'fas fa-compress' : 'fas fa-expand'"
		:aria-label="$t('fullscreen')"
		@click="toggle()"
	>
		<TooltipBase anchor="bottom middle" self="top middle">
			{{ $t('fullscreen') }}
		</TooltipBase>
	</BtnBase>
</template>
