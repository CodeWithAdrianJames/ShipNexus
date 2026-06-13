import { drizzle } from 'drizzle-orm/postgres-js';
import postgres     from 'postgres';
import * as schema  from './schema';

// Prevent connection pool exhaustion during Next.js hot reload in development.
// In production this global guard is a no-op since the module loads once.
const globalForDb = global as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>>;
};

function createDb() {
  const client = postgres(process.env.DATABASE_URL!, { max: 5 });
  return drizzle(client, { schema });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}