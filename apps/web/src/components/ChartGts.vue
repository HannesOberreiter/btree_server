<script setup lang="ts">
import type { EChartsOption } from 'echarts/types/dist/echarts';
import type { Ref } from 'vue';
import dayjs from 'dayjs';
import { LineChart } from 'echarts/charts';
import {
	DataZoomComponent,
	GridComponent,
	LegendComponent,
	TitleComponent,
	ToolboxComponent,
	TooltipComponent,
} from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useQuasar } from 'quasar';
import { computed, toRef, watch } from 'vue';
import VChart from 'vue-echarts';
import { useI18n } from 'vue-i18n';
import { useGtsQuery } from '../composables/useQuery';
import GlobalLoading from './GlobalLoading.vue';

const props = defineProps<{
	apiaryId: number;
	year: number;
}>();

const $q = useQuasar();

use([
	CanvasRenderer,
	LineChart,
	TooltipComponent,
	GridComponent,
	DataZoomComponent,
	TitleComponent,
	ToolboxComponent,
	LegendComponent,
]);

const { t } = useI18n();

const apiaryIdRef = toRef(props, 'apiaryId') as Ref<number>;
const yearRef = toRef(props, 'year') as Ref<number>;

const { isLoading, data, refetch } = useGtsQuery(apiaryIdRef, {
	year: yearRef,
});

const chartOption = computed<EChartsOption | null>(() => {
	if (!data.value) {
		return null;
	}

	const dailyData = data.value.daily;

	return {
		title: {
			text: t('gts_chart_title'),
			left: $q.platform.is.mobile ? 'left' : 'center',
			textStyle: {
				fontSize: $q.platform.is.mobile ? 10 : 18,
			},
			subtext: 'Weather data by Open-Meteo.com',
			sublink: 'https://open-meteo.com/',
			subtextStyle: {
				fontSize: $q.platform.is.mobile ? 8 : 12,
			},
		},
		grid: {
			top: $q.platform.is.mobile ? 80 : 100,
			left: 60,
			right: 60,
			bottom: 80,
		},
		tooltip: {
			trigger: 'axis',
			formatter: (params: any) => {
				const idx = params[0]?.dataIndex;
				const d = dailyData?.[idx];
				if (!d) {
					return '';
				}
				const date = dayjs(d.date).format('YYYY-MM-DD');
				return `
					${date}<br/>
					${t('cumulative_gts')}: <b>${d.cumulativeGts.toFixed(1)} °C</b><br/>
					${t('temperature')}: <b>${d.temperature.toFixed(1)} °C</b>
				`;
			},
		},
		xAxis: {
			type: 'time',
			name: t('date'),
		},
		yAxis: {
			type: 'value',
			name: 'GTS (°C)',
		},
		dataZoom: [
			{
				type: 'inside',
				start: 0,
				end: 100,
			},
			{
				start: 0,
				end: 100,
			},
		],
		toolbox: {
			feature: {
				dataZoom: {
					yAxisIndex: 'none',
				},
				restore: {},
				saveAsImage: {},
			},
		},
		series: [
			{
				name: t('cumulative_gts'),
				type: 'line',
				data: dailyData.map(d => [new Date(d.date), d.cumulativeGts]),
				smooth: true,
				areaStyle: {
					opacity: 0.3,
				},
			},
		],
	};
});

watch(yearRef, () => {
	refetch();
});
</script>

<template>
	<div>
		<GlobalLoading v-if="isLoading" />
		<div v-else-if="!data" class="text-center q-pa-md">
			{{ $t('error.noData') }}
		</div>
		<div v-else>
			<VChart
				v-if="chartOption"
				:option="chartOption"
				autoresize
				style="height: 400px"
			/>
		</div>
	</div>
</template>
