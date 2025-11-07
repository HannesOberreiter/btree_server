<script setup lang="ts">
import { truncate } from 'lodash-es';
import { useQuasar } from 'quasar';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useApiFetch } from '../composables/useApi';
import { useDateFormat } from '../composables/useDate';
import { useNotification } from '../composables/useNotification';
import BtnBase from './BtnBase.vue';
import BtnBaseGroup from './BtnBaseGroup.vue';
import DialogForm from './DialogForm.vue';
import TooltipBase from './TooltipBase.vue';

defineProps({
	data: {
		type: Object,
		required: true,
	},
	opened: {
		default: false,
	},
});
const emit = defineEmits(['refetch']);
const notification = useNotification();
const $q = useQuasar();
const useDate = useDateFormat();
const router = useRouter();
const isSubmitting = ref(false);
const api = useApiFetch();

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

function onApiary(id: number) {
	router.push({ name: 'detail-apiary', params: { id } });
}

async function setModus(id: number, modus: boolean) {
	isSubmitting.value = true;
	const url = '/v1/hive';
	await api
		.patch(
			url,
			JSON.stringify({
				ids: [id],
				data: {
					modus: !modus,
					modus_date: useDate.isoFormat(useDate.getCurrent()),
				},
			}),
		)
		.then(
			async (_response: any) => {
				emit('refetch');
				notification.open('positive', '');
			},
			(error) => {
				notification.open('negative', error);
			},
		);
	isSubmitting.value = false;
}
</script>

<template>
	<q-expansion-item
		switch-toggle-side
		:default-opened="opened"
		:header-class="data.modus ? 'text-h5' : 'text-h5 text-negative'"
	>
		<template #header>
			<q-item-section>
				{{ data.modus ? data.name : `${data.name} (${$t('inactive')})` }}
			</q-item-section>
			<q-item-section v-if="data.hive_location" side>
				<BtnBase
					flat
					icon="fas fa-map-marker-alt"
					@click.stop="onApiary(data.hive_location.apiary_id)"
				>
					<span v-if="$q.platform.is.mobile">
						{{ truncate(data.hive_location.apiary_name, { length: 5 }) }}
					</span>
					<span v-else>
						{{ truncate(data.hive_location.apiary_name, { length: 20 }) }}
					</span>
				</BtnBase>
			</q-item-section>
		</template>
		<q-card>
			<q-card-section>
				<div class="col-12 q-gutter-xs">
					<q-chip
						v-if="data.hive_source"
						color="orange"
						square
						text-color="black"
						:label="data.hive_source.name"
					/>
					<q-chip
						v-if="data.hive_type"
						square
						color="orange"
						text-color="black"
						:label="data.hive_type.name"
					/>
					<q-chip
						v-if="data.grouphive && data.grouphive > 1"
						color="info"
						square
						text-color="black"
						:label="`
              ${$t('hive', 2)}:
              ${data.grouphive}
            `"
					/>
					<q-chip
						v-if="data.position && data.position > 0"
						square
						color="info"
						text-color="black"
						:label="`
              ${$t('position')}:
              ${data.position}
            `"
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
						<TooltipBase>{{ $t('hintHiveFirstMovedate') }}</TooltipBase>
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
				<BtnBaseGroup :spread="false">
					<BtnBase
						color="negative"
						:loading="isSubmitting"
						outline
						@click="setModus(data.id, data.modus)"
					>
						{{ data.modus ? $t('inactivateHive') : $t('activateHive') }}
					</BtnBase>
					<BtnBase
						color="secondary"
						outline
						@click="openForm('hive', data.id)"
					>
						{{ $t('editHive') }}
					</BtnBase>
					<slot />
				</BtnBaseGroup>
			</q-card-actions>
		</q-card>
	</q-expansion-item>
</template>
