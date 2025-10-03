import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// TEST MODE DETECTION - MUST BE FIRST BEFORE ANY OTHER CODE
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we're in test mode by looking for test environment file or test flags
const isTestMode = process.env.NODE_ENV === 'test' ||
                   process.env.SKIP_SERVER_STARTUP === 'true' ||
                   process.env.npm_lifecycle_event === 'test';

// Load test environment variables IMMEDIATELY if in test mode
if (isTestMode) {
  // Load test environment file FIRST
  dotenv.config({ path: path.join(__dirname, '../.env.test') });

  // Force test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only_not_for_production';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_jwt_secret_key_for_testing_only';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/golden_horse_test';

  console.log('🧪 Test mode detected - environment variables loaded from .env.test');
}

// Skip server startup if in test mode - check this FIRST before any other code
if (process.env.SKIP_SERVER_STARTUP === 'true') {
  console.log('🚫 Server startup skipped (test mode)');
  process.exit(0);
}

import purchaseInvoicePaymentsActionsRoutes from './routes/purchaseInvoicePaymentsActions.js';
import purchaseAgingReportRoutes from './routes/purchaseAgingReport.js';
import advancedReportsRoutes from './routes/advancedReports.js';
import costAnalysisRoutes from './routes/costAnalysis.js';
import budgetPlanningRoutes from './routes/budgetPlanning.js';
import cashFlowManagementRoutes from './routes/cashFlowManagement.js';
import financialRatiosRoutes from './routes/financialRatios.js';
import accountingPeriodsRoutes from './routes/accountingPeriods.js';

// Import enhanced services (optional)
let cacheService, realtimeService;

// تحقق من وجود Redis في البيئة
const hasRedisConfig = process.env.REDIS_HOST || process.env.REDIS_URL;

if (hasRedisConfig) {
  try {
    cacheService = (await import('./services/cacheService.js')).default;
    realtimeService = (await import('./services/realtimeService.js')).default;
  } catch (error) {
    console.log('⚠️ Enhanced services not available - running in basic mode');
  }
} else {
  console.log('ℹ️ Redis not configured - running in basic mode');
}
import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import financialRoutes from './routes/financial.js';
import enhancedFinancialRoutes from './routes/enhancedFinancial.js';
import salesRoutes from './routes/sales.js';
import vouchersRoutes from './routes/vouchers.js';
import adminRoutes from './routes/admin.js';
import notificationsRoutes from './routes/notifications.js';
import arRoutes from './routes/ar.js';
import purchaseInvoicesRoutes from './routes/purchaseInvoices.js';
import purchaseInvoicePaymentsRoutes from './routes/purchaseInvoicePayments.js';
import paymentVouchersRoutes from './routes/paymentVouchers.js';
import accountingRoutes from './routes/accounting.js';
import { errorHandler, notFound, asyncHandler } from './middleware/errorHandler.js';
import backupManager from './utils/backupManager.js';
import monitoringManager from './utils/monitoringManager.js';
import cacheManager from './utils/cacheManager.js';
import webSocketService from './services/websocketService.js';
import balanceUpdateService from './services/balanceUpdateService.js';
import AccountingInitializer from './utils/accountingInitializer.js';

// Load environment variables from the correct path (only if not in test mode)
// In test mode, environment variables are already loaded at the top of the file
if (!isTestMode) {
  dotenv.config({ path: path.join(__dirname, '../../.env') });
} else {
  // In test mode, ensure we have the correct test environment variables
  console.log('🧪 Using test environment variables');
}

// Clean NODE_ENV value (remove any leading = signs)
const NODE_ENV = (process.env.NODE_ENV || 'development').trim().replace(/^=+/, '');
console.log(`🔍 Environment: "${NODE_ENV}" (original: "${process.env.NODE_ENV}")`);

// Override process.env.NODE_ENV with cleaned value
process.env.NODE_ENV = NODE_ENV;


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
const PORT = process.env.PORT || 5001;

