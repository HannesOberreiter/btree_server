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
      <q-tab name="company" :label="t('company')" />
      <q-tab v-if="userStore.isAdmin" name="users" :label="t('user', 2)" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="activeTab" animated>
      <q-tab-panel name="company">
        <div class="row">
          <div class="col-12 col-sm-10 col-md-8">
            <div class="text-body2 q-pb-sm text-center">
              {{ t('companyCompanyTitle') }}
            </div>
            <q-select
              standout
              v-model="model"
              :options="options"
              :option-value="(item) => item.id"
              :option-label="
                (item) =>
                  item.name == company.name
                    ? `${item.name} (${t('active')})`
                    : item.name
              "
              :label="t('activeCompany')"
            />
            <q-btn-group class="full-width q-mt-lg">
              <q-btn
                unelevated
                size="lg"
                color="primary"
                type="submit"
                :loading="isSubmitting"
                :label="t('newCompany')"
                class="full-width"
              />
              <q-btn
                v-if="userStore.isAdmin"
                unelevated
                size="lg"
                color="secondary"
                type="submit"
                :loading="isSubmitting"
                :label="t('editCompany')"
                class="full-width"
              />
              <q-btn
                v-if="userStore.isAdmin"
                unelevated
                size="lg"
                color="negative"
                type="submit"
                :loading="isSubmitting"
                :label="t('deleteCompany')"
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
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthUserStore } from 'src/stores/auth';
import { storeToRefs } from 'pinia';

const prop = defineProps({
  tab: {
    type: String,
    default: 'company',
  },
});

const { t } = useI18n();
const activeTab = ref(prop.tab ? prop.tab : 'company');
const userStore = useAuthUserStore();
const { user, company } = storeToRefs(userStore);

const isSubmitting = ref(false);
const model = ref(company.value);
const options = user.value.company;
</script>
