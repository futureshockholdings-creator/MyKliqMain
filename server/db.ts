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

// High-performance connection pooling optimized for 5000+ concurrent users
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: true,
  connectionTimeoutMillis: 15000,   // Higher timeout for heavy load
  idleTimeoutMillis: 60000,         // Longer idle time for connection reuse
  max: 50,                          // Increased max connections for 5000+ users
  min: 10,                          // Higher minimum for immediate availability
  maxUses: 10000,                   // Higher connection reuse for efficiency
  allowExitOnIdle: false,           // Keep pool alive for performance
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

// High-performance monitoring with scaling alerts
setInterval(() => {
  const memoryMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  const poolUsage = (pool.totalCount / 50) * 100; // Updated to match new max pool size
  
  if (memoryMB > 800 || poolUsage > 80) {
    console.warn(`🔥 HIGH LOAD: Pool: ${pool.totalCount}/50 (${poolUsage.toFixed(1)}%), Memory: ${memoryMB}MB`);
  }
  
  // Critical alerts for 5000+ user capacity
  if (memoryMB > 1200 || poolUsage > 95) {
    console.error(`🚨 CRITICAL: Pool: ${pool.totalCount}/50 (${poolUsage.toFixed(1)}%), Memory: ${memoryMB}MB`);
  }
}, 30000); // Check every 30 seconds for faster response under high load

// Graceful shutdown
process.on('SIGTERM', () => pool.end());
process.on('SIGINT', () => pool.end());

export const db = drizzle({ client: pool, schema });