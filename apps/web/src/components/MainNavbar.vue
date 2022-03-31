<template>
  <div class="row full-width items-center justify-between">
    <div class="col-1 col-sm-2 col-md-auto">
      <q-toolbar-title v-if="$q.screen.gt.xs" shrink>
        {{ company.name }}
      </q-toolbar-title>
    </div>
    <div class="col-4 col-sm-6 col-md-6 col-lg-4">
      <q-select
        v-model="search"
        dense
        clearable
        standout="bg-secondary text-white"
        placeholder="Search you colonies and apiaries"
      >
        <template #prepend>
          <q-btn
            v-close-popup
            flat
            dense
            color="white"
            size="md"
            icon="fas fa-search"
            @click="onSubmit"
          />
        </template>
      </q-select>
    </div>

    <div class="col-6 col-sm-4 col-md-auto">
      <div class="q-gutter-md text-right">
        <q-btn
          v-close-popup
          flat
          dense
          color="white"
          size="md"
          icon="fas fa-microphone"
          @click="onSpeak"
        />
        <q-btn
          v-if="!$q.platform.is.mobile"
          flat
          dense
          color="white"
          size="md"
          :icon="$q.fullscreen.isActive ? 'fas fa-compress' : 'fas fa-expand'"
          @click="$q.fullscreen.toggle()"
        />
        <q-btn
          flat
          dense
          color="white"
          size="md"
          :icon="$q.dark.isActive ? 'fas fa-moon' : 'fas fa-sun'"
          @click="$q.dark.toggle()"
        />
        <q-btn
          v-close-popup
          :disable="!storeRouter.isPrevious"
          flat
          dense
          color="white"
          size="md"
          icon="fas fa-backward-step"
          @click="router.replace({name: storeRouter.$state.previous as any,  params: storeRouter.$state.params as any})"
        >
          <q-tooltip>{{ $t('previousPage') }}</q-tooltip>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthUserStore } from '~/stores/auth';
import { useRouterStore } from '~/stores/router';

const router = useRouter();
const storeUser = useAuthUserStore();
const storeRouter = useRouterStore();
const { company } = storeToRefs(storeUser);
const search = ref('');

function onSubmit() {
  console.log('Searching ...');
}
function onSpeak() {
  console.log('Speaking ...');
}
</script>
