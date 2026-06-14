import { drizzle } from 'drizzle-orm/postgres-js';
import postgres     from 'postgres';
import * as schema  from './schema';

const globalForDb = global as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>>;
};

function createDb() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      '[ShipNexus] DATABASE_URL environment variable is not set. ' +
      'Add it to apps/web/.env.local before starting the dev server.',
    );
  }

  const client = postgres(url, { max: 5 });
  return drizzle(client, { schema });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}