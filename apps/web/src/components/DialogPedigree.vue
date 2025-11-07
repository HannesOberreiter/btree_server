<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import BtnCloseDialog from './BtnCloseDialog.vue';
import ListPedigree from './ListPedigree.vue';

defineProps({
	id: {
		type: Number,
		required: true,
	},
});

const { dialogRef } = useDialogPluginComponent();
</script>

<template>
	<q-dialog ref="dialogRef" data-cy="dialog-pedigree">
		<q-card style="width: 700px">
			<q-card-section>
				<div class="row">
					<div class="text-h6">
						{{ $t('pedigree') }}
					</div>
					<q-space />
					<BtnCloseDialog />
				</div>
				<ListPedigree :id="id" />
			</q-card-section>
		</q-card>
	</q-dialog>
</template>
