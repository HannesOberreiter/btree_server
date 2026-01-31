import type { KyselyPlugin, PluginTransformQueryArgs, PluginTransformResultArgs, QueryResult, RootOperationNode, UnknownRow } from 'kysely';

import type { DB } from '../types/db.types.js';

import { Kysely, MysqlDialect } from 'kysely';
import { ENVIRONMENT } from '../config/constants.config.js';
import { env, knexConfig } from '../config/environment.config.js';
import { Logger } from '../services/logger.service.js';
import { DatabaseServer } from './db.server.js';

/**
 * @description Database connection manager for MySQL server with Kysely
 */
export class KyselyServer {
  private static instance: KyselyServer;
  private logger = Logger.getInstance();

  db: Kysely<DB>;

  static getInstance(): KyselyServer {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  private constructor() {
    try {
      const dialect = new MysqlDialect({
        pool: DatabaseServer.getInstance().knex.client.pool,
      });

      this.db = new Kysely<DB>({
        dialect,
        plugins: [
          new TimestampPlugin(),
        ],
      });

      if (env !== ENVIRONMENT.test) {
        this.logger.log(
          'debug',
          `Connection to database established on port ${knexConfig.connection.port} (${env})`,
          { label: 'Database' },
        );
      }
    }
    catch (error) {
      this.logger.log('error', `Database initialization error : ${error.message}`, {
        label: 'Database',
      });
    }
  }

  async stop(): Promise<void> {
    try {
      this.logger.log('debug', 'Closing database connection', {});
      await this.db.destroy();
      this.logger.log('debug', 'Closed database connection', {});
    }
    catch (error) {
      this.logger.log('error', 'Database closing error', { error });
    }
  }
}

/**
 * Kysely plugin that automatically adds `created_at` and `updated_at` timestamps
 * for INSERT and UPDATE operations, replicating Objection.js ExtModel behavior.
 */
class TimestampPlugin implements KyselyPlugin {
  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    const { node } = args;

    if (node.kind === 'InsertQueryNode') {
      return this.handleInsert(node, args);
    }

    if (node.kind === 'UpdateQueryNode') {
      return this.handleUpdate(node, args);
    }

    return node;
  }

  transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
    return Promise.resolve(args.result);
  }

  private handleInsert(node: any, _args: PluginTransformQueryArgs): RootOperationNode {
    const now = new Date();

    // Add created_at and updated_at to the values being inserted
    if (node.values?.kind === 'ValuesNode') {
      const values = node.values.values.map((valueList: any) => {
        const newValues = [...valueList];

        // Check if created_at or updated_at are already set
        const hasCreatedAt = this.hasColumn(node, valueList, 'created_at');
        const hasUpdatedAt = this.hasColumn(node, valueList, 'updated_at');

        if (!hasCreatedAt) {
          newValues.push({
            kind: 'ValueNode',
            value: now,
          });
          // Also need to add column to the list
          if (!node.columns) {
            node.columns = [];
          }
        }

        if (!hasUpdatedAt) {
          newValues.push({
            kind: 'ValueNode',
            value: now,
          });
        }

        return newValues;
      });

      return {
        ...node,
        values: {
          ...node.values,
          values,
        },
      };
    }

    return node;
  }

  private handleUpdate(node: any, _args: PluginTransformQueryArgs): RootOperationNode {
    const now = new Date();

    // Add updated_at to the update assignments
    const updates = node.updates || [];
    const hasUpdatedAt = updates.some((update: any) =>
      update.column?.column?.name === 'updated_at',
    );

    if (!hasUpdatedAt) {
      return {
        ...node,
        updates: [
          ...updates,
          {
            kind: 'ColumnUpdateNode',
            column: {
              kind: 'ColumnNode',
              column: {
                kind: 'IdentifierNode',
                name: 'updated_at',
              },
            },
            value: {
              kind: 'ValueNode',
              value: now,
            },
          },
        ],
      };
    }

    return node;
  }

  private hasColumn(node: any, valueList: any, columnName: string): boolean {
    if (!node.columns)
      return false;
    return node.columns.some((col: any) => col.column?.name === columnName);
  }
}
