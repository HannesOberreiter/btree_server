import { reactive } from 'vue';
import { Dialog } from 'quasar';
import AuthService from '~/services/auth.service';
import { i18n } from '~/boot/i18n';

const state = reactive({
  show: false,
});

const useNeedAuth = () => {
  function open() {
    state.show = true;
    Dialog.create({
      focus: 'ok',
      cancel: false,
      persistent: true,
      html: true,
      title: i18n.global.t('sessionTimeOut'),
      message: '<div data-cy="dialog-session-timeout"></div>',
    })
      .onOk(async () => {
        await AuthService.logout();
        close();
      })
      .onDismiss(() => close());
  }
  function close() {
    state.show = false;
  }
  return {
    state,
    open,
    close,
  };
};

export { useNeedAuth };
