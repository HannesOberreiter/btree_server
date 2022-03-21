import { reactive } from 'vue';
import { Dialog } from 'quasar';
import AuthService from '~/services/auth.service';

const state = reactive({
  show: false,
});

const useNeedAuth = () => {
  function open() {
    state.show = true;
    Dialog.create({
      title: 'Session time-out',
    }).onOk(async () => {
      await AuthService.logout();
    });
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
