// Centralized scalability configuration for maximum performance
export const SCALABILITY_CONFIG = {
  // Database connection pool
  database: {
    maxConnections: 75,
    minConnections: 15,
    connectionTimeout: 2000,
    idleTimeout: 10000,
    maxConnectionReuse: 15000,
    acquireTimeout: 1500
  },

  // Redis caching
  redis: {
    connectTimeout: 3000,
    maxRetries: 5,
    retryDelay: 50,
    commandTimeout: 2000,
    maxQueueLength: 1000
  },

  // Memory management
  memory: {
    maxHeapSizeMB: 800,
    gcThresholdMB: 600,
    cacheSize: 5000,
    objectPoolSize: 200,
    stringCacheSize: 1000
  },

  // Rate limiting
  rateLimiting: {
    maxRequestsPerMinute: 150,
    maxQueuedRequests: 20,
    timeoutMs: 30000,
    burstLimit: 200
  },

  // Load balancing
  loadBalancing: {
    maxActiveConnections: 200,
    circuitBreakerThreshold: 0.95,
    healthCheckInterval: 5000,
    workerCount: 8
  },

  // Query optimization
  queries: {
    defaultPageSize: 20,
    maxPageSize: 50,
    batchSize: 100,
    indexHintTimeout: 1000
  },

  // Caching strategies
  caching: {
    feedCacheTTL: 120, // 2 minutes
    notificationCacheTTL: 60, // 1 minute
    userDataCacheTTL: 300, // 5 minutes
    staticContentTTL: 3600, // 1 hour
    redisTTL: 600 // 10 minutes
  },

  // Performance thresholds
  performance: {
    slowQueryThreshold: 1000, // 1 second
    criticalMemoryThreshold: 900, // 900MB
    warningMemoryThreshold: 500, // 500MB
    maxResponseTime: 2000, // 2 seconds
    targetResponseTime: 300 // 300ms
  }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  // Production optimizations
  SCALABILITY_CONFIG.database.maxConnections = 100;
  SCALABILITY_CONFIG.memory.maxHeapSizeMB = 1200;
  SCALABILITY_CONFIG.loadBalancing.workerCount = 12;
} else if (process.env.NODE_ENV === 'development') {
  // Development optimizations
  SCALABILITY_CONFIG.database.maxConnections = 20;
  SCALABILITY_CONFIG.memory.maxHeapSizeMB = 400;
  SCALABILITY_CONFIG.loadBalancing.workerCount = 2;
}

export default SCALABILITY_CONFIG;