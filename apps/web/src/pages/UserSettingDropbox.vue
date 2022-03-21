<template>
  <div class="text-h3">{{ t('account') }}: hoberreiter@gmail.com</div>
  <div class="text-caption">
    Here you can add your Dropbox connection, if you want to delete this b.tree
    from dropbox use following link: Dropbox Connected Apps
  </div>
</template>

<script setup lang="ts">
//import Dropbox from 'dropbox';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  token: {
    type: String,
    default: null,
  },
});

console.log(props);

//var dbx = new Dropbox.Dropbox({ clientId: '' });
//console.log(dbx);
</script>