// ... بعد تعريف app مباشرة
app.use('/api/purchase-invoice-payments-actions', purchaseInvoicePaymentsActionsRoutes);
app.use('/api/purchase-aging-report', purchaseAgingReportRoutes);
app.use('/api/purchase-invoice-payments', purchaseInvoicePaymentsRoutes);

// Comprehensive environment variables validation
const validateEnvironment = () => {
  const requiredEnv = {
    // Security
    'JWT_SECRET': 'JWT secret key is required',
    'JWT_REFRESH_SECRET': 'JWT refresh secret key is required'
  };

  // Only require database variables if not using DB_URL or DATABASE_URL
  const hasDbUrl = process.env.DB_URL || process.env.DATABASE_URL;

  if (!hasDbUrl && process.env.DB_DIALECT === 'postgres') {
    requiredEnv['DB_USERNAME'] = 'Database username is required (or use DB_URL/DATABASE_URL)';
    requiredEnv['DB_PASSWORD'] = 'Database password is required (or use DB_URL/DATABASE_URL)';
    requiredEnv['DB_NAME'] = 'Database name is required (or use DB_URL/DATABASE_URL)';
    requiredEnv['DB_HOST'] = 'Database host is required (or use DB_URL/DATABASE_URL)';
    requiredEnv['DB_PORT'] = 'Database port is required (or use DB_URL/DATABASE_URL)';
  }

  const missing = [];
  const warnings = [];

  // Check required variables
  Object.entries(requiredEnv).forEach(([key, description]) => {
    if (!process.env[key]) {
      missing.push({ key, description });
    }
  });

  // Special check for database URL in production
  if (!hasDbUrl && process.env.NODE_ENV === 'production') {
    missing.push({
      key: 'DATABASE_URL or DB_URL',
      description: 'Database URL is required for production (DATABASE_URL or DB_URL, or set individual DB_* variables)'
    });
  }

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

// Security middleware - configured for HTTP deployment
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now to avoid HTTPS issues
  crossOriginOpenerPolicy: false, // Disable COOP for HTTP
  crossOriginResourcePolicy: false, // Disable CORP for HTTP
  originAgentCluster: false, // Disable Origin-Agent-Cluster header
  hsts: false, // Disable HSTS for HTTP
}));

