<script setup lang="ts">
import FormMainCharge from '../components/FormMainCharge.vue';
</script>

<template>
	<q-card>
		<div class="row q-pa-sm justify-center">
			<div class="col-12 col-sm-10 col-md-8">
				<div class="text-h5 q-pb-sm text-center">
					{{ $t('new') }} {{ $t('charge') }}
				</div>
				<FormMainCharge />
			</div>
		</div>
	</q-card>
</template>
