import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function fixSalesRoutes() {
  try {
    await sequelize.authenticate();
    console.log('✅ متصل بقاعدة البيانات\n');

    console.log('🔍 فحص أسماء الأعمدة في sales_invoices...\n');

    // Get actual column names
    const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sales_invoices'
      ORDER BY column_name
    `);

    const columnNames = columns.map(c => c.column_name);
    
    console.log('الأعمدة الموجودة:');
    columnNames.forEach((col, i) => {
      console.log(`  ${(i + 1).toString().padStart(2)}. ${col}`);
    });

    console.log('\n🔍 فحص الأعمدة المطلوبة:\n');

    const requiredColumns = {
      'customerId': 'customer_id',
      'total': 'total',
      'date': 'date',
      'isActive': 'isActive',
      'status': 'status'
    };

    for (const [camelCase, snake_case] of Object.entries(requiredColumns)) {
      const hasCamel = columnNames.includes(camelCase);
      const hasSnake = columnNames.includes(snake_case);
      
      if (hasCamel) {
        console.log(`  ✅ ${camelCase} موجود`);
      } else if (hasSnake) {
        console.log(`  ⚠️  ${snake_case} موجود (snake_case) - يجب استخدامه في الاستعلامات`);
      } else {
        console.log(`  ❌ ${camelCase}/${snake_case} غير موجود!`);
      }
    }

    // Test the actual query
    console.log('\n🧪 اختبار الاستعلام الفعلي:\n');

    try {
      const testQuery = `
        SELECT
          COALESCE(COUNT(DISTINCT si.id), 0) as total_invoices,
          COALESCE(SUM(si.total), 0) as total_sales,
          COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers
        FROM sales_invoices si
        WHERE si."isActive" = true
        LIMIT 1
      `;

      const result = await sequelize.query(testQuery, {
        type: sequelize.QueryTypes.SELECT
      });

      console.log('  ✅ الاستعلام نجح!');
      console.log('  📊 النتيجة:', result[0]);
    } catch (err) {
      console.log('  ❌ الاستعلام فشل:', err.message);
      
      // Try with snake_case
      console.log('\n  🔄 محاولة مع snake_case...\n');
      try {
        const testQuery2 = `
          SELECT
            COALESCE(COUNT(DISTINCT si.id), 0) as total_invoices,
            COALESCE(SUM(si.total), 0) as total_sales,
            COALESCE(COUNT(DISTINCT si.customer_id), 0) as active_customers
          FROM sales_invoices si
          WHERE si.is_active = true
          LIMIT 1
        `;

        const result2 = await sequelize.query(testQuery2, {
          type: sequelize.QueryTypes.SELECT
        });

        console.log('  ✅ الاستعلام نجح مع snake_case!');
        console.log('  📊 النتيجة:', result2[0]);
        console.log('\n  ⚠️  يجب تحديث الكود لاستخدام snake_case');
      } catch (err2) {
        console.log('  ❌ الاستعلام فشل أيضاً:', err2.message);
      }
    }

    await sequelize.close();
    console.log('\n✅ اكتمل الفحص');
  } catch (err) {
    console.error('\n❌ خطأ:', err.message);
    await sequelize.close();
    process.exit(1);
  }
}

fixSalesRoutes();
