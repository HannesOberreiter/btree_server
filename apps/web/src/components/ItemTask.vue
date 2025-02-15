<template>
  <q-expansion-item ref="element" v-model="model" expand-separator dense
    :expand-icon-class="$q.screen.gt.xs ? '' : 'hidden'">
    <template #header>
      <q-item-section avatar>
        <q-avatar :icon="icons[task.kind as keyof typeof icons]" :color="color[task.kind as keyof typeof color]"
          text-color="white" :size="$q.screen.gt.xs ? 'md' : 'sm'" />
      </q-item-section>
      <q-item-section>
        {{ createLabel(task) }}
        <br />
        <span class="text-caption">
          {{ createCaption(task) }}
        </span>
      </q-item-section>
      <q-item-section side>
        <div v-if="task.kind !== 'movedate'" class="row items-right">
          <btn-base v-if="status" flat icon="fas fa-check-circle" color="positive"
            :class="$q.screen.gt.xs ? '' : 'q-pa-xs'" @click.stop="updateStatus(task.id)"></btn-base>
          <btn-base v-else flat icon="fas fa-times-circle" color="negative" :class="$q.screen.gt.xs ? '' : 'q-pa-xs'"
            @click.stop="updateStatus(task.id)"></btn-base>
        </div>
      </q-item-section>
    </template>

    <q-card>
      <q-card-section class="q-pt-xs q-pb-xs q-pl-sm q-pr-sm">
        <div class="row">
          <div v-if="task.kind === 'harvest'" class="col-12">
            <div v-if="task.charge">
              <b>{{ $t('charge') }}:</b> {{ task.charge }}
            </div>
            <div v-if="fields.settings.harvest.water && task.water > 0">
              <b>{{ $t('water') }}:</b> {{ task.water }}
            </div>
          </div>
          <div v-else-if="task.kind === 'treatment'" class="col-12">
            <div v-if="task.vet && fields.settings.treatment.vet">
              <b>{{ $t('vet') }}:</b> {{ task.vet.name }}
              <span v-if="task.vet.note">({{ task.vet.note }})</span>
            </div>
            <div v-if="fields.settings.treatment.wait">
              <b>{{ $t('waitTime') }}:</b> {{ task.wait }}
            </div>
            <div v-if="fields.settings.treatment.temperature">
              <b>{{ $t('temperature') }}:</b> {{ task.temperature }} °C
            </div>
          </div>
          <div v-else-if="task.kind === 'checkup'" class="col-12">
            <div v-if="fields.someCheckboxTrue">
              <q-chip v-if="fields.settings.checkup.checkboxes.queen" :color="task.queen ? 'positive' : 'negative'"
                text-color="white">
                {{ t('queen') }}
              </q-chip>
              <q-chip v-if="fields.settings.checkup.checkboxes.queencells"
                :color="task.queencells ? 'positive' : 'negative'" text-color="white">
                {{ t('queencell', 2) }}
              </q-chip>
              <q-chip v-if="fields.settings.checkup.checkboxes.capped_brood"
                :color="task.capped_brood ? 'positive' : 'negative'" text-color="white">
                {{ t('cappedBrood') }}
              </q-chip>
              <q-chip v-if="fields.settings.checkup.checkboxes.eggs" :color="task.eggs ? 'positive' : 'negative'"
                text-color="white">
                {{ t('egg', 2) }}
              </q-chip>
            </div>
            <div v-if="
              task.brood ||
              task.calm_comb ||
              task.comb ||
              task.pollen ||
              task.swarm ||
              task.temper
            ">
              <b>{{ $t('rating.name') }}: </b>
              <span v-if="task.brood">
                {{ $t('rating.brood') }} ({{ task.brood }})
              </span>
              <span v-if="task.calm_comb">
                {{ $t('rating.calm_comb') }} ({{ task.calm_comb }})
              </span>
              <span v-if="task.comb">
                {{ $t('rating.comb') }} ({{ task.comb }})
              </span>
              <span v-if="task.pollen">
                {{ $t('rating.pollen') }} ({{ task.pollen }})
              </span>
              <span v-if="task.swarm">
                {{ $t('rating.swarm') }} ({{ task.swarm }})
              </span>
              <span v-if="task.temper">
                {{ $t('rating.temper') }} ({{ task.temper }})
              </span>
            </div>
            <div v-if="
              task.broodframes ||
              task.honeyframes ||
              task.foundation ||
              task.emptyframes
            ">
              <b>{{ $t('frame', 2) }}: </b>
              <span v-if="task.broodframes">
                {{ $t('frames.broodframes') }} ({{ task.broodframes }})
              </span>
              <span v-if="task.honeyframes">
                {{ $t('frames.honeyframes') }} ({{ task.honeyframes }})
              </span>
              <span v-if="task.emptyframes">
                {{ $t('frames.emptyframes') }} ({{ task.emptyframes }})
              </span>
              <span v-if="task.foundation">
                {{ $t('frames.foundation') }} ({{ task.foundation }})
              </span>
            </div>
            <div v-if="task.strong && task.strong > 0">
              <b>{{ $t('strong') }}:</b> {{ task.strong }}
            </div>

            <div v-if="task.weight">
              <b>{{ $t('weight') }}:</b>
              {{ task.weight }}
              ({{ useDate.displayFormat(task.time, 'time', 'HH:mm:ss') }})
            </div>
            <div v-if="fields.settings.checkup.varroa">
              <b>{{ $t('varroa') }}:</b> {{ task.varroa }}
            </div>
            <div v-if="fields.settings.checkup.temperature">
              <b>{{ $t('temperature') }}:</b> {{ task.temperature }} °C
            </div>
          </div>

          <div v-if="task.url" class="col-12">
            <div style="cursor: pointer" @click="showFile(task.url as string)">
              <b>{{ $t('url') }}:</b> {{ task.url }}
            </div>
          </div>
          <div v-if="task.note" class="col-12">
            <b>{{ $t('note') }}: </b>
            <pre>{{ task.note }}</pre>
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <btn-base-group>
          <btn-base outline color="secondary" icon="fas fa-pen" @click="onEdit(task.id, task.kind)">
            <tooltip-base>{{ $t('edit') }}</tooltip-base>
          </btn-base>
          <btn-base outline color="negative" icon="fas fa-trash" @click="onDelete(task.id, task.kind)">
            <tooltip-base>{{ $t('delete') }}</tooltip-base>
          </btn-base>
        </btn-base-group>
        <span v-if="task.creator || task.editor" class="text-caption absolute-bottom-left">
          {{ createUserInfo(task) }}
        </span>
      </q-card-actions>
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
const icons = {
  checkup: 'fas fa-search-plus',
  treatment: 'fas fa-kit-medical',
  harvest: 'fas fa-droplet',
  feed: 'fas fa-cube',
  movedate: 'fas fa-truck',
};

