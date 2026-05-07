import type { WizBeeContext, WizBeeTool } from '../api/controllers/wizbee.tools.controller.js';
import { Mistral } from '@mistralai/mistralai';
import { z } from 'zod';
import { createWizBeeTools, executeWizBeeTool } from '../api/controllers/wizbee.tools.controller.js';
import { mistralAI } from '../config/environment.config.js';
import { Logger } from './logger.service.js';

const mistralClient = new Mistral({ apiKey: mistralAI.key });

/**
 * Default model for chat completions.
 * When bumping: verify on https://mistral.ai/pricing and the allowed model
 * IDs published at https://docs.mistral.ai/getting-started/models/.
 */
const DEFAULT_MODEL = 'mistral-medium-2508';

/**
 * Maximum number of agent-loop iterations. Each iteration is ONE Mistral
 * streaming call plus (optionally) N tool executions. The model is allowed
 * this many round-trips to converge on a final answer before we bail out.
 */
const MAX_AGENT_STEPS = 15;

/**
 * Maximum number of history messages to keep (user/assistant pairs). Older
 * messages are truncated to bound token usage.
 */
const MAX_HISTORY_MESSAGES = 20;

/**
 * Per-iteration inactivity timeout when streaming from Mistral.
 *
 * If no stream event arrives within this window, we assume the upstream call
 * has wedged (network flake, model stuck, provider incident) and abort the
 * current step. Without this the *whole* request only ever unblocks via the
 * controller's 120 s hard timeout — which feels stuck to the user.
 *
 * 45 s is comfortably above the worst-case time-to-first-token we've seen on
 * `mistral-medium-2508` for long tool-heavy turns, but well under the 120 s
 * request cap so the client gets a real error chunk.
 */
const MISTRAL_INACTIVITY_TIMEOUT_MS = 45_000;

/**
 * Get the current season based on month (Northern Hemisphere beekeeping context)
 */
function getCurrentSeason(month: number): string {
  if (month >= 3 && month <= 5) {
    return 'spring';
  }
  if (month >= 6 && month <= 8) {
    return 'summer';
  }
  if (month >= 9 && month <= 11) {
    return 'autumn';
  }
  return 'winter';
}

/**
 * Generate system prompt with current date context
 */
