<!-- This would need some love, as I use my very old news file I need this to clean up the mess a little bit -->

<template>
  <div v-html="value"></div>
</template>

<script setup lang="ts">
import { replace } from 'lodash';
const props = defineProps({
  news: {
    type: String,
    required: true,
  },
});

let value = replace(props.news, /- /g, '');
value = replace(value, /<br\/>,/g, '<br/>');
value = replace(value, /VISUAL/g, '<b>VISUAL</b>');
value = replace(value, /BUGFIX/g, '<b>BUGFIX</b>');
value = replace(value, /UPDATE/g, '<b>UPDATE</b>');
value = replace(value, /FEATURE/g, '<b>FEATURE</b>');
value = replace(value, /CHANGE/g, '<b>CHANGE</b>');
value = replace(value, /LANGUAGE/g, '<b>LANGUAGE</b>');
</script>
