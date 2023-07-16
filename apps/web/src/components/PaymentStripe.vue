<template>
  <btn-base
    icon="fab fa-stripe"
    color="secondary"
    class="full-width q-pl-lg"
    size="lg"
    :label="$t('membership.payWithStripe')"
    @click="createSession"
  >
  </btn-base>
</template>

<script setup lang="ts">
import { useApiFetch } from '~/composables/useApi';
import { useNotification } from '~/composables/useNotification';

import { useRoute } from 'vue-router';
import { toRef, onMounted } from 'vue';

const notification = useNotification();
const api = useApiFetch();
const router = useRoute();
const emit = defineEmits(['onPaid']);
const props = defineProps({
  donation: {
    type: Number,
    required: true,
  },
});
const donation = toRef(props, 'donation');

function createSession() {
  api.post('/v1/service/stripe/orders', { amount: donation.value }).then(
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
