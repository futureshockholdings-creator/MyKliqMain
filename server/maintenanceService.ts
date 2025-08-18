import { db } from "./db";
import { sql } from "drizzle-orm";
import { sessions, notifications, stories, polls, events, posts, users } from "@shared/schema";
import { lt, and, lte } from "drizzle-orm";

export interface MaintenanceMetrics {
  database: {
    totalUsers: number;
    activeSessions: number;
    totalPosts: number;
    activePolls: number;
    upcomingEvents: number;
    storageUsage: number;
    queryPerformance: number;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    memoryUsage: number;
    cacheHitRate: number;
  };
  cleanup: {
    expiredSessions: number;
    oldNotifications: number;
    expiredStories: number;
    completedPolls: number;
    pastEvents: number;
  };
  lastMaintenance: {
    sessionCleanup: Date | null;
    notificationCleanup: Date | null;
    storyCleanup: Date | null;
    databaseOptimization: Date | null;
  };
}

class MaintenanceService {
  private metrics: MaintenanceMetrics = {
    database: {
      totalUsers: 0,
      activeSessions: 0,
      totalPosts: 0,
      activePolls: 0,
      upcomingEvents: 0,
      storageUsage: 0,
      queryPerformance: 0,
    },
    performance: {
      avgResponseTime: 0,
      errorRate: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
    },
    cleanup: {
      expiredSessions: 0,
      oldNotifications: 0,
      expiredStories: 0,
      completedPolls: 0,
      pastEvents: 0,
    },
    lastMaintenance: {
      sessionCleanup: null,
      notificationCleanup: null,
      storyCleanup: null,
      databaseOptimization: null,
    },
  };

  private performanceLog: Array<{
    timestamp: Date;
    responseTime: number;
    endpoint: string;
    success: boolean;
  }> = [];

  async getMetrics(): Promise<MaintenanceMetrics> {
    await this.updateDatabaseMetrics();
    await this.updatePerformanceMetrics();
    await this.updateCleanupMetrics();
    return this.metrics;
  }

  private async updateDatabaseMetrics() {
    try {
      // Count total users
      const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
      this.metrics.database.totalUsers = userCount[0]?.count || 0;

      // Count active sessions (not expired)
      const sessionCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(sessions)
        .where(sql`expire > NOW()`);
      this.metrics.database.activeSessions = sessionCount[0]?.count || 0;

      // Count total posts
      const postCount = await db.select({ count: sql<number>`count(*)` }).from(posts);
      this.metrics.database.totalPosts = postCount[0]?.count || 0;

      // Count active polls
      const activePolls = await db
        .select({ count: sql<number>`count(*)` })
        .from(polls)
        .where(sql`expires_at > NOW()`);
      this.metrics.database.activePolls = activePolls[0]?.count || 0;

      // Count upcoming events
      const upcomingEvents = await db
        .select({ count: sql<number>`count(*)` })
        .from(events)
        .where(sql`date_time > NOW()`);
      this.metrics.database.upcomingEvents = upcomingEvents[0]?.count || 0;

      // Estimate query performance (average from recent performance log)
      const recentQueries = this.performanceLog.slice(-100);
      this.metrics.database.queryPerformance = 
        recentQueries.length > 0 
          ? recentQueries.reduce((sum, log) => sum + log.responseTime, 0) / recentQueries.length 
          : 0;

    } catch (error) {
      console.error("Error updating database metrics:", error);
    }
  }

