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
            <company-setting></company-setting>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="users">
        <div class="row">
          <div class="col-12 col-sm-10 col-md-8">
            <div class="text-body2 q-pb-sm text-center">
              {{ t('company.titleUser') }}
            </div>
            <Suspense>
              <company-user></company-user>
              <template #fallback>
                <div class="text-center">
                  <q-spinner-hourglass color="purple" size="4em" />
                </div>
              </template>
            </Suspense>
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
import CompanySetting from 'src/components/CompanySetting.vue';
import CompanyUser from 'src/components/CompanyUser.vue';

const prop = defineProps({
  tab: {
    type: String,
    default: 'company',
  },
});
const { t } = useI18n();
const storeUser = useAuthUserStore();
const activeTab = ref(prop.tab ? prop.tab : 'company');
</script>