// Enhanced Rate limiting middleware with intelligent detection
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: (req, res) => {
    // Dynamic limit based on user role and request type
    if (req.user?.role === 'admin') return 2000;
    if (req.user?.role === 'manager') return 1500;
    if (req.user?.role === 'user') return 1000;
    return NODE_ENV === 'development' ? 2000 : parseInt(process.env.RATE_LIMIT_GENERAL_MAX) || 1000;
  },
  message: {
    message: 'تم تجاوز الحد المسموح للطلبات. يرجى المحاولة مرة أخرى لاحقاً.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks, static files, and authenticated admin users
    return req.path === '/api/health' ||
           req.path.startsWith('/uploads/') ||
           req.path.startsWith('/api/debug-env') ||
           (req.user?.role === 'admin' && req.path.startsWith('/api/admin/'));
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (req, res, next, options) => {
    // Log rate limit violations
    console.warn(`🚨 Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}, User: ${req.user?.id || 'anonymous'}`);

    res.status(options.statusCode).json({
      success: false,
      message: options.message.message,
      errorCode: options.message.code,
      retryAfter: options.message.retryAfter,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    });
  },
});

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: (req, res) => {
    return NODE_ENV === 'development' ? 50 : parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10;
  },
  message: {
    message: 'تم تجاوز عدد محاولات تسجيل الدخول المسموحة. يرجى المحاولة مرة أخرى لاحقاً.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Count failed requests for security
  handler: (req, res, next, options) => {
    // Log authentication rate limit violations
    console.warn(`🚨 Auth rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);

    res.status(options.statusCode).json({
      success: false,
      message: options.message.message,
      errorCode: options.message.code,
      retryAfter: options.message.retryAfter,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    });
  },
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

// Enhanced API rate limiting for financial operations
const financialLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: (req, res) => {
    // Dynamic limits based on user role and operation type
    if (req.user?.role === 'admin') return 1000;
    if (req.user?.role === 'manager') return 800;
    if (req.user?.role === 'user') return 500;
    return NODE_ENV === 'development' ? 1000 : parseInt(process.env.RATE_LIMIT_FINANCIAL_MAX) || 500;
  },
  message: {
    message: 'تم تجاوز الحد المسموح للعمليات المالية. يرجى الانتظار قليلاً.',
    code: 'FINANCIAL_RATE_LIMIT_EXCEEDED',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for read-only operations and admin users
    return (req.method === 'GET' && (
      req.path.includes('/accounts') ||
      req.path.includes('/reports') ||
      req.path.includes('/statements') ||
      req.path.includes('/financial/summary')
    )) || req.user?.role === 'admin';
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (req, res, next, options) => {
    // Log financial rate limit violations
    console.warn(`🚨 Financial rate limit exceeded for IP: ${req.ip}, User: ${req.user?.id || 'anonymous'}, Path: ${req.path}`);

    res.status(options.statusCode).json({
      success: false,
      message: options.message.message,
      errorCode: options.message.code,
      retryAfter: options.message.retryAfter,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    });
  },
});

// Enhanced Sales API rate limiting
const salesLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: (req, res) => {
    // Dynamic limits based on user role and operation type
    if (req.user?.role === 'admin') return 1500;
    if (req.user?.role === 'manager') return 1200;
    if (req.user?.role === 'user') return 800;
    return NODE_ENV === 'development' ? 1500 : parseInt(process.env.RATE_LIMIT_SALES_MAX) || 800;
  },
  message: {
    message: 'تم تجاوز الحد المسموح لعمليات المبيعات. يرجى الانتظار قليلاً.',
    code: 'SALES_RATE_LIMIT_EXCEEDED',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for read-only operations and admin users
    return (req.method === 'GET' && (
      req.path.includes('/customers') ||
      req.path.includes('/invoices') ||
      req.path.includes('/analytics') ||
      req.path.includes('/reports') ||
      req.path.includes('/summary')
    )) || req.user?.role === 'admin';
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (req, res, next, options) => {
    // Log sales rate limit violations
    console.warn(`🚨 Sales rate limit exceeded for IP: ${req.ip}, User: ${req.user?.id || 'anonymous'}, Path: ${req.path}`);

    res.status(options.statusCode).json({
      success: false,
      message: options.message.message,
      errorCode: options.message.code,
      retryAfter: options.message.retryAfter,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    });
  },
});

// Middleware
app.use(monitoringManager.requestMonitoringMiddleware()); // Add request monitoring

// Configure CORS to allow requests from frontend
const corsOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.CORS_ORIGIN,
      // Allow the current domain for SPA routing
      `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 5001}`,
      // Allow sslip.io domains
      /\.sslip\.io$/
    ].filter(Boolean)
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Type', 'Content-Length', 'Content-Disposition']
}));

app.use(express.json());

// Apply rate limiting (can be disabled via environment variable)
const rateLimitingEnabled = process.env.ENABLE_RATE_LIMITING !== 'false';

if (rateLimitingEnabled) {
  console.log('🛡️  Rate limiting enabled');
  app.use('/api/', generalLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/financial/', financialLimiter);
  app.use('/api/enhanced-financial/', financialLimiter);
  app.use('/api/sales/', salesLimiter);
} else {
  console.log('⚠️  Rate limiting disabled');
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve static files from client build (for production)
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  console.log('📁 Serving static files from:', clientBuildPath);

  // Serve static files with proper headers for HTTP
  app.use(express.static(clientBuildPath, {
    setHeaders: (res, path) => {
      // Set proper MIME types
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (path.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (path.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      }
      // Disable HTTPS-only headers for HTTP deployment
      res.removeHeader('Cross-Origin-Opener-Policy');
      res.removeHeader('Cross-Origin-Resource-Policy');
      res.removeHeader('Origin-Agent-Cluster');
    }
  }));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/enhanced-financial', enhancedFinancialRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/vouchers', vouchersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/payment-vouchers', paymentVouchersRoutes);
app.use('/api/ar', arRoutes);
app.use('/api/purchase-invoices', purchaseInvoicesRoutes);
app.use('/api/reports', advancedReportsRoutes);
app.use('/api/cost-analysis', costAnalysisRoutes);
app.use('/api/budget-planning', budgetPlanningRoutes);
app.use('/api/cash-flow', cashFlowManagementRoutes);
app.use('/api/financial-ratios', financialRatiosRoutes);
app.use('/api/accounting-periods', accountingPeriodsRoutes);

// Health check with database status
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = { status: 'connected', message: 'Database is operational' };
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

// Debug endpoint لفحص متغيرات البيئة (مؤقت)
app.get('/api/debug-env', async (req, res) => {
  try {
    // استيراد db من models
    const { sequelize } = await import('./models/index.js');

    // فحص متغيرات البيئة المتعلقة بقاعدة البيانات
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      DB_URL: process.env.DB_URL ? process.env.DB_URL.replace(/:[^:@]*@/, ':***@') : 'غير محدد',
      DATABASE_URL: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@') : 'غير محدد',
      PORT: process.env.PORT,
      timestamp: new Date().toISOString()
    };

    // فحص اتصال قاعدة البيانات الحالي
    const dbConfig = sequelize.config;
    const dbInfo = {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      username: dbConfig.username,
      dialect: dbConfig.dialect
    };

    // اختبار استعلام بسيط لمعرفة قاعدة البيانات الحالية
    const dbTest = await sequelize.query('SELECT current_database() as current_db, version() as version', {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      message: 'Debug Environment Information',
      environment: envInfo,
      database_config: dbInfo,
      database_test: dbTest[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: 'Debug failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database health endpoint
app.get('/api/health/database', async (req, res) => {
  try {
    const health = { status: 'healthy', message: 'Database connection is active' };
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
    if (cacheService) {
      const stats = await cacheService.getStats();
      res.json({
        status: stats ? 'healthy' : 'unhealthy',
        ...stats,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        status: 'not available',
        message: 'Cache service not initialized',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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

// Handle React Router (return index.html for all non-API routes) - MUST be before error handlers
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }

    const clientBuildPath = path.join(__dirname, '../../client/dist');
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting Golden Horse Shipping Server...');

    // Initialize accounting system
    try {
      await AccountingInitializer.initialize();
    } catch (error) {
      console.error('❌ Failed to initialize accounting system:', error);
      console.warn('⚠️  Accounting system may not function correctly');
      // لا نوقف السيرفر، لكن نحذر
    }

    // Initialize backup system
    try {
      await backupManager.initialize();
      console.log('✅ Backup system initialized');
    } catch (error) {
      console.warn('⚠️  Backup system initialization failed:', error.message);
    }

    // Initialize WebSocket service
    const io = webSocketService.initialize(server);
    console.log('✅ WebSocket service initialized');

    // Make io available globally for balance updates
    global.io = io;

    // Start HTTP server with WebSocket support
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 API available at http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket available at ws://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Database health: http://localhost:${PORT}/api/health/database`);

      if (process.env.NODE_ENV === 'development') {
        console.log('\n💡 Development Tips:');
        console.log('   - Check database connection: npm run db:test-connection');
        console.log('   - Run migrations: npm run db:migrate');
        console.log('   - Seed data: npm run seed-basic-data');
        console.log('   - WebSocket test: Connect to ws://localhost:' + PORT);
      }
    });

  } catch (error) {
    console.error('💥 Failed to start server:', error.message);
    process.exit(1);
  }
}


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

// Export app for testing purposes
export { app };

// Start the server
startServer();
