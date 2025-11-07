import type { DialogChainObject } from 'quasar';
import { Dialog } from 'quasar';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthUserStore } from '../stores/auth';

const state = reactive({
	show: false,
});
const dialog = ref<DialogChainObject | null>(null);

function useNeedAuth() {
	const { t } = useI18n();
	const storeUser = useAuthUserStore();
	function open() {
		state.show = true;
		dialog.value = Dialog.create({
			focus: 'ok',
			cancel: false,
			persistent: true,
			html: true,
			title: t('sessionTimeOut'),
			message: '<div data-cy="dialog-session-timeout"></div>',
		})
			.onOk(() => {
				storeUser.logout().then(() => close());
			})
			.onDismiss(() => {
				state.show = false;
			});
	}
	function close() {
		state.show = false;
		dialog.value?.hide();
		return true;
	}
	return {
		state,
		open,
		close,
	};
}

export { useNeedAuth };
