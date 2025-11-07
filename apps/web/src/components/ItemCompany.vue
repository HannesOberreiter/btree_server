<script setup lang="ts">
import { computed } from 'vue';
import { useDateFormat } from '../composables/useDate';
import { useAuthUserStore } from '../stores/auth';

const useDate = useDateFormat();
const storeUser = useAuthUserStore();
const getPaidStatus = computed(() => {
	return storeUser.getPaidStatus;
});
</script>

<template>
	<q-item>
		<q-item-section avatar>
			<q-icon :name="getPaidStatus.icon" />
		</q-item-section>

		<q-item-section class="text-caption">
			{{ $t('paid') }}: {{ useDate.displayFormat(getPaidStatus.date) }}
			<br>
			{{ $t('status') }}: {{ getPaidStatus.name }}
			<br>
			{{ $t('rank') }}: {{ getPaidStatus.rank.name }}
		</q-item-section>
	</q-item>
</template>
