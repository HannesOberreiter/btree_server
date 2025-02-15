<template>
  <q-select
    v-model="model"
    :options="options"
    :option-value="(item) => item.id"
    :option-label="
      (item) =>
        item.name == company.name
          ? `${item.name} (${t('active')})`
          : `${item.name} (${t('paid')}: ${useDate.displayFormat(
              item.paid.toString(),
            )})`
    "
    :label="t('company.active')"
    standout="bg-blue text-white"
    @update:model-value="changeCompany"
  >
    <template #prepend>
      <q-icon name="fas fa-warehouse" />
    </template>
  </q-select>
  <div class="q-mt-lg">
    <item-company></item-company>
  </div>
  <btn-base-group size="md" class="q-mt-lg">
    <btn-base
      color="primary"
      :loading="isSubmitting"
      :label="t('new')"
      @click="newCompany"
    />
    <btn-base
      v-if="storeUser.isAdmin"
      color="info"
      :loading="downloadLoading"
      :label="t('download')"
      @click="downloadContent"
    >
    </btn-base>
    <btn-base
      v-if="storeUser.isAdmin"
      color="secondary"
      :loading="isSubmitting"
      :label="t('edit')"
      @click="editCompany"
    />
  </btn-base-group>
  <btn-base-group size="md" class="q-mt-md">
    <btn-base
      v-if="storeUser.isAdmin"
      color="primary"
      :loading="isSubmitting"
      :label="t('server.text.button')"
      @click="importData"
    />
    <btn-base
      color="red-10"
      :loading="isSubmitting"
      :label="t('removeAccess')"
      @click="removeAccess"
    />
    <btn-base
      v-if="storeUser.isAdmin"
      color="negative"
      :loading="isSubmitting"
      :label="t('delete')"
      @click="deleteCompany"
    />
  </btn-base-group>
</template>

<script setup lang="ts">
import { findIndex, sortBy } from 'lodash-es';
import { useAuthUserStore } from '../stores/auth';
import { useNotification } from '../composables/useNotification';
import { useQuasar } from 'quasar';
import { useRefreshStore } from '../stores/refresh';
import { useApiFetch } from '../composables/useApi';
import { clearCache, useInvalidateQueries } from '../composables/useQuery';
import { useDateFormat } from '../composables/useDate';
import BtnBase from './BtnBase.vue';
import BtnBaseGroup from './BtnBaseGroup.vue';
import ItemCompany from './ItemCompany.vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';

const notification = useNotification();
const useDate = useDateFormat();
const api = useApiFetch();
const { t } = useI18n();
const $q = useQuasar();
const storeUser = useAuthUserStore();
const storeRefresh = useRefreshStore();
const invalidateQueries = useInvalidateQueries();
const router = useRouter();

const { user, company } = storeToRefs(storeUser);

const downloadLoading = ref(false);
const isSubmitting = ref(false);
const model = company;

const sortCompanyName = (company: any) => company.name.toString().toLowerCase();
const options = computed(() => {
  return sortBy(user.value.company, [sortCompanyName]);
});

const checkCompanyName = (val: string) => {
  return (
    val.length >= 5 &&
    val.length <= 45 &&
    findIndex(options.value, { name: val }) === -1
  );
};

const changeCompany = (value: any) => {
  isSubmitting.value = true;
  api.patch('/v1/user/company', { saved_company: value.id }).then(
    async (response: any) => {
      clearCache();
      invalidateQueries.invalidate();
      storeUser.refresh(response.data);
      notification.open('positive', '');
      router.go(0);
    },
    (error) => {
      notification.open('negative', error);
    },
  );
  isSubmitting.value = false;
};

const removeAccess = () => {
  $q.dialog({
    title: t('remove') + ' ' + model.value.name,
    class: 'bg-lime-12',
    message: t('company.removeAccess'),
    prompt: {
      model: '',
      isValid: (val) => val === model.value.name,
      type: 'text',
      label: model.value.name,
    },
    cancel: true,
    persistent: true,
  }).onOk(() => {
    api.remove(`/v1/company_user/${model.value.id}`).then(
      async (_response: any) => {
        invalidateQueries.invalidate();
        await storeRefresh.refresh();
        notification.open('positive', '');
      },
      (error) => {
        notification.open('negative', error);
      },
    );
  });
};

const editCompany = () => {
  $q.dialog({
    title: t('edit') + ' ' + model.value.name,
    message: t('company.changeName') + ':',
    prompt: {
      model: model.value.name,
      isValid: checkCompanyName,
      type: 'text', // optional
      label: model.value.name,
    },
    cancel: true,
    persistent: false,
  }).onOk((data) => {
    api.patch('/v1/company', { name: data }).then(
      async (_response: any) => {
        invalidateQueries.invalidate();
        await storeRefresh.refresh();
        notification.open('positive', '');
      },
      (error) => {
        notification.open('negative', error);
      },
    );
  });
};

const newCompany = () => {
  $q.dialog({
    title: t('new'),
    message: t('company.new'),
    prompt: {
      model: '',
      isValid: checkCompanyName,
      type: 'text',
    },
    cancel: true,
    persistent: true,
  }).onOk((data) => {
    api.post('/v1/company', { name: data }).then(
      async (_response: any) => {
        invalidateQueries.invalidate();
        await storeRefresh.refresh();
        notification.open('positive', '');
      },
      (error) => {
        notification.open('negative', error);
      },
    );
  });
};

const deleteCompany = () => {
  $q.dialog({
    title: t('delete') + ' ' + model.value.name,
    class: 'bg-lime-12',
    message: t('company.delete'),
    prompt: {
      model: '',
      isValid: (val) => val === model.value.name,
      type: 'text',
      label: model.value.name,
    },
    cancel: true,
    persistent: true,
  }).onOk(() => {
    api.remove(`/v1/company/${model.value.id}`).then(
      async (_response: any) => {
        invalidateQueries.invalidate();
        await storeRefresh.refresh();
        notification.open('positive', '');
      },
      (error) => {
        notification.open('negative', error);
      },
    );
  });
};

const downloadContent = async () => {
  downloadLoading.value = true;
  await api.download('/v1/company/download').then(
    (data) => {
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(data);
      a.download = 'btree_export_' + new Date().toISOString() + '.zip';
      a.click();
      a.remove();
    },
    (error) => {
      notification.open('negative', error);
    },
  );
  downloadLoading.value = false;
};

const importData = async () => {
  $q.dialog({
    title: t('server.text.title'),
    message: t('server.text.info'),
    prompt: {
      model: '',
      type: 'file',
    },
    cancel: true,
    persistent: false,
  }).onOk((data: FileList) => {
    api.postMultiPart('/v1/company/import', { upload: data[0] }).then(
      async (data) => {
        invalidateQueries.invalidate();
        await storeRefresh.refresh();
        notification.open('positive', data.name, true);
      },
      (error) => {
        notification.open('negative', error);
      },
    );
  });
};
</script>
