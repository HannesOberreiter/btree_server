import { filter } from 'lodash-es';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const state = ref(false);
export function usePreventNavigation() {
  const { t } = useI18n();

  const unsavedPosition = (obj: any) => {
    state.value =
      filter(obj, (obj, index) => {
        return obj.position !== index + 1;
      }).length > 0;
    return state.value;
  };

  const blockMessage = (message = 'unsavedChanges') => {
    // eslint-disable-next-line no-alert
    const answer = window.confirm(t(message));
    if (!answer) {
      return false;
    }
    state.value = false;
    return true;
  };

  return {
    unsavedPosition,
    blockMessage,
    state
  };
}
