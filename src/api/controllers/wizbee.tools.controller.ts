import type { Tool } from 'ai';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { tool } from 'ai';
import { z } from 'zod';
import { Logger } from '../../services/logger.service.js';
import ApiaryController from './apiary.controller.js';
import ChargeController from './charge.controller.js';
import CheckupController from './checkup.controller.js';
import FeedController from './feed.controller.js';
import HarvestController from './harvest.controller.js';
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
 * Uses Vercel AI SDK for tool definitions.
 */

/**
 * Context type for user authentication
 */
export interface WizBeeContext {
  userId: number
  beeId: number
}

/**
 * Creates a mock FastifyRequest object to reuse existing controllers
 */
function createMockRequest(
  context: WizBeeContext,
  options: {
    params?: Record<string, unknown>
    query?: Record<string, unknown>
    body?: Record<string, unknown>
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

/**
 * Get the default date range for task queries
 * @returns Start date (6 months ago) and end date (6 months from now)
 */
function getDefaultDateRange(): { dateStart: string, dateEnd: string } {
  const now = new Date();
  const dateStart = new Date(now);
  dateStart.setMonth(dateStart.getMonth() - 6);

  const dateEnd = new Date(now);
  dateEnd.setMonth(dateEnd.getMonth() + 6);

  return {
    dateStart: dateStart.toISOString().split('T')[0],
    dateEnd: dateEnd.toISOString().split('T')[0],
  };
}

/**
 * Task types supported by the fetchTasks tool
 */
const TASK_TYPES = ['feed', 'treatment', 'harvest', 'checkup', 'todo'] as const;
type TaskType = typeof TASK_TYPES[number];

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
export function createWizBeeTools(context: WizBeeContext): Record<string, Tool> {
  return {
    /**
     * List Apiaries and Hives Tool
     * Returns all apiaries with their associated hives for the current user
     */
    listApiariesHives: tool({
      description: 'List all apiaries and their hives for the current user. Returns a structured JSON with apiary details and associated hives.',
      inputSchema: z.object({
        includeInactive: z.boolean().optional().default(false).describe('Include inactive apiaries'),
        q: z.string().optional().describe('Search query to filter apiaries by name'),
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

        const apiariesResult = await ApiaryController.get(req, createMockReply());

        // For each apiary, get details including hives
        const result = await Promise.all(
          (apiariesResult.results || []).map(async (apiary: any) => {
            try {
              const detailReq = createMockRequest(context, {
                params: { id: apiary.id },
              });
              const detail = await ApiaryController.getDetail(detailReq, createMockReply());
              return detail;
            }
            catch {
              return {};
            }
          }),
        );

        return result;
      },
    }),

    /**
     * Get Apiary Weather Tool
     * Returns current weather and GTS (Grünlandtemperatursumme) for a specific apiary
     */
    apiaryWeather: tool({
      description: 'Get the current weather and Grünlandtemperatursumme (GTS/grassland temperature sum) for a specific apiary. GTS is useful for spring vegetation development monitoring.',
      inputSchema: z.object({
        apiaryId: z.number().describe('The apiary ID to get weather for'),
        year: z.number().optional().describe('Year for GTS calculation (default: current year)'),
      }),
      execute: async (input) => {
        let currentWeather = null;
        try {
          const tempReq = createMockRequest(context, {
            params: { apiary_id: input.apiaryId },
          });
          currentWeather = await ServiceController.getTemperature(tempReq, createMockReply());
        }
        catch {
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
          const gtsResult = await ServiceController.getGruenlandtemperatursumme(gtsReq, createMockReply());

          // Fetch GTS for previous year
          const gtsPrevReq = createMockRequest(context, {
            params: { apiary_id: input.apiaryId },
            query: { year: previousYear },
          });
          const gtsPrevResult = await ServiceController.getGruenlandtemperatursumme(gtsPrevReq, createMockReply());

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
        }
        catch {
          // GTS calculation might fail, continue without it
        }

        // Format weather response
        const weather = currentWeather
          ? {
              temperature: currentWeather.main?.temp,
              feelsLike: currentWeather.main?.feels_like,
              humidity: currentWeather.main?.humidity,
              description: currentWeather.weather?.[0]?.description ?? '',
              windSpeed: currentWeather.wind?.speed,
            }
          : null;

        return {
          currentWeather: weather,
          gts,
        };
      },
    }),

    /**
     * Fetch Tasks Tool
     * Retrieves tasks (feeds, treatments, harvests, checkups, todos) within a date range
     */
    fetchTasks: tool({
      description: 'Fetch tasks (feed, treatment, harvest, checkup, todo) for the user within a specified date range. Useful for viewing upcoming and past beekeeping activities.',
      inputSchema: z.object({
        task: z.enum(TASK_TYPES).describe('Type of task to fetch'),
        dateStart: z.string().optional().describe('Start date in YYYY-MM-DD format (default: 6 months ago)'),
        dateEnd: z.string().optional().describe('End date in YYYY-MM-DD format (default: 6 months from now)'),
        apiaryId: z.number().optional().describe('Filter by specific apiary ID'),
        includeDone: z.boolean().optional().default(true).describe('Include completed tasks'),
        limit: z.number().optional().default(1000).describe('Maximum number of results'),
      }),
      execute: async (input) => {
        const { dateStart, dateEnd } = getDefaultDateRange();

        const startDate = input.dateStart ?? dateStart;
        const endDate = input.dateEnd ?? dateEnd;

        const filterArray: any[] = [{ date: { from: startDate, to: endDate } }];
        if (input.apiaryId) {
          filterArray.push({ [`${input.task}.apiary_id`]: input.apiaryId });
        }
        const filters = JSON.stringify(filterArray);

        const Controller = taskControllers[input.task];
        const req = createMockRequest(context, {
          query: {
            limit: input.limit,
            offset: 0,
            filters,
            done: input.includeDone ? undefined : false,
            deleted: false,
          },
        });

        const result = await Controller.get(req, createMockReply());

        return {
          task: input.task,
          count: result.results.length,
          dateRange: { start: startDate, end: endDate },
          items: result.results,
        };
      },
    }),

    /**
     * Create Todo Tool
     * Creates a new todo item for the user
     */
    createTodo: tool({
      description: 'Create a new todo/reminder for the beekeeper. Use this to help users schedule tasks like inspections, treatments, or other reminders.',
      inputSchema: z.object({
        name: z.string().min(1).max(48).describe('Short title for the todo (max 48 characters)'),
        date: z.string().describe('Date for the todo in YYYY-MM-DD format'),
        note: z.string().max(2000).optional().describe('Optional longer description or notes'),
        apiaryId: z.number().optional().describe('Optional apiary to associate with this todo'),
        repeat: z.number().min(0).max(30).optional().describe('Number of times to repeat this todo'),
        interval: z.number().min(0).max(365).optional().describe('Days between repeated todos'),
      }),
      execute: async (input) => {
        const req = createMockRequest(context, {
          body: {
            name: input.name,
            date: input.date,
            note: input.note,
            apiary_id: input.apiaryId,
            repeat: input.repeat ?? 0,
            interval: input.interval ?? 0,
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
     * Fetch Charges Tool
     * Retrieves charges (stock entries for goods like sugar, treatments, jars etc.)
     */
    fetchCharges: tool({
      description: 'Fetch charges (stock/inventory entries for goods like sugar, treatments, honey jars etc.). Use this to view stock movements and inventory.',
      inputSchema: z.object({
        q: z.string().optional().describe('Search query to filter charges by name, type or charge number'),
        includeDeleted: z.boolean().optional().default(false).describe('Include deleted charges'),
        limit: z.number().optional().default(100).describe('Maximum number of results'),
      }),
      execute: async (input) => {
        const req = createMockRequest(context, {
          query: {
            limit: input.limit,
            offset: 0,
            q: input.q,
            deleted: input.includeDeleted,
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
        const stockResult = await ChargeController.getStock(stockReq, createMockReply());

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

    /**
     * Get Hive Statistics Tool
     * Returns hive count totals and per apiary
     */
    getHiveStatistics: tool({
      description: 'Get hive count statistics including total counts and counts per apiary. Useful for getting an overview of the beekeeping operation size.',
      inputSchema: z.object({
        date: z.string().optional().describe('Date for historical apiary counts in YYYY-MM-DD format (default: today)'),
      }),
      execute: async (input) => {
        // Get total hive count
        const totalReq = createMockRequest(context);
        const totalResult = await StatisticController.getHiveCountTotal(totalReq, createMockReply());

        // Get apiary counts
        const apiaryReq = createMockRequest(context, {
          query: {
            date: input.date ?? new Date().toISOString().split('T')[0],
          },
        });
        const apiaryResult = await StatisticController.getHiveCountApiary(apiaryReq, createMockReply());

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
      description: 'Get honey harvest statistics including yearly totals, per-apiary breakdown, and by harvest type. Shows amounts, averages, and hive counts.',
      inputSchema: z.object({
        year: z.number().optional().describe('Filter by year (default: current year for apiary/type, all years for yearly)'),
      }),
      execute: async (input) => {
        const currentYear = input.year ?? new Date().getFullYear();
        const filters = JSON.stringify([{ year: currentYear }]);

        // Get yearly stats (all years)
        const yearReq = createMockRequest(context, { query: {} });
        const yearResult = await StatisticController.getHarvestYear(yearReq, createMockReply());

        // Get apiary stats for specified year
        const apiaryReq = createMockRequest(context, { query: { filters } });
        const apiaryResult = await StatisticController.getHarvestApiary(apiaryReq, createMockReply());

        // Get type stats for specified year
        const typeReq = createMockRequest(context, { query: { filters } });
        const typeResult = await StatisticController.getHarvestType(typeReq, createMockReply());

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
      description: 'Get feeding statistics including yearly totals, per-apiary breakdown, and by feed type. Shows amounts and averages.',
      inputSchema: z.object({
        year: z.number().optional().describe('Filter by year (default: current year for apiary/type, all years for yearly)'),
      }),
      execute: async (input) => {
        const currentYear = input.year ?? new Date().getFullYear();
        const filters = JSON.stringify([{ year: currentYear }]);

        // Get yearly stats (all years)
        const yearReq = createMockRequest(context, { query: {} });
        const yearResult = await StatisticController.getFeedYear(yearReq, createMockReply());

        // Get apiary stats for specified year
        const apiaryReq = createMockRequest(context, { query: { filters } });
        const apiaryResult = await StatisticController.getFeedApiary(apiaryReq, createMockReply());

        // Get type stats for specified year
        const typeReq = createMockRequest(context, { query: { filters } });
        const typeResult = await StatisticController.getFeedType(typeReq, createMockReply());

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
      description: 'Get treatment statistics including yearly totals, per-apiary breakdown, and by treatment type. Useful for analyzing Varroa treatment patterns.',
      inputSchema: z.object({
        year: z.number().optional().describe('Filter by year (default: current year for apiary/type, all years for yearly)'),
      }),
      execute: async (input) => {
        const currentYear = input.year ?? new Date().getFullYear();
        const filters = JSON.stringify([{ year: currentYear }]);

        // Get yearly stats (all years)
        const yearReq = createMockRequest(context, { query: {} });
        const yearResult = await StatisticController.getTreatmentYear(yearReq, createMockReply());

        // Get apiary stats for specified year
        const apiaryReq = createMockRequest(context, { query: { filters } });
        const apiaryResult = await StatisticController.getTreatmentApiary(apiaryReq, createMockReply());

        // Get type stats for specified year
        const typeReq = createMockRequest(context, { query: { filters } });
        const typeResult = await StatisticController.getTreatmentType(typeReq, createMockReply());

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
      description: 'Fetch the b.tree beekeeping software documentation. Use this to answer questions about how to use the b.tree app, features, and functionality.',
      inputSchema: z.object({
        query: z.string().optional().describe('Optional search term to filter documentation (for context, the full doc will be fetched)'),
      }),
      execute: async (_input) => {
        const docUrl = 'https://www.btree.at/llms-full.txt';

        try {
          const response = await fetch(docUrl, {
            headers: {
              'User-Agent': 'btree-wizbee/1.0',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch documentation: ${response.statusText}`);
          }

          const documentation = await response.text();

          return {
            documentation,
            source: docUrl,
          };
        }
        catch {
          return {
            documentation: 'Unable to fetch documentation at this time. Please try again later or visit https://www.btree.at for help.',
            source: docUrl,
          };
        }
      },
    }),

    /**
     * Sugar Water Calculator Tool
     * Calculates sugar water mixture for bee feeding
     */
    calculateSugarWater: tool({
      description: 'Calculate sugar water mixture for bee feeding. Provide either sugar or water amount to calculate the mixture. Returns the required amounts and expected stored value.',
      inputSchema: z.object({
        ratio: z.enum(['1:1', '3:2']).describe('Mixing ratio - 1:1 (light syrup, spring/summer) or 3:2 (heavy syrup, autumn/winter)'),
        sugar: z.number().optional().describe('Amount of sugar in kg (provide either sugar OR water, not both)'),
        water: z.number().optional().describe('Amount of water in liters (provide either sugar OR water, not both)'),
      }),
      execute: async (input) => {
        const ratioConfig = input.ratio === '1:1'
          ? { waterFactor: 1, solutionFactor: 0.8 }
          : { waterFactor: 0.667, solutionFactor: 0.76 };
        const theoreticalFactor = 1.2;

        let sugarKg: number;
        let waterL: number;

        if (input.sugar !== undefined && input.sugar > 0) {
          sugarKg = input.sugar;
          waterL = Math.round(sugarKg * ratioConfig.waterFactor * 10) / 10;
        }
        else if (input.water !== undefined && input.water > 0) {
          waterL = input.water;
          sugarKg = Math.round((waterL / ratioConfig.waterFactor) * 10) / 10;
        }
        else {
          return {
            error: 'Please provide either sugar or water amount (greater than 0)',
          };
        }

        const solutionL = Math.round((sugarKg + waterL) * ratioConfig.solutionFactor * 10) / 10;
        const theoreticalStoredKg = Math.round(sugarKg * theoreticalFactor * 10) / 10;

        return {
          ratio: input.ratio,
          ratioDescription: input.ratio === '1:1'
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
            description: 'Theoretical amount of honey equivalent stored by bees',
          },
        };
      },
    }),
  };
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
    name: 'fetchTasks',
    description: 'Fetch tasks (feed, treatment, harvest, checkup, todo) within a date range.',
    parameters: z.object({
      task: z.enum(TASK_TYPES),
      dateStart: z.string().optional(),
      dateEnd: z.string().optional(),
      apiaryId: z.number().optional(),
      includeDone: z.boolean().optional().default(true),
      limit: z.number().optional().default(1000),
    }),
  },
  {
    name: 'createTodo',
    description: 'Create a new todo/reminder.',
    parameters: z.object({
      name: z.string().min(1).max(48),
      date: z.string(),
      note: z.string().max(2000).optional(),
      apiaryId: z.number().optional(),
      repeat: z.number().min(0).max(30).optional(),
      interval: z.number().min(0).max(365).optional(),
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

  if (!toolFn || !('execute' in toolFn) || typeof toolFn.execute !== 'function') {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  return toolFn.execute(input, {
    abortSignal: undefined as any,
    toolCallId: `api-${Date.now()}`,
    messages: [],
  });
}
