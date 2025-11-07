<script setup lang="ts">
import FormMainTodo from '../components/FormMainTodo.vue';
</script>

<template>
	<div class="row q-pa-sm justify-center">
		<div class="col-12 col-sm-10 col-md-8">
			<div class="text-h5 q-pb-sm text-center">
				{{ $t('new') }} {{ $t('todo') }}
			</div>
			<FormMainTodo />
		</div>
	</div>
</template>
