<script setup lang="ts">
import dayjs from 'dayjs';
import { useQuasar } from 'quasar';
import BtnBaseGroup from 'src/components/BtnBaseGroup.vue';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import BtnBase from '../components/BtnBase.vue';
import PaymentMollie from '../components/PaymentMollie.vue';
import PaymentPaypal from '../components/PaymentPaypal.vue';
import PaymentStripe from '../components/PaymentStripe.vue';
import SupporterImages from '../components/SupporterImages.vue';
import TooltipBase from '../components/TooltipBase.vue';
import { useApiFetch } from '../composables/useApi';
import { useBackend } from '../composables/useBackend';
import { useDateFormat } from '../composables/useDate';
import { useNotification } from '../composables/useNotification';
import { useAuthUserStore } from '../stores/auth';
import { useRefreshStore } from '../stores/refresh';

const storeRefresh = useRefreshStore();
const useDate = useDateFormat();
const storeUser = useAuthUserStore();
const $q = useQuasar();
const { t } = useI18n();
const api = useApiFetch();
const notification = useNotification();
const backend = useBackend();

const isAppleStoreWrapper = computed(() => document.cookie.includes('iOS'));

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

const payments = ref<{
	company: {
		count: number;
		months: number;
	};
	countCurrentYear: number;
	countLastYear: number;
}>({
	company: {
		count: 0,
		months: 0,
	},
	countCurrentYear: 0,
	countLastYear: 0,
});

const year = dayjs().year();
const currentPrice
	= priceHistory.at(-1)!.year > year
		? priceHistory[priceHistory.length - 2]!.price
		: priceHistory.at(-1)!.price;

const maxPrice = currentPrice + 100;

const donation = ref(currentPrice);
const paid = ref(false);
const paidLoading = ref(false);
const days = ref(365);
const years = computed(() => Math.floor(days.value / 365));

const mailTo = computed(() => {
	return `mailto:office@btree.at?subject=Invoice Request ${storeUser.company.name} (${storeUser.company.id}) [Server: ${backend.state.value}]&body=Please send me an invoice for the company "${storeUser.company.name}" (id: ${storeUser.company.id}) with a donation of ${donation.value} Euros. Response E-Mail: ${storeUser.user.email}`;
});
const getPaidStatus = computed(() => {
	if (dayjs(storeUser.getPaidStatus.date) < dayjs()) {
		return '-';
	}
	else {
		return useDate.displayFormat(storeUser.getPaidStatus.date);
	}
});
const afterPayment = computed(() => {
	if (dayjs(storeUser.getPaidStatus.date) < dayjs()) {
		return useDate.displayFormat(
			dayjs().add(years.value, 'year').toISOString(),
		);
	}
	else {
		return useDate.displayFormat(
			dayjs(storeUser.getPaidStatus.date)
				.add(years.value, 'year')
				.toISOString(),
		);
	}
});

const sum = computed(() => donation.value * years.value);

const donationLabel = computed(() => `€ ${donation.value}`);
const donationMarker = [
	{ value: currentPrice, label: `${currentPrice}€` },
	{ value: currentPrice + 30, label: `${currentPrice + 30}€` },
	{ value: currentPrice + 60, label: `${currentPrice + 60}€` },
	{ value: maxPrice, label: `${maxPrice}€` },
];

onMounted(() => {
	const query = new URLSearchParams(window.location.search);
	if (query.has('mollie'))
		successPayment('');
	if (query.has('session_id'))
		successPayment('');
	if (query.has('session_id') || query.has('mollie')) {
		window.history.replaceState({}, document.title, window.location.pathname);
	}
});

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
					}
					else {
						notification.open('negative', error);
					}
				},
			);
		}
	});
}

async function successPayment(newDate: string) {
	paidLoading.value = true;
	if (newDate) {
		notification.open('positive', dayjs(newDate).format('YYYY-MM-DD'), true);
	}
	else {
		notification.open('positive', '');
	}
	await new Promise(resolve => setTimeout(resolve, 10000));
	await refreshCompany();
	paidLoading.value = false;
	paid.value = true;
}

function calculatePriceChange(cur: number, prev: number | undefined) {
	if (!prev)
		return '';
	return `+ ${Math.floor((cur * 100) / prev - 100)}%`;
}

function refreshCompany() {
	return storeRefresh.refresh(true);
}

function changeDays(val: number) {
	if (days.value === 365 && val < 0)
		return;
	if (days.value === 3650 && val > 0)
		return;
	days.value += val;
}
api
	.get('/v1/company/payments')
	.then((data) => {
		payments.value = data;
	})
	.catch((error) => {
		console.error('Error fetching payments:', error);
	});
</script>

