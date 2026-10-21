import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const migrationNames = process.argv.slice(2);
if (!migrationNames.length) throw new Error('Pass at least one migration filename.');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');

const migrationRoot = path.resolve(process.cwd(), 'supabase', 'migrations');
const migrationPaths = migrationNames.map((name) => {
  const resolved = path.resolve(migrationRoot, name);
  if (path.dirname(resolved) !== migrationRoot || !resolved.endsWith('.sql')) throw new Error(`Invalid migration path: ${name}`);
  return resolved;
});

const connectionUrl = new URL(process.env.DATABASE_URL);
connectionUrl.searchParams.delete('sslmode');
connectionUrl.searchParams.delete('sslrootcert');
connectionUrl.searchParams.delete('uselibpqcompat');
const ca = readFileSync(path.join(process.cwd(), 'certs', 'supabase-prod-ca-2021.crt'), 'utf8');
const client = new pg.Client({ connectionString: connectionUrl.toString(), ssl: { ca, rejectUnauthorized: true } });

await client.connect();
try {
  await client.query('BEGIN');
  for (let index = 0; index < migrationPaths.length; index += 1) {
    await client.query(await readFile(migrationPaths[index], 'utf8'));
    console.log(`Applied ${migrationNames[index]}`);
  }
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
