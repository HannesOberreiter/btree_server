<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useScanner } from '../composables/useScanner';
import DialogQrScanner from './DialogQrScanner.vue';
import TooltipBase from './TooltipBase.vue';

const $q = useQuasar();
const { isAvailable } = useScanner();

function onClick() {
	$q.dialog({
		component: DialogQrScanner,
	});
}
</script>

<template>
	<q-btn
		v-if="isAvailable"
		flat
		dense
		size="md"
		class="q-mr-xs"
		icon="fas fa-qrcode"
		:aria-label="$t('qrScanner')"
		@click="onClick"
	>
		<TooltipBase anchor="bottom middle" self="top middle">
			{{ $t('qrScanner') }} (s)
		</TooltipBase>
	</q-btn>
</template>
