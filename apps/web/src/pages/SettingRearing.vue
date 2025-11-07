<script setup lang="ts">
import { ref } from 'vue';

import RearingMethod from '../components/RearingMethod.vue';
import TableRearingStep from './TableRearingStep.vue';

const tab = ref('method');
</script>

<template>
	<q-card flat>
		<div class="row justify-center q-pb-sm">
			<div class="col-12 col-md-11 col-lg-10">
				<div class="text-body2 q-pb-sm text-center">
					{{ $t('rearing') }}
				</div>
				<q-card-section class="q-pa-xs">
					<q-tabs
						v-model="tab"
						dense
						class="text-grey"
						active-color="primary"
						indicator-color="primary"
						align="justify"
						narrow-indicator
					>
						<q-tab name="method" :label="$t('method', 2)" />
						<q-tab name="steps" :label="$t('step', 2)" />
					</q-tabs>

					<q-separator />

					<q-tab-panels v-model="tab" animated>
						<q-tab-panel name="method" class="q-pa-xs">
							<RearingMethod />
						</q-tab-panel>
						<q-tab-panel name="steps" class="q-pa-xs">
							<TableRearingStep />
						</q-tab-panel>
					</q-tab-panels>
				</q-card-section>
			</div>
		</div>
	</q-card>
</template>
