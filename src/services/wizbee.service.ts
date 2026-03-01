import type { ModelMessage } from 'ai';
import type { WizBeeContext } from '../api/controllers/wizbee.tools.controller.js';
import { createMistral } from '@ai-sdk/mistral';
import { stepCountIs, streamText } from 'ai';
import { createWizBeeTools } from '../api/controllers/wizbee.tools.controller.js';
import { mistralAI } from '../config/environment.config.js';

/**
 * AI SDK configuration
 * Uses Mistral AI models for chat and tool calling
 */
const mistral = createMistral({
  apiKey: mistralAI.key,
});

/**
 * Default model for chat completions
 * mistral-medium-latest (mistral-medium-2505) is recommended for agents with tool calling
 * Other options: mistral-large-latest (complex reasoning), mistral-small-latest (fast/simple)
 */
const DEFAULT_MODEL = mistral('mistral-medium-latest');

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
 * This ensures the AI always knows the current date for creating todos, scheduling, etc.
 */
function buildSystemPrompt(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const season = getCurrentSeason(month);

  return `You are WizBee, a friendly and precise beekeeping assistant for the b.tree software.

## Current Context
- **Date**: ${date} (${dayOfWeek})
- **Season**: ${season} — use this for seasonal advice (e.g. in winter, solid feed like fondant may be better than syrup)
- **Year**: ${year}

---

## Core Rules

### 1. Always Fetch Real IDs First
Before creating or updating any record (feed, treatment, checkup, harvest, todo), always call **listApiariesHives** to get the current apiaryId and hiveIds.
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

## Language & Style
- Respond in the same language the user writes in.
- Use correct beekeeping terminology (e.g. "3:2 sugar syrup", "Varroa treatment", "brood frames").
- For complex multi-step actions, summarize what you will do and ask for confirmation before executing.
- Don't use tables as the user interface — always present information in clear bullet points or numbered lists.
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
 * WizBee AI Service
 *
 * Handles AI chat with tool calling using Mistral via Vercel AI SDK.
 * Streams responses including tool calls back to the client.
 */
export class WizBeeAI {
  private context: WizBeeContext;

  constructor(userId: number, beeId: number) {
    this.context = {
      userId,
      beeId,
    };
  }

  /**
   * Convert chat history to ModelMessage format
   */
  private buildMessages(history: ChatMessage[], currentMessage: string): ModelMessage[] {
    const messages: ModelMessage[] = history.map(msg => ({
      role: msg.role === 'model' ? 'assistant' as const : 'user' as const,
      content: msg.content,
    }));

    messages.push({
      role: 'user' as const,
      content: currentMessage,
    });

    return messages;
  }

  /**
   * Create a streaming chat response with tool calling support
   * @param message User's message
   * @param history Previous conversation history
   * @param signal AbortSignal for cancellation
   * @returns AsyncIterable of stream chunks
   */
  async* chatStream(
    message: string,
    history: ChatMessage[] = [],
    signal?: AbortSignal,
  ): AsyncIterable<StreamChunk> {
    try {
      const messages = this.buildMessages(history, message);
      const tools = createWizBeeTools(this.context);

      const result = streamText({
        model: DEFAULT_MODEL,
        system: buildSystemPrompt(),
        messages,
        tools,
        toolChoice: 'auto',
        temperature: 0.3,
        stopWhen: stepCountIs(15),
        abortSignal: signal,
      });

      for await (const part of result.fullStream) {
        if (signal?.aborted) {
          break;
        }
        switch (part.type) {
          case 'text-delta':
            yield {
              type: 'text',
              content: part.text,
            };
            break;

          case 'tool-call':
            yield {
              type: 'tool_call',
              toolName: part.toolName,
              toolInput: part.input,
            };
            break;

          case 'tool-result':
            yield {
              type: 'tool_result',
              toolName: part.toolName,
              toolOutput: part.output,
            };
            break;

          case 'error':
            yield {
              type: 'error',
              content: part.error instanceof Error ? part.error.message : String(part.error),
            };
            break;

          case 'finish':
            yield {
              type: 'done',
              usage: part.totalUsage
                ? {
                    inputTokens: part.totalUsage.inputTokens ?? 0,
                    outputTokens: part.totalUsage.outputTokens ?? 0,
                    totalTokens: (part.totalUsage.inputTokens ?? 0) + (part.totalUsage.outputTokens ?? 0),
                  }
                : undefined,
            };
            break;
        }
      }
    }
    catch (error) {
      yield {
        type: 'error',
        content: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }
}
