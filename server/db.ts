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
  connectionTimeoutMillis: 5000,   // Reduced from 10s for faster failover
  idleTimeoutMillis: 20000,        // Reduced from 30s to free unused connections faster
  max: 25,                         // Increased for higher concurrent load
  min: 3,                          // Reduced minimum to save resources in low usage
  createTimeoutMillis: 8000,       // Timeout for creating connections
});

// Add pool error handling for production resilience
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err);
});

pool.on('connect', () => {
  console.log('New database connection established');
});

export const db = drizzle({ client: pool, schema });