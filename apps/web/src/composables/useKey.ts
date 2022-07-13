import { onKeyStroke } from '@vueuse/core';
import { Ref } from 'vue';

const preventKey = (e: KeyboardEvent) => {
  if (
    (e.target as HTMLInputElement).nodeName == 'INPUT' ||
    (e.target as HTMLInputElement).nodeName == 'TEXTAREA'
  )
    return true;
  if ((e.target as HTMLInputElement).isContentEditable) return true;
  return false;
};

export const useKeyCalendar = (cal: Ref) => {
  onKeyStroke('ArrowLeft', (e) => {
    if (preventKey(e)) return;
    e.preventDefault();
    if (cal.value.getApi()) cal.value.getApi().prev();
  });
  onKeyStroke('ArrowRight', (e) => {
    if (preventKey(e)) return;
    e.preventDefault();
    if (cal.value.getApi()) cal.value.getApi().next();
  });
};

export const useKeyHelp = (showInfo: Ref) => {
  onKeyStroke(['h', 'H'], (e) => {
    if (preventKey(e)) return;
    e.preventDefault();
    showInfo.value = !showInfo.value;
  });
};
