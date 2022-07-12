<template>
  <q-select
    v-model="model"
    :options="options"
    :option-value="(item) => item.id"
    :option-label="
      (item) =>
        item.name == company.name ? `${item.name} (${t('active')})` : item.name
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
import { findIndex } from 'lodash-es';
import { useAuthTokenStore } from '~/stores/token';
import { useAuthUserStore } from '~/stores/auth';
import { useNotification } from '~/composables/useNotification';
import { useQuasar } from 'quasar';
import { useRefreshStore } from '~/stores/refresh';
import { useApiFetch } from '~/composables/useApi';
import { clearCache } from '~/composables/useQuery';

const notification = useNotification();
const api = useApiFetch();
const { t } = useI18n();
const $q = useQuasar();
const storeUser = useAuthUserStore();
const storeToken = useAuthTokenStore();
const storeRefresh = useRefreshStore();
const router = useRouter();

const { user, company } = storeToRefs(storeUser);

const downloadLoading = ref(false);
const isSubmitting = ref(false);
const model = company;
const options = computed(() => user.value.company);

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
      storeToken.refreshToken(response.token);
      await storeRefresh.refresh();
      notification.open('positive', '');
      router.go(0);
    },
    (error) => {
      notification.open('negative', error);
    }
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
      async (response: any) => {
        storeToken.refreshToken(response.token);
        await storeRefresh.refresh();
        notification.open('positive', '');
      },
      (error) => {
        notification.open('negative', error);
      }
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
        await storeRefresh.refresh();
        notification.open('positive', '');
      },
      (error) => {
        notification.open('negative', error);
      }
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
        await storeRefresh.refresh();
        notification.open('positive', '');
      },
      (error) => {
        notification.open('negative', error);
      }
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
      async (response: any) => {
        storeToken.refreshToken(response.token);
        await storeRefresh.refresh();
        notification.open('positive', '');
      },
      (error) => {
        notification.open('negative', error);
      }
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
    }
  );
  downloadLoading.value = false;
};
</script>
