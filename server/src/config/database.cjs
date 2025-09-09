require('dotenv').config();

// Parse DATABASE_URL if provided
let dbConfig = {};
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    dbConfig = {
      dialect: url.protocol.replace(':', '') === 'postgresql' ? 'postgres' : url.protocol.replace(':', ''),
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.replace('/', ''),
      username: url.username,
      password: url.password,
    };
    console.log('✅ Using DATABASE_URL for database configuration');
  } catch (error) {
    console.error('❌ Error parsing DATABASE_URL:', error.message);
  }
}

module.exports = {
  development: {
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || './database/development.sqlite',
    // PostgreSQL settings (used when DB_DIALECT=postgres)
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'golden_horse_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    logging: false, // Disable SQL logging in development
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'golden_horse_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: dbConfig.username || process.env.DB_USERNAME,
    password: dbConfig.password || process.env.DB_PASSWORD,
    database: dbConfig.database || process.env.DB_NAME,
    host: dbConfig.host || process.env.DB_HOST,
    port: dbConfig.port || process.env.DB_PORT || 5432,
    dialect: dbConfig.dialect || 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
};
