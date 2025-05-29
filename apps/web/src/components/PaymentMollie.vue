<template>
  <btn-base
    icon="fas fa-building-columns"
    color="primary"
    class="full-width q-pl-lg"
    size="lg"
    :label="$t('payment.mollie')"
    @click="createSession"
  >
  </btn-base>
</template>

<script setup lang="ts">
import BtnBase from './BtnBase.vue';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import { toRefs } from 'vue';

const notification = useNotification();
const api = useApiFetch();
const props = defineProps({
  donation: {
    type: Number,
    required: true,
  },
  years: {
    type: Number,
    required: true,
    default: 1,
  },
});
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
      (error) => notification.open('negative', error),
    );
}
</script>
