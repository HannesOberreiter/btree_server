<script setup lang="ts">
import { findIndex } from 'lodash-es';
import { computed, toRef } from 'vue';
import { useRouter } from 'vue-router';
import { useKeyNavDetail } from '../composables/useKey';
import BtnBase from './BtnBase.vue';
import TooltipBase from './TooltipBase.vue';

const props = defineProps({
	data: {
		type: Object,
		required: true,
	},
	link: {
		type: String,
		default: 'hive',
	},
});
const router = useRouter();
const data = toRef(props, 'data');

const sameLocationIndex = computed(() => {
	if (data.value) {
		if (!data.value.sameLocation)
			return null;
		const index = findIndex(
			data.value.sameLocation,
			(o: any) => o.id === data.value.id,
		);
		return {
			previous: index <= 0 ? null : index - 1,
			next: index === data.value.sameLocation.length - 1 ? null : index + 1,
		};
	}
	else {
		return null;
	}
});

useKeyNavDetail(onNav);

function onNav(direction: 'prev' | 'next') {
	if (!sameLocationIndex.value)
		return;

	if (direction === 'prev' && sameLocationIndex.value.previous != null) {
		redirect(data.value.sameLocation[sameLocationIndex.value.previous].id);
	}
	if (direction === 'next' && sameLocationIndex.value.next != null) {
		redirect(data.value.sameLocation[sameLocationIndex.value.next].id);
	}
}

function redirect(id: number) {
	router.push({ name: `detail-${props.link}`, params: { id } });
}
</script>

<template>
	<div v-if="sameLocationIndex">
		<BtnBase
			v-if="sameLocationIndex.previous !== null"
			size="md"
			class="absolute-top-left"
			icon="fas fa-arrow-left"
			@click="redirect(data.sameLocation[sameLocationIndex.previous].id)"
		>
			<TooltipBase>
				{{ data.sameLocation[sameLocationIndex.previous].name }}
			</TooltipBase>
		</BtnBase>
		<BtnBase
			v-if="sameLocationIndex.next"
			size="md"
			class="absolute-top-right"
			icon="fas fa-arrow-right"
			@click="redirect(data.sameLocation[sameLocationIndex.next].id)"
		>
			<TooltipBase>
				{{ data.sameLocation[sameLocationIndex.next].name }}
			</TooltipBase>
		</BtnBase>
	</div>
</template>
