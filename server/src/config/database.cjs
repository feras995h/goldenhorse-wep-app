require('dotenv').config();

// Support both DB_URL and DATABASE_URL (common in different platforms)
// Clean URLs by removing leading = signs (Coolify environment variable issue)
const cleanDBUrl = process.env.DB_URL ? process.env.DB_URL.trim().replace(/^=+/, '') : null;
const cleanDatabaseUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim().replace(/^=+/, '') : null;
const DATABASE_URL = cleanDBUrl || cleanDatabaseUrl;

// Debug database configuration
if (process.env.NODE_ENV === 'production') {
  console.log('🔍 Database Configuration Debug:');
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
  console.log('  - DB_URL present:', !!process.env.DB_URL);
  console.log('  - DATABASE_URL present:', !!process.env.DATABASE_URL);
  console.log('  - Raw DATABASE_URL starts with:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + '...' : 'N/A');
  console.log('  - Cleaned DATABASE_URL present:', !!DATABASE_URL);
  console.log('  - Final DATABASE_URL length:', DATABASE_URL ? DATABASE_URL.length : 0);
  console.log('  - Final DATABASE_URL starts with:', DATABASE_URL ? DATABASE_URL.substring(0, 15) + '...' : 'N/A');
}

module.exports = {
  development: {
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || './database/development.sqlite',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: {
      underscored: true,
      timestamps: true
    }
  },
  production: {
    // Use DATABASE_URL or DB_URL if provided (for hosted databases like Railway, Heroku, Coolify, etc.)
    ...(DATABASE_URL && DATABASE_URL.trim() !== '' ? {
      url: DATABASE_URL.trim(),
      dialect: 'postgres'
    } : {
      // Use individual connection parameters
      dialect: process.env.DB_DIALECT || 'postgres',
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432
    }),
    logging: false,
    define: {
      underscored: true,
      timestamps: true
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: false // Disable SSL for this PostgreSQL server
    }
  }
};
