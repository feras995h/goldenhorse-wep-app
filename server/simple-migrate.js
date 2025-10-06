import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// قراءة ملف .env يدوياً
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  });
}

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║              تطبيق الإصلاحات - Golden Horse                   ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// إعدادات الاتصال
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'golden_horse',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || ''
};

console.log('📝 إعدادات الاتصال:');
console.log(`   المضيف: ${dbConfig.host}`);
console.log(`   المنفذ: ${dbConfig.port}`);
console.log(`   قاعدة البيانات: ${dbConfig.database}`);
console.log(`   المستخدم: ${dbConfig.user}\n`);

const client = new pg.Client(dbConfig);

async function executeMigration() {
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    await client.connect();
    console.log('✓ تم الاتصال بنجاح\n');

    // التحقق من جدول SequelizeMeta
    const metaTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'SequelizeMeta'
      )
    `);

    if (!metaTableCheck.rows[0].exists) {
      console.log('📝 إنشاء جدول SequelizeMeta...');
      await client.query(`
        CREATE TABLE "SequelizeMeta" (
          name VARCHAR(255) NOT NULL PRIMARY KEY
        )
      `);
    }

    // قراءة الهجرات المطبقة
    const appliedResult = await client.query('SELECT name FROM "SequelizeMeta" ORDER BY name');
    const appliedNames = new Set(appliedResult.rows.map(r => r.name));

    console.log(`📋 الهجرات المطبقة: ${appliedNames.size}`);
    if (appliedNames.size > 0) {
      appliedNames.forEach(name => console.log(`   ✓ ${name}`));
    }
    console.log('');

    const migrations = [
      {
        name: '20251005000001-create-missing-tables.js',
        description: 'إنشاء الجداول المفقودة'
      },
      {
        name: '20251005000002-add-missing-fields.js',
        description: 'إضافة الحقول المفقودة'
      }
    ];

    for (const migration of migrations) {
      if (appliedNames.has(migration.name)) {
        console.log(`⏭️  تخطي ${migration.name} (مطبقة مسبقاً)\n`);
        continue;
      }

      console.log('='.repeat(80));
      console.log(`🚀 ${migration.description}`);
      console.log(`   الملف: ${migration.name}`);
      console.log('='.repeat(80));

      try {
        await client.query('BEGIN');

        // تحميل وتنفيذ الهجرة
        const migrationPath = 'file:///' + path.join(__dirname, 'src', 'migrations', migration.name).replace(/\\/g, '/');
        const migrationModule = await import(migrationPath);
        
        // إنشاء queryInterface مبسط
        const queryInterface = {
          sequelize: { query: (sql, options) => client.query(sql) },
          createTable: async (tableName, attributes, options) => {
            const columns = Object.entries(attributes).map(([name, attr]) => {
              let def = `"${name}" `;
              
              if (attr.type.key === 'UUID') def += 'UUID';
              else if (attr.type.key === 'STRING') def += `VARCHAR(${attr.type._length || 255})`;
              else if (attr.type.key === 'TEXT') def += 'TEXT';
              else if (attr.type.key === 'INTEGER') def += 'INTEGER';
              else if (attr.type.key === 'DECIMAL') def += `DECIMAL(${attr.type._precision || 10}, ${attr.type._scale || 2})`;
              else if (attr.type.key === 'DATE') def += 'TIMESTAMP';
              else if (attr.type.key === 'BOOLEAN') def += 'BOOLEAN';
              else if (attr.type.key === 'ENUM') def += `VARCHAR(50)`;
              else if (attr.type.key === 'JSONB') def += 'JSONB';
              else def += 'TEXT';
              
              if (attr.primaryKey) def += ' PRIMARY KEY';
              if (attr.allowNull === false && !attr.primaryKey) def += ' NOT NULL';
              if (attr.unique) def += ' UNIQUE';
              if (attr.defaultValue !== undefined) {
                if (typeof attr.defaultValue === 'string') {
                  def += ` DEFAULT '${attr.defaultValue}'`;
                } else if (typeof attr.defaultValue === 'boolean') {
                  def += ` DEFAULT ${attr.defaultValue}`;
                } else if (typeof attr.defaultValue === 'number') {
                  def += ` DEFAULT ${attr.defaultValue}`;
                } else if (attr.defaultValue && attr.defaultValue.val === 'gen_random_uuid()') {
                  def += ' DEFAULT gen_random_uuid()';
                } else if (attr.defaultValue && attr.defaultValue.val === 'CURRENT_TIMESTAMP') {
                  def += ' DEFAULT CURRENT_TIMESTAMP';
                }
              }
              
              return def;
            });
            
            const sql = `CREATE TABLE IF NOT EXISTS "${tableName}" (${columns.join(', ')})`;
            await client.query(sql);
          },
          addColumn: async (tableName, columnName, attributes) => {
            let def = '';
            
            if (attributes.type.key === 'UUID') def = 'UUID';
            else if (attributes.type.key === 'STRING') def = `VARCHAR(${attributes.type._length || 255})`;
            else if (attributes.type.key === 'TEXT') def = 'TEXT';
            else if (attributes.type.key === 'INTEGER') def = 'INTEGER';
            else if (attributes.type.key === 'DECIMAL') def = `DECIMAL(${attributes.type._precision || 10}, ${attributes.type._scale || 2})`;
            else if (attributes.type.key === 'DATE') def = 'TIMESTAMP';
            else if (attributes.type.key === 'BOOLEAN') def = 'BOOLEAN';
            else if (attributes.type.key === 'ENUM') def = 'VARCHAR(50)';
            else def = 'TEXT';
            
            if (attributes.defaultValue !== undefined) {
              if (typeof attributes.defaultValue === 'string') {
                def += ` DEFAULT '${attributes.defaultValue}'`;
              } else if (typeof attributes.defaultValue === 'boolean') {
                def += ` DEFAULT ${attributes.defaultValue}`;
              } else if (typeof attributes.defaultValue === 'number') {
                def += ` DEFAULT ${attributes.defaultValue}`;
              }
            }
            
            const sql = `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${columnName}" ${def}`;
            await client.query(sql);
          },
          addIndex: async (tableName, columns, options) => {
            const indexName = `${tableName}_${Array.isArray(columns) ? columns.join('_') : columns}_idx`;
            const cols = Array.isArray(columns) ? columns.map(c => `"${c}"`).join(', ') : `"${columns}"`;
            const sql = `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" (${cols})`;
            await client.query(sql);
          },
          describeTable: async (tableName) => {
            const result = await client.query(`
              SELECT column_name, data_type, is_nullable, column_default
              FROM information_schema.columns
              WHERE table_name = $1 AND table_schema = 'public'
            `, [tableName]);
            
            const columns = {};
            result.rows.forEach(row => {
              columns[row.column_name] = {
                type: row.data_type,
                allowNull: row.is_nullable === 'YES',
                defaultValue: row.column_default
              };
            });
            return columns;
          },
          renameColumn: async (tableName, oldName, newName) => {
            const sql = `ALTER TABLE "${tableName}" RENAME COLUMN "${oldName}" TO "${newName}"`;
            await client.query(sql);
          }
        };

        const Sequelize = {
          DataTypes: {
            UUID: { key: 'UUID' },
            UUIDV4: { val: 'gen_random_uuid()' },
            STRING: (length) => ({ key: 'STRING', _length: length }),
            TEXT: { key: 'TEXT' },
            INTEGER: { key: 'INTEGER' },
            DECIMAL: (precision, scale) => ({ key: 'DECIMAL', _precision: precision, _scale: scale }),
            DATE: { key: 'DATE' },
            BOOLEAN: { key: 'BOOLEAN' },
            ENUM: (...values) => ({ key: 'ENUM', values }),
            JSONB: { key: 'JSONB' },
            NOW: { val: 'CURRENT_TIMESTAMP' }
          },
          QueryTypes: { INSERT: 'INSERT' },
          literal: (val) => ({ val })
        };

        await migrationModule.default.up(queryInterface, Sequelize);

        // تسجيل الهجرة
        await client.query('INSERT INTO "SequelizeMeta" (name) VALUES ($1)', [migration.name]);

        await client.query('COMMIT');
        console.log(`✅ نجح تطبيق ${migration.name}\n`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ فشل ${migration.name}:`);
        console.error(error.message);
        throw error;
      }
    }

    console.log('='.repeat(80));
    console.log('✅ اكتملت جميع الإصلاحات بنجاح!');
    console.log('='.repeat(80));

    // عرض الإحصائيات
    const tableCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    console.log(`\n📊 إجمالي الجداول: ${tableCount.rows[0].count}`);
    console.log('\n🔍 للتحقق من النتائج:');
    console.log('   node comprehensive-database-check.js\n');

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

executeMigration();
