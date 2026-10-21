import pg from 'pg';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const { Pool } = pg;
type Row = pg.QueryResultRow;
type DatabasePool = InstanceType<typeof Pool>;

declare global {
  var beataDatabasePool: DatabasePool | undefined;
}

function connectionString() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL is not configured.');
  const url = new URL(value);
  url.searchParams.delete('sslmode');
  url.searchParams.delete('sslrootcert');
  url.searchParams.delete('uselibpqcompat');
  return url.toString();
}

function databaseSsl() {
  const ca = readFileSync(join(process.cwd(), 'certs', 'supabase-prod-ca-2021.crt'), 'utf8');
  return { ca, rejectUnauthorized: true };
}

function pool() {
  if (!globalThis.beataDatabasePool) {
    globalThis.beataDatabasePool = new Pool({
      connectionString: connectionString(),
      ssl: databaseSsl(),
      max: 3,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    });
  }
  return globalThis.beataDatabasePool;
}

export function getDatabase() {
  const databasePool = pool();
  async function sql<T extends Row = Row>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> {
    const text = strings.reduce((query, part, index) => query + part + (index < values.length ? `$${index + 1}` : ''), '');
    const result = await databasePool.query<T>(text, values);
    return result.rows;
  }
  return { pool: databasePool, sql };
}
