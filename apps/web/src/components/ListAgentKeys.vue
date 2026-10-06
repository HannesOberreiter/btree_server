<script setup lang="ts">
import type { AgentKeyResponse } from '../services/agent_key.service';
import { copyToClipboard, useQuasar } from 'quasar';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useBackend } from '../composables/useBackend';
import { useDateFormat } from '../composables/useDate';
import { useNotification } from '../composables/useNotification';
import { useAgentKeyService } from '../services/agent_key.service';
import { useAuthUserStore } from '../stores/auth';
import BtnBase from './BtnBase.vue';

const { t } = useI18n();
const $q = useQuasar();
const notification = useNotification();
const useDate = useDateFormat();
const agentKeyService = useAgentKeyService();
const backend = useBackend();

const keys = ref<AgentKeyResponse[]>([]);
const loading = ref(false);
const showCreateDialog = ref(false);
const showKeyDialog = ref(false);
const createdKey = ref('');

// Create form
const newLabel = ref('');
const newValidTo = ref<string | null>(null);

const userStore = useAuthUserStore();

const agentBaseUrl = `${backend.urlIgnoreProxy.value}/v1/agent`;

const skillPrompt = `Install a new skill called "b.tree Beekeeping Manager". This skill connects to the b.tree beekeeping software API. You act as a professional beekeeping assistant. The users are experienced beekeepers — provide advice relevant for professionals, not generic beginner tips.

## Setup
1. Set the API key in the Authorization header: \`Authorization: Bearer <YOUR_API_KEY>\`. Never repeat or print the API key.
2. Base URL: ${agentBaseUrl}
3. First, fetch the available tools by calling: GET ${agentBaseUrl}/openapi.json
4. Each tool is called via POST ${agentBaseUrl}/tools/{toolName} with a JSON body matching the schema from the OpenAPI spec.

## Important: ID Naming Convention
In the b.tree database, \`bee_id\` refers to the actual **user** (beekeeper), and \`user_id\` refers to the **company/organisation** (workspace). This is counter-intuitive but consistent across the entire system.

## Core Rules

### 1. Always Fetch Real IDs First
Before creating or updating any record (feed, treatment, checkup, harvest, todo, movement, charge), always call **listApiariesHives** to get the current apiaryId and hiveIds.
- **Never assume** that hive names/numbers (e.g. "1608") match hiveIds — they are different (e.g. hiveId: 117).
- Example: User says "Create a feed for hive 1608." → First call listApiariesHives to resolve the real hiveId.

### 2. Always Verify Type IDs
Before creating a record, always call **fetchOptions** to get the correct typeId for the user's account.
- If the type doesn't exist, ask the user to clarify or suggest alternatives.
- Example: User says "Feed with 3:2 sugar syrup." → Call fetchOptions to find the exact typeId.

### 3. Show Transparency
Always explicitly state the details you are using before creating or updating records. For example:
> "I'll create the feed for:
> - Apiary: S03 Forest
> - Hives: 1608, 1501
> - Feed Type: 3:2 Sugar Syrup
> - Amount: 2.86 kg per hive.
> Proceed?"

### 4. Task Creation Rules
- Always prefer specific tasks (createFeed, createTreatment, createHarvest, createCheckup) over createTodo.
- Only create a todo if there is no specific task type that fits the user's request.
- For recurring tasks, confirm the interval and repeat count with the user before proceeding.

### 5. Deleting Records
- Use the soft-delete tools (softDeleteFeed, softDeleteTreatment, etc.) where they exist.
- Todos (batchDeleteTodo) and movements (deleteMovement) are deleted permanently: get explicit confirmation first.

### 6. Handle Errors Gracefully
If an API call fails (e.g. Created 0 records), debug step-by-step:
- Confirm the correct IDs were used.
- Check if required fields (e.g. typeId, date) are valid.
- Suggest manual entry in the app if the issue persists.

### 7. Advice and Help
- **Weather/seasonal advice**: Use apiaryWeather to check conditions — consider the current season (e.g. in winter, suggest solid feed like fondant rather than syrup).
- **Sugar syrup amounts**: Use calculateSugarWater.
- **Feature questions**: Use btreeDocumentation for b.tree-specific help.

## Style
- Dates use ISO 8601 format (YYYY-MM-DD)
- Keep answers short and actionable. Summarize first, offer details only if asked.
- Respond in the same language the user writes in.
- Use correct beekeeping terminology (e.g. "3:2 sugar syrup", "Varroa treatment", "brood frames").
- For complex multi-step actions, summarize what you will do and ask for confirmation before executing.
- Don't give unsolicited advice — focus on the user's specific request.

Available tool categories: Apiaries & Hives (including hive details and tasks), Movements, Feed, Harvest, Treatment, Checkup, Todo, Charges, Wax Ledger, Statistics, Weather, Sugar Water Calculator, Options, Documentation.`;

async function fetchKeys() {
  loading.value = true;
  try {
    keys.value = await agentKeyService.list();
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  newLabel.value = '';
  newValidTo.value = null;
  showCreateDialog.value = true;
}

async function createKey() {
  $q.dialog({
    title: t('agentKey.create'),
    message: t('agentKey.createWarning'),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      const result = await agentKeyService.create({
        label: newLabel.value || undefined,
        valid_to: newValidTo.value || undefined
      });
      createdKey.value = result.key;
      showCreateDialog.value = false;
      showKeyDialog.value = true;
      notification.open('positive', t('agentKey.keyCreated'), true);
      await fetchKeys();
    } catch (e) {
      console.error(e);
      notification.open('negative', e);
    }
  });
}

