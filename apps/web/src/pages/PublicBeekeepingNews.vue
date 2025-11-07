<script setup lang="ts">
import PublicLayout from 'src/layouts/PublicLayout.vue';
import BeekeepingNews from './BeekeepingNews.vue';
</script>

<template>
	<PublicLayout>
		<BeekeepingNews :is-public="true" />
	</PublicLayout>
</template>
