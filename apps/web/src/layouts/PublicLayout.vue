<script setup lang="ts">
import { useMeta } from 'quasar';
import BtnDarkMode from 'src/components/BtnDarkMode.vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const router = useRouter();
const { t } = useI18n();

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
		<div class="row justify-center items-center content-center">
			<div class="col-12">
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
							{{ 'Professional Beekeeping Database' }}
						</div>
					</q-pull-to-refresh>
				</q-card-section>

				<q-page-container class="">
					<slot />
				</q-page-container>

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
					</small>
				</div>
			</div>
		</div>
	</q-layout>
</template>
