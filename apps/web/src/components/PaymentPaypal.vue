<template>
  <div id="paypal_buttons"></div>
</template>

<script setup lang="ts">
import { loadScript, PayPalNamespace } from '@paypal/paypal-js';
import { useAuthUserStore } from '~/stores/auth';

const storeUser = useAuthUserStore();
let paypal: PayPalNamespace;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;

const props = defineProps({
  donation: {
    type: Number,
    required: true,
  },
});

const donation = toRef(props, 'donation');

try {
  paypal = await loadScript({
    'client-id': PAYPAL_CLIENT_ID,
    currency: 'EUR',
    'data-user-id-token': storeUser.company.id + '',
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
          createOrder: (data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  reference_id: storeUser.company.id + '',
                  amount: {
                    value: donation.value + '', // Can also reference a variable or function
                  },
                },
              ],
            });
          },
          // Finalize the transaction after payer approval
          onApprove: (data, actions) => {
            return actions.order.capture().then(function (orderData) {
              // Successful capture! For dev/demo purposes:
              console.log(
                'Capture result',
                orderData,
                JSON.stringify(orderData, null, 2)
              );
              const transaction =
                orderData.purchase_units[0].payments.captures[0];
              alert(
                `Transaction ${transaction.status}: ${transaction.id}\n\nSee console for all available details`
              );
              // When ready to go live, remove the alert and show a success message within this page. For example:
              // const element = document.getElementById('paypal-button-container');
              // element.innerHTML = '<h3>Thank you for your payment!</h3>';
              // Or go to another URL:  actions.redirect('thank_you.html');
            });
          },
        })
        .render('#paypal_buttons');
    } catch (error) {
      console.error('failed to render the PayPal Buttons', error);
    }
  }
});
</script>
