<template>
  <btn-base
    v-if="speech.isSupported"
    v-close-popup
    flat
    dense
    :color="speech.isListening.value ? 'secondary' : 'white'"
    size="md"
    icon="fas fa-microphone"
    @click="onStart"
  >
  </btn-base>
</template>

<script lang="ts">
interface Haystack {
  id?: number;
  aliases: Array<string>;
  command: string;
}
</script>

<script setup lang="ts">
import { useSpeechRecognition } from '@vueuse/core';
import { useApiariesQuery, useHivesQuery } from '~/composables/useQuery';
import Fuse from 'fuse.js';
import { useNotification } from '~/composables/useNotification';

const router = useRouter();
const { t } = useI18n();
const notification = useNotification();
const speech = useSpeechRecognition({
  lang: 'de',
  interimResults: false,
  continuous: false,
});

const spoken = ref('');
const haystack = ref([]);

const onStart = () => {
  speech.result.value = '';
  speech.toggle();
};

const { data: hives } = useHivesQuery({
  modus: true,
  enabled: speech.isSupported,
});
const { data: apiaries } = useApiariesQuery({
  modus: true,
  enabled: speech.isSupported,
});

const commands = [
  {
    command: 'dashboard',
    aliases: ['dashboard', 'calendar', 'kalender'],
  },
  {
    command: 'feed',
    aliases: ['feeding', 'fütterung'],
  },
  {
    command: 'treatment',
    aliases: ['treatment', 'behandlung'],
  },
  {
    command: 'harvest',
    aliases: ['harvest', 'ernte'],
  },
  {
    command: 'checkup',
    aliases: ['checkup', 'kontrolle'],
  },
] as Array<Haystack>;

if (speech.isSupported) {
  watch(
    [hives, apiaries],
    () => {
      let hivesStack = [] as Array<Haystack>;
      if (hives.value) {
        hivesStack = hives.value.results.map((obj: any) => {
          return {
            id: obj.id,
            command: 'hive',
            aliases: [obj.name],
          };
        }) as Array<Haystack>;
      }
      let apiariesStack = [] as Array<Haystack>;
      if (apiaries.value) {
        apiariesStack = apiaries.value.results.map((obj: any) => {
          return {
            id: obj.id,
            command: 'apiary',
            aliases: [obj.name],
          };
        }) as Array<Haystack>;
      }
      // Haystack for fuzzy search
      haystack.value = [...hivesStack, ...apiariesStack, ...commands];
      buildGrammer(haystack.value);
    },
    { immediate: true }
  );

  function buildGrammer(haystack: Array<Haystack>) {
    const aliases = haystack.map((obj: Haystack) => obj.aliases.join(' | '));
    const grammar = `#JSGF V1.0; grammar at.btree.commands; public <commands> = ${aliases.join(
      ' | '
    )} ;`;
    const SpeechGrammarList =
      (window as any).SpeechGrammarList ||
      (window as any).webkitSpeechGrammarList;
    const speechRecognitionList = new SpeechGrammarList();
    speechRecognitionList.addFromString(grammar, 1);
    speech.recognition.grammars = speechRecognitionList;
  }

  if (speech.isSupported) {
    watch(speech.result, (cur) => {
      if (cur.trim()) {
        spoken.value = cur.toLowerCase();
        fuzzySearch(spoken.value, haystack.value);
      }
    });
  }
}

function fuzzySearch(command: string, haystack: any) {
  const options = {
    shouldSort: true,
    keys: ['aliases'],
  };
  const fuse = new Fuse(haystack, options);
  const result = fuse.search(command);
  handleResult(result[0], command);
}

function handleResult(result: any, command: string) {
  let name = '';
  let params = {};
  if (result) {
    switch (result.item.command) {
      case 'hive':
      case 'apiary':
        name = `detail-${result.item.command}`;
        params = { id: result.item.id };
        break;

      case 'feed':
      case 'harvest':
      case 'treatment':
      case 'checkup':
        name = 'new-quicktool';
        params = { task: result.item.command };
        break;

      case 'dashboard':
        name = 'calendar';
        break;
    }
  }
  if (name) {
    notification.open(
      'info',
      t('speech.commandRedirect', { msg: command.toUpperCase() }),
      true
    );
    router.push({ name: name, params: params });
  } else {
    notification.open(
      'warning',
      t('speech.noCommand', { msg: command.toUpperCase() }),
      true
    );
  }
}
</script>
