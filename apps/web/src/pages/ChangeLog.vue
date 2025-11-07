<script setup lang="ts">
import { computed, ref } from 'vue';
import TooltipBase from '../components/TooltipBase.vue';
import { useNews } from '../composables/useNews';

const { isFetching, error, data, currentVersion } = useNews();

const dataFetched = computed(() => data.value ?? []);

const filter = ref('');
</script>

<template>
	<div v-if="error" class="text-center">
		<div class="text-negative text-h5">
			{{ $t('error.noData') }} 😱
		</div>
		<div>
			{{ error }}
		</div>
	</div>
	<q-table
		v-else
		grid
		:rows="dataFetched"
		:title="$t('changelog')"
		:filter="filter"
		:rows-per-page-options="[10]"
		:loading="isFetching"
	>
		<template #item="props">
			<div class="q-pa-xs col-12">
				<q-card
					flat
					:bordered="true"
					:class="
						props.row.version === currentVersion?.version
							? 'bg-orange-3 text-black'
							: ''
					"
				>
					<q-card-section class="text-left">
						<q-icon
							v-if="data != null && props.row.version === data[0]?.version"
							square
							color="orange"
							name="fas fa-star"
							:size="$q.screen.gt.xs ? 'lg' : 'xs'"
							class="absolute-top-right q-pa-sm"
						>
							<TooltipBase>{{ $t('latest') }}</TooltipBase>
						</q-icon>
						<div v-for="(item, index) in props.row.news" :key="index">
							<b>{{ item.substring(0, item.indexOf(' ')) }}</b>
							{{ item.substring(item.indexOf(' ') + 1) }}
						</div>
					</q-card-section>

					<q-card-section class="q-pa-xs text-right">
						<span class="text-weight-medium">{{ $t('version') }}:</span>
						{{ props.row.version }},
						<span class="text-weight-medium">{{ $t('date') }}:</span>
						{{ props.row.date }}
					</q-card-section>
				</q-card>
			</div>
		</template>
		<template #top-right>
			<q-input
				v-model="filter"
				dense
				debounce="300"
				:placeholder="$t('search')"
			>
				<template #append>
					<q-icon name="fas fa-search" />
				</template>
			</q-input>
		</template>
	</q-table>
</template>
