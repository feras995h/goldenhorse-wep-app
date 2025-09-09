import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import financialRoutes from './routes/financial.js';
import salesRoutes from './routes/sales.js';
import adminRoutes from './routes/admin.js';
import { errorHandler, notFound, asyncHandler } from './middleware/errorHandler.js';
import { enhancedErrorHandler, requestId } from './middleware/enhancedErrorHandler.js';
import DatabaseInitializer from './utils/databaseInit.js';
import backupManager from './utils/backupManager.js';
import monitoringManager from './utils/monitoringManager.js';
import cacheManager from './utils/cacheManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Comprehensive environment variables validation
const validateEnvironment = () => {
  const requiredEnv = {
    // Security
    'JWT_SECRET': 'JWT secret key is required',
    'JWT_REFRESH_SECRET': 'JWT refresh secret key is required',

    // Database
    'DB_USERNAME': 'Database username is required',
    'DB_PASSWORD': 'Database password is required',
    'DB_NAME': 'Database name is required',
    'DB_HOST': 'Database host is required',
    'DB_PORT': 'Database port is required'
  };

  const missing = [];
  const warnings = [];

  // Check required variables
  Object.entries(requiredEnv).forEach(([key, description]) => {
    if (!process.env[key]) {
      missing.push({ key, description });
    }
  });

  // Check for weak secrets in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.includes('change-this')) {
      warnings.push('JWT_SECRET appears to be using default value - change it for production!');
    }
    if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.includes('change-this')) {
      warnings.push('JWT_REFRESH_SECRET appears to be using default value - change it for production!');
    }
  }

  // Report missing variables
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(({ key, description }) => {
      console.error(`   - ${key}: ${description}`);
    });

    if (process.env.NODE_ENV === 'production') {
      console.error('🚫 Cannot start in production mode with missing environment variables');
      process.exit(1);
    } else {
      console.warn('⚠️  Application may not function correctly with missing variables');
    }
  }

  // Report warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  if (missing.length === 0 && warnings.length === 0) {
    console.log('✅ Environment variables validation passed');
  }
};

// Run environment validation
validateEnvironment();

// If running behind a proxy (load balancer / Heroku / Cloudflare), trust first proxy
if (process.env.TRUST_PROXY === '1' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet());

// Rate limiting middleware
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    message: 'Too many login attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Stricter rate limiting for password-related operations
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password change attempts per hour
  message: {
    message: 'Too many password change attempts, please try again later.',
    code: 'PASSWORD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API rate limiting for financial operations
const financialLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 financial requests per minute
  message: {
    message: 'Too many financial requests, please slow down.',
    code: 'FINANCIAL_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Sales API rate limiting
const salesLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 sales requests per minute
  message: {
    message: 'Too many sales requests, please slow down.',
    code: 'SALES_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(requestId); // Add request ID for tracking
app.use(monitoringManager.requestMonitoringMiddleware()); // Add request monitoring
app.use(cors());
app.use(express.json());

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/financial/', financialLimiter);
app.use('/api/sales/', salesLimiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/admin', adminRoutes);

// Health check with database status
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await DatabaseInitializer.getHealthStatus();
    res.json({
      message: 'Golden Horse Shipping API is running!',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      version: '2.0.0'
    });
  } catch (error) {
    res.status(503).json({
      message: 'API is running but health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database health endpoint
app.get('/api/health/database', async (req, res) => {
  try {
    const health = await DatabaseInitializer.getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// System monitoring endpoint
app.get('/api/health/system', async (req, res) => {
  try {
    const health = await monitoringManager.getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Cache status endpoint
app.get('/api/health/cache', async (req, res) => {
  try {
    const stats = await cacheManager.getStats();
    res.json({
      status: stats.connected ? 'healthy' : 'unhealthy',
      ...stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Backup status endpoint
app.get('/api/health/backup', async (req, res) => {
  try {
    const status = await backupManager.getStatus();
    res.json({
      status: status.initialized ? 'healthy' : 'unhealthy',
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use(notFound);
app.use(enhancedErrorHandler);

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting Golden Horse Shipping Server...');

    // Initialize database
    const dbInit = await DatabaseInitializer.initializeDatabase();
    if (!dbInit.success) {
      console.error('❌ Failed to initialize database:', dbInit.error);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      } else {
        console.warn('⚠️  Continuing in development mode without database');
      }
    }

    // Initialize backup system
    try {
      await backupManager.initialize();
      console.log('✅ Backup system initialized');
    } catch (error) {
      console.warn('⚠️  Backup system initialization failed:', error.message);
    }

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 API available at http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Database health: http://localhost:${PORT}/api/health/database`);

      if (process.env.NODE_ENV === 'development') {
        console.log('\n💡 Development Tips:');
        console.log('   - Check database connection: npm run db:test-connection');
        console.log('   - Run migrations: npm run db:migrate');
        console.log('   - Seed data: npm run seed-basic-data');
      }
    });

  } catch (error) {
    console.error('💥 Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();
