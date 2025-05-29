<template>
  <q-card flat>
    <div class="row q-pa-sm justify-center">
      <div class="col-6">
        <div class="text-h5 text-left">
          {{ $t('statistic') }} {{ $t('scale.name') }}
        </div>
      </div>
      <div class="col-6 text-right">
        <form-dropdown-option
          v-model="scale_id"
          table="scale"
          allow-empty="filterEmpty"
        ></form-dropdown-option>
        <btn-base-group>
          <btn-base
            label="-"
            color="blue-5"
            @click="year = year - 1"
          ></btn-base>
          <btn-base
            label="+"
            color="blue-8"
            :disable="year > new Date().getFullYear()"
            @click="year = year + 1"
          ></btn-base>
          <tooltip-base>{{ $t('change') + ' ' + $t('year') }}</tooltip-base>
        </btn-base-group>
      </div>
    </div>
    <q-card-section>
      <global-loading v-if="isLoading"></global-loading>
      <div v-else>
        <div v-if="data.results">
          <v-chart
            :option="chartTimeseries"
            :loading="!chartTimeseries"
            :update-options="{ notMerge: true }"
            autoresize
            style="height: 60vh"
            class="bg-grey-1"
            :theme="$q.dark.isActive ? 'dark' : ''"
          />
        </div>
        <div v-else>
          {{ $t('error.noData') }}
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { useScaleDataQuery } from '../composables/useQuery';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import {
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  TitleComponent,
  ToolboxComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import round from 'lodash-es/round';
import { deepUnref } from '../helpers/deep-unref';
import BtnBase from '../components/BtnBase.vue';
import BtnBaseGroup from '../components/BtnBaseGroup.vue';
import FormDropdownOption from '../components/FormDropdownOption.vue';
import TooltipBase from '../components/TooltipBase.vue';
import GlobalLoading from '../components/GlobalLoading.vue';

import { useI18n } from 'vue-i18n';
import { ref, computed, watch, unref } from 'vue';

use([
  CanvasRenderer,
  LineChart,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  TitleComponent,
  ToolboxComponent,
]);

const { t } = useI18n();

const year = ref(new Date().getFullYear());
const scale_id = ref<any>(null);
const filter = computed(() => {
  const data = [
    {
      date: {
        from: year.value + '-01-01',
        to: year.value + '-12-31',
      },
    },
  ] as any;
  if (scale_id.value) {
    if (scale_id.value.value) {
      data.push({
        scale_id: unref(scale_id.value.value),
      });
    }
  }
  return JSON.stringify(data);
});
const chartTimeseries = ref<any>(null);

const { isLoading, data } = useScaleDataQuery({
  order: ['datetime'],
  direction: ['desc'],
  offset: 0,
  limit: 25000,
  q: '',
  filters: filter,
});

watch(
  [data, filter],
  () => {
    if (data.value)
      chartTimeseries.value = renderChart(
        deepUnref(data.value.results),
        unref(year.value),
      );
  },
  {
    immediate: true,
  },
);

function renderChart(data: any, year: number) {
  let scales = data.map((o: any) => o.scale.name);
  scales = [...new Set(scales)];
  const axis_data = [];
  for (const scale of scales) {
    const filtered = data.filter((o: any) => o.scale.name === scale);
    const clean = filtered.map((o: any) => [
      new Date(o.datetime),
      round(o['weight'], 1),
    ]);
    axis_data.push({
      name: scale,
      data: clean,
      type: 'line',
      symbol: 'none',
      areaStyle: {},
    });
  }

  const chart = {
    title: {
      text: t('weight') + ' - ' + year,
      textAlign: 'auto',
    },
    toolbox: {
      feature: {
        saveAsImage: {
          name: new Date().toISOString() + '_weight_' + year,
        },
      },
    },
    tooltip: {
      trigger: 'axis',
      position: function (pt: any) {
        return [pt[0], '10%'];
      },
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
    },
    series: axis_data,
  } as any;

  if (axis_data.length > 5) {
    chart['dataZoom'] = [
      {
        start: 80,
        end: 100,
      },
    ];
  }
  return chart;
}
</script>
