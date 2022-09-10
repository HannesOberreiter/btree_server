<template>
  <btn-base
    v-if="speech.isSupported && !$q.platform.is.safari"
    ref="btn"
    v-close-popup
    flat
    dense
    :color="speech.isListening.value ? 'secondary' : 'white'"
    size="md"
    icon="fas fa-microphone"
    :aria-label="$t('speech.tooltip')"
    @click="onStart"
  >
    <tooltip-base anchor="bottom middle" self="top middle">
      {{ $t('speech.tooltip') }} (s)
    </tooltip-base>
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
import { useQuasar } from 'quasar';
import { useKeySpeak } from '~/composables/useKey';

const router = useRouter();
const btn = ref(null);
const $q = useQuasar();
const { t } = useI18n();
const notification = useNotification();

const { locale } = useI18n();

const speech = useSpeechRecognition({
  lang: locale,
  interimResults: false,
  continuous: false,
});

const spoken = ref('');
const haystack = ref([]);

useKeySpeak(btn);

const onStart = () => {
  if (!speech.isListening.value)
    notification.open('info', t('speech.start'), true);
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

if (speech.isSupported && !$q.platform.is.safari) {
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
    try {
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
    } catch (e) {
      console.error(e);
    }
  }

  watch(speech.result, (cur) => {
    if (cur.trim()) {
      spoken.value = cur.toLowerCase();
      fuzzySearch(spoken.value, haystack.value);
    }
  });
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
  let text = '';
  let params = {};
  if (result) {
    switch (result.item.command) {
      case 'hive':
      case 'apiary':
        name = `detail-${result.item.command}`;
        params = { id: result.item.id };
        text = result.item.aliases[0];
        break;

      case 'feed':
      case 'harvest':
      case 'treatment':
      case 'checkup':
        name = 'new-quicktool';
        params = { task: result.item.command };
        text = t(result.item.command);
        break;

      case 'dashboard':
        name = 'calendar';
        text = t(result.item.command);
        break;
    }
  }
  if (name) {
    notification.open(
      'positive',
      t('speech.commandRedirect', { text: text, msg: command }),
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
