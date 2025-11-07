<script setup lang="ts">
import { LoadingBar, useQuasar } from 'quasar';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BtnBase from '../components/BtnBase.vue';
import BtnBaseGroup from '../components/BtnBaseGroup.vue';
import DialogFileUpload from '../components/DialogFileUpload.vue';
import FilesDropbox from '../components/FilesDropbox.vue';
import GlobalLoading from '../components/GlobalLoading.vue';
import { useServiceDropbox } from '../composables/useDropbox';
import { useNotification } from '../composables/useNotification';

const router = useRouter();
const $q = useQuasar();
const notification = useNotification();
const useDropbox = useServiceDropbox();
const account = ref();
const resetInit = ref(false);

const params = router.currentRoute.value.query;

onMounted(() => {
	if (params.error) {
		notification.open(
			'negative',
			params.error_description ? params.error_description : params.error,
			false,
		);
	}
	else if (params.code) {
		useDropbox.auth(params.code as string).then(() => onToken());
	}
	else {
		onToken();
	}
});

function onAuth() {
	useDropbox.addAccount();
}

function onDelete() {
	useDropbox.deleteAccount().then(() => reset());
}

async function onToken() {
	await useDropbox.getAccount().then((response) => {
		if (response) {
			account.value = response;
		}
		else {
			reset();
		}
	});
}

function onCreateFolder() {
	$q.dialog({
		prompt: {
			model: '',
			type: 'text', // optional
		},
	}).onOk((data) => {
		useDropbox.createFolder(data as string);
	});
}

function onUploadFile() {
	$q.dialog({
		component: DialogFileUpload,
	}).onOk((data) => {
		console.log(data);
	});
}

function reset() {
	LoadingBar.stop();
	account.value = null;
	resetInit.value = true;
}

function isModalOpen() {
	return document.getElementsByClassName('q-dialog').length > 0;
}
</script>

<template>
	<div v-if="useDropbox.state.isLoading && !isModalOpen()">
		<GlobalLoading />
	</div>
	<q-card v-else data-cy="page-setting-dropbox" flat>
		<q-card-section v-if="!resetInit && account">
			<div class="text-h6">
				<q-icon name="fab fa-dropbox" /> {{ $t('account') }}:
				{{ account.email }}
			</div>

			<div class="text-caption">
				<a
					class="text-orange-8"
					href="https://www.dropbox.com/account/connected_apps"
				>
					https://www.dropbox.com/account/connected_apps
				</a>
			</div>
		</q-card-section>
		<q-card-actions v-if="!account" align="center">
			<div v-if="resetInit" class="row">
				<div class="col-12 q-pb-sm">
					{{ $t('dropbox.connectText') }}
				</div>
				<div class="col-12">
					<BtnBase
						color="primary"
						:label="$t('dropbox.connectAccount')"
						@click="onAuth"
					/>
				</div>
			</div>
		</q-card-actions>
		<div v-else>
			<q-card-actions align="center">
				<BtnBaseGroup :spread="false">
					<BtnBase
						color="primary"
						:label="$t('upload')"
						@click="onUploadFile"
					/>
					<BtnBase
						color="secondary"
						:label="$t('newFolder')"
						@click="onCreateFolder"
					/>
					<BtnBase
						color="info"
						:label="$t('dropbox.refreshToken')"
						@click="onToken"
					/>
					<BtnBase
						color="negative"
						:label="$t('dropbox.deleteAccess')"
						@click="onDelete"
					/>
				</BtnBaseGroup>
			</q-card-actions>
			<q-card-section>
				<FilesDropbox :select="false" />
			</q-card-section>
		</div>
	</q-card>
</template>
