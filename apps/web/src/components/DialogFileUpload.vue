<!--  https://quasar.dev/vue-components/uploader -->
<script setup lang="ts">
import type { QUploaderFactoryFn } from 'quasar';
import { useDialogPluginComponent } from 'quasar';
import { ref, toRefs, watch } from 'vue';
import { useServiceDropbox } from '../composables/useDropbox';
import { useNotification } from '../composables/useNotification';
import BtnBase from './BtnBase.vue';
import BtnBaseGroup from './BtnBaseGroup.vue';
import TooltipBase from './TooltipBase.vue';

const props = defineProps({
	service: {
		type: String,
		default: 'dropbox',
	},
});
defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel }
	= useDialogPluginComponent();

const notification = useNotification();
const useDropbox = useServiceDropbox();
const uploader = ref<any>(null);
const queue = ref(false);
const service_active = ref(false);

const { service } = toRefs(props);

watch(
	[service, useDropbox.state.accessToken],
	() => {
		if (service.value === 'dropbox' && !useDropbox.state.isLoading) {
			useDropbox.getAccount().then((response) => {
				if (!response) {
					onDialogHide();
					notification.open('negative', 'noFileService');
				}
				service_active.value = response;
			});
		}
	},
	{ immediate: true },
);

function uploadUrl() {
	return 'https://content.dropboxapi.com/2/files/upload';
}

const factoryFn: QUploaderFactoryFn = (file) => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				headers: [
					{ name: 'Authorization', value: `Bearer ${useDropbox.state.accessToken}` },
					{ name: 'Content-Type', value: 'application/octet-stream' },
					{ name: 'Dropbox-API-Arg', value: `{"path": "${useDropbox.state.path}/${file[0]!.name}","mode": "overwrite","autorename": true,"mute": false,"strict_conflict": false}` },
				],
			});
		}, 100);
	});
};

function onUpload(info: any) {
	try {
		const response = JSON.parse(info.xhr.response);
		onDialogOK(`${props.service}:${response.id}`);
	}
	catch (e) {
		console.error(e);
	}
}

function onFailed(error: any) {
	console.log(error);
	notification.open('negative', 'Upload failed!', true);
}

function onRejected(rejectedEntries: any) {
	console.log(rejectedEntries);
	notification.open(
		'negative',
		'file(s) did not pass validation constraints',
		true,
	);
}
</script>

<template>
	<q-dialog ref="dialogRef" :maximized="false" @hide="onDialogHide">
		<q-card v-if="service_active">
			<div class="row full-width">
				<div class="col-12">
					<q-uploader
						ref="uploader"
						flat
						:label="$t('upload')"
						capture="user"
						accept="image/*, audio/*, application/pdf"
						:max-file-size="2e7"
						:url="uploadUrl"
						:send-raw="true"
						:factory="factoryFn"
						@failed="onFailed"
						@rejected="onRejected"
						@uploaded="onUpload"
						@added="queue = true"
						@removed="queue = false"
					/>
				</div>
			</div>
			<q-card-actions align="center">
				<BtnBaseGroup>
					<BtnBase
						:disable="!queue"
						color="primary"
						icon="fas fa-arrow-up"
						@click="uploader.upload()"
					>
						<TooltipBase>
							{{ $t('upload') }}
						</TooltipBase>
					</BtnBase>
					<BtnBase
						:disable="queue"
						color="secondary"
						icon="fas fa-folder-open"
						@click="uploader.pickFiles()"
					>
						<TooltipBase>
							{{ $t('select') }}
						</TooltipBase>
					</BtnBase>
					<BtnBase
						color="grey"
						icon="fas fa-rotate-left"
						@click="uploader.reset()"
					>
						<TooltipBase>
							{{ $t('reset') }}
						</TooltipBase>
					</BtnBase>
					<BtnBase color="grey" icon="fas fa-times" @click="onDialogCancel()">
						<TooltipBase>
							{{ $t('close') }}
						</TooltipBase>
					</BtnBase>
				</BtnBaseGroup>
			</q-card-actions>
		</q-card>
	</q-dialog>
</template>
