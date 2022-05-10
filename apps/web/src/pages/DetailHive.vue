<template>
  <q-card>
    <q-card-section>
      <global-loading v-if="isLoading"></global-loading>
      <div v-else-if="!data" class="row">
        <div class="col-12 text-h5">{{ $t('error404') }}</div>
      </div>
      <div v-else class="row">
        <!-- Hive Header -->
        <div class="col-12 col-md-6">
          <div class="row">
            <div class="col-12 text-h5">
              {{ $t('colony') }}:
              <b style="cursor: pointer" @click="openForm('hive', data.id)">
                {{ data.name }}
              </b>
            </div>
            <div class="col-12 q-gutter-xs">
              <q-chip
                v-if="data.grouphive && data.grouphive > 1"
                color="info"
                text-color="black"
                :label="`
                ${$t('hive', 2)}:
                ${data.grouphive}
              `"
              />
              <q-chip
                v-if="!data.modus"
                color="negative"
                :label="`${$t('inactive')} (${useDate.displayFormat(
                  data.modus_date,
                  'date'
                )})`"
              />
              <q-chip
                v-if="data.hive_source"
                color="orange"
                text-color="black"
                :label="data.hive_source.name"
              />
              <q-chip
                v-if="data.hive_type"
                color="orange"
                text-color="black"
                :label="data.hive_type.name"
              />
            </div>
          </div>
        </div>
        <!-- Queen Header -->
        <div v-if="queen" class="col-12 col-md-6">
          <div class="col-12 text-h6">
            {{ $t('queen') }}:
            <b style="cursor: pointer" @click="openForm('queen', queen.id)">
              {{ queen.name }}
            </b>
          </div>
          <div class="col-12 q-gutter-xs">
            <q-chip
              v-if="!data.modus"
              color="negative"
              :label="`
                ${$t('inactive')}
                (${useDate.displayFormat(data.modus_date, 'date')})
              `"
            />
            <q-chip
              color="info"
              text-color="black"
              :label="`
                ${$t('birth')}:
                ${useDate.displayFormat(queen.date, 'date')}
                [${queen.mark_colour}]
              `"
            />
            <q-chip
              color="info"
              text-color="black"
              :label="`
                ${$t('queenMovedate')}:
                ${useDate.displayFormat(queen.move_date, 'date')}
              `"
            />
            <q-chip
              v-if="queen.mating"
              color="orange"
              text-color="black"
              :label="queen.mating.name"
            />
            <q-chip
              v-if="queen.race"
              color="orange"
              text-color="black"
              :label="queen.race.name"
            />
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { useMeta, useQuasar } from 'quasar';
import { useHiveQuery } from '~/composables/useQuery';
import DialogForm from '~/components/DialogForm.vue';
import { useDateFormat } from '~/composables/useDate';

const { t } = useI18n();
const $q = useQuasar();
const useDate = useDateFormat();

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});
const { isLoading, data, refetch } = useHiveQuery({ id: parseInt(props.id) });
const queen = computed(() => {
  return data.value
    ? data.value.queen_location
      ? data.value.queen_location.queen
      : null
    : null;
});

watch(data, () => console.log(data.value));

useMeta(() => {
  return {
    title: data.value
      ? `${t('hive')}: ${data.value.name} - b.tree`
      : t('hive') + ' - b.tree',
  };
});

function openForm(title: string, id: number) {
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title: title,
      form: title,
      maximized: true,
      ids: [id],
    },
  }).onOk(() => {
    refetch.value();
  });
}
</script>
