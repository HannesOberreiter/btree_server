<!-- eslint-disable vue/no-v-html -->
<template>
  <q-card flat>
    <q-card-section>
      <div class="row q-pa-sm justify-center">
        <div class="col-12 col-sm-10 col-md-8">
          <div class="text-h5 q-pb-sm">
            {{ $t('membership.title') }}
          </div>
          <div
            v-if="paid"
            class="bg-info text-weight-bold text-black q-pa-sm rounded-borders"
          >
            {{ $t('membership.thankYou') }}
          </div>
          <ul>
            <li>
              {{ $t('membership.currentStatus') }}:
              <b>{{ getPaidStatus }}</b>
            </li>
            <li>
              {{ $t('membership.afterPayment') }}: <b>{{ afterPayment }}</b>
            </li>
          </ul>
          <q-slider
            v-model="donation"
            color="green"
            :min="currentPrice"
            :max="maxPrice"
            :step="10"
            markers
            :marker-labels="donationMarker"
            :label-value="donationLabel"
            switch-label-side
            switch-marker-labels-side
          >
          </q-slider>
          <div class="row payment">
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
                    parseInt(val) >= currentPrice ||
                    $t('membership.minimumAmount', { value: currentPrice }),
                ]"
                :hint="$t('membership.noSubscription')"
              >
                <template #prepend>
                  <q-icon
                    v-if="donation < donationMarker[1].value"
                    name="fas fa-face-smile"
                    size="lg"
                    color="primary"
                  ></q-icon>
                  <q-icon
                    v-else-if="donation < donationMarker[2].value"
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
                <template #append>
                  {{ years > 1 ? `(${sum})` : '' }} €
                </template>
                <template #after>
                  <q-btn
                    icon="fas fa-calendar-plus"
                    flat
                    round
                    :disable="days >= 3650"
                    @click="changeDays(365)"
                  >
                    <tooltip-base>
                      {{ $t('membership.increaseDays') }}
                    </tooltip-base>
                  </q-btn>
                  <q-btn
                    icon="fas fa-calendar-minus"
                    flat
                    round
                    :disable="days <= 365"
                    @click="changeDays(-365)"
                  >
                    <tooltip-base>
                      {{ $t('membership.decreaseDays') }}
                    </tooltip-base>
                  </q-btn>
                </template>
              </q-input>
              <div
                class="text-h5 q-pt-sm q-pb-sm"
                v-html="$t('membership.sum', { years: years, sum: sum })"
              ></div>
            </div>
          </div>
          <div class="text-center payment q-col-gutter-y-sm">
            <div v-if="!($q.platform.is.ios && $q.platform.is.safari)">
              <payment-stripe
                :donation="donation"
                :years="years"
                @on-paid="(data: any) => successPayment(data.paid)"
              ></payment-stripe>
              <q-separator></q-separator>
            </div>
            <div>
              <suspense>
                <payment-paypal
                  :donation="donation"
                  :years="years"
                  @on-paid="(data: any) => successPayment(data.paid)"
                ></payment-paypal>
              </suspense>
              <q-separator></q-separator>
            </div>
            <div>
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
      </div>
    </q-card-section>
    <q-card-section>
      <div class="row q-pa-sm justify-center">
        <div class="col-12 col-sm-10 col-md-8">
          <div class="text-h5 q-pb-sm">
            {{ $t('membership.priceHistory') }}:
          </div>
          <ul>
            <li v-for="(item, index) in priceHistory" :key="index">
              {{ item.year }}: {{ item.price }} € / {{ $t('year') }}
              {{
                index > 0
                  ? calculatePriceChange(
                      item.price,
                      priceHistory[index - 1].price,
                    )
                  : ''
              }}
            </li>
          </ul>
        </div>
      </div>
    </q-card-section>
    <q-card-section>
      <div class="row q-pa-sm justify-center">
        <div class="col-12 col-sm-10 col-md-8">
          <div class="text-h5 q-pb-sm">{{ $t('membership.perks') }}:</div>
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
              {{ $t('membership.perksWizBee') }}
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
import { useBackend } from '~/composables/useBackend';

const storeRefresh = useRefreshStore();
const useDate = useDateFormat();
const storeUser = useAuthUserStore();
const $q = useQuasar();
const { t } = useI18n();
const api = useApiFetch();
const notification = useNotification();
const backend = useBackend();

const mailTo = computed(() => {
  return `mailto:office@btree.at?subject=Invoice Request ${storeUser.company.name} (${storeUser.company.id}) [Server: ${backend.state.value}]&body=Please send me an invoice for the company "${storeUser.company.name}" (id: ${storeUser.company.id}) with a donation of ${donation.value} Euros. Response E-Mail: ${storeUser.user.email}`;
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
    return useDate.displayFormat(
      dayjs().add(years.value, 'year').toISOString(),
    );
  } else {
    return useDate.displayFormat(
      dayjs(storeUser.getPaidStatus.date)
        .add(years.value, 'year')
        .toISOString(),
    );
  }
});

const priceHistory = [
  {
    year: 2014,
    price: 24,
  },
  {
    year: 2016,
    price: 50,
  },
  {
    year: 2024,
    price: 55,
  },
];

const year = dayjs().year();
const currentPrice =
  priceHistory[priceHistory.length - 1].year > year
    ? priceHistory[priceHistory.length - 2].price
    : priceHistory[priceHistory.length - 1].price;

const maxPrice = currentPrice + 100;

const donation = ref(currentPrice);
const paid = ref(false);
const days = ref(365);
const years = computed(() => Math.floor(days.value / 365));
const sum = computed(() => donation.value * years.value);

const donationLabel = computed(() => `€ ${donation.value}`);
const donationMarker = [
  { value: currentPrice, label: currentPrice + '€' },
  { value: currentPrice + 30, label: currentPrice + 30 + '€' },
  { value: currentPrice + 60, label: currentPrice + 60 + '€' },
  { value: maxPrice, label: maxPrice + '€' },
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
          if (error.statusCode === 404) {
            notification.open(
              'negative',
              t('error.CouponNotFound', { token: val }),
              true,
            );
          } else {
            notification.open('negative', error);
          }
        },
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

function calculatePriceChange(cur: number, prev: number) {
  return '+ ' + Math.floor((cur * 100) / prev - 100) + '%';
}

function refreshCompany() {
  storeRefresh.refresh();
}

function changeDays(val: number) {
  if (days.value === 365 && val < 0) return;
  if (days.value === 3650 && val > 0) return;
  days.value += val;
}
</script>

<style scoped>
.payment {
  max-width: 500px;
  margin: 0 auto;
}
</style>
