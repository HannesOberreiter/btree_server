<script setup lang="ts">
import { RouterView } from 'vue-router';
import GlobalPWA from './components/GlobalPWA.vue';

if (import.meta.env.DEV) {
	window.addEventListener('vite:preloadError', (event) => {
		console.log('PreloadError', event);
		window.location.reload(); // for example, refresh the page
	});
}
</script>

<template>
	<RouterView />
	<GlobalPWA />
</template>
