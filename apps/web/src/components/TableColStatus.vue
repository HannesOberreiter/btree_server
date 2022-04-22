<template>
  <q-td class="text-center">
    <q-icon
      :name="value ? 'fas fa-circle-check' : 'fas fa-circle-xmark'"
      style="cursor: pointer"
      :color="value ? 'positive' : 'negative'"
      size="sm"
      @click="changeStatus"
    >
    </q-icon>
  </q-td>
</template>

<script setup lang="ts">
import { useApiFetch } from '~/composables/useApi';
import { useNotification } from '~/composables/useResponseText';

const notification = useNotification();
const api = useApiFetch();
const emit = defineEmits(['change']);
const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
  value: {
    type: Boolean,
    required: true,
  },
  table: {
    type: String,
    required: true,
  },
  tableOption: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'status',
  },
});

async function changeStatus() {
  const data = JSON.stringify({
    status: !props.value,
    ids: [props.id],
  });
  const url =
    props.table === 'option'
      ? `/v1/${props.table}/${props.tableOption}/${props.type}`
      : `/v1/${props.table}/${props.type}`;
  await api.patch(url, data).then(
    (_response: any) => {
      notification.open('positive', '');
      emit('change', true);
    },
    (error) => {
      notification.open('negative', error);
    }
  );
}
</script>
