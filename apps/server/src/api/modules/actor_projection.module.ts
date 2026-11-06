import { sql } from 'kysely';

export type ActorProjection = {
  id: number;
  email: string | null;
  username: string | null;
};

type ActorTableAlias = 'creator' | 'editor' | 'creators' | 'editors';
type ActorOutputAlias = 'creator' | 'editor';

export function actorProjection(
  tableAlias: ActorTableAlias,
  outputAlias: ActorOutputAlias = tableAlias === 'creators'
    ? 'creator'
    : tableAlias === 'editors'
      ? 'editor'
      : tableAlias,
) {
  return sql<ActorProjection | null>`
    CASE WHEN ${sql.ref(`${tableAlias}.id`)} IS NOT NULL THEN JSON_OBJECT(
      'id', ${sql.ref(`${tableAlias}.id`)},
      'email', ${sql.ref(`${tableAlias}.email`)},
      'username', ${sql.ref(`${tableAlias}.username`)}
    ) ELSE NULL END
  `.as(outputAlias);
}
