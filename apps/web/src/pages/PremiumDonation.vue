<script setup lang="ts">
import dayjs from 'dayjs';
import { useQuasar } from 'quasar';
import BtnBaseGroup from 'src/components/BtnBaseGroup.vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import BtnBase from '../components/BtnBase.vue';
import PaymentMollie from '../components/PaymentMollie.vue';
import PaymentPaypal from '../components/PaymentPaypal.vue';
import PaymentStripe from '../components/PaymentStripe.vue';
import { useApiFetch } from '../composables/useApi';
import { useDateFormat } from '../composables/useDate';
import { useNotification } from '../composables/useNotification';
import { useAuthUserStore } from '../stores/auth';
import { useRefreshStore } from '../stores/refresh';

const storeRefresh = useRefreshStore();
const useDate = useDateFormat();
const storeUser = useAuthUserStore();
const $q = useQuasar();
const { t, locale } = useI18n();
const api = useApiFetch();
const notification = useNotification();

const isAppleStoreWrapper = computed(() => document.cookie.includes('iOS') === true);

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

const currentPrice = 55;
const maxPrice = currentPrice + 100;

const donation = ref(currentPrice);
const paid = ref(false);
const paidLoading = ref(false);
const years = ref(1);
const step = ref('amount');

const pricePageUrl = computed(() =>
	locale.value.startsWith('de')
		? 'https://www.btree.at/de/price/'
		: 'https://www.btree.at/price/',
);

const isPremiumActive = computed(() => dayjs(storeUser.getPaidStatus.date) >= dayjs());

const getPaidStatus = computed(() => {
	if (!isPremiumActive.value)
		return t('membership.premiumExpired');
	return useDate.displayFormat(storeUser.getPaidStatus.date);
});

const afterPayment = computed(() => {
	const base = isPremiumActive.value
		? dayjs(storeUser.getPaidStatus.date)
		: dayjs();
	return useDate.displayFormat(base.add(years.value, 'year').toISOString());
});

const sum = computed(() => donation.value * years.value);

function requestInvoice() {
	$q.dialog({
		title: t('membership.invoiceRequestTitle'),
		message: t('membership.invoiceRequestMessage', {
			sum: sum.value,
			years: years.value,
			email: storeUser.user.email,
		}),
		html: true,
		ok: { label: t('confirm'), color: 'primary' },
		cancel: { label: t('cancel'), flat: true, color: 'grey' },
		persistent: true,
	}).onOk(() => {
		paidLoading.value = true;
		api.post('/v1/company/invoice', {
			amount: donation.value,
			quantity: years.value,
		}).then(
			(data: any) => {
				successPayment(data.paid);
			},
			(error: any) => {
				paidLoading.value = false;
				if (error.statusCode === 429) {
					notification.open(
						'warning',
						t('membership.invoiceRequestRecent'),
						true,
					);
				}
				else {
					notification.open('negative', error);
				}
			},
		);
	});
}

const yearOptions = computed(() =>
	[1, 2, 3, 4, 5].map(n => ({ value: n, label: `${n} ${t('year')}` })),
);

const donationLabel = computed(() => `€ ${donation.value}`);
const donationMarker = [
	{ value: currentPrice, label: `${currentPrice}€` },
	{ value: currentPrice + 30, label: `${currentPrice + 30}€` },
	{ value: currentPrice + 60, label: `${currentPrice + 60}€` },
	{ value: maxPrice, label: `${maxPrice}€` },
];

const query = new URLSearchParams(window.location.search);
if (query.has('mollie'))
	successPayment('');
if (query.has('session_id'))
	successPayment('');
