<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useNFC } from '../composables/useNFC';
import DialogShare from './DialogShare.vue';
import TooltipBase from './TooltipBase.vue';

defineProps({
	showPath: {
		default: true,
	},
});
const $q = useQuasar();
const router = useRouter();
const nfc = useNFC();

function onShare() {
	$q.dialog({
		component: DialogShare,
		componentProps: {
			url: window.location.href,
		},
	});
}
</script>

<template>
	<q-btn
		v-if="nfc.isSupported"
		flat
		class="q-mr-xs"
		:color="nfc.state.reading ? 'green' : 'grey'"
		icon="fab fa-nfc-symbol"
		aria-label="NFC"
		@click="nfc.state.reading ? nfc.abort() : nfc.read()"
	>
		<TooltipBase>NFC</TooltipBase>
	</q-btn>
	<div
		v-if="showPath"
		style="cursor: pointer"
		data-cy="btn-share"
		:aria-label="$t('share')"
		@click="onShare"
	>
		<span v-if="$q.platform.is.mobile">
			{{ $t('share') }}
		</span>
		<span v-else>
			{{ $t('path') }}: {{ router.currentRoute.value.fullPath }}
		</span>
	</div>
</template>
