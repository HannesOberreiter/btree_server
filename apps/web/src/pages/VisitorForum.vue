<script setup lang="ts">
import type { User } from '../types';
import useVuelidate from '@vuelidate/core';
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import BtnBase from '../components/BtnBase.vue';
import FormErrorMax from '../components/FormErrorMax.vue';
import FormInputEmail from '../components/FormInputEmail.vue';
import FormUserPassword from '../components/FormUserPassword.vue';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import { useAuthUserStore } from '../stores/auth';

const notification = useNotification();
const api = useApiFetch();
const route = useRoute();

const isSubmitting = ref(true);
const submitCount = ref(0);
const sig = ref('');
const payload = ref('');
const ssoError = ref(false);

const store = useAuthUserStore();
const state = reactive({
	email: '',
	password: '',
	confirmPassword: '',
});

const v = useVuelidate();

async function onSubmit() {
	isSubmitting.value = true;
	const isFormCorrect = await v.value.$validate();
	if (!isFormCorrect) {
		isSubmitting.value = false;
		return;
	}
	submitCount.value++;
	const form: any = {
		email: state.email,
		password: state.password,
	};
	sendForm(form);
}

function sendForm(user: User) {
	store.login(user).then(
		() => {
			notification.open('positive', '');
			sso();
		},
		(error: any) => {
			isSubmitting.value = false;
			console.error(error);
			notification.open('negative', error);
		},
	);
}

onMounted(() => {
	sig.value = route.query.sig as string;
	payload.value = route.query.sso as string;
	if (payload.value && sig.value) {
		store
			.checkLoginStatus()
			.then((status) => {
				if (status)
					sso();
				else isSubmitting.value = false;
			})
			.catch(() => (isSubmitting.value = false));
	}
	else {
		ssoError.value = true;
		notification.open('negative', 'error.forbidden');
	}
});

onUnmounted(() => (isSubmitting.value = false));

async function sso() {
	if (sig.value && payload.value) {
		await api
			.get('/v1/auth/discourse', { sig: sig.value, payload: payload.value })
			.then((data) => {
				window.location.href = `https://forum.btree.at/session/sso_login?${data.q}`;
			})
			.catch(() => (ssoError.value = true));
	}
	else {
		ssoError.value = true;
		notification.open('negative', 'error.forbidden');
	}
}
</script>

<template>
	<q-card-section>
		<div class="text-h6 text-center">
			{{ $t('forum') }}
		</div>
		<FormErrorMax v-if="submitCount >= 15" />
		<div v-else-if="ssoError" class="text-center" data-cy="sso-error">
			{{ $t('error.forbidden') }}
		</div>
		<q-form v-else class="q-gutter-md" @submit.stop="onSubmit">
			<FormInputEmail v-model="state.email" />
			<FormUserPassword
				v-model:model-password="state.password"
			/>
			<q-card-actions class="">
				<BtnBase
					type="submit"
					size="lg"
					color="secondary"
					class="full-width text-white"
					:label="$t('login')"
					:disable="isSubmitting"
					:loading="isSubmitting"
				/>
			</q-card-actions>
		</q-form>
	</q-card-section>
</template>
