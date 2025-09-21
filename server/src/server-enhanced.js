import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import services
import cacheService from './services/cacheService.js';
import realtimeService from './services/realtimeService.js';

// Import routes
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import financialRoutes from './routes/financial.js';
import salesRoutes from './routes/sales.js';
import settingsRoutes from './routes/settings.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Initialize services
await cacheService.connect();
realtimeService.initialize(server);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

const financialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: {
    success: false,
    message: 'Too many financial requests, please try again later.'
  }
});

app.use(limiter);
app.use('/api/auth', authLimiter);
app.use('/api/financial', financialLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const cacheStats = await cacheService.getStats();
  const realtimeStats = realtimeService.getHealthStatus();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cache: cacheStats,
    realtime: realtimeStats
  });
});

// Cache management endpoints
app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting cache statistics'
    });
  }
});

app.post('/api/cache/clear', async (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (pattern) {
      await cacheService.invalidatePattern(pattern);
      res.json({
        success: true,
        message: `Cache cleared for pattern: ${pattern}`
      });
    } else {
      await cacheService.flush();
      res.json({
        success: true,
        message: 'All cache cleared'
      });
    }
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cache'
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/settings', settingsRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close cache connection
  await cacheService.disconnect();
  
  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Close cache connection
  await cacheService.disconnect();
  
  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Enhanced server running on port ${PORT}`);
  logger.info(`📊 Cache service: ${cacheService.isConnected ? 'Connected' : 'Disconnected'}`);
  logger.info(`🔄 Realtime service: ${realtimeService.io ? 'Active' : 'Inactive'}`);
});

export default app;
