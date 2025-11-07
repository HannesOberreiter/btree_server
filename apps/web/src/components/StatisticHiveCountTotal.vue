<script setup lang="ts">
import { BarChart } from 'echarts/charts';
import {
	DataZoomComponent,
	GridComponent,
	ToolboxComponent,
	TooltipComponent,
} from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { ref } from 'vue';
import VChart from 'vue-echarts';
import { useI18n } from 'vue-i18n';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';

use([
	CanvasRenderer,
	BarChart,
	TooltipComponent,
	GridComponent,
	DataZoomComponent,
	ToolboxComponent,
]);

const api = useApiFetch();
const notification = useNotification();
const data = ref<any>(null);
const chart = ref<any>(null);
const { t } = useI18n();

await loadStats();

async function loadStats() {
	await api.get('/v1/statistic/hive_count_total').then(
		(response) => {
			data.value = response;
			renderChart();
		},
		error => notification.open('negative', error),
	);
}

function renderChart() {
	const x = data.value.map((o: any) => `${o.year} (Q ${o.quarter})`);
	const year = data.value.map((o: any) => `${o.year}`);
	const y = data.value.map((o: any) => {
		return {
			value: o.total,
			itemStyle: { color: o.year % 2 === 0 ? '#ef6c00' : '#546e7a' },
		};
	});

	chart.value = {
		tooltip: {
			trigger: 'item',
			formatter: '{a} <br/>{b} : {c}',
		},
		toolbox: {
			feature: {
				saveAsImage: {
					name: `${new Date().toISOString()}_hive_count_year`,
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
				splitLine: {
					show: true,
					interval: 3,
				},
			},
			{
				type: 'category',
				position: 'top',
				axisLabel: {
					interval: 3,
				},
				data: year,
			},
		],
		dataZoom: [
			{
				start: 50,
				end: 100,
			},
		],
		series: [
			{
				name: t('hive', 2),
				data: y,
				type: 'bar',
				label: {
					position: 'inside',
					formatter: '{c}',
					show: true,
				},
			},
		],
	};
}
</script>

<template>
	<q-card v-if="data" flat bordered>
		<VChart
			:option="chart"
			:loading="!data"
			autoresize
			style="height: 60vh"
			class="bg-grey-1"
			:theme="$q.dark.isActive ? 'dark' : ''"
		/>
	</q-card>
</template>
