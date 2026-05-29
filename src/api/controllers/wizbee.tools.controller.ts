/* eslint-disable e18e/prefer-static-regex */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { KyselyServer } from '../../servers/kysely.server.js';
import { Logger } from '../../services/logger.service.js';
import ApiaryController from './apiary.controller.js';
import ChargeController from './charge.controller.js';
import CheckupController from './checkup.controller.js';
import FeedController from './feed.controller.js';
import HarvestController from './harvest.controller.js';
import HiveController from './hive.controller.js';
import OptionController from './options.controller.js';
import ServiceController from './service.controller.js';
import StatisticController from './statistic.controller.js';
import TodoController from './todo.controller.js';
import TreatmentController from './treatment.controller.js';

/**
 * WizBee Tools Controller
 *
 * This controller defines all tools available to the WizBee AI assistant.
 * Tools reuse existing controllers by creating mock FastifyRequest objects.
 * Tools are reused for a sub API under /wizbee/tools and can be called by the AI with user context.
 *
 */

/**
 * Context type for user authentication
 */
export interface WizBeeContext {
  userId: number;
  beeId: number;
}

const GENERIC_HTTP_MESSAGE_RE =
  /^(?:not found|forbidden|unauthorized|bad request|conflict|payment required|too many requests)$/i;

/**
 * Error-message patterns that really mean "an ID referenced in the request
 * doesn't exist / doesn't belong to the current user" but that underlying
 * controllers throw as plain `Error()` (so they surface as status=500 in
 * classifyError). We treat them as `not_found` so the model gets the proper
 * hint ("resolve hiveIds via findHives") instead of an opaque 500.
 *
 * Extend this list when new "invisible 500" cases pop up in logs.
 */
const NOT_FOUND_MESSAGE_RE =
  /no (?:current )?location found for hive|hive not found|apiary not found|record not found/i;

/**
 * Creates a mock FastifyRequest object to reuse existing controllers
 */
function createMockRequest(
  context: WizBeeContext,
  options: {
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
  } = {},
): FastifyRequest {
  return {
    session: {
      user: {
        user_id: context.userId,
        bee_id: context.beeId,
      },
      llm: true,
    },
    params: options.params ?? {},
    query: options.query ?? {},
    body: options.body ?? {},
    log: Logger.getInstance().pino,
  } as unknown as FastifyRequest;
}

/**
 * Creates a mock FastifyReply object
 */
function createMockReply(): FastifyReply {
  return {} as FastifyReply;
}

// ─────────────────────────────────────────────────────────────────────────────
// Structured tool-error envelope
//
// Tools NEVER throw. They return either a normal result, or:
//   { ok: false, error: { code, status, message, hint?, suggested_next_tool? } }
//
// Why: LLMs recover far better from a readable result object than from an
// opaque thrown exception surfaced by the AI SDK. Hints + suggested_next_tool
// convert multi-step failure loops into single-step corrections.
//
// Controllers (shared with the frontend) are NOT modified — their
// `httpErrors.*` throws are translated here, messages kept as-is because the
// frontend already shows them to users (so they're safe to surface).
// ─────────────────────────────────────────────────────────────────────────────

type ToolErrorCode =
  | 'not_found'
  | 'forbidden'
  | 'premium_required'
  | 'conflict'
  | 'validation_error'
  | 'no_records_affected'
  | 'upstream_unavailable'
  | 'unknown_error';

export interface ToolErrorEnvelope {
  ok: false;
  error: {
    code: ToolErrorCode;
    status: number;
    message: string;
    hint?: string;
    suggested_next_tool?: string;
  };
}

/**
 * Local tool definition type — replaces the `Tool` import from the Vercel AI
 * SDK. Keeping the same `{ description, inputSchema, execute }` shape so the
 * 31 tool definitions below need no structural changes.
 *
 * `execute` takes the validated tool input and returns any JSON-serializable
 * result (or a `ToolErrorEnvelope` on failure after going through `wrapTools`).
 */
export interface WizBeeTool<TInput = any> {
  description: string;
  inputSchema: z.ZodType<TInput>;
  execute: (input: TInput, opts?: unknown) => Promise<unknown>;
}

/**
 * Typed identity helper so the 31 `tool({...})` call sites stay identical to
 * how they read when using the AI SDK.
 */
function tool<T>(def: WizBeeTool<T>): WizBeeTool<T> {
  return def;
}

/**
 * Per-tool metadata used to craft actionable error hints.
 * Keep this list tight — only encode the confusions that actually happen.
 */
interface ToolHintMeta {
  /** Tool takes `hiveIds` (array) or `hiveId` (single) — user often passes hive *numbers* instead of real IDs */
  usesHiveIds?: boolean;
  /** Tool takes `apiaryId` */
  usesApiaryId?: boolean;
  /** Tool takes `typeId`/`diseaseId`/`vetId` — resolved via fetchOptions */
  usesTypeId?: boolean;
  /** Tool takes `ids` of existing records (patch/delete) — resolve via fetchTasks/getHiveTasks */
  usesRecordIds?: boolean;
  /** Category for no_records_affected messages */
  mutates?: 'create' | 'update' | 'delete';
  /** Human label for the record kind ("feed", "hive", "todo") */
  recordLabel?: string;
}

const TOOL_META: Record<string, ToolHintMeta> = {
  // Reads
  findHives: { recordLabel: 'hive' },
  getHiveDetail: { usesHiveIds: true, recordLabel: 'hive' },
  getHiveTasks: {
    usesHiveIds: true,
    usesApiaryId: true,
    recordLabel: 'hive/apiary',
  },
  apiaryWeather: { usesApiaryId: true, recordLabel: 'apiary' },
  fetchTasks: { usesApiaryId: true },
  // Mutations — feeds/harvests/treatments/checkups
  createFeed: {
    usesHiveIds: true,
    usesTypeId: true,
    mutates: 'create',
    recordLabel: 'feed',
  },
  patchFeed: {
    usesRecordIds: true,
    usesTypeId: true,
    mutates: 'update',
    recordLabel: 'feed',
  },
  softDeleteFeed: {
    usesRecordIds: true,
    mutates: 'delete',
    recordLabel: 'feed',
  },
  createHarvest: {
    usesHiveIds: true,
    usesTypeId: true,
    mutates: 'create',
    recordLabel: 'harvest',
  },
  patchHarvest: {
    usesRecordIds: true,
    usesTypeId: true,
    mutates: 'update',
    recordLabel: 'harvest',
  },
  softDeleteHarvest: {
    usesRecordIds: true,
    mutates: 'delete',
    recordLabel: 'harvest',
  },
  createTreatment: {
    usesHiveIds: true,
    usesTypeId: true,
    mutates: 'create',
    recordLabel: 'treatment',
  },
  patchTreatment: {
    usesRecordIds: true,
    usesTypeId: true,
    mutates: 'update',
    recordLabel: 'treatment',
  },
  softDeleteTreatment: {
    usesRecordIds: true,
    mutates: 'delete',
    recordLabel: 'treatment',
  },
  createCheckup: {
    usesHiveIds: true,
    usesTypeId: true,
    mutates: 'create',
    recordLabel: 'checkup',
  },
  patchCheckup: {
    usesRecordIds: true,
    usesTypeId: true,
    mutates: 'update',
    recordLabel: 'checkup',
  },
  softDeleteCheckup: {
    usesRecordIds: true,
    mutates: 'delete',
    recordLabel: 'checkup',
  },
  // Todos
  createTodo: { usesApiaryId: true, mutates: 'create', recordLabel: 'todo' },
  patchTodo: {
    usesRecordIds: true,
    usesApiaryId: true,
    mutates: 'update',
    recordLabel: 'todo',
  },
  batchDeleteTodo: {
    usesRecordIds: true,
    mutates: 'delete',
    recordLabel: 'todo',
  },
  // Charges
  createCharge: { usesTypeId: true, mutates: 'create', recordLabel: 'charge' },
  patchCharge: {
    usesRecordIds: true,
    usesTypeId: true,
    mutates: 'update',
    recordLabel: 'charge',
  },
  softDeleteCharge: {
    usesRecordIds: true,
    mutates: 'delete',
    recordLabel: 'charge',
  },
};

/**
 * Build a hint + suggested_next_tool tailored to the tool and error class.
 */
function buildHint(
  toolName: string,
  code: ToolErrorCode,
): { hint?: string; suggested_next_tool?: string } {
  const meta = TOOL_META[toolName];
  if (!meta) return {};

  if (code === 'not_found') {
    // Most common cause: caller passed a user-visible hive NUMBER instead of hiveId,
    // or used a stale/guessed ID.
    if (meta.usesHiveIds) {
      return {
        hint: 'One or more IDs could not be found for the current user. Hive NUMBERS (e.g. "1608") are NOT hiveIds — resolve the real hiveId via findHives (q=<hive name/number>) first. Also double-check the apiaryId via listApiariesHives.',
        suggested_next_tool: 'findHives',
      };
    }
    if (meta.usesApiaryId) {
      return {
        hint: 'Apiary not found for the current user. Resolve the real apiaryId first.',
        suggested_next_tool: 'listApiariesHives',
      };
    }
    if (meta.usesRecordIds) {
      return {
        hint: `One or more ${meta.recordLabel ?? 'record'} IDs do not exist (or belong to another user). List current records first to get valid IDs.`,
        suggested_next_tool:
          meta.recordLabel === 'todo' ? 'fetchTasks' : 'getHiveTasks',
      };
    }
  }

  if (code === 'validation_error' && meta.usesTypeId) {
    return {
      hint: 'A typeId / diseaseId / vetId is likely invalid for this user. Type IDs are user-scoped — fetch the current lookup lists to get valid IDs.',
      suggested_next_tool: 'fetchOptions',
    };
  }

  if (code === 'no_records_affected') {
    if (meta.mutates === 'create' && meta.usesHiveIds) {
      return {
        hint: `The request was accepted but 0 ${meta.recordLabel} records were created. Usually caused by hiveIds that do not belong to the current user. Resolve real hiveIds via findHives first.`,
        suggested_next_tool: 'findHives',
      };
    }
    if (
      (meta.mutates === 'update' || meta.mutates === 'delete') &&
      meta.usesRecordIds
    ) {
      return {
        hint: `0 ${meta.recordLabel} records matched the provided IDs. IDs may be wrong, already deleted, or belong to another user. List current records first.`,
        suggested_next_tool:
          meta.recordLabel === 'todo' ? 'fetchTasks' : 'getHiveTasks',
      };
    }
  }

  if (code === 'premium_required') {
    return {
      hint: "This action requires an active premium subscription on the user's account. Tell the user and stop — do not retry.",
    };
  }

  return {};
}