function buildSystemPrompt(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const season = getCurrentSeason(month);

  return `You are WizBee, friendly, precise beekeeping assistant for b.tree. Users are professional beekeepers. Advice must fit experienced beekeepers; skip generic beginner tips.

## Current Context
- **Date**: ${date} (${dayOfWeek})
- **Season**: ${season} — use for seasonal advice (e.g. winter: fondant may fit better than syrup)
- **Year**: ${year}

---

## Critical ID Convention
- \`bee_id\` = actual **user** (beekeeper)
- \`user_id\` = **company/organisation** (workspace)
Counter-intuitive but system-wide.

---

## Core Rules

### 1. Resolve Real IDs Before Writes
Before create/update feed, treatment, checkup, harvest, todo: resolve real apiaryId + hiveIds.
- Never assume colony/hive names or numbers (e.g. "1608") equal hiveIds; hiveId may be 117.
- Specific colony/hive by name/number ("Volk 2402", "colony 1608", "hive 1608", "Stock 12", "Bienenvolk 2402"): call **findHives** with that value as \`q\`. It searches colony/hive name AND apiary name, returns hiveId + apiaryId.
- Apiary overview or apiary name lookup: call **listApiariesHives**. Its \`q\` filters apiary name/description/note only; it does NOT match colony/hive numbers.
- Example: "Create a feed for hive 1608." → call findHives q="1608" first.

### 2. Verify Type IDs
Before creating records: call **fetchOptions** for account-specific typeId.
- If type missing, ask user to clarify or suggest alternatives.
- Example: "Feed with 3:2 sugar syrup." → fetchOptions, then exact typeId.

### 3. Be Transparent Before Writes
Before create/update, state details and ask confirmation:
> "I will create feed for:
> - Apiary: S03 Forest
> - Hives: 1608, 1501
> - Feed Type: 3:2 Sugar Syrup
> - Amount: 2.86 kg per hive
> Proceed?"

### 4. Handle Errors
If API call fails (e.g. Created 0 records):
- Confirm IDs.
- Check required fields (typeId, date).
- If still failing, suggest manual entry in app.

### 5. Task Rules
- Prefer specific tasks: feed, treatment, harvest, checkup.
- Create todo only when no specific task fits.
- Before task creation, fetch valid IDs via listApiariesHives/findHives and fetchOptions.
- Recurring tasks: confirm interval + repeat count first.

### 6. Data Fetching
- Ask before large datasets: "Should I load all ${year} tasks for your hives?"
- Summarize by date or type.
- Multi-year / "what did I do last N years": ALWAYS prefer statistics tools (getHarvestStatistics, getFeedStatistics, getTreatmentStatistics, getHiveStatistics). Do NOT call fetchTasks across multiple years; raw dataset too large. Use fetchTasks only for short specific window (one season, one apiary) when individual records needed.
- Never call same tool with same args twice in one conversation. If error, narrow range or change tool.

### 7. Docs & Support
- b.tree feature, pricing, offline-mode, how-to, settings/options, UI, Premium, API or account questions: use btreeDocumentation before answering.
- Base these answers only on btreeDocumentation. If docs do not contain the answer, say that instead of inventing UI paths or features.
- Persistent errors: offer support-request draft.

---

## Tool Workflow
1. Before write: resolve real IDs with listApiariesHives or findHives.
2. Before create: fetchOptions for valid typeIds.
3. Creating tasks: use specific task tools over createTodo.
4. Deleting tasks: soft-delete only; never hard delete.
5. Weather/seasonal advice: use apiaryWeather.
6. Feature help: use btreeDocumentation.

---

## Output Formatting (CRITICAL)
Never use markdown tables or tabular formats.
Use:
- Bullets with clear labels: "- Apiary: S03 Forest"
- Numbered lists for steps
- Line breaks between distinct info

Correct: "- Hive: 1608\n- Amount: 2.86 kg\n- Date: 2026-03-01"
Wrong: "| Hive | Amount | Date |\n|------|--------|------|"

---

## Language & Style
- Same language as user.
- Short but clear. Summary first.
- Default answer: 3–6 bullets max, unless user asks for detail.
- One idea per bullet. No long paragraphs.
- End with "Need more details?" only when expansion is useful.
- Use correct beekeeping terms: "3:2 sugar syrup", "Varroa treatment", "brood frames".
- Complex multi-step action: summarize plan, then ask confirmation before execution.
- No unasked best-practice dump. Stay on user's request.
- Do not suggest related todos/tasks unless user asks or strong reason exists.
- No emojis. Professional, friendly tone.
`;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'tool'
  content: string
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'error' | 'done'
  content?: string
  toolName?: string
  toolInput?: unknown
  toolOutput?: unknown
  usage?: TokenUsage
}

const BTREE_DOC_INTENT_RE = /\b(?:b[.\s-]?tree|wizbee|premium|abo|subscription|preis|preise|kosten|kostet|price|pricing|cost|offline|app|ui|einstellung(?:en)?|settings?|option(?:en)?|api|ical|nfc|qr|scanner|karte|map|kalender|calendar|login|account|konto)\b/i;

function shouldPreloadBtreeDocs(message: string): boolean {
  return BTREE_DOC_INTENT_RE.test(message);
}

/**
 * Shape expected by Mistral's `tools` field on a chat request.
 * https://docs.mistral.ai/capabilities/function_calling/
 */
interface MistralToolDef {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

/**
 * A tool call as accumulated from a streaming response. Mistral's larger
 * models stream tool-call arguments incrementally across multiple deltas,
 * each keyed by `index`; smaller models tend to deliver the whole call in
 * a single delta. We always accumulate by index to be safe.
 */
interface AccumulatedToolCall {
  id: string
  name: string
  args: string
}

/**
 * Convert the internal WizBee tool registry to the Mistral tools schema.
 * Uses zod v4's built-in `toJSONSchema` to convert the tool's input schema.
 */
function buildMistralTools(tools: Record<string, WizBeeTool>): MistralToolDef[] {
  return Object.entries(tools).map(([name, t]) => ({
    type: 'function',
    function: {
      name,
      description: t.description,
      parameters: z.toJSONSchema(t.inputSchema, { target: 'draft-7' }) as Record<string, unknown>,
    },
  }));
}

/**
 * WizBee AI Service
 *
 * Drives a multi-step tool-calling loop against Mistral's Chat API.
 * Emits a unified `StreamChunk` stream (text, tool_call, tool_result,
 * error, done) that the controller can forward to the client as NDJSON.
 */
export class WizBeeAI {
  private context: WizBeeContext;

