<script setup lang="ts">
import { useFetch } from '@vueuse/core';
import { useMeta } from 'quasar';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import BtnDarkMode from '../components/BtnDarkMode.vue';
import SupporterImages from '../components/SupporterImages.vue';

const isBeta = process.env.BACKEND_URL.includes('beta');

const { isFetching, error, data }: any = useFetch(
	`/news.json?cache=${Date.now()}`,
)
	.get()
	.json();

const router = useRouter();
const path = computed(() => router.currentRoute.value);
const { t, locale } = useI18n();
const localStorageAvailable = ref(false);
const privacyPolicyUrl = computed(() =>
	locale.value === 'de'
		? 'https://www.btree.at/de/data-privacy/'
		: 'https://www.btree.at/data-privacy/');
const imprintUrl = computed(() =>
	locale.value === 'de'
		? 'https://www.btree.at/de/impressum/'
		: 'https://www.btree.at/imprint/');

// https://stackoverflow.com/a/16427747/5316675
function localStorageTest() {
	const test = 'test';
	try {
		localStorage.setItem(test, test);
		localStorage.removeItem(test);
		return true;
	}
	catch (e) {
		console.error(e);
		return false;
	}
}

function testBrowserSupport() {
	const compatibleBrowser
		= typeof Object['__defineSetter__' as keyof unknown] === 'function'
			&& !!String.prototype.includes;
	if (!compatibleBrowser) {
		console.log('Incompatible browser, please upgrade!');
	}
}

onMounted(() => {
	localStorageAvailable.value = localStorageTest();
	testBrowserSupport();
});

useMeta(() => {
	const baseUrl = window.location.origin;
	let meta = {};
	if (baseUrl.includes('app.btree')) {
		meta = {
			title: router.currentRoute.value.meta.title
				? `${t(router.currentRoute.value.meta.title as string)} - b.tree`
				: 'b.tree',
		};
	}
	else {
		meta = {
			title: router.currentRoute.value.meta.title
				? `${t(router.currentRoute.value.meta.title as string)} - b.tree`
				: 'b.tree',
			meta: {
				robots: { name: 'robots', content: 'noindex,follow' },
			},
		};
	}

	return meta;
});

function refresh(done: () => void) {
	window.location.reload();
	done();
}
</script>

<template>
	<q-layout>
		<div class="q-pa-xs">
			<div class="row justify-center items-center content-center">
				<div class="col-12 col-sm-8 col-md-5 col-lg-4">
					<q-card>
						<q-card-section class="bg-primary text-white">
							<q-pull-to-refresh
								color="yellow-9"
								icon="fas fa-spinner"
								@refresh="refresh"
							>
								<BtnDarkMode class="float-right" />
								<q-img
									src="~assets/logo_small.png"
									alt="b.tree Logo"
									spinner-color="white"
									class="float-left q-mr-sm"
									style="max-width: 55px"
								/>
								<div class="text-h6">
									b.tree
								</div>
								<div class="text-subtitle2">
									{{
										isBeta
											? 'You are on the BETA Server, your data on this page will not be saved!'
											: 'Professional Beekeeping Database'
									}}
								</div>
							</q-pull-to-refresh>
						</q-card-section>
						<q-card-section v-if="!localStorageAvailable">
							<div class="text-bold text-white text-center bg-negative q-pa-sm">
								{{ $t('error.localStorage') }}
							</div>
						</q-card-section>
						<q-page-container class="">
							<RouterView />
						</q-page-container>

						<q-card-section
							class="bg-blue-grey-9 text-center text-white text-h7"
						>
							<div>
								<span>{{ $t('signup.text') }}&nbsp;</span>
								<RouterLink
									:class="
										path.name !== 'register' ? 'text-orange-4' : 'text-grey-6'
									"
									:to="{ name: 'register' }"
								>
									{{ $t('signup.name') }}
								</RouterLink>
							</div>
							<div>
								<span>{{ $t('signup.alreadyRegistered') }}&nbsp;</span>
								<RouterLink
									:class="
										path.name !== 'login' ? 'text-orange-4' : 'text-grey-6'
									"
									:to="{ name: 'login' }"
								>
									{{ $t('login') }}
								</RouterLink>
							</div>
							<div>
								<RouterLink
									:class="
										path.name !== 'recover' ? 'text-orange-4' : 'text-grey-6'
									"
									:to="{ name: 'recover' }"
								>
									{{ $t('forgot') }}
								</RouterLink>
							</div>
						</q-card-section>
					</q-card>
					<div class="text-center">
						<small>
							© 2014-{{ new Date().getFullYear() }}
							<a
								class="link"
								href="https://www.btree.at/"
								target="_blank"
								rel="noopener"
							>
								b.tree Beekeeping Database
							</a>
							<br>
							<a
								class="link"
								:href="privacyPolicyUrl"
								target="_blank"
								rel="noopener"
							>
								{{ $t('privacyPolicy') }}
							</a> |
							<a
								class="link"
								:href="imprintUrl"
								target="_blank"
								rel="noopener"
							>
								{{ $t('imprint') }}
							</a>
							<br>
							<span v-if="data && !isFetching && !error">
								{{ $t('version') }}: {{ data[0].version }}
								<span v-if="!$q.platform.is.mobile">
									[{{ data[0].date }}]
								</span>
							</span>
						</small>
					</div>
					<SupporterImages />
				</div>
			</div>
		</div>
	</q-layout>
</template>