const color = {
  checkup: 'info',
  treatment: 'negative',
  harvest: 'orange',
  feed: 'green',
  movedate: 'grey',
};
</script>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useApiFetch } from '../composables/useApi';
import { useDateFormat } from '../composables/useDate';
import { useNotification } from '../composables/useNotification';
import DialogForm from './DialogForm.vue';
import DialogFileShow from './DialogFileShow.vue';
import { useFieldsettingStore } from '../stores/fieldsetting';
import BtnBase from './BtnBase.vue';
import BtnBaseGroup from './BtnBaseGroup.vue';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TooltipBase from './TooltipBase.vue';

const fields = useFieldsettingStore();
const $q = useQuasar();
const useDate = useDateFormat();
const api = useApiFetch();
const notification = useNotification();
const { t } = useI18n();
const element = ref(null);
const emit = defineEmits(['refetch']);
const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
  opened: {
    default: false,
  },
  apiary: {
    default: false,
  },
});
const model = ref(false);
const status = ref(props.task.done);

watch(
  () => props.opened,
  () => {
    model.value = props.opened;
  },
);

function updateStatus (id: number) {
  const data = JSON.stringify({
    status: !status.value,
    ids: [id],
  });
  api.patch(`/v1/${props.task.kind}/status`, data).then(
    (_response: any) => {
      notification.open('positive', '');
      status.value = !status.value;
      emit('refetch');
    },
    (error) => {
      notification.open('negative', error);
    },
  );
}

function createLabel (task: any) {
  let type = task.type ? task.type.name : '-';
  if (task.kind === 'treatment' && task.disease)
    type += ` (${task.disease.name})`;
  if (task.kind === 'movedate') type = t('movedate');

  let amount =
    task.kind !== 'checkup' && task.kind !== 'movedate' ? task.amount : '';
  if (task.kind === 'harvest' && task.frames > 0)
    amount += ` - ${t('frame', 2)}: ${task.frames}`;

  return task.kind === 'checkup' || task.kind === 'movedate'
    ? `${type}`
    : `${type}: ${amount}`;
}

function createCaption (task: any) {
  const date =
    task.date === task.enddate || task.kind === 'movedate'
      ? useDate.displayFormat(task.date)
      : useDate.displayFormat(task.date) +
      ' - ' +
      useDate.displayFormat(task.enddate);
  let apiary = '';
  if (task.apiary || task[`${task.kind}_apiary`])
    apiary =
      task.kind === 'movedate'
        ? task.apiary.name
        : task[`${task.kind}_apiary`].apiary_name;
  if (props.apiary) {
    return `${date} [${t('hive')}: ${task.hive.name}]`;
  } else {
    return `${date} [${t('apiary')}: ${apiary}]`;
  }
}

function createUserInfo (task: any) {
  const creator = task.creator
    ? task.creator.username
      ? task.creator.username
      : task.creator.email
    : '';
  const editor = task.editor
    ? task.editor.username
      ? task.editor.username
      : task.editor.email
    : '';

  if (creator === editor) {
    return `${t('user')}: ${creator}`;
  } else {
    return !editor
      ? `${t('created')}: ${creator}`
      : `${t('created')}: ${creator}, ${t('updated')}: ${editor}`;
  }
}

function onEdit (id: number, kind: string) {
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title: 'edit',
      form: kind,
      maximized: true,
      ids: [id],
    },
  }).onOk(() => emit('refetch'));
}

function onDelete (id: number, kind: string) {
  $q.dialog({
    title: t('delete'),
    message: t('deleteConfirm'),
    cancel: true,
  }).onOk(async () => {
    await api.patch(`/v1/${kind}/batchDelete`, { ids: [id] }).then(
      (response: any) => {
        if (response === 0) notification.open('warning', 'notAllowed');
        else notification.open('positive', 'deleted');
        emit('refetch');
      },
      (error) => {
        notification.open('negative', error);
      },
    );
  });
}

function showFile (value: string) {
  if (value && value !== '') {
    $q.dialog({
      component: DialogFileShow,
      componentProps: {
        value: value,
      },
    });
  }
}
</script>
