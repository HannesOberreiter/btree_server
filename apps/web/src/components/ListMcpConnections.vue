<script setup lang="ts">
import { useBackend } from '@/composables/useBackend';
import { useDateFormat } from '@/composables/useDate';
import { useNotification } from '@/composables/useNotification';
import {
  type McpConnectionResponse,
  useMcpConnectionService
} from '@/services/mcp_connection.service';
import { copyToClipboard, useQuasar } from 'quasar';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import BtnBase from './BtnBase.vue';

const { locale, t } = useI18n();
const $q = useQuasar();
const backend = useBackend();
const notification = useNotification();
const useDate = useDateFormat();
const connectionService = useMcpConnectionService();

const connections = ref<McpConnectionResponse[]>([]);
const loading = ref(false);
const mcpUrl = computed(() => `${backend.urlIgnoreProxy.value}/v1/mcp`);
const docsUrl = computed(() =>
  locale.value.startsWith('de')
    ? 'https://www.btree.at/de/doc-agent/#mcp'
    : 'https://www.btree.at/doc-agent/#mcp'
);

async function fetchConnections() {
  loading.value = true;
  try {
    connections.value = await connectionService.list();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function copyUrl() {
  copyToClipboard(mcpUrl.value).then(() => {
    notification.open('positive', t('mcp.urlCopied'), true);
  });
}

function confirmRevoke(connection: McpConnectionResponse) {
  $q.dialog({
    title: t('mcp.revoke'),
    message: t('mcp.revokeWarning', { client: connection.client_name }),
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk(async () => {
    try {
      await connectionService.remove(connection.token_family);
      notification.open('positive', t('mcp.revoked'), true);
      await fetchConnections();
    } catch (error) {
      console.error(error);
      notification.open('negative', error);
    }
  });
}

function confirmRevokeAll() {
  $q.dialog({
    title: t('mcp.revokeAll'),
    message: t('mcp.revokeAllWarning'),
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk(async () => {
    try {
      await connectionService.removeAll();
      notification.open('positive', t('mcp.revokedAll'), true);
      await fetchConnections();
    } catch (error) {
      console.error(error);
      notification.open('negative', error);
    }
  });
}

onMounted(fetchConnections);
</script>

<template>
  <div data-cy="mcp-settings">
    <q-banner class="bg-blue-1 text-blue-10 q-mb-md" rounded>
      {{ $t('mcp.description') }}
    </q-banner>

    <div class="text-subtitle1 q-mb-xs">
      {{ $t('mcp.serverUrl') }}
    </div>
    <div class="text-body2 text-grey-7 q-mb-sm">
      {{ $t('mcp.setupDescription') }}
    </div>
    <q-input
      :model-value="mcpUrl"
      data-cy="mcp-server-url"
      readonly
      dense
      outlined
      class="q-mb-sm"
    >
      <template #append>
        <q-btn flat icon="fas fa-copy" @click="copyUrl">
          <q-tooltip>{{ $t('mcp.copyUrl') }}</q-tooltip>
        </q-btn>
      </template>
    </q-input>
    <a :href="docsUrl" target="_blank" rel="noopener noreferrer">
      {{ $t('mcp.openDocs') }} →
    </a>

    <q-separator class="q-my-lg" />

    <div class="row items-center justify-between q-mb-sm">
      <div class="text-subtitle1">
        {{ $t('mcp.connections') }}
      </div>
      <BtnBase
        v-if="connections.length > 0"
        color="negative"
        :label="$t('mcp.revokeAll')"
        icon="fas fa-unlink"
        size="sm"
        @click="confirmRevokeAll"
      />
    </div>

    <q-list v-if="connections.length > 0" separator bordered>
      <q-item v-for="connection in connections" :key="connection.token_family">
        <q-item-section>
          <q-item-label>
            <b>{{ connection.client_name }}</b>
          </q-item-label>
          <q-item-label caption>
            <code class="text-grey-7">{{ connection.client_id }}</code>
            <br />
            {{ $t('created') }}:
            {{ useDate.displayFormat(connection.created_at, 'date-time') }}
            <template v-if="connection.last_used_at">
              <br />{{ $t('lastVisit') }}:
              {{ useDate.displayFormat(connection.last_used_at, 'date-time') }}
            </template>
            <br />{{ $t('mcp.expires') }}:
            {{ useDate.displayFormat(connection.expires_at, 'date-time') }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <BtnBase
            color="negative"
            :label="$t('mcp.revoke')"
            icon="fas fa-unlink"
            size="sm"
            @click="confirmRevoke(connection)"
          />
        </q-item-section>
      </q-item>
    </q-list>

    <div v-else-if="!loading" class="text-grey-7 text-center q-pa-md">
      {{ $t('mcp.noConnections') }}
    </div>
  </div>
</template>