  private async updatePerformanceMetrics() {
    const recentLogs = this.performanceLog.filter(
      log => Date.now() - log.timestamp.getTime() < 3600000 // Last hour
    );

    if (recentLogs.length > 0) {
      this.metrics.performance.avgResponseTime = 
        recentLogs.reduce((sum, log) => sum + log.responseTime, 0) / recentLogs.length;
      
      this.metrics.performance.errorRate = 
        (recentLogs.filter(log => !log.success).length / recentLogs.length) * 100;
    }

    // Memory usage (Node.js process memory)
    const memUsage = process.memoryUsage();
    this.metrics.performance.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024); // MB
  }

  private async updateCleanupMetrics() {
    try {
      // Count expired sessions
      const expiredSessions = await db
        .select({ count: sql<number>`count(*)` })
        .from(sessions)
        .where(sql`expire < NOW()`);
      this.metrics.cleanup.expiredSessions = expiredSessions[0]?.count || 0;

      // Count old notifications (30+ days)
      const oldNotifications = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(sql`created_at < NOW() - INTERVAL '30 days'`);
      this.metrics.cleanup.oldNotifications = oldNotifications[0]?.count || 0;

      // Count expired stories
      const expiredStories = await db
        .select({ count: sql<number>`count(*)` })
        .from(stories)
        .where(sql`created_at < NOW() - INTERVAL '24 hours'`);
      this.metrics.cleanup.expiredStories = expiredStories[0]?.count || 0;

      // Count completed polls
      const completedPolls = await db
        .select({ count: sql<number>`count(*)` })
        .from(polls)
        .where(sql`expires_at < NOW()`);
      this.metrics.cleanup.completedPolls = completedPolls[0]?.count || 0;

      // Count past events
      const pastEvents = await db
        .select({ count: sql<number>`count(*)` })
        .from(events)
        .where(sql`date_time < NOW()`);
      this.metrics.cleanup.pastEvents = pastEvents[0]?.count || 0;

    } catch (error) {
      console.error("Error updating cleanup metrics:", error);
    }
  }

  logRequest(endpoint: string, responseTime: number, success: boolean) {
    this.performanceLog.push({
      timestamp: new Date(),
      endpoint,
      responseTime,
      success,
    });

    // Keep only last 1000 logs
    if (this.performanceLog.length > 1000) {
      this.performanceLog = this.performanceLog.slice(-1000);
    }
  }

  async performDailyMaintenance(): Promise<void> {
    console.log("Starting daily maintenance tasks...");

    try {
      // Clean expired sessions
      await this.cleanExpiredSessions();
      
      // Clean old stories
      await this.cleanExpiredStories();
      
      // Update last maintenance timestamps
      this.metrics.lastMaintenance.sessionCleanup = new Date();
      this.metrics.lastMaintenance.storyCleanup = new Date();

      console.log("Daily maintenance completed successfully");
    } catch (error) {
      console.error("Error during daily maintenance:", error);
    }
  }

  async performWeeklyMaintenance(): Promise<void> {
    console.log("Starting weekly maintenance tasks...");

    try {
      // Clean old notifications
      await this.cleanOldNotifications();
      
      // Archive completed polls
      await this.archiveCompletedPolls();
      
      // Update last maintenance timestamps
      this.metrics.lastMaintenance.notificationCleanup = new Date();
      this.metrics.lastMaintenance.databaseOptimization = new Date();

      console.log("Weekly maintenance completed successfully");
    } catch (error) {
      console.error("Error during weekly maintenance:", error);
    }
  }

  private async cleanExpiredSessions(): Promise<void> {
    const result = await db
      .delete(sessions)
      .where(sql`expire < NOW()`);
    console.log(`Cleaned expired sessions: ${result.rowCount || 0}`);
  }

  private async cleanExpiredStories(): Promise<void> {
    const result = await db
      .delete(stories)
      .where(sql`created_at < NOW() - INTERVAL '24 hours'`);
    console.log(`Cleaned expired stories: ${result.rowCount || 0}`);
  }

  private async cleanOldNotifications(): Promise<void> {
    const result = await db
      .delete(notifications)
      .where(and(
        sql`created_at < NOW() - INTERVAL '30 days'`,
        sql`is_read = true`
      ));
    console.log(`Cleaned old notifications: ${result.rowCount || 0}`);
  }

  private async archiveCompletedPolls(): Promise<void> {
    // For now, just log completed polls - can implement archiving later
    const completedPolls = await db
      .select({ count: sql<number>`count(*)` })
      .from(polls)
      .where(sql`expires_at < NOW() - INTERVAL '7 days'`);
    console.log(`Found ${completedPolls[0]?.count || 0} polls ready for archiving`);
  }

  getHealthStatus(): { status: 'healthy' | 'warning' | 'critical'; issues: string[] } {
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check database metrics
    if (this.metrics.database.queryPerformance > 1000) {
      issues.push("Slow database queries detected");
      status = 'warning';
    }

    // Check performance metrics
    if (this.metrics.performance.errorRate > 5) {
      issues.push("High error rate detected");
      status = 'critical';
    }

    if (this.metrics.performance.avgResponseTime > 2000) {
      issues.push("Slow response times detected");
      status = status === 'critical' ? 'critical' : 'warning';
    }

    if (this.metrics.performance.memoryUsage > 500) {
      issues.push("High memory usage detected");
      status = status === 'critical' ? 'critical' : 'warning';
    }

    // Check cleanup needs
    if (this.metrics.cleanup.expiredSessions > 100) {
      issues.push("Many expired sessions need cleanup");
      status = status === 'critical' ? 'critical' : 'warning';
    }

    if (this.metrics.cleanup.oldNotifications > 1000) {
      issues.push("Many old notifications need cleanup");
      status = status === 'critical' ? 'critical' : 'warning';
    }

    return { status, issues };
  }
}

export const maintenanceService = new MaintenanceService();

// Schedule maintenance tasks
const DAILY_MAINTENANCE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const WEEKLY_MAINTENANCE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

// Run daily maintenance at 2 AM
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 2 && now.getMinutes() === 0) {
    maintenanceService.performDailyMaintenance();
  }
}, 60000); // Check every minute

// Run weekly maintenance on Sundays at 3 AM
setInterval(() => {
  const now = new Date();
  if (now.getDay() === 0 && now.getHours() === 3 && now.getMinutes() === 0) {
    maintenanceService.performWeeklyMaintenance();
  }
}, 60000); // Check every minute