<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useRouterStore } from '../stores/router';
import BtnBase from './BtnBase.vue';
import TooltipBase from './TooltipBase.vue';

const router = useRouter();
const storeRouter = useRouterStore();
</script>

<template>
	<BtnBase
		v-close-popup
		:disable="!storeRouter.isPrevious"
		flat
		dense
		data-cy="btn-return"
		color="white"
		size="md"
		icon="fas fa-backward-step"
		:aria-label="$t('previousPage')"
		@click="
			router.replace({
				name: storeRouter.$state.previous as any,
				params: storeRouter.$state.params as any,
			})
		"
	>
		<TooltipBase anchor="bottom middle" self="top middle">
			{{ $t('previousPage') }}
		</TooltipBase>
	</BtnBase>
</template>
