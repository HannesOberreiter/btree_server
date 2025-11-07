<script setup lang="ts">
import type { PropType } from 'vue';
import type { MenuSection } from './MainDrawer.vue';
import { useQuasar } from 'quasar';

defineProps({
	link: {
		type: Object as PropType<MenuSection>,
		required: true,
	},
	disable: {
		type: Boolean,
		default: false,
	},
});
const $q = useQuasar();
defineExpose({ $q });
</script>

<template>
	<q-item
		v-ripple
		:data-cy="`route-${link.route}`"
		:to="{
			name: link.route,
			params: link.params ? link.params : {},
		}"
		clickable
		exact
		active-class="text-yellow"
		:disable="disable"
	>
		<q-item-section avatar>
			<q-icon :name="link.icon" />
		</q-item-section>
		<q-item-section>
			{{ disable ? $t('premium') : link.label }}
			{{ link.count ? `[${link.count}]` : '' }}
		</q-item-section>
	</q-item>
</template>
