<script setup lang="ts">
import { marked } from 'marked';
import { useQuasar } from 'quasar';
import { nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNotification } from '../composables/useNotification';
import { useVoiceRecording } from '../composables/useVoiceRecording';
import { useWizBee } from '../composables/useWizBee';
import { useAuthUserStore } from '../stores/auth';

const props = defineProps<{
  /** Show example question chips */
  showExamples?: boolean;
  /** Allow the chat to shrink with the dialog's visible viewport */
  isDialog?: boolean;
}>();

marked.use({ breaks: true, gfm: true });

function renderMarkdown(content: string): string {
  return marked.parse(content) as string;
}

function formatToolName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^\s/, '')
    .toLowerCase();
}

const { t } = useI18n();
const $q = useQuasar();
const notify = useNotification();
const authStore = useAuthUserStore();
const {
  question,
  chatHistory,
  error,
  isFetching,
  isStreaming,
  monthlyUsage,
  isPremium,
  isDisabled,
  fetchMonthlyUsage,
  transcribeAudio,
  sendQuestion,
  abortStream,
  clearChat
} = useWizBee();

const {
  isRecording: isVoiceRecording,
  isSupported: isVoiceSupported,
  error: voiceError,
  remainingSeconds: voiceRemainingSeconds,
  start: startVoice,
  stop: stopVoice
} = useVoiceRecording();
const isTranscribing = ref(false);

async function onToggleVoice() {
  if (isTranscribing.value) {
    return;
  }

  if (!isVoiceSupported.value) {
    notify.open('negative', t('error.voiceUnsupported'));
    return;
  }

  if (isVoiceRecording.value) {
    const recording = await stopVoice();
    if (!recording) {
      if (voiceError.value === 'permission') {
        notify.open('negative', t('error.voicePermission'));
      }
      return;
    }
    if (voiceError.value === 'timeout') {
      notify.open('warning', t('voice.autoStopped'));
    }

    isTranscribing.value = true;
    try {
      const language = authStore.getLanguage ?? 'en';
      const fileName = `voice.${recording.extension}`;
      const res = await transcribeAudio({
        blob: recording.blob,
        fileName,
        language
      });
      const text = (res.text ?? '').trim();
      if (!text) {
        notify.open('warning', t('error.voiceEmpty'));
        return;
      }
      question.value = text;
      sendQuestion();
    } catch (e: any) {
      notify.open('negative', e);
    } finally {
      isTranscribing.value = false;
    }
    return;
  }

  const started = await startVoice();
  if (!started) {
    if (voiceError.value === 'permission') {
      notify.open('negative', t('error.voicePermission'));
    } else if (voiceError.value === 'unsupported') {
      notify.open('negative', t('error.voiceUnsupported'));
    } else {
      notify.open('negative', t('error.unknown'));
    }
  }
}

const exampleQuestions = [
  t('exampleQuestion.offline'),
  t('exampleQuestion.premium'),
  t('exampleQuestion.option'),
  t('exampleQuestion.count'),
  t('exampleQuestion.harvest')
];

const chatContainer = ref<HTMLElement | null>(null);

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

watch(() => chatHistory.value.length, scrollToBottom);
watch(() => chatHistory.value.at(-1)?.content, scrollToBottom);

onMounted(() => {
  fetchMonthlyUsage();
});

function onSubmit() {
  sendQuestion();
}

function onExampleQuestion(example: string) {
  question.value = example;
  sendQuestion();
}

function onClear() {
  clearChat();
}
</script>

