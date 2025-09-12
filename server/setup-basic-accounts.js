import models, { sequelize } from './src/models/index.js';

async function setupBasicAccounts() {
  try {
    console.log('🏗️ Setting up basic chart of accounts...');
    
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Define the basic accounts structure
    const basicAccounts = [
      {
        code: '1',
        name: 'الأصول',
        type: 'asset',
        nature: 'debit',
        parentId: null,
        level: 1,
        isActive: true,
        description: 'الحساب الرئيسي للأصول'
      },
      {
        code: '2', 
        name: 'المصروفات',
        type: 'expense',
        nature: 'debit',
        parentId: null,
        level: 1,
        isActive: true,
        description: 'الحساب الرئيسي للمصروفات'
      },
      {
        code: '3',
        name: 'الالتزامات',
        type: 'liability', 
        nature: 'credit',
        parentId: null,
        level: 1,
        isActive: true,
        description: 'الحساب الرئيسي للالتزامات'
      },
      {
        code: '4',
        name: 'حقوق الملكية',
        type: 'equity',
        nature: 'credit', 
        parentId: null,
        level: 1,
        isActive: true,
        description: 'الحساب الرئيسي لحقوق الملكية'
      },
      {
        code: '5',
        name: 'الإيرادات',
        type: 'revenue',
        nature: 'credit',
        parentId: null, 
        level: 1,
        isActive: true,
        description: 'الحساب الرئيسي للإيرادات'
      }
    ];

    // Check if accounts table exists and get its structure
    const [results] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'accounts'");
    const columns = results.map(row => row.column_name);
    console.log('📋 Available columns:', columns);

    // Clear existing accounts first
    await sequelize.query('DELETE FROM accounts WHERE 1=1');
    console.log('🗑️ Cleared existing accounts');

    // Insert basic accounts
    for (const account of basicAccounts) {
      try {
        // Adapt to actual table structure
        const insertData = {
          code: account.code,
          name: account.name,
          type: account.type,
          nature: account.nature,
          level: account.level,
          isActive: account.isActive,
          balance: 0,
          description: account.description
        };

        // Remove fields that don't exist in the table
        const filteredData = {};
        for (const [key, value] of Object.entries(insertData)) {
          if (columns.includes(key) || columns.includes(key.toLowerCase())) {
            filteredData[key] = value;
          }
        }

        await models.Account.create(filteredData);
        console.log(`✅ Created account: ${account.code} - ${account.name} (${account.nature})`);
        
      } catch (error) {
        console.error(`❌ Error creating account ${account.code}:`, error.message);
      }
    }

    // Verify the accounts were created
    const accountCount = await models.Account.count();
    console.log(`📊 Total accounts created: ${accountCount}`);

    // Show the created accounts
    const accounts = await models.Account.findAll({
      order: [['code', 'ASC']]
    });

    console.log('\n📋 Basic Chart of Accounts:');
    console.log('الرقم\tاسم الحساب\t\tطبيعة الحساب');
    console.log('----\t----------\t\t-----------');
    
    accounts.forEach(account => {
      const nature = account.nature === 'debit' ? 'مدين' : 'دائن';
      console.log(`${account.code}\t${account.name}\t\t${nature}`);
    });

    console.log('\n🎉 Basic chart of accounts setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up basic accounts:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

setupBasicAccounts();
