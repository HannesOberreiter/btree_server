<template>
  <q-card>
    <q-card-section>
      <div class="row q-pa-sm justify-center">
        <div class="col-12 col-sm-10 col-md-8">
          <div class="text-h5 q-pb-sm text-center">
            {{ $t('membership.title') }}
          </div>
          <div
            v-if="paid"
            class="bg-info text-weight-bold text-black q-pa-sm text-justify rounded-borders"
          >
            {{ $t('membership.thankYou') }}
          </div>
          <ul>
            <li>
              {{ $t('membership.currentStatus') }}: <b>{{ getPaidStatus }}</b>
            </li>
            <li>
              {{ $t('membership.afterPayment') }}: <b>{{ afterPayment }}</b>
            </li>
          </ul>
          <q-slider
            v-model="donation"
            color="green"
            :min="50"
            :max="150"
            :step="10"
            markers
            :marker-labels="donationMarker"
            :label-value="donationLabel"
            switch-label-side
            switch-marker-labels-side
          >
          </q-slider>
          <div class="row justify-center">
            <div class="col-12">
              <q-input
                v-model.number="donation"
                class="text-h3"
                filled
                min="50"
                step="1"
                type="number"
                :rules="[
                  (val) =>
                    parseInt(val) >= 50 || $t('membership.minimumAmount'),
                ]"
                :hint="$t('membership.noSubscription')"
              >
                <template #prepend>
                  <q-icon
                    v-if="donation < 80"
                    name="fas fa-face-smile"
                    size="lg"
                    color="primary"
                  ></q-icon>
                  <q-icon
                    v-else-if="donation < 120"
                    name="fas fa-face-grin"
                    size="lg"
                    color="primary"
                  ></q-icon>
                  <q-icon
                    v-else
                    name="fas fa-face-grin-hearts"
                    size="lg"
                    color="primary"
                  ></q-icon>
                </template>
                <template #append>€ {{ $t('membership.forOneYear') }}</template>
              </q-input>
            </div>
          </div>
          <div class="q-gutter-sm text-center q-pt-lg">
            <suspense>
              <payment-paypal
                :donation="donation"
                @on-paid="(data: any) => successPayment(data.paid)"
              ></payment-paypal>
            </suspense>
            <q-separator></q-separator>
            <div
              v-if="!($q.platform.is.ios && $q.platform.is.safari)"
              class="row"
            >
              <payment-stripe
                :donation="donation"
                @on-paid="(data: any) => successPayment(data.paid)"
              ></payment-stripe>
            </div>

            <btn-base
              label="office@btree.at"
              icon="fas fa-envelope"
              color="info"
              :href="mailTo"
            >
            </btn-base>
            <btn-base
              icon="fas fa-ticket"
              color="info"
              :label="$t('coupon')"
              @click="payCoupon"
            ></btn-base>
          </div>
        </div>
      </div>
    </q-card-section>
    <q-card-section>
      <div class="row q-pa-sm justify-center">
        <div class="col-12 col-sm-10 col-md-8">
          <div class="text-h5 q-pb-sm text-center">
            {{ $t('membership.perks') }}
          </div>
          <ul class="text-subtitle1">
            <li>
              {{ $t('membership.perksHives') }}
            </li>
            <li>
              {{ $t('membership.perksApiaries') }}
            </li>
            <li>
              {{ $t('membership.perksAPI') }}
            </li>
            <li>
              {{ $t('membership.perksTemperature') }}
            </li>
            <li>
              {{ $t('membership.perksStats') }}
            </li>
            <li>
              {{ $t('membership.perksSupport') }}
            </li>
          </ul>
          <div class="text-caption">
            {{ $t('membership.afterPremium') }}
          </div>
          <div class="text-bold q-pt-sm">
            Cheers<br />
            Hannes Oberreiter <br />
            <ul>
              <li>Pastime forestry and apiculture</li>
              <li>Spare time programmer</li>
              <li>Hobby biologist</li>
            </ul>
          </div>
        </div>
      </div>
    </q-card-section>
    <q-card-section>
      <supporter-images></supporter-images>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { useQuasar } from 'quasar';
import { useApiFetch } from '~/composables/useApi';
import { useDateFormat } from '~/composables/useDate';
import { useNotification } from '~/composables/useNotification';
import { useAuthUserStore } from '~/stores/auth';
import { useRefreshStore } from '~/stores/refresh';

import PaymentPaypal from '~/components/PaymentPaypal.vue';
import PaymentStripe from '~/components/PaymentStripe.vue';
import SupporterImages from '~/components/SupporterImages.vue';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';

const storeRefresh = useRefreshStore();
const useDate = useDateFormat();
const storeUser = useAuthUserStore();
const $q = useQuasar();
const { t } = useI18n();
const api = useApiFetch();
const notification = useNotification();

const mailTo = computed(() => {
  return `mailto:office@btree.at?subject=Invoice Request ${storeUser.company.name} (${storeUser.company.id})&body=Please send me an invoice for the company "${storeUser.company.name}" (id: ${storeUser.company.id}) with a donation of ${donation.value} Euros. Response E-Mail: ${storeUser.user.email}`;
});
const getPaidStatus = computed(() => {
  if (dayjs(storeUser.getPaidStatus.date) < dayjs()) {
    return '-';
  } else {
    return useDate.displayFormat(storeUser.getPaidStatus.date);
  }
});
const afterPayment = computed(() => {
  if (dayjs(storeUser.getPaidStatus.date) < dayjs()) {
    return useDate.displayFormat(dayjs().add(1, 'year').toISOString());
  } else {
    return useDate.displayFormat(
      dayjs(storeUser.getPaidStatus.date).add(1, 'year').toISOString()
    );
  }
});

const donation = ref(50);
const paid = ref(false);

const donationLabel = computed(() => `€ ${donation.value}`);
const donationMarker = [
  { value: 50, label: '50 €' },
  { value: 80, label: '80 €' },
  { value: 120, label: '120 €' },
  { value: 150, label: '150€' },
];

function payCoupon() {
  $q.dialog({
    prompt: {
      model: '',
      label: t('coupon'),
    },
  }).onOk((val) => {
    if (val.trim()) {
      api.post('/v1/company/coupon', { coupon: val }).then(
        (data) => {
          successPayment(data.paid);
        },
        (error) => {
          notification.open('negative', error);
        }
      );
    }
  });
}

function successPayment(newDate: string) {
  paid.value = true;
  if (newDate) {
    notification.open('positive', dayjs(newDate).format('YYYY-MM-DD'), true);
  } else {
    notification.open('positive', '');
  }
  refreshCompany();
}

function refreshCompany() {
  storeRefresh.refresh();
}
</script>
