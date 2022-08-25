<template>
  <q-dialog ref="dialogRef" data-cy="dialog-event" @hide="onDialogHide">
    <q-card style="min-width: 30%">
      <q-card-section>
        <btn-close-dialog class="float-right"></btn-close-dialog>
        <div class="row">
          <div class="text-h6">
            <q-icon :name="eventInfo.icon"></q-icon>
            {{ eventInfo.title }}
          </div>
          <q-space />
        </div>
      </q-card-section>
      <q-card-section v-if="isVis" class="primary">
        <event-info-vis :event-info="eventInfo"></event-info-vis>
      </q-card-section>
      <q-card-section v-else-if="isRearings" class="primary">
        <event-info-rearing :event-info="eventInfo"></event-info-rearing>
      </q-card-section>
      <q-card-section v-else class="primary">
        <div class="row q-mb-sm">
          <div class="col-12">
            <div v-if="!isMovement">
              <b>{{ $t('status') }}: </b>
              <span @click="updateStatus()">{{
                eventInfo.done ? $t('done') : $t('open')
              }}</span>
            </div>
            <div>
              <b>{{ $t('date') }}:</b>
              {{ useDate.displayFormat(eventInfo.start) }}
            </div>
            <div
              v-if="
                useDate.toDayjs(eventInfo.end).subtract(1, 'day').format('L') !=
                useDate.toDayjs(eventInfo.start).format('L')
              "
            >
              <b>{{ $t('end') }}:</b>
              {{
                useDate.displayFormat(
                  useDate
                    .toDayjs(eventInfo.end)
                    .subtract(1, 'day')
                    .toISOString()
                )
              }}
            </div>

            <div v-if="!isTodo">
              <div v-if="eventInfo.hive_ids.split(',').length - 1 === 0">
                <b>{{ t('hive') }}: </b>
                <router-link
                  :to="{
                    name: 'detail-hive',
                    params: { id: eventInfo.hive_ids },
                  }"
                >
                  {{ eventInfo.hive_names }}
                </router-link>
              </div>
              <div v-else>
                <tooltip-base v-if="eventInfo.hive_names.length > 20">
                  {{ eventInfo.hive_names }}
                </tooltip-base>
                <b>{{ t('hive', 2) }}:</b>
                {{
                  truncate(eventInfo.hive_names, {
                    length: 20,
                  })
                }}
              </div>
              <div>
                <b>{{ t('apiary') }}: </b>
                <router-link
                  :to="{
                    name: 'detail-apiary',
                    params: { id: eventInfo.apiary_id },
                  }"
                >
                  {{ eventInfo.apiary_name }}
                </router-link>
              </div>
            </div>
            <div v-if="eventInfo.creators">
              <b>{{ t('created') }}:</b> {{ eventInfo.creators }}
            </div>
            <div
              v-if="
                eventInfo.editors && eventInfo.creators != eventInfo.editors
              "
            >
              <b>{{ t('edited') }}:</b> {{ eventInfo.editors }}
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions>
        <div class="col-12">
          <btn-base-group :spread="false">
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
              icon="fas fa-pen"
              @click="editTask()"
            >
              <tooltip-base>{{ t('edit') }}</tooltip-base>
            </btn-base>
            <btn-base
              v-if="!isVis"
              color="negative darken-1"
              data-cy="btn-dialog-event-delete"
              icon="fas fa-trash"
              @click="deleteEvent"
            >
              <tooltip-base>{{ t('delete') }}</tooltip-base>
            </btn-base>
          </btn-base-group>

          <btn-base
            color="grey darken-1"
            class="float-right"
            @click="onDialogHide"
          >
            {{ t('close') }}
          </btn-base>
        </div>
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
      ? [props.eventInfo.publicId]
      : props.eventInfo.task_ids.toString().split(','),
  });
  const nameSource = props.eventInfo.table as string;
  $q.dialog({
    title: t('delete'),
    message: t('deleteConfirm'),
    ok: {
      label: t('yes'),
      class: 'btn-confirm',
    },
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
