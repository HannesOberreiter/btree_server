<template>
  <q-select
    ref="searchRef"
    v-model="search"
    :style="$q.platform.is.mobile ? 'display:none' : ''"
    dense
    use-input
    :loading="isLoadingHive && isLoadingApiary"
    :options="options"
    option-label="clabel"
    standout="bg-secondary text-white"
    placeholder="Search you colonies and apiaries"
    @filter="filterFn"
    @update:model-value="redirectFn"
  >
    <template #prepend>
      <q-icon
        flat
        dense
        color="white"
        size="md"
        name="fas fa-search"
        @click="searchRef.showPopup()"
      />
    </template>
  </q-select>
  <span v-if="$q.platform.is.mobile">
    <q-icon
      flat
      dense
      color="white"
      size="md"
      name="fas fa-search"
      @click="searchRef.showPopup()"
    />
  </span>
</template>

<script setup lang="ts">
import { filter, map } from 'lodash-es';
import { useApiariesQuery, useHivesQuery } from '~/composables/useQuery';

const { t } = useI18n();
const search = ref(null);
const searchRef = ref(null);
const options = ref([] as any);
const router = useRouter();

const { isLoading: isLoadingHive, data: hives } = useHivesQuery({
  modus: null,
  order: ['modus', 'hive_location.apiary_name', 'position'],
  direction: ['desc', 'asc', 'asc'],
});
const { isLoading: isLoadingApiary, data: apiaries } = useApiariesQuery({
  modus: null,
  order: ['modus', 'name'],
  direction: ['desc', 'asc'],
});

const data = computed(() => {
  let result = [...apiaries.value.results, ...hives.value.results];
  return map(result, (obj) => {
    let label =
      obj.modus === false ? obj.label + ' [' + t('inactive') + ']' : obj.label;
    label = obj.type === 'apiary' ? label + ' [' + t('apiary') + ']' : label;
    return { clabel: label, ...obj };
  });
});

function filterFn(val: any, update: any, _abort: any) {
  if (data !== null) {
    update(() => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      const needle = new RegExp(`(${val.toLowerCase()})`);
      options.value = filter(data.value, (obj) =>
        needle.test(obj.clabel.toLowerCase())
      );
    });
  }
  if (val === '') {
    update(() => {
      options.value = data.value;
    });
    return;
  }
}

function redirectFn(val: any) {
  if (val) {
    router.push({ name: `detail-${val.type}`, params: { id: val.id } });
  }
  search.value = null;
  searchRef.value.blur();
}
</script>
