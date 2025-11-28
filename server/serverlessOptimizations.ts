import { db } from "./db";
import { sql } from "drizzle-orm";

const isServerless = process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AMPLIFY_APP_ID;

export async function warmupDatabase(): Promise<void> {
  if (!isServerless) return;
  
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    const duration = Date.now() - start;
    console.log(`Database warmup completed in ${duration}ms`);
  } catch (error) {
    console.error('Database warmup failed:', error);
  }
}

export function shouldRunScheduledTasks(): boolean {
  return !isServerless;
}

export function getPollingInterval(): number {
  if (isServerless) {
    return 60000;
  }
  return 30000;
}

export function getDbPoolSettings() {
  if (isServerless) {
    return {
      max: 10,
      min: 1,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    };
  }
  return {
    max: 50,
    min: 10,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 60000,
  };
}
