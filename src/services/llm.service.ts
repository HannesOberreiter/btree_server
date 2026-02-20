import type { BaseMessageLike } from '@langchain/core/messages';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ChatMistralAI } from '@langchain/mistralai';
import { ChatOpenAI } from '@langchain/openai';
import { decrypt } from '../api/utils/crypto.util.js';
import { KyselyServer } from '../servers/kysely.server.js';

export type LlmProvider = 'openai' | 'mistral';

export interface LlmTokenPayload {
  access_token: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/**
 * Retrieve and decrypt the stored LLM token for a user and provider.
 */
export async function getUserLlmToken(
  beeId: number,
  provider: LlmProvider,
): Promise<LlmTokenPayload> {
  const db = KyselyServer.getInstance().db;
  const row = await db
    .selectFrom('user_llm_tokens')
    .select('tokens')
    .where('bee_id', '=', beeId)
    .where('provider', '=', provider)
    .executeTakeFirst();

  if (!row) {
    throw new Error(`No LLM token found for provider: ${provider}`);
  }

  return JSON.parse(decrypt(row.tokens)) as LlmTokenPayload;
}

/**
 * Build an LLM instance for the given provider using the user's stored token.
 */
function buildLlm(provider: LlmProvider, token: LlmTokenPayload, stream: boolean) {
  if (provider === 'openai') {
    return new ChatOpenAI({
      openAIApiKey: token.access_token,
      streaming: stream,
    });
  }
  if (provider === 'mistral') {
    return new ChatMistralAI({
      apiKey: token.access_token,
      streaming: stream,
    });
  }
  throw new Error(`Unsupported LLM provider: ${provider}`);
}

/**
 * Run a chat completion (non-streaming).
 */
export async function chat(
  beeId: number,
  provider: LlmProvider,
  messages: ChatMessage[],
): Promise<string> {
  const token = await getUserLlmToken(beeId, provider);
  const llm = buildLlm(provider, token, false);
  const langchainMessages: BaseMessageLike[] = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));
  const result = await llm.invoke(langchainMessages);
  return typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
}

/**
 * Run a streaming chat completion using SSE (Server-Sent Events).
 * Writes each chunk directly to the reply.
 */
export async function chatStream(
  beeId: number,
  provider: LlmProvider,
  messages: ChatMessage[],
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = await getUserLlmToken(beeId, provider);
  const llm = buildLlm(provider, token, true);
  const langchainMessages: BaseMessageLike[] = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  reply.raw.setHeader('Content-Type', 'text/event-stream');
  reply.raw.setHeader('Cache-Control', 'no-cache');
  reply.raw.setHeader('Connection', 'keep-alive');

  if (!reply.raw.getHeader('Access-Control-Allow-Origin')) {
    const origin = req.headers.origin || req.headers.host || '*';
    reply.raw.setHeader('Access-Control-Allow-Origin', origin);
    reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  const stream = await llm.stream(langchainMessages);

  for await (const chunk of stream) {
    const text = typeof chunk.content === 'string' ? chunk.content : '';
    reply.raw.write(`data: ${JSON.stringify({ text })}\n\n`);
  }

  reply.raw.write('data: [DONE]\n\n');
  reply.raw.end();
}
