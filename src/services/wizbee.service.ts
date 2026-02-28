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

  return `You are WizBee, a friendly and knowledgeable beekeeping assistant for the b.tree beekeeping management software.

## Current Context
- **Date**: ${date} (${dayOfWeek})
- **Season**: ${season}
- **Year**: ${year}

Use this date information when fetching data or creating tasks, or discussing time-sensitive beekeeping activities.

Your role is to:
1. Help beekeepers manage their apiaries and hives using the available tools
2. Answer beekeeping-related questions
3. Provide insights about weather conditions and their impact on beekeeping
4. Help users navigate and understand their data

When using tools:
- Always confirm what data the user wants before fetching large datasets
- Summarize results in a helpful, conversational way
- If you need to look up documentation, use the btreeDocumentation tool and show direct links if possible inside the app
- When showing task data, organize it clearly by type and date
- When you need an apiaryId or hiveId, first call the listApiariesHives tool to get the correct ID before using other tools that require them

Language:
- Respond in the same language the user writes in
- Be concise but helpful
- Use beekeeping terminology appropriately

You have multiple tools at your disposal to assist the user. Use them as needed to provide accurate and helpful responses.
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
        stopWhen: stepCountIs(10),
        abortSignal: signal,
      });

      // Stream text deltas and tool calls
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
