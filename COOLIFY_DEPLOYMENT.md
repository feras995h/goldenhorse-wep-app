# 🚀 Golden Horse Shipping System - Coolify Deployment Guide

## 📋 Quick Setup for Coolify

### 🔧 Environment Variables to Set in Coolify:

```bash
# Application Settings
NODE_ENV=production
PORT=5001

# Database (Already configured from your screenshot)
DB_DIALECT=postgres
DB_HOST=postgresql
DB_PORT=5432
DB_NAME=goldenhorse-wep-app-db
DB_USERNAME=postgres
DB_PASSWORD=hsPUiw700OZF8jSOpIhtNMn2QdHKnEEMIPfE8p47Z5eL4JKNCxiYx1tqczb9pAnA

# JWT Security (Pre-configured secure keys)
JWT_SECRET=GH2024_SecureJWT_Key_$7mK9pL3qR8vN2xC5bF1wE6tY4uI0oP9sA8dG7hJ6kL5mN4qR3tY2uI1oP0
JWT_REFRESH_SECRET=GH2024_RefreshJWT_Key_$9nM7kL5jH3gF1dS8aP6qW4eR2tY0uI9oP8sA7dG6hJ5kL4mN3qR2tY1uI0

# Optional Settings
CORS_ORIGIN=*
TRUST_PROXY=1
LOG_LEVEL=info
```

## 🎯 Deployment Steps in Coolify:

### 1. Create New Application
- Go to your Coolify dashboard
- Click "New Application"
- Choose "Git Repository"

### 2. Connect Repository
- Repository URL: `https://github.com/feras995h/goldenhorse-wep-app.git`
- Branch: `main`
- Build Pack: `Node.js`

### 3. Configure Application
- **Name**: `golden-horse-shipping`
- **Port**: `5001`
- **Build Command**: `chmod +x deploy-coolify.sh`
- **Start Command**: `./deploy-coolify.sh`

### 4. Set Environment Variables
Copy and paste the environment variables listed above into Coolify's environment section.

### 5. Connect Database
- Your PostgreSQL database is already configured
- The connection details are already set in the environment variables

### 6. Deploy
- Click "Deploy"
- Wait for the deployment to complete (usually 3-5 minutes)

## ✅ What Happens During Deployment:

1. **Dependencies Installation**: All npm packages are installed
2. **Client Build**: React application is built for production
3. **Database Setup**: 
   - Connection is tested
   - Migrations are run automatically
   - Basic data is seeded if database is empty
4. **Directory Creation**: Upload, logs, backup directories are created
5. **Application Start**: Server starts on port 5001

## 🔍 Health Checks:

After deployment, verify the application is running:

- **Main Health Check**: `https://your-app-url.com/api/health`
- **Database Health**: `https://your-app-url.com/api/health/database`
- **System Health**: `https://your-app-url.com/api/health/system`

## 📊 Default Login Credentials:

After successful deployment, you can login with:
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Important**: Change the admin password immediately after first login!

## 🎉 Features Ready After Deployment:

### ✅ **Security Features**:
- JWT authentication with secure tokens
- Password hashing with bcrypt
- Rate limiting protection
- CORS configuration
- Input validation

### ✅ **Performance Features**:
- Redis caching (graceful fallback if not available)
- Lazy loading for React components
- Compressed responses
- Optimized database queries

### ✅ **Reliability Features**:
- Automated database backups
- Transaction management for financial operations
- Error handling and logging
- Health monitoring

### ✅ **Business Features**:
- Complete accounting system
- Customer management
- Invoice generation
- Financial reports
- Journal entries
- Chart of accounts

## 🔧 Post-Deployment Configuration:

### 1. System Settings
- Access: Settings → System Settings
- Configure company information
- Set up email notifications (optional)

### 2. Chart of Accounts
- Pre-configured with standard accounting structure
- Customize as needed for your business

### 3. User Management
- Create additional users
- Set up roles and permissions

### 4. Backup Configuration
- Automated daily backups are already configured
- Backups are stored in `/server/backups/`

## 📞 Support & Troubleshooting:

### Common Issues:

1. **Database Connection Error**
   - Verify environment variables are set correctly
   - Check if PostgreSQL service is running in Coolify

2. **Build Failures**
   - Check build logs in Coolify
   - Ensure all environment variables are set

3. **Application Not Starting**
   - Check application logs
   - Verify port 5001 is not blocked

### Logs Location:
- Application logs: `/server/logs/`
- Error logs: `/server/logs/error_YYYY-MM-DD.log`
- Access logs: Available in Coolify dashboard

## 🎯 Next Steps After Deployment:

1. **Login and Change Admin Password**
2. **Configure Company Settings**
3. **Set up Chart of Accounts (if needed)**
4. **Create User Accounts**
5. **Start Using the System**

---

**🎉 Your Golden Horse Shipping System is now ready for production use!**

The system includes comprehensive financial management, customer tracking, and reporting capabilities specifically designed for shipping and logistics companies.
