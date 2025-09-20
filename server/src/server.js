import purchaseInvoicePaymentsActionsRoutes from './routes/purchaseInvoicePaymentsActions.js';
import purchaseAgingReportRoutes from './routes/purchaseAgingReport.js';
import advancedReportsRoutes from './routes/advancedReports.js';
import costAnalysisRoutes from './routes/costAnalysis.js';
import budgetPlanningRoutes from './routes/budgetPlanning.js';
import cashFlowManagementRoutes from './routes/cashFlowManagement.js';
import financialRatiosRoutes from './routes/financialRatios.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import financialRoutes from './routes/financial.js';
import salesRoutes from './routes/sales.js';
import adminRoutes from './routes/admin.js';
import notificationsRoutes from './routes/notifications.js';
import arRoutes from './routes/ar.js';
import purchaseInvoicesRoutes from './routes/purchaseInvoices.js';
import purchaseInvoicePaymentsRoutes from './routes/purchaseInvoicePayments.js';
import paymentVouchersRoutes from './routes/paymentVouchers.js';
import accountingRoutes from './routes/accounting.js';
import { errorHandler, notFound, asyncHandler } from './middleware/errorHandler.js';
import { enhancedErrorHandler, requestId } from './middleware/enhancedErrorHandler.js';
import DatabaseInitializer from './utils/databaseInit.js';
import backupManager from './utils/backupManager.js';
import monitoringManager from './utils/monitoringManager.js';
import cacheManager from './utils/cacheManager.js';
import webSocketService from './services/websocketService.js';
import balanceUpdateService from './services/balanceUpdateService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Clean NODE_ENV value (remove any leading = signs)
const NODE_ENV = (process.env.NODE_ENV || 'development').trim().replace(/^=+/, '');
console.log(`🔍 Environment: "${NODE_ENV}" (original: "${process.env.NODE_ENV}")`);

// Override process.env.NODE_ENV with cleaned value
process.env.NODE_ENV = NODE_ENV;

const app = express();
const server = createServer(app);
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

// Rate limiting middleware - More lenient for normal usage
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'development' ? 2000 : 500, // Much higher limits
  message: {
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and static files
    return req.path === '/api/health' || req.path.startsWith('/uploads/');
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'development' ? 100 : 20, // Higher limit for development
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

// API rate limiting for financial operations - More generous limits
const financialLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: NODE_ENV === 'development' ? 1000 : 200, // Much higher limits for normal usage
  message: {
    message: 'Too many financial requests, please slow down.',
    code: 'FINANCIAL_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for read-only operations
    return req.method === 'GET' && (
      req.path.includes('/accounts') ||
      req.path.includes('/reports') ||
      req.path.includes('/statements')
    );
  }
});

// Sales API rate limiting - More generous limits
const salesLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: NODE_ENV === 'development' ? 1000 : 300, // Much higher limits for normal usage
  message: {
    message: 'Too many sales requests, please slow down.',
    code: 'SALES_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for read-only operations
    return req.method === 'GET' && (
      req.path.includes('/customers') ||
      req.path.includes('/invoices') ||
      req.path.includes('/analytics')
    );
  }
});

// Middleware
app.use(requestId); // Add request ID for tracking
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
app.use('/api/sales', salesRoutes);
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
app.use(enhancedErrorHandler);

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting Golden Horse Shipping Server...');

    // Initialize database
    const dbInit = await DatabaseInitializer.initializeDatabase();
    if (!dbInit.success) {
      console.error('❌ Failed to initialize database:', dbInit.error);
      console.warn('⚠️  Continuing without database - some features may be limited');
      console.warn('⚠️  The application will retry database connection on first request');
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


// Export app for testing purposes
export { app };

// Start the server
startServer();
