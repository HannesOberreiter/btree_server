<!-- https://github.com/paypal-examples/docs-examples/tree/main/standard-integration -->
<template>
  <div id="paypal_buttons"></div>
</template>

<script setup lang="ts">
import { loadScript, PayPalNamespace } from '@paypal/paypal-js';
import { useApiFetch } from '~/composables/useApi';
import { useNotification } from '~/composables/useNotification';
import { useAuthUserStore } from '~/stores/auth';
import { onMounted, toRefs } from 'vue';

const storeUser = useAuthUserStore();
const notification = useNotification();
let paypal: PayPalNamespace;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const ENV = process.env.NODE_ENV;

const api = useApiFetch();

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

try {
  paypal = await loadScript({
    clientId: PAYPAL_CLIENT_ID,
    currency: 'EUR',
    disableFunding: 'paylater',
    dataUserIdToken: storeUser.company.id + '',
  });
} catch (error) {
  console.error('failed to load the PayPal JS SDK script', error);
}

onMounted(async () => {
  if (paypal) {
    try {
      await paypal
        .Buttons({
          // Sets up the transaction when a payment button is clicked
          createOrder: (_data, _actions) => {
            return api
              .post('/v1/service/paypal/orders', {
                amount: donation.value,
                quantity: years.value,
              })
              .then(
                (order) => order.id,
                (error) => notification.open('negative', error),
              );
          },
          // Finalize the transaction after payer approval
          onApprove: (data, _actions) => {
            return api
              .post(`/v1/service/paypal/orders/${data.orderID}/capture`, {})
              .then(
                (orderData) => {
                  if (ENV === 'development') {
                    console.log(
                      'Capture result',
                      orderData,
                      JSON.stringify(orderData, null, 2),
                    );
                  }
                  emit('onPaid', orderData);
                },
                (error) => {
                  notification.open('negative', error);
                },
              );
          },
        })
        .render('#paypal_buttons');
    } catch (error) {
      console.error('failed to render the PayPal Buttons', error);
    }
  }
});
</script>
