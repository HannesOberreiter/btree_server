<script setup lang="ts">
import type { EChartsOption } from 'echarts/types/dist/echarts';
import type { Ref } from 'vue';
import { useQueries } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import { LineChart } from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent
} from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useQuasar } from 'quasar';
import { computed, toRef } from 'vue';
import VChart from 'vue-echarts';
import { useI18n } from 'vue-i18n';
import { useApiFetch } from '../composables/useApi';
import GlobalLoading from './GlobalLoading.vue';

interface GtsResponse {
  daily: Array<{
    date: string;
    temperature: number;
    dailyGts: number;
    cumulativeGts: number;
  }>;
  totalGts: number;
  period: {
    start: string;
    end: string;
    days: number;
  };
  apiary: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
  };
}

const props = defineProps<{
  apiaryId: number;
  years: number[];
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
  LegendComponent
]);

const { t } = useI18n();

const apiaryIdRef = toRef(props, 'apiaryId') as Ref<number>;
const yearsRef = toRef(props, 'years') as Ref<number[]>;

const api = useApiFetch();
const queries = useQueries({
  queries: computed(() =>
    yearsRef.value.map(year => ({
      queryKey: ['gts', apiaryIdRef.value, year],
      queryFn: () => {
        const payload = { year };
        return api.get(
          `/v1/service/gruenlandtemperatursumme/${apiaryIdRef.value}`,
          payload
        );
      },
      retry: 2
    }))
  ),
  combine: results => {
    return {
      data: results.map((result, index) => ({
        year: yearsRef.value[index],
        data: result.data as GtsResponse | undefined,
        isLoading: result.isLoading
      })),
      isLoading: results.some(result => result.isLoading)
    };
  }
});

const isLoading = computed(() => queries.value.isLoading);

const allData = computed(() =>
  queries.value.data
    .filter((q: any) => q.data)
    .map((q: any) => ({
      year: q.year,
      data: q.data as GtsResponse
    }))
);

const chartOption = computed<EChartsOption | null>(() => {
  if (allData.value.length === 0) {
    return null;
  }

  // Use a common year (2000) for all series to make them overlap
  const normalizeYear = 2000;

  const series = allData.value.map(({ year, data }: any) => ({
    name: `${year}`,
    type: 'line' as const,
    data: data.daily.map((d: any) => {
      const originalDate = new Date(d.date);
      // Keep month and day, but use normalized year
      const normalizedDate = new Date(
        normalizeYear,
        originalDate.getMonth(),
        originalDate.getDate()
      );
      return [normalizedDate, d.cumulativeGts];
    }),
    smooth: true,
    areaStyle: {
      opacity: 0.1
    }
  }));

  return {
    title: {
      text: t('gts_chart_title'),
      left: $q.platform.is.mobile ? 'left' : 'center',
      textStyle: {
        fontSize: $q.platform.is.mobile ? 10 : 18
      },
      subtext: 'Weather data by Open-Meteo.com',
      sublink: 'https://open-meteo.com/',
      subtextStyle: {
        fontSize: $q.platform.is.mobile ? 8 : 12
      }
    },
    legend: {
      data: series.map((s: any) => s.name),
      top: $q.platform.is.mobile ? 60 : 80
    },
    grid: {
      top: $q.platform.is.mobile ? 120 : 140,
      left: 60,
      right: 60,
      bottom: 80
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!params || params.length === 0) {
          return '';
        }
        const date = dayjs(params[0].value[0]).format('MMM DD');
        let result = `${date}<br/>`;
        params.forEach((param: any) => {
          const value = param.value[1];
          result += `${param.seriesName}: <b>${value.toFixed(1)} °C</b><br/>`;
        });
        return result;
      }
    },
    xAxis: {
      type: 'time',
      name: t('date'),
      axisLabel: {
        formatter: (value: number) => {
          return dayjs(value).format('MMM DD');
        }
      }
    },
    yAxis: {
      type: 'value',
      name: 'GTS (°C)'
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100
      }
    ],
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: 'none'
        },
        restore: {},
        saveAsImage: {}
      }
    },
    series
  };
});
</script>

<template>
  <div>
    <GlobalLoading v-if="isLoading" />
    <div v-else-if="allData.length === 0" class="text-center q-pa-md">
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