/**
 * Classify any thrown value (usually a fastify httpErrors.* instance) into a
 * stable, model-readable error code.
 */
function classifyError(err: unknown): {
  code: ToolErrorCode;
  status: number;
  message: string;
} {
  const anyErr = err as any;
  const status: number =
    typeof anyErr?.statusCode === 'number'
      ? anyErr.statusCode
      : typeof anyErr?.status === 'number'
        ? anyErr.status
        : 500;
  // httpErrors messages are already user-safe (shown to frontend users).
  const rawMessage: string =
    typeof anyErr?.message === 'string' && anyErr.message.length > 0
      ? anyErr.message
      : 'Request failed';

  let code: ToolErrorCode;
  let message = rawMessage;

  switch (status) {
    case 400:
    case 422: {
      code = 'validation_error';
      break;
    }
    case 401:
    case 403: {
      code = 'forbidden';
      break;
    }
    case 402: {
      code = 'premium_required';
      break;
    }
    case 404: {
      code = 'not_found';
      break;
    }
    case 409: {
      code = 'conflict';
      break;
    }
    case 502:
    case 503:
    case 504: {
      code = 'upstream_unavailable';
      message = 'An upstream service is temporarily unavailable. Retry later.';
      break;
    }
    default: {
      if (status >= 500) {
        // Some controllers throw plain `Error`s for missing-ownership cases
        // (e.g. CheckupController: "No current location found for hive").
        // These are really not-found, but come through as status=500. Pattern
        // match on the message so the model gets a useful `findHives` hint
        // instead of an opaque "Internal error".
        if (NOT_FOUND_MESSAGE_RE.test(rawMessage)) {
          code = 'not_found';
          // keep the original message — it's user-safe and descriptive enough
          // for the model to correct itself.
        } else {
          code = 'unknown_error';
          // Do not leak internal 5xx details.
          message = 'Internal error while executing this tool.';
        }
      } else {
        code = 'validation_error';
      }
    }
  }

  return { code, status, message };
}

/**
 * Detect "silent no-op" results on mutations (e.g. createFeed returned ids: []).
 * Returns a ToolErrorEnvelope if suspicious, otherwise null.
 */
function detectNoRecordsAffected(
  toolName: string,
  result: unknown,
): ToolErrorEnvelope | null {
  const meta = TOOL_META[toolName];
  if (!meta?.mutates) return null;
  const r = result as any;
  if (!r || typeof r !== 'object') return null;

  const createdZero =
    meta.mutates === 'create' && Array.isArray(r.ids) && r.ids.length === 0;
  const updatedZero = meta.mutates === 'update' && r.updatedCount === 0;
  const deletedZero = meta.mutates === 'delete' && r.deletedCount === 0;

  if (!createdZero && !updatedZero && !deletedZero) return null;

  const { hint, suggested_next_tool } = buildHint(
    toolName,
    'no_records_affected',
  );
  return {
    ok: false,
    error: {
      code: 'no_records_affected',
      status: 404,
      message: `0 ${meta.recordLabel ?? 'record'}s were affected. The IDs provided likely do not exist for this user.`,
      hint,
      suggested_next_tool,
    },
  };
}

/**
 * Pre-validate that all `hiveIds` (or single `hiveId`) in a tool input actually
 * exist for the current user. This catches the most common model mistake —
 * passing hive NAMES/numbers (e.g. 1402, 1614) instead of real hiveIds —
 * before* we invoke the underlying controller, which would otherwise fail
 * either silently (0 rows affected) or with a confusing 500 ("No current
 * location found for hive").
 *
 * Returns the list of hive IDs that were NOT found; an empty array means OK.
 */
async function findUnknownHiveIds(
  context: WizBeeContext,
  hiveIds: number[],
): Promise<number[]> {
  if (hiveIds.length === 0) return [];
  const unique = [...new Set(hiveIds.filter((id) => Number.isFinite(id)))];
  if (unique.length === 0) return hiveIds;

  const db = KyselyServer.getInstance().db;
  const rows = await db
    .selectFrom('hives')
    .select('id')
    .where('user_id', '=', context.userId)
    .where('id', 'in', unique)
    .execute();
  const found = new Set(rows.map((r) => Number(r.id)));
  return unique.filter((id) => !found.has(id));
}

/**
 * Same as above for a single `apiaryId`.
 */
async function isUnknownApiaryId(
  context: WizBeeContext,
  apiaryId: number,
): Promise<boolean> {
  if (!Number.isFinite(apiaryId)) return true;
  const db = KyselyServer.getInstance().db;
  const row = await db
    .selectFrom('apiaries')
    .select('id')
    .where('user_id', '=', context.userId)
    .where('id', '=', apiaryId)
    .executeTakeFirst();
  return !row;
}

/**
 * Run ownership pre-checks for a tool, based on its declared TOOL_META and
 * the shape of the input. Returns a ToolErrorEnvelope on failure, null on OK.
 *
 * We only check fields we can introspect statically (`hiveIds`, `hiveId`,
 * `apiaryId`). Tools whose meta flags don't line up with the input shape
 * simply pass through.
 */
async function preValidateOwnership(
  toolName: string,
  input: any,
  context: WizBeeContext,
): Promise<ToolErrorEnvelope | null> {
  const meta = TOOL_META[toolName];
  if (!meta || !input || typeof input !== 'object') return null;

  try {
    if (meta.usesHiveIds) {
      const raw = Array.isArray(input.hiveIds)
        ? input.hiveIds
        : typeof input.hiveId === 'number'
          ? [input.hiveId]
          : null;
      if (raw && raw.length > 0) {
        const unknown = await findUnknownHiveIds(
          context,
          raw.map((n: any) => Number(n)),
        );
        if (unknown.length > 0) {
          const { hint, suggested_next_tool } = buildHint(
            toolName,
            'not_found',
          );
          return {
            ok: false,
            error: {
              code: 'not_found',
              status: 404,
              message: `The following hiveIds do not belong to this user: ${unknown.join(', ')}. These look like hive NAMES / numbers, not database hiveIds. Resolve real hiveIds via findHives first.`,
              hint,
              suggested_next_tool: suggested_next_tool ?? 'findHives',
            },
          };
        }
      }
    }

    if (meta.usesApiaryId && typeof input.apiaryId === 'number') {
      if (await isUnknownApiaryId(context, input.apiaryId)) {
        const { hint } = buildHint(toolName, 'not_found');
        return {
          ok: false,
          error: {
            code: 'not_found',
            status: 404,
            message: `apiaryId ${input.apiaryId} does not belong to this user. Resolve the real apiaryId first.`,
            hint,
            suggested_next_tool: 'listApiariesHives',
          },
        };
      }
    }
  } catch (error) {
    // A failing pre-check must never block the tool — if the DB lookup errors
    // for any reason, just skip validation and let the controller decide.
    Logger.getInstance().log(
      'warn',
      `preValidateOwnership for ${toolName} failed — skipping`,
      error,
    );
  }

  return null;
}

/**
 * Maximum serialized size of a tool's result, in characters.
 *
 * Context budget math for `mistral-medium-2508` (131k tokens):
 *   - System prompt + tool schemas + history ≈ 15-25k tokens
 *   - Safe headroom for reasoning + output ≈ 10k tokens
 *   - That leaves ≥95k tokens for ALL tool results combined.
 * At ~4 chars/token, a single tool result above ~40 KB risks blowing the
 * window after 2-3 calls. We cap hard at 40 KB and instruct the model to
 * narrow its query or use statistics tools instead.
 */
const MAX_TOOL_RESULT_CHARS = 60_000;

/**
 * If the result is too large to safely feed back into the LLM context,
 * return a structured error envelope telling the model to narrow the query.
 */
function enforceResultSize(toolName: string, result: unknown): unknown {
  if (result && typeof result === 'object' && (result as any).ok === false) {
    return result;
  }
  let size: number;
  try {
    size = JSON.stringify(result).length;
  } catch {
    return result;
  }
  if (size <= MAX_TOOL_RESULT_CHARS) {
    return result;
  }

  const hintByTool: Record<string, string> = {
    fetchTasks:
      'The returned dataset is too large (likely a multi-year range). For multi-year summaries use getHarvestStatistics, getFeedStatistics or getTreatmentStatistics. For detail views, narrow the date range to a single year or a specific apiaryId, or reduce limit.',
    getHiveTasks:
      'Tasks for this hive/apiary are too many to return in full. Ask the user which year or which task type they are interested in, or use the statistics tools.',
    fetchCharges:
      'Too many charges to return. Add a search query (q) or reduce limit.',
    listApiariesHives:
      'Apiary/hive list is unexpectedly large. Consider setting includeInactive: false or filtering with q.',
    btreeDocumentation:
      "Documentation payload is too large. Summarize only the section relevant to the user's question instead of returning the whole document.",
  };
  const hint =
    hintByTool[toolName] ??
    'The result is too large to process. Ask the user to narrow the request (shorter date range, specific apiary, or a statistics tool instead of a detail fetch).';

  Logger.getInstance().log(
    'warn',
    `Tool ${toolName} result oversized: ${size} chars > ${MAX_TOOL_RESULT_CHARS} — replacing with structured error`,
    undefined,
  );

  const envelope: ToolErrorEnvelope = {
    ok: false,
    error: {
      code: 'validation_error',
      status: 413,
      message: `Result too large (${Math.round(size / 1024)} KB). Narrow the query or use a statistics tool.`,
      hint,
      suggested_next_tool:
        toolName === 'fetchTasks' || toolName === 'getHiveTasks'
          ? 'getHarvestStatistics'
          : undefined,
    },
  };
  return envelope;
}

