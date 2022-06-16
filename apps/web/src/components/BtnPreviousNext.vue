<template>
  <div v-if="sameLocationIndex">
    <btn-base
      v-if="sameLocationIndex.previous"
      size="md"
      class="absolute-top-left"
      icon="fas fa-arrow-left"
      @click="redirect(data.sameLocation[sameLocationIndex.previous].id)"
    >
      <q-tooltip>
        {{ data.sameLocation[sameLocationIndex.previous].name }}
      </q-tooltip>
    </btn-base>
    <btn-base
      v-if="sameLocationIndex.next"
      size="md"
      class="absolute-top-right"
      icon="fas fa-arrow-right"
      @click="redirect(data.sameLocation[sameLocationIndex.next].id)"
    >
      <q-tooltip>
        {{ data.sameLocation[sameLocationIndex.next].name }}
      </q-tooltip>
    </btn-base>
  </div>
</template>

<script setup lang="ts">
import { findIndex } from 'lodash-es';

const router = useRouter();
const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  link: {
    type: String,
    default: 'hive',
  },
});

const data = toRef(props, 'data');

const sameLocationIndex = computed(() => {
  if (data.value) {
    if (!data.value.sameLocation) return null;
    const index = findIndex(
      data.value.sameLocation,
      (o: any) => o.id === data.value.id
    );

    return {
      previous: index <= 0 ? null : index - 1,
      next: index === data.value.sameLocation.length - 1 ? null : index + 1,
    };
  } else {
    return null;
  }
});

function redirect(id: number) {
  router.push({ name: `detail-${props.link}`, params: { id: id } });
}
</script>
