# 🚀 Golden Horse Shipping System - Deployment Guide

## 📋 Prerequisites

### 1. Coolify PostgreSQL Database
Make sure you have a PostgreSQL database created in Coolify with the following information:
- Database Host
- Database Port (usually 5432)
- Database Name
- Username
- Password

### 2. Server Requirements
- Node.js 18+ 
- npm or yarn
- Git

## 🔧 Environment Variables

Set these environment variables in Coolify:

### Required Variables:
```bash
# Database Configuration
DB_HOST=your-postgres-host-from-coolify
DB_PORT=5432
DB_NAME=your-database-name
DB_USERNAME=your-username
DB_PASSWORD=your-password

# Application
NODE_ENV=production
PORT=5001
```

### Optional Variables:
```bash
# Redis (if available)
REDIS_URL=redis://your-redis-host:6379

# CORS (set your domain)
CORS_ORIGIN=https://your-domain.com

# Email (if needed)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASSWORD=your-email-password
SMTP_FROM=noreply@your-domain.com
```

## 🚀 Deployment Methods

### Method 1: Direct Deployment (Recommended for Coolify)

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd golden-horse-shipping
```

2. **Set environment variables:**
```bash
export DB_HOST=your-postgres-host
export DB_NAME=your-database-name
export DB_USERNAME=your-username
export DB_PASSWORD=your-password
```

3. **Run deployment script:**
```bash
chmod +x deploy.sh
./deploy.sh
```

4. **Start the application:**
```bash
cd server
npm start
```

### Method 2: Docker Deployment

1. **Build and run with Docker Compose:**
```bash
# Update docker-compose.yml with your database credentials
docker-compose up -d
```

2. **Or build Docker image:**
```bash
docker build -t golden-horse-app .
docker run -d \
  -p 5001:5001 \
  -e DB_HOST=your-host \
  -e DB_NAME=your-db \
  -e DB_USERNAME=your-user \
  -e DB_PASSWORD=your-password \
  golden-horse-app
```

### Method 3: Manual Deployment

1. **Install dependencies:**
```bash
npm ci --only=production
cd server && npm ci --only=production
cd ../client && npm ci --only=production
```

2. **Build client:**
```bash
cd client
npm run build
cd ..
```

3. **Run database migrations:**
```bash
cd server
npm run db:migrate
npm run seed-basic-data
```

4. **Start server:**
```bash
npm start
```

## 🔍 Health Checks

After deployment, verify the application is running:

```bash
# Health check endpoint
curl http://your-domain:5001/api/health

# Database health
curl http://your-domain:5001/api/health/database

# System health
curl http://your-domain:5001/api/health/system
```

## 📁 Directory Structure

The application will create these directories:
```
server/
├── uploads/     # File uploads
├── logs/        # Application logs
├── backups/     # Database backups
└── archives/    # Archived data
```

## 🔐 Security Checklist

- ✅ JWT secrets are secure and unique
- ✅ Database credentials are protected
- ✅ CORS is configured for your domain
- ✅ File upload limits are set
- ✅ Rate limiting is enabled
- ✅ HTTPS is configured (via reverse proxy)

## 🔧 Production Configuration

### PM2 (Process Manager)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server/src/server.js --name golden-horse

# Save PM2 configuration
pm2 save
pm2 startup
```

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring

### Application Logs
```bash
# View logs
tail -f server/logs/app_$(date +%Y-%m-%d).log

# View error logs
tail -f server/logs/error_$(date +%Y-%m-%d).log
```

### Database Monitoring
```bash
# Check database connection
cd server && npm run db:test-connection

# View database status
curl http://localhost:5001/api/health/database
```

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm ci --only=production
cd server && npm ci --only=production
cd ../client && npm ci --only=production && npm run build

# Run new migrations
cd server && npm run db:migrate

# Restart application
pm2 restart golden-horse
```

### Database Backups
The application automatically creates daily backups at 2:00 AM. Manual backup:
```bash
cd server
npm run backup-database
```

## 🆘 Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check database credentials
   - Verify database is running
   - Check network connectivity

2. **Port Already in Use**
   - Change PORT environment variable
   - Kill existing process: `pkill -f node`

3. **Permission Denied**
   - Check file permissions: `chmod 755 deploy.sh`
   - Ensure directories are writable

4. **Migration Errors**
   - Check database user permissions
   - Verify database exists
   - Run migrations manually: `npm run db:migrate`

### Getting Help:
- Check application logs in `server/logs/`
- Use health check endpoints
- Verify environment variables are set correctly

## 📞 Support

For deployment issues or questions, check:
1. Application logs
2. Health check endpoints
3. Database connectivity
4. Environment variable configuration
