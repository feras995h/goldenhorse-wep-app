# VPS Deployment Guide - Fix 500 Errors

## Problem
Your VPS is experiencing 500 Internal Server Errors because the application is trying to use SQLite instead of PostgreSQL.

## Root Cause
The application is running in development mode or without proper environment variables, causing it to default to SQLite configuration instead of PostgreSQL.

## Solution

### Step 1: Set Environment Variables on VPS

Create a `.env` file on your VPS with the following content:

```bash
# Production Environment Variables
NODE_ENV=production
DATABASE_URL=postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres
DB_DIALECT=postgres
DB_HOST=72.60.92.146
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP
DB_SSL=false
PORT=3000
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRES_IN=24h
```

### Step 2: Update Database Configuration

The database configuration has been updated to disable SSL (since your PostgreSQL server doesn't support it).

### Step 3: Test Connection

Run the connection test on your VPS:

```bash
node test-postgres-connection.js
```

### Step 4: Start Application

Use one of these methods to start your application:

#### Method 1: Using the setup script
```bash
# For Linux/Mac
./setup-production-env.sh

# For Windows
setup-production-env.bat
```

#### Method 2: Manual start with environment variables
```bash
export NODE_ENV=production
export DATABASE_URL="postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres"
export DB_SSL=false
npm start
```

#### Method 3: Using PM2 (recommended for production)
```bash
# Install PM2 if not already installed
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'golden-horse-api',
    script: 'src/server.js',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres',
      DB_SSL: 'false',
      PORT: 3000
    }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 5: Verify Fix

Test the previously failing endpoints:

1. **Shipments**: `GET /api/sales/shipments?page=1&limit=10`
2. **Shipping Invoices**: `GET /api/sales/shipping-invoices?page=1&limit=10`
3. **Sales Reports**: `GET /api/sales/reports?dateFrom=2025-08-31&dateTo=2025-09-20&reportType=product`
4. **Financial Vouchers**: `GET /api/financial/vouchers/payments?limit=50`

### Step 6: Monitor Logs

Check application logs for any remaining errors:

```bash
# If using PM2
pm2 logs golden-horse-api

# If using npm start
# Check the console output for any errors
```

## Troubleshooting

### If you still get 500 errors:

1. **Check environment variables**:
   ```bash
   echo $NODE_ENV
   echo $DATABASE_URL
   ```

2. **Verify database connection**:
   ```bash
   node test-postgres-connection.js
   ```

3. **Check application logs** for specific error messages

4. **Restart the application** after making changes

### Common Issues:

- **SSL Error**: Make sure `DB_SSL=false` is set
- **Connection Refused**: Check if PostgreSQL server is running
- **Authentication Failed**: Verify username/password
- **Database Not Found**: Ensure the database exists

## Files Modified

1. `src/config/database.cjs` - Updated to disable SSL
2. `test-postgres-connection.js` - Created for testing
3. `setup-production-env.sh` - Linux/Mac setup script
4. `setup-production-env.bat` - Windows setup script

## Database Status

✅ **PostgreSQL Connection**: Working  
✅ **Database Tables**: 42 tables found  
✅ **SSL Configuration**: Disabled (not supported by server)  
✅ **Authentication**: Successful  

Your database is ready and the application should work correctly once the environment variables are set properly on your VPS.




