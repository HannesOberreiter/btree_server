<template>
  <GlobalLoading v-if="isLoading"></GlobalLoading>
  <div v-else-if="!data">
    {{ $t('error.noData') }}
  </div>
  <div v-else>
    <ul>
      <li v-for="(item, index) in data" :key="index">
        <b @click="openDialog(item.id)">{{ item.name }}</b>
        <span v-if="item.mark_colour">&nbsp;{{ item.mark_colour }}</span>
        <ul>
          <li>
            {{ $t('birth') }}: {{ useDateFormat().displayFormat(item.date) }}
          </li>
          <li v-if="item.mother">{{ $t('mother') }}: {{ item.mother }}</li>
          <li>{{ $t('race') }}: {{ item.race }}</li>
          <li>{{ $t('mating') }}: {{ item.mating }}</li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useQueenPedigree } from '~/composables/useQuery';
import { useDateFormat } from '~/composables/useDate';
import DialogForm from './DialogForm.vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
});

const id = toRef(props, 'id');

const { isLoading, data, refetch } = useQueenPedigree({
  id: id,
});

function openDialog(id: number) {
  $q.dialog({
    component: DialogForm,
    componentProps: {
      title: 'queen',
      form: 'queen',
      maximized: false,
      ids: [id],
    },
  }).onOk(async () => {
    await refetch.value();
  });
}
</script>
