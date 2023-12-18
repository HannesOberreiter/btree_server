import { reactive, ref } from 'vue';
import { Dialog, DialogChainObject } from 'quasar';
import { i18n } from '~/boot/i18n';
import { useAuthUserStore } from '~/stores/auth';

const state = reactive({
  show: false,
});
const dialog = ref<DialogChainObject | null>(null);

const useNeedAuth = () => {
  const storeUser = useAuthUserStore();
  function open() {
    state.show = true;
    dialog.value = Dialog.create({
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
};

export { useNeedAuth };
