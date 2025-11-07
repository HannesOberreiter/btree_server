<script setup lang="ts">
import type { QInputProps } from 'quasar';
import useVuelidate from '@vuelidate/core';
import { useVModels } from '@vueuse/core';
import { QInput, useQuasar } from 'quasar';
import { onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { validationErrors } from '../helpers';
import {
	maxLength,
	minLength,
	requiredField,
	sameAs,
} from '../helpers/i18n-validators';

const props = defineProps({
	confirm: {
		type: Boolean,
		default: false,
	},
	passwordLabel: {
		type: String,
		default: 'password',
	},
	modelPassword: {
		type: String,
		required: true,
	},
});
const emit = defineEmits(['update:modelPassword']);
const passwordInput = ref<QInput | null>(null);
const $q = useQuasar();
const { t } = useI18n();
const { modelPassword } = useVModels(props, emit);

const passwordField = ref('password' as QInputProps['type']);
const passwordIcon = ref('fas fa-eye');

const state = reactive({
	password: modelPassword.value,
	confirmPassword: '',
});

watch(modelPassword, () => {
	state.password = modelPassword.value;
});

onMounted(() => {
	/**
    Workaround for autofill bug in iOS app, but still does not work
	 */
	if ($q.platform.is.ios) {
		if (!passwordInput.value)
			return;
		const nativeInput
			= passwordInput.value.getNativeElement() as HTMLInputElement;
		nativeInput.addEventListener('change', (event) => {
			requestAnimationFrame(() => {
				state.password = (event.target as HTMLInputElement).value;
			});
		});
	}
});

const rules = {
	password: {
		required: requiredField(t('password')),
		minLengthValue: minLength(props.confirm ? 7 : 5),
		maxLengthValue: maxLength(100),
	},
	confirmPassword: {},
};

if (props.confirm) {
	rules.confirmPassword = {
		required: requiredField(t('confirmPassword')),
		sameAs: sameAs(modelPassword, t('password')),
	};
}

function changePasswordField() {
	passwordField.value = passwordField.value === 'text' ? 'password' : 'text';
	passwordIcon.value
		= passwordField.value === 'text' ? 'fas fa-eye' : 'fas fa-eye-slash';
}

const v = useVuelidate(rules, state, { $autoDirty: true });
</script>

<template>
	<div>
		<QInput
			ref="passwordInput"
			v-model="modelPassword"
			:error="v.password.$error"
			:error-message="validationErrors(v.password)"
			:type="passwordField"
			:no-error-icon="true"
			:label="t(props.passwordLabel)"
			name="password"
			:autofill="confirm ? 'new-password' : 'current-password'"
			required
			filled
		>
			<template #prepend>
				<q-icon name="fas fa-lock" />
			</template>
			<template #append>
				<q-icon
					:name="passwordIcon"
					style="cursor: pointer"
					@click="changePasswordField"
				/>
			</template>
		</QInput>
		<QInput
			v-if="confirm"
			v-model="state.confirmPassword"
			:error="v.confirmPassword.$error"
			:error-message="validationErrors(v.confirmPassword)"
			:type="passwordField"
			:no-error-icon="true"
			:label="t('confirmPassword')"
			name="confirmPassword"
			required
			filled
		>
			<template #prepend>
				<q-icon name="fas fa-lock" />
			</template>
		</QInput>
	</div>
</template>
