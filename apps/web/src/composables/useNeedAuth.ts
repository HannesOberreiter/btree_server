import { reactive } from 'vue';
import { Dialog } from 'quasar';
import { i18n } from '~/boot/i18n';
import { useAuthUserStore } from '~/stores/auth';

const state = reactive({
  show: false,
});

const useNeedAuth = () => {
  const storeUser = useAuthUserStore();
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
      .onOk(() => {
        storeUser.logout().then(() => close());
      })
      .onDismiss(() => close());
  }
  function close() {
    state.show = false;
    return true;
  }
  return {
    state,
    open,
    close,
  };
};

export { useNeedAuth };
