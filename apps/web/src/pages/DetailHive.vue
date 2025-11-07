<script lang="ts">
import type { Filter, FilterState } from '../types';
import { KINDS, STATUS } from '../constants';
import { generateArrayOfYears } from '../helpers';
</script>

<script setup lang="ts">
import dayjs from 'dayjs';
import { useMeta, useQuasar } from 'quasar';
import { computed, ref, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import BtnBase from '../components/BtnBase.vue';
import BtnDropdownTask from '../components/BtnDropdownTask.vue';
import BtnPreviousNext from '../components/BtnPreviousNext.vue';
import DialogForm from '../components/DialogForm.vue';
import ExpansionHive from '../components/ExpansionHive.vue';
import ExpansionQueen from '../components/ExpansionQueen.vue';
import GlobalLoading from '../components/GlobalLoading.vue';
import HiveInfoMovements from '../components/HiveInfoMovements.vue';
import HiveInfoQueens from '../components/HiveInfoQueens.vue';

import HiveInfoTask from '../components/HiveInfoTask.vue';
import ListTasks from '../components/ListTasks.vue';
import { useHiveQuery } from '../composables/useQuery';

const props = defineProps({
	id: {
		type: String,
		required: true,
	},
});
const { t } = useI18n();
const $q = useQuasar();

const tab = ref('task');
const year = ref(dayjs().year());
const filter = ref<Filter>('filterEmpty');
const filterState = ref<FilterState>(STATUS[0]);
const opened = ref(false);
const refetchCounter = ref(0);

const id = toRef(props, 'id');
const { isLoading, data, refetch } = useHiveQuery({ id });

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
			? `${t('hive')}: ${data.value.name} - b.tree`
			: `${t('hive')} - b.tree`,
	};
});

function onPrint() {
	window.print();
}

function openForm(title: string, id: number | null, selected: number) {
	$q.dialog({
		component: DialogForm,
		componentProps: {
			title,
			form: title,
			maximized: true,
			ids: id ? [id] : null,
			selected: selected ? [selected] : null,
		},
	}).onOk(() => {
		refetch();
	});
}
</script>

<template>
	<q-card flat>
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
				<BtnPreviousNext :data="data" link="hive" />
				<div class="row justify-center">
					<!-- Hive Header -->
					<div class="col-12 col-md-8 q-pt-sm">
						<ExpansionHive :data="data" @refetch="refetch()">
							<BtnBase
								v-if="!data.queen_location"
								outline
								color="primary"
								@click="openForm('queen', null, data.id)"
							>
								{{ $t('new') }} {{ $t('queen') }}
							</BtnBase>
						</ExpansionHive>
					</div>
				</div>
				<!-- Queen Header -->
				<div v-if="data.queen_location" class="row justify-center">
					<div class="col-12 col-md-8">
						<ExpansionQueen
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
					<q-tab name="task" :label="$t('task', 2)" />
					<q-tab name="info" :label="$t('info')" />
					<BtnDropdownTask
						@refetch="() => refetchCounter++"
					/>
				</q-tabs>

				<q-separator />

				<q-tab-panels v-model="tab" animated>
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
							:year="year"
							:filter="filter"
							:filter-state="filterState"
							:opened="opened"
							:refetch="refetchCounter"
						/>
					</q-tab-panel>
					<q-tab-panel name="info" class="q-pa-xs">
						<div class="row">
							<div class="col-12 col-sm-6">
								<HiveInfoMovements :id="id" />
							</div>
							<div class="col-12 col-sm-6">
								<HiveInfoQueens :id="id" />
							</div>
						</div>
						<q-separator class="q-mt-sm q-mb-sm" />
						<div class="row">
							<div class="col-12 col-sm-6">
								<HiveInfoTask :id="id" kind="harvest" />
							</div>
							<div class="col-12 col-sm-6">
								<HiveInfoTask :id="id" kind="feed" />
							</div>
						</div>
					</q-tab-panel>
				</q-tab-panels>
			</q-card-section>
			<q-btn-dropdown
				size="sm"
				color="grey"
				icon="fas fa-cog"
				class="absolute-bottom-right print-hide"
			>
				<q-list>
					<q-item
						v-close-popup
						clickable
						class="print-hide"
						@click="opened = !opened"
					>
						<q-item-section>
							<q-item-label>{{ $t('toggle') }}</q-item-label>
						</q-item-section>
					</q-item>

					<q-item v-close-popup clickable class="print-hide" @click="onPrint()">
						<q-item-section>
							<q-item-label>{{ $t('print') }}</q-item-label>
						</q-item-section>
					</q-item>
				</q-list>
			</q-btn-dropdown>
		</div>
	</q-card>
</template>
