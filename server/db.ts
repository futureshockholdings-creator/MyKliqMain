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

// Optimized connection pooling for stability
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: true,
  connectionTimeoutMillis: 10000,    // Increased timeout to prevent connection errors
  idleTimeoutMillis: 30000,         // More conservative idle cleanup
  max: 25,                          // Reduced max connections for stability
  min: 5,                           // Lower minimum connections
  maxUses: 7500,                    // Conservative connection reuse
  allowExitOnIdle: false,           // Keep pool alive for performance
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

// High-performance monitoring with alerts
setInterval(() => {
  const memoryMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  const poolUsage = (pool.totalCount / 25) * 100; // Updated to match new max pool size
  
  if (memoryMB > 400 || poolUsage > 80) {
    console.warn(`🔥 HIGH LOAD: Pool: ${pool.totalCount}/25 (${poolUsage.toFixed(1)}%), Memory: ${memoryMB}MB`);
  }
  
  // Critical alerts
  if (memoryMB > 600 || poolUsage > 95) {
    console.error(`🚨 CRITICAL: Pool: ${pool.totalCount}/25 (${poolUsage.toFixed(1)}%), Memory: ${memoryMB}MB`);
  }
}, 60000); // Check every minute for high-load monitoring

// Graceful shutdown
process.on('SIGTERM', () => pool.end());
process.on('SIGINT', () => pool.end());

export const db = drizzle({ client: pool, schema });