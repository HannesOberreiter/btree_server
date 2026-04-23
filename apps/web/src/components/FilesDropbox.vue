<script setup lang="ts">
import { round, truncate } from 'lodash-es';
import { useQuasar } from 'quasar';
import { watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDateFormat } from '../composables/useDate';
import { useServiceDropbox } from '../composables/useDropbox';
import { isImage, isVideo } from '../helpers';
import BtnBase from './BtnBase.vue';
import BtnBaseGroup from './BtnBaseGroup.vue';
import DialogFileShow from './DialogFileShow.vue';
import TooltipBase from './TooltipBase.vue';

defineProps({
	select: {
		type: Boolean,
		default: true,
	},
});
const emit = defineEmits(['selected']);
const $q = useQuasar();
const useDate = useDateFormat();
const useDropbox = useServiceDropbox();
const { t } = useI18n();

function showFile(id: string) {
	$q.dialog({
		component: DialogFileShow,
		componentProps: {
			value: `dropbox:${id}`,
		},
	});
}

watch(
	() => useDropbox.state.accessToken,
	(cur) => {
		if (!useDropbox.state.folder && cur && !useDropbox.state.isLoading)
			useDropbox.listFiles();
	},
	{ immediate: true },
);

function onSelect(id: string) {
	emit('selected', id);
}

function deleteFile(row: any) {
	$q.dialog({
		title: `${t('delete')} ${row.name}`,
		message: t('dropbox.deleteFileOrFolder'),
		cancel: true,
	}).onOk(() => {
		useDropbox.deleteFile(row.id);
	});
}

function renameFile(row: any) {
	$q.dialog({
		title: `${t('new')} ${t('name')}`,
		prompt: {
			model: '',
			label: row.name,
			type: 'text', // optional
		},
	}).onOk((name: string) => {
		if (name.trim() === '') {
			// do nothing
		}
		else {
			useDropbox.renameFile(row.name, name);
		}
	});
}

function changeFolder(path: string) {
	useDropbox.state.path = path;
	useDropbox.listFiles();
}
</script>

<template>
	<div>
		<q-icon
			name="fas fa-refresh"
			style="cursor: pointer"
			@click="changeFolder(useDropbox.state.path)"
		/>
		<BtnBase
			flat
			:label="`${$t('folder')}: ${useDropbox.state.path}`"
			@click="changeFolder('')"
		>
			<TooltipBase>{{ $t('back') }}</TooltipBase>
		</BtnBase>
		<q-table
			v-if="useDropbox.state.folder"
			grid
			:rows="useDropbox.state.folder"
			:rows-per-page-options="[20, 50, 100, 500, 10000]"
		>
			<template #item="props">
				<div class="q-pa-xs col-6 col-md-4">
					<q-card v-if="props.row['.tag'] === 'folder'">
						<q-card-section class="text-center">
							<BtnBase
								flat
								icon="fas fa-folder"
								:label="truncate(props.row.name, { length: 30 })"
								@click="changeFolder(props.row.path_lower)"
							/>
							<div class="text-caption">
								{{
									useDate.displayFormat(props.row.client_modified, 'date-time')
								}}
							</div>
							<BtnBaseGroup v-if="!select" outline size="sm">
								<BtnBase
									size="sm"
									icon="fas fa-pen"
									@click="() => renameFile(props.row)"
								>
									<TooltipBase>{{ $t('rename') }}</TooltipBase>
								</BtnBase>
								<BtnBase
									size="sm"
									icon="fas fa-trash"
									@click="() => deleteFile(props.row)"
								>
									<TooltipBase>{{ $t('delete') }}</TooltipBase>
								</BtnBase>
							</BtnBaseGroup>
						</q-card-section>
					</q-card>
					<q-card v-else>
						<q-card-section class="text-center">
							<BtnBase
								flat
								:icon="isImage(props.row.name) ? 'fas fa-image' : isVideo(props.row.name) ? 'fas fa-video' : 'fas fa-file'"
								:label="truncate(props.row.name, { length: 30 })"
								@click="showFile(props.row.id)"
							>
								<TooltipBase>
									{{ `${round(props.row.size / 1e6, 1)} MB` }}
								</TooltipBase>
							</BtnBase>
							<div class="text-caption">
								{{
									useDate.displayFormat(props.row.client_modified, 'date-time')
								}}
							</div>
							<BtnBase
								v-if="select"
								outline
								size="sm"
								@click="onSelect(`dropbox:${props.row.id}`)"
							>
								{{ $t('select') }}
							</BtnBase>
							<BtnBaseGroup v-else outline size="sm">
								<BtnBase
									size="sm"
									icon="fas fa-pen"
									@click="() => renameFile(props.row)"
								>
									<TooltipBase>{{ $t('rename') }}</TooltipBase>
								</BtnBase>
								<BtnBase
									size="sm"
									icon="fas fa-trash"
									@click="() => deleteFile(props.row)"
								>
									<TooltipBase>{{ $t('delete') }}</TooltipBase>
								</BtnBase>
							</BtnBaseGroup>
						</q-card-section>
					</q-card>
				</div>
			</template>
		</q-table>
	</div>
</template>
