<template>
  <btn-base icon="fab fa-stripe" color="secondary" class="full-width q-pl-lg" size="lg"
    :label="$t('membership.payWithStripe')" @click="createSession">
  </btn-base>
</template>

<script setup lang="ts">
import BtnBase from './BtnBase.vue';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import { useRoute } from 'vue-router';
import { onMounted, toRefs } from 'vue';

const notification = useNotification();
const api = useApiFetch();
const router = useRoute();
const emit = defineEmits(['onPaid']);
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

function createSession () {
  api
    .post('/v1/service/stripe/orders', {
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

onMounted(() => {
  if (router.query.session_id) emit('onPaid', { paid: false });
});
</script>
