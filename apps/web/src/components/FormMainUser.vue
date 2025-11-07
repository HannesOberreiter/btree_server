<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import { useQuasarLang } from '../composables/useQuasarLang';
import { LANGUAGES } from '../constants';
import { requiredField } from '../helpers/i18n-validators';
import { useAuthUserStore } from '../stores/auth';
import BtnBase from './BtnBase.vue';
import BtnBaseGroup from './BtnBaseGroup.vue';
import FormInputText from './FormInputText.vue';
import FormUserDateFormat from './FormUserDateFormat.vue';
import FormUserLanguage from './FormUserLanguage.vue';
import FormUserNewsletter from './FormUserNewsletter.vue';

const { t } = useI18n();
const $q = useQuasar();
const api = useApiFetch();
const notification = useNotification();
const storeUser = useAuthUserStore();
const { user } = storeToRefs(storeUser);
const isSubmitting = ref(false);

const state = reactive({
	username: user.value.username || '',
	format: user.value.format || 'iso',
	lang: LANGUAGES.filter(e => e.value === user.value.lang)[0]!,
	sound: user.value.sound,
	newsletter: user.value.newsletter,
	acdate: user.value.acdate,
});

const rules = {
	lang: {
		requiredField,
	},
	sound: {},
	acdate: {},
};
const v = useVuelidate(rules, state, { $autoDirty: true });

async function onSubmit() {
	isSubmitting.value = true;
	const isFormCorrect = await v.value.$validate();
	if (!isFormCorrect) {
		isSubmitting.value = false;
		return;
	}
	const data = {
		username: state.username,
		format: state.format,
		lang: state.lang.value,
		sound: state.sound,
		acdate: state.acdate,
	};
	await api.patch('/v1/user', data).then(
		(response: any) => {
			useAuthUserStore().refresh(response);
			useQuasarLang($q);
			notification.open('positive', '');
		},
		(error) => {
			notification.open('negative', error);
		},
	);
	isSubmitting.value = false;
}

function onDelete() {
	isSubmitting.value = true;

	$q.dialog({
		title: `${t('delete')} ${user.value.email}`,
		message: t('profile.userDeleteText'),
		cancel: true,
		persistent: false,
		prompt: {
			model: '',
			isValid: val => val.length > 4 && val.length <= 100,
			type: 'password',
			label: t('password'),
		},
	})
		.onOk((value) => {
			api.patch('/v1/user/delete', { password: value }).then(
				async (_response: any) => {
					notification.open('positive', '');
					await storeUser.logout();
				},
				(error) => {
					notification.open('negative', error);
				},
			);
		})
		.onDismiss(() => (isSubmitting.value = false));
}
</script>

<template>
	<q-form data-cy="form-user" @submit.prevent.stop="onSubmit">
		<div class="col-12">
			<FormInputText
				v-model="state.username"
				label="username"
				:max-valid="45"
			/>
			<div class="col-12">
				<FormUserLanguage v-model="state.lang" />
			</div>
			<div class="col-12 q-mt-md q-mb-md">
				<FormUserDateFormat v-model="state.format" />
			</div>
			<div class="col-12">
				<FormUserNewsletter v-model="state.newsletter" />
			</div>
			<div class="col-12">
				<q-checkbox
					v-model="state.sound"
					color="primary"
					:true-value="true"
					:false-value="false"
				>
					<slot>
						{{ t('soundHint') }}
					</slot>
				</q-checkbox>
			</div>
			<div class="col-12">
				<q-checkbox
					v-model="state.acdate"
					color="primary"
					:true-value="true"
					:false-value="false"
				>
					<slot>
						{{ t('visHint') }}
					</slot>
				</q-checkbox>
			</div>
		</div>
	</q-form>
	<BtnBaseGroup size="md" class="q-mt-md">
		<BtnBase
			color="secondary"
			type="submit"
			:loading="isSubmitting"
			:label="t('save')"
			@click="onSubmit"
		/>
		<BtnBase
			color="negative"
			:loading="isSubmitting"
			:label="`${t('delete')} ${t('account')}`"
			@click="onDelete"
		/>
	</BtnBaseGroup>
</template>
