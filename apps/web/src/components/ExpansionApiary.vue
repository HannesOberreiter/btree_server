<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDateFormat } from '../composables/useDate';
import BtnBase from './BtnBase.vue';
import DialogFileShow from './DialogFileShow.vue';
import DialogForm from './DialogForm.vue';
import TooltipBase from './TooltipBase.vue';

const props = defineProps({
	data: {
		type: Object,
		required: true,
	},
	opened: {
		default: false,
	},
});
const emit = defineEmits(['refetch']);
const $q = useQuasar();
const { t } = useI18n();
const useDate = useDateFormat();

const hasLocation = computed(() => props.data.latitude || props.data.longitude);
const locationLabel = computed(() => {
	const parts = [
		`${t('latitude')}: ${props.data.latitude}`,
		`${t('longitude')}: ${props.data.longitude}`,
	];

	if (props.data.elevation !== null && props.data.elevation !== undefined) {
		parts.push(`${t('elevation')}: ${props.data.elevation} m`);
	}

	return parts.join(' / ');
});
function openForm(title: string, id: number) {
	$q.dialog({
		component: DialogForm,
		componentProps: {
			title,
			form: title,
			maximized: true,
			ids: [id],
		},
	}).onOk(() => {
		emit('refetch');
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
</script>

<template>
	<q-expansion-item
		switch-toggle-side
		:default-opened="opened"
		icon="fas fa-house"
		header-class="text-h5"
	>
		<template #header>
			{{ data.name }}&nbsp;
			<span v-if="data.hive_count">
				[{{ data.hive_count.count }}]&nbsp;
				<span v-if="data.hive_count.grouphivescount > 0">
					+ {{ data.hive_count.grouphivescount }}
				</span>
			</span>
			<span v-else>[0]</span>
		</template>
		<q-card>
			<q-card-section class="q-pb-xs">
				<div class="col-12 q-gutter-xs">
					<BtnBase
						v-if="data?.url?.trim()"
						size="md"
						round
						color="orange"
						text-color="black"
						icon="fas fa-image"
						@click="showFile(data.url)"
					/>
					<q-chip
						v-if="data?.description?.trim()"
						square
						color="info"
						text-color="black"
						:label="data.description"
					/>
					<q-chip
						v-if="hasLocation"
						square
						color="info"
						text-color="black"
						:label="locationLabel"
					/>
					<q-chip
						v-if="data.firstMovedate"
						square
						color="info"
						text-color="black"
						:label="`
              ${$t('created')}:
              ${useDate.displayFormat(data.firstMovedate.date)}
            `"
					>
						<TooltipBase>{{ $t('hintApiaryFirstMovedate') }}</TooltipBase>
					</q-chip>
					<q-chip
						v-if="!data.modus"
						square
						color="negative"
						class="text-white"
						:label="`${$t('inactive')} (${useDate.displayFormat(
							data.modus_date,
							'date',
						)})`"
					/>
				</div>
			</q-card-section>
			<q-card-section v-if="data.note">
				<pre>{{ data.note }}</pre>
			</q-card-section>
			<q-card-actions align="right">
				<BtnBase color="primary" outline @click="openForm('apiary', data.id)">
					{{ $t('edit') }} {{ $t('apiary') }}
				</BtnBase>
			</q-card-actions>
		</q-card>
	</q-expansion-item>
</template>