if (query.has('session_id') || query.has('mollie'))
	window.history.replaceState({}, document.title, window.location.pathname);

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
	if (newDate)
		notification.open('positive', dayjs(newDate).format('YYYY-MM-DD'), true);
	else
		notification.open('positive', '');
	await new Promise(resolve => setTimeout(resolve, 10000));
	await storeRefresh.refresh(true);
	paidLoading.value = false;
	paid.value = true;
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
				<!-- Loading -->
				<div v-if="paidLoading" class="col-12 col-sm-10 col-md-8 text-center">
					<q-spinner-dots color="primary" size="50px" />
				</div>

				<div v-else class="col-12 col-sm-10 col-md-8">
					<!-- Thank you -->
					<div
						v-if="paid"
						class="bg-positive text-weight-bold text-white q-pa-md rounded-borders"
						v-html="$t('membership.thankYou')"
					/>

					<template v-else>
						<div class="text-h5 q-mb-md">
							{{ $t('membership.title') }}
						</div>

						<!-- Current status -->
						<div class="q-mb-sm text-body2">
							<div>
								{{ $t('membership.currentStatus') }}: <b>{{ getPaidStatus }}</b>
							</div>
							<div>
								{{ $t('membership.afterPayment') }}: <b>{{ afterPayment }}</b>
							</div>
						</div>

						<!-- Always-visible summary -->
						<div class="q-mb-md q-pa-sm bg-grey-2 rounded-borders text-body1">
							<span v-html="$t('membership.sum', { years, sum })" />
						</div>

						<!-- Stepper -->
						<q-stepper
							v-model="step"
							vertical
							flat
							animated
							color="primary"
							header-nav
						>
							<!-- Step 1: Amount per year -->
							<q-step
								name="amount"
								:title="$t('membership.amountPerYear')"
								icon="fas fa-euro-sign"
								:done="step === 'duration' || step === 'payment'"
								header-nav
							>
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
									class="q-mb-sm"
								/>
								<q-input
									v-model.number="donation"
									filled
									type="number"
									:min="currentPrice"
									step="1"
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
											color="primary"
										/>
										<q-icon
											v-else-if="donation < donationMarker[2]!.value"
											name="fas fa-face-grin"
											color="primary"
										/>
										<q-icon
											v-else
											name="fas fa-face-grin-hearts"
											color="primary"
										/>
									</template>
									<template #append>
										{{ $t('year') }}
									</template>
								</q-input>
								<q-stepper-navigation>
									<q-btn
										color="primary"
										:label="$t('next')"
										@click="step = 'duration'"
									/>
								</q-stepper-navigation>
							</q-step>

							<!-- Step 2: Duration -->
							<q-step
								name="duration"
								:title="$t('membership.duration')"
								icon="fas fa-calendar"
								:done="step === 'payment'"
								header-nav
							>
								<q-btn-toggle
									v-model="years"
									spread
									unelevated
									toggle-color="primary"
									color="grey-2"
									text-color="dark"
									:options="yearOptions"
								/>
								<q-stepper-navigation>
									<q-btn
										color="primary"
										:label="$t('next')"
										class="q-mr-sm"
										@click="step = 'payment'"
									/>
									<q-btn
										flat
										:label="$t('back')"
										@click="step = 'amount'"
									/>
								</q-stepper-navigation>
							</q-step>

							<!-- Step 3: Payment method -->
							<q-step
								name="payment"
								:title="$t('membership.choosePayment')"
								icon="fas fa-credit-card"
								header-nav
							>
								<template v-if="!isAppleStoreWrapper">
									<q-list bordered rounded>
										<q-expansion-item
											expand-separator
											icon="fas fa-credit-card"
											:label="$t('payment.mollie')"
											:caption="$t('payment.mollieDescription')"
											default-opened
										>
											<q-card>
												<q-card-section>
													<PaymentMollie :donation="donation" :years="years" />
												</q-card-section>
											</q-card>
										</q-expansion-item>
										<q-expansion-item
											expand-separator
											icon="fab fa-stripe"
											:label="$t('payment.stripe')"
											:caption="$t('payment.stripeDescription')"
										>
											<q-card>
												<q-card-section>
													<PaymentStripe :donation="donation" :years="years" />
												</q-card-section>
											</q-card>
										</q-expansion-item>
										<q-expansion-item
											expand-separator
											icon="fab fa-paypal"
											:label="$t('payment.paypal')"
											:caption="$t('payment.paypalDescription')"
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
								</template>
								<q-banner
									v-else
									class="bg-warning text-dark q-mb-md rounded-borders"
									icon="fas fa-exclamation-triangle"
								>
									{{ $t('membership.appleStoreNote') }}
									<br><br>
									{{ $t('membership.appleStoreInvoice') }}
								</q-banner>

								<div class="text-overline text-grey-7 q-mt-md q-mb-xs">
									{{ $t('membership.otherOptions') }}
								</div>
								<BtnBaseGroup>
									<BtnBase
										:label="$t('membership.invoiceRequestButton')"
										icon="fas fa-file-invoice"
										color="grey"
										@click="requestInvoice"
									/>
									<BtnBase
										icon="fas fa-ticket"
										color="grey"
										:label="$t('coupon')"
										@click="payCoupon"
									/>
								</BtnBaseGroup>

								<q-stepper-navigation>
									<q-btn
										color="primary"
										:label="$t('next')"
										class="q-mr-sm"
										disabled
									/>
									<q-btn
										flat
										:label="$t('back')"
										@click="step = 'duration'"
									/>
								</q-stepper-navigation>
							</q-step>
						</q-stepper>
					</template>
				</div>
			</div>
		</q-card-section>

		<q-separator class="q-my-sm" />

		<q-card-section>
			<div class="row justify-center">
				<div class="col-12 col-sm-10 col-md-8">
					<div class="row q-col-gutter-md">
						<div class="col-12 col-sm-6">
							<div class="text-subtitle1 text-weight-bold">
								{{ $t('membership.paymentHistory') }}
							</div>
							<div class="text-caption text-grey q-mb-xs">
								{{ $t('membership.paymentHistoryNote') }}
							</div>
							<div class="text-body2">
								{{ $t('membership.paymentCount') }}: <b>{{ payments.company.count }}x</b>
							</div>
							<div class="text-body2">
								{{ $t('membership.paymentMonths') }}: <b>{{ payments.company.months }}</b>
							</div>
						</div>
						<div class="col-12 col-sm-6">
							<div class="text-subtitle1 text-weight-bold">
								{{ $t('membership.paymentStatistics') }}
							</div>
							<div class="text-body2">
								{{ $t('membership.paymentCurrentYear') }}: <b>{{ payments.countCurrentYear }}x</b>
							</div>
							<div class="text-body2">
								{{ $t('membership.paymentLastYear') }}: <b>{{ payments.countLastYear }}x</b>
							</div>
						</div>
					</div>
					<div class="q-pt-md">
						<q-btn
							flat
							no-caps
							color="primary"
							icon="fas fa-arrow-up-right-from-square"
							:label="$t('membership.featuresLink')"
							:href="pricePageUrl"
							target="_blank"
						/>
					</div>
				</div>
			</div>
		</q-card-section>
	</q-card>
</template>
