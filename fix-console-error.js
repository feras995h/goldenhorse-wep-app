import fs from 'fs';

async function fixConsoleError() {
  try {
    console.log('🔧 إصلاح خطأ console.error في ملف financial.js...');
    
    // قراءة الملف
    const filePath = 'server/src/routes/financial.js';
    let content = fs.readFileSync(filePath, 'utf8');
    
    console.log('📄 تم قراءة الملف بنجاح');
    
    // البحث عن السطر المشكل وإصلاحه
    const problematicLine = /console\.error\('âŒ Error fetching fixed asset categories:', error\);/;
    const fixedLine = "console.error('❌ Error fetching fixed asset categories:', error);";
    
    if (content.match(problematicLine)) {
      content = content.replace(problematicLine, fixedLine);
      console.log('✅ تم العثور على السطر المشكل وإصلاحه');
    } else {
      console.log('⚠️  لم يتم العثور على السطر المشكل');
      
      // البحث عن أي console.error غير مكتمل
      const incompleteConsoleError = /console\.error\s*$/;
      if (content.match(incompleteConsoleError)) {
        console.log('❌ تم العثور على console.error غير مكتمل');
        content = content.replace(incompleteConsoleError, "console.error('Error:', error);");
        console.log('✅ تم إصلاح console.error غير المكتمل');
      }
    }
    
    // كتابة الملف المحدث
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('💾 تم حفظ الملف المحدث');
    
    // التحقق من الإصلاح
    const updatedContent = fs.readFileSync(filePath, 'utf8');
    if (updatedContent.includes("console.error('❌ Error fetching fixed asset categories:', error);")) {
      console.log('✅ تم إصلاح الخطأ بنجاح!');
    } else {
      console.log('⚠️  لم يتم العثور على السطر المحدث');
    }
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح الملف:', error.message);
  }
}

// تشغيل الإصلاح
fixConsoleError();
