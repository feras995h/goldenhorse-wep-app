# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Golden Horse Shipping System (الحصان الذهبي لخدمات الشحن)** - A comprehensive ERP system for international shipping services between China and Libya, featuring advanced accounting engine, sales management, and multilingual support (Arabic/English RTL).

## Development Commands

### Quick Start
```bash
# Install all dependencies (root, client, and server)
npm run install-all

# Start development environment (client + server concurrently)
npm run dev

# Start only client (React + Vite)
npm run client

# Start only server (Node.js + Express)
npm run server
```

### Building & Production
```bash
# Build client for production
npm run build

# Build server for production
npm run build:server

# Start production server
npm run start

# Start both client and server in production mode
npm run start:prod
```

### Database Management
```bash
# Set up database with initial schema
npm run setup-db

# Fix database schema issues
npm run fix-db

# Complete database repair (comprehensive fix)
npm run complete-fix

# Check database health
npm run check-db

# Create account mapping for accounting engine
npm run create-mapping

# Run final setup after fixes
npm run final-setup
```

### Testing
```bash
# Run all tests
cd server && npm test

# Run specific test suites
npm run test:auth        # Authentication tests
npm run test:customers   # Customer management tests
npm run test:financial   # Financial/accounting tests
npm run test:sales       # Sales invoice tests

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Code Quality
```bash
# Lint server code
cd server && npm run lint

# Fix linting issues
cd server && npm run lint:fix

# Type checking (client)
cd client && npm run type-check

# Lint client code
cd client && npm run lint
```

### Docker & Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.yml up -d

# Coolify deployment (if configured)
# Uses .coolify.yml configuration
```

## Architecture Overview

### Full-Stack Structure
```
├── client/                    # React TypeScript frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Route-based page components
│   │   ├── contexts/        # React contexts (auth, theme)
│   │   ├── services/        # API clients
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Client utilities
│   └── package.json         # Vite + React + TypeScript
│
├── server/                   # Node.js Express backend
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── models/          # Sequelize database models
│   │   ├── controllers/     # Business logic controllers
│   │   ├── middleware/      # Authentication, validation, etc.
│   │   ├── services/        # Business services
│   │   ├── utils/           # Server utilities
│   │   └── migrations/      # Database migration files
│   └── package.json         # Express + PostgreSQL stack
│
└── database/                # Database scripts and backups
```

### Key Architectural Patterns

#### 1. Multilingual ERP System
- **RTL/LTR Support**: Full Arabic and English support with proper RTL layout
- **Currency Handling**: Multi-currency support (LYD, USD, CNY) for international shipping
- **Date Formats**: Hijri and Gregorian calendar support

#### 2. Advanced Accounting Engine
- **Double-Entry Bookkeeping**: Fully compliant accounting system
- **Account Mapping System**: Automated GL account assignment for transactions
- **Journal Entries**: Automatic journal entry creation for all financial transactions
- **Balance Tracking**: Real-time account balance updates with proper locking

**Critical Files**:
- `server/src/models/AccountMapping.js` - Core accounting configuration
- `server/src/models/SalesInvoice.js` - Sales transaction processing
- `server/src/utils/accountingInitializer.js` - Automatic accounting setup

#### 3. Sales & Shipping Management
- **Invoice Types**: Sales invoices, shipping invoices, purchase invoices
- **Customer Management**: Automatic account creation for new customers
- **Supplier Integration**: China-Libya shipping route management
- **Document Generation**: PDF generation for invoices and reports

#### 4. Real-time Features
- **WebSocket Integration**: Real-time notifications and updates
- **Cache Layer**: Redis-based caching for performance (optional)
- **Background Jobs**: Automated accounting processes and notifications

### Database Architecture

**Primary Database**: PostgreSQL on cloud (72.60.92.146:5432)

**Key Model Relationships**:
```javascript
// Core accounting models
AccountMapping → Accounts (many-to-one)
JournalEntry → JournalEntryDetails (one-to-many)
SalesInvoice → JournalEntry (one-to-one, auto-created)

// Business models
Customer → Account (one-to-one, auto-created)
SalesInvoice → Customer (many-to-one)
Shipment → SalesInvoice (one-to-one)
```

**Critical Tables**:
- `account_mappings` - Accounting configuration (must have active mapping)
- `accounts` - Chart of accounts with real-time balances
- `journal_entries` / `gl_entries` - Double-entry bookkeeping
- `sales_invoices` - Sales transactions
- `customers` - Customer management with auto-account creation

## Development Guidelines

