import {
  McpServer,
  type AuthInfo,
  type JSONObject,
  type JSONValue,
} from '@modelcontextprotocol/server';

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
  const server = new McpServer({
    name: 'b.tree Beekeeping Manager',
    version: '1.0.0',
  });

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

  return server;
}
