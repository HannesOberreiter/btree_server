<template>
  <q-card v-if="data" flat bordered>
    <v-chart
      :option="chart"
      :loading="!data"
      style="height: 60vh"
      class="bg-grey-1"
      :theme="$q.dark.isActive ? 'dark' : ''"
    />
  </q-card>
</template>

<script setup lang="ts">
import { useApiFetch } from '~/composables/useApi';
import { useNotification } from '~/composables/useNotification';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import {
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';

use([
  CanvasRenderer,
  BarChart,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
]);

const api = useApiFetch();
const notification = useNotification();
const data = ref(null);
const chart = ref(null);
const { t } = useI18n();

await loadStats();

async function loadStats() {
  await api.get('/v1/statistic/hive_count').then(
    (response) => {
      data.value = response;
      renderChart();
    },
    (error) => notification.open('negative', error)
  );
}

function renderChart() {
  const x = data.value.map((o: any) => `${o.year} (Q ${o.quarter})`);
  const year = data.value.map((o: any) => `${o.year}`);
  const y = data.value.map((o: any) => {
    return {
      value: o.total,
      itemStyle: { color: o.year % 2 == 0 ? '#ef6c00' : '#546e7a' },
    };
  });

  chart.value = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c}',
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
        start: 0,
        end: 50,
      },
    ],
    series: [
      {
        name: t('hive', 2),
        data: y,
        type: 'bar',
      },
    ],
  };
}
</script>
