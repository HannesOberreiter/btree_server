<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="width: 700px">
      <q-card-section>
        <div class="row">
          <div class="text-h6">{{ $t('filter') }}</div>
          <q-space />
          <q-btn
            ref="closeBtn"
            v-close-popup
            icon="fas fa-times"
            flat
            round
            dense
          />
        </div>
        <div class="row full-width">
          <div class="col-12">
            <form-dropdown-type
              v-model="state.type_id"
              table="hive_types"
              label="type"
              allow-empty="filterEmpty"
            ></form-dropdown-type>
          </div>
          <div class="col-12">
            <form-dropdown-type
              v-model="state.source_id"
              table="hive_sources"
              label="source"
              allow-empty="filterEmpty"
            ></form-dropdown-type>
          </div>
        </div>
      </q-card-section>
      <q-card-actions>
        <q-btn color="primary" @click="onDialogOK()">
          {{ $t('filter') }}
        </q-btn>
        <q-btn color="negative darken-1" @click="resetFilter()">
          {{ $t('filterRemove') }}
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useTableFilterStore } from '~/stores/tableFilter';
import FormDropdownType from './FormDropdownOption.vue';

const storeFilter = useTableFilterStore();

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const props = defineProps({
  form: {
    type: String,
    required: true,
  },
});

const state = reactive({
  type_id: storeFilter.field(props.form, 'type_id'),
  source_id: storeFilter.field(props.form, 'source_id'),
});

watch(state, (cur) => {
  storeFilter.update(props.form, cur);
});

function resetFilter() {
  storeFilter.reset(props.form);
  onDialogHide();
}

defineEmits([...useDialogPluginComponent.emits]);
</script>
