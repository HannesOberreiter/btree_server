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
            v-if="dayjs(value.user.last_visit).year() === 1989"
            class="text-red-8"
          >
            {{ t('pending') }} ...
          </span>
          <span v-else class="text-grey-8">
            {{ t('lastVisit') }}:
            {{ dayjs(value.user.last_visit).locale(locale).format() }}
          </span>
        </q-item-label>
        <q-item-label lines="1" class="text-weight-medium">
          <q-btn
            flat
            @click="changeAccess(value.id, value.rank)"
            icon="fas fa-user-shield"
            :disable="value.user.id === user.id"
          >
            <span v-if="value.rank === 1" class="q-ml-sm">Admin</span>
            <span v-else-if="value.rank === 2" class="q-ml-sm">User</span>
            <span v-else class="q-ml-sm">Read-Only</span>
          </q-btn>
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
  <q-btn-group class="q-mt-lg" spread>
    <q-btn
      unelevated
      size="lg"
      color="primary"
      type="submit"
      :loading="isSubmitting"
      :label="t('add') + ' ' + t('user')"
      @click="addUser"
    />
  </q-btn-group>
</template>

<script setup lang="ts">
import { api } from 'src/boot/axios';
import { findIndex } from 'lodash';
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthUserStore } from 'src/stores/auth';
import { useI18n } from 'vue-i18n';
import { useNotification } from '../composables/useResponseText';
import { useQuasar } from 'quasar';
import dayjs from 'dayjs';

const notification = useNotification();
const { t, locale } = useI18n();
const $q = useQuasar();
const storeUser = useAuthUserStore();
const newUser = ref('');

const { user } = storeToRefs(storeUser);
const isSubmitting = ref(false);

const usersPromise = async () =>
  api.get('/v1/company_user/user').then(
    (response: any) => {
      return response.data;
    },
    (error) => {
      notification.open('negative', error.response);
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
        notification.open('negative', error.response);
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
    api.delete(`/v1/company_user/remove_user/${id}`).then(
      async (_response: any) => {
        usersData.value = await usersPromise();
        notification.open('positive', '');
      },
      (error) => {
        notification.open('negative', error.response);
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
          notification.open('negative', error.response);
        }
      );
  });
};
</script>
