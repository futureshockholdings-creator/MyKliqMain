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

// Maximum scalability connection pooling
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: true,
  connectionTimeoutMillis: 2000,    // Ultra-fast timeout for maximum throughput
  idleTimeoutMillis: 10000,         // Aggressive idle cleanup for resource efficiency
  max: 75,                          // Massive concurrency support (3x increase)
  min: 15,                          // Higher minimum for instant availability
  maxUses: 15000,                   // Double connection reuse limit
  acquireTimeoutMillis: 1500,       // Quick connection acquisition
  createTimeoutMillis: 2000,        // Fast new connection creation
  destroyTimeoutMillis: 3000,       // Efficient cleanup
  createRetryIntervalMillis: 100,   // Rapid retry for high availability
  reapIntervalMillis: 500,          // Frequent idle connection cleanup
  allowExitOnIdle: false,           // Keep pool alive for maximum performance
  log: (message, level) => {
    if (level === 'error' || message.includes('timeout')) {
      console.error('[DB Pool Critical]', message);
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
  const poolUsage = (pool.totalCount / 75) * 100;
  
  if (memoryMB > 400 || poolUsage > 80) {
    console.warn(`🔥 HIGH LOAD: Pool: ${pool.totalCount}/75 (${poolUsage.toFixed(1)}%), Memory: ${memoryMB}MB`);
  }
  
  // Critical alerts
  if (memoryMB > 600 || poolUsage > 95) {
    console.error(`🚨 CRITICAL: Pool: ${pool.totalCount}/75 (${poolUsage.toFixed(1)}%), Memory: ${memoryMB}MB`);
  }
}, 60000); // Check every minute for high-load monitoring

// Graceful shutdown
process.on('SIGTERM', () => pool.end());
process.on('SIGINT', () => pool.end());

export const db = drizzle({ client: pool, schema });