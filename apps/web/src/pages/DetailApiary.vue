<script lang="ts">
import type { Filter, FilterState } from '../types';
import { KINDS, STATUS } from '../constants';
import { generateArrayOfYears } from '../helpers';
</script>

<script setup lang="ts">
import dayjs from 'dayjs';
import { useMeta } from 'quasar';
import ChartGts from 'src/components/ChartGts.vue';
import { computed, ref, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import BtnBase from '../components/BtnBase.vue';
import BtnDropdownTask from '../components/BtnDropdownTask.vue';
import BtnPreviousNext from '../components/BtnPreviousNext.vue';
import ExpansionApiary from '../components/ExpansionApiary.vue';
import GlobalLoading from '../components/GlobalLoading.vue';
import IframeWeather from '../components/IframeWeather.vue';
import ListHives from '../components/ListHives.vue';
import ListTasks from '../components/ListTasks.vue';

import TooltipBase from '../components/TooltipBase.vue';
import { useApiaryQuery } from '../composables/useQuery';

const props = defineProps({
	id: {
		type: String,
		required: true,
	},
});
const { t } = useI18n();
const tab = ref('hive');
const year = ref(dayjs().year());
const filter = ref<Filter>('filterEmpty');
const filterState = ref<FilterState>(STATUS[0]);
const opened = ref(false);
const refetchCounter = ref(0);

const id = toRef(props, 'id');
const { isLoading, data, refetch } = useApiaryQuery({ id });

const years = computed(() =>
	generateArrayOfYears(
		data.value
			? data.value.firstMovedate
				? dayjs(data.value.firstMovedate.date).year()
				: 2000
			: 2000,
	),
);

useMeta(() => {
	return {
		title: data.value
			? `${t('apiary')}: ${data.value.name} - b.tree`
			: `${t('apiary')} - b.tree`,
	};
});
</script>

<template>
	<q-card data-cy="page-detail-apiary" flat>
		<q-card-section v-if="isLoading">
			<GlobalLoading v-if="isLoading" />
		</q-card-section>
		<q-card-section v-else-if="!data">
			<div class="row">
				<div class="col-12 text-h5">
					{{ $t('error404') }}
				</div>
			</div>
		</q-card-section>
		<div v-else>
			<q-card-section>
				<BtnPreviousNext :data="data" link="apiary" />
				<div class="row justify-center">
					<!-- Apiary Header -->
					<div class="col-12 col-md-8 q-pt-sm">
						<ExpansionApiary
							:data="data"
							@refetch="refetch()"
						/>
					</div>
				</div>
			</q-card-section>
			<q-card-section class="q-pa-xs">
				<q-tabs
					v-model="tab"
					dense
					class="text-grey"
					active-color="primary"
					indicator-color="primary"
					align="justify"
					narrow-indicator
				>
					<q-tab name="hive" :label="$t('hive', 2)" />
					<q-tab name="task" :label="$t('task', 2)" />
					<q-tab v-show="!$q.platform.is.mobile" name="gts" label="GTS">
						<TooltipBase>{{ $t('growing_degree_days') }}</TooltipBase>
					</q-tab>
					<q-tab v-show="!$q.platform.is.mobile" name="weather" icon="fas fa-cloud-sun-rain">
						<TooltipBase>{{ $t('weather') }}</TooltipBase>
					</q-tab>
					<q-btn-dropdown v-show="$q.platform.is.mobile" flat>
						<q-list>
							<q-item v-close-popup clickable @click="tab = 'gts'">
								<q-item-section>
									<q-item-label>GTS</q-item-label>
								</q-item-section>
							</q-item>
							<q-item v-close-popup clickable @click="tab = 'weather'">
								<q-item-section>
									<q-item-label>Weather</q-item-label>
								</q-item-section>
							</q-item>
						</q-list>
					</q-btn-dropdown>
					<BtnDropdownTask
						@refetch="() => refetchCounter++"
					/>
				</q-tabs>

				<q-separator />

				<q-tab-panels v-model="tab" animated>
					<q-tab-panel name="hive" class="q-pa-xs">
						<ListHives
							v-if="data"
							:data="data"
							@change="refetch()"
						/>
					</q-tab-panel>
					<q-tab-panel name="task" class="q-pa-xs">
						<div class="row">
							<div class="col-12 col-md-6">
								<q-select v-model="year" :options="years" :label="$t('year')">
									<template #before>
										<BtnBase
											icon="fas fa-arrow-left"
											@click="year--"
										/>
										<BtnBase
											icon="fas fa-arrow-right"
											@click="year++"
										/>
									</template>
								</q-select>
							</div>
							<div class="col-12 col-md-6">
								<div class="row">
									<div class="col-6">
										<q-select
											v-model="filter"
											:options="KINDS"
											:label="`${$t('filter')} ${$t('task')}`"
											:option-label="(label) => $t(label)"
										/>
									</div>
									<div class="col-6">
										<q-select
											v-model="filterState"
											:options="STATUS"
											:label="`${$t('filter')} ${$t('status')}`"
											:option-label="(label) => $t(label)"
										/>
									</div>
								</div>
							</div>
						</div>
						<ListTasks
							:id="id"
							:apiary="true"
							:year="year"
							:filter="filter"
							:filter-state="filterState"
							:opened="opened"
							:refetch="refetchCounter"
						/>
					</q-tab-panel>
					<q-tab-panel name="gts" class="q-pa-xs">
						<q-select v-model="year" :options="years" :label="$t('year')">
							<template #before>
								<BtnBase
									icon="fas fa-arrow-left"
									@click="year--"
								/>
								<BtnBase
									icon="fas fa-arrow-right"
									@click="year++"
								/>
							</template>
						</q-select>
						<ChartGts
							:year="year"
							:apiary-id="data.id"
						/>
					</q-tab-panel>
					<q-tab-panel name="weather" class="q-pa-xs">
						<div class="row">
							<div class="col-12">
								<IframeWeather
									:latlng="{
										latitude: data.latitude,
										longitude: data.longitude,
									}"
								/>
							</div>
						</div>
					</q-tab-panel>
				</q-tab-panels>
			</q-card-section>
		</div>
	</q-card>
</template>
