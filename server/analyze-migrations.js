import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { 
  dialect: 'postgres', 
  logging: false 
});

/**
 * تحليل ملفات الهجرة ومقارنتها مع قاعدة البيانات الحالية
 */
async function analyzeMigrations() {
  try {
    console.log('🔍 الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بنجاح\n');

    // 1. قراءة ملفات الهجرة
    const migrationsDir = './src/migrations';
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();

    console.log(`📁 عدد ملفات الهجرة: ${migrationFiles.length}\n`);
    console.log('📋 ملفات الهجرة:');
    migrationFiles.forEach((file, i) => {
      const stats = fs.statSync(path.join(migrationsDir, file));
      console.log(`   ${i+1}. ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    });
    console.log();

    // 2. الحصول على الجداول الحالية
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name NOT LIKE 'pg_%'
      AND table_name != 'SequelizeMeta'
      ORDER BY table_name;
    `);

    console.log(`📊 الجداول الحالية في قاعدة البيانات: ${tables.length}\n`);

    // 3. تحليل كل ملف هجرة
    console.log('🔍 تحليل ملفات الهجرة...\n');

    const analysis = {
      obsolete: [],      // ملفات قديمة وغير مستخدمة
      duplicates: [],    // ملفات مكررة
      potentially_safe: [], // ملفات يُحتمل أنها آمنة للحذف
      keep: []           // ملفات يجب الاحتفاظ بها
    };

    // تحليل ملفات الهجرة
    migrationFiles.forEach(file => {
      const fileLower = file.toLowerCase();

      // ملفات الهجرة القديمة (قبل استخدام create-all-tables.js)
      if (fileLower.match(/^00[1-9]-/)) {
        analysis.obsolete.push({
          file,
          reason: 'ملف هجرة قديم - تم استبداله بـ create-all-tables.js'
        });
      }
      // ملفات مكررة
      else if (fileLower.includes('002-add-performance-indexes') || 
               fileLower.includes('008-add-performance-indexes')) {
        analysis.duplicates.push({
          file,
          reason: 'ملف indexes مكرر'
        });
      }
      // ملفات إضافة جداول (تم استبدالها)
      else if (fileLower.includes('additional-tables') || 
               fileLower.includes('new-tables-only') ||
               fileLower.includes('initial-schema') ||
               fileLower.includes('complete-schema')) {
        analysis.obsolete.push({
          file,
          reason: 'تم استبداله بسكريبتات SQL مباشرة'
        });
      }
      // ملفات إضافة أعمدة (قد تكون آمنة للحذف)
      else if (fileLower.includes('add-') && 
               (fileLower.includes('columns') || 
                fileLower.includes('fields') ||
                fileLower.includes('missing'))) {
        analysis.potentially_safe.push({
          file,
          reason: 'ملف إضافة أعمدة - قد يكون تم تطبيقه بالفعل'
        });
      }
      // ملفات حديثة أو مهمة
      else {
        analysis.keep.push({
          file,
          reason: 'ملف حديث أو يحتوي على تحديثات مهمة'
        });
      }
    });

    // 4. عرض النتائج
    console.log('='.repeat(60));
    console.log('📊 نتائج التحليل');
    console.log('='.repeat(60));
    console.log();

    console.log('❌ ملفات قديمة ويمكن حذفها بأمان:');
    if (analysis.obsolete.length === 0) {
      console.log('   لا توجد');
    } else {
      analysis.obsolete.forEach(item => {
        console.log(`   ❌ ${item.file}`);
        console.log(`      السبب: ${item.reason}\n`);
      });
    }
    console.log();

    console.log('⚠️  ملفات مكررة:');
    if (analysis.duplicates.length === 0) {
      console.log('   لا توجد');
    } else {
      analysis.duplicates.forEach(item => {
        console.log(`   ⚠️  ${item.file}`);
        console.log(`      السبب: ${item.reason}\n`);
      });
    }
    console.log();

    console.log('🟡 ملفات قد تكون آمنة للحذف (بعد التحقق):');
    if (analysis.potentially_safe.length === 0) {
      console.log('   لا توجد');
    } else {
      analysis.potentially_safe.forEach(item => {
        console.log(`   🟡 ${item.file}`);
        console.log(`      السبب: ${item.reason}\n`);
      });
    }
    console.log();

    console.log('✅ ملفات يُنصح بالاحتفاظ بها:');
    if (analysis.keep.length === 0) {
      console.log('   لا توجد');
    } else {
      analysis.keep.forEach(item => {
        console.log(`   ✅ ${item.file}`);
        console.log(`      السبب: ${item.reason}\n`);
      });
    }
    console.log();

    // 5. الإحصائيات
    console.log('='.repeat(60));
    console.log('📊 الإحصائيات');
    console.log('='.repeat(60));
    console.log(`إجمالي ملفات الهجرة: ${migrationFiles.length}`);
    console.log(`ملفات قديمة: ${analysis.obsolete.length}`);
    console.log(`ملفات مكررة: ${analysis.duplicates.length}`);
    console.log(`ملفات قد تكون آمنة للحذف: ${analysis.potentially_safe.length}`);
    console.log(`ملفات يجب الاحتفاظ بها: ${analysis.keep.length}`);
    console.log();

    const canDelete = analysis.obsolete.length + analysis.duplicates.length;
    console.log(`✅ يمكنك حذف ${canDelete} ملف بأمان\n`);

    // 6. إنشاء قائمة بالملفات للحذف
    const filesToDelete = [
      ...analysis.obsolete.map(i => i.file),
      ...analysis.duplicates.map(i => i.file)
    ];

    if (filesToDelete.length > 0) {
      console.log('📝 إنشاء سكريبت للحذف...');
      
      const deleteScript = `#!/bin/bash
# سكريبت لحذف ملفات الهجرة القديمة
# تم إنشاؤه تلقائياً في ${new Date().toISOString()}

cd src/migrations

echo "🗑️  حذف ملفات الهجرة القديمة..."

${filesToDelete.map(f => `echo "  حذف ${f}..."
rm -f "${f}"`).join('\n')}

echo ""
echo "✅ تم حذف ${filesToDelete.length} ملف"
echo "📊 الملفات المتبقية:"
ls -lh
`;

      fs.writeFileSync('delete-old-migrations.sh', deleteScript);
      console.log('✅ تم إنشاء: delete-old-migrations.sh\n');

      // PowerShell script for Windows
      const deletePsScript = `# سكريبت لحذف ملفات الهجرة القديمة
# تم إنشاؤه تلقائياً في ${new Date().toISOString()}

Set-Location src/migrations

Write-Host "🗑️  حذف ملفات الهجرة القديمة..." -ForegroundColor Yellow

${filesToDelete.map(f => `Write-Host "  حذف ${f}..." -ForegroundColor Gray
Remove-Item -Path "${f}" -Force -ErrorAction SilentlyContinue`).join('\n')}

Write-Host ""
Write-Host "✅ تم حذف ${filesToDelete.length} ملف" -ForegroundColor Green
Write-Host "📊 الملفات المتبقية:" -ForegroundColor Cyan
Get-ChildItem | Format-Table Name, Length, LastWriteTime
`;

      fs.writeFileSync('delete-old-migrations.ps1', deletePsScript);
      console.log('✅ تم إنشاء: delete-old-migrations.ps1\n');
    }

    await sequelize.close();
    console.log('✅ اكتمل التحليل!');
    
  } catch (error) {
    console.error('\n❌ خطأ:', error);
    await sequelize.close();
    process.exit(1);
  }
}

analyzeMigrations();
