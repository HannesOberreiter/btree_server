<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { useVModels } from '@vueuse/core';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { validationErrors } from '../helpers';
import { email, maxLength, requiredField } from '../helpers/i18n-validators';

const props = defineProps({
	modelValue: {
		type: String,
		default: '',
	},
	disableMail: {
		type: Boolean,
		default: false,
	},
});
const emit = defineEmits(['update:modelMail']);
const { t } = useI18n();
const { modelValue } = useVModels(props, emit);
const fieldStatus = ref(props.disableMail);
const state = {
	email: modelValue,
};
const rules = {
	email: {
		required: requiredField(t('email')),
		email,
		maxLengthValue: maxLength(50),
	},
};
const v = useVuelidate(rules, state, { $autoDirty: true });
</script>

<template>
	<q-input
		v-model.trim="modelValue"
		:error="v.email.$error"
		:error-message="validationErrors(v.email)"
		:no-error-icon="true"
		:label="$t('email')"
		name="email"
		type="email"
		autocapitalize="off"
		autofill="username"
		required
		filled
		:readonly="fieldStatus"
	>
		<template #prepend>
			<q-icon name="fas fa-at" />
		</template>
		<template #append>
			<q-icon
				v-if="fieldStatus"
				style="cursor: pointer"
				name="fas fa-edit"
				@click="fieldStatus = !fieldStatus"
			/>
		</template>
	</q-input>
</template>
