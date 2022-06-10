<template>
  <q-card>
    <q-card-section>
      <div class="row q-pa-sm justify-center">
        <div class="col-12 col-sm-10 col-md-8">
          <div class="text-h5 q-pb-sm text-center">
            {{ $t('membership.title') }}
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
            :max="100"
            :step="10"
            markers
            :marker-labels="donationMarker"
            :label-value="donationLabel"
            switch-label-side
            switch-marker-labels-side
          >
          </q-slider>
          <div class="row justify-center">
            <div class="col-12 col-md-5 col-lg-3">
              <q-input
                v-model.number="donation"
                class="text-h3"
                filled
                min="50"
                step="1"
                type="number"
              >
                <template #prepend>
                  <q-icon
                    v-if="donation < 60"
                    name="fas fa-face-smile"
                    size="lg"
                    color="primary"
                  ></q-icon>
                  <q-icon
                    v-else-if="donation < 80"
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
                <template #append>€</template>
              </q-input>
            </div>
          </div>
          <div class="q-gutter-sm text-center q-pt-sm">
            <suspense>
              <payment-paypal :donation="donation"></payment-paypal>
            </suspense>
            <btn-base label="Stripe" icon="fab fa-stripe" color="secondary">
            </btn-base>
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
            {{ $t('membership.perksSupport') }}
          </li>
        </ul>
        <div class="text-caption">
          Cheers<br />
          Hannes Oberreiter [Organic Beekeeper, Hobby Biologist and Part-Time
          Software Developer]
        </div>
      </div>
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

const donationLabel = computed(() => `€ ${donation.value}`);
const donationMarker = [
  { value: 50, label: '50 €' },
  { value: 60, label: '60 €' },
  { value: 70, label: '70 €' },
  { value: 80, label: '80 €' },
  { value: 90, label: '90 €' },
  { value: 100, label: '100€' },
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
          notification.open('positive', dayjs(data.paid).format('YYYY-MM-DD'));
          refreshCompany();
        },
        (error) => {
          notification.open('negative', error);
        }
      );
    }
  });
}

function refreshCompany() {
  storeRefresh.refresh();
}
</script>
