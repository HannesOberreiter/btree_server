<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useKeyHelp } from '../composables/useKey';
import { useAuthUserStore } from '../stores/auth';
import BtnBase from './BtnBase.vue';
import BtnShare from './BtnShare.vue';
import DialogHint from './DialogHint.vue';
import GlobalSound from './GlobalSound.vue';
import TooltipBase from './TooltipBase.vue';

const storeUser = useAuthUserStore();

const router = useRouter();
const help = computed(() => `help.${String(router.currentRoute.value.name)}`);
const showInfo = ref(false);

const mailTo = computed(() => {
	return `mailto:office@btree.at?subject=BeeID: ${storeUser.user.id} UserID: ${storeUser.company.id}`;
});

const linkTo = computed(() => {
	return `https://www.btree.at${
		storeUser.getLanguage === 'de' ? '/de' : ''
	}/doc-faqs/`;
});

useKeyHelp(showInfo);
</script>

<template>
	<q-toolbar dense style="max-height: 36px; min-height: 34px">
		<RouterLink
			:to="{ name: 'news' }"
			class="text-white"
			style="text-decoration: none"
		>
			{{ $t('news') }}
			<TooltipBase>{{ $t('news') }}</TooltipBase>
		</RouterLink>
		<q-space />
		<a :href="mailTo" class="text-white" style="text-decoration: none">
			<q-icon name="fas fa-envelope" size="xs">
				<TooltipBase>{{ $t('contact') }}</TooltipBase>
			</q-icon>
		</a>
		<q-space />
		<a
			:href="linkTo"
			target="_blank"
			rel="noopener"
			class="text-white"
			style="text-decoration: none"
		>
			<q-icon name="fas fa-book" size="xs">
				<TooltipBase>{{ $t('faqs') }}</TooltipBase>
			</q-icon>
		</a>
		<q-space />
		<BtnBase
			icon="fas fa-circle-question"
			size="sm"
			:aria-label="$t('help.name')"
			@click="showInfo = !showInfo"
		>
			<TooltipBase>{{ $t('help.name') }} (h)</TooltipBase>
		</BtnBase>
		<BtnShare :show-path="true" />
	</q-toolbar>
	<GlobalSound />
	<DialogHint v-model="showInfo" :hint="help" />
</template>
