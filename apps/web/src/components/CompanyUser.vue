<template>
  <q-list bordered class="rounded-borders">
    <q-item v-for="value in usersData" :key="value.id">
      <q-item-section avatar>
        <q-btn
          v-if="value.user.id === user.id"
          flat
          icon="fas fa-crown"
          :disable="true"
        />
        <q-btn
          v-else
          flat
          icon="fas fa-user-minus"
          @click="removeAccess(value.id, value.user.email)"
        />
      </q-item-section>

      <q-item-section top>
        <q-item-label caption lines="1">
          {{ value.user.firstname }} {{ value.user.lastname }}
        </q-item-label>
        <q-item-label lines="1">
          <span class="text-weight-medium">{{ value.user.email }}</span>
        </q-item-label>
      </q-item-section>

      <q-item-section top>
        <q-item-label lines="1">
          <span
            v-if="useDate.getYear(value.user.last_visit) === 1989"
            class="text-red-8"
          >
            {{ t('pending') }} ...
          </span>
          <span v-else class="text-grey-8">
            {{ t('lastVisit') }}:
            {{ useDate.displayFormat(value.user.last_visit, 'date-time') }}
          </span>
        </q-item-label>
        <q-item-label lines="1" class="text-weight-medium">
          <q-btn
            flat
            :disable="value.user.id === user.id"
            icon="fas fa-user-shield"
            @click="changeAccess(value.id, value.rank)"
          >
            <span v-if="value.rank === 1" class="q-ml-sm">Admin</span>
            <span v-else-if="value.rank === 2" class="q-ml-sm">User</span>
            <span v-else class="q-ml-sm">Read-Only</span>
          </q-btn>
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
  <btn-base-group class="q-mt-lg">
    <q-btn
      size="md"
      color="primary"
      type="submit"
      :loading="isSubmitting"
      :label="t('add') + ' ' + t('user')"
      @click="addUser"
    />
  </btn-base-group>
</template>

<script setup lang="ts">
import { findIndex } from 'lodash-es';
import { useAuthUserStore } from '~/stores/auth';
import { useNotification } from '~/composables/useResponseText';
import { useQuasar } from 'quasar';
import { useDateFormat } from '~/composables/useDate';
import { useApiFetch } from '~/composables/useApi';

const notification = useNotification();
const api = useApiFetch();
const { t } = useI18n();
const useDate = useDateFormat();

const $q = useQuasar();
const storeUser = useAuthUserStore();
const newUser = ref('');

const { user } = storeToRefs(storeUser);
const isSubmitting = ref(false);

const usersPromise = async () =>
  api.get('/v1/company_user/user').then(
    (response: any) => {
      return response;
    },
    (error) => {
      notification.open('negative', error);
    }
  );

const usersData = ref(await usersPromise());

const checkDuplicate = (val: string) => {
  return (
    val.length >= 5 &&
    val.length <= 100 &&
    findIndex(usersData.value, function (o: any) {
      return o.user.email == val;
    }) === -1
  );
};

const changeAccess = (id: number, rank: number) => {
  if (rank === 1) rank = 3;
  else if (rank === 2) rank = 1;
  else rank = 2;
  api
    .patch(`/v1/company_user/${id}`, {
      rank: rank,
    })
    .then(
      async (_response: any) => {
        usersData.value = await usersPromise();
        notification.open('positive', '');
      },
      (error) => {
        notification.open('negative', error);
      }
    );
};

const removeAccess = (id: number, email: string) => {
  $q.dialog({
    title: t('remove') + ' ' + email,
    message: t('company.removeUser'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    api.deleting(`/v1/company_user/remove_user/${id}`).then(
      async (_response: any) => {
        usersData.value = await usersPromise();
        notification.open('positive', '');
      },
      (error) => {
        notification.open('negative', error);
      }
    );
  });
};

const addUser = () => {
  $q.dialog({
    title: t('add') + ' ' + t('user'),
    message: t('company.addUser'),
    prompt: {
      model: newUser.value,
      isValid: checkDuplicate,
      type: 'email',
      label: t('email'),
    },
    cancel: true,
    persistent: true,
  }).onOk((data) => {
    api
      .post('/v1/company_user/add_user', {
        email: data,
      })
      .then(
        async (_response: any) => {
          usersData.value = await usersPromise();
          notification.open('positive', '');
        },
        (error) => {
          notification.open('negative', error);
        }
      );
  });
};
</script>
