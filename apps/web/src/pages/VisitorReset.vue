<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import BtnBase from '../components/BtnBase.vue';
import FormDropdownServer from '../components/FormDropdownServer.vue';
import FormErrorMax from '../components/FormErrorMax.vue';
import FormUserPassword from '../components/FormUserPassword.vue';
import { useNotification } from '../composables/useNotification';
import { validationErrors } from '../helpers';
import { alphaNum, maxLength, requiredField } from '../helpers/i18n-validators';
import AuthService from '../services/auth.service';

const prop = defineProps({
	reset: {
		type: String,
		default: '',
	},
});
const notification = useNotification();
const { t } = useI18n();

const btnLabel = ref('save');
const isSubmitting = ref(false);
const submitCount = ref(0);
const message = ref('');

const state = reactive({
	resetKey: prop.reset ? prop.reset : '',
	password: '',
	confirmPassword: '',
});
const rules = reactive({
	resetKey: {
		required: requiredField(t('key')),
		alphaNum,
		maxLengthValue: maxLength(200),
	},
});

const v = useVuelidate(rules, state);

async function onSubmit() {
	isSubmitting.value = true;
	const isFormCorrect = await v.value.$validate();
	if (!isFormCorrect) {
		isSubmitting.value = false;
		return;
	}
	submitCount.value++;
	const form: any = {
		resetKey: state.resetKey,
		password: state.password,
	};
	await sendForm(form);
}

async function sendForm(values: any) {
	await AuthService.resetPassword(values).then(
		(response) => {
			const email = response.email;

			message.value = t('resetUser.success', { msg: email });

			isSubmitting.value = false;
			btnLabel.value = 'success';
			notification.open('positive', message.value, true);
		},
		(error) => {
			if (error?.statusCode === 404) {
				notification.open('negative', t('resetUser.keyNotFound'));
			}
			else {
				notification.open('negative', error);
			}
			isSubmitting.value = false;
		},
	);
}
</script>

<template>
	<q-card-section>
		<div class="text-h6 text-center">
			{{ t('resetUser.title') }}
		</div>
		<FormErrorMax v-if="submitCount >= 15" />
		<q-form v-else class="q-gutter-md" @submit="onSubmit">
			<q-input
				v-model="v.resetKey.$model"
				:error="v.resetKey.$error"
				:error-messages="validationErrors(v.resetKey)"
				name="resetKey"
				:label="t('resetUser.label')"
				required
				disabled
				readonly
				append-inner-icon="fas fa-lock"
			/>
			<FormUserPassword
				v-model:model-password="state.password"
				password-label="newPassword"
				:confirm="true"
			/>
			<FormDropdownServer />

			<q-card-actions class="">
				<BtnBase
					type="submit"
					size="lg"
					color="secondary"
					class="full-width text-white"
					:label="t(btnLabel)"
					:disable="isSubmitting || message !== ''"
					:loading="isSubmitting"
				/>
			</q-card-actions>
		</q-form>
		<p v-if="message" class="text-primary text-center">
			{{ message }}
		</p>
	</q-card-section>
</template>
