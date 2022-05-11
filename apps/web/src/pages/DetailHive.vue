<template>
  <q-card>
    <q-card-section v-if="isLoading">
      <global-loading v-if="isLoading"></global-loading>
    </q-card-section>
    <q-card-section v-else-if="!data">
      <div class="row">
        <div class="col-12 text-h5">{{ $t('error404') }}</div>
      </div>
    </q-card-section>
    <div v-else>
      <q-card-section>
        <btn-previous-next :data="data" link="hive"></btn-previous-next>
        <div class="row justify-center">
          <!-- Hive Header -->
          <div class="col-12 col-md-6 q-pt-sm">
            <q-expansion-item
              switch-toggle-side
              expand-separator
              icon="fas fa-house"
              header-class="text-h5"
              :label="`
                ${data.name} (${
                data.hive_location ? data.hive_location.apiary_name : ''
              })`"
            >
              <q-card>
                <q-card-section>
                  <div class="col-12 q-gutter-xs">
                    <q-chip
                      v-if="data.hive_source"
                      color="orange"
                      square
                      text-color="black"
                      :label="data.hive_source.name"
                    />
                    <q-chip
                      v-if="data.hive_type"
                      square
                      color="orange"
                      text-color="black"
                      :label="data.hive_type.name"
                    />
                    <q-chip
                      v-if="data.grouphive && data.grouphive > 1"
                      color="info"
                      square
                      text-color="black"
                      :label="`
                        ${$t('hive', 2)}:
                        ${data.grouphive}
                      `"
                    />
                    <q-chip
                      v-if="data.position && data.position > 0"
                      square
                      color="info"
                      text-color="black"
                      :label="`
                        ${$t('position')}:
                        ${data.position}
                      `"
                    />
                    <q-chip
                      v-if="!data.modus"
                      square
                      color="negative"
                      :label="`${$t('inactive')} (${useDate.displayFormat(
                        data.modus_date,
                        'date'
                      )})`"
                    />
                  </div>
                </q-card-section>
                <q-card-section v-if="data.note">
                  <pre>{{ data.note }}</pre>
                </q-card-section>
                <q-card-actions>
                  <btn-base
                    color="primary"
                    outline
                    @click="openForm('hive', data.id)"
                  >
                    {{ $t('edit') }}
                  </btn-base>
                </q-card-actions>
              </q-card>
            </q-expansion-item>
          </div>
        </div>
        <!-- Queen Header -->
        <div v-if="queen" class="row justify-center">
          <div class="col-12 col-md-6">
            <q-expansion-item
              switch-toggle-side
              expand-separator
              icon="fas fa-venus"
              header-class="text-h6"
              :label="queen.name"
            >
              <q-card>
                <q-card-section>
                  <div class="col-12 q-gutter-xs">
                    <q-chip
                      v-if="queen.mating"
                      square
                      color="orange"
                      text-color="black"
                      :label="queen.mating.name"
                    />
                    <q-chip
                      v-if="queen.race"
                      square
                      color="orange"
                      text-color="black"
                      :label="queen.race.name"
                    />

                    <q-chip
                      color="info"
                      text-color="black"
                      square
                      :label="`
                        ${$t('birth')}:
                        ${useDate.displayFormat(queen.date, 'date')}
                        [${queen.mark_colour}]
                      `"
                    />
                    <q-chip
                      square
                      color="info"
                      text-color="black"
                      :label="`
                        ${$t('queenMovedate')}:
                        ${useDate.displayFormat(queen.move_date, 'date')}
                      `"
                    />
                    <q-chip
                      v-if="!data.modus"
                      color="negative"
                      :label="`
                        ${$t('inactive')}
                        (${useDate.displayFormat(data.modus_date, 'date')})
                      `"
                    />
                  </div>
                </q-card-section>
                <q-card-section v-if="queen.note">
                  <pre>{{ queen.note }}</pre>
                </q-card-section>
                <q-card-actions>
                  <btn-base
                    outline
                    color="primary"
                    @click="openForm('queen', queen.id)"
                  >
                    {{ $t('edit') }}
                  </btn-base>
                </q-card-actions>
              </q-card>
            </q-expansion-item>
          </div>
        </div>
      </q-card-section>
      <q-card-section>
        <q-tabs
          v-model="tab"
          dense
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab name="task" :label="$t('task', 2)" />
          <q-tab name="info" :label="$t('info')" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="task">
            <div class="row">
              <div class="col-12 col-md-6">
                <q-select
                  v-model="year"
                  :options="years"
                  :label="$t('year')"
                ></q-select>
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  v-model="filter"
                  :options="KINDS"
                  :label="$t('filter')"
                  :option-label="(label) => $t(label)"
                ></q-select>
              </div>
            </div>
            <list-tasks :id="id" :year="year" :filter="filter"></list-tasks>
          </q-tab-panel>
          <q-tab-panel name="info"> Info </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </div>
  </q-card>
</template>

<script lang="ts">
import { KINDS } from '~/constants';
import { generateArrayOfYears } from '~/helpers';
const years = generateArrayOfYears();
</script>

<script setup lang="ts">
import { useMeta, useQuasar } from 'quasar';
import { useHiveQuery } from '~/composables/useQuery';
import DialogForm from '~/components/DialogForm.vue';
import { useDateFormat } from '~/composables/useDate';
import dayjs from 'dayjs';

const { t } = useI18n();
const $q = useQuasar();
const useDate = useDateFormat();
const tab = ref('task');
const year = ref(dayjs().year());
const filter = ref('filterEmpty');

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});
const id = toRef(props, 'id');
const { isLoading, data, refetch } = useHiveQuery({ id: id });

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