<template>
	<q-card flat>
		<q-card-section>
			<div class="row q-pa-sm justify-center">
				<div v-if="paidLoading" class="col-12 col-sm-10 col-md-8 text-center">
					<q-spinner-dots color="primary" size="50px" />
				</div>
				<div v-else class="col-12 col-sm-10 col-md-8">
					<div
						v-if="paid"
						class="bg-primary text-weight-bold text-white q-pa-sm rounded-borders"
						v-html="$t('membership.thankYou')"
					/>
					<div v-else class="text-h5 q-pb-sm">
						{{ $t('membership.title') }}
					</div>
					<div
						v-if="isAppleStoreWrapper"
						class="bg-warning text-weight-bold text-dark q-pa-md rounded-borders q-mb-md"
					>
						<q-icon name="fas fa-exclamation-triangle" class="q-mr-sm" />
						{{ $t('membership.appleStoreNote') }}
						<br><br>
						{{ $t('membership.appleStoreInvoice') }}
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
					/>
					<div class="row">
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
										parseInt(val) >= currentPrice
										|| $t('membership.minimumAmount', { value: currentPrice }),
								]"
								:hint="$t('membership.noSubscription')"
							>
								<template #prepend>
									<q-icon
										v-if="donation < donationMarker[1]!.value"
										name="fas fa-face-smile"
										size="lg"
										color="primary"
									/>
									<q-icon
										v-else-if="donation < donationMarker[2]!.value"
										name="fas fa-face-grin"
										size="lg"
										color="primary"
									/>
									<q-icon
										v-else
										name="fas fa-face-grin-hearts"
										size="lg"
										color="primary"
									/>
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
										<TooltipBase>
											{{ $t('membership.increaseDays') }}
										</TooltipBase>
									</q-btn>
									<q-btn
										icon="fas fa-calendar-minus"
										flat
										round
										:disable="days <= 365"
										@click="changeDays(-365)"
									>
										<TooltipBase>
											{{ $t('membership.decreaseDays') }}
										</TooltipBase>
									</q-btn>
								</template>
							</q-input>
							<div
								class="text-h5 q-pt-sm q-pb-sm"
								v-html="$t('membership.sum', { years, sum })"
							/>
						</div>
					</div>
					<div class="text-center q-col-gutter-y-sm q-pt-sm">
						<q-list v-if="!isAppleStoreWrapper" bordered>
							<q-expansion-item
								expand-separator
								icon="fas fa-credit-card"
								:label="$t('payment.mollie')"
								:caption="$t('payment.mollieDescription')"
								default-opened
							>
								<q-card>
									<q-card-section>
										<PaymentMollie
											:donation="donation"
											:years="years"
										/>
									</q-card-section>
								</q-card>
							</q-expansion-item>

							<q-expansion-item
								expand-separator
								icon="fab fa-stripe"
								:label="$t('payment.stripe')"
							>
								<q-card>
									<q-card-section>
										<PaymentStripe
											:donation="donation"
											:years="years"
										/>
									</q-card-section>
								</q-card>
							</q-expansion-item>

							<q-expansion-item
								expand-separator
								icon="fab fa-paypal"
								:label="$t('payment.paypal')"
							>
								<q-card>
									<q-card-section>
										<suspense>
											<PaymentPaypal
												:donation="donation"
												:years="years"
												@on-paid="(data: any) => successPayment(data.paid)"
											/>
										</suspense>
									</q-card-section>
								</q-card>
							</q-expansion-item>
						</q-list>
						<div>
							<BtnBaseGroup>
								<BtnBase
									label="office@btree.at"
									icon="fas fa-envelope"
									color="grey"
									:href="mailTo"
								/>
								<BtnBase
									v-if="!isAppleStoreWrapper"
									icon="fas fa-ticket"
									color="grey"
									:label="$t('coupon')"
									@click="payCoupon"
								/>
							</BtnBaseGroup>
						</div>
					</div>
				</div>
			</div>
		</q-card-section>
		<div class="row justify-center">
			<div class="col-12 col-sm-10 col-md-8">
				<div class="text-h5">
					{{ $t('membership.paymentHistory') }}:
				</div>
				<div class="text-caption">
					{{ $t('membership.paymentHistoryNote') }}
				</div>
				<ul>
					<li>
						{{ $t('membership.paymentCount') }}: {{ payments.company.count }}x
					</li>
					<li>
						{{ $t('membership.paymentMonths') }}: {{ payments.company.months }}
					</li>
				</ul>
			</div>
		</div>

		<div class="row justify-center">
			<div class="col-12 col-sm-10 col-md-8">
				<div class="text-h5">
					{{ $t('membership.paymentStatistics') }}:
				</div>
				<ul>
					<li>
						{{ $t('membership.paymentCurrentYear') }}:
						{{ payments.countCurrentYear }}x
					</li>
					<li>
						{{ $t('membership.paymentLastYear') }}:
						{{ payments.countLastYear }}x
					</li>
				</ul>
			</div>
		</div>

		<div class="row justify-center">
			<div class="col-12 col-sm-10 col-md-8">
				<div class="text-h5">
					{{ $t('membership.priceHistory') }}:
				</div>
				<ul>
					<li v-for="(item, index) in priceHistory" :key="index">
						{{ item.year }}: {{ item.price }} € / {{ $t('year') }}
						{{
							index > 0
								? calculatePriceChange(
									item.price,
									priceHistory[index - 1]?.price,
								)
								: ''
						}}
					</li>
				</ul>
			</div>
		</div>

		<div class="row justify-center">
			<div class="col-12 col-sm-10 col-md-8">
				<div class="text-h5 q-pb-sm">
					{{ $t('membership.perks') }}:
				</div>
				<div class="text-caption">
					{{ $t('membership.afterPremium') }}
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
						{{ $t('membership.perksWizBee') }}
					</li>
					<li>
						{{ $t('membership.perksSupport') }}
					</li>
				</ul>
				<div class="q-pt-sm text-italic">
					Cheers<br>
					Hannes Oberreiter <br>
				</div>
			</div>
		</div>
		<q-card-section>
			<SupporterImages />
		</q-card-section>
	</q-card>
</template>
