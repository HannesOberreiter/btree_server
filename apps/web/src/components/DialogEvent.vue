<script setup lang="ts">
import { truncate } from 'lodash-es';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRouter } from 'vue-router';
import { useApiFetch } from '../composables/useApi';
import { useDateFormat } from '../composables/useDate';
import { useNotification } from '../composables/useNotification';
import BtnBase from './BtnBase.vue';
import BtnBaseGroup from './BtnBaseGroup.vue';
import BtnCloseDialog from './BtnCloseDialog.vue';
import EventInfoRearing from './EventInfoRearing.vue';
import EventInfoVis from './EventInfoVis.vue';
import TooltipBase from './TooltipBase.vue';

const props = defineProps({
	eventInfo: {
		type: Object as any,
		required: true,
	},
});
defineEmits([...useDialogPluginComponent.emits]);
const useDate = useDateFormat();
const $q = useQuasar();
const notification = useNotification();
const api = useApiFetch();
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const { t } = useI18n();
const router = useRouter();

const isMovement = computed(
	() => props.eventInfo.table === 'movedate' || false,
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
		},
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
				if (response === 0)
					notification.open('warning', 'notAllowed');
				else notification.open('positive', 'deleted');
				onDialogOK(props.eventInfo.table);
			},
			(error) => {
				notification.open('negative', error);
			},
		);
	});
}

function editTask() {
	if (isTodo.value) {
		router.push({
			name: 'edit-todo',
			params: { ids: props.eventInfo.publicId.split(',') },
		});
	}
	else {
		const task = props.eventInfo.table;
		const ids = props.eventInfo.task_ids.toString().split(',');
		if (isMovement.value) {
			router.push({ name: 'edit-movement', params: { ids } });
		}
		else {
			router.push({ name: 'edit-quicktool', params: { task, ids } });
		}
	}
}
</script>

<template>
	<q-dialog ref="dialogRef" data-cy="dialog-event" @hide="onDialogHide">
		<q-card :style="isRearings ? 'min-width: 50%' : 'min-width: 30%'">
			<q-card-section>
				<BtnCloseDialog class="float-right" />
				<div class="row">
					<div class="text-h6">
						<q-icon :name="eventInfo.icon" />
						{{ eventInfo.title }}
					</div>
					<q-space />
				</div>
			</q-card-section>
			<q-card-section v-if="isVis" class="primary">
				<EventInfoVis :event-info="eventInfo" />
			</q-card-section>
			<q-card-section v-else-if="isRearings" class="primary">
				<EventInfoRearing :event-info="eventInfo" />
			</q-card-section>
			<q-card-section v-else class="primary">
				<div class="row q-mb-sm">
					<div class="col-12">
						<div v-if="!isMovement">
							<b>{{ $t('status') }}: </b>
							<span
								class="show-pointer"
								:class="eventInfo.done ? 'text-green-8' : 'text-red-8'"
								@click="updateStatus()"
							>{{ eventInfo.done ? $t('done') : $t('open') }}
								<q-icon name="fas fa-refresh" /></span>
						</div>
						<div>
							<b>{{ $t('date') }}:</b>
							{{ useDate.displayFormat(eventInfo.start) }}
						</div>
						<div
							v-if="
								useDate.toDayjs(eventInfo.end).subtract(1, 'day').format('L')
									!== useDate.toDayjs(eventInfo.start).format('L')
							"
						>
							<b>{{ $t('end') }}:</b>
							{{
								useDate.displayFormat(
									useDate
										.toDayjs(eventInfo.end)
										.subtract(1, 'day')
										.toISOString(),
								)
							}}
						</div>

						<div v-if="!isTodo">
							<div v-if="eventInfo.hive_ids.split(',').length - 1 === 0">
								<b>{{ t('hive') }}: </b>
								<RouterLink
									class="text-orange-8"
									:to="{
										name: 'detail-hive',
										params: { id: eventInfo.hive_ids },
									}"
								>
									{{ eventInfo.hive_names }}
								</RouterLink>
							</div>
							<div v-else>
								<TooltipBase v-if="eventInfo.hive_names.length > 20">
									{{ eventInfo.hive_names }}
								</TooltipBase>
								<b>{{ t('hive', 2) }}:</b>
								{{
									truncate(eventInfo.hive_names, {
										length: 20,
									})
								}}
							</div>
							<div>
								<b>{{ t('apiary') }}: </b>
								<RouterLink
									class="text-orange-8"
									:to="{
										name: 'detail-apiary',
										params: { id: eventInfo.apiary_id },
									}"
								>
									{{ eventInfo.apiary_name }}
								</RouterLink>
							</div>
						</div>
						<div v-if="eventInfo.creators">
							<b>{{ t('created') }}:</b> {{ eventInfo.creators }}
						</div>
						<div
							v-if="
								eventInfo.editors && eventInfo.creators !== eventInfo.editors
							"
						>
							<b>{{ t('edited') }}:</b> {{ eventInfo.editors }}
						</div>
					</div>
				</div>
			</q-card-section>

			<q-card-actions>
				<div class="col-12">
					<BtnBaseGroup class="float-right full-width">
						<BtnBase
							v-if="!isVis"
							color="negative darken-1"
							data-cy="btn-dialog-event-delete"
							icon="fas fa-trash"
							@click="deleteEvent"
						>
							<TooltipBase>{{ t('delete') }}</TooltipBase>
						</BtnBase>
						<BtnBase
							v-if="!isVis && !isRearings"
							color="green darken-1"
							icon="fas fa-pen"
							@click="editTask()"
						>
							<TooltipBase>{{ t('edit') }}</TooltipBase>
						</BtnBase>
						<BtnBase
							v-if="!isMovement && !isVis && !isRearings"
							color="secondary darken-1"
							icon="fas fa-refresh"
							@click="updateStatus()"
						>
							<TooltipBase>{{ t('changeStatus') }}</TooltipBase>
						</BtnBase>
					</BtnBaseGroup>
				</div>
			</q-card-actions>
		</q-card>
	</q-dialog>
</template>
