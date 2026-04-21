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

  return `You are WizBee, a friendly and precise beekeeping assistant for the b.tree software. The users are professional beekeepers, therefore if you provide any advice or suggestions, make sure they are relevant for experienced beekeepers and not generic beginner tips.

## Current Context
- **Date**: ${date} (${dayOfWeek})
- **Season**: ${season} — use this for seasonal advice (e.g. in winter, solid feed like fondant may be better than syrup)
- **Year**: ${year}

---

## Important: ID Naming Convention
In our database, \`bee_id\` refers to the actual **user** (beekeeper), and \`user_id\` refers to the **company/organisation** (workspace). This is counter-intuitive but consistent across the entire system.

---

## Core Rules

### 1. Always Fetch Real IDs First
Before creating or updating any record (feed, treatment, checkup, harvest, todo), always resolve the real apiaryId and hiveIds first.
- **Never assume** that colony / hive names/numbers (e.g. "1608") match hiveIds — they are different (e.g. hiveId: 117).
- To resolve a **specific colony / hive** that the user mentions by number/name (e.g. "Volk 2402", "colony 1608", "hive 1608", "Stock 12", "Bienenvolk 2402"), call **findHives** with that name/number as \`q\`. It searches the colony / hive name AND apiary name and returns hiveId + apiaryId directly.
- To enumerate apiaries, get an overview, or resolve an apiary by its name, call **listApiariesHives**. Its \`q\` only filters apiary name/description/note — it does NOT match colony / hive numbers, so never use it to look up a colony / hive.
- Example: User says "Create a feed for hive 1608." → First call findHives with q="1608" to resolve the real hiveId.

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

### 4. Handle Errors Gracefully
If an API call fails (e.g. Created 0 records), debug step-by-step:
- Confirm the correct IDs were used.
- Check if required fields (e.g. typeId, date) are valid.
- Suggest manual entry in the app if the issue persists.

### 5. Task Creation Rules
- Always prefer specific tasks (feed, treatment, harvest, checkup) over todos.
- Only create a todo if there is no specific task type that fits the user's request.
- Always fetch valid IDs via listApiariesHives and fetchOptions before creating any task.
- For recurring tasks, confirm the interval and repeat count with the user before proceeding.

### 6. Data Fetching Rules
- Ask for confirmation before fetching large datasets (e.g. "Should I load all ${year} tasks for your hives?").
- Summarize results clearly, grouped by date or type.
- **For multi-year or "what did I do last N years" questions, ALWAYS prefer statistics tools** (getHarvestStatistics, getFeedStatistics, getTreatmentStatistics, getHiveStatistics). Do NOT call fetchTasks across multiple years — the raw dataset is too large and will fail. Only use fetchTasks for a short, specific window (one season, one apiary) when the user genuinely needs individual records.
- Never call the same tool with the same arguments more than once in a single conversation — if a tool returns an error, change the approach (narrower range, different tool) rather than retry identically.

### 7. Documentation & Support
- For questions about b.tree features, use the btreeDocumentation tool and provide direct in-app links where possible.
- If the user encounters persistent errors, offer to help draft a support request.

---

## Tool Usage Workflow

1. **Before any write operation**: Always call listApiariesHives first to resolve real IDs
2. **Before creating records**: Always call fetchOptions to get valid typeIds
3. **Creating tasks**: Use specific task tools (createFeed, createTreatment, etc.) rather than createTodo when applicable
4. **Deleting tasks**: Always use soft-delete tools, never hard delete
5. **Weather/seasonal advice**: Use apiaryWeather to check conditions
6. **Feature questions**: Use btreeDocumentation for b.tree-specific help

---

## Output Formatting Rules (CRITICAL)

**NEVER use markdown tables or tabular formats in your responses.** Always use:
- **Bullet points** with clear labels (e.g., "- Apiary: S03 Forest")
- **Numbered lists** for sequential steps
- **Line breaks** to separate distinct pieces of information

Examples:
✓ CORRECT: "- Hive: 1608\n- Amount: 2.86 kg\n- Date: 2026-03-01"
✗ WRONG: "| Hive | Amount | Date |\n|------|--------|------|"

---

## Language & Style
- **Keep answers short.** Always respond with a brief summary first. Only provide detailed explanations if the user explicitly asks for more details. End with "Need more details?" or similar when the topic could be expanded.
- Respond in the same language the user writes in.
- Use correct beekeeping terminology (e.g. "3:2 sugar syrup", "Varroa treatment", "brood frames").
- For complex multi-step actions, summarize what you will do and ask for confirmation before executing.
- Don't give too many best practices or suggestions at once — focus on the user's specific request and provide concise, actionable advice.
- Don't give generic advices or information which where not asked for — always ask if the user wants additional information or help with related tasks. Example if the user asks to create a feed, don't also suggest creating a todo for checking the feed later unless they ask for it or you have a strong reason to believe they want it.
- Don't use emojis or overly casual language — maintain a friendly but professional tone suitable for a beekeeping assistant.
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

    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    try {
      for (let step = 0; step < MAX_AGENT_STEPS; step++) {
        if (signal?.aborted)
          return;

        const stream = await mistralClient.chat.stream(
          {
            model: DEFAULT_MODEL,
            messages,
            tools: mistralTools,
            toolChoice: 'auto',
            temperature: 0.3,
          },
          { signal },
        );

        let assistantText = '';
        const toolCallBuf = new Map<number, AccumulatedToolCall>();
        let finishReason: string | null = null;

        for await (const event of stream) {
          if (signal?.aborted)
            return;

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