function extractRelevantDocumentation(
  documentation: string,
  query?: string,
): string {
  const q = (query ?? '').toLowerCase();
  if (!q.trim()) return documentation;

  const headingMatches = [...documentation.matchAll(/^#{2,3} .+$/gm)];
  const sections = headingMatches.map((match, index) => ({
    heading: match[0],
    start: match.index ?? 0,
    end:
      index + 1 < headingMatches.length
        ? (headingMatches[index + 1].index ?? documentation.length)
        : documentation.length,
  }));

  const needles = new Set(
    q.split(/[^\p{L}\p{N}]+/u).filter((part) => part.length >= 4),
  );
  const addNeedles = (values: string[]) =>
    values.forEach((value) => needles.add(value));

  if (/premium|abo|preis|kosten|kostet|price|pricing|cost/.test(q))
    addNeedles(['costs', 'price', 'premium', 'basic']);
  if (/offline/.test(q)) addNeedles(['offline']);
  if (
    /fütterungstyp|futtertyp|feeding type|feed type|behandlungstyp|ernte|kontroll|option|einstellung/.test(
      q,
    )
  )
    addNeedles([
      'options',
      'feeding',
      'treatment',
      'selection',
      'dropdown',
      'types',
    ]);
  if (/api|ical|calendar|kalender/.test(q))
    addNeedles(['api', 'ical', 'calendar']);

  const scored = sections
    .map((section) => {
      const text = documentation.slice(section.start, section.end);
      const haystack = `${section.heading}\n${text}`.toLowerCase();
      let score = 0;
      for (const needle of needles) {
        if (haystack.includes(needle))
          score += section.heading.toLowerCase().includes(needle) ? 6 : 1;
      }
      return { section, text, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.section.start - b.section.start)
    .slice(0, 8)
    .sort((a, b) => a.section.start - b.section.start);

  if (scored.length === 0)
    return documentation.slice(0, MAX_TOOL_RESULT_CHARS - 2000);

  return scored.map((item) => item.text.trim()).join('\n\n---\n\n');
}

/**
 * Wrap a tool's `execute` so it never throws and returns structured errors.
 */
function wrapExecute<TArgs>(
  toolName: string,
  context: WizBeeContext,
  exec: (input: TArgs, opts?: any) => Promise<unknown>,
): (input: TArgs, opts?: any) => Promise<unknown> {
  return async (input, opts) => {
    // Fail fast on obviously-wrong hive/apiary IDs before we even touch the
    // real controller. This turns the common "model passed hive NAME as id"
    // mistake into a clean `not_found` envelope with a findHives suggestion,
    // instead of a confusing downstream 500.
    const preError = await preValidateOwnership(toolName, input, context);
    if (preError) {
      Logger.getInstance().log(
        'warn',
        `Tool ${toolName} rejected by preValidateOwnership`,
        { input },
      );
      return preError;
    }

    try {
      const raw = await exec(input, opts);
      const result = enforceResultSize(toolName, raw);
      const silent = detectNoRecordsAffected(toolName, result);
      if (silent) {
        Logger.getInstance().log(
          'warn',
          `Tool ${toolName} returned no_records_affected`,
          { input },
        );
        return silent;
      }
      return result;
    } catch (error) {
      const { code, status, message } = classifyError(error);
      const { hint, suggested_next_tool } = buildHint(toolName, code);
      // Full error goes to server logs; only sanitized fields go to the model.
      Logger.getInstance().log(
        status >= 500 ? 'error' : 'warn',
        `Tool ${toolName} failed: ${status} ${code}`,
        error,
      );
      // If the upstream message is just the generic http-errors default
      // ("Not Found", "Forbidden", "Unauthorized", "Bad Request") — which carries
      // zero signal — prefer the tool-specific hint when we have one.
      const isGenericMessage =
        !message || GENERIC_HTTP_MESSAGE_RE.test(message.trim());
      const finalMessage = isGenericMessage && hint ? hint : message;
      const envelope: ToolErrorEnvelope = {
        ok: false,
        error: {
          code,
          status,
          message: finalMessage,
          hint: finalMessage === hint ? undefined : hint,
          suggested_next_tool,
        },
      };
      return envelope;
    }
  };
}

/**
 * Wrap every tool in a tools record with the error-handling shim.
 */
function wrapTools(
  context: WizBeeContext,
  tools: Record<string, WizBeeTool>,
): Record<string, WizBeeTool> {
  const out: Record<string, WizBeeTool> = {};
  for (const [name, t] of Object.entries(tools)) {
    const original = t.execute;
    if (typeof original === 'function') {
      out[name] = {
        ...t,
        execute: wrapExecute(name, context, original.bind(t)),
      };
    } else {
      out[name] = t;
    }
  }
  return out;
}

/**
 * Get the default date range for task queries
 * @returns Start date (2 months ago) and end date (2 months from now)
 */
function getDefaultDateRange(): { dateStart: string; dateEnd: string } {
  const now = new Date();
  const dateStart = new Date(now);
  dateStart.setMonth(dateStart.getMonth() - 2);

  const dateEnd = new Date(now);
  dateEnd.setMonth(dateEnd.getMonth() + 2);

  return {
    dateStart: dateStart.toISOString().split('T')[0],
    dateEnd: dateEnd.toISOString().split('T')[0],
  };
}

/**
 * Task types supported by the fetchTasks tool
 */
const TASK_TYPES = ['feed', 'treatment', 'harvest', 'checkup', 'todo'] as const;
type TaskType = (typeof TASK_TYPES)[number];

/**
 * Controller mapping for each task type
 */
const taskControllers: Record<TaskType, any> = {
  feed: FeedController,
  treatment: TreatmentController,
  harvest: HarvestController,
  checkup: CheckupController,
  todo: TodoController,
};

/**
 * Create WizBee tools with injected context
 * Vercel AI SDK tools need the context at runtime, so we create them dynamically
 */
export function createWizBeeTools(
  context: WizBeeContext,
): Record<string, WizBeeTool> {
  return wrapTools(context, {
    /**
     * List Apiaries and Hives Tool
     * Returns all apiaries with their associated hives for the current user
     */
    listApiariesHives: tool({
      description:
        'List all apiaries and their colonies / hives for the current user. Returns a structured JSON with apiary details and associated colonies / hives. Use this to enumerate apiaries or to resolve apiaryIds. To look up a specific colony / hive by its number/name (e.g. "Volk 2402"), use findHives instead — the q parameter here does NOT search colony / hive names.',
      inputSchema: z.object({
        includeInactive: z
          .boolean()
          .optional()
          .default(false)
          .describe('Include inactive apiaries'),
        q: z
          .string()
          .optional()
          .describe(
            'Search query to filter APIARIES by name / description / note. Does NOT filter by colony / hive name or number — use the findHives tool for that.',
          ),
      }),
      execute: async (input) => {
        const req = createMockRequest(context, {
          query: {
            deleted: false,
            modus: input.includeInactive ? undefined : true,
            q: input.q,
            limit: 1000,
            offset: 0,
            details: false,
          },
        });

        const apiariesResult = await ApiaryController.get(
          req,
          createMockReply(),
        );

        // For each apiary, get details including hives
        const result = await Promise.all(
          (apiariesResult.results || []).map(async (apiary: any) => {
            try {
              const detailReq = createMockRequest(context, {
                params: { id: apiary.id },
              });
              const detail = await ApiaryController.getDetail(
                detailReq,
                createMockReply(),
              );
              return detail;
            } catch {
              return {};
            }
          }),
        );

        return result;
      },
    }),

    /**
     * Find Hives Tool
     * Search hives by name / number (the user-visible "Volk" number) or by apiary name.
     * This is the correct tool to resolve a hive when the user mentions a hive number
     * like "Volk 2402" or "hive 1608". The q in listApiariesHives only filters apiaries.
     */
    findHives: tool({
      description:
        'Find colonies / hives (Bienenvölker) by their user-visible name/number (e.g. "2402", "1608") or by the apiary name they are located in. Use this whenever the user refers to a specific colony / hive ("Volk X", "colony X", "hive X", "Stock X", "Bienenvolk X") so you can resolve the real hiveId and apiaryId. Returns matching colonies / hives with id, name, apiary_id and apiary name. Prefer this over listApiariesHives for colony / hive lookups.',
      inputSchema: z.object({
        q: z
          .string()
          .describe(
            'Colony / hive name/number (Volk-Nummer) or apiary name substring to search for (case-insensitive).',
          ),
        includeInactive: z
          .boolean()
          .optional()
          .default(false)
          .describe('Include inactive colonies / hives (modus=false)'),
        includeDeleted: z
          .boolean()
          .optional()
          .default(false)
          .describe('Include soft-deleted colonies / hives'),
        limit: z
          .number()
          .optional()
          .default(50)
          .describe(
            'Maximum number of colonies / hives to return (default 50).',
          ),
      }),
      execute: async (input) => {
        const req = createMockRequest(context, {
          query: {
            q: input.q,
            deleted: input.includeDeleted ?? false,
            modus: input.includeInactive ? undefined : true,
            limit: input.limit ?? 50,
            offset: 0,
            details: false,
          },
        });

        const raw = await HiveController.get(req, createMockReply());
        const results: any[] = Array.isArray(raw?.results) ? raw.results : [];

        // Return a compact, purpose-shaped payload so the model sees the IDs
        // it actually needs (hiveId + apiaryId) without 20+ unrelated fields.
        const hives = results.map((h: any) => ({
          hiveId: h.id,
          name: h.name,
          position: h.position,
          modus: h.modus,
          apiary_id: h.hive_location?.apiary_id ?? null,
          apiary_name: h.hive_location?.apiary_name ?? null,
        }));

        return {
          query: input.q,
          total: typeof raw?.total === 'number' ? raw.total : hives.length,
          returned: hives.length,
          hives,
        };
      },
    }),

    /**
     * Get Apiary Weather Tool
     * Returns current weather, forecast, and GTS (Grünlandtemperatursumme) for a specific apiary
     */
    apiaryWeather: tool({
      description:
        'Get the weather and forecast, and Grünlandtemperatursumme (GTS/grassland temperature sum) for a specific apiary. GTS is useful for spring vegetation development monitoring.',
      inputSchema: z.object({
        apiaryId: z.number().describe('The apiary ID to get weather for'),
        year: z
          .number()
          .optional()
          .describe('Year for GTS calculation (default: current year)'),
      }),
      execute: async (input) => {
        let weatherData = null;
        try {
          const weatherReq = createMockRequest(context, {
            params: { apiary_id: input.apiaryId },
          });
          weatherData = await ServiceController.getWeatherData(
            weatherReq,
            createMockReply(),
          );
        } catch {
          // Weather service might fail, continue without it
        }

        let gts = null;
        try {
          const requestedYear = input.year ?? new Date().getFullYear();
          const previousYear = requestedYear - 1;

          // Fetch GTS for requested year
          const gtsReq = createMockRequest(context, {
            params: { apiary_id: input.apiaryId },
            query: { year: requestedYear },
          });
          const gtsResult = await ServiceController.getGruenlandtemperatursumme(
            gtsReq,
            createMockReply(),
          );

          // Fetch GTS for previous year
          const gtsPrevReq = createMockRequest(context, {
            params: { apiary_id: input.apiaryId },
            query: { year: previousYear },
          });
          const gtsPrevResult =
            await ServiceController.getGruenlandtemperatursumme(
              gtsPrevReq,
              createMockReply(),
            );

          gts = {
            currentYear: {
              year: requestedYear,
              totalGts: gtsResult.totalGts,
              period: gtsResult.period,
            },
            previousYear: {
              year: previousYear,
              totalGts: gtsPrevResult.totalGts,
              period: gtsPrevResult.period,
            },
            apiary: gtsResult.apiary,
          };
        } catch {
          // GTS calculation might fail, continue without it
        }

        return {
          weatherData,
          gts,
        };
      },
    }),

    /**
     * Get Hive Detail Tool
     * Returns a static summary for a single hive (queen, location, type, source, etc.)
     */
    getHiveDetail: tool({
      description:
        'Get a detailed static summary for a single hive including queen info, location, hive type, hive source, move history, and neighbouring hives in the same apiary.',
      inputSchema: z.object({
        hiveId: z.number().describe('ID of the hive'),
      }),
      execute: async (input) => {
        const req = createMockRequest(context, {
          params: { id: input.hiveId },
        });
        const result = await HiveController.getDetail(req, createMockReply());
        return result;
      },
    }),

    /**
     * Get Hive Tasks Tool
     * Returns all tasks (feed, harvest, treatment, checkup, movedate, todo) for a hive in a given year
     */
    getHiveTasks: tool({
      description:
        'Get all tasks (feed, harvest, treatment, checkup, movedate, todo) for a specific hive or apiary for a given year.',
      inputSchema: z.object({
        id: z.number().describe('ID of the hive (or apiary when apiary=true)'),
        year: z
          .number()
          .optional()
          .describe('Year to fetch tasks for (defaults to current year)'),
        apiary: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            'When true, fetch tasks for all hives in the apiary with the given ID',
          ),
      }),
      execute: async (input) => {
        const req = createMockRequest(context, {
          params: { id: input.id },
          query: {
            year: input.year ?? new Date().getFullYear(),
            apiary: input.apiary ?? false,
          },
        });
        const result = await HiveController.getTasks(req, createMockReply());
        return result;
      },
    }),

    /**
     * Fetch Options Tool
     * Retrieves all available option/lookup lists at once (hive types, feed types, etc.)
     */
    fetchOptions: tool({
      description:
        'Fetch all available option/lookup lists at once (charge types, hive sources, hive types, feed types, harvest types, checkup types, queen matings, queen races, treatment diseases, treatment types, treatment vets). Use this to know which options are available when creating or updating records.',
      inputSchema: z.object({
        activeOnly: z
          .boolean()
          .optional()
          .default(true)
          .describe('When true, only return active (modus=true) options'),
      }),
      execute: async (input) => {
        const tableNames = OptionController.tableNames;

        const results = await Promise.all(
          tableNames.map(async (table) => {
            const req = createMockRequest(context, {
              params: { table },
              query: input.activeOnly ? { modus: true } : {},
            });
            const data = await OptionController.get(req, createMockReply());
            return [table, data] as const;
          }),
        );

        return Object.fromEntries(results);
      },
    }),

    /**
     * Fetch Tasks Tool
     * Retrieves tasks (feeds, treatments, harvests, checkups, todos) within a date range
     */
    fetchTasks: tool({
      description:
        'Fetch individual task records (feed, treatment, harvest, checkup, todo) within a date range. Useful for viewing specific upcoming/recent activities. IMPORTANT: for multi-year summaries or "what did I do last N years" style questions, prefer the statistics tools (getHarvestStatistics, getFeedStatistics, getTreatmentStatistics, getHiveStatistics) which return aggregates in a fraction of the tokens. Only fetch raw tasks when the user needs concrete records.',
      inputSchema: z.object({
        task: z.enum(TASK_TYPES).describe('Type of task to fetch'),
        dateStart: z
          .string()
          .optional()
          .describe('Start date in YYYY-MM-DD format (default: 2 months ago)'),
        dateEnd: z
          .string()
          .optional()
          .describe(
            'End date in YYYY-MM-DD format (default: 2 months from now)',
          ),
        apiaryId: z
          .number()
          .optional()
          .describe('Filter by specific apiary ID'),
        includeDone: z
          .boolean()
          .optional()
          .default(true)
          .describe('Include completed tasks'),
        limit: z
          .number()
          .optional()
          .default(200)
          .describe('Maximum number of results'),
      }),
      execute: async (input) => {
        const { dateStart, dateEnd } = getDefaultDateRange();

        const startDate = input.dateStart ?? dateStart;
        const endDate = input.dateEnd ?? dateEnd;

        const filterArray: any[] = [{ date: { from: startDate, to: endDate } }];
        if (input.apiaryId && input.task !== 'todo') {
          filterArray.push({
            [`${input.task}_apiary.apiary_id`]: input.apiaryId,
          });
        }
        const filters = JSON.stringify(filterArray);

        const Controller = taskControllers[input.task];
        const req = createMockRequest(context, {
          query: {
            limit: input.limit,
            offset: 0,
            ...(input.apiaryId &&
              input.task === 'todo' && { apiary_id: input.apiaryId }),
            filters,
            done: input.includeDone ? undefined : false,
            deleted: false,
          },
        });

        const result = await Controller.get(req, createMockReply());

        // Return full records as-is. If the payload is too big for the model
        // context, the wrapper's enforceResultSize() converts it to a
        // structured "result_too_large" error with a hint to narrow the query.
        return {
          task: input.task,
          count: result.results.length,
          dateRange: { start: startDate, end: endDate },
          items: result.results,
        };
      },
    }),

    /**
     * Create Task Tool
     * Creates a new feed, harvest, treatment, or checkup for one or more hives
     */
    // ── Feed ────────────────────────────────────────────────────────────────

    createFeed: tool({
      description: 'Create a new feed record for one or more hives.',
      inputSchema: z.object({
        hiveIds: z
          .array(z.number())
          .min(1)
          .describe('IDs of the hives to create the feed for'),
        date: z.string().describe('Date in YYYY-MM-DD format'),
        enddate: z
          .string()
          .optional()
          .describe('End date in YYYY-MM-DD format'),
        typeId: z.number().optional().describe('Feed type ID'),
        amount: z.number().optional().describe('Feed quantity'),
        note: z.string().max(2000).optional().describe('Optional notes'),
        done: z.boolean().optional().describe('Whether the feed is completed'),
      }),
      execute: async (input) => {
        const { hiveIds, typeId, ...rest } = input;
        const req = createMockRequest(context, {
          body: {
            ...rest,
            hive_ids: hiveIds,
            ...(typeId !== undefined && { type_id: typeId }),
            repeat: 0,
            interval: 0,
          },
        });
        const result = await FeedController.post(req, createMockReply());
        const createdCount = Array.isArray(result) ? result.length : 1;
        return {
          success: true,
          message: `Created ${createdCount} feed record${createdCount !== 1 ? 's' : ''}`,
          ids: Array.isArray(result) ? result : [result],
        };
      },
    }),

    patchFeed: tool({
      description: 'Update one or more existing feed records by their IDs.',
      inputSchema: z.object({
        ids: z
          .array(z.number())
          .min(1)
          .describe('IDs of the feed records to update'),
        date: z.string().optional().describe('New date in YYYY-MM-DD format'),
        enddate: z
          .string()
          .optional()
          .describe('New end date in YYYY-MM-DD format'),
        typeId: z.number().optional().describe('New feed type ID'),
        amount: z.number().optional().describe('New feed quantity'),
        note: z.string().max(2000).optional().describe('New notes'),
        done: z.boolean().optional().describe('Mark as done or undone'),
      }),
      execute: async (input) => {
        const { ids, typeId, ...fields } = input;
        const req = createMockRequest(context, {
          body: {
            ids,
            data: {
              ...fields,
              ...(typeId !== undefined && { type_id: typeId }),
            },
          },
        });
        const updatedCount = await FeedController.patch(req, createMockReply());
        return {
          success: true,
          message: `Updated ${updatedCount} feed record${updatedCount !== 1 ? 's' : ''}`,
          updatedCount,
        };
      },
    }),

    softDeleteFeed: tool({
      description:
        'Soft-delete one or more feed records by their IDs. Records are marked as deleted but not permanently removed.',
      inputSchema: z.object({
        ids: z
          .array(z.number())
          .min(1)
          .describe('IDs of the feed records to soft-delete'),
      }),
      execute: async (input) => {
        const req = createMockRequest(context, {
          body: { ids: input.ids },
          query: {},
        });
        await FeedController.batchDelete(req, createMockReply());
        return {
          success: true,
          message: `Soft-deleted ${input.ids.length} feed record${input.ids.length !== 1 ? 's' : ''}`,
          deletedCount: input.ids.length,
        };
      },
    }),

    // ── Harvest ─────────────────────────────────────────────────────────────

    createHarvest: tool({
      description: 'Create a new harvest record for one or more hives.',
      inputSchema: z.object({
        hiveIds: z
          .array(z.number())
          .min(1)
          .describe('IDs of the hives to create the harvest for'),
        date: z.string().describe('Date in YYYY-MM-DD format'),
        enddate: z
          .string()
          .optional()
          .describe('End date in YYYY-MM-DD format'),
        typeId: z.number().optional().describe('Harvest type ID'),
        amount: z.number().optional().describe('Harvest weight/quantity'),
        water: z.number().optional().describe('Water content'),
        frames: z.number().optional().describe('Number of frames harvested'),
        charge: z
          .string()
          .max(24)
          .optional()
          .describe('Charge/batch reference'),
        note: z.string().max(2000).optional().describe('Optional notes'),
        done: z
          .boolean()
          .optional()
          .describe('Whether the harvest is completed'),
      }),
      execute: async (input) => {
        const { hiveIds, typeId, ...rest } = input;
        const req = createMockRequest(context, {
          body: {
            ...rest,
            hive_ids: hiveIds,
            ...(typeId !== undefined && { type_id: typeId }),
            repeat: 0,
            interval: 0,
          },
        });
        const result = await HarvestController.post(req, createMockReply());
        const createdCount = Array.isArray(result) ? result.length : 1;
        return {
          success: true,
          message: `Created ${createdCount} harvest record${createdCount !== 1 ? 's' : ''}`,
          ids: Array.isArray(result) ? result : [result],
        };
      },
    }),

    patchHarvest: tool({
      description: 'Update one or more existing harvest records by their IDs.',
      inputSchema: z.object({
        ids: z
          .array(z.number())
          .min(1)
          .describe('IDs of the harvest records to update'),
        date: z.string().optional().describe('New date in YYYY-MM-DD format'),
        enddate: z
          .string()
          .optional()
          .describe('New end date in YYYY-MM-DD format'),
        typeId: z.number().optional().describe('New harvest type ID'),
        amount: z.number().optional().describe('New harvest weight/quantity'),
        water: z.number().optional().describe('New water content'),
        frames: z.number().optional().describe('New number of frames'),
        charge: z
          .string()
          .max(24)
          .optional()
          .describe('New charge/batch reference'),
        note: z.string().max(2000).optional().describe('New notes'),
        done: z.boolean().optional().describe('Mark as done or undone'),
      }),
      execute: async (input) => {
        const { ids, typeId, ...fields } = input;
        const req = createMockRequest(context, {
          body: {
            ids,
            data: {
              ...fields,
              ...(typeId !== undefined && { type_id: typeId }),
            },
          },
        });
        const updatedCount = await HarvestController.patch(
          req,
          createMockReply(),
        );
        return {
          success: true,
          message: `Updated ${updatedCount} harvest record${updatedCount !== 1 ? 's' : ''}`,
          updatedCount,
        };
      },
    }),

    softDeleteHarvest: tool({
      description:
        'Soft-delete one or more harvest records by their IDs. Records are marked as deleted but not permanently removed.',
      inputSchema: z.object({
        ids: z
          .array(z.number())
          .min(1)
          .describe('IDs of the harvest records to soft-delete'),
      }),
      execute: async (input) => {
        const req = createMockRequest(context, {
          body: { ids: input.ids },
          query: {},
        });
        await HarvestController.batchDelete(req, createMockReply());
        return {
          success: true,
          message: `Soft-deleted ${input.ids.length} harvest record${input.ids.length !== 1 ? 's' : ''}`,
          deletedCount: input.ids.length,
        };
      },
    }),

    // ── Treatment ────────────────────────────────────────────────────────────

    createTreatment: tool({
      description: 'Create a new treatment record for one or more hives.',
      inputSchema: z.object({
        hiveIds: z
          .array(z.number())
          .min(1)
          .describe('IDs of the hives to create the treatment for'),
        date: z.string().describe('Date in YYYY-MM-DD format'),
        enddate: z
          .string()
          .optional()
          .describe('End date in YYYY-MM-DD format'),
        typeId: z.number().optional().describe('Treatment type ID'),
        diseaseId: z.number().optional().describe('Disease ID'),
        vetId: z.number().optional().describe('Vet ID'),
        amount: z.number().optional().describe('Treatment dose/amount'),
        wait: z.number().optional().describe('Waiting period in days'),
        temperature: z
          .number()
          .optional()
          .describe('Temperature during treatment'),
        note: z.string().max(2000).optional().describe('Optional notes'),
        done: z
          .boolean()
          .optional()
          .describe('Whether the treatment is completed'),
      }),
      execute: async (input) => {
        const { hiveIds, typeId, diseaseId, vetId, ...rest } = input;
        const req = createMockRequest(context, {
          body: {
            ...rest,
            hive_ids: hiveIds,
            ...(typeId !== undefined && { type_id: typeId }),
            ...(diseaseId !== undefined && { disease_id: diseaseId }),
            ...(vetId !== undefined && { vet_id: vetId }),
            repeat: 0,
            interval: 0,
          },
        });
        const result = await TreatmentController.post(req, createMockReply());
        const createdCount = Array.isArray(result) ? result.length : 1;
        return {
          success: true,
          message: `Created ${createdCount} treatment record${createdCount !== 1 ? 's' : ''}`,
          ids: Array.isArray(result) ? result : [result],
        };
      },
    }),

    patchTreatment: tool({
      description:
        'Update one or more existing treatment records by their IDs.',
      inputSchema: z.object({
        ids: z
          .array(z.number())
          .min(1)
          .describe('IDs of the treatment records to update'),
        date: z.string().optional().describe('New date in YYYY-MM-DD format'),
        enddate: z
          .string()
          .optional()
          .describe('New end date in YYYY-MM-DD format'),
        typeId: z.number().optional().describe('New treatment type ID'),
        diseaseId: z.number().optional().describe('New disease ID'),
        vetId: z.number().optional().describe('New vet ID'),
        amount: z.number().optional().describe('New dose/amount'),
        wait: z.number().optional().describe('New waiting period in days'),
        temperature: z.number().optional().describe('New temperature'),
        note: z.string().max(2000).optional().describe('New notes'),
        done: z.boolean().optional().describe('Mark as done or undone'),
      }),
      execute: async (input) => {
        const { ids, typeId, diseaseId, vetId, ...fields } = input;
        const req = createMockRequest(context, {
          body: {
            ids,
            data: {
              ...fields,
              ...(typeId !== undefined && { type_id: typeId }),
              ...(diseaseId !== undefined && { disease_id: diseaseId }),
              ...(vetId !== undefined && { vet_id: vetId }),
            },
          },
        });
        const updatedCount = await TreatmentController.patch(
          req,
          createMockReply(),
        );
        return {
          success: true,
          message: `Updated ${updatedCount} treatment record${updatedCount !== 1 ? 's' : ''}`,
          updatedCount,
        };
      },
    }),

    softDeleteTreatment: tool({
      description:
        'Soft-delete one or more treatment records by their IDs. Records are marked as deleted but not permanently removed.',
      inputSchema: z.object({
        ids: z
          .array(z.number())
          .min(1)
          .describe('IDs of the treatment records to soft-delete'),
      }),
      execute: async (input) => {
        const req = createMockRequest(context, {
          body: { ids: input.ids },
          query: {},
        });
        await TreatmentController.batchDelete(req, createMockReply());
        return {
          success: true,
          message: `Soft-deleted ${input.ids.length} treatment record${input.ids.length !== 1 ? 's' : ''}`,
          deletedCount: input.ids.length,
        };
      },
    }),

    // ── Checkup ──────────────────────────────────────────────────────────────

    createCheckup: tool({
      description:
        'Create a new checkup/inspection record for one or more hives.',
      inputSchema: z.object({
        hiveIds: z
          .array(z.number())
          .min(1)
          .describe('IDs of the hives to create the checkup for'),
        date: z.string().describe('Date in YYYY-MM-DD format'),
        enddate: z
          .string()
          .optional()
          .describe('End date in YYYY-MM-DD format'),
        typeId: z.number().optional().describe('Checkup type ID'),
        note: z.string().max(2000).optional().describe('Optional notes'),
        done: z
          .boolean()
          .optional()
          .describe('Whether the checkup is completed'),
        queen: z.boolean().optional().describe('Queen present'),
        queencells: z.boolean().optional().describe('Queen cells present'),
        eggs: z.boolean().optional().describe('Eggs present'),
        cappedBrood: z.boolean().optional().describe('Capped brood present'),
        brood: z.number().optional().describe('Brood rating'),
        pollen: z.number().optional().describe('Pollen rating'),
        comb: z.number().optional().describe('Comb rating'),
        temper: z.number().optional().describe('Temper rating'),
        calmComb: z.number().optional().describe('Calm on comb rating'),
        swarm: z.number().optional().describe('Swarm tendency rating'),
        varroa: z.number().optional().describe('Varroa count'),
        strong: z.number().optional().describe('Colony strength'),
        temperature: z.number().optional().describe('Temperature'),
        weight: z.number().optional().describe('Hive weight'),
        broodframes: z.number().optional().describe('Number of brood frames'),
        honeyframes: z.number().optional().describe('Number of honey frames'),
        foundation: z
          .number()
          .optional()
          .describe('Number of foundation frames'),
        emptyframes: z.number().optional().describe('Number of empty frames'),
      }),
      execute: async (input) => {
        const { hiveIds, typeId, cappedBrood, calmComb, ...rest } = input;
        const req = createMockRequest(context, {
          body: {
            ...rest,
            hive_ids: hiveIds,
            ...(typeId !== undefined && { type_id: typeId }),
            ...(cappedBrood !== undefined && { capped_brood: cappedBrood }),
            ...(calmComb !== undefined && { calm_comb: calmComb }),
            repeat: 0,
            interval: 0,
          },
        });
        const result = await CheckupController.post(req, createMockReply());
        const createdCount = Array.isArray(result) ? result.length : 1;
        return {
          success: true,
          message: `Created ${createdCount} checkup record${createdCount !== 1 ? 's' : ''}`,
          ids: Array.isArray(result) ? result : [result],
        };
      },
    }),

    patchCheckup: tool({
      description:
        'Update one or more existing checkup/inspection records by their IDs.',
      inputSchema: z.object({
        ids: z
          .array(z.number())
          .min(1)
          .describe('IDs of the checkup records to update'),
        date: z.string().optional().describe('New date in YYYY-MM-DD format'),
        enddate: z
          .string()
          .optional()
          .describe('New end date in YYYY-MM-DD format'),
        typeId: z.number().optional().describe('New checkup type ID'),
        note: z.string().max(2000).optional().describe('New notes'),
        done: z.boolean().optional().describe('Mark as done or undone'),
        queen: z.boolean().optional().describe('Queen present'),
        queencells: z.boolean().optional().describe('Queen cells present'),
        eggs: z.boolean().optional().describe('Eggs present'),
        cappedBrood: z.boolean().optional().describe('Capped brood present'),
        brood: z.number().optional().describe('Brood rating'),
        pollen: z.number().optional().describe('Pollen rating'),
        comb: z.number().optional().describe('Comb rating'),
        temper: z.number().optional().describe('Temper rating'),
        calmComb: z.number().optional().describe('Calm on comb rating'),
        swarm: z.number().optional().describe('Swarm tendency rating'),
        varroa: z.number().optional().describe('Varroa count'),
        strong: z.number().optional().describe('Colony strength'),
        temperature: z.number().optional().describe('Temperature'),
        weight: z.number().optional().describe('Hive weight'),
        broodframes: z.number().optional().describe('Number of brood frames'),
        honeyframes: z.number().optional().describe('Number of honey frames'),
        foundation: z
          .number()
          .optional()
          .describe('Number of foundation frames'),
        emptyframes: z.number().optional().describe('Number of empty frames'),
      }),
      execute: async (input) => {
        const { ids, typeId, cappedBrood, calmComb, ...fields } = input;
        const req = createMockRequest(context, {
          body: {
            ids,
            data: {
              ...fields,
              ...(typeId !== undefined && { type_id: typeId }),
              ...(cappedBrood !== undefined && { capped_brood: cappedBrood }),
              ...(calmComb !== undefined && { calm_comb: calmComb }),
            },
          },
        });
        const updatedCount = await CheckupController.patch(
          req,
          createMockReply(),
        );
        return {
          success: true,
          message: `Updated ${updatedCount} checkup record${updatedCount !== 1 ? 's' : ''}`,
          updatedCount,
        };
      },
    }),

    softDeleteCheckup: tool({
      description:
        'Soft-delete one or more checkup/inspection records by their IDs. Records are marked as deleted but not permanently removed.',
      inputSchema: z.object({
        ids: z
          .array(z.number())
          .min(1)
          .describe('IDs of the checkup records to soft-delete'),
      }),
      execute: async (input) => {
        const req = createMockRequest(context, {
          body: { ids: input.ids },
          query: {},
        });
        await CheckupController.batchDelete(req, createMockReply());
        return {
          success: true,
          message: `Soft-deleted ${input.ids.length} checkup record${input.ids.length !== 1 ? 's' : ''}`,
          deletedCount: input.ids.length,
        };
      },
    }),

    /**
     * Create Todo Tool
     * Creates a new todo item for the user
     */
    createTodo: tool({
      description:
        'Create a new todo/reminder for the beekeeper. Use this to help users schedule tasks like inspections, treatments, or other reminders.',
      inputSchema: z.object({
        name: z
          .string()
          .min(1)
          .max(48)
          .describe('Short title for the todo (max 48 characters)'),
        date: z.string().describe('Date for the todo in YYYY-MM-DD format'),
        note: z
          .string()
          .max(2000)
          .optional()
          .describe('Optional longer description or notes'),
        apiaryId: z
          .number()
          .optional()
          .describe('Optional apiary to associate with this todo'),
      }),
      execute: async (input) => {
        const req = createMockRequest(context, {
          body: {
            name: input.name,
            date: input.date,
            note: input.note,
            apiary_id: input.apiaryId,
            repeat: 0,
            interval: 0,
            done: false,
          },
        });

        const result = await TodoController.post(req, createMockReply());

        const createdCount = Array.isArray(result) ? result.length : 1;

        return {
          success: true,
          message: `Created ${createdCount} todo${createdCount > 1 ? 's' : ''}`,
          ids: Array.isArray(result) ? result : [result],
        };
      },
    }),

    /**
     * Patch Todo Tool
     * Updates one or more existing todos by their IDs
     */
    patchTodo: tool({
      description:
        'Update one or more existing todos/reminders by their IDs. Use this to reschedule, rename, mark as done, or change the apiary of a todo.',
      inputSchema: z.object({
        ids: z.array(z.number()).min(1).describe('IDs of the todos to update'),
        name: z
          .string()
          .min(1)
          .max(48)
          .optional()
          .describe('New title for the todo (max 48 characters)'),
        date: z.string().optional().describe('New date in YYYY-MM-DD format'),
        note: z
          .string()
          .max(2000)
          .optional()
          .describe('New notes or description'),
        done: z
          .boolean()
          .optional()
          .describe('Mark as done (true) or undone (false)'),
        apiaryId: z
          .number()
          .optional()
          .describe('New apiary to associate with this todo'),
      }),
      execute: async (input) => {
        const { ids, apiaryId, ...rest } = input;
        const req = createMockRequest(context, {
          body: {
            ids,
            data: {
              ...rest,
              ...(apiaryId !== undefined && { apiary_id: apiaryId }),
            },
          },
        });

        const updatedCount = await TodoController.patch(req, createMockReply());

        return {
          success: true,
          message: `Updated ${updatedCount} todo${updatedCount !== 1 ? 's' : ''}`,
          updatedCount,
        };
      },
    }),

    /**
     * Batch Delete Todo Tool
     * Deletes one or more todos by their IDs
     */
    batchDeleteTodo: tool({
      description:
        'Delete one or more todos/reminders by their IDs. Use this when the user wants to remove tasks that are no longer needed.',
      inputSchema: z.object({
        ids: z.array(z.number()).min(1).describe('IDs of the todos to delete'),
      }),
      execute: async (input) => {
        const req = createMockRequest(context, {
          body: { ids: input.ids },
        });

        const deletedCount = await TodoController.batchDelete(
          req,
          createMockReply(),
        );

        return {
          success: true,
          message: `Deleted ${deletedCount} todo${deletedCount !== 1 ? 's' : ''}`,
          deletedCount,
        };
      },
    }),

    /**
     * Fetch Charges Tool
     * Retrieves charges (stock entries for goods like sugar, treatments, jars etc.)
     */
    fetchCharges: tool({
      description:
        'Fetch charges (stock/inventory entries for goods like sugar, treatments, honey jars etc.). Use this to view stock movements and inventory.',
      inputSchema: z.object({
        q: z
          .string()
          .optional()
          .describe(
            'Search query to filter charges by name, type or charge number',
          ),
        limit: z
          .number()
          .optional()
          .default(100)
          .describe('Maximum number of results'),
      }),
      execute: async (input) => {
        const req = createMockRequest(context, {
          query: {
            limit: input.limit,
            offset: 0,
            q: input.q,
          },
        });

        const result = await ChargeController.get(req, createMockReply());

        // Also get stock summary
        const stockReq = createMockRequest(context, {
          query: {
            limit: 1000,
            offset: 0,
          },
        });
        const stockResult = await ChargeController.getStock(
          stockReq,
          createMockReply(),
        );

        return {
          charges: {
            count: result.results.length,
            items: result.results,
          },
          stockSummary: {
            count: stockResult.results.length,
            items: stockResult.results,
          },
        };
      },
    }),

    createCharge: tool({
      description:
        'Create a new charge/stock entry (e.g. sugar, hive supplies, honey jars). Use this to record incoming stock or inventory items.',
      inputSchema: z.object({
        date: z.string().describe('Date of the charge in YYYY-MM-DD format'),
        amount: z.number().optional().describe('Quantity/amount'),
        price: z.number().optional().describe('Price per unit'),
        typeId: z
          .number()
          .optional()
          .describe('Charge type ID (from fetchOptions charge_types)'),
        charge: z
          .string()
          .max(24)
          .optional()
          .describe('Charge/batch number or reference or invoice number'),
        bestbefore: z
          .string()
          .default(new Date().toISOString().split('T')[0])
          .describe('Best-before date in YYYY-MM-DD format'),
        kind: z
          .enum(['in', 'out'])
          .describe(
            'Whether this is an incoming stock (in) or outgoing usage/sale (out)',
          ),
        name: z
          .string()
          .max(100)
          .optional()
          .describe(
            'Optional descriptive name like the supplier, product name, or item description',
          ),
        note: z.string().max(2000).optional().describe('Optional notes'),
        url: z.string().max(512).optional().describe('Optional URL reference'),
      }),
      execute: async (input) => {
        const { typeId, ...rest } = input;
        const req = createMockRequest(context, {
          body: { ...rest, ...(typeId !== undefined && { type_id: typeId }) },
        });
        const result = await ChargeController.post(req, createMockReply());
        const createdCount = Array.isArray(result) ? result.length : 1;
        return {
          success: true,
          message: `Created ${createdCount} charge record${createdCount !== 1 ? 's' : ''}`,
          ids: Array.isArray(result) ? result : [result],
        };
      },
    }),

    patchCharge: tool({
      description:
        'Update one or more existing charge/stock records by their IDs.',
      inputSchema: z.object({
        ids: z
          .array(z.number())
          .min(1)
          .describe('IDs of the charge records to update'),
        name: z.string().min(1).max(100).optional().describe('New name'),
        date: z.string().optional().describe('New date in YYYY-MM-DD format'),
        amount: z.number().optional().describe('New quantity/amount'),
        price: z.number().optional().describe('New price per unit'),
        typeId: z.number().optional().describe('New charge type ID'),
        charge: z
          .string()
          .max(24)
          .optional()
          .describe('New charge/batch reference'),
        bestbefore: z
          .string()
          .optional()
          .describe('New best-before date in YYYY-MM-DD format'),
        kind: z.string().optional().describe('New kind/category'),
        note: z.string().max(2000).optional().describe('New notes'),
        url: z.string().max(512).optional().describe('New URL reference'),
      }),
      execute: async (input) => {
        const { ids, typeId, ...fields } = input;
        const req = createMockRequest(context, {
          body: {
            ids,
            data: {
              ...fields,
              ...(typeId !== undefined && { type_id: typeId }),
            },
          },
        });
        const updatedCount = await ChargeController.patch(
          req,
          createMockReply(),
        );
        return {
          success: true,
          message: `Updated ${updatedCount} charge record${updatedCount !== 1 ? 's' : ''}`,
          updatedCount,
        };
      },
    }),

    softDeleteCharge: tool({
      description:
        'Soft-delete one or more charge/stock records by their IDs. Records are marked as deleted but not permanently removed.',
      inputSchema: z.object({
        ids: z
          .array(z.number())
          .min(1)
          .describe('IDs of the charge records to soft-delete'),
      }),
      execute: async (input) => {
        const req = createMockRequest(context, {
          body: { ids: input.ids },
          query: {},
        });
        await ChargeController.batchDelete(req, createMockReply());
        return {
          success: true,
          message: `Soft-deleted ${input.ids.length} charge record${input.ids.length !== 1 ? 's' : ''}`,
          deletedCount: input.ids.length,
        };
      },
    }),

    /**
     * Get Hive Statistics Tool
     * Returns hive count totals and per apiary
     */
    getHiveStatistics: tool({
      description:
        'Get hive count statistics including total counts and counts per apiary. Useful for getting an overview of the beekeeping operation size.',
      inputSchema: z.object({
        date: z
          .string()
          .optional()
          .describe(
            'Date for historical apiary counts in YYYY-MM-DD format (default: today)',
          ),
      }),
      execute: async (input) => {
        // Get total hive count
        const totalReq = createMockRequest(context);
        const totalResult = await StatisticController.getHiveCountTotal(
          totalReq,
          createMockReply(),
        );

        // Get apiary counts
        const apiaryReq = createMockRequest(context, {
          query: {
            date: input.date ?? new Date().toISOString().split('T')[0],
          },
        });
        const apiaryResult = await StatisticController.getHiveCountApiary(
          apiaryReq,
          createMockReply(),
        );

        return {
          total: totalResult,
          byApiary: apiaryResult,
        };
      },
    }),

    /**
     * Get Harvest Statistics Tool
     * Returns harvest statistics grouped by year, apiary, and type
     */
    getHarvestStatistics: tool({
      description:
        'Get honey harvest statistics including yearly totals, per-apiary breakdown, and by harvest type. Shows amounts, averages, and hive counts.',
      inputSchema: z.object({
        year: z
          .number()
          .optional()
          .describe(
            'Filter by year (default: current year for apiary/type, all years for yearly)',
          ),
      }),
      execute: async (input) => {
        const currentYear = input.year ?? new Date().getFullYear();
        const filters = JSON.stringify([{ year: currentYear }]);

        // Get yearly stats (all years)
        const yearReq = createMockRequest(context, { query: {} });
        const yearResult = await StatisticController.getHarvestYear(
          yearReq,
          createMockReply(),
        );

        // Get apiary stats for specified year
        const apiaryReq = createMockRequest(context, { query: { filters } });
        const apiaryResult = await StatisticController.getHarvestApiary(
          apiaryReq,
          createMockReply(),
        );

        // Get type stats for specified year
        const typeReq = createMockRequest(context, { query: { filters } });
        const typeResult = await StatisticController.getHarvestType(
          typeReq,
          createMockReply(),
        );

        return {
          year: currentYear,
          byYear: yearResult,
          byApiary: apiaryResult,
          byType: typeResult,
        };
      },
    }),

    /**
     * Get Feed Statistics Tool
     * Returns feed statistics grouped by year, apiary, and type
     */
    getFeedStatistics: tool({
      description:
        'Get feeding statistics including yearly totals, per-apiary breakdown, and by feed type. Shows amounts and averages.',
      inputSchema: z.object({
        year: z
          .number()
          .optional()
          .describe(
            'Filter by year (default: current year for apiary/type, all years for yearly)',
          ),
      }),
      execute: async (input) => {
        const currentYear = input.year ?? new Date().getFullYear();
        const filters = JSON.stringify([{ year: currentYear }]);

        // Get yearly stats (all years)
        const yearReq = createMockRequest(context, { query: {} });
        const yearResult = await StatisticController.getFeedYear(
          yearReq,
          createMockReply(),
        );

        // Get apiary stats for specified year
        const apiaryReq = createMockRequest(context, { query: { filters } });
        const apiaryResult = await StatisticController.getFeedApiary(
          apiaryReq,
          createMockReply(),
        );

        // Get type stats for specified year
        const typeReq = createMockRequest(context, { query: { filters } });
        const typeResult = await StatisticController.getFeedType(
          typeReq,
          createMockReply(),
        );

        return {
          year: currentYear,
          byYear: yearResult,
          byApiary: apiaryResult,
          byType: typeResult,
        };
      },
    }),

    /**
     * Get Treatment Statistics Tool
     * Returns treatment statistics grouped by year, apiary, and type
     */
    getTreatmentStatistics: tool({
      description:
        'Get treatment statistics including yearly totals, per-apiary breakdown, and by treatment type. Useful for analyzing Varroa treatment patterns.',
      inputSchema: z.object({
        year: z
          .number()
          .optional()
          .describe(
            'Filter by year (default: current year for apiary/type, all years for yearly)',
          ),
      }),
      execute: async (input) => {
        const currentYear = input.year ?? new Date().getFullYear();
        const filters = JSON.stringify([{ year: currentYear }]);

        // Get yearly stats (all years)
        const yearReq = createMockRequest(context, { query: {} });
        const yearResult = await StatisticController.getTreatmentYear(
          yearReq,
          createMockReply(),
        );

        // Get apiary stats for specified year
        const apiaryReq = createMockRequest(context, { query: { filters } });
        const apiaryResult = await StatisticController.getTreatmentApiary(
          apiaryReq,
          createMockReply(),
        );

        // Get type stats for specified year
        const typeReq = createMockRequest(context, { query: { filters } });
        const typeResult = await StatisticController.getTreatmentType(
          typeReq,
          createMockReply(),
        );

        return {
          year: currentYear,
          byYear: yearResult,
          byApiary: apiaryResult,
          byType: typeResult,
        };
      },
    }),

    /**
     * B.tree Documentation Tool
     * Fetches documentation from the b.tree LLM-friendly documentation endpoint
     */
    btreeDocumentation: tool({
      description:
        'Fetch the b.tree beekeeping software documentation. Use this to answer questions about how to use the b.tree app, features, and functionality.',
      inputSchema: z.object({
        query: z
          .string()
          .optional()
          .describe(
            'Optional search term to filter documentation (for context, the full doc will be fetched)',
          ),
      }),
      execute: async (input) => {
        const docUrl = 'https://www.btree.at/llms-full.txt';

        try {
          const response = await fetch(docUrl, {
            headers: {
              'User-Agent': 'btree-wizbee/1.0',
            },
          });

          if (!response.ok) {
            throw new Error(
              `Failed to fetch documentation: ${response.statusText}`,
            );
          }

          const fullDocumentation = await response.text();
          const documentation = extractRelevantDocumentation(
            fullDocumentation,
            input.query,
          );

          return {
            documentation,
            source: docUrl,
            query: input.query,
            filtered: Boolean(input.query),
          };
        } catch {
          return {
            documentation:
              'Unable to fetch documentation at this time. Please try again later or visit https://www.btree.at for help.',
            source: docUrl,
          };
        }
      },
    }),

    /**
     * Sugar Water Calculator Tool
     * Calculates sugar water mixture for bee feeding
     */
    // NOTE: any tool added to this record is automatically wrapped with the
    // structured-error envelope via wrapTools() at the end of this function.
    calculateSugarWater: tool({
      description:
        'Calculate sugar water mixture for bee feeding. Provide either sugar or water amount to calculate the mixture. Returns the required amounts and expected stored value.',
      inputSchema: z.object({
        ratio: z
          .enum(['1:1', '3:2'])
          .describe(
            'Mixing ratio - 1:1 (light syrup, spring/summer) or 3:2 (heavy syrup, autumn/winter)',
          ),
        sugar: z
          .number()
          .optional()
          .describe(
            'Amount of sugar in kg (provide either sugar OR water, not both)',
          ),
        water: z
          .number()
          .optional()
          .describe(
            'Amount of water in liters (provide either sugar OR water, not both)',
          ),
      }),
      execute: async (input) => {
        const ratioConfig =
          input.ratio === '1:1'
            ? { waterFactor: 1, solutionFactor: 0.8 }
            : { waterFactor: 0.667, solutionFactor: 0.76 };
        const theoreticalFactor = 1.2;

        let sugarKg: number;
        let waterL: number;

        if (input.sugar !== undefined && input.sugar > 0) {
          sugarKg = input.sugar;
          waterL = Math.round(sugarKg * ratioConfig.waterFactor * 10) / 10;
        } else if (input.water !== undefined && input.water > 0) {
          waterL = input.water;
          sugarKg = Math.round((waterL / ratioConfig.waterFactor) * 10) / 10;
        } else {
          return {
            error:
              'Please provide either sugar or water amount (greater than 0)',
          };
        }

        const solutionL =
          Math.round((sugarKg + waterL) * ratioConfig.solutionFactor * 10) / 10;
        const theoreticalStoredKg =
          Math.round(sugarKg * theoreticalFactor * 10) / 10;

        return {
          ratio: input.ratio,
          ratioDescription:
            input.ratio === '1:1'
              ? '1:1 (light syrup - suitable for spring/summer feeding)'
              : '3:2 (heavy syrup - suitable for autumn/winter feeding)',
          sugar: {
            amount: sugarKg,
            unit: 'kg',
          },
          water: {
            amount: waterL,
            unit: 'liters',
          },
          solution: {
            amount: solutionL,
            unit: 'liters',
            description: 'Total volume of sugar syrup produced',
          },
          theoreticalStored: {
            amount: theoreticalStoredKg,
            unit: 'kg',
            description:
              'Theoretical amount of honey equivalent stored by bees',
          },
        };
      },
    }),
  });
}

/**
 * Tool definitions for API route registration
 * These contain metadata about each tool for the /wizbee/tools API
 */
export const wizBeeToolDefinitions = [
  {
    name: 'listApiariesHives',
    description: 'List all apiaries and their hives for the current user.',
    parameters: z.object({
      includeInactive: z.boolean().optional().default(false),
      q: z.string().optional(),
    }),
  },
  {
    name: 'apiaryWeather',
    description: 'Get weather and GTS for a specific apiary.',
    parameters: z.object({
      apiaryId: z.number(),
      year: z.number().optional(),
    }),
  },
  {
    name: 'getHiveDetail',
    description:
      'Get a detailed static summary for a single hive (queen, location, type, source, neighbours).',
    parameters: z.object({
      hiveId: z.number(),
    }),
  },
  {
    name: 'getHiveTasks',
    description:
      'Get all tasks (feed, harvest, treatment, checkup, movedate, todo) for a hive or apiary for a given year.',
    parameters: z.object({
      id: z.number(),
      year: z.number().optional(),
      apiary: z.boolean().optional().default(false),
    }),
  },
  {
    name: 'fetchOptions',
    description:
      'Fetch all available option/lookup lists at once (hive types, feed types, harvest types, etc.).',
    parameters: z.object({
      activeOnly: z.boolean().optional().default(true),
    }),
  },
  {
    name: 'fetchTasks',
    description:
      'Fetch individual task records (feed, treatment, harvest, checkup, todo) within a date range. For multi-year summaries prefer the statistics tools.',
    parameters: z.object({
      task: z.enum(TASK_TYPES),
      dateStart: z.string().optional(),
      dateEnd: z.string().optional(),
      apiaryId: z.number().optional(),
      includeDone: z.boolean().optional().default(true),
      limit: z.number().optional().default(200),
    }),
  },
  {
    name: 'createFeed',
    description: 'Create a new feed record for one or more hives.',
    parameters: z.object({
      hiveIds: z.array(z.number()).min(1),
      date: z.string(),
      enddate: z.string().optional(),
      typeId: z.number().optional(),
      amount: z.number().optional(),
      note: z.string().max(2000).optional(),
      done: z.boolean().optional(),
      repeat: z.number().min(0).max(10).optional(),
      interval: z.number().min(0).max(365).optional(),
    }),
  },
  {
    name: 'patchFeed',
    description: 'Update one or more existing feed records by their IDs.',
    parameters: z.object({
      ids: z.array(z.number()).min(1),
      date: z.string().optional(),
      enddate: z.string().optional(),
      typeId: z.number().optional(),
      amount: z.number().optional(),
      note: z.string().max(2000).optional(),
      done: z.boolean().optional(),
    }),
  },
  {
    name: 'softDeleteFeed',
    description: 'Soft-delete one or more feed records by their IDs.',
    parameters: z.object({ ids: z.array(z.number()).min(1) }),
  },
  {
    name: 'createHarvest',
    description: 'Create a new harvest record for one or more hives.',
    parameters: z.object({
      hiveIds: z.array(z.number()).min(1),
      date: z.string(),
      enddate: z.string().optional(),
      typeId: z.number().optional(),
      amount: z.number().optional(),
      water: z.number().optional(),
      frames: z.number().optional(),
      charge: z.string().max(24).optional(),
      note: z.string().max(2000).optional(),
      done: z.boolean().optional(),
      repeat: z.number().min(0).max(10).optional(),
      interval: z.number().min(0).max(365).optional(),
    }),
  },
  {
    name: 'patchHarvest',
    description: 'Update one or more existing harvest records by their IDs.',
    parameters: z.object({
      ids: z.array(z.number()).min(1),
      date: z.string().optional(),
      enddate: z.string().optional(),
      typeId: z.number().optional(),
      amount: z.number().optional(),
      water: z.number().optional(),
      frames: z.number().optional(),
      charge: z.string().max(24).optional(),
      note: z.string().max(2000).optional(),
      done: z.boolean().optional(),
    }),
  },
  {
    name: 'softDeleteHarvest',
    description: 'Soft-delete one or more harvest records by their IDs.',
    parameters: z.object({ ids: z.array(z.number()).min(1) }),
  },
  {
    name: 'createTreatment',
    description: 'Create a new treatment record for one or more hives.',
    parameters: z.object({
      hiveIds: z.array(z.number()).min(1),
      date: z.string(),
      enddate: z.string().optional(),
      typeId: z.number().optional(),
      diseaseId: z.number().optional(),
      vetId: z.number().optional(),
      amount: z.number().optional(),
      wait: z.number().optional(),
      temperature: z.number().optional(),
      note: z.string().max(2000).optional(),
      done: z.boolean().optional(),
      repeat: z.number().min(0).max(10).optional(),
      interval: z.number().min(0).max(365).optional(),
    }),
  },
  {
    name: 'patchTreatment',
    description: 'Update one or more existing treatment records by their IDs.',
    parameters: z.object({
      ids: z.array(z.number()).min(1),
      date: z.string().optional(),
      enddate: z.string().optional(),
      typeId: z.number().optional(),
      diseaseId: z.number().optional(),
      vetId: z.number().optional(),
      amount: z.number().optional(),
      wait: z.number().optional(),
      temperature: z.number().optional(),
      note: z.string().max(2000).optional(),
      done: z.boolean().optional(),
    }),
  },
  {
    name: 'softDeleteTreatment',
    description: 'Soft-delete one or more treatment records by their IDs.',
    parameters: z.object({ ids: z.array(z.number()).min(1) }),
  },
  {
    name: 'createCheckup',
    description:
      'Create a new checkup/inspection record for one or more hives.',
    parameters: z.object({
      hiveIds: z.array(z.number()).min(1),
      date: z.string(),
      enddate: z.string().optional(),
      typeId: z.number().optional(),
      note: z.string().max(2000).optional(),
      done: z.boolean().optional(),
      repeat: z.number().min(0).max(10).optional(),
      interval: z.number().min(0).max(365).optional(),
      queen: z.boolean().optional(),
      queencells: z.boolean().optional(),
      eggs: z.boolean().optional(),
      cappedBrood: z.boolean().optional(),
      brood: z.number().optional(),
      pollen: z.number().optional(),
      comb: z.number().optional(),
      temper: z.number().optional(),
      calmComb: z.number().optional(),
      swarm: z.number().optional(),
      varroa: z.number().optional(),
      strong: z.number().optional(),
      temperature: z.number().optional(),
      weight: z.number().optional(),
      broodframes: z.number().optional(),
      honeyframes: z.number().optional(),
      foundation: z.number().optional(),
      emptyframes: z.number().optional(),
    }),
  },
  {
    name: 'patchCheckup',
    description:
      'Update one or more existing checkup/inspection records by their IDs.',
    parameters: z.object({
      ids: z.array(z.number()).min(1),
      date: z.string().optional(),
      enddate: z.string().optional(),
      typeId: z.number().optional(),
      note: z.string().max(2000).optional(),
      done: z.boolean().optional(),
      queen: z.boolean().optional(),
      queencells: z.boolean().optional(),
      eggs: z.boolean().optional(),
      cappedBrood: z.boolean().optional(),
      brood: z.number().optional(),
      pollen: z.number().optional(),
      comb: z.number().optional(),
      temper: z.number().optional(),
      calmComb: z.number().optional(),
      swarm: z.number().optional(),
      varroa: z.number().optional(),
      strong: z.number().optional(),
      temperature: z.number().optional(),
      weight: z.number().optional(),
      broodframes: z.number().optional(),
      honeyframes: z.number().optional(),
      foundation: z.number().optional(),
      emptyframes: z.number().optional(),
    }),
  },
  {
    name: 'softDeleteCheckup',
    description:
      'Soft-delete one or more checkup/inspection records by their IDs.',
    parameters: z.object({ ids: z.array(z.number()).min(1) }),
  },
  {
    name: 'createTodo',
    description: 'Create a new todo/reminder.',
    parameters: z.object({
      name: z.string().min(1).max(48),
      date: z.string(),
      note: z.string().max(2000).optional(),
      apiaryId: z.number().optional(),
      repeat: z.number().min(0).max(10).optional(),
      interval: z.number().min(0).max(365).optional(),
    }),
  },
  {
    name: 'patchTodo',
    description: 'Update one or more existing todos by their IDs.',
    parameters: z.object({
      ids: z.array(z.number()).min(1),
      name: z.string().min(1).max(48).optional(),
      date: z.string().optional(),
      note: z.string().max(2000).optional(),
      done: z.boolean().optional(),
      apiaryId: z.number().optional(),
    }),
  },
  {
    name: 'batchDeleteTodo',
    description: 'Delete one or more todos by their IDs.',
    parameters: z.object({
      ids: z.array(z.number()).min(1),
    }),
  },
  {
    name: 'fetchCharges',
    description: 'Fetch charges (stock/inventory entries).',
    parameters: z.object({
      q: z.string().optional(),
      includeDeleted: z.boolean().optional().default(false),
      limit: z.number().optional().default(100),
    }),
  },
  {
    name: 'createCharge',
    description:
      'Create a new charge/stock entry (sugar, treatments, honey jars, etc.).',
    parameters: z.object({
      name: z.string().min(1).max(100),
      date: z.string(),
      amount: z.number().optional(),
      price: z.number().optional(),
      typeId: z.number().optional(),
      charge: z.string().max(24).optional(),
      bestbefore: z.string().optional(),
      kind: z.string().optional(),
      note: z.string().max(2000).optional(),
      url: z.string().max(512).optional(),
    }),
  },
  {
    name: 'patchCharge',
    description:
      'Update one or more existing charge/stock records by their IDs.',
    parameters: z.object({
      ids: z.array(z.number()).min(1),
      name: z.string().optional(),
      date: z.string().optional(),
      amount: z.number().optional(),
      price: z.number().optional(),
      typeId: z.number().optional(),
      charge: z.string().max(24).optional(),
      bestbefore: z.string().optional(),
      kind: z.string().optional(),
      note: z.string().max(2000).optional(),
      url: z.string().max(512).optional(),
    }),
  },
  {
    name: 'softDeleteCharge',
    description: 'Soft-delete one or more charge/stock records by their IDs.',
    parameters: z.object({
      ids: z.array(z.number()).min(1),
    }),
  },
  {
    name: 'getHiveStatistics',
    description: 'Get hive count statistics (total and per apiary).',
    parameters: z.object({
      date: z.string().optional(),
    }),
  },
  {
    name: 'getHarvestStatistics',
    description: 'Get harvest statistics (by year, apiary, type).',
    parameters: z.object({
      year: z.number().optional(),
    }),
  },
  {
    name: 'getFeedStatistics',
    description: 'Get feed statistics (by year, apiary, type).',
    parameters: z.object({
      year: z.number().optional(),
    }),
  },
  {
    name: 'getTreatmentStatistics',
    description: 'Get treatment statistics (by year, apiary, type).',
    parameters: z.object({
      year: z.number().optional(),
    }),
  },
  {
    name: 'btreeDocumentation',
    description: 'Fetch b.tree software documentation.',
    parameters: z.object({
      query: z.string().optional(),
    }),
  },
  {
    name: 'calculateSugarWater',
    description: 'Calculate sugar water mixture for bee feeding.',
    parameters: z.object({
      ratio: z.enum(['1:1', '3:2']),
      sugar: z.number().optional(),
      water: z.number().optional(),
    }),
  },
];

/**
 * Execute a tool by name with given input and context
 * Used by the /wizbee/tools API endpoints
 */
export async function executeWizBeeTool(
  toolName: string,
  input: unknown,
  context: WizBeeContext,
): Promise<unknown> {
  const tools = createWizBeeTools(context);
  const toolFn = tools[toolName];

  if (!toolFn || typeof toolFn.execute !== 'function') {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  return toolFn.execute(input);
}