### Accounting Engine Rules
1. **Never skip journal entries** - All financial transactions must create corresponding journal entries
2. **Account mapping required** - System requires active AccountMapping before processing invoices
3. **Transaction consistency** - Use database transactions for all multi-table operations
4. **Balance integrity** - Account balances must always match GL entries sum

### API Development Patterns
```javascript
// Standard error handling pattern for financial operations
try {
  await sequelize.transaction(async (transaction) => {
    // 1. Create business record
    const invoice = await SalesInvoice.create(data, { transaction });
    
    // 2. MUST create journal entry (don't catch and ignore)
    await invoice.createJournalEntryAndAffectBalance(userId, { transaction });
    
    // 3. Update related balances
    await updateCustomerBalance(customerId, amount, { transaction });
  });
} catch (error) {
  // Let accounting errors bubble up - don't silently fail
  throw new Error(`Financial operation failed: ${error.message}`);
}
```

### Client-Side Architecture
- **Context-based State**: Authentication and global state via React Context
- **Service Layer**: Centralized API calls in `services/` directory
- **Component Structure**: Atomic design with reusable components
- **RTL Support**: All layouts must work in both RTL (Arabic) and LTR (English)

### Environment Configuration

**Required Environment Variables**:
```bash
# Database (required for production)
DATABASE_URL=postgresql://user:pass@host:port/dbname
# OR individual DB_* variables

# JWT Security (required)
JWT_SECRET=your_secure_jwt_secret
JWT_REFRESH_SECRET=your_secure_refresh_secret

# Optional enhancements
REDIS_HOST=localhost          # For caching
REDIS_PORT=6379
```

### Testing Strategy
- **Server Tests**: Mocha + Chai + Supertest for API testing
- **Database Tests**: Separate test database for isolation
- **Financial Tests**: Specialized tests for accounting integrity
- **Client Tests**: Component and integration testing

## Common Workflows

### Adding New Financial Transaction Types
1. Create new model extending base financial model
2. Add corresponding route with validation
3. Implement journal entry creation logic
4. Add tests for accounting integrity
5. Update AccountMapping if needed

### Debugging Accounting Issues
```bash
# Check system health
curl http://localhost:5001/api/financial/system-health

# Verify account mapping
npm run check-db

# Check journal entries for specific invoice
# Use database queries in ACCOUNTING_ENGINE_AUDIT.md
```

### Setting Up New Development Environment
1. Run `npm run install-all`
2. Set up PostgreSQL database
3. Run database setup: `npm run setup-db`
4. Configure environment variables
5. Start development: `npm run dev`
6. Verify accounting system: `/api/financial/system-health`

## Key Files for AI Agents

**Critical Business Logic**:
- `server/src/models/SalesInvoice.js` - Core sales processing
- `server/src/models/AccountMapping.js` - Accounting configuration
- `server/src/utils/accountingInitializer.js` - System initialization

**API Routes**:
- `server/src/routes/sales.js` - Sales operations
- `server/src/routes/financial.js` - Financial reports and operations
- `server/src/routes/accounting.js` - Accounting management

**Database Scripts**:
- `database_setup.sql` - Complete database setup
- `QUICK_START.md` - Step-by-step setup guide
- `ACCOUNTING_ENGINE_AUDIT.md` - Troubleshooting guide

**Deployment**:
- `docker-compose.yml` - Local development environment
- `.coolify.yml` - Production deployment configuration
- `Dockerfile` - Container configuration

## Project-Specific Notes

### Accounting System Status
- **Current State**: Functional but requires proper initialization
- **Critical Requirement**: AccountMapping must exist and be active
- **Auto-initialization**: System creates required accounts on startup
- **Error Handling**: Financial operations fail fast if accounting setup is incomplete

### Known Issues & Fixes
- **Issue**: Silent journal entry failures in sales invoices
- **Fix**: Remove try-catch blocks around `createJournalEntryAndAffectBalance`
- **Status**: Fixed in codebase, documented in `PHASE_2_FIX_SUMMARY.md`

### International Shipping Features
- **Route Focus**: China → Libya shipping operations
- **Multi-currency**: LYD (Libyan Dinar), USD, CNY support
- **Customs Integration**: Customs clearance workflow (planned)
- **Document Management**: International shipping documentation

### Performance Considerations
- **Database Indexing**: Optimized indexes for financial queries
- **Caching Strategy**: Redis-based caching for reports (optional)
- **WebSocket Usage**: Real-time updates for dashboard and notifications
- **File Upload**: Multer-based document management

This system is designed for high-volume international shipping operations with strict accounting compliance requirements.