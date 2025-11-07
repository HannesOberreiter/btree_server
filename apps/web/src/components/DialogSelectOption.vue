<script setup lang="ts">
import type { PropType } from 'vue';
import type { Option } from '../types';
import { useDialogPluginComponent } from 'quasar';
import { ref, unref } from 'vue';
import BtnBase from './BtnBase.vue';
import BtnCloseDialog from './BtnCloseDialog.vue';
import FormDropdownOption from './FormDropdownOption.vue';

defineProps({
	label: {
		default: 'type',
	},
	text: {
		default: 'dialogSelectOptionSelect',
	},
	table: {
		type: String as PropType<Option>,
		required: true,
	},
	allowEmpty: {
		type: String,
		default: '',
	},
});
defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const value = ref('');

function onConfirm() {
	onDialogOK(unref(value.value));
}
</script>

<template>
	<q-dialog
		ref="dialogRef"
		:maximized="$q.platform.is.mobile"
		@hide="onDialogHide"
	>
		<q-card style="width: 700px">
			<q-card-section>
				<div class="row">
					<div class="text-h6">
						{{ $t(label) }}
					</div>
					<q-space />
					<BtnCloseDialog />
				</div>
				<div class="row full-width text-center">
					<div class="col-12">
						{{ $t(text) }}
					</div>
					<div class="col-12">
						<FormDropdownOption
							v-model="value"
							:label="label"
							:table="table"
							:allow-empty="allowEmpty"
						/>
					</div>
				</div>
			</q-card-section>
			<q-card-actions align="center">
				<BtnBase
					size="md"
					:label="$t('ok')"
					color="primary"
					@click="onConfirm"
				/>
			</q-card-actions>
		</q-card>
	</q-dialog>
</template>
