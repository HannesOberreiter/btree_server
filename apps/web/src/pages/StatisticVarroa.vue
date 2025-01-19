<script setup lang="ts">
import { computed, ref } from 'vue';
import { useApiFetch } from '../composables/useApi';
import FormDropdownHive from '../components/FormDropdownHive.vue';
import FormInputDates from '../components/FormInputDates.vue';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';
import type { QTableProps } from 'quasar';
import { useNotification } from '../composables/useNotification';
import { watchDebounced } from '@vueuse/core';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { ScatterChart } from 'echarts/charts';
import {
  TooltipComponent,
  DataZoomComponent,
  ToolboxComponent,
  LegendComponent,
  DatasetComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import { deepUnref } from '../helpers/deep-unref';
import type { EChartsOption } from 'echarts/types/dist/echarts';
import type { DatasetOption } from 'echarts/types/dist/shared';

use([
  CanvasRenderer,
  ScatterChart,
  TooltipComponent,
  DataZoomComponent,
  ToolboxComponent,
  LegendComponent,
  DatasetComponent,
]);

type ResultStats = {
  hive_name: string;
  varroa: {
    min: number;
    max: number;
    avg: number;
  };
};

type Response = {
  datasetCheckup: Record<string, any[]>;
  datasetTreatment: Record<string, any[]>;
  stats: ResultStats[];
};

const api = useApiFetch();
const notify = useNotification();
const { t } = useI18n();
const hive_id = ref<any>(null);
const chartTimeseries = ref<EChartsOption | any>(null);
const start_date = ref(dayjs().subtract(3, 'M').format('YYYY-MM-DD'));
const end_date = ref(dayjs().format('YYYY-MM-DD'));
const response = ref<Response | null>(null);

const queryParams = computed(() => {
  const hive_ids: number[] = [];
  if (hive_id.value) {
    hive_ids.push(...hive_id.value.map((item: any) => parseInt(item.id)));
  }
  const params = {
    start_date: start_date.value,
    end_date: end_date.value,
    hive_ids: hive_ids,
  };

  return params;
});

renderChart();

watchDebounced(
  queryParams,
  async () => {
    if (queryParams.value.hive_ids.length === 0) {
      response.value = {
        datasetCheckup: {},
        datasetTreatment: {},
        stats: [],
      };
    } else {
      response.value = await getResponse();
    }
    renderChart();
  },
  {
    debounce: 500,
    maxWait: 1000,
  },
);

async function getResponse() {
  try {
    if (hive_id.value && hive_id.value.length > 20) {
      notify.open('warning', t('maxHivesStatsVarroa', { max: 20 }), true);
    }
    const response = await api.get('/v1/statistic/varroa', queryParams.value);
    if (!response) {
      return {
        dataset: [],
        stats: [],
      };
    }
    return response;
  } catch (e) {
    notify.open('negative', e, false);
  }
}

const columns = [
  {
    name: 'hive',
    required: true,
    label: t('hive'),
    align: 'left',
    field: (row: ResultStats) => row.hive_name,
    sortable: true,
  },
  {
    name: 'min',
    required: true,
    label: t('min'),
    align: 'right',
    field: (row: ResultStats) => row.varroa.min,
    format: (v: number) => formatZero(v),
    sortable: true,
  },
  {
    name: 'max',
    required: true,
    label: t('max'),
    align: 'right',
    field: (row: ResultStats) => row.varroa.max,
    format: (v: number) => formatZero(v),
    sortable: true,
  },
  {
    name: 'avg',
    required: true,
    label: t('avg'),
    align: 'right',
    field: (row: ResultStats) => row.varroa.avg,
    format: (v: number) => formatZero(v),
    sortable: true,
  },
] as QTableProps['columns'];

function formatZero(value: number) {
  if (value === 0) {
    return '-';
  }
  return value;
}

function renderChart() {
  const data: Record<string, any[]> = response.value?.datasetCheckup
    ? deepUnref(response.value.datasetCheckup)
    : { 0: [[0, 0, '', '', '']] };

  let count = 0;
  const dataset: DatasetOption[] = [];
  const series: EChartsOption['series'] = [];

  Object.entries(data).forEach(([_key, value]) => {
    dataset[count] = {
      dimensions: ['HiveId', 'Varroa', 'Date', 'Type', 'Hive'],
      sourceHeader: false,
      source: value,
    };
    series[count] = {
      datasetIndex: count,
      name: value[0][4],
      type: 'scatter',
      symbolSize: 20,
      symbol: (params) => {
        if (params[1] > 0) return 'diamond';
        return 'circle';
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          return `${params.value[2].split('T')[0]} <br/> ${params.name}: ${
            params.value[3]
          } (${params.value[1]})`;
        },
      },
      encode: {
        x: 'Date',
        y: 'Varroa',
        tooltip: ['Varroa', 'Type'],
        itemName: 'Hive',
      },
    };
    count++;
  });

  if (response.value?.datasetTreatment) {
    let countTreatment = 0;
    const dataTreatment: Record<string, any[]> = deepUnref(
      response.value.datasetTreatment,
    );
    Object.entries(dataTreatment).forEach(([_key, value]) => {
      dataset[count] = {
        dimensions: ['HiveId', 'Amount', 'Date', 'Type', 'Hive', 'Dummy'],
        sourceHeader: false,
        source: value,
      };
      series[count] = {
        datasetIndex: count,
        name: value[0][4],
        type: 'scatter',
        symbol: 'triangle',
        symbolSize: 20,
        symbolOffset: [0, 10],
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            return `${params.value[2].split('T')[0]} <br/> ${params.name}: ${
              params.value[3]
            } (${params.value[1]})`;
          },
        },
        encode: {
          x: 'Date',
          y: 'Dummy',
          tooltip: ['Type', 'Amount'],
          tooltipName: 'Type',
          itemName: 'Hive',
          seriesIndex: countTreatment,
        },
      };
      countTreatment++;
      count++;
    });
  }

  const chart: EChartsOption = {
    dataset: dataset,
    colors: [
      '#1b9e77',
      '#d95f02',
      '#7570b3',
      '#e7298a',
      '#66a61e',
      '#e6ab02',
      '#a6761d',
      '#666666',
    ],
    legend: {},
    toolbox: {
      feature: {
        saveAsImage: {
          name: new Date().toISOString() + '_varroa',
        },
      },
    },
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        filterMode: 'none',
        bottom: 8,
      },
    ],
    tooltip: {
      trigger: 'axis',
      order: 'valueDesc',
      textStyle: {
        fontSize: 12,
      },
      axisPointer: {
        show: 'auto',
      },
      formatter: (params: any) => {
        let label = '';
        const orderedParams: any[] = [];
        params.forEach((param: any) => {
          if (param.value[param.encode.y[0]] > 0) {
            orderedParams.unshift(param);
          } else {
            orderedParams.push(param);
          }
        });

        for (let i = 0; i < params.length; i++) {
          const param = orderedParams[i];
          if (i === 0) {
            label += param.axisValueLabel.split(' ')[0];
          }
          const hive = param.seriesName;
          const type = param.value[3];
          const amount = param.value[1];
          label += `<br/> <b>${hive}</b>: ${type} (${amount})`;
        }
        return label;
      },
    },
    xAxis: {
      position: 'bottom',
      type: 'time',
      name: t('date'),
      axisLabel: {
        formatter: '{MMM} {dd}',
        hideOverlap: true,
      },
      offset: 7,
      boundaryGap: ['5%', '5%'],
    },
    yAxis: {
      type: 'value',
      name: t('varroa'),
      axisLabel: {
        showMinLabel: false,
      },
      min: -0.1,
      boundaryGap: [0, '5%'],
    },
    series: series,
  };

  chartTimeseries.value = chart as any;
}
</script>

<template>
  <q-card flat>
    <div class="row justify-center q-pb-sm">
      <div class="col-12 col-md-11 col-lg-10">
        <div class="text-body2 q-pb-sm text-center">
          {{ $t('varroa') }} {{ $t('statistic') }}
          <form-dropdown-hive v-model="hive_id"></form-dropdown-hive>
          <form-input-dates
            v-model:start-value="start_date"
            v-model:end-value="end_date"
            :update-on-change="false"
          ></form-input-dates>
        </div>
      </div>

      <q-card-section>
        <q-table
          :title="$t('varroaStatsTableHeader')"
          :rows="response?.stats || []"
          :columns="columns"
          row-key="hive"
          flat
        >
        </q-table>
      </q-card-section>

      <q-card-section style="width: 100%">
        <v-chart
          :option="chartTimeseries"
          :loading="!chartTimeseries"
          :update-options="{ notMerge: true, silent: false }"
          autoresize
          style="height: 500px"
          class="bg-grey-1"
          :theme="$q.dark.isActive ? 'dark' : ''"
        />
      </q-card-section>
    </div>
  </q-card>
</template>
