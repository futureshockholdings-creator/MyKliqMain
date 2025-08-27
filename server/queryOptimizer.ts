// Advanced query optimization for maximum database performance
import { sql } from 'drizzle-orm';
import { db } from './db';
import { SCALABILITY_CONFIG } from './scalabilityConfig';

interface QueryMetrics {
  query: string;
  executionTime: number;
  rowsAffected: number;
  timestamp: number;
  fromCache: boolean;
}

class QueryOptimizer {
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private queryMetrics: QueryMetrics[] = [];
  private slowQueries = new Set<string>();

  // Query result caching with TTL
  async cachedQuery<T>(
    cacheKey: string, 
    queryFn: () => Promise<T>, 
    ttlMs = 60000
  ): Promise<T> {
    const cached = this.queryCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      this.recordQueryMetric(cacheKey, 0, 0, true);
      return cached.data;
    }

    const startTime = Date.now();
    const result = await queryFn();
    const executionTime = Date.now() - startTime;

    // Cache successful queries
    this.queryCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl: ttlMs
    });

    this.recordQueryMetric(cacheKey, executionTime, Array.isArray(result) ? result.length : 1, false);

    // Track slow queries
    if (executionTime > SCALABILITY_CONFIG.performance.slowQueryThreshold) {
      this.slowQueries.add(cacheKey);
    }

    return result;
  }

  // Batch query execution for N+1 prevention
  async batchQuery<T>(
    queries: Array<() => Promise<T>>
  ): Promise<T[]> {
    const startTime = Date.now();
    const results = await Promise.all(queries.map(query => query()));
    const executionTime = Date.now() - startTime;

    this.recordQueryMetric('batch_query', executionTime, results.length, false);
    return results;
  }

  // Optimized pagination with cursor-based approach
  async paginatedQuery<T>(
    baseQuery: any,
    cursor: any = null,
    limit = 20
  ): Promise<{ data: T[]; nextCursor: any; hasMore: boolean }> {
    const actualLimit = Math.min(limit, SCALABILITY_CONFIG.queries.maxPageSize);
    
    let query = baseQuery.limit(actualLimit + 1); // +1 to check if there are more records
    
    if (cursor) {
      query = query.where(sql`id > ${cursor}`);
    }

    const results = await query;
    const hasMore = results.length > actualLimit;
    
    if (hasMore) {
      results.pop(); // Remove the extra record
    }

    const nextCursor = results.length > 0 ? results[results.length - 1].id : null;

    return {
      data: results,
      nextCursor,
      hasMore
    };
  }

  // Query hints for better performance
  async queryWithHints<T>(
    query: any,
    hints: string[] = []
  ): Promise<T> {
    const startTime = Date.now();
    
    // Add query hints for better performance
    const hintedQuery = hints.length > 0 
      ? query.with(sql.raw(`/* ${hints.join(', ')} */`))
      : query;

    const result = await hintedQuery;
    const executionTime = Date.now() - startTime;

    this.recordQueryMetric(
      `hinted_query_${hints.join('_')}`, 
      executionTime, 
      Array.isArray(result) ? result.length : 1, 
      false
    );

    return result;
  }

  // Connection pooling optimization
  async withTransaction<T>(
    callback: (tx: any) => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    const result = await db.transaction(async (tx) => {
      return await callback(tx);
    });

    const executionTime = Date.now() - startTime;
    this.recordQueryMetric('transaction', executionTime, 1, false);

    return result;
  }

  // Query analysis and optimization suggestions
  getOptimizationReport(): {
    totalQueries: number;
    averageExecutionTime: number;
    cacheHitRate: number;
    slowQueries: string[];
    recommendations: string[];
  } {
    const totalQueries = this.queryMetrics.length;
    const cachedQueries = this.queryMetrics.filter(m => m.fromCache).length;
    const totalExecutionTime = this.queryMetrics
      .filter(m => !m.fromCache)
      .reduce((sum, m) => sum + m.executionTime, 0);
    const nonCachedQueries = totalQueries - cachedQueries;

    const recommendations = [];

    if (this.slowQueries.size > 0) {
      recommendations.push(`Optimize ${this.slowQueries.size} slow queries`);
    }

    if (cachedQueries / totalQueries < 0.5) {
      recommendations.push('Increase query caching to improve performance');
    }

    if (nonCachedQueries > 0 && totalExecutionTime / nonCachedQueries > 500) {
      recommendations.push('Consider adding database indexes for better performance');
    }

    return {
      totalQueries,
      averageExecutionTime: nonCachedQueries > 0 ? Math.round(totalExecutionTime / nonCachedQueries) : 0,
      cacheHitRate: Math.round((cachedQueries / totalQueries) * 100) / 100,
      slowQueries: Array.from(this.slowQueries),
      recommendations
    };
  }

  // Clear cache periodically
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.queryCache.delete(key);
      }
    }
  }

  // Force clear all caches
  clearAllCaches(): void {
    this.queryCache.clear();
  }

  private recordQueryMetric(
    query: string, 
    executionTime: number, 
    rowsAffected: number, 
    fromCache: boolean
  ): void {
    this.queryMetrics.push({
      query,
      executionTime,
      rowsAffected,
      timestamp: Date.now(),
      fromCache
    });

    // Keep only last 1000 metrics to prevent memory leak
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics.shift();
    }
  }
}

export const queryOptimizer = new QueryOptimizer();

// Clear expired cache every 5 minutes
setInterval(() => {
  queryOptimizer.clearExpiredCache();
}, 5 * 60 * 1000);

// Export commonly used optimized query patterns
export const OptimizedQueries = {
  // Cached user lookup
  getUserById: (userId: string) => 
    queryOptimizer.cachedQuery(`user_${userId}`, () => 
      db.query.users.findFirst({ where: (users, { eq }) => eq(users.id, userId) })
    ),

  // Batched friend fetching
  getFriendsBatch: (userIds: string[]) => 
    queryOptimizer.batchQuery(
      userIds.map(id => () => db.query.users.findFirst({ 
        where: (users, { eq }) => eq(users.id, id) 
      }))
    ),

  // Optimized feed pagination
  getPaginatedFeed: (cursor: any, limit: number) => 
    queryOptimizer.paginatedQuery(
      db.query.posts.findMany({
        orderBy: (posts, { desc }) => desc(posts.createdAt),
        with: { author: true }
      }),
      cursor,
      limit
    )
};