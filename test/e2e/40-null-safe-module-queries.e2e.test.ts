import type { CompiledQuery, KyselyPlugin, QueryResult } from 'kysely';
import {
  DummyDriver,
  Kysely,
  MysqlAdapter,
  MysqlIntrospector,
  MysqlQueryCompiler,
} from 'kysely';
import { describe, expect, it } from 'vitest';

import { listCharges } from '../../src/api/modules/charge.module.js';
import { listTodos } from '../../src/api/modules/todo.module.js';
import type { DB } from '../../src/types/db.types.js';

function captureQueries() {
  const queries: CompiledQuery[] = [];
  const counts = new WeakSet<QueryResult<unknown>>();
  class RecordingDriver extends DummyDriver {
    async acquireConnection() {
      const connection = await super.acquireConnection();
      return {
        async executeQuery<R>(query: CompiledQuery) {
          queries.push(query);
          const result = await connection.executeQuery<R>(query);
          if (/^select count\(/i.test(query.sql)) counts.add(result);
          return result;
        },
        streamQuery: connection.streamQuery.bind(connection),
      };
    }
  }
  const plugin: KyselyPlugin = {
    transformQuery: ({ node }) => node,
    async transformResult({ result }) {
      return counts.has(result) ? { rows: [{ total: 7, count: 7 }] } : result;
    },
  };
  const db = new Kysely<DB>({
    dialect: {
      createAdapter: () => new MysqlAdapter(),
      createDriver: () => new RecordingDriver(),
      createIntrospector: (database) => new MysqlIntrospector(database),
      createQueryCompiler: () => new MysqlQueryCompiler(),
    },
    plugins: [plugin],
  });
  return { db, queries };
}

// The dummy driver compiles the real builders without connecting to a database.
describe('null-safe module query construction', () => {
  it.each([undefined, '', '   ', ' honey '])(
    'keeps charge count filters and scope for search %j',
    async (q) => {
      const { db, queries } = captureQueries();
      try {
        const from = '2026-01-01T00:00:00.000Z';
        const to = '2026-12-31T00:00:00.000Z';
        const result = await listCharges(db, 42, {
          q,
          deleted: true,
          filters: JSON.stringify([
            { type_id: 3 },
            { bestbefore: { from, to } },
          ]),
        });
        expect(result).toEqual({ results: [], total: 7 });
        const count = queries.find((query) =>
          query.sql.startsWith('select count(*) as `total`'),
        );
        if (!count) throw new Error('Charge count query was not compiled');
        expect(count.sql).toContain('`charges`.`user_id` = ?');
        expect(count.sql).toContain('`charges`.`deleted` = ?');
        expect(count.sql).toContain('`charges`.`type_id` = ?');
        expect(count.sql).toContain('`charges`.`bestbefore` >= ?');
        expect(count.sql).toContain('`charges`.`bestbefore` <= ?');
        const parameters: unknown[] = [
          42,
          true,
          3,
          new Date(from),
          new Date(to),
        ];
        if (q?.trim()) {
          expect(count.sql).toContain('left join `charge_types`');
          expect(count.sql).toContain(
            '(`charge_types`.`name` like ? or `charges`.`name` like ? or `charges`.`charge` like ?)',
          );
          parameters.push(`%${q}%`, `%${q}%`, `%${q}%`);
        } else {
          expect(count.sql).not.toContain('join');
          expect(count.sql).not.toContain('like');
        }
        expect(count.parameters).toEqual(parameters);
      } finally {
        await db.destroy();
      }
    },
  );

  it.each([undefined, null, false, true])(
    'preserves optional done filter %j and apiary ID zero',
    async (done) => {
      const { db, queries } = captureQueries();
      try {
        const result = await listTodos(
          db,
          { companyId: 42, beeId: 9, isLlm: false },
          { done, apiary_id: 0 },
        );
        expect(result).toEqual({ results: [], total: 7 });
        expect(queries).toHaveLength(2);
        for (const query of queries) {
          expect(query.sql).toContain('`todos`.`user_id` = ?');
          expect(query.sql).toContain(
            '(`todos`.`apiary_id` is null or `apiaries`.`deleted` = ?)',
          );
          expect(query.sql).toContain('`todos`.`apiary_id` = ?');
          const parameters: unknown[] = [42, false];
          if (done !== undefined && done !== null) {
            expect(query.sql).toContain('`todos`.`done` = ?');
            parameters.push(done);
          } else {
            expect(query.sql).not.toContain('`todos`.`done` = ?');
          }
          parameters.push(0);
          expect(query.parameters.slice(0, parameters.length)).toEqual(
            parameters,
          );
        }
      } finally {
        await db.destroy();
      }
    },
  );
});
