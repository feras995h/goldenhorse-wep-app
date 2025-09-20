import { Client } from 'pg';

async function analyzeDatabaseStructure() {
  const client = new Client({
    connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
  });

  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Get database basic info
    console.log('📊 DATABASE OVERVIEW');
    console.log('==================');
    
    const dbInfo = await client.query(`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version
    `);
    
    console.log(`Database: ${dbInfo.rows[0].database_name}`);
    console.log(`User: ${dbInfo.rows[0].current_user}`);
    console.log(`PostgreSQL Version: ${dbInfo.rows[0].postgres_version.split(' ')[1]}\n`);

    // Get all tables
    console.log('📋 TABLES STRUCTURE');
    console.log('=================');
    
    const tables = await client.query(`
      SELECT 
        table_name, 
        table_type,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log(`Total Tables: ${tables.rows.length}\n`);
    
    for (const table of tables.rows) {
      console.log(`📌 ${table.table_name} (${table.column_count} columns)`);
    }

    // Get detailed structure for key tables
    console.log('\n🔍 KEY TABLES ANALYSIS');
    console.log('====================');
    
    const keyTables = ['accounts', 'customers', 'invoices', 'receipts', 'gl_entries', 'journal_entries'];
    
    for (const tableName of keyTables) {
      try {
        console.log(`\n📊 ${tableName.toUpperCase()}`);
        console.log('-'.repeat(50));
        
        // Get table structure
        const structure = await client.query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [tableName]);

        // Get row count
        const count = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`Records: ${count.rows[0].count}`);
        
        console.log('Columns:');
        structure.rows.forEach(col => {
          const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`  • ${col.column_name}: ${col.data_type}${length} ${nullable}${defaultVal}`);
        });

      } catch (error) {
        console.log(`  ⚠️ Table ${tableName} not found or error: ${error.message}`);
      }
    }

    // Database statistics
    console.log('\n📈 DATABASE STATISTICS');
    console.log('====================');
    
    const stats = await client.query(`
      SELECT 
        schemaname,
        tablename,
        attname as column_name,
        n_distinct,
        most_common_vals,
        most_common_freqs
      FROM pg_stats 
      WHERE schemaname = 'public' 
      AND tablename IN ('accounts', 'customers', 'invoices', 'receipts')
      ORDER BY tablename, attname
      LIMIT 20
    `);

    console.log('Column Statistics (sample):');
    stats.rows.forEach(stat => {
      console.log(`  ${stat.tablename}.${stat.column_name}: ${stat.n_distinct} distinct values`);
    });

    // Check indexes
    console.log('\n🗂️ INDEXES');
    console.log('=========');
    
    const indexes = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    console.log(`Total Indexes: ${indexes.rows.length}`);
    indexes.rows.forEach(idx => {
      console.log(`  ${idx.tablename}: ${idx.indexname}`);
    });

    // Check foreign keys
    console.log('\n🔗 FOREIGN KEY RELATIONSHIPS');
    console.log('===========================');
    
    const foreignKeys = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name
    `);

    console.log(`Foreign Key Relationships: ${foreignKeys.rows.length}`);
    foreignKeys.rows.forEach(fk => {
      console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });

  } catch (error) {
    console.error('❌ Database analysis error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the analysis
analyzeDatabaseStructure().catch(console.error);