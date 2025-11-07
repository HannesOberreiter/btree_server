<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useRearingEventQuery } from '../composables/useQuery';
import BtnBase from './BtnBase.vue';
import BtnCloseDialog from './BtnCloseDialog.vue';
import EventInfoRearing from './EventInfoRearing.vue';
import GlobalLoading from './GlobalLoading.vue';

const props = defineProps({
	id: {
		type: Number,
		required: true,
	},
});
defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const { isLoading, data } = useRearingEventQuery({ id: props.id });
</script>

<template>
	<q-dialog
		ref="dialogRef"
		:maximized="$q.platform.is.mobile"
		@hide="onDialogHide"
	>
		<q-card style="min-width: 50%">
			<q-card-section>
				<BtnCloseDialog class="float-right" />
				<div class="row">
					<span v-if="!isLoading">
						<q-icon :name="`fas fa-${data[0].symbol}`" />
						ID: {{ data[0].name ? data[0].name : data[0].id }}
					</span>
					<q-space />
				</div>
				<div class="row full-width">
					<div v-if="isLoading" class="col-12">
						<GlobalLoading />
					</div>
					<div v-else class="col-12">
						<EventInfoRearing :event-info="data[0]" />
					</div>
				</div>
			</q-card-section>
			<q-card-actions align="right">
				<BtnBase outline color="grey" @click="onDialogOK()">
					{{ $t('close') }}
				</BtnBase>
			</q-card-actions>
		</q-card>
	</q-dialog>
</template>
