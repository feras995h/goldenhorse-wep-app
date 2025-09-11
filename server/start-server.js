import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import models, { sequelize } from './src/models/index.js';
import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import settingsRoutes from './src/routes/settings.js';
import financialRoutes from './src/routes/financial.js';
import salesRoutes from './src/routes/sales.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/sales', salesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

async function startServer() {
  try {
    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    console.log('📊 Syncing database...');
    await sequelize.sync({ force: false });
    console.log('✅ Database synced');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log('📋 Available endpoints:');
      console.log('  GET  /health');
      console.log('  POST /api/auth/login');
      console.log('  GET  /api/auth/verify');
      console.log('  POST /api/admin/users');
      console.log('  GET  /api/admin/users');
      console.log('  GET  /api/settings');
      console.log('  GET  /api/financial/summary');
      console.log('  GET  /api/sales/summary');
      console.log('\n🔐 Test credentials:');
      console.log('  Username: admin');
      console.log('  Password: password');
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
}

startServer();
