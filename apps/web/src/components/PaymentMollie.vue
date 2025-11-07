<script setup lang="ts">
import { toRefs } from 'vue';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import BtnBase from './BtnBase.vue';

const props = defineProps({
	donation: {
		type: Number,
		required: true,
	},
	years: {
		type: Number,
		default: 1,
	},
});
const notification = useNotification();
const api = useApiFetch();
const { donation, years } = toRefs(props);

function createSession() {
	api
		.post('/v1/service/mollie/orders', {
			amount: donation.value,
			quantity: years.value,
		})
		.then(
			(session) => {
				window.location.href = session.url;
			},
			error => notification.open('negative', error),
		);
}
</script>

<template>
	<BtnBase
		icon="fas fa-building-columns"
		color="primary"
		class="full-width q-pl-lg"
		size="lg"
		:label="$t('payment.mollie')"
		@click="createSession"
	/>
</template>
