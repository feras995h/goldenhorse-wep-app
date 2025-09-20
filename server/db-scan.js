import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🔍 Comprehensive Database Scan');
console.log('==============================');

// Production database connection
const databaseUrl = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false,
    connectTimeout: 10000
  },
  pool: {
    max: 1,
    min: 0,
    acquire: 10000,
    idle: 10000
  }
});

async function scanDatabase() {
  try {
    console.log('🔌 Connecting to production database...');
    await sequelize.authenticate();
    console.log('✅ Connection successful\\n');

    // 1. Get all existing tables
    console.log('📋 Scanning existing tables...');
    const [existingTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const existingTableNames = existingTables.map(t => t.table_name);
    console.log(`Found ${existingTableNames.length} tables in database:`);
    existingTableNames.forEach(name => console.log(`  ✓ ${name}`));

    // 2. Expected tables based on application models
    const criticalTables = [
      'users', 'accounts', 'customers', 'shipments', 'notifications',
      'settings', 'journal_entries', 'gl_entries', 'fixed_assets',
      'sales_invoices', 'sales_invoice_items', 'payments', 'receipts'
    ];

    console.log('\\n🔍 Checking critical tables...');
    const missingCritical = criticalTables.filter(table => !existingTableNames.includes(table));
    
    if (missingCritical.length > 0) {
      console.log(`❌ Missing ${missingCritical.length} critical tables:`);
      missingCritical.forEach(table => console.log(`  ❌ ${table}`));
    } else {
      console.log('✅ All critical tables are present');
    }

    // 3. Check critical columns in key tables
    console.log('\\n🔍 Checking critical columns...');
    
    const criticalColumns = {
      'users': ['id', 'username', 'email', 'password', 'role'],
      'accounts': ['id', 'code', 'name', 'type', 'createdBy'],
      'customers': ['id', 'code', 'name', 'createdBy'],
      'shipments': ['id', 'trackingNumber', 'customerId', 'createdBy'],
      'notifications': ['id', 'title', 'message', 'userId', 'createdBy'],
      'settings': ['id', 'key', 'value', 'createdBy']
    };

    const columnIssues = [];

    for (const [tableName, requiredColumns] of Object.entries(criticalColumns)) {
      if (!existingTableNames.includes(tableName)) {
        continue;
      }

      try {
        const [columns] = await sequelize.query(`
          SELECT column_name
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = '${tableName}';
        `);

        const existingColumns = columns.map(c => c.column_name);
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

        if (missingColumns.length > 0) {
          columnIssues.push({ table: tableName, missing: missingColumns });
          console.log(`  ❌ ${tableName}: Missing columns: ${missingColumns.join(', ')}`);
        } else {
          console.log(`  ✅ ${tableName}: All critical columns present`);
        }
      } catch (error) {
        console.log(`  ❌ Error checking ${tableName}: ${error.message}`);
      }
    }

    // 4. Check data counts
    console.log('\\n📊 Checking data counts...');
    const emptyCriticalTables = [];

    for (const tableName of criticalTables) {
      if (!existingTableNames.includes(tableName)) continue;

      try {
        const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const count = parseInt(countResult[0].count);
        
        if (count === 0) {
          emptyCriticalTables.push(tableName);
          console.log(`  ⚠️  ${tableName}: EMPTY (0 records)`);
        } else {
          console.log(`  ✅ ${tableName}: ${count} records`);
        }
      } catch (error) {
        console.log(`  ❌ ${tableName}: Error counting - ${error.message}`);
      }
    }

    // 5. Check foreign key integrity for shipments
    console.log('\\n🔗 Checking shipments integrity...');
    
    if (existingTableNames.includes('shipments') && existingTableNames.includes('customers')) {
      try {
        const [orphanedShipments] = await sequelize.query(`
          SELECT COUNT(*) as count 
          FROM shipments s 
          LEFT JOIN customers c ON s."customerId" = c.id 
          WHERE c.id IS NULL AND s."customerId" IS NOT NULL
        `);
        
        const orphanCount = parseInt(orphanedShipments[0].count);
        if (orphanCount > 0) {
          console.log(`  ❌ Found ${orphanCount} shipments with invalid customer references`);
        } else {
          console.log(`  ✅ All shipments have valid customer references`);
        }
      } catch (error) {
        console.log(`  ⚠️  Cannot check shipment integrity: ${error.message}`);
      }
    }

    // 6. Check authentication setup
    console.log('\\n🔐 Checking authentication setup...');
    
    if (existingTableNames.includes('users')) {
      try {
        const [adminUsers] = await sequelize.query(`
          SELECT COUNT(*) as count FROM users WHERE role = 'admin'
        `);
        
        const adminCount = parseInt(adminUsers[0].count);
        if (adminCount === 0) {
          console.log(`  ❌ No admin users found - authentication may fail`);
        } else {
          console.log(`  ✅ Found ${adminCount} admin users`);
        }
      } catch (error) {
        console.log(`  ⚠️  Cannot check admin users: ${error.message}`);
      }
    }

    // 7. Summary and recommendations
    console.log('\\n📋 SCAN SUMMARY');
    console.log('===============');
    
    const issues = [];
    
    if (missingCritical.length > 0) {
      issues.push(`${missingCritical.length} missing critical tables`);
    }
    
    if (columnIssues.length > 0) {
      issues.push(`${columnIssues.length} tables with missing columns`);
    }
    
    if (emptyCriticalTables.length > 0) {
      issues.push(`${emptyCriticalTables.length} empty critical tables`);
    }

    console.log(`✅ Database connection: SUCCESS`);
    console.log(`📊 Total tables: ${existingTableNames.length}`);
    console.log(`🔑 Critical tables present: ${criticalTables.length - missingCritical.length}/${criticalTables.length}`);
    
    if (issues.length === 0) {
      console.log('\\n🎉 DATABASE STATUS: HEALTHY ✅');
      console.log('The database appears to be properly configured for the application.');
    } else {
      console.log('\\n⚠️  DATABASE STATUS: ISSUES DETECTED');
      issues.forEach(issue => console.log(`- ${issue}`));
      
      console.log('\\n🔧 RECOMMENDATIONS:');
      if (missingCritical.length > 0) {
        console.log('1. Run database migration to create missing tables');
      }
      if (columnIssues.length > 0) {
        console.log('2. Add missing columns to existing tables');
      }
      if (emptyCriticalTables.includes('users')) {
        console.log('3. Create initial admin user for authentication');
      }
      if (emptyCriticalTables.includes('accounts')) {
        console.log('4. Initialize chart of accounts for financial operations');
      }
    }

  } catch (error) {
    console.error('❌ Database scan failed:', error.message);
  } finally {
    await sequelize.close();
    console.log('\\n🔒 Database connection closed');
  }
}

scanDatabase();