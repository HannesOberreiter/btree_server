<template>
  <div>
    <div v-if="isLoading || isLoadingTask">
      <global-loading></global-loading>
    </div>
    <div v-if="!isLoading">
      <div v-if="data">
        <b>{{ $t('hiveCard') }}: {{ data.name }}</b>
        ({{ $t('year') }}: {{ year }})
        <br />
        <span v-if="data.hive_location">
          [{{ data.hive_location.apiary_name }}]
        </span>
        <span v-if="data.note">({{ data.note }})</span>
        <div>
          <span v-if="data.hive_source"> {{ data.hive_source.name }}, </span>
          <span v-if="data.hive_type">{{ data.hive_type.name }}, </span>
          {{ $t('active') }}: {{ $t(data.modus + '') }}
          ,
          {{ $t('position') }}: {{ data.position }}
        </div>
        <div v-if="data.queen_location">
          <b>{{ $t('queen') }}:</b> {{ data.queen_location.queen_name }}
          {{ data.queen_location.queen_mark_colour }}, {{ $t('birth') }}:
          {{ useDate.displayFormat(data.queen_location.date) }}
          <div>
            <span v-if="data.queen_location.queen.race"
              >{{ data.queen_location.queen.race.name }},
            </span>
            <span v-if="data.queen_location.queen.mating"
              >{{ data.queen_location.queen.mating.name }},
            </span>

            {{ $t('active') }}: {{ $t(data.queen_location.queen_modus + '') }}
            <span v-if="data.queen_location.queen.note"
              ><br />{{ data.queen_location.queen.note }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!isLoadingTask">
      <div v-if="listData">
        <small>
          <ul>
            <li v-for="(item, index) in listData" :key="index">
              <span
                v-if="item.date === item.enddate || item.kind === 'movedate'"
              >
                {{ useDate.displayFormat(item.date) }}
              </span>
              <span v-else>
                {{ useDate.displayFormat(item.date) }} :
                {{ useDate.displayFormat(item.enddate) }}
              </span>
              <b>&nbsp;{{ $t(item.kind) }}</b>
              <span v-if="item.kind !== 'movedate'">
                <span v-if="item.disease">&nbsp;{{ item.disease.name }}</span>
                <span v-if="item.type">
                  &nbsp;{{ item.type.name }}
                  <span v-if="item.amount">: {{ item.amount }}</span>
                </span>
                &nbsp;({{ $t('done') }}: {{ $t(item.done + '') }})
                <div>
                  <div v-if="item.kind === 'checkup'">
                    <span>
                      {{ $t('queen') }}:
                      {{ $t(item.queen ? 'true' : 'false') }},
                      {{ $t('queencell', 2) }}:
                      {{ $t(item.queencells ? 'true' : 'false') }},
                      {{ $t('egg', 2) }}:
                      {{ $t(item.eggs ? 'true' : 'false') }},
                      {{ $t('cappedBrood') }}:
                      {{ $t(item.capped_brood ? 'true' : 'false') }}
                    </span>
                    <br />
                    <span>
                      {{ $t('rating.brood') }}: {{ item.brood }},
                      {{ $t('rating.calm_comb') }}: {{ item.calm_comb }},
                      {{ $t('rating.comb') }}: {{ item.comb }},
                      {{ $t('rating.pollen') }}: {{ item.pollen }},
                      {{ $t('rating.swarm') }}: {{ item.swarm }},
                      {{ $t('rating.temper') }}: {{ item.temper }}
                    </span>
                    <br />
                    <span>
                      {{ $t('frames.broodframes') }}: {{ item.broodframes }},
                      {{ $t('frames.emptyframes') }}: {{ item.emptyframes }},
                      {{ $t('frames.foundation') }}: {{ item.foundation }},
                      {{ $t('frames.honeyframes') }}: {{ item.honeyframes }}
                    </span>
                    <br />
                    <span>
                      {{ $t('temperature') }}: {{ item.temperature }},
                      {{ $t('strong') }}: {{ item.strong }}, {{ $t('varroa') }}:
                      {{ item.varroa }},
                    </span>
                  </div>
                  <div v-else-if="item.kind === 'treatment'">
                    <span v-if="item.vet"
                      >{{ $t('vet') }}: {{ item.vet.name }}&nbsp;</span
                    >
                    <span>
                      {{ $t('waitTime') }}: {{ item.wait }},
                      {{ $t('temperature') }}:
                      {{ item.temperature !== null ? item.temperature : '' }}
                    </span>
                  </div>
                  <div v-else-if="item.kind === 'harvest'">
                    <span>{{ $t('charge') }}: {{ item.charge }}&nbsp;</span>
                    <span>{{ $t('frame', 2) }}: {{ item.frames }}&nbsp;</span>
                    <span>{{ $t('water') }}: {{ item.water }}&nbsp;</span>
                  </div>
                </div>
                <div v-if="item.note">{{ item.note }}</div>
              </span>
              <span v-else> &nbsp;{{ item.apiary.name }} </span>
            </li>
          </ul>
        </small>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { orderBy } from 'lodash';

function buildList(data: any) {
  const array: any[] = [];
  for (const prop in data) {
    array.push(...data[prop]);
  }
  const sortedArray = orderBy(
    array,
    function (o) {
      return new Date(o.date);
    },
    'desc'
  );
  return sortedArray;
}
</script>

<script setup lang="ts">
import { useHiveQuery } from '~/composables/useQuery';
import { useHiveTaskQuery } from '~/composables/useQuery';
import { useDateFormat } from '~/composables/useDate';

const useDate = useDateFormat();
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    default: new Date().getFullYear(),
  },
});

const emits = defineEmits(['loaded']);

const { id, year } = toRefs(props);

const { isLoading, data } = useHiveQuery({ id: id });
const { isLoading: isLoadingTask, data: dataTask } = useHiveTaskQuery({
  id: id,
  year: year,
  apiary: false,
});

watch(
  [isLoading, isLoadingTask],
  () => {
    if (!isLoading.value && !isLoadingTask.value) emits('loaded');
  },
  { immediate: true }
);

const listData = computed(() => {
  if (dataTask.value) {
    return buildList(dataTask.value);
  } else {
    return null;
  }
});
</script>
