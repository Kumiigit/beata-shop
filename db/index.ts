import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function getD1(): D1Database {
  const database = (env as unknown as { DB?: D1Database }).DB;
  if (!database) throw new Error('Cloudflare D1 binding `DB` is unavailable.');
  return database;
}

export function getDb() { return drizzle(getD1(), { schema }); }
