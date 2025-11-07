<script setup lang="ts">
import type { PropType } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps({
	data: {
		type: Object as PropType<Feedsource>,
		required: true,
	},
});

const { locale } = useI18n();

interface LocaleAttributes {
	name: string;
	createdAt: string;
	updatedAt: string;
	locale: string;
	localizations?: {
		data?: {
			id: number;
			attributes: {
				name: string;
				createdAt: string;
				updatedAt: string;
				locale: string;
			};
		}[];
	};
}

export interface Feedsource {
	id: number;
	attributes: {
		enabled: boolean;
		source: string;
		createdAt: string;
		updatedAt: string;
		language: {
			data: {
				id: number;
				attributes: LocaleAttributes;
			};
		};
		categories: {
			data: {
				id: number;
				attributes: LocaleAttributes;
			}[];
		};
	};
}

function getLocalization(ob: LocaleAttributes) {
	if (locale.value === 'en')
		return ob.name;
	if (!ob?.localizations)
		return ob.name;
	if (!ob.localizations?.data)
		return ob.name;
	if (ob.localizations.data.length === 0)
		return ob.name;
	return ob.localizations.data[0]!.attributes.name;
}
</script>

<template>
	<div class="flex flex-row">
		<q-chip color="primary" text-color="white" size="xs">
			{{ data.attributes.language.data.attributes.name }}
		</q-chip>
		<q-chip
			v-for="item in data.attributes.categories.data"
			:key="item.id"
			color="secondary"
			text-color="white"
			size="xs"
		>
			{{ getLocalization(item.attributes) }}
		</q-chip>
	</div>
</template>
