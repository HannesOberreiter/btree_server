import {
  DatabaseMetadata,
  MysqlDialect,
  TypeScriptSerializer,
} from 'kysely-codegen';
import { describe, expect, it } from 'vitest';

const tinyint = 'ColumnType<boolean, boolean | number, boolean | number>';

describe('DB codegen compiler API compatibility', () => {
  it.each([false, true])(
    'imports ColumnType for the DB wrapper tinyint mapping (nullable: %s)',
    (isNullable) => {
      const metadata = new DatabaseMetadata({
        tables: [
          {
            name: 'flags',
            columns: [{ name: 'enabled', dataType: 'tinyint', isNullable }],
          },
        ],
      });
      const output = new TypeScriptSerializer().serializeFile(
        metadata,
        new MysqlDialect(),
        { typeMapping: { tinyint } },
      );

      expect(output).toContain('import type { ColumnType } from "kysely";');
      expect(output).toContain(
        `enabled: ${tinyint}${isNullable ? ' | null' : ''};`,
      );
      expect(output).toContain('flags: Flags;');
    },
  );
});
