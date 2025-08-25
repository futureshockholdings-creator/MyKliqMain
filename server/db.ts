import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure neon for WebSocket support
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool for high-performance scaling
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: true,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20, // Maximum connections in pool
  min: 5,  // Minimum connections to maintain
});

// Add pool error handling for production resilience
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err);
});

pool.on('connect', () => {
  console.log('New database connection established');
});

export const db = drizzle({ client: pool, schema });