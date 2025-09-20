console.log('🔄 بدء إصلاح جدول الحسابات...');

try {
  // استيراد النماذج
  const modelsModule = await import('./server/src/models/index.js');
  const { sequelize } = modelsModule;
  
  console.log('✅ تم تحميل النماذج بنجاح');
  
  // التحقق من الاتصال
  await sequelize.authenticate();
  console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
  
  // إضافة الأعمدة المفقودة
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    // إضافة عمود isMonitored
    await queryInterface.addColumn('accounts', 'isMonitored', {
      type: sequelize.Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
    console.log('✅ تم إضافة عمود isMonitored');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️ عمود isMonitored موجود بالفعل');
    } else {
      console.log('⚠️ خطأ في إضافة عمود isMonitored:', error.message);
    }
  }
  
  try {
    // إضافة عمود nature إذا لم يكن موجوداً
    await queryInterface.addColumn('accounts', 'nature', {
      type: sequelize.Sequelize.ENUM('debit', 'credit'),
      defaultValue: 'debit',
      allowNull: false
    });
    console.log('✅ تم إضافة عمود nature');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️ عمود nature موجود بالفعل');
    } else {
      console.log('⚠️ خطأ في إضافة عمود nature:', error.message);
    }
  }
  
  try {
    // إضافة عمود rootType إذا لم يكن موجوداً
    await queryInterface.addColumn('accounts', 'rootType', {
      type: sequelize.Sequelize.ENUM('Asset', 'Liability', 'Equity', 'Income', 'Expense'),
      allowNull: true
    });
    console.log('✅ تم إضافة عمود rootType');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️ عمود rootType موجود بالفعل');
    } else {
      console.log('⚠️ خطأ في إضافة عمود rootType:', error.message);
    }
  }
  
  try {
    // إضافة عمود reportType إذا لم يكن موجوداً
    await queryInterface.addColumn('accounts', 'reportType', {
      type: sequelize.Sequelize.ENUM('Balance Sheet', 'Profit and Loss'),
      allowNull: true
    });
    console.log('✅ تم إضافة عمود reportType');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️ عمود reportType موجود بالفعل');
    } else {
      console.log('⚠️ خطأ في إضافة عمود reportType:', error.message);
    }
  }
  
  try {
    // إضافة عمود level إذا لم يكن موجوداً
    await queryInterface.addColumn('accounts', 'level', {
      type: sequelize.Sequelize.INTEGER,
      defaultValue: 1,
      allowNull: false
    });
    console.log('✅ تم إضافة عمود level');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️ عمود level موجود بالفعل');
    } else {
      console.log('⚠️ خطأ في إضافة عمود level:', error.message);
    }
  }
  
  // تحديث القيم الافتراضية للحسابات الموجودة
  console.log('\n🔄 تحديث القيم الافتراضية...');
  
  // تحديث طبيعة الأرصدة بناءً على نوع الحساب
  await sequelize.query(`
    UPDATE accounts 
    SET nature = CASE 
      WHEN type IN ('asset', 'expense') THEN 'debit'
      WHEN type IN ('liability', 'equity', 'revenue') THEN 'credit'
      ELSE 'debit'
    END
    WHERE nature IS NULL OR nature = ''
  `);
  console.log('✅ تم تحديث طبيعة الأرصدة');
  
  // تحديث rootType
  await sequelize.query(`
    UPDATE accounts 
    SET rootType = CASE 
      WHEN type = 'asset' THEN 'Asset'
      WHEN type = 'liability' THEN 'Liability'
      WHEN type = 'equity' THEN 'Equity'
      WHEN type = 'revenue' THEN 'Income'
      WHEN type = 'expense' THEN 'Expense'
      ELSE 'Asset'
    END
    WHERE rootType IS NULL OR rootType = ''
  `);
  console.log('✅ تم تحديث rootType');
  
  // تحديث reportType
  await sequelize.query(`
    UPDATE accounts 
    SET reportType = CASE 
      WHEN type IN ('asset', 'liability', 'equity') THEN 'Balance Sheet'
      WHEN type IN ('revenue', 'expense') THEN 'Profit and Loss'
      ELSE 'Balance Sheet'
    END
    WHERE reportType IS NULL OR reportType = ''
  `);
  console.log('✅ تم تحديث reportType');
  
  // تحديث المستويات بناءً على الكود
  await sequelize.query(`
    UPDATE accounts 
    SET level = CASE 
      WHEN code NOT LIKE '%.%' THEN 1
      WHEN code LIKE '%.%' AND code NOT LIKE '%.%.%' THEN 2
      WHEN code LIKE '%.%.%' AND code NOT LIKE '%.%.%.%' THEN 3
      ELSE 4
    END
    WHERE level IS NULL OR level = 0
  `);
  console.log('✅ تم تحديث المستويات');
  
  console.log('\n✅ تم إصلاح جدول الحسابات بنجاح');
  process.exit(0);
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  process.exit(1);
}