function confirmDelete(id: number) {
  $q.dialog({
    title: t('delete'),
    message: t('agentKey.deleteWarning'),
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk(async () => {
    try {
      await agentKeyService.remove(id);
      notification.open('positive', t('agentKey.keyDeleted'), true);
      await fetchKeys();
    } catch (e) {
      console.error(e);
      notification.open('negative', e);
    }
  });
}

function copyKey() {
  copyToClipboard(createdKey.value).then(() => {
    notification.open('positive', t('agentKey.keyCopied'), true);
  });
}

function copyPrompt() {
  copyToClipboard(skillPrompt).then(() => {
    notification.open('positive', t('agentKey.promptCopied'), true);
  });
}

function isExpired(validTo: string | null): boolean {
  if (!validTo) {
    return false;
  }
  return new Date(validTo) < new Date();
}

onMounted(fetchKeys);
</script>

<template>
  <!-- Key List -->
  <q-list v-if="keys.length > 0" separator>
    <q-item v-for="item in keys" :key="item.id">
      <q-item-section>
        <q-item-label class="text-body2">
          <b>{{ item.label || `${item.key_prefix}...` }}</b>
          <q-badge
            v-if="item.valid_to && isExpired(item.valid_to)"
            color="negative"
            class="q-ml-sm"
          >
            {{ $t('agentKey.expired') }}
          </q-badge>
        </q-item-label>
        <q-item-label caption>
          {{ $t('company.name') }}:
          {{ item.company_name || '—' }}
          <q-badge
            v-if="item.user_id === userStore.getCompany.id"
            color="positive"
            class="q-ml-xs"
          >
            {{ $t('active') }}
          </q-badge>
          <br />
          <code class="text-grey-7">{{ item.key_prefix }}...</code>
          <br />
          {{ $t('created') }}:
          {{ useDate.displayFormat(item.created_at, 'date-time') }}
          <template v-if="item.last_used">
            <br />{{ $t('lastVisit') }}:
            {{ useDate.displayFormat(item.last_used, 'date-time') }}
          </template>
          <br />
          {{ $t('agentKey.validTo') }}:
          <template v-if="item.valid_to">
            {{ useDate.displayFormat(item.valid_to, 'date-time') }}
          </template>
          <template v-else>
            {{ $t('agentKey.never') }}
          </template>
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <BtnBase
          color="negative"
          :label="$t('delete')"
          icon="fas fa-trash"
          size="sm"
          @click="confirmDelete(item.id)"
        />
      </q-item-section>
    </q-item>
  </q-list>

  <div v-else-if="!loading" class="text-grey-7 text-center q-pa-md">
    {{ $t('agentKey.noKeys') }}
  </div>

  <div class="q-mt-md text-center">
    <q-btn
      color="primary"
      :label="$t('agentKey.create')"
      icon="fas fa-plus"
      no-caps
      unelevated
      @click="openCreateDialog"
    />
  </div>

  <!-- Create Dialog -->
  <q-dialog v-model="showCreateDialog">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">
          {{ $t('agentKey.create') }}
        </div>
      </q-card-section>

      <q-card-section>
        <q-banner class="bg-warning text-white q-mb-md" rounded>
          {{ $t('agentKey.createWarning') }}
        </q-banner>

        <q-input
          v-model="newLabel"
          :label="$t('agentKey.label')"
          :hint="$t('agentKey.labelHint')"
          dense
          class="q-mb-md"
        />

        <q-input
          v-model="newValidTo"
          :label="$t('agentKey.validTo')"
          :hint="$t('agentKey.validToHint')"
          type="date"
          dense
          clearable
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn v-close-popup flat :label="$t('cancel')" />
        <q-btn
          color="primary"
          :label="$t('agentKey.create')"
          unelevated
          no-caps
          @click="createKey"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Show Created Key Dialog -->
  <q-dialog v-model="showKeyDialog" persistent>
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">
          {{ $t('agentKey.keyCreated') }}
        </div>
      </q-card-section>

      <q-card-section>
        <q-banner class="bg-warning text-white q-mb-md" rounded>
          {{ $t('agentKey.createWarning') }}
        </q-banner>

        <q-input
          :model-value="createdKey"
          readonly
          type="textarea"
          autogrow
          dense
          class="q-mb-sm"
        >
          <template #append>
            <q-btn flat icon="fas fa-copy" @click="copyKey">
              <q-tooltip>{{ $t('agentKey.copyKey') }}</q-tooltip>
            </q-btn>
          </template>
        </q-input>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          color="primary"
          :label="$t('close')"
          unelevated
          no-caps
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Skill Prompt Section -->
  <q-separator class="q-my-lg" />

  <div class="q-px-sm">
    <div class="text-subtitle1 q-mb-xs">
      {{ $t('agentKey.skillPromptTitle') }}
    </div>
    <div class="text-body2 text-grey-7 q-mb-sm">
      {{ $t('agentKey.skillPromptDescription') }}
    </div>

    <q-input
      :model-value="skillPrompt"
      readonly
      type="textarea"
      autogrow
      dense
      outlined
    >
      <template #after>
        <q-btn flat icon="fas fa-copy" @click="copyPrompt">
          <q-tooltip>{{ $t('agentKey.copyPrompt') }}</q-tooltip>
        </q-btn>
      </template>
    </q-input>
  </div>
</template>
