import {
  McpServer,
  type AuthInfo,
  type JSONObject,
  type JSONValue,
} from '@modelcontextprotocol/server';
import { z } from 'zod';

import { mcp } from '../../config/environment.config.js';
import { KyselyServer } from '../../servers/kysely.server.js';
import { Logger } from '../../services/logger.service.js';
import {
  executeWizBeeTool,
  getWizBeeToolMutation,
  wizBeeToolDefinitions,
  type ToolErrorEnvelope,
  type WizBeeContext,
} from './wizbee_tools.module.js';

const toolNames = wizBeeToolDefinitions.map((definition) => definition.name);
if (new Set(toolNames).size !== toolNames.length) {
  throw new Error('Duplicate WizBee tool names cannot be exposed through MCP');
}

const BTREE_MCP_INSTRUCTIONS = `You act as a professional beekeeping assistant using b.tree Beekeeping Manager. Users are experienced beekeepers. Give professional, situation-specific guidance rather than generic beginner tips.

## Important ID convention
In b.tree data, bee_id identifies the beekeeper and user_id identifies the company or workspace. Hive names and numbers are not database IDs.

## Core rules
1. Before creating or updating hive-related records, call listApiariesHives to resolve current apiaryId and hiveIds. Never assume that hive names or numbers match hiveIds.
2. Before creating a record that needs a typeId, call fetchOptions and use a valid type for the user's account. Ask for clarification if no matching type exists.
3. Before creating, updating, or deleting records, state the resolved apiary, hives, type, date, amount, and other material details. Ask for confirmation before complex multi-step or destructive actions.
4. Prefer specific records such as feed, treatment, harvest, or checkup over a generic todo. Create a todo only when no specific record type fits. Confirm interval and repeat count for recurring tasks.
5. Handle tool errors step by step: verify IDs, required fields, typeId, and ISO date values. Explain the failure and suggest manual entry in b.tree only if it persists.

## Tool workflow
- Use read tools before write tools to inspect current state and resolve IDs.
- Use soft-delete tools where available.
- Use apiaryWeather for weather or seasonal advice and account for current local conditions and season.
- Use btreeDocumentation for b.tree feature questions.

## Style
- Use ISO 8601 dates in YYYY-MM-DD format.
- Keep answers short and actionable. Summarize first; provide details when asked.
- Respond in the same language as the user.
- Use correct professional beekeeping terminology.
- Do not give unsolicited advice; focus on the user's request.`;

function actorFromAuth(authInfo: AuthInfo | undefined): WizBeeContext {
  const extra = authInfo?.extra;
  const userId = extra?.userId;
  const beeId = extra?.beeId;
  const rank = extra?.rank;
  if (
    typeof userId !== 'number' ||
    typeof beeId !== 'number' ||
    typeof rank !== 'number' ||
    ![1, 2, 3, 4].includes(rank)
  ) {
    throw new Error('MCP request has no authenticated b.tree actor');
  }
  return { userId, beeId, rank: rank as 1 | 2 | 3 | 4 };
}

function jsonResult(value: unknown) {
  const text = JSON.stringify(value ?? null);
  const parsed = JSON.parse(text) as JSONValue;
  const structuredContent: JSONObject =
    parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : { result: parsed };
  return { text, structuredContent };
}

function isToolError(value: unknown): value is ToolErrorEnvelope {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value as { ok?: unknown }).ok === false
  );
}

export function createBtreeMcpServer(authInfo: AuthInfo | undefined) {
  const actor = actorFromAuth(authInfo);
  const server = new McpServer(
    {
      name: 'b.tree Beekeeping Manager',
      version: '1.0.0',
    },
    { instructions: BTREE_MCP_INSTRUCTIONS },
  );

  for (const definition of wizBeeToolDefinitions) {
    const mutation = getWizBeeToolMutation(definition.name);
    server.registerTool(
      definition.name,
      {
        description: definition.description,
        inputSchema: definition.parameters,
        annotations: {
          readOnlyHint: mutation === undefined,
          destructiveHint: mutation === 'delete',
          openWorldHint: false,
        },
        _meta: {
          securitySchemes: [{ type: 'oauth2', scopes: [mcp.scope] }],
        },
      },
      async (input) => {
        try {
          const result = await executeWizBeeTool(
            KyselyServer.getInstance().db,
            definition.name,
            input,
            actor,
          );
          const serialized = jsonResult(result);
          return {
            resultType: 'complete' as const,
            content: [{ type: 'text' as const, text: serialized.text }],
            structuredContent: serialized.structuredContent,
            ...(isToolError(result) ? { isError: true } : {}),
          };
        } catch (error) {
          Logger.getInstance().pino.error(
            { error, toolName: definition.name },
            'MCP tool execution failed',
          );
          const serialized = jsonResult({
            ok: false,
            error: {
              code: 'tool_execution_failed',
              message: 'Tool execution failed',
            },
          });
          return {
            resultType: 'complete' as const,
            content: [{ type: 'text' as const, text: serialized.text }],
            structuredContent: serialized.structuredContent,
            isError: true,
          };
        }
      },
    );
  }

  server.registerPrompt(
    'apiary-overview',
    {
      title: 'Apiary overview',
      description:
        'Summarize colonies, open work, weather, and urgent operational issues.',
      argsSchema: z.object({
        apiary: z
          .string()
          .trim()
          .min(1)
          .optional()
          .describe('Optional apiary name or ID to focus on'),
      }),
    },
    ({ apiary }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Prepare a concise operational apiary overview${apiary ? ` for ${apiary}` : ' for all apiaries'}. Resolve apiary and hive IDs with listApiariesHives. Review relevant open tasks, hive statistics, and apiary weather. Highlight urgent items, missing data, and practical next actions. Do not create or update records.`,
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    'prepare-inspection',
    {
      title: 'Prepare hive inspection',
      description:
        'Gather hive context and produce a focused professional inspection checklist.',
      argsSchema: z.object({
        hive: z.string().trim().min(1).describe('Hive name, number, or ID'),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe('Inspection date in YYYY-MM-DD format'),
      }),
    },
    ({ hive, date }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Prepare a professional inspection for hive ${hive}${date ? ` on ${date}` : ''}. First use listApiariesHives to resolve the real hiveId. Then review getHiveDetail, getHiveTasks, relevant recent records, and apiaryWeather. Produce a concise inspection checklist tailored to the colony's current state and season. Identify data to verify during inspection. Do not create a checkup or other record.`,
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    'seasonal-review',
    {
      title: 'Seasonal beekeeping review',
      description:
        'Review feeding, harvests, treatments, colony workload, and seasonal priorities.',
      argsSchema: z.object({
        year: z
          .string()
          .regex(/^\d{4}$/)
          .optional()
          .describe('Optional four-digit year'),
        apiary: z
          .string()
          .trim()
          .min(1)
          .optional()
          .describe('Optional apiary name or ID to focus on'),
      }),
    },
    ({ year, apiary }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Prepare a seasonal review${year ? ` for ${year}` : ''}${apiary ? ` focused on ${apiary}` : ''}. Resolve IDs with listApiariesHives, then review feed, harvest, treatment, and hive statistics together with open tasks and relevant weather. Summarize trends, risks, missing records, and practical priorities for an experienced beekeeper. Do not create or update records.`,
          },
        },
      ],
    }),
  );

  return server;
}
