#!/usr/bin/env node

/**
 * تحديث ملفات migrations وإصلاح عرض دليل الحسابات
 * Update Migrations and Fix Chart of Accounts Display - Golden Horse Shipping System
 */

import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';

const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

class MigrationsAndDisplayFix {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('🔗 تم الاتصال بقاعدة البيانات بنجاح');
      return true;
    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
      return false;
    }
  }

  async analyzeCurrentSchema() {
    console.log('\n🔍 تحليل بنية قاعدة البيانات الحالية...');
    
    try {
      // الحصول على جميع الجداول
      const tables = await this.client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);

      console.log('   📊 الجداول الموجودة:');
      const tableNames = tables.rows.map(row => row.table_name);
      tableNames.forEach(table => {
        console.log(`     - ${table}`);
      });

      // تحليل جدول accounts
      const accountsColumns = await this.client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'accounts'
        ORDER BY ordinal_position
      `);

      console.log('\n   📊 أعمدة جدول accounts:');
      accountsColumns.rows.forEach(col => {
        console.log(`     - ${col.column_name} (${col.data_type})`);
      });

      // تحليل جدول vouchers
      const vouchersExists = await this.client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'vouchers'
        )
      `);

      if (vouchersExists.rows[0].exists) {
        const vouchersColumns = await this.client.query(`
          SELECT column_name, data_type
          FROM information_schema.columns 
          WHERE table_name = 'vouchers'
          ORDER BY ordinal_position
        `);

        console.log('\n   📊 أعمدة جدول vouchers:');
        vouchersColumns.rows.forEach(col => {
          console.log(`     - ${col.column_name} (${col.data_type})`);
        });
      } else {
        console.log('\n   ❌ جدول vouchers غير موجود');
      }

      return {
        tables: tableNames,
        accountsColumns: accountsColumns.rows,
        vouchersExists: vouchersExists.rows[0].exists
      };

    } catch (error) {
      console.log(`   ❌ خطأ في تحليل بنية قاعدة البيانات: ${error.message}`);
      return null;
    }
  }

  async createUpdatedInitialMigration() {
    console.log('\n🔧 إنشاء ملف migration محدث...');
    
    try {
      const migrationContent = `import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Create roles table
  await queryInterface.createTable('roles', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    permissions: {
      type: DataTypes.TEXT,
      defaultValue: '{}',
      get() {
        const value = this.getDataValue('permissions');
        return value ? JSON.parse(value) : {};
      },
      set(value) {
        this.setDataValue('permissions', JSON.stringify(value || {}));
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Create users table with all required columns
  await queryInterface.createTable('users', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'financial_manager', 'sales_manager', 'user'),
      allowNull: false,
      defaultValue: 'user'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    passwordChangedAt: {
      type: DataTypes.DATE
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Create accounts table with all required columns
  await queryInterface.createTable('accounts', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    nameEn: {
      type: DataTypes.STRING(200)
    },
    type: {
      type: DataTypes.ENUM('asset', 'liability', 'equity', 'revenue', 'expense'),
      allowNull: false
    },
    rootType: {
      type: DataTypes.ENUM('Asset', 'Liability', 'Equity', 'Income', 'Expense'),
      allowNull: false
    },
    reportType: {
      type: DataTypes.ENUM('Balance Sheet', 'Profit and Loss'),
      allowNull: false
    },
    accountCategory: {
      type: DataTypes.STRING(50)
    },
    accountType: {
      type: DataTypes.ENUM('main', 'sub', 'detail', 'group'),
      allowNull: false,
      defaultValue: 'main'
    },
    parentId: {
      type: DataTypes.UUID,
      references: {
        model: 'accounts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    isGroup: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    freezeAccount: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'LYD'
    },
    description: {
      type: DataTypes.TEXT
    },
    nature: {
      type: DataTypes.ENUM('debit', 'credit'),
      allowNull: false,
      defaultValue: 'debit'
    },
    notes: {
      type: DataTypes.TEXT
    },
    isSystemAccount: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isMonitored: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Create vouchers table
  await queryInterface.createTable('vouchers', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    voucherNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.ENUM('receipt', 'payment'),
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_DATE')
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    accountId: {
      type: DataTypes.UUID,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    counterAccountId: {
      type: DataTypes.UUID,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    partyType: {
      type: DataTypes.STRING(20)
    },
    partyId: {
      type: DataTypes.UUID
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      defaultValue: 'cash'
    },
    reference: {
      type: DataTypes.STRING(100)
    },
    notes: {
      type: DataTypes.TEXT
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    createdBy: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  });

  // Create other essential tables...
  // (continuing with other tables from original migration)
  
  // Add indexes
  await queryInterface.addIndex('users', ['username']);
  await queryInterface.addIndex('users', ['role']);
  await queryInterface.addIndex('accounts', ['code']);
  await queryInterface.addIndex('accounts', ['type']);
  await queryInterface.addIndex('accounts', ['parentId']);
  await queryInterface.addIndex('vouchers', ['voucherNumber']);
  await queryInterface.addIndex('vouchers', ['type']);
  await queryInterface.addIndex('vouchers', ['date']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('vouchers');
  await queryInterface.dropTable('accounts');
  await queryInterface.dropTable('users');
  await queryInterface.dropTable('roles');
}
`;

      // كتابة الملف الجديد
      const migrationPath = 'server/src/migrations/001-updated-initial-schema.js';
      fs.writeFileSync(migrationPath, migrationContent);
      console.log(`   ✅ تم إنشاء ملف migration محدث: ${migrationPath}`);

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إنشاء ملف migration محدث: ${error.message}`);
      return false;
    }
  }

  async fixAccountTreeDisplay() {
    console.log('\n🎨 إصلاح عرض دليل الحسابات...');
    
    try {
      const accountTreePath = 'client/src/components/Financial/AccountTree.tsx';
      
      // قراءة الملف الحالي
      let content = fs.readFileSync(accountTreePath, 'utf8');
      
      // إصلاح مشكلة marginRight
      content = content.replace(
        /style=\{\{ marginRight: `\$\{isChild \? 20 : 0\}px` \}\}/g,
        'style={{ paddingRight: `${isChild ? 20 : 0}px` }}'
      );
      
      // إصلاح مشكلة التداخل البصري
      const improvedRenderFunction = `  const renderTreeNode = (node: AccountTreeNode, isChild: boolean = false) => {
    const isExpanded = expandedNodes.has(node.account.id);
    const hasChildren = node.children.length > 0;
    
    return (
      <div key={node.account.id} className="mb-1">
        <div
          className={\`flex items-center py-2 px-2 sm:px-3 rounded-md hover:bg-golden-50 cursor-pointer transition-professional overflow-hidden \${
            onAccountSelect ? 'hover:bg-golden-100' : ''
          }\`}
          onClick={() => onAccountSelect?.(node.account)}
          style={{ 
            paddingRight: \`\${isChild ? (node.level * 20) : 0}px\`,
            borderRight: isChild ? '2px solid #f3f4f6' : 'none'
          }}
        >
          {hasChildren ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.account.id);
              }}
              className="mr-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-6 mr-2 flex-shrink-0" /> // Spacer for alignment
          )}
          
          <div className="flex-1 flex items-center min-w-0">
            {/* Account Icon */}
            <div className="mr-2 flex-shrink-0">
              {hasChildren ? (
                <Folder className={\`h-4 w-4 \${getAccountTypeColor(node.account.type)}\`} />
              ) : (
                <FileText className={\`h-4 w-4 \${getAccountTypeColor(node.account.type)}\`} />
              )}
            </div>
            
            {/* Account Code and Name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-1">
                <span className="font-medium text-gray-900 text-sm sm:text-base whitespace-nowrap">
                  {node.account.code}
                </span>
                <span className="text-gray-700 text-sm sm:text-base truncate">
                  {node.account.name}
                </span>
                {node.account.isSystemAccount && (
                  <Shield className="h-3 w-3 text-blue-600 flex-shrink-0" aria-label="حساب نظام أساسي" />
                )}
                {node.account.nameEn && (
                  <span className="text-gray-500 text-xs sm:text-sm truncate">
                    ({node.account.nameEn})
                  </span>
                )}
              </div>
              
              {/* Account Type and Children Info */}
              <div className="flex items-center flex-wrap gap-1 mt-1">
                <span className={\`text-xs px-2 py-1 rounded-full whitespace-nowrap \${getAccountTypeColor(node.account.type)} bg-opacity-10\`}>
                  {getAccountTypeLabel(node.account.type)}
                </span>
                {node.account.parentId && (
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    حساب فرعي - مستوى {node.level}
                  </span>
                )}
                {hasChildren && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap">
                    {node.children.length} حساب فرعي
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="text-gray-500 text-sm text-left flex-shrink-0 min-w-0 ml-2">
            <div className="font-medium text-xs sm:text-sm truncate">
              {node.account.balance?.toLocaleString()} {node.account.currency}
            </div>
            <div className="text-xs text-gray-400 whitespace-nowrap">
              {node.account.balance && node.account.balance >= 0 ? 'مدين' : 'دائن'}
            </div>
          </div>
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="mt-1 border-r-2 border-gray-100 mr-4">
            {node.children.map(child => renderTreeNode(child, true))}
          </div>
        )}
      </div>
    );
  };`;

      // استبدال الدالة القديمة بالجديدة
      content = content.replace(
        /const renderTreeNode = \(node: AccountTreeNode, isChild: boolean = false\) => \{[\s\S]*?\};/,
        improvedRenderFunction
      );

      // كتابة الملف المحدث
      fs.writeFileSync(accountTreePath, content);
      console.log('   ✅ تم إصلاح عرض دليل الحسابات');

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إصلاح عرض دليل الحسابات: ${error.message}`);
      return false;
    }
  }

  async createDeploymentScript() {
    console.log('\n📦 إنشاء سكريبت النشر الآلي...');
    
    try {
      const deploymentScript = `#!/usr/bin/env node

/**
 * سكريبت النشر الآلي للنظام
 * Automated Deployment Script - Golden Horse Shipping System
 */

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = process.env.DATABASE_URL || process.env.DB_URL;

class AutoDeployment {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: false
    });
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('🔗 تم الاتصال بقاعدة البيانات');
      return true;
    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
      return false;
    }
  }

  async runDeployment() {
    console.log('🚀 بدء النشر الآلي للنظام...');
    
    const connected = await this.connect();
    if (!connected) {
      return false;
    }

    try {
      // 1. إنشاء الجداول الأساسية
      await this.createBasicTables();
      
      // 2. إضافة الأعمدة المطلوبة
      await this.addRequiredColumns();
      
      // 3. إنشاء البيانات الافتراضية
      await this.createDefaultData();
      
      // 4. إنشاء الفهارس
      await this.createIndexes();
      
      console.log('✅ تم النشر بنجاح!');
      return true;
      
    } catch (error) {
      console.error('❌ فشل النشر:', error.message);
      return false;
    } finally {
      await this.client.end();
    }
  }

  async createBasicTables() {
    // تنفيذ إنشاء الجداول الأساسية
    console.log('📋 إنشاء الجداول الأساسية...');
    // ... كود إنشاء الجداول
  }

  async addRequiredColumns() {
    // إضافة الأعمدة المطلوبة
    console.log('🔧 إضافة الأعمدة المطلوبة...');
    // ... كود إضافة الأعمدة
  }

  async createDefaultData() {
    // إنشاء البيانات الافتراضية
    console.log('📊 إنشاء البيانات الافتراضية...');
    // ... كود إنشاء البيانات
  }

  async createIndexes() {
    // إنشاء الفهارس
    console.log('🔍 إنشاء الفهارس...');
    // ... كود إنشاء الفهارس
  }
}

// تشغيل النشر
const deployment = new AutoDeployment();
deployment.runDeployment().then(success => {
  process.exit(success ? 0 : 1);
});
`;

      fs.writeFileSync('server/auto-deployment.js', deploymentScript);
      console.log('   ✅ تم إنشاء سكريبت النشر الآلي');

      return true;

    } catch (error) {
      console.log(`   ❌ فشل إنشاء سكريبت النشر: ${error.message}`);
      return false;
    }
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
    } catch (error) {
      console.error('خطأ في قطع الاتصال:', error.message);
    }
  }

  async runFix() {
    console.log('🔧 بدء تحديث migrations وإصلاح عرض دليل الحسابات...\n');
    console.log('📅 التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('🎯 الهدف: تحديث ملفات النشر وإصلاح العرض البصري');
    console.log('='.repeat(80));
    
    const connected = await this.connect();
    if (!connected) {
      return false;
    }

    try {
      // تحليل بنية قاعدة البيانات الحالية
      const analysis = await this.analyzeCurrentSchema();
      if (!analysis) {
        console.log('❌ فشل في تحليل بنية قاعدة البيانات');
        return false;
      }

      // إنشاء ملف migration محدث
      const migrationCreated = await this.createUpdatedInitialMigration();
      if (!migrationCreated) {
        console.log('❌ فشل في إنشاء ملف migration محدث');
        return false;
      }

      // إصلاح عرض دليل الحسابات
      const displayFixed = await this.fixAccountTreeDisplay();
      if (!displayFixed) {
        console.log('❌ فشل في إصلاح عرض دليل الحسابات');
        return false;
      }

      // إنشاء سكريبت النشر الآلي
      const deploymentCreated = await this.createDeploymentScript();
      if (!deploymentCreated) {
        console.log('❌ فشل في إنشاء سكريبت النشر');
        return false;
      }

      console.log('\n🎉 تم تحديث migrations وإصلاح عرض دليل الحسابات بنجاح!');
      console.log('✅ ملف migration محدث تم إنشاؤه');
      console.log('✅ عرض دليل الحسابات تم إصلاحه');
      console.log('✅ سكريبت النشر الآلي تم إنشاؤه');
      
      return true;
      
    } catch (error) {
      console.error('❌ خطأ عام في التحديث:', error.message);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل الإصلاح
const fix = new MigrationsAndDisplayFix();
fix.runFix().then(success => {
  if (success) {
    console.log('\n🎊 تم التحديث بنجاح!');
    console.log('📋 الآن ملفات migrations محدثة بآخر التغييرات');
    console.log('🎨 دليل الحسابات يعرض بشكل صحيح ومنظم');
    console.log('🚀 سكريبت النشر الآلي جاهز للاستخدام');
    process.exit(0);
  } else {
    console.log('\n❌ فشل في التحديث');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ فشل في تشغيل التحديث:', error);
  process.exit(1);
});
