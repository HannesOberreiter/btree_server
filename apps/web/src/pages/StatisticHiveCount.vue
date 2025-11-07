<script setup lang="ts">
import GlobalLoading from '../components/GlobalLoading.vue';
import StatisticHiveCountApiary from '../components/StatisticHiveCountApiary.vue';
import StatisticHiveCountTotal from '../components/StatisticHiveCountTotal.vue';
</script>

<template>
	<q-card flat>
		<div class="row q-pa-sm justify-center">
			<div class="col-12">
				<div class="text-h5 text-center">
					{{ $t('hiveCount') }}
				</div>
			</div>
		</div>
		<q-card-section>
			<Suspense>
				<StatisticHiveCountApiary />
				<template #fallback>
					<GlobalLoading />
				</template>
			</Suspense>
		</q-card-section>

		<q-card-section>
			<Suspense>
				<StatisticHiveCountTotal />
				<template #fallback>
					<GlobalLoading />
				</template>
			</Suspense>
		</q-card-section>
	</q-card>
</template>
