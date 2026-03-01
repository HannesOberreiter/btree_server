<script setup lang="ts">
import { onMounted } from 'vue';
import WizBeeChat from '../components/WizBeeChat.vue';
import { useWizBee } from '../composables/useWizBee';

const { monthlyUsage, fetchMonthlyUsage } = useWizBee();

onMounted(() => {
	fetchMonthlyUsage();
});
</script>

<template>
	<div class="row justify-center q-mx-md">
		<div class="container-size">
			<div class="row justify-center vertical-middle q-mb-xs items-center">
				<img
					src="/wizbee/favicon-96x96.png"
					alt="WizBee Logo"
					height="50"
					class="q-mr-sm"
					:class="{ 'invert-colors': $q.dark.isActive }"
				>
				<div class="text-h5">
					{{ $t('ask') }} WizBee
				</div>
			</div>

			<q-card class="wizbee-page-chat q-mt-sm">
				<WizBeeChat :show-examples="true" />
			</q-card>

			<!-- Usage overview -->
			<q-card v-if="monthlyUsage" flat bordered class="q-mt-sm q-pa-sm">
				<div class="row items-center q-gutter-x-md text-caption text-grey-7">
					<div>
						<b>Budget:</b>
						${{ monthlyUsage.estimatedCostUSD.toFixed(4) }} / ${{ monthlyUsage.monthlyLimitUSD.toFixed(2) }}
					</div>
					<div>
						<b>{{ $t('countTokensLeft') }}:</b>
						${{ monthlyUsage.remainingBudgetUSD.toFixed(4) }}
					</div>
					<div>
						<b>{{ $t('requests') }}:</b>
						{{ monthlyUsage.totalRequests }}
					</div>
					<div>
						<b>Tokens:</b>
						{{ monthlyUsage.totalInputTokens.toLocaleString() }} in / {{ monthlyUsage.totalOutputTokens.toLocaleString() }} out
					</div>
					<div v-if="monthlyUsage.isOverBudget" class="text-red text-bold">
						{{ $t('error.tokenLimit') }}
					</div>
				</div>
			</q-card>

			<small class="text-grey-7 q-mt-sm block">
				{{ $t('help.wizbee') }}
				<br>
				API Service:
				<a href="https://mistral.ai/" target="_blank">https://mistral.ai/</a>
			</small>
		</div>
	</div>
</template>

<style>
.container-size {
  min-width: 80%;
  max-width: 600px;
}

.wizbee-page-chat {
  height: 60vh;
  display: flex;
  flex-direction: column;
}

.invert-colors {
  filter: grayscale(1) invert(1);
}
</style>
