<template>
  <q-toolbar dense style="max-height: 36px; min-height: 34px">
    <router-link
      v-if="data && !isFetching && !error"
      :to="{ name: 'news' }"
      class="text-white"
      style="text-decoration: none"
    >
      {{ $t('version') }}: {{ data[0].version }}
      <span v-if="!$q.platform.is.mobile"> [{{ data[0].date }}] </span>
      <tooltip-base>{{ $t('news') }}</tooltip-base>
    </router-link>
    <q-space></q-space>
    <a :href="mailTo" class="text-white" style="text-decoration: none">
      <q-icon name="fas fa-envelope" size="xs">
        <tooltip-base>{{ $t('contact') }}</tooltip-base>
      </q-icon>
    </a>
    <q-space></q-space>
    <a
      :href="linkTo"
      target="_blank"
      rel="noopener"
      class="text-white"
      style="text-decoration: none"
    >
      <q-icon name="fas fa-book" size="xs">
        <tooltip-base>{{ $t('faqs') }}</tooltip-base>
      </q-icon>
    </a>
    <q-space></q-space>
    <btn-base
      icon="fas fa-circle-question"
      size="sm"
      :aria-label="$t('help.name')"
      @click="showInfo = !showInfo"
      ><tooltip-base>{{ $t('help.name') }} (h)</tooltip-base></btn-base
    >
    <btn-share :show-path="true"></btn-share>
  </q-toolbar>
  <global-sound></global-sound>
  <dialog-hint v-model="showInfo" :hint="help"></dialog-hint>
</template>

<script setup lang="ts">
import { useKeyHelp } from '~/composables/useKey';
import { useFetch } from '@vueuse/core';
import { useAuthUserStore } from '~/stores/auth';

// const build_version = process.env.NPM_PACKAGE_VERSION;
const storeUser = useAuthUserStore();
const { isFetching, error, data }: any = useFetch(
  '/news.json?cache=' + Date.now()
)
  .get()
  .json();

const router = useRouter();
const help = computed(() => `help.${String(router.currentRoute.value.name)}`);
const showInfo = ref(false);

const mailTo = computed(() => {
  return `mailto:office@btree.at?subject=BeeID: ${storeUser.user.id} UserID: ${storeUser.company.id}`;
});

const linkTo = computed(() => {
  return `https://www.btree.at/${
    storeUser.getLanguage === 'de' ? 'de' : 'en'
  }/doc-faqs/`;
});

useKeyHelp(showInfo);
</script>
