<script setup lang="ts">
import { BarChart } from 'echarts/charts';
import {
	DataZoomComponent,
	GridComponent,
	TitleComponent,
	ToolboxComponent,
	TooltipComponent,
} from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { round } from 'lodash-es';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import VChart from 'vue-echarts';
import { useI18n } from 'vue-i18n';
import { useStatisticType } from '../composables/useQuery';
import { deepUnref } from '../helpers/deep-unref';
import { useTableFilterStore } from '../stores/tableFilter';
import GlobalLoading from './GlobalLoading.vue';

const props = defineProps({
	kind: {
		type: String,
		required: true,
	},
});

use([
	CanvasRenderer,
	BarChart,
	TooltipComponent,
	GridComponent,
	DataZoomComponent,
	TitleComponent,
	ToolboxComponent,
]);

const STATSSTORE = `statistic_${props.kind}`;

const storeFilter = useTableFilterStore();
const store = storeToRefs(storeFilter);

const tab = ref('total');
const { t } = useI18n();
const chart_total = ref<any>(null);
const chart_average = ref<any>(null);
const chart_water = ref<any>(null);
const chart_frames_total = ref<any>(null);
const chart_frames_average = ref<any>(null);

const { isLoading, data: query } = useStatisticType(props.kind, {
	filters: computed(() =>
		store[STATSSTORE]?.value ? store[STATSSTORE].value : '',
	),
});

const yearText = computed(() => {
	const store = storeFilter.field(STATSSTORE, 'year');
	return store
		? store === 'empty'
			? t('allYears')
			: store
		: new Date().getFullYear();
});

watch(
	query,
	() => {
		if (query.value) {
			chart_total.value = renderChart('amount_sum', t('total'), [
				...deepUnref(query.value),
			]);
			chart_average.value = renderChart('amount_avg', t('average'), [
				...deepUnref(query.value),
			]);
			if (props.kind === 'harvest') {
				chart_frames_total.value = renderChart(
					'frames_sum',
					`${t('frame', 2)} ${t('total')}`,
					[...deepUnref(query.value)],
				);
				chart_frames_average.value = renderChart(
					'frames_avg',
					`${t('frame', 2)} ${t('average')}`,
					[...deepUnref(query.value)],
				);
				chart_water.value = renderChart(
					'water_avg',
					`${t('water')} ${t('average')}`,
					[...deepUnref(query.value)],
				);
			}
		}
	},
	{
		immediate: true,
	},
);

function renderChart(
	col: 'amount_sum' | 'amount_avg' | 'water_avg' | 'frames_sum' | 'frames_avg',
	titleText: string,
	data: any,
) {
	const title = `${t('type', 2)} ${titleText} (${yearText.value})`;
	const x = data.map(
		(o: any) => `${o.type ? o.type.name : t('deleted')} (${o.hive_count})`,
	);
	const y = data.map((o: any) => {
		return {
			value: round(o[col], 1),
			itemStyle: { color: '#2b957a' },
		};
	});

	const chart = {
		title: {
			text: title,
			textAlign: 'auto',
		},
		tooltip: {
			trigger: 'item',
			formatter: '{a} <br/>{b} : {c}',
		},
		toolbox: {
			feature: {
				saveAsImage: {
					name: `${new Date().toISOString()}_${title}`,
				},
			},
		},
		yAxis: {
			type: 'value',
		},
		xAxis: [
			{
				type: 'category',
				position: 'bottom',
				data: x,
				axisLabel: {
					interval: 0,
					formatter(params: string, index: number) {
						if (index % 2 !== 0) {
							return `\n${params}`;
						}
						else {
							return params;
						}
					},
				},
				axisTick: {
					show: false,
				},
				splitLine: {
					show: false,
				},
			},
		],
		series: [
			{
				name: title,
				data: y,
				type: 'bar',
				label: {
					position: 'inside',
					formatter: '{c}',
					show: true,
				},
			},
		],
	} as any;
	if (x.length > 5) {
		chart.dataZoom = [
			{
				start: 50,
				end: 100,
				top: 'top',
				left: '50%',
				right: 10,
			},
		];
	}
	return chart;
}
</script>

<template>
	<GlobalLoading v-if="isLoading" />
	<div v-else>
		<q-tabs
			v-model="tab"
			dense
			:no-caps="true"
			active-color="primary"
			indicator-color="primary"
			align="justify"
		>
			<q-tab name="total" :label="$t('total')" />
			<q-tab name="average" :label="$t('average')" />
			<q-tab
				v-if="props.kind === 'harvest'"
				name="water"
				:label="$t('water')"
			/>
			<q-tab
				v-if="props.kind === 'harvest'"
				name="frames_total"
				:label="`${$t('frame', 2)} ${$t('total')}`"
			/>
			<q-tab
				v-if="props.kind === 'harvest'"
				name="frames_average"
				:label="`${$t('frame', 2)} ${$t('average')}`"
			/>
		</q-tabs>
		<q-tab-panels v-model="tab" animated>
			<q-tab-panel name="total">
				<q-card flat bordered>
					<VChart
						:option="chart_total"
						:loading="!chart_total"
						autoresize
						style="height: 60vh"
						class="bg-grey-1"
						:theme="$q.dark.isActive ? 'dark' : ''"
					/>
				</q-card>
			</q-tab-panel>
			<q-tab-panel name="average">
				<q-card flat bordered>
					<VChart
						:option="chart_average"
						:loading="!chart_average"
						autoresize
						style="height: 60vh"
						class="bg-grey-1"
						:theme="$q.dark.isActive ? 'dark' : ''"
					/>
				</q-card>
			</q-tab-panel>
			<q-tab-panel name="water">
				<q-card flat bordered>
					<VChart
						:option="chart_water"
						:loading="!chart_water"
						autoresize
						style="height: 60vh"
						class="bg-grey-1"
						:theme="$q.dark.isActive ? 'dark' : ''"
					/>
				</q-card>
			</q-tab-panel>
			<q-tab-panel name="frames_total">
				<q-card flat bordered>
					<VChart
						:option="chart_frames_total"
						:loading="!chart_frames_total"
						autoresize
						style="height: 60vh"
						class="bg-grey-1"
						:theme="$q.dark.isActive ? 'dark' : ''"
					/>
				</q-card>
			</q-tab-panel>
			<q-tab-panel name="frames_average">
				<q-card flat bordered>
					<VChart
						:option="chart_frames_average"
						:loading="!chart_frames_average"
						autoresize
						style="height: 60vh"
						class="bg-grey-1"
						:theme="$q.dark.isActive ? 'dark' : ''"
					/>
				</q-card>
			</q-tab-panel>
		</q-tab-panels>
	</div>
</template>
