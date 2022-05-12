<template>
  <q-dialog ref="dialogRef" style="min-width: 200px" @hide="onDialogHide">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          <q-icon :name="eventInfo.icon"></q-icon>
          {{ eventInfo.title }}
        </div>
      </q-card-section>
      <q-card-section v-if="isVis" class="primary">
        <event-info-vis :event-info="eventInfo"></event-info-vis>
      </q-card-section>
      <q-card-section v-else-if="isRearings" class="primary">
        <event-info-rearing :event-info="eventInfo"></event-info-rearing>
      </q-card-section>
      <q-card-section v-else class="primary">
        <p class="text-center text-h1">
          <q-icon v-if="isMovement" size="35px" round :name="eventInfo.icon">
          </q-icon>

          <btn-base
            v-else
            size="35px"
            round
            :color="eventInfo.done ? 'positive' : 'negative'"
            :icon="
              !eventInfo.done ? 'fas fa-times-circle' : 'fas fa-check-circle'
            "
            @click="updateStatus()"
          >
          </btn-base>
        </p>
        <p class="text-center pb-2">
          {{ useDate.displayFormat(eventInfo.start) }}
          <span v-if="!isMovement && !isTodo">
            -
            {{
              useDate.displayFormat(
                useDate.toDayjs(eventInfo.end).subtract(1, 'day').toISOString()
              )
            }}
          </span>
        </p>
        <div v-if="!isTodo">
          <span>
            <q-tooltip v-if="eventInfo.hive_names.length > 20">
              {{ eventInfo.hive_names }}
            </q-tooltip>
            <b>{{ t('hive', 2) }}:</b>
            {{
              truncate(eventInfo.hive_names, {
                length: 20,
              })
            }}
          </span>
          <br />
          <b>{{ t('apiary') }}:</b> {{ eventInfo.apiary_name }}
          <br />
        </div>
        <b>{{ t('created') }}:</b> {{ eventInfo.creators }}
        <br />
        <b>{{ t('edited') }}:</b> {{ eventInfo.editors }}
      </q-card-section>

      <q-card-actions>
        <btn-base-group>
          <btn-base
            v-if="!isMovement && !isVis && !isRearings"
            color="secondary darken-1"
            @click="updateStatus()"
          >
            {{ t('changeStatus') }}
          </btn-base>
          <btn-base
            v-if="!isVis && !isRearings"
            color="green darken-1"
            @click="editTask()"
          >
            {{ t('edit') }}
          </btn-base>
          <btn-base color="grey darken-1" @click="onDialogHide">
            {{ t('close') }}
          </btn-base>
          <btn-base
            v-if="!isVis"
            color="negative darken-1"
            @click="deleteEvent"
          >
            {{ t('delete') }}
          </btn-base>
        </btn-base-group>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { truncate } from 'lodash-es';
import { useNotification } from '~/composables/useNotification';
import EventInfoRearing from './EventInfoRearing.vue';
import EventInfoVis from './EventInfoVis.vue';
import { useDateFormat } from '~/composables/useDate';
import { useApiFetch } from '~/composables/useApi';
import { useDialogPluginComponent, useQuasar } from 'quasar';

const useDate = useDateFormat();
const $q = useQuasar();
const notification = useNotification();
const api = useApiFetch();
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const { t } = useI18n();
const router = useRouter();

const props = defineProps({
  eventInfo: {
    type: Object as any,
    required: true,
  },
});
defineEmits([...useDialogPluginComponent.emits]);

const isMovement = computed(
  () => props.eventInfo.table === 'movedate' || false
);
const isTodo = computed(() => props.eventInfo.table === 'todo' || false);
const isVis = computed(() => props.eventInfo.table === 'vis' || false);
const isRearings = computed(() => props.eventInfo.table === 'rearing' || false);

async function updateStatus() {
  const data = JSON.stringify({
    status: !props.eventInfo.done,
    ids: props.eventInfo.task_ids.toString().split(','),
  });
  const nameSource = props.eventInfo.table as string;
  await api.patch(`/v1/${nameSource}/status`, data).then(
    (_response: any) => {
      notification.open('positive', '');
      onDialogOK(props.eventInfo.table);
    },
    (error) => {
      notification.open('negative', error);
    }
  );
}
async function deleteEvent() {
  const data = JSON.stringify({
    ids: isRearings.value
      ? props.eventInfo.publicId
      : props.eventInfo.task_ids.toString().split(','),
  });
  const nameSource = props.eventInfo.table as string;
  $q.dialog({
    title: t('delete'),
    message: t('deleteConfirm'),
    cancel: true,
    persistent: true,
    html: true,
  }).onOk(async () => {
    await api.patch(`/v1/${nameSource}/batchDelete`, data).then(
      (response: any) => {
        if (response === 0) notification.open('warning', 'notAllowed');
        else notification.open('positive', 'deleted');
        onDialogOK(props.eventInfo.table);
      },
      (error) => {
        notification.open('negative', error);
      }
    );
  });
}

function editTask() {
  if (isTodo.value) {
    router.push({
      name: 'edit-todo',
      params: { ids: props.eventInfo.publicId.split(',') },
    });
  } else {
    const task = props.eventInfo.table;
    const ids = props.eventInfo.task_ids.toString().split(',');
    if (isMovement.value) {
      router.push({ name: 'edit-movement', params: { ids: ids } });
    } else {
      router.push({ name: 'edit-quicktool', params: { task: task, ids: ids } });
    }
  }
}
</script>
