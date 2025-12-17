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

// Connection pooling optimized for Neon serverless (autoscale cold starts)
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: true,
  connectionTimeoutMillis: 15000,   // Higher timeout for heavy load
  idleTimeoutMillis: 30000,         // Shorter idle time for serverless
  max: 5,                           // Neon serverless recommendation: keep very small
  min: 0,                           // Zero minimum to avoid cold start connection bursts
  maxUses: 10000,                   // Higher connection reuse for efficiency
  allowExitOnIdle: true,            // Allow pool to shrink when idle
  keepAlive: true,                  // Enable TCP keep-alive
  log: (message, level) => {
    if (level === 'error' || message.includes('timeout')) {
      console.error('[DB Pool]', message);
    }
  }
});

// Production error handling with reduced logging
let connectionErrors = 0;
pool.on('error', (err) => {
  connectionErrors++;
  if (connectionErrors % 20 === 0) { // Log every 20th error to reduce noise
    console.error(`Database pool errors: ${connectionErrors}`);
  }
});

// Monitoring with scaling alerts (optimized for Neon serverless)
setInterval(() => {
  const memoryMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  const poolUsage = (pool.totalCount / 5) * 100; // Match max pool size of 5
  
  if (memoryMB > 800 || poolUsage > 80) {
    console.warn(`🔥 HIGH LOAD: Pool: ${pool.totalCount}/5 (${poolUsage.toFixed(1)}%), Memory: ${memoryMB}MB`);
  }
  
  // Critical alerts
  if (memoryMB > 1200 || poolUsage > 95) {
    console.error(`🚨 CRITICAL: Pool: ${pool.totalCount}/5 (${poolUsage.toFixed(1)}%), Memory: ${memoryMB}MB`);
  }
}, 30000); // Check every 30 seconds

// Graceful shutdown
process.on('SIGTERM', () => pool.end());
process.on('SIGINT', () => pool.end());

export const db = drizzle({ client: pool, schema });