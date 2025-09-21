import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

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
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    message: 'Server is running successfully'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Import and use routes
try {
  // Import routes dynamically to avoid errors
  const authRoutes = await import('./routes/auth.js');
  const adminRoutes = await import('./routes/admin.js');
  const financialRoutes = await import('./routes/financial.js');
  const salesRoutes = await import('./routes/sales.js');
  const settingsRoutes = await import('./routes/settings.js');

  // Use routes
  app.use('/api/auth', authRoutes.default);
  app.use('/api/admin', adminRoutes.default);
  app.use('/api/financial', financialRoutes.default);
  app.use('/api/sales', salesRoutes.default);
  app.use('/api/settings', settingsRoutes.default);

  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  
  // Fallback routes
  app.get('/api/auth/*', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Auth service temporarily unavailable'
    });
  });

  app.get('/api/financial/*', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Financial service temporarily unavailable'
    });
  });

  app.get('/api/sales/*', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Sales service temporarily unavailable'
    });
  });
}

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
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`🌐 CORS origin: ${process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log(`✅ Server is ready to accept connections`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://${HOST}:${PORT}/api/test`);
});

export default app;
