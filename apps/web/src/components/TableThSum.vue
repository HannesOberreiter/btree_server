<script setup lang="ts">
import { round } from 'lodash-es';
import { ref, toRef, watch } from 'vue';

const props = defineProps({
	parentProp: {
		required: true,
	},
	label: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	selected: {
		default: [],
	},
});

const sum = ref(0);

const selected = toRef(props, 'selected');

watch(selected, (cur) => {
	sum.value = 0;
	if (cur) {
		if (cur.length > 0) {
			sum.value = calculateSum(cur, props.name);
		}
	}
});

function calculateSum(values: Array<any>, col: string) {
	const arr = values.map(value => value[col]);
	const sum = arr.reduce((total: number, num: number) => total + num);
	return round(sum, 1);
}
</script>

<template>
	<q-th :props="parentProp">
		{{ label }} <template v-if="sum > 0">
			[{{ sum }}]
		</template>
	</q-th>
</template>
