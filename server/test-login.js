import express from 'express';
import cors from 'cors';
import models, { sequelize } from './src/models/index.js';
import authRoutes from './src/routes/auth.js';

const app = express();
const PORT = 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

async function startServer() {
  try {
    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await sequelize.sync({ force: false });
    console.log('✅ Database synced');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log('📋 Available endpoints:');
      console.log('  POST /api/auth/login');
      console.log('  GET  /api/auth/verify');
      console.log('  POST /api/auth/refresh');
      console.log('\n🔐 Test login credentials:');
      console.log('  Username: admin');
      console.log('  Password: password');
      console.log('\n📝 Test with curl:');
      console.log(`curl -X POST http://localhost:${PORT}/api/auth/login \\`);
      console.log('  -H "Content-Type: application/json" \\');
      console.log('  -d \'{"username":"admin","password":"password"}\'');
    });

  } catch (error) {
    console.error('❌ Server startup error:', error.message);
    process.exit(1);
  }
}

startServer();
