<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FormMainApi from '../components/FormMainApi.vue';
import FormMainCredential from '../components/FormMainCredential.vue';
import FormMainUser from '../components/FormMainUser.vue';
import GlobalLoading from '../components/GlobalLoading.vue';
import ListAgentKeys from '../components/ListAgentKeys.vue';
import ListFederatedCredentials from '../components/ListFederatedCredentials.vue';
import ListSessions from '../components/ListSessions.vue';
import { useAuthUserStore } from '../stores/auth';

const props = defineProps({
	tab: {
		type: String,
		default: 'user',
	},
});

const route = useRoute();
const router = useRouter();
const userStore = useAuthUserStore();

const activeTab = ref(props.tab || 'user');

watch(
	() => route.params.tab,
	(newTab) => {
		if (newTab && typeof newTab === 'string') {
			activeTab.value = newTab;
		}
	},
);

watch(activeTab, (newTab) => {
	if (newTab !== route.params.tab) {
		router.replace({ name: 'setting-profile', params: { tab: newTab } });
	}
});
</script>

<template>
	<q-card flat>
		<q-tabs
			v-model="activeTab"
			dense
			active-color="secondary"
			indicator-color="secondary"
			align="justify"
			narrow-indicator
			no-caps
			outside-arrows
		>
			<q-tab name="user" :label="$t('user')" />
			<q-tab name="credentials" :label="$t('credentials')" />
			<q-tab name="federatedCredentials" :label="$t('federatedCredentials')" />
			<q-tab name="session" :label="$t('session', 2)" />
			<q-tab v-if="userStore.isAdmin" name="api" :label="$t('api')" />
			<q-tab name="agent-keys" :label="$t('profile.agentKeysTab')" />
		</q-tabs>

		<q-separator />

		<q-tab-panels v-model="activeTab" animated>
			<q-tab-panel name="user">
				<div class="row justify-center">
					<div class="col-12 col-sm-10 col-md-8">
						<div class="text-body2 q-pb-sm text-center">
							{{ $t('profile.userTitle') }}
						</div>
						<FormMainUser />
					</div>
				</div>
			</q-tab-panel>

			<q-tab-panel name="credentials">
				<div class="row justify-center">
					<div class="col-12 col-sm-10 col-md-8">
						<div class="text-body2 q-pb-sm text-center">
							{{ $t('profile.credentialTitle') }}
						</div>
						<FormMainCredential />
					</div>
				</div>
			</q-tab-panel>

			<q-tab-panel name="federatedCredentials">
				<div class="row justify-center">
					<div class="col-12 col-sm-10 col-md-8">
						<div class="text-body2 q-pb-sm text-center">
							{{ $t('profile.federatedCredentials') }}
							{{ $t('profile.federatedCredentialsRemoveNote') }}
							<a
								href="https://myaccount.google.com/permissions"
								target="_blank"
							>
								Google Permissions
							</a>
						</div>
						<suspense>
							<ListFederatedCredentials />
							<template #fallback>
								<GlobalLoading />
							</template>
						</suspense>
					</div>
				</div>
			</q-tab-panel>

			<q-tab-panel name="session">
				<div class="row justify-center">
					<div class="col-12 col-sm-10 col-md-8">
						<div class="text-body2 q-pb-sm text-center">
							{{ $t('profile.session') }}
						</div>
						<suspense>
							<ListSessions />
							<template #fallback>
								<GlobalLoading />
							</template>
						</suspense>
					</div>
				</div>
			</q-tab-panel>

			<q-tab-panel name="api">
				<div class="row justify-center">
					<div class="col-12 col-sm-10 col-md-8">
						<div class="text-body2 q-pb-sm text-center">
							{{ $t('profile.apiTitle') }}
						</div>
						<FormMainApi />
					</div>
				</div>
			</q-tab-panel>

			<q-tab-panel name="agent-keys">
				<div class="row justify-center">
					<div class="col-12 col-sm-10 col-md-8">
						<div class="text-body2 q-pb-sm text-center">
							{{ $t('profile.agentKeysTitle') }}
						</div>
						<suspense>
							<ListAgentKeys />
							<template #fallback>
								<GlobalLoading />
							</template>
						</suspense>
					</div>
				</div>
			</q-tab-panel>
		</q-tab-panels>
	</q-card>
</template>
