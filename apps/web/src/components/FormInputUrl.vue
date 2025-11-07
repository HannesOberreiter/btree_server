<script setup lang="ts">
import { useVModels } from '@vueuse/core';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useNotification } from '../composables/useNotification';
import { isValidURL } from '../helpers';
import { useFieldsettingStore } from '../stores/fieldsetting';
import DialogFileSelect from './DialogFileSelect.vue';
import DialogFileShow from './DialogFileShow.vue';
import DialogFileUpload from './DialogFileUpload.vue';
import FormInputText from './FormInputText.vue';
import TooltipBase from './TooltipBase.vue';

const props = defineProps({
	modelValue: {
		default: '',
	},
	reset: {
		type: Number,
		default: 0,
	},
	values: {
		type: Object,
		default: null,
	},
});
const emit = defineEmits(['update:modelValue']);
const fields = useFieldsettingStore();
const $q = useQuasar();
const { t } = useI18n();
const notification = useNotification();

const { modelValue } = useVModels(props, emit);

function uploadFile() {
	$q.dialog({
		component: DialogFileUpload,
	}).onOk((data) => {
		modelValue.value = data;
	});
}

function selectFile() {
	$q.dialog({
		component: DialogFileSelect,
	}).onOk((data) => {
		modelValue.value = data;
	});
}

function showFile(value: string) {
	if (value && value !== '') {
		$q.dialog({
			component: DialogFileShow,
			componentProps: {
				value,
			},
		});
	}
}

function inputUrl() {
	$q.dialog({
		prompt: {
			model: '',
			label: t('url'),
		},
	}).onOk((val) => {
		if (!val)
			return;
		if (!isValidURL(val)) {
			notification.open('warning', 'noValidUrl');
		}
		else {
			modelValue.value = val;
		}
	});
}
</script>

<template>
	<FormInputText
		v-if="fields.settings.general.url"
		v-model="modelValue"
		:values="values"
		:reset="reset"
		label="url"
		icon="fas fa-cloud-arrow-up"
		readonly
		:max-valid="512"
		@click="showFile(modelValue)"
	>
		<template #deepAfter>
			<q-icon
				name="fas fa-xmark"
				style="cursor: pointer"
				class="q-pr-sm"
				@click="modelValue = ''"
			>
				<TooltipBase>{{ $t('clearField') }}</TooltipBase>
			</q-icon>
			<q-icon name="fas fa-file-pen" style="cursor: pointer" @click="inputUrl">
				<TooltipBase>{{ $t('inputUrl') }}</TooltipBase>
			</q-icon>
			<q-icon
				name="fas fa-upload"
				style="cursor: pointer"
				class="q-pr-sm"
				@click="uploadFile"
			>
				<TooltipBase>{{ $t('uploadFile') }}</TooltipBase>
			</q-icon>
			<q-icon name="fab fa-dropbox" style="cursor: pointer" @click="selectFile">
				<TooltipBase>{{ $t('selectFile') }}</TooltipBase>
			</q-icon>
		</template>
	</FormInputText>
</template>
