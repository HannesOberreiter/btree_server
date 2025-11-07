<script setup lang="ts">
import { ref } from 'vue';
import CompanySetting from '../components/CompanySetting.vue';
import CompanyUser from '../components/CompanyUser.vue';
import GlobalLoading from '../components/GlobalLoading.vue';
import { useAuthUserStore } from '../stores/auth';

const prop = defineProps({
	tab: {
		type: String,
		default: 'company',
	},
});
const storeUser = useAuthUserStore();
const activeTab = ref(prop.tab ? prop.tab : 'company');
</script>

<template>
	<q-card data-cy="page-setting-company" flat>
		<q-tabs
			v-model="activeTab"
			dense
			active-color="secondary"
			indicator-color="secondary"
			align="justify"
			narrow-indicator
		>
			<q-tab name="company" :label="$t('company.name')" />
			<q-tab v-if="storeUser.isAdmin" name="users" :label="$t('user', 2)" />
		</q-tabs>

		<q-separator />

		<q-tab-panels v-model="activeTab" animated>
			<q-tab-panel name="company">
				<div class="row justify-center">
					<div class="col-12 col-sm-10 col-md-8">
						<div class="text-body2 q-pb-sm text-center">
							{{ $t('company.title') }}
						</div>
						<CompanySetting />
					</div>
				</div>
			</q-tab-panel>

			<q-tab-panel name="users">
				<div class="row justify-center">
					<div class="col-12 col-sm-10 col-md-8">
						<div class="text-body2 q-pb-sm text-center">
							{{ $t('company.titleUser') }}
						</div>
						<Suspense>
							<CompanyUser />
							<template #fallback>
								<GlobalLoading />
							</template>
						</Suspense>
					</div>
				</div>
			</q-tab-panel>
		</q-tab-panels>
	</q-card>
</template>
