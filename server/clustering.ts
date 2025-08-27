// Horizontal scaling and clustering support for maximum scalability
import cluster from 'cluster';
import os from 'os';
import { EventEmitter } from 'events';

interface ClusterMetrics {
  workerId: number;
  pid: number;
  memoryUsage: number;
  cpuUsage: number;
  requestCount: number;
  uptime: number;
  status: 'healthy' | 'warning' | 'critical';
}

class ClusterManager extends EventEmitter {
  private workers: Map<number, ClusterMetrics> = new Map();
  private totalRequests = 0;
  private startTime = Date.now();

  // Initialize cluster with optimal worker count
  initializeCluster(workerCount?: number): void {
    if (!cluster.isPrimary) return;

    const numWorkers = workerCount || Math.min(os.cpus().length, 8); // Max 8 workers
    
    console.log(`🚀 Starting cluster with ${numWorkers} workers`);

    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
      this.forkWorker();
    }

    // Handle worker events
    cluster.on('exit', (worker, code, signal) => {
      console.warn(`💀 Worker ${worker.process.pid} died (${signal || code})`);
      this.workers.delete(worker.id);
      
      // Respawn worker if not intentional shutdown
      if (!worker.exitedAfterDisconnect) {
        console.log('🔄 Spawning new worker...');
        setTimeout(() => this.forkWorker(), 1000);
      }
    });

    // Monitor workers periodically
    setInterval(() => this.monitorWorkers(), 30000); // Every 30 seconds

    // Graceful shutdown handling
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
  }

  private forkWorker(): void {
    const worker = cluster.fork();
    
    worker.on('message', (msg) => {
      if (msg.type === 'metrics') {
        this.updateWorkerMetrics(worker.id, msg.data);
      }
    });

    console.log(`✅ Worker ${worker.process.pid} started`);
  }

  private updateWorkerMetrics(workerId: number, metrics: Partial<ClusterMetrics>): void {
    const existing = this.workers.get(workerId) || {
      workerId,
      pid: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      requestCount: 0,
      uptime: 0,
      status: 'healthy' as const
    };

    this.workers.set(workerId, { ...existing, ...metrics });
  }

  private monitorWorkers(): void {
    const workers = Array.from(this.workers.values());
    const totalMemory = workers.reduce((sum, w) => sum + w.memoryUsage, 0);
    const averageMemory = totalMemory / workers.length || 0;

    console.log(`📊 Cluster Status: ${workers.length} workers, ${totalMemory}MB total, ${averageMemory.toFixed(1)}MB avg`);

    // Check for unhealthy workers
    workers.forEach(worker => {
      if (worker.memoryUsage > 800 || worker.status === 'critical') {
        console.warn(`⚠️ Unhealthy worker ${worker.workerId}: ${worker.memoryUsage}MB memory`);
        this.restartWorker(worker.workerId);
      }
    });
  }

  private restartWorker(workerId: number): void {
    const worker = cluster.workers?.[workerId];
    if (worker) {
      console.log(`🔄 Restarting worker ${workerId}...`);
      worker.disconnect();
      setTimeout(() => worker.kill(), 5000); // Force kill after 5s
    }
  }

  private gracefulShutdown(): void {
    console.log('🛑 Initiating graceful shutdown...');
    
    const workers = Object.values(cluster.workers || {});
    let shutdownCount = 0;

    workers.forEach(worker => {
      if (worker) {
        worker.disconnect();
        worker.on('disconnect', () => {
          shutdownCount++;
          if (shutdownCount === workers.length) {
            process.exit(0);
          }
        });
      }
    });

    // Force shutdown after 15 seconds
    setTimeout(() => {
      console.log('⏰ Force shutdown timeout');
      process.exit(1);
    }, 15000);
  }

  getClusterMetrics(): {
    totalWorkers: number;
    totalRequests: number;
    uptime: number;
    workers: ClusterMetrics[];
  } {
    return {
      totalWorkers: this.workers.size,
      totalRequests: this.totalRequests,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      workers: Array.from(this.workers.values())
    };
  }
}

export const clusterManager = new ClusterManager();

// Worker process utilities
export function sendWorkerMetrics(): void {
  if (cluster.isWorker && process.send) {
    const memUsage = process.memoryUsage();
    const metrics: Partial<ClusterMetrics> = {
      workerId: cluster.worker?.id || 0,
      pid: process.pid,
      memoryUsage: Math.round(memUsage.heapUsed / 1024 / 1024),
      uptime: Math.floor(process.uptime())
    };

    process.send({ type: 'metrics', data: metrics });
  }
}

// Enable clustering in production
export function enableClustering(): void {
  if (process.env.NODE_ENV === 'production' && cluster.isPrimary) {
    clusterManager.initializeCluster();
    return;
  }
}

// Send metrics from worker every 30 seconds
if (cluster.isWorker) {
  setInterval(sendWorkerMetrics, 30000);
}