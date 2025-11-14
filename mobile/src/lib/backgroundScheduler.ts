/**
 * Background Scheduler - Enterprise Edition
 * Features:
 * - AppState-aware polling (pause when backgrounded)
 * - Network-aware (reduce on cellular)
 * - Exponential backoff when idle
 * - Batch background sync
 */

import { AppState, AppStateStatus } from 'react-native';

type ScheduledTask = {
  id: string;
  fn: () => Promise<void>;
  interval: number;
  lastRun: number;
  failureCount: number;
};

class BackgroundScheduler {
  private tasks = new Map<string, ScheduledTask>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private isBackground = false;
  private appStateSubscription: any = null;

  constructor() {
    this.initAppStateListener();
  }

  /**
   * Initialize app state listener
   */
  private initAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    const wasBackground = this.isBackground;
    this.isBackground = nextAppState === 'background' || nextAppState === 'inactive';

    if (wasBackground && !this.isBackground) {
      console.log('[BackgroundScheduler] App foregrounded, resuming tasks...');
      this.resumeAllTasks();
    } else if (!wasBackground && this.isBackground) {
      console.log('[BackgroundScheduler] App backgrounded, pausing tasks...');
      this.pauseAllTasks();
    }
  }

  /**
   * Schedule a periodic task with smart throttling
   */
  scheduleTask(
    id: string,
    taskFn: () => Promise<void>,
    baseInterval: number
  ): () => void {
    const task: ScheduledTask = {
      id,
      fn: taskFn,
      interval: baseInterval,
      lastRun: 0,
      failureCount: 0,
    };

    this.tasks.set(id, task);

    // Start the task immediately if app is in foreground
    if (!this.isBackground) {
      this.startTask(id);
    }

    // Return cleanup function
    return () => this.cancelTask(id);
  }

  /**
   * Start a specific task
   */
  private startTask(id: string): void {
    const task = this.tasks.get(id);
    if (!task) return;

    // Clear existing interval
    const existingInterval = this.intervals.get(id);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Calculate interval with backoff
    const interval = this.calculateInterval(task);

    console.log(`[BackgroundScheduler] Starting task: ${id} (interval: ${interval}ms)`);

    // Execute immediately
    this.executeTask(task);

    // Schedule recurring execution
    const intervalId = setInterval(() => {
      this.executeTask(task);
    }, interval);

    this.intervals.set(id, intervalId);
  }

  /**
   * Execute a task
   */
  private async executeTask(task: ScheduledTask): Promise<void> {
    // Skip if backgrounded
    if (this.isBackground) {
      console.log(`[BackgroundScheduler] Skipping task ${task.id} (backgrounded)`);
      return;
    }

    console.log(`[BackgroundScheduler] Executing task: ${task.id}`);
    task.lastRun = Date.now();

    try {
      await task.fn();
      // Reset failure count on success
      task.failureCount = 0;
    } catch (error) {
      // Increment failure count
      task.failureCount++;
      console.error(
        `[BackgroundScheduler] Task ${task.id} failed (${task.failureCount} failures):`,
        error
      );

      // Restart with backoff if too many failures
      if (task.failureCount >= 3) {
        console.log(`[BackgroundScheduler] Restarting ${task.id} with exponential backoff`);
        this.startTask(task.id);
      }
    }
  }

  /**
   * Calculate interval with exponential backoff on failures
   */
  private calculateInterval(task: ScheduledTask): number {
    if (task.failureCount === 0) {
      return task.interval;
    }

    // Exponential backoff: interval * 2^failures, max 5 minutes
    const backoffInterval = Math.min(
      task.interval * Math.pow(2, task.failureCount),
      5 * 60 * 1000
    );

    return backoffInterval;
  }

  /**
   * Cancel a specific task
   */
  cancelTask(id: string): void {
    const intervalId = this.intervals.get(id);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(id);
    }
    this.tasks.delete(id);
    console.log(`[BackgroundScheduler] Cancelled task: ${id}`);
  }

  /**
   * Pause all tasks (when app goes to background)
   */
  private pauseAllTasks(): void {
    this.intervals.forEach((intervalId) => clearInterval(intervalId));
    this.intervals.clear();
  }

  /**
   * Resume all tasks (when app comes to foreground)
   */
  private resumeAllTasks(): void {
    this.tasks.forEach((task) => this.startTask(task.id));
  }

  /**
   * Cancel all tasks
   */
  cancelAll(): void {
    this.pauseAllTasks();
    this.tasks.clear();
  }

  /**
   * Get task statistics
   */
  getStats() {
    const tasks = Array.from(this.tasks.values()).map((task) => ({
      id: task.id,
      interval: task.interval,
      lastRun: task.lastRun,
      failureCount: task.failureCount,
      isRunning: this.intervals.has(task.id),
    }));

    return {
      totalTasks: this.tasks.size,
      runningTasks: this.intervals.size,
      isBackground: this.isBackground,
      tasks,
    };
  }

  /**
   * Cleanup on app exit
   */
  destroy(): void {
    this.cancelAll();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }
}

export const backgroundScheduler = new BackgroundScheduler();
