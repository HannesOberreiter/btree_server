<script setup lang="ts">
import type { PropType } from 'vue';
import type { Task } from '../types';
import { find } from 'lodash-es';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import FormMainTask from '../components/FormMainTask.vue';

const props = defineProps({
	task: {
		type: String as PropType<Task>,
		required: true,
	},
	ids: {
		type: Array as PropType<number[] | null>,
		default: null,
	},
});
const { t } = useI18n();
const options = [
	{
		label: t('checkup'),
		value: 'checkup',
	},
	{
		label: t('treatment'),
		value: 'treatment',
	},
	{
		label: t('feed'),
		value: 'feed',
	},
	{
		label: t('harvest'),
		value: 'harvest',
	},
];

const taskSelect = ref(find(options, { value: props.task }));
const taskForm = ref<Task>(
	taskSelect.value ? (taskSelect.value.value as Task) : 'checkup',
);
</script>

<template>
	<div class="row q-pa-sm justify-center">
		<div class="col-12 col-sm-10 col-md-8">
			<div class="text-h5 q-pb-sm text-center">
				{{ $t('edit') }} {{ $t(task) }}
			</div>
			<FormMainTask
				v-if="taskSelect"
				:task="taskForm"
				:ids="ids"
			/>
		</div>
	</div>
</template>
