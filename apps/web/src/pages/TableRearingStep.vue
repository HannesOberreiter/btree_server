<script setup lang="ts">
import type { QTableProps } from 'quasar';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TableButtons from '../components/TableButtons.vue';
import TableColNote from '../components/TableColNote.vue';
import TableFilter from '../components/TableFilter.vue';
import { useKeyTable } from '../composables/useKey';
import { useRearingDetailsQuery } from '../composables/useQuery';
import { tableCheckSelected } from '../helpers';
import { useTablesStore } from '../stores/tables';

const { t } = useI18n();

const storeTable = useTablesStore();
const { rearing_detail: store } = storeToRefs(storeTable);

const visibleColumns = ref(store.value.visible);

const selected = ref<any>([]);
const rows = ref([]);
const modus = ref(false);
const deleted = ref(false);
const filter = ref('');

const columns = [
	{
		name: 'id',
		label: t('id'),
		align: 'right',
		field: (row: any) => row.id,
		sortable: true,
	},
	{
		name: 'job',
		label: t('job'),
		align: 'left',
		field: (row: any) => row.job,
		sortable: true,
	},
	{
		name: 'hour',
		label: `${t('deprecatedField')} (${t('waitTime')} [h]` + `)`,
		align: 'right',
		field: (row: any) => row.hour,
		sortable: true,
	},
	{
		name: 'note',
		label: t('note'),
		align: 'left',
		field: (row: any) => row.note,
		sortable: true,
	},
] as QTableProps['columns'];

const pagination = ref({
	sortBy: store.value.sort,
	descending: store.value.direction,
	page: 1,
	rowsPerPage: store.value.length,
	rowsNumber: 0,
});
useKeyTable(pagination);

const {
	isLoading: isLoadingTable,
	data,
	refetch,
} = useRearingDetailsQuery({
	order: computed(() => [pagination.value.sortBy]),
	direction: computed(() => (pagination.value.descending ? ['asc'] : ['desc'])),
	offset: computed(() => pagination.value.page - 1),
	limit: computed(() => pagination.value.rowsPerPage),
	q: computed(() => (filter.value ? filter.value : '')),
});

watch(visibleColumns, (cur) => {
	store.value.visible = cur as any;
});

watch(
	data,
	() => {
		if (data.value) {
			rows.value = data.value.results;
			pagination.value.rowsNumber = data.value.total;
			selected.value = tableCheckSelected(selected.value, rows.value);
		}
	},
	{
		immediate: true,
	},
);

function onRequest(props: any) {
	store.value.length = props.pagination.rowsPerPage;
	store.value.sort = props.pagination.sortBy;
	store.value.direction = props.pagination.descending;
	pagination.value = props.pagination;
}
</script>

<template>
	<div class="row q-pa-sm justify-center">
		<div class="col-12">
			<q-table
				v-model:pagination="pagination"
				v-model:selected="selected"
				:rows="rows"
				:columns="columns"
				:visible-columns="visibleColumns"
				:loading="isLoadingTable"
				:dense="true"
				:rows-per-page-options="[10, 50, 100, 500, 10000]"
				separator="vertical"
				row-key="id"
				selection="multiple"
				binary-state-sort
				flat
				bordered
				@request="onRequest"
			>
				<template #top-left>
					<TableButtons
						v-model:deleted="deleted"
						v-model:modus="modus"
						label-modus-true="done"
						label-modus-false="open"
						:selected="selected"
						table="rearing_detail"
						@change="refetch"
					/>
				</template>
				<template #top-right>
					<TableFilter
						v-model:model-filter="filter"
						v-model:model-visible="visibleColumns"
						:columns="columns"
					/>
				</template>
				<template #body-cell-note="props">
					<TableColNote
						:value="props.value"
						:trunc="visibleColumns.length > 4"
					/>
				</template>
			</q-table>
		</div>
	</div>
</template>
