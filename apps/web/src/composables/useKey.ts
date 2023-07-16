import { onKeyStroke } from '@vueuse/core';
import { Ref, computed } from 'vue';

declare interface Pagination {
  sortBy: string;
  descending: boolean;
  page: number;
  rowsPerPage: number;
  rowsNumber: number;
}

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

export const useKeySpeak = (btn: Ref) => {
  onKeyStroke(['s', 'S'], (e) => {
    if (preventKey(e)) return;
    e.preventDefault();
    btn.value.$el.click();
  });
};

export const useKeyTable = (page: Ref<Pagination>) => {
  const pages = computed(() =>
    Math.ceil(page.value.rowsNumber / page.value.rowsPerPage),
  );
  onKeyStroke(['ArrowUp'], (e) => {
    if (page.value.page <= 1) return;
    if (preventKey(e)) return;
    e.preventDefault();
    page.value.page = 1;
  });
  onKeyStroke(['ArrowLeft'], (e) => {
    if (page.value.page <= 1) return;
    if (page.value.page - 1 < 1) return;
    if (preventKey(e)) return;
    e.preventDefault();
    page.value.page = page.value.page - 1;
  });
  onKeyStroke(['ArrowRight'], (e) => {
    if (page.value.page === pages.value) return;
    if (page.value.page + 1 > pages.value) return;
    if (preventKey(e)) return;
    e.preventDefault();
    page.value.page = page.value.page + 1;
  });
  onKeyStroke(['ArrowDown'], (e) => {
    if (page.value.page === pages.value) return;
    if (preventKey(e)) return;
    e.preventDefault();
    page.value.page = pages.value;
  });
};
