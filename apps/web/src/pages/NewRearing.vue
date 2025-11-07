<script setup lang="ts">
import FormMainRearing from '../components/FormMainRearing.vue';
</script>

<template>
	<div class="row q-pa-sm justify-center">
		<div class="col-12 col-sm-10 col-md-8">
			<div class="text-h5 q-pb-sm text-center">
				{{ $t('new') }} {{ $t('rearing') }}
			</div>
			<FormMainRearing />
		</div>
	</div>
</template>
