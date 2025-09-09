#!/bin/bash

# Golden Horse Shipping System - Deployment Script
# This script prepares and deploys the application to production

set -e

echo "🚀 Starting Golden Horse Shipping System Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    required_vars=("DB_HOST" "DB_NAME" "DB_USERNAME" "DB_PASSWORD")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "Please set these variables before running the deployment."
        echo "Example:"
        echo "export DB_HOST=your-postgres-host"
        echo "export DB_NAME=your-database-name"
        echo "export DB_USERNAME=your-username"
        echo "export DB_PASSWORD=your-password"
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Root dependencies
    npm ci --only=production
    
    # Server dependencies
    cd server
    npm ci --only=production
    cd ..
    
    # Client dependencies and build
    cd client
    npm ci --only=production
    npm run build
    cd ..
    
    print_success "Dependencies installed and client built"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    cd server
    
    # Test database connection
    npm run db:test-connection
    
    # Run migrations
    npm run db:migrate
    
    # Seed basic data if needed
    print_status "Checking if database needs seeding..."
    if npm run check-users 2>/dev/null | grep -q "Found 0 users"; then
        print_status "Database appears empty, seeding basic data..."
        npm run seed-basic-data
        print_success "Basic data seeded"
    else
        print_success "Database already has data, skipping seeding"
    fi
    
    cd ..
    
    print_success "Database migrations completed"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p server/uploads
    mkdir -p server/logs
    mkdir -p server/backups
    mkdir -p server/archives
    
    # Set proper permissions
    chmod 755 server/uploads
    chmod 755 server/logs
    chmod 755 server/backups
    chmod 755 server/archives
    
    print_success "Directories created"
}

# Start the application
start_application() {
    print_status "Starting the application..."
    
    # Copy production environment file
    if [ -f "server/.env.production" ]; then
        cp server/.env.production server/.env
        print_success "Production environment file copied"
    fi
    
    # Start the server
    cd server
    npm start
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Wait for server to start
    sleep 10
    
    # Check if server is responding
    if curl -f http://localhost:${PORT:-5001}/api/health > /dev/null 2>&1; then
        print_success "Health check passed - Application is running"
    else
        print_error "Health check failed - Application may not be running properly"
        exit 1
    fi
}

# Main deployment process
main() {
    print_status "Golden Horse Shipping System - Production Deployment"
    echo ""
    
    # Check environment variables
    check_env_vars
    echo ""
    
    # Install dependencies
    install_dependencies
    echo ""
    
    # Create directories
    create_directories
    echo ""
    
    # Run migrations
    run_migrations
    echo ""
    
    print_success "Deployment preparation completed successfully!"
    echo ""
    echo "🎉 Golden Horse Shipping System is ready for production!"
    echo ""
    echo "Next steps:"
    echo "1. Start the application: npm start (from server directory)"
    echo "2. Or use PM2: pm2 start server/src/server.js --name golden-horse"
    echo "3. Set up reverse proxy (Nginx) if needed"
    echo "4. Configure SSL certificate"
    echo ""
    echo "Application will be available at: http://your-domain:${PORT:-5001}"
    echo "API Health Check: http://your-domain:${PORT:-5001}/api/health"
}

# Run main function
main "$@"
