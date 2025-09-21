import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import services (optional - will work without them)
let cacheService, realtimeService;
try {
  cacheService = (await import('./services/cacheService.js')).default;
  realtimeService = (await import('./services/realtimeService.js')).default;
} catch (error) {
  console.log('⚠️ Enhanced services not available - running in basic mode');
}

// Import routes
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import financialRoutes from './routes/financial.js';
import salesRoutes from './routes/sales.js';
import settingsRoutes from './routes/settings.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Initialize enhanced services if available
if (cacheService) {
  try {
    await cacheService.connect();
    console.log('✅ Cache service connected');
  } catch (error) {
    console.log('⚠️ Cache service not available:', error.message);
  }
}

if (realtimeService) {
  try {
    realtimeService.initialize(server);
    console.log('✅ Realtime service initialized');
  } catch (error) {
    console.log('⚠️ Realtime service not available:', error.message);
  }
}

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
  origin: process.env.CORS_ORIGIN || process.env.CLIENT_URL || "http://localhost:3000",
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
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      cache: cacheService ? (cacheService.isConnected ? 'connected' : 'disconnected') : 'not available',
      realtime: realtimeService ? (realtimeService.io ? 'active' : 'inactive') : 'not available'
    }
  };

  if (cacheService) {
    try {
      const cacheStats = await cacheService.getStats();
      healthData.cacheStats = cacheStats;
    } catch (error) {
      healthData.cacheStats = { error: error.message };
    }
  }

  if (realtimeService) {
    try {
      const realtimeStats = realtimeService.getHealthStatus();
      healthData.realtimeStats = realtimeStats;
    } catch (error) {
      healthData.realtimeStats = { error: error.message };
    }
  }

  res.json(healthData);
});

// Cache management endpoints (if cache service is available)
if (cacheService) {
  app.get('/api/cache/stats', async (req, res) => {
    try {
      const stats = await cacheService.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting cache stats:', error);
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
      console.error('Error clearing cache:', error);
      res.status(500).json({
        success: false,
        message: 'Error clearing cache'
      });
    }
  });
}

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
  console.log('SIGTERM received, shutting down gracefully');
  
  if (cacheService) {
    await cacheService.disconnect();
  }
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  
  if (cacheService) {
    await cacheService.disconnect();
  }
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Cache service: ${cacheService ? (cacheService.isConnected ? 'Connected' : 'Disconnected') : 'Not available'}`);
  console.log(`🔄 Realtime service: ${realtimeService ? (realtimeService.io ? 'Active' : 'Inactive') : 'Not available'}`);
  console.log(`🌐 CORS origin: ${process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

export default app;