<template>
  <div
    class="wizbee-chat column full-height"
    :class="{ 'wizbee-chat--dialog': props.isDialog }"
  >
    <!-- Chat messages area -->
    <div ref="chatContainer" class="wizbee-chat__messages col q-pa-sm">
      <q-resize-observer v-if="props.isDialog" @resize="scrollToBottom" />
      <!-- Empty state -->
      <div
        v-if="chatHistory.length === 0 && !error"
        class="column items-center justify-center full-height text-grey-6"
      >
        <img
          src="/wizbee/favicon-96x96.png"
          alt="WizBee Logo"
          height="48"
          class="q-mb-sm"
          :class="{ 'invert-colors': $q.dark.isActive }"
        />
        <div class="text-subtitle1">
          {{ $t('askQuestion') }}
        </div>

        <!-- Example questions -->
        <div v-if="showExamples" class="q-mt-md q-gutter-sm row justify-center">
          <q-btn
            v-for="example in exampleQuestions"
            :key="example"
            no-caps
            outline
            size="sm"
            :loading="isFetching"
            @click="onExampleQuestion(example)"
          >
            {{ example }}
          </q-btn>
        </div>
      </div>

      <!-- Messages -->
      <template v-else>
        <div v-for="(msg, idx) in chatHistory" :key="idx" class="q-mb-sm">
          <!-- User message -->
          <div v-if="msg.role === 'user'" class="row justify-end">
            <div
              class="wizbee-chat__bubble wizbee-chat__bubble--user q-pa-sm q-px-md rounded-borders"
            >
              {{ msg.content }}
            </div>
          </div>
          <!-- Tool call (muted, like "thinking") -->
          <div v-else-if="msg.role === 'tool'" class="row justify-start">
            <div class="wizbee-chat__tool row items-center q-gutter-x-xs">
              <q-spinner-dots v-if="!msg.toolDone" size="14px" color="grey-5" />
              <q-icon v-else name="fas fa-check" size="12px" color="grey-5" />
              <span>{{ formatToolName(msg.toolName || msg.content) }}</span>
            </div>
          </div>
          <!-- Model message -->
          <div v-else class="row justify-start">
            <div
              class="wizbee-chat__bubble wizbee-chat__bubble--model q-pa-sm q-px-md rounded-borders wizbee-chat__markdown"
              v-html="renderMarkdown(msg.content)"
            />
          </div>
        </div>

        <!-- Streaming indicator -->
        <div v-if="isStreaming || isFetching" class="row justify-start q-mb-sm">
          <q-spinner-dots color="grey-6" size="24px" />
        </div>

        <!-- Error -->
        <div v-if="error" class="q-mb-sm">
          <q-banner class="bg-red-8 text-white rounded-borders">
            <template #avatar>
              <q-icon name="fas fa-exclamation-triangle" />
            </template>
            {{ error }}
          </q-banner>
        </div>
      </template>
    </div>

    <div class="wizbee-chat__status">
      <!-- Usage info -->
      <div v-if="monthlyUsage" class="q-px-sm q-pb-xs">
        <div class="text-caption text-grey-6 row items-center q-gutter-x-sm">
          <span>
            <b>Budget:</b>
            €{{ monthlyUsage.estimatedCostEUR.toFixed(2) }} / €{{
              monthlyUsage.monthlyLimitEUR.toFixed(2)
            }}
          </span>
          <span v-if="monthlyUsage.isOverBudget" class="text-red text-bold"
            >({{ $t('error.tokenLimit') }})</span
          >
          <span v-else
            >({{ $t('countTokensLeft') }}: €{{
              monthlyUsage.remainingBudgetEUR.toFixed(2)
            }})</span
          >
          <span>|</span>
          <span>{{ monthlyUsage.totalRequests }} {{ $t('requests') }}</span>
        </div>
      </div>

      <!-- Not premium banner -->
      <div v-if="!isPremium" class="q-pa-sm">
        <q-banner class="bg-warning text-dark rounded-borders">
          <template #avatar>
            <q-icon name="fas fa-lock" />
          </template>
          {{ $t('error.premium') }}
          <template #action>
            <q-btn flat no-caps :label="$t('premium')" to="/premium" />
          </template>
        </q-banner>
      </div>

      <!-- Over budget banner -->
      <div v-else-if="monthlyUsage?.isOverBudget" class="q-pa-sm">
        <q-banner class="bg-red-8 text-white rounded-borders">
          <template #avatar>
            <q-icon name="fas fa-exclamation-triangle" />
          </template>
          {{ $t('error.tokenLimit') }}
        </q-banner>
      </div>
    </div>

    <!-- Input area at bottom -->
    <div class="wizbee-chat__input q-pa-sm">
      <q-form @submit.prevent="onSubmit">
        <q-input
          v-model="question"
          :placeholder="$t('askQuestion')"
          :maxlength="2000"
          :clearable="true"
          outlined
          rounded
          dense
          autofocus
          :disable="isDisabled"
        >
          <template #before>
            <q-btn
              v-if="chatHistory.length > 0"
              flat
              round
              dense
              icon="fas fa-plus"
              color="grey-6"
              :title="$t('new')"
              @click="onClear"
            />
          </template>
          <template #after>
            <q-btn
              v-if="isStreaming || isFetching"
              flat
              round
              dense
              icon="fas fa-stop"
              color="red"
              :title="$t('stop')"
              @click="abortStream"
            />
            <template v-else>
              <!-- Voice-to-text button: visible whenever the user isn't actively typing a question. -->
              <q-btn
                v-if="isVoiceSupported && !question?.trim()"
                flat
                round
                dense
                :icon="isVoiceRecording ? 'fas fa-stop' : 'fas fa-microphone'"
                :color="isVoiceRecording ? 'red' : 'primary'"
                :loading="isTranscribing"
                :disable="isDisabled"
                :title="
                  isVoiceRecording
                    ? voiceRemainingSeconds !== null
                      ? $t('voice.stopIn', { seconds: voiceRemainingSeconds })
                      : $t('voice.stop')
                    : $t('voice.start')
                "
                :class="{ 'wizbee-chat__mic--recording': isVoiceRecording }"
                @click="onToggleVoice"
              >
                <!-- Last-30-seconds countdown badge: helps the user notice the auto-stop is imminent. -->
                <q-badge
                  v-if="
                    isVoiceRecording &&
                    voiceRemainingSeconds !== null &&
                    voiceRemainingSeconds <= 30
                  "
                  floating
                  color="red"
                  text-color="white"
                  :label="voiceRemainingSeconds"
                />
              </q-btn>
              <q-btn
                v-else
                flat
                round
                dense
                icon="fas fa-paper-plane"
                color="primary"
                type="submit"
                :disable="isDisabled || !question?.trim()"
                @click="onSubmit"
              />
            </template>
          </template>
        </q-input>
      </q-form>
    </div>
  </div>
