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

// Production-optimized connection pooling for scalability
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: true,
  connectionTimeoutMillis: 3000,   // Faster timeout for better UX
  idleTimeoutMillis: 15000,        // Quick cleanup of idle connections
  max: 30,                         // Higher concurrency support
  min: 5,                          // Maintain warm connections
  maxUses: 7500,                   // Prevent memory leaks by rotating connections
  allowExitOnIdle: false,          // Keep pool alive for performance
});

// Production error handling with reduced logging
let connectionErrors = 0;
pool.on('error', (err) => {
  connectionErrors++;
  if (connectionErrors % 20 === 0) { // Log every 20th error to reduce noise
    console.error(`Database pool errors: ${connectionErrors}`);
  }
});

// Performance monitoring (production mode)
setInterval(() => {
  const memoryMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  if (memoryMB > 300 || pool.totalCount > 25) {
    console.log(`Pool: ${pool.totalCount}/30, Memory: ${memoryMB}MB`);
  }
}, 180000); // Check every 3 minutes

// Graceful shutdown
process.on('SIGTERM', () => pool.end());
process.on('SIGINT', () => pool.end());

export const db = drizzle({ client: pool, schema });