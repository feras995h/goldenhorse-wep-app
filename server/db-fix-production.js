const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🔧 Production Database Fix Script');
console.log('==================================');

// Try multiple database connection options
const connectionOptions = [
  'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping',
  'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres',
  process.env.DATABASE_URL
].filter(Boolean);

async function testConnection(url) {
  const sequelize = new Sequelize(url, {
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

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    return sequelize;
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    await sequelize.close();
    return null;
  }
}

async function fixDatabaseSchema(sequelize) {
  try {
    console.log('\n🔍 Checking database schema...');
    
    // Get all tables in the database
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`📊 Found ${tables.length} tables in database`);
    tables.forEach(table => console.log(`  - ${table.table_name}`));
    
    // Check for missing tables that should exist
    const expectedTables = [
      'users', 'accounts', 'customers', 'shipments', 'notifications', 
      'settings', 'journal_entries', 'gl_entries', 'fixed_assets'
    ];
    
    const existingTableNames = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(t => !existingTableNames.includes(t));
    
    if (missingTables.length > 0) {
      console.log(`\n⚠️  Missing tables: ${missingTables.join(', ')}`);
      console.log('   This might explain the application errors.');
    }
    
    // List of tables that should have createdBy column
    const tablesNeedingCreatedBy = [
      'shipments', 'notifications', 'settings', 'fixed_assets',
      'journal_entries', 'gl_entries', 'customers', 'accounts'
    ];
    
    console.log('\n🔍 Checking for missing createdBy columns...');
    
    const missingColumns = [];
    
    for (const tableName of tablesNeedingCreatedBy) {
      try {
        // Check if table exists
        const tableExists = existingTableNames.includes(tableName);
        if (!tableExists) {
          console.log(`⚠️  Table ${tableName} does not exist, skipping...`);
          continue;
        }
        
        // Check if createdBy column exists
        const [columnExists] = await sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}' 
          AND column_name = 'createdBy'
        `);
        
        if (columnExists.length === 0) {
          missingColumns.push(tableName);
          console.log(`❌ Table ${tableName} is missing createdBy column`);
        } else {
          console.log(`✅ Table ${tableName} has createdBy column`);
        }
        
      } catch (error) {
        console.log(`❌ Error checking ${tableName}: ${error.message}`);
      }
    }
    
    // Fix missing columns
    if (missingColumns.length > 0) {
      console.log(`\n🔧 Adding createdBy columns to ${missingColumns.length} tables...`);
      
      for (const tableName of missingColumns) {
        try {
          await sequelize.query(`
            ALTER TABLE "${tableName}" 
            ADD COLUMN "createdBy" UUID REFERENCES users(id)
          `);
          console.log(`✅ Added createdBy column to ${tableName}`);
        } catch (error) {
          console.log(`❌ Failed to add createdBy to ${tableName}: ${error.message}`);
        }
      }
    } else {
      console.log('\n✅ All tables already have createdBy columns');
    }
    
    // Test basic functionality
    console.log('\n🧪 Testing basic database operations...');
    
    try {
      const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM users');
      console.log(`✅ Users table accessible: ${userCount[0].count} users`);
    } catch (error) {
      console.log(`❌ Users table test failed: ${error.message}`);
    }
    
    try {
      const [accountCount] = await sequelize.query('SELECT COUNT(*) as count FROM accounts');
      console.log(`✅ Accounts table accessible: ${accountCount[0].count} accounts`);
    } catch (error) {
      console.log(`❌ Accounts table test failed: ${error.message}`);
    }
    
    console.log('\n🎉 Database schema fix completed!');
    
  } catch (error) {
    console.error('❌ Error during schema fix:', error.message);
  }
}

async function main() {
  console.log('🔍 Testing database connections...\n');
  
  let workingConnection = null;
  
  for (let i = 0; i < connectionOptions.length; i++) {
    const url = connectionOptions[i];
    console.log(`Testing connection ${i + 1}/${connectionOptions.length}:`);
    console.log(`URL: ${url?.replace(/:[^:@]*@/, ':***@')}`);
    
    const sequelize = await testConnection(url);
    if (sequelize) {
      workingConnection = sequelize;
      break;
    }
    console.log('');
  }
  
  if (!workingConnection) {
    console.log('❌ No working database connection found.');
    console.log('\nPossible solutions:');
    console.log('1. Check if the database server is running');
    console.log('2. Verify network connectivity to 72.60.92.146:5432');
    console.log('3. Confirm database credentials are correct');
    console.log('4. Check if firewall is blocking the connection');
    process.exit(1);
  }
  
  await fixDatabaseSchema(workingConnection);
  await workingConnection.close();
  console.log('\n🔒 Database connection closed');
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});