  constructor(userId: number, beeId: number) {
    this.context = { userId, beeId };
  }

  /**
   * Map our stored conversation history onto Mistral's chat message format.
   * Truncates if history exceeds MAX_HISTORY_MESSAGES.
   */
  private buildHistoryMessages(history: ChatMessage[]): Array<any> {
    const truncated = history.length > MAX_HISTORY_MESSAGES
      ? history.slice(-MAX_HISTORY_MESSAGES)
      : history;

    return truncated.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.content,
    }));
  }

  /**
   * Stream a chat response with tool calling.
   *
   * Agent loop:
   *   1. Send `messages` + tool schemas to Mistral with streaming enabled.
   *   2. As deltas arrive, stream text to the caller and accumulate any
   *      tool calls (indexed by `tc.index`).
   *   3. If the completion ends with `finish_reason=tool_calls`, append the
   *      assistant's tool-call message + run each tool + append tool-result
   *      messages, then GOTO 1 (up to MAX_AGENT_STEPS iterations).
   *   4. Otherwise emit `done` with aggregated usage and return.
   */
  async* chatStream(
    message: string,
    history: ChatMessage[] = [],
    signal?: AbortSignal,
  ): AsyncIterable<StreamChunk> {
    const tools = createWizBeeTools(this.context);
    const mistralTools = buildMistralTools(tools);

    const messages: any[] = [
      { role: 'system', content: buildSystemPrompt() },
      ...this.buildHistoryMessages(history),
      { role: 'user', content: message },
    ];

    if (shouldPreloadBtreeDocs(message)) {
      yield { type: 'tool_call', toolName: 'btreeDocumentation', toolInput: { query: message } };
      const docs = await executeWizBeeTool('btreeDocumentation', { query: message }, this.context);
      yield { type: 'tool_result', toolName: 'btreeDocumentation', toolOutput: docs };
      messages.splice(1, 0, {
        role: 'system',
        content: `Relevant b.tree documentation for the user's question:\n${JSON.stringify(docs)}\n\nUse this documentation as the source of truth. If it does not answer the question, say so. Do not invent UI paths, offline capabilities, prices, or feature details.`,
      });
    }

    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    try {
      for (let step = 0; step < MAX_AGENT_STEPS; step++) {
        if (signal?.aborted)
          return;

        // Per-step abort controller chained to the outer signal. Lets us bail
        // out of a wedged upstream call independently of the overall request
        // timeout, while still honouring a user-initiated abort.
        const stepController = new AbortController();
        const onOuterAbort = () => stepController.abort();
        if (signal) {
          if (signal.aborted)
            stepController.abort();
          else
            signal.addEventListener('abort', onOuterAbort, { once: true });
        }
        let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
        const armInactivityTimer = () => {
          if (inactivityTimer)
            clearTimeout(inactivityTimer);
          inactivityTimer = setTimeout(() => {
            stepController.abort();
          }, MISTRAL_INACTIVITY_TIMEOUT_MS);
        };

        const stream = await mistralClient.chat.stream(
          {
            model: DEFAULT_MODEL,
            messages,
            tools: mistralTools,
            toolChoice: 'auto',
            temperature: 0.3,
          },
          { signal: stepController.signal },
        );

        let assistantText = '';
        const toolCallBuf = new Map<number, AccumulatedToolCall>();
        let finishReason: string | null = null;
        let timedOut = false;

        armInactivityTimer();
        try {
          for await (const event of stream) {
            // Reset the idle timer on every event — as long as Mistral keeps
            // talking, we keep waiting.
            armInactivityTimer();
            if (signal?.aborted)
              return;
            if (stepController.signal.aborted) {
              timedOut = !signal?.aborted;
              break;
            }

            const choice = event.data?.choices?.[0];
            if (!choice)
              continue;

            const delta = choice.delta;

            // Text delta
            if (typeof delta?.content === 'string' && delta.content.length > 0) {
              assistantText += delta.content;
              yield { type: 'text', content: delta.content };
            }

            // Tool-call deltas: accumulate by index (Mistral may split args
            // across multiple events for larger models).
            if (Array.isArray(delta?.toolCalls)) {
              for (let i = 0; i < delta.toolCalls.length; i++) {
                const tc = delta.toolCalls[i];
                const idx = tc.index ?? i;
                const existing = toolCallBuf.get(idx) ?? { id: '', name: '', args: '' };
                if (tc.id)
                  existing.id = tc.id;
                if (tc.function?.name)
                  existing.name = tc.function.name;
                if (typeof tc.function?.arguments === 'string' && tc.function.arguments.length > 0) {
                  existing.args += tc.function.arguments;
                }
                toolCallBuf.set(idx, existing);
              }
            }

            if (choice.finishReason) {
              finishReason = choice.finishReason as string;
            }

            // Usage is typically on the final chunk.
            if (event.data?.usage) {
              totalInputTokens += event.data.usage.promptTokens ?? 0;
              totalOutputTokens += event.data.usage.completionTokens ?? 0;
            }
          }
        }
        catch (e: any) {
          // AbortError from our inactivity timer is expected — translate into
          // a friendly error below. Anything else rethrows so the outer catch
          // surfaces it.
          const isAbort = e?.name === 'AbortError' || stepController.signal.aborted;
          if (!isAbort)
            throw e;
          timedOut = !signal?.aborted;
        }
        finally {
          if (inactivityTimer)
            clearTimeout(inactivityTimer);
          if (signal)
            signal.removeEventListener('abort', onOuterAbort);
        }

        if (timedOut) {
          Logger.getInstance().log(
            'warn',
            `WizBee step ${step + 1}/${MAX_AGENT_STEPS}: upstream inactivity after ${MISTRAL_INACTIVITY_TIMEOUT_MS}ms — aborting stream`,
            undefined,
          );
          yield {
            type: 'error',
            content: 'The AI provider did not respond in time. Please try again in a moment.',
          };
          yield {
            type: 'done',
            usage: {
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
              totalTokens: totalInputTokens + totalOutputTokens,
            },
          };
          return;
        }

        const toolCalls = Array.from(toolCallBuf.values()).filter(tc => tc.name);

        // No tool calls → conversation complete.
        if (toolCalls.length === 0) {
          yield {
            type: 'done',
            usage: {
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
              totalTokens: totalInputTokens + totalOutputTokens,
            },
          };
          return;
        }

        // Push the assistant message (with tool calls) so Mistral can link
        // subsequent tool messages back to these call IDs.
        messages.push({
          role: 'assistant',
          content: assistantText,
          toolCalls: toolCalls.map(tc => ({
            id: tc.id || `call_${Math.random().toString(36).slice(2, 10)}`,
            type: 'function',
            function: { name: tc.name, arguments: tc.args || '{}' },
          })),
        });

        // Execute tools sequentially. Each result is appended as a
        // `tool` message so the next streaming call can consume them.
        for (const tc of toolCalls) {
          if (signal?.aborted)
            return;

          let input: unknown;
          try {
            input = tc.args ? JSON.parse(tc.args) : {};
          }
          catch (e) {
            Logger.getInstance().log('warn', `Tool ${tc.name} arguments not valid JSON: ${String(e)}`, {
              args: tc.args,
            });
            input = {};
          }

          yield { type: 'tool_call', toolName: tc.name, toolInput: input };

          let output: unknown;
          try {
            output = await executeWizBeeTool(tc.name, input, this.context);
          }
          catch (e) {
            // Defensive — the wrapper should have caught this already, but if
            // something slips through, surface as a tool-result error envelope
            // so the model has a fair chance to recover.
            output = {
              ok: false,
              error: {
                code: 'unknown_error',
                status: 500,
                message: e instanceof Error ? e.message : String(e),
              },
            };
          }

          yield { type: 'tool_result', toolName: tc.name, toolOutput: output };

          messages.push({
            role: 'tool',
            name: tc.name,
            toolCallId: tc.id,
            content: typeof output === 'string' ? output : JSON.stringify(output),
          });
        }

        // If the model said it was done but still emitted tool calls (edge
        // case), we keep looping — the assistant + tool messages have been
        // pushed and the next iteration will let the model produce the
        // final answer. `finishReason` is only used for observability.
        Logger.getInstance().log(
          'debug',
          `WizBee step ${step + 1}/${MAX_AGENT_STEPS}: ${toolCalls.length} tool call(s), finishReason=${finishReason}`,
          undefined,
        );
      }

      // Fell out of the loop without a natural stop → too many tool steps.
      yield {
        type: 'error',
        content: `Agent exceeded the maximum of ${MAX_AGENT_STEPS} tool-calling steps. Please try a more specific question.`,
      };
    }
    catch (error) {
      yield {
        type: 'error',
        content: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }
}
