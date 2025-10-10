import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create the connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create the postgres client
const client = postgres(connectionString, {
  max: Number(process.env.DB_POOL_MAX ?? (process.env.NODE_ENV === 'production' ? 10 : 1)),
});

// Create the drizzle db instance
export const db = drizzle(client, { schema });

// Export the client for cleanup if needed
export { client };
