<script setup lang="ts">
import type { MatomoTracker } from '@certible/use-matomo';
import { useMeta, useQuasar } from 'quasar';
import { computed, inject, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave, onBeforeRouteUpdate, RouterView, useRouter } from 'vue-router';
import BtnBase from '../components/BtnBase.vue';
import MainDrawer from '../components/MainDrawer.vue';
import MainFooter from '../components/MainFooter.vue';
import MainNavbar from '../components/MainNavbar.vue';
import { usePreventNavigation } from '../composables/usePreventNavgiation';
import { useQuasarLang } from '../composables/useQuasarLang';
import { useAuthUserStore } from '../stores/auth';

const usePrevent = usePreventNavigation();
const leftDrawerOpen = ref(false);
const storeUser = useAuthUserStore();
const $q = useQuasar();
const router = useRouter();
const { t } = useI18n();
const matomo = inject<MatomoTracker>('matomo');

storeUser.updateLang();
useQuasarLang($q);

useMeta(() => {
	return {
		title: router.currentRoute.value.meta.title
			? `${t(router.currentRoute.value.meta.title as string)} - b.tree`
			: 'b.tree',
		meta: {
			robots: { name: 'robots', content: 'noindex,follow' },
		},
	};
});

function toggleLeftDrawer() {
	leftDrawerOpen.value = !leftDrawerOpen.value;
}

onBeforeRouteLeave(() => {
	if (usePrevent.state.value)
		return usePrevent.blockMessage();
});
onBeforeRouteUpdate(() => {
	if (usePrevent.state.value)
		return usePrevent.blockMessage();
});
onMounted(() => {
	if (process.env.BACKEND_URL.includes('beta')) {
		$q.dialog({
			title: 'BETA Page',
			message:
        'You are on the beta server, this page is only meant for testing and your data is not saved here! You will not edit your live data if you edit any data on this server.',
		});
	}
});

function refresh(done: () => void) {
	window.location.reload();
	done();
}

const uniqueIdentifier = computed(() => {
	let identifier = '';
	if (storeUser?.user?.id)
		identifier += `bee_id:${storeUser.user.id}`;
	if (storeUser?.company?.id)
		identifier += `.user_id:${storeUser.company.id}`;
	return identifier;
});

watch(
	uniqueIdentifier,
	() => {
		if (uniqueIdentifier.value) {
			matomo?.setUserId(uniqueIdentifier.value);
			matomo?.trackPageView();
		}
		else {
			matomo?.setUserId(null);
			matomo?.trackPageView();
		}
	},
	{ immediate: true },
);
</script>

<template>
	<q-layout view="hhh LpR lff">
		<q-header class="bg-primary text-white print-hide">
			<q-pull-to-refresh
				color="yellow-9"
				icon="fas fa-spinner"
				@refresh="refresh"
			>
				<q-toolbar>
					<BtnBase
						dense
						flat
						round
						data-cy="btn-drawer"
						icon="fas fa-bars"
						aria-label="Toggle Sidebar"
						@click="toggleLeftDrawer"
					/>
					<MainNavbar />
				</q-toolbar>
			</q-pull-to-refresh>
		</q-header>

		<q-drawer
			v-model="leftDrawerOpen"
			dark
			show-if-above
			side="left"
			:width="200"
			class="bg-blue-grey-9 print-hide"
			data-cy="drawer"
		>
			<MainDrawer />
		</q-drawer>

		<q-page-container>
			<div class="q-pa-xs">
				<RouterView />
			</div>
			<q-page-scroller position="bottom" :scroll-offset="500" :offset="[0, 10]">
				<q-btn
					icon="fas fa-arrow-up"
					color="info"
					class="print-hide"
					round
					style="opacity: 0.6"
				/>
			</q-page-scroller>
		</q-page-container>

		<q-footer class="bg-grey-8 text-white print-hide">
			<MainFooter />
		</q-footer>
	</q-layout>
</template>
