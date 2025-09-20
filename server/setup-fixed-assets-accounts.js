// Check and create required accounts for fixed assets
import { Sequelize } from 'sequelize';

// Direct database connection using the URL you provided
const DATABASE_URL = 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres';

async function setupFixedAssetsAccounts() {
  try {
    console.log('🔧 Setting up accounts for fixed assets...');
    
    const sequelize = new Sequelize(DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check if we have the required account types
    const requiredAccounts = [
      { code: '112', name: 'الأصول الثابتة', nameEn: 'Fixed Assets', type: 'asset', isGroup: true },
      { code: '11201', name: 'الأصول الثابتة - معدات', nameEn: 'Fixed Assets - Equipment', type: 'asset', parentCode: '112' },
      { code: '11202', name: 'الأصول الث固定 الثابتة - عقارات', nameEn: 'Fixed Assets - Real Estate', type: 'asset', parentCode: '112' },
      { code: '11203', name: 'الأصول الثابتة - مركبات', nameEn: 'Fixed Assets - Vehicles', type: 'asset', parentCode: '112' },
      { code: '113', name: 'استهلاك الأصول الثابتة المتراكمة', nameEn: 'Accumulated Depreciation', type: 'asset', isGroup: true },
      { code: '411', name: 'مصروف الاستهلاك', nameEn: 'Depreciation Expense', type: 'expense' }
    ];
    
    for (const account of requiredAccounts) {
      try {
        // Check if account exists
        const [existing] = await sequelize.query(
          'SELECT id FROM accounts WHERE code = $1', 
          { bind: [account.code] }
        );
        
        if (existing.length > 0) {
          console.log(`✅ Account already exists: ${account.name} (${account.code})`);
        } else {
          // Get parent account ID if needed
          let parentId = null;
          if (account.parentCode) {
            const [parent] = await sequelize.query(
              'SELECT id FROM accounts WHERE code = $1', 
              { bind: [account.parentCode] }
            );
            if (parent.length > 0) {
              parentId = parent[0].id;
            }
          }
          
          // Create the account
          await sequelize.query(`
            INSERT INTO accounts (id, code, name, "nameEn", type, "isGroup", "parentId", "isActive", balance, currency, nature, "accountType", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, 0, 'LYD', 
              CASE WHEN $4 IN ('asset', 'expense') THEN 'debit' ELSE 'credit' END,
              CASE WHEN $5 THEN 'group' ELSE 'sub' END,
              NOW(), NOW())
          `, { 
            bind: [
              account.code, 
              account.name, 
              account.nameEn, 
              account.type, 
              account.isGroup ? 1 : 0, 
              parentId
            ] 
          });
          
          console.log(`✅ Created account: ${account.name} (${account.code})`);
        }
      } catch (error) {
        console.log(`❌ Error with account ${account.name}:`, error.message);
      }
    }
    
    await sequelize.close();
    console.log('\n🎉 Fixed assets accounts setup completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupFixedAssetsAccounts();