<script setup lang="ts">
import { useQuasar } from 'quasar';
import { toRef } from 'vue';
import DialogPedigree from './DialogPedigree.vue';

const props = defineProps({
	parentProps: {
		type: Object,
		required: true,
	},
});
const $q = useQuasar();
const parentProps = toRef(props, 'parentProps');

function show() {
	$q.dialog({
		component: DialogPedigree,
		componentProps: {
			id: parentProps.value.row.id,
		},
	});
}
</script>

<template>
	<q-td
		:props="parentProps"
		data-cy="col-pedigree"
		class="show-pointer"
		@click="show"
	>
		{{ parentProps.value }}
	</q-td>
</template>
