require('dotenv').config();

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
    logging: false
  },
  production: {
    // Use DB_URL if provided (for hosted databases like Railway, Heroku, etc.)
    ...(process.env.DB_URL ? {
      url: process.env.DB_URL,
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
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' || process.env.DB_URL ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
};
