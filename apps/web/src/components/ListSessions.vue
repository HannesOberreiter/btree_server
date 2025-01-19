<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApiFetch } from '../composables/useApi';
import { useNotification } from '../composables/useNotification';
import BtnBase from './BtnBase.vue';
import { useDateFormat } from '../composables/useDate';

const api = useApiFetch();
const t = useI18n().t;
const notification = useNotification();
const items = ref<any>(null);
const useDate = useDateFormat();

fetchSession();

function fetchSession() {
  api.get('/v1/user/session').then(
    (response: any) => {
      items.value = response;
    },
    (error) => {
      console.error(error);
    },
  );
}

function deleteSession(id: string) {
  api.remove('/v1/user/session/' + id).then(
    () => {
      fetchSession();
      notification.open('positive', t('sessionRemoved'), true);
    },
    (error) => {
      notification.open('negative', error);
      console.error(error);
    },
  );
}
</script>

<template>
  <q-list>
    <q-item v-for="item in items" :key="item.user?.uuid" clickable>
      <q-item-section>
        <q-item-label class="text-body2">
          <b>IP:</b> {{ item.user?.ip }} <br />
          <b>{{ $t('userAgent') }}:</b> {{ item.user.user_agent }}
        </q-item-label>
        <q-item-label caption>
          {{ $t('expireDate') }}:
          {{ useDate.displayFormat(item.cookie.expires, 'date-time-seconds') }}
          <br />
          {{ $t('lastVisit') }}:
          {{ useDate.displayFormat(item.user.last_visit, 'date-time-seconds') }}
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <BtnBase
          v-if="!item.user.currentSession"
          color="secondary"
          :label="$t('delete')"
          size="md"
          @click="deleteSession(item.id)"
        />
        <BtnBase
          v-else
          color="positive"
          :label="$t('currentSession')"
          size="md"
          :disable="true"
        />
      </q-item-section>
    </q-item>
  </q-list>
</template>
