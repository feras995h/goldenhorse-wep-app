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
   * Get comprehensive health status
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    const systemMetrics = this.getSystemMetrics();
    const dbMetrics = await this.getDatabaseMetrics();
    
    // Determine overall health
    const isHealthy = 
      dbMetrics.connected &&
      systemMetrics.errorRate < 5 && // Less than 5% error rate
      systemMetrics.averageResponseTime < 1000 && // Less than 1 second average response
      (systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) < 0.9; // Less than 90% heap usage

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      system: systemMetrics,
      database: dbMetrics,
      checks: {
        database: dbMetrics.connected,
        errorRate: systemMetrics.errorRate < 5,
        responseTime: systemMetrics.averageResponseTime < 1000,
        memory: (systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) < 0.9
      }
    };
  }

  /**
   * Start periodic monitoring tasks
   */
  startPeriodicMonitoring() {
    // Log system metrics every 5 minutes
    setInterval(async () => {
      const metrics = this.getSystemMetrics();
      await this.log('info', 'System metrics', { metrics });
    }, 5 * 60 * 1000);

    // Log database metrics every 10 minutes
    setInterval(async () => {
      const dbMetrics = await this.getDatabaseMetrics();
      await this.log('info', 'Database metrics', { database: dbMetrics });
    }, 10 * 60 * 1000);

    // Clean old logs daily
    setInterval(async () => {
      await this.cleanOldLogs();
    }, 24 * 60 * 60 * 1000);

    console.log('⏰ Periodic monitoring tasks started');
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
