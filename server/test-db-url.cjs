// Test the database URL processing logic
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const cleanDBUrl = process.env.DB_URL ? process.env.DB_URL.trim().replace(/^=+/, '') : null;
const cleanDatabaseUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim().replace(/^=+/, '') : null;
const DATABASE_URL = cleanDBUrl || cleanDatabaseUrl;

console.log('DB_URL:', process.env.DB_URL);
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('cleanDBUrl:', cleanDBUrl);
console.log('cleanDatabaseUrl:', cleanDatabaseUrl);
console.log('DATABASE_URL (final):', DATABASE_URL);