</template>

<style scoped>
.wizbee-chat {
  display: flex;
  flex-direction: column;
  min-height: 300px;
}

.wizbee-chat__messages {
  overflow-y: auto;
  flex: 1;
}

.wizbee-chat__bubble {
  max-width: 80%;
  word-break: break-word;
  white-space: pre-wrap;
}

.wizbee-chat__markdown {
  white-space: normal;
}

.wizbee-chat__markdown :deep(h1),
.wizbee-chat__markdown :deep(h2),
.wizbee-chat__markdown :deep(h3),
.wizbee-chat__markdown :deep(h4),
.wizbee-chat__markdown :deep(h5),
.wizbee-chat__markdown :deep(h6) {
  font-size: 1em;
  font-weight: 600;
  margin: 0 0 0.4em;
  line-height: 1.3;
}

.wizbee-chat__markdown :deep(p) {
  margin: 0 0 0.5em;
}

.wizbee-chat__markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.wizbee-chat__markdown :deep(ul),
.wizbee-chat__markdown :deep(ol) {
  margin: 0 0 0.5em;
  padding-left: 1.5em;
}

.wizbee-chat__markdown :deep(pre) {
  background: rgba(0, 0, 0, 0.05);
  padding: 0.5em;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0 0 0.5em;
}

.body--dark .wizbee-chat__markdown :deep(pre) {
  background: rgba(255, 255, 255, 0.05);
}

.wizbee-chat__markdown :deep(code) {
  font-size: 0.9em;
}

.wizbee-chat__markdown :deep(a) {
  color: var(--q-primary);
}

.wizbee-chat__markdown :deep(table) {
  border-collapse: collapse;
  margin: 0 0 0.5em;
}

.wizbee-chat__markdown :deep(th),
.wizbee-chat__markdown :deep(td) {
  border: 1px solid rgba(0, 0, 0, 0.2);
  padding: 0.25em 0.5em;
}

.body--dark .wizbee-chat__markdown :deep(th),
.body--dark .wizbee-chat__markdown :deep(td) {
  border-color: rgba(255, 255, 255, 0.2);
}

.wizbee-chat__tool {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.4);
  padding: 2px 8px;
  font-style: italic;
}

.body--dark .wizbee-chat__tool {
  color: rgba(255, 255, 255, 0.35);
}

.wizbee-chat__bubble--user {
  background: var(--q-secondary);
  color: white;
  border-radius: 16px 16px 4px 16px;
}

.wizbee-chat__bubble--model {
  border-radius: 16px 16px 16px 4px;
}

.body--dark .wizbee-chat__bubble--model {
  background: rgba(255, 255, 255, 0.08);
}

.wizbee-chat__input {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

/* Gentle pulse while the mic is actively recording so the user sees the state at a glance. */
.wizbee-chat__mic--recording {
  animation: wizbee-chat-mic-pulse 1.2s ease-in-out infinite;
}

@keyframes wizbee-chat-mic-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.55;
    transform: scale(1.08);
  }
}

.wizbee-chat--dialog {
  min-height: 0;
  flex-wrap: nowrap;
}

.wizbee-chat__status {
  display: contents;
}

/* Let long notices scroll rather than push the composer out of a short dialog. */
.wizbee-chat--dialog .wizbee-chat__status {
  display: block;
  min-height: 0;
  overflow-y: auto;
}

.wizbee-chat--dialog .wizbee-chat__input {
  flex-shrink: 0;
}

.body--dark .wizbee-chat__input {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.invert-colors {
  filter: grayscale(1) invert(1);
}
</style>
