<script setup lang="ts">
import { ref } from 'vue';

const newsletter = ref(false);
</script>

<template>
	<q-checkbox
		v-model="newsletter"
		color="primary"
		:true-value="true"
		:false-value="false"
	>
		<slot>
			{{ $t('newsletterText') }}
		</slot>
	</q-checkbox>
</template>
