<template>
  <q-card>
    <q-tabs
      v-model="activeTab"
      dense
      active-color="secondary"
      indicator-color="secondary"
      align="justify"
      narrow-indicator
    >
      <q-tab name="company" :label="t('company.name')" />
      <q-tab v-if="storeUser.isAdmin" name="users" :label="t('user', 2)" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="activeTab" animated>
      <q-tab-panel name="company">
        <div class="row">
          <div class="col-12 col-sm-10 col-md-8">
            <div class="text-body2 q-pb-sm text-center">
              {{ t('company.title') }}
            </div>
            <q-select
              v-model="model"
              :options="options"
              :option-value="(item) => item.id"
              :option-label="
                (item) =>
                  item.name == company.name
                    ? `${item.name} (${t('active')})`
                    : item.name
              "
              :label="t('company.active')"
              standout="bg-blue text-white"
              @update:model-value="changeCompany"
            >
              <template v-slot:prepend>
                <q-icon name="fas fa-warehouse" />
              </template>
            </q-select>
            <div class="q-mt-lg">
              <item-company></item-company>
            </div>
            <q-btn-group class="full-width q-mt-lg">
              <q-btn
                unelevated
                size="lg"
                color="primary"
                type="submit"
                :loading="isSubmitting"
                :label="t('new')"
                class="full-width"
              />
              <q-btn
                v-if="storeUser.isAdmin"
                unelevated
                size="lg"
                color="secondary"
                type="submit"
                :loading="isSubmitting"
                :label="t('edit')"
                class="full-width"
                @click="editCompany"
              />
              <q-btn
                v-if="storeUser.isAdmin"
                unelevated
                size="lg"
                color="negative"
                type="submit"
                :loading="isSubmitting"
                :label="t('delete')"
                class="full-width"
              />
            </q-btn-group>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="users">
        <div class="row">
          <div class="col-12 col-sm-10 col-md-8">
            <div class="text-body2 q-pb-sm text-center">
              {{ t('companyUsersTitle') }}
            </div>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthUserStore } from 'src/stores/auth';
import { useAuthTokenStore } from 'src/stores/token';
import { useRefreshStore } from '../stores/refresh';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import ItemCompany from 'src/components/ItemCompany.vue';
import { api } from 'src/boot/axios';
import { useNotification } from '../composables/useResponseText';

const prop = defineProps({
  tab: {
    type: String,
    default: 'company',
  },
});
const notification = useNotification();
const { t } = useI18n();
const $q = useQuasar();
const activeTab = ref(prop.tab ? prop.tab : 'company');
const storeUser = useAuthUserStore();
const storeToken = useAuthTokenStore();
const storeRefresh = useRefreshStore();

const { user, company } = storeToRefs(storeUser);

const isSubmitting = ref(false);
const model = company;
const options = computed(() => user.value.company);

const changeCompany = (value: any) => {
  isSubmitting.value = true;
  api.patch('/v1/user/company', { saved_company: value.id }).then(
    async (response: any) => {
      storeToken.refreshToken(response.data.token);
      await storeRefresh.refresh();
      notification.open('positive', '');
    },
    (error) => {
      notification.open('negative', error.response);
    }
  );
  isSubmitting.value = false;
};

const editCompany = () => {
  $q.dialog({
    title: t('edit'),
    message: t('company.changeName') + ':',
    prompt: {
      model: model.value.name,
      type: 'text', // optional
    },
    cancel: true,
    persistent: true,
  })
    .onOk((data) => {
      api.patch('/v1/company', { name: data }).then(
        async (_response: any) => {
          await storeRefresh.refresh();
          notification.open('positive', '');
        },
        (error) => {
          notification.open('negative', error.response);
        }
      );
      // console.log('>>>> OK, received', data)
    })
    .onCancel(() => {
      // console.log('>>>> Cancel')
    })
    .onDismiss(() => {
      // console.log('I am triggered on both OK and Cancel')
    });
};
</script>
