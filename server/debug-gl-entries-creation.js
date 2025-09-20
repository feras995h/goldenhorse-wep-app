import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function debugGLEntriesCreation() {
  try {
    console.log('🔍 Debugging GL entries creation for fixed assets...');
    
    // Get a cash account for credit entry
    const [cashAccounts] = await sequelize.query(`
      SELECT id, code, name 
      FROM accounts 
      WHERE code IN ('1.1.1.1', '1.1.1') OR name LIKE '%صندوق%' OR name LIKE '%نقد%'
      LIMIT 1
    `);
    
    if (cashAccounts.length === 0) {
      console.log('❌ No cash account found');
      return;
    }
    
    const cashAccount = cashAccounts[0];
    console.log('💰 Cash account:', cashAccount);
    
    // Get an asset account for debit entry
    const [assetAccounts] = await sequelize.query(`
      SELECT id, code, name 
      FROM accounts 
      WHERE type = 'asset' AND level > 1
      LIMIT 1
    `);
    
    if (assetAccounts.length === 0) {
      console.log('❌ No asset account found');
      return;
    }
    
    const assetAccount = assetAccounts[0];
    console.log('🏦 Asset account:', assetAccount);
    
    // Test creating GL entries with "Asset Purchase" voucher type
    const testGlEntries = [
      {
        id: uuidv4(),
        postingDate: '2025-09-20',
        accountId: assetAccount.id, // Debit the asset account
        debit: 1000,
        credit: 0,
        voucherType: 'Asset Purchase', // This is the key value
        voucherNo: 'TEST-GL-' + Date.now(),
        remarks: 'Test asset purchase entry',
        createdBy: 'test-user',
        currency: 'LYD',
        exchangeRate: 1.0,
        journalEntryId: uuidv4() // This would normally reference an actual journal entry
      },
      {
        id: uuidv4(),
        postingDate: '2025-09-20',
        accountId: cashAccount.id, // Credit the cash account
        debit: 0,
        credit: 1000,
        voucherType: 'Asset Purchase', // This is the key value
        voucherNo: 'TEST-GL-' + Date.now(),
        remarks: 'Test asset purchase payment',
        createdBy: 'test-user',
        currency: 'LYD',
        exchangeRate: 1.0,
        journalEntryId: uuidv4() // This would normally reference an actual journal entry
      }
    ];
    
    console.log('\n📝 Test GL entries:', testGlEntries);
    
    // Try to insert the GL entries
    for (let i = 0; i < testGlEntries.length; i++) {
      const entry = testGlEntries[i];
      console.log(`\n🧪 Testing GL entry ${i + 1}...`);
      
      try {
        const [result] = await sequelize.query(`
          INSERT INTO gl_entries (
            id, "postingDate", "accountId", debit, credit, "voucherType", 
            "voucherNo", remarks, "createdBy", currency, "exchangeRate", 
            "journalEntryId", "createdAt", "updatedAt"
          ) VALUES (
            :id, :postingDate, :accountId, :debit, :credit, :voucherType,
            :voucherNo, :remarks, :createdBy, :currency, :exchangeRate,
            :journalEntryId, NOW(), NOW()
          ) RETURNING id, "voucherNo", "voucherType"
        `, {
          replacements: entry,
          type: Sequelize.QueryTypes.INSERT
        });
        
        console.log(`✅ GL entry ${i + 1} created successfully:`, result[0]);
        
        // Clean up
        await sequelize.query(`
          DELETE FROM gl_entries WHERE id = :id
        `, {
          replacements: { id: entry.id }
        });
        
      } catch (error) {
        console.log(`❌ Error creating GL entry ${i + 1}:`, error.message);
        if (error.detail) {
          console.log('   Detail:', error.detail);
        }
      }
    }
    
    // Test with invalid voucherType
    console.log('\n🧪 Testing with invalid voucherType...');
    const invalidEntry = {
      id: uuidv4(),
      postingDate: '2025-09-20',
      accountId: assetAccount.id,
      debit: 1000,
      credit: 0,
      voucherType: 'Invalid Type', // This should fail
      voucherNo: 'TEST-INVALID-' + Date.now(),
      remarks: 'Test invalid voucher type',
      createdBy: 'test-user',
      currency: 'LYD',
      exchangeRate: 1.0,
      journalEntryId: uuidv4()
    };
    
    try {
      const [result] = await sequelize.query(`
        INSERT INTO gl_entries (
          id, "postingDate", "accountId", debit, credit, "voucherType", 
          "voucherNo", remarks, "createdBy", currency, "exchangeRate", 
          "journalEntryId", "createdAt", "updatedAt"
        ) VALUES (
          :id, :postingDate, :accountId, :debit, :credit, :voucherType,
          :voucherNo, :remarks, :createdBy, :currency, :exchangeRate,
          :journalEntryId, NOW(), NOW()
        ) RETURNING id, "voucherNo", "voucherType"
      `, {
        replacements: invalidEntry,
        type: Sequelize.QueryTypes.INSERT
      });
      
      console.log('❌ Invalid voucherType should have failed but succeeded:', result[0]);
    } catch (error) {
      console.log('✅ Invalid voucherType correctly failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugGLEntriesCreation();