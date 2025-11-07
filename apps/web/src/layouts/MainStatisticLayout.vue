<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, toRef, unref } from 'vue';
import BtnBase from '../components/BtnBase.vue';
import BtnBaseGroup from '../components/BtnBaseGroup.vue';
import DialogFilter from '../components/DialogFilter.vue';
import StatisticTaskApiary from '../components/StatisticTaskApiary.vue';
import StatisticTaskType from '../components/StatisticTaskType.vue';
import StatisticTaskYear from '../components/StatisticTaskYear.vue';
import TooltipBase from '../components/TooltipBase.vue';
import { useTableFilterStore } from '../stores/tableFilter';

const props = defineProps({
	kind: {
		type: String,
		required: true,
	},
});

const kind = toRef(props, 'kind');

const $q = useQuasar();
const tab = ref('year');
const storeFilter = useTableFilterStore();
const STATSSTORE = `statistic_${unref(kind)}`;
storeFilter.reset(STATSSTORE);
const filter = computed(() => storeFilter.table(STATSSTORE) !== '');
const filterYear = computed(() => storeFilter.field(STATSSTORE, 'year'));

function changeYear(change: number) {
	storeFilter.updateYear(STATSSTORE, change);
}

function openFilter() {
	$q.dialog({
		component: DialogFilter,
		componentProps: {
			form: STATSSTORE,
		},
	});
}
</script>

<template>
	<q-card flat>
		<div class="row q-pa-sm justify-center">
			<div class="col-6">
				<div class="text-h5 text-left">
					{{ $t('statistic') }} {{ $t(props.kind) }}
				</div>
			</div>
			<div class="col-6 text-right">
				<BtnBaseGroup>
					<BtnBase
						:color="filter ? 'negative' : 'warning'"
						:label="$t('filter')"
						:icon-right="
							filter ? 'fas fa-filter' : 'fas fa-filter-circle-xmark'
						"
						@click="openFilter"
					/>
					<BtnBase
						:disable="tab === 'year'"
						label="-"
						color="blue-5"
						@click="changeYear(-1)"
					/>
					<BtnBase
						label="+"
						color="blue-8"
						:disable="filterYear > new Date().getFullYear() || tab === 'year'"
						@click="changeYear(1)"
					/>
					<TooltipBase>{{ `${$t('change')} ${$t('year')}` }}</TooltipBase>
				</BtnBaseGroup>
			</div>
		</div>
		<q-separator />
		<q-tabs
			v-model="tab"
			:no-caps="true"
			align="justify"
			active-bg-color="secondary"
			indicator-color="secondary"
			class="bg-grey-8 text-white"
		>
			<q-tab name="year" :label="$t('yearly')" />
			<q-tab name="apiary" :label="$t('apiary', 2)" />
			<q-tab name="type" :label="$t('type', 2)" />
		</q-tabs>
		<q-tab-panels v-model="tab" animated>
			<q-tab-panel name="year" class="no-padding">
				<StatisticTaskYear :kind="kind" />
			</q-tab-panel>
			<q-tab-panel name="apiary" class="no-padding">
				<StatisticTaskApiary :kind="kind" />
			</q-tab-panel>
			<q-tab-panel name="type" class="no-padding">
				<StatisticTaskType :kind="kind" />
			</q-tab-panel>
		</q-tab-panels>
	</q-card>
</template>
