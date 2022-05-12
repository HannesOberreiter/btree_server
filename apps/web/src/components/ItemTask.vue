<template>
  <q-expansion-item
    ref="element"
    v-model="model"
    expand-separator
    dense
    icon="fas fa-search-plus"
  >
    <template #header>
      <q-item-section avatar>
        <q-avatar
          :icon="icons[task.kind as keyof typeof icons]"
          :color="color[task.kind as keyof typeof color]"
          text-color="white"
        />
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
          <btn-base
            v-if="status"
            flat
            icon="fas fa-check-circle"
            color="positive"
            @click.stop="updateStatus(task.id)"
          ></btn-base>
          <btn-base
            v-else
            flat
            icon="fas fa-times-circle"
            color="negative"
            @click.stop="updateStatus(task.id)"
          ></btn-base>
        </div>
      </q-item-section>
    </template>

    <q-card>
      <q-card-section class="q-pt-xs q-pb-xs">
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
              <b>{{ $t('wait') }}:</b> {{ task.wait }}
            </div>
          </div>
          <div v-else-if="task.kind === 'checkup'" class="col-12">
            <div v-if="fields.settings.checkup.queen">
              <q-chip
                :color="task.queen ? 'positive' : 'negative'"
                text-color="white"
              >
                {{ t('queen') }}
              </q-chip>
              <q-chip
                :color="task.queencells ? 'positive' : 'negative'"
                text-color="white"
              >
                {{ t('queencell', 2) }}
              </q-chip>
              <q-chip
                :color="task.capped_brood ? 'positive' : 'negative'"
                text-color="white"
              >
                {{ t('cappedBrood') }}
              </q-chip>
              <q-chip
                :color="task.eggs ? 'positive' : 'negative'"
                text-color="white"
              >
                {{ t('egg', 2) }}
              </q-chip>
            </div>
            <div
              v-if="
                fields.settings.checkup.rating &&
                task.brood +
                  task.pollen +
                  task.comb +
                  task.temper +
                  task.calm_comb +
                  task.swarm >
                  0
              "
            >
              <b>{{ $t('rating.name') }}:</b>
              {{ $t('rating.brood') }} ({{ task.brood }}),
              {{ $t('rating.pollen') }} ({{ task.pollen }}),
              {{ $t('rating.comb') }} ({{ task.comb }}),
              {{ $t('rating.temper') }} ({{ task.temper }}),
              {{ $t('rating.calm_comb') }} ({{ task.calm_comb }}),
              {{ $t('rating.swarm') }} ({{ task.swarm }})
            </div>
            <div
              v-if="
                fields.settings.checkup.frames &&
                task.broodframes +
                  task.honeyframes +
                  task.foundation +
                  task.emptyframes >
                  0
              "
            >
              <b>{{ $t('frame', 2) }}:</b>
              {{ $t('frames.broodframes') }} ({{ task.broodframes }}),
              {{ $t('frames.honeyframes') }} ({{ task.honeyframes }}),
              {{ $t('frames.foundation') }} ({{ task.foundation }}),
            </div>
            <div v-if="fields.settings.checkup.strength && task.strong > 0">
              <b>{{ $t('strong') }}:</b> {{ task.strong }}
            </div>

            <div v-if="fields.settings.checkup.weight && task.weight > 0">
              <b>{{ $t('weight') }}:</b>
              {{ task.weight }}
              ({{ useDate.displayFormat(task.time, 'time', 'HH:mm:ss') }})
            </div>
            <div v-if="fields.settings.checkup.varroa">
              <b>{{ $t('varroa') }}:</b> {{ task.varroa }}
            </div>
            <b>{{ $t('temperature') }}:</b> {{ task.temp }} °C
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
      <q-card-actions>
        <btn-base-group>
          <btn-base
            outline
            color="secondary"
            @click="onEdit(task.id, task.kind)"
          >
            {{ $t('edit') }}
          </btn-base>
          <btn-base
            outline
            color="negative"
            @click="onDelete(task.id, task.kind)"
          >
            {{ $t('delete') }}
          </btn-base>
        </btn-base-group>
      </q-card-actions>
      <div
        v-if="task.creator || task.editor"
        class="text-caption absolute-bottom-right"
      >
        {{ createUserInfo(task) }}
      </div>
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
import { useApiFetch } from '~/composables/useApi';
import { useDateFormat } from '~/composables/useDate';
import { useNotification } from '~/composables/useNotification';
import DialogForm from './DialogForm.vue';
import DialogFileShow from './DialogFileShow.vue';
import { useFieldsettingStore } from '~/stores/fieldsetting';

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
});
const model = ref(false);
const status = ref(props.task.done);

watch(
  () => props.opened,
  () => {
    model.value = props.opened;
  }
);

function updateStatus(id: number) {
  const data = JSON.stringify({
    status: !status.value,
    ids: [id],
  });
  api.patch(`/v1/${props.task.kind}/status`, data).then(
    (_response: any) => {
      notification.open('positive', '');
      status.value = !status.value;
    },
    (error) => {
      notification.open('negative', error);
    }
  );
}

function createLabel(task: any) {
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

function createCaption(task: any) {
  const date =
    task.date === task.enddate || task.kind === 'movedate'
      ? useDate.isoFormat(task.date)
      : useDate.isoFormat(task.date) + ' - ' + useDate.isoFormat(task.enddate);
  let apiary = '';
  if (task.apiary || task[`${task.kind}_apiary`])
    apiary =
      task.kind === 'movedate'
        ? task.apiary.name
        : task[`${task.kind}_apiary`].apiary_name;

  return `${date} [${apiary}]`;
}

function createUserInfo(task: any) {
  const creatorEmail = task.creator ? task.creator.email : '';
  const editorEmail = task.editor ? task.editor.email : '';

  if (creatorEmail === editorEmail) {
    return `${t('user')}: ${creatorEmail}`;
  } else {
    return !editorEmail
      ? `${t('created')}: ${creatorEmail}`
      : `${t('created')}: ${creatorEmail}, ${t('updated')}: ${editorEmail}`;
  }
}

function onEdit(id: number, kind: string) {
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

function onDelete(id: number, kind: string) {
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
      }
    );
  });
}

function showFile(value: string) {
  if (value && value !== '') {
    let values = [];
    if (value.includes('www.btree.at')) {
      // Legacy, new app has no option to upload on my own server
      values[0] = 'btree';
      values[1] = value;
    } else {
      // https://stackoverflow.com/a/4607799/5316675
      values = value.split(/:(.*)/s);
    }
    $q.dialog({
      component: DialogFileShow,
      componentProps: {
        service: values[0],
        id: values[1],
      },
    });
  }
}
</script>
