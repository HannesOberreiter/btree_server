<script setup lang="ts">
import type { PropType } from 'vue';
import type { Task } from '../types';
import { find } from 'lodash-es';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import FormMainTask from '../components/FormMainTask.vue';
import { useQuicktoolStore } from '../stores/quicktool';

const props = defineProps({
	task: {
		type: String as PropType<Task>,
		required: true,
	},
});
const { t } = useI18n();
const storeQuicktool = useQuicktoolStore();
const router = useRouter();
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

watch(taskSelect, (cur) => {
	if (cur)
		taskForm.value = cur.value as Task;
	// Helper for sidebar link to use latest quicktool setting and update url
	storeQuicktool.$state.link = cur?.value as Task;
	router.replace({
		name: 'new-quicktool',
		params: { task: cur?.value },
	});
});
</script>

<template>
	<div class="row q-pa-sm justify-center">
		<div class="col-12 col-sm-10 col-md-8">
			<div class="text-body2 q-pb-sm text-center">
				{{ $t('quicktool.name') }}
			</div>
			<q-select
				v-model="taskSelect"
				:label="$t('quicktool.taskDropdown')"
				name="taskSelect"
				filled
				:options="options"
				rounded
				class="q-mb-sm text-center"
			/>
			<FormMainTask v-if="taskSelect" :task="taskForm" />
		</div>
	</div>
</template>
