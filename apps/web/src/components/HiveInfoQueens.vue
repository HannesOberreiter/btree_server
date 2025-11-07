<script setup lang="ts">
import { ref, toRef, watch } from 'vue';
import { useDateFormat } from '../composables/useDate';
import { useQueensQuery } from '../composables/useQuery';
import GlobalLoading from './GlobalLoading.vue';

const props = defineProps({
	id: {
		required: true,
	},
});
const useDate = useDateFormat();
const id = toRef(props, 'id');
const filter = ref<any>(null);

watch(
	id,
	() => {
		filter.value = JSON.stringify([{ 'queens.hive_id': id.value }]);
	},
	{ immediate: true },
);

const { isLoading, data } = useQueensQuery({
	limit: 5,
	order: ['queens.move_date'],
	direction: ['desc'],
	filters: filter,
	modus: null,
});
</script>

<template>
	<GlobalLoading v-if="isLoading" />
	<div v-else-if="data.results">
		<div>
			<b>{{ $t('queen', 2) }}</b>
			<span v-if="data.results.length === 5"> ({{ $t('max') }} 5)</span>
		</div>
		<ul>
			<li v-for="item in data.results" :key="item.id">
				<b>{{ item.name }}</b>&nbsp;
				<template v-if="item.modus">
					({{ useDate.displayFormat(item.date) }})
				</template>
				<template v-else>
					(RIP {{ useDate.displayFormat(item.modus_date) }})
				</template>
			</li>
		</ul>
	</div>
</template>
