import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { sequelize } from '../models/index.js';

/**
 * Monitoring and Logging Manager
 * Provides comprehensive system monitoring and logging capabilities
 */
class MonitoringManager {
  
  constructor() {
    this.logPath = process.env.LOG_PATH || './logs';
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      activeConnections: 0,
      startTime: Date.now()
    };
    this.initialize();
  }

  /**
   * Initialize monitoring system
   */
  async initialize() {
    try {
      // Create logs directory
      await fs.ensureDir(this.logPath);
      
      // Start periodic monitoring
      this.startPeriodicMonitoring();
      
      console.log('✅ Monitoring system initialized');
    } catch (error) {
      console.error('❌ Failed to initialize monitoring:', error.message);
    }
  }

  /**
   * Log application events
   * @param {string} level - Log level (info, warn, error, debug)
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata
   */
  async log(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      pid: process.pid,
      memory: process.memoryUsage(),
      ...metadata
    };

    try {
      // Write to daily log file
      const logFile = path.join(this.logPath, `app_${timestamp.split('T')[0]}.log`);
      await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
      
      // Also log to console based on level
      const consoleMethod = {
        'ERROR': 'error',
        'WARN': 'warn',
        'INFO': 'log',
        'DEBUG': 'debug'
      }[level.toUpperCase()] || 'log';
      
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, metadata);
      
    } catch (error) {
      console.error('Failed to write log:', error.message);
    }
  }

  /**
   * Log API requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} responseTime - Response time in ms
   */
  async logRequest(req, res, responseTime) {
    this.metrics.requests++;
    this.metrics.responseTime.push(responseTime);
    
    // Keep only last 1000 response times
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
    }

    const logEntry = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      username: req.user?.username,
      requestId: req.id
    };

    await this.log('info', `${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`, logEntry);
  }

  /**
   * Log errors with context
   * @param {Error} error - Error object
   * @param {Object} req - Express request object
   * @param {Object} context - Additional context
   */
  async logError(error, req = null, context = {}) {
    this.metrics.errors++;

    const errorEntry = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      request: req ? {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query,
        userId: req.user?.id,
        username: req.user?.username,
        requestId: req.id
      } : null,
      ...context
    };

    await this.log('error', error.message, errorEntry);
  }

  /**
   * Get system metrics
   * @returns {Object} System metrics
   */
  getSystemMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    const avgResponseTime = this.metrics.responseTime.length > 0 
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length 
      : 0;

    return {
      uptime,
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0,
      averageResponseTime: Math.round(avgResponseTime),
      activeConnections: this.metrics.activeConnections,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg(),
        uptime: os.uptime()
      }
    };
  }

  /**
   * Get database metrics
   * @returns {Promise<Object>} Database metrics
   */
  async getDatabaseMetrics() {
    try {
      const startTime = Date.now();
      
      // Test database connection
      await sequelize.authenticate();
      const connectionTime = Date.now() - startTime;
      
      // Get connection pool status
      const pool = sequelize.connectionManager.pool;
      
      return {
        connected: true,
        connectionTime,
        pool: {
          size: pool.size,
          available: pool.available,
          using: pool.using,
          waiting: pool.waiting
        }
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Get comprehensive health status with enhanced checks
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    const systemMetrics = this.getSystemMetrics();
    const dbMetrics = await this.getDatabaseMetrics();

    // Enhanced health checks
    const checks = {
      database: dbMetrics.connected,
      errorRate: systemMetrics.errorRate < 5, // Less than 5% error rate
      responseTime: systemMetrics.averageResponseTime < 1000, // Less than 1 second average response
      memory: (systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) < 0.9, // Less than 90% heap usage
      cpu: (systemMetrics.cpu.user + systemMetrics.cpu.system) < 1000000000, // Less than 1 billion CPU ticks
      diskSpace: await this.checkDiskSpace(),
      databasePerformance: dbMetrics.connectionTime < 5000, // Less than 5 seconds connection time
      poolHealth: dbMetrics.pool?.available > 0, // Database pool has available connections
      uptime: systemMetrics.uptime > 60000 // System has been running for more than 1 minute
    };

    // Determine overall health with weighted scoring
    const criticalChecks = ['database', 'memory', 'errorRate'];
    const warningChecks = ['responseTime', 'cpu', 'diskSpace', 'databasePerformance', 'poolHealth'];

    const criticalScore = criticalChecks.filter(check => checks[check]).length / criticalChecks.length;
    const warningScore = warningChecks.filter(check => checks[check]).length / warningChecks.length;
    const overallScore = (criticalScore * 0.7) + (warningScore * 0.3);

    let status = 'healthy';
    if (overallScore < 0.5) status = 'critical';
    else if (overallScore < 0.8) status = 'warning';
    else if (overallScore < 1.0) status = 'degraded';

    // Log health status changes
    if (this.lastHealthStatus && this.lastHealthStatus !== status) {
      await this.log('warn', `Health status changed from ${this.lastHealthStatus} to ${status}`, {
        previousStatus: this.lastHealthStatus,
        newStatus: status,
        timestamp: new Date().toISOString()
      });
    }
    this.lastHealthStatus = status;

    return {
      status,
      score: Math.round(overallScore * 100),
      timestamp: new Date().toISOString(),
      system: systemMetrics,
      database: dbMetrics,
      checks,
      recommendations: this.getHealthRecommendations(checks)
    };
  }

  /**
   * Check disk space usage
   * @returns {Promise<boolean>} True if disk space is sufficient
   */
  async checkDiskSpace() {
    try {
      const stats = fs.statSync('.');
      const freeSpace = os.freemem();
      const totalSpace = os.totalmem();
      const usedPercentage = (totalSpace - freeSpace) / totalSpace;

      return usedPercentage < 0.9; // Less than 90% memory usage
    } catch (error) {
      return false;
    }
  }

  /**
   * Get health recommendations based on checks
   * @param {Object} checks - Health check results
   * @returns {Array} List of recommendations
   */
  getHealthRecommendations(checks) {
    const recommendations = [];

    if (!checks.database) {
      recommendations.push('Database connection is down - check database server');
    }
    if (!checks.memory) {
      recommendations.push('High memory usage - consider scaling or optimizing memory usage');
    }
    if (!checks.errorRate) {
      recommendations.push('High error rate detected - investigate recent errors');
    }
    if (!checks.responseTime) {
      recommendations.push('Slow response times - check for performance bottlenecks');
    }
    if (!checks.cpu) {
      recommendations.push('High CPU usage - investigate resource-intensive operations');
    }
    if (!checks.diskSpace) {
      recommendations.push('Low disk space - clean up logs or increase storage');
    }
    if (!checks.databasePerformance) {
      recommendations.push('Slow database performance - check database configuration and queries');
    }
    if (!checks.poolHealth) {
      recommendations.push('Database connection pool exhausted - increase pool size or check for connection leaks');
    }

    return recommendations;
  }

  /**
   * Start periodic monitoring tasks with alerting
   */
  startPeriodicMonitoring() {
    // Health check every 2 minutes
    setInterval(async () => {
      const healthStatus = await this.getHealthStatus();
      await this.log('info', 'Health check', { health: healthStatus });

      // Trigger alerts for unhealthy status
      if (healthStatus.status === 'critical') {
        await this.triggerAlert('CRITICAL_SYSTEM_STATUS', {
          status: healthStatus.status,
          score: healthStatus.score,
          failingChecks: Object.entries(healthStatus.checks)
            .filter(([check, passed]) => !passed)
            .map(([check]) => check),
          recommendations: healthStatus.recommendations
        });
      } else if (healthStatus.status === 'warning') {
        await this.triggerAlert('WARNING_SYSTEM_STATUS', {
          status: healthStatus.status,
          score: healthStatus.score,
          failingChecks: Object.entries(healthStatus.checks)
            .filter(([check, passed]) => !passed)
            .map(([check]) => check),
          recommendations: healthStatus.recommendations
        });
      }
    }, 2 * 60 * 1000);

    // Log system metrics every 5 minutes
    setInterval(async () => {
      const metrics = this.getSystemMetrics();
      await this.log('info', 'System metrics', { metrics });

      // Alert on high error rates
      if (metrics.errorRate > 10) {
        await this.triggerAlert('HIGH_ERROR_RATE', {
          errorRate: metrics.errorRate,
          errors: metrics.errors,
          requests: metrics.requests
        });
      }
    }, 5 * 60 * 1000);

    // Log database metrics every 10 minutes
    setInterval(async () => {
      const dbMetrics = await this.getDatabaseMetrics();
      await this.log('info', 'Database metrics', { database: dbMetrics });

      // Alert on database issues
      if (!dbMetrics.connected) {
        await this.triggerAlert('DATABASE_CONNECTION_LOST', {
          error: dbMetrics.error,
          timestamp: new Date().toISOString()
        });
      } else if (dbMetrics.pool?.waiting > 5) {
        await this.triggerAlert('DATABASE_POOL_EXHAUSTED', {
          pool: dbMetrics.pool,
          timestamp: new Date().toISOString()
        });
      }
    }, 10 * 60 * 1000);

    // Clean old logs daily
    setInterval(async () => {
      await this.cleanOldLogs();
    }, 24 * 60 * 60 * 1000);

    // Memory usage monitoring
    setInterval(async () => {
      const memUsage = process.memoryUsage();
      const memUsagePercent = memUsage.heapUsed / memUsage.heapTotal;

      if (memUsagePercent > 0.95) {
        await this.triggerAlert('CRITICAL_MEMORY_USAGE', {
          memoryUsage: memUsage,
          usagePercent: memUsagePercent,
          timestamp: new Date().toISOString()
        });
      } else if (memUsagePercent > 0.85) {
        await this.triggerAlert('HIGH_MEMORY_USAGE', {
          memoryUsage: memUsage,
          usagePercent: memUsagePercent,
          timestamp: new Date().toISOString()
        });
      }
    }, 30 * 1000); // Every 30 seconds

    console.log('⏰ Enhanced periodic monitoring tasks started with alerting');
  }

  /**
   * Trigger alert for system issues
   * @param {string} alertType - Type of alert
   * @param {Object} details - Alert details
   */
  async triggerAlert(alertType, details) {
    const alert = {
      type: alertType,
      timestamp: new Date().toISOString(),
      details,
      severity: this.getAlertSeverity(alertType),
      resolved: false
    };

    // Log the alert
    await this.log('error', `🚨 ALERT: ${alertType}`, alert);

    // In a real system, you would send notifications here
    // For now, we'll just log to console
    console.error(`🚨 SYSTEM ALERT: ${alertType}`, {
      severity: alert.severity,
      details: alert.details,
      timestamp: alert.timestamp
    });

    // Store alert for later retrieval
    if (!this.activeAlerts) this.activeAlerts = [];
    this.activeAlerts.push(alert);

    // Keep only last 100 alerts
    if (this.activeAlerts.length > 100) {
      this.activeAlerts = this.activeAlerts.slice(-100);
    }
  }

  /**
   * Get severity level for alert type
   * @param {string} alertType - Type of alert
   * @returns {string} Severity level
   */
  getAlertSeverity(alertType) {
    const criticalAlerts = [
      'CRITICAL_SYSTEM_STATUS',
      'DATABASE_CONNECTION_LOST',
      'CRITICAL_MEMORY_USAGE'
    ];

    const warningAlerts = [
      'WARNING_SYSTEM_STATUS',
      'HIGH_ERROR_RATE',
      'DATABASE_POOL_EXHAUSTED',
      'HIGH_MEMORY_USAGE'
    ];

    if (criticalAlerts.includes(alertType)) return 'critical';
    if (warningAlerts.includes(alertType)) return 'warning';
    return 'info';
  }

  /**
   * Get active alerts
   * @returns {Array} Active alerts
   */
  getActiveAlerts() {
    return this.activeAlerts || [];
  }

  /**
   * Resolve an alert
   * @param {string} alertType - Type of alert to resolve
   */
  async resolveAlert(alertType) {
    if (!this.activeAlerts) return;

    const alertIndex = this.activeAlerts.findIndex(alert => alert.type === alertType && !alert.resolved);
    if (alertIndex !== -1) {
      this.activeAlerts[alertIndex].resolved = true;
      this.activeAlerts[alertIndex].resolvedAt = new Date().toISOString();

      await this.log('info', `✅ Alert resolved: ${alertType}`, {
        alertType,
        resolvedAt: this.activeAlerts[alertIndex].resolvedAt
      });
    }
  }

  /**
   * Clean old log files
   * @param {number} retentionDays - Days to retain logs
   */
  async cleanOldLogs(retentionDays = 30) {
    try {
      const files = await fs.readdir(this.logPath);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.logPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && stats.birthtime < cutoffDate) {
          await fs.remove(filePath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        await this.log('info', `Cleaned ${deletedCount} old log files`);
      }
    } catch (error) {
      await this.log('error', 'Failed to clean old logs', { error: error.message });
    }
  }

  /**
   * Express middleware for request monitoring
   * @returns {Function} Express middleware
   */
  requestMonitoringMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Track active connections
      this.metrics.activeConnections++;
      
      // Override res.end to capture response time
      const originalEnd = res.end;
      res.end = (...args) => {
        const responseTime = Date.now() - startTime;
        this.metrics.activeConnections--;
        
        // Log the request
        this.logRequest(req, res, responseTime).catch(err => {
          console.error('Failed to log request:', err.message);
        });
        
        // Call original end method
        originalEnd.apply(res, args);
      };
      
      next();
    };
  }

  /**
   * Get log files list
   * @returns {Promise<Array>} List of log files
   */
  async getLogFiles() {
    try {
      const files = await fs.readdir(this.logPath);
      const logFiles = [];

      for (const file of files) {
        const filePath = path.join(this.logPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          logFiles.push({
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          });
        }
      }

      return logFiles.sort((a, b) => b.created - a.created);
    } catch (error) {
      throw new Error(`Failed to get log files: ${error.message}`);
    }
  }

  /**
   * Read log file content
   * @param {string} filename - Log file name
   * @param {number} lines - Number of lines to read from end
   * @returns {Promise<Array>} Log entries
   */
  async readLogFile(filename, lines = 100) {
    try {
      const filePath = path.join(this.logPath, filename);
      const content = await fs.readFile(filePath, 'utf8');
      const logLines = content.trim().split('\n');
      
      // Get last N lines
      const recentLines = logLines.slice(-lines);
      
      // Parse JSON log entries
      const entries = recentLines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { message: line, timestamp: null };
        }
      });

      return entries;
    } catch (error) {
      throw new Error(`Failed to read log file: ${error.message}`);
    }
  }
}

// Create singleton instance
const monitoringManager = new MonitoringManager();

export default monitoringManager;
