<script setup lang="ts">
import { BarChart } from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  ToolboxComponent,
  TooltipComponent
} from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { onMounted, ref, watch } from 'vue';
import VChart from 'vue-echarts';
import { useI18n } from 'vue-i18n';
import { useApiFetch } from '../composables/useApi';
import { useDateFormat } from '../composables/useDate';
import { useNotification } from '../composables/useNotification';
import FormInputDate from './FormInputDate.vue';

use([
  CanvasRenderer,
  BarChart,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  ToolboxComponent
]);

const api = useApiFetch();
const notification = useNotification();
const useDate = useDateFormat();
const data = ref<any>(null);
const chart = ref(null);
const date = ref(useDate.isoFormat(useDate.getCurrent(), 'date'));
const { t } = useI18n();

onMounted(async () => {
  await loadStats();
});

watch(date, () => {
  loadStats();
});

async function loadStats() {
  await api.get('/v1/statistic/hive_count_apiary', { date: date.value }).then(
    response => {
      data.value = response;
      renderChart();
    },
    error => notification.open('negative', error)
  );
}

function renderChart() {
  const x = data.value.map((o: any) => o.name);
  let alternate = true;
  const y = data.value.map((o: any) => {
    alternate = !alternate;
    return {
      value: o.total,
      itemStyle: { color: '#2b957a' }
    };
  });

  const options = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c}'
    },
    toolbox: {
      feature: {
        saveAsImage: {
          name: `${new Date().toISOString()}_hive_count_apiary`
        }
      }
    },
    yAxis: {
      type: 'value'
    },
    xAxis: [
      {
        type: 'category',
        position: 'bottom',
        data: x,
        axisLabel: {
          show: true,
          interval: 0,
          rotate: 45
        },
        axisTick: {
          show: true,
          interval: 0
        }
      }
    ],
    grid: {
      bottom: 100
    },
    series: [
      {
        name: t('hive', 2),
        data: y,
        type: 'bar',
        label: {
          position: 'top',
          formatter: '{c}',
          show: true
        }
      }
    ]
  } as any;

  if (x.length > 5) {
    options.dataZoom = [
      {
        start: 0,
        end: 50,
        type: 'slider',
        top: 'top'
      }
    ];
  }

  chart.value = options;
}
</script>

<template>
  <FormInputDate v-model="date" />
  <q-card flat bordered>
    <VChart
      v-if="chart"
      :loading="!data"
      :option="chart"
      autoresize
      style="height: 60vh"
      class="bg-grey-1"
      :theme="$q.dark.isActive ? 'dark' : ''"
    />
  </q-card>
</template>
