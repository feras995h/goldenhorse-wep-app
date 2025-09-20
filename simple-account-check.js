import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// مسار قاعدة البيانات
const dbPath = join(__dirname, 'database', 'development.sqlite');

function checkAccounts() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message);
        reject(err);
        return;
      }
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    });

    // التحقق من وجود جدول الحسابات
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='accounts'", (err, row) => {
      if (err) {
        console.error('❌ خطأ في التحقق من جدول الحسابات:', err.message);
        reject(err);
        return;
      }

      if (!row) {
        console.log('❌ جدول الحسابات غير موجود');
        db.close();
        resolve();
        return;
      }

      console.log('✅ جدول الحسابات موجود');

      // الحصول على الحسابات الرئيسية
      db.all(`
        SELECT code, name, type, nature, level, isGroup, balance 
        FROM accounts 
        WHERE level = 1 OR parentId IS NULL 
        ORDER BY code
      `, (err, rows) => {
        if (err) {
          console.error('❌ خطأ في استعلام الحسابات:', err.message);
          reject(err);
          return;
        }

        console.log('\n📊 الحسابات الرئيسية الحالية:');
        console.log('=====================================');

        if (rows.length === 0) {
          console.log('❌ لا توجد حسابات رئيسية في قاعدة البيانات');
        } else {
          rows.forEach(account => {
            console.log(`${account.code} - ${account.name}`);
            console.log(`  النوع: ${account.type || 'غير محدد'}`);
            console.log(`  الطبيعة: ${account.nature || 'غير محدد'}`);
            console.log(`  المستوى: ${account.level || 'غير محدد'}`);
            console.log(`  مجموعة: ${account.isGroup ? 'نعم' : 'لا'}`);
            console.log(`  الرصيد: ${account.balance || 0}`);
            console.log('');
          });
        }

        // إحصائيات إضافية
        db.get("SELECT COUNT(*) as total FROM accounts", (err, totalRow) => {
          if (err) {
            console.error('❌ خطأ في حساب إجمالي الحسابات:', err.message);
            reject(err);
            return;
          }

          console.log(`📈 إجمالي الحسابات: ${totalRow.total}`);

          // توزيع الحسابات حسب النوع
          db.all(`
            SELECT type, COUNT(*) as count 
            FROM accounts 
            WHERE type IS NOT NULL 
            GROUP BY type 
            ORDER BY type
          `, (err, typeRows) => {
            if (err) {
              console.error('❌ خطأ في حساب توزيع الحسابات:', err.message);
              reject(err);
              return;
            }

            console.log('\nتوزيع الحسابات حسب النوع:');
            typeRows.forEach(row => {
              console.log(`- ${row.type}: ${row.count} حساب`);
            });

            console.log('\n🎯 التصنيف المطلوب:');
            console.log('===================');
            console.log('1 - الأصول (Assets) - طبيعة مدين');
            console.log('2 - المصروفات (Expenses) - طبيعة مدين');
            console.log('3 - الالتزامات (Liabilities) - طبيعة دائن');
            console.log('4 - حقوق الملكية (Equity) - طبيعة دائن');
            console.log('5 - الإيرادات (Revenue) - طبيعة دائن');

            console.log('\n✅ تم الانتهاء من التحقق');

            db.close((err) => {
              if (err) {
                console.error('❌ خطأ في إغلاق قاعدة البيانات:', err.message);
                reject(err);
              } else {
                console.log('✅ تم إغلاق قاعدة البيانات بنجاح');
                resolve();
              }
            });
          });
        });
      });
    });
  });
}

// تشغيل السكريبت
if (import.meta.url === `file://${process.argv[1]}`) {
  checkAccounts()
    .then(() => {
      console.log('✅ تم تشغيل السكريبت بنجاح');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل في تشغيل السكريبت:', error);
      process.exit(1);
    });
}
