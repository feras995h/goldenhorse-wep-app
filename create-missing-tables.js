import pkg from 'pg';
const { Client } = pkg;

// إعدادات قاعدة البيانات
const dbConfig = {
  connectionString: 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/postgres'
};

async function createMissingTables() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // إنشاء جدول sales_invoices
    console.log('\n🔧 إنشاء جدول sales_invoices...');
    
    const createSalesInvoicesTable = `
      CREATE TABLE IF NOT EXISTS sales_invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoiceNumber" VARCHAR(50) NOT NULL UNIQUE,
        "customerId" UUID NOT NULL REFERENCES customers(id),
        date DATE NOT NULL,
        "dueDate" DATE,
        subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
        "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
        total DECIMAL(15,2) NOT NULL DEFAULT 0,
        "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
        status invoice_status_enum NOT NULL DEFAULT 'draft',
        currency VARCHAR(3) NOT NULL DEFAULT 'LYD',
        notes TEXT,
        "createdBy" UUID REFERENCES users(id),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

    try {
      await client.query(createSalesInvoicesTable);
      console.log('✅ تم إنشاء جدول sales_invoices بنجاح');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ جدول sales_invoices موجود بالفعل');
      } else {
        console.error('❌ خطأ في إنشاء جدول sales_invoices:', error.message);
      }
    }

    // إنشاء جدول sales_invoice_items
    console.log('\n🔧 إنشاء جدول sales_invoice_items...');
    
    const createSalesInvoiceItemsTable = `
      CREATE TABLE IF NOT EXISTS sales_invoice_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "salesInvoiceId" UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
        "productName" VARCHAR(255) NOT NULL,
        description TEXT,
        quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
        "unitPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
        "lineTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
        "taxRate" DECIMAL(5,2) DEFAULT 0,
        "taxAmount" DECIMAL(15,2) DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

    try {
      await client.query(createSalesInvoiceItemsTable);
      console.log('✅ تم إنشاء جدول sales_invoice_items بنجاح');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ جدول sales_invoice_items موجود بالفعل');
      } else {
        console.error('❌ خطأ في إنشاء جدول sales_invoice_items:', error.message);
      }
    }

    // إنشاء جدول sales_returns
    console.log('\n🔧 إنشاء جدول sales_returns...');
    
    const createSalesReturnsTable = `
      CREATE TABLE IF NOT EXISTS sales_returns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "returnNumber" VARCHAR(50) NOT NULL UNIQUE,
        "customerId" UUID NOT NULL REFERENCES customers(id),
        "originalInvoiceId" UUID REFERENCES sales_invoices(id),
        date DATE NOT NULL,
        reason TEXT NOT NULL,
        subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
        "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
        total DECIMAL(15,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        notes TEXT,
        "createdBy" UUID REFERENCES users(id),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

    try {
      await client.query(createSalesReturnsTable);
      console.log('✅ تم إنشاء جدول sales_returns بنجاح');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ جدول sales_returns موجود بالفعل');
      } else {
        console.error('❌ خطأ في إنشاء جدول sales_returns:', error.message);
      }
    }

    // إنشاء جدول shipments
    console.log('\n🔧 إنشاء جدول shipments...');
    
    const createShipmentsTable = `
      CREATE TABLE IF NOT EXISTS shipments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "trackingNumber" VARCHAR(100) NOT NULL UNIQUE,
        "customerId" UUID NOT NULL REFERENCES customers(id),
        origin VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        "estimatedDelivery" DATE,
        "actualDelivery" DATE,
        weight DECIMAL(10,3),
        dimensions JSONB,
        "shippingCost" DECIMAL(15,2) DEFAULT 0,
        notes TEXT,
        "createdBy" UUID REFERENCES users(id),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

    try {
      await client.query(createShipmentsTable);
      console.log('✅ تم إنشاء جدول shipments بنجاح');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ جدول shipments موجود بالفعل');
      } else {
        console.error('❌ خطأ في إنشاء جدول shipments:', error.message);
      }
    }

    // إنشاء جدول shipment_movements
    console.log('\n🔧 إنشاء جدول shipment_movements...');
    
    const createShipmentMovementsTable = `
      CREATE TABLE IF NOT EXISTS shipment_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "shipmentId" UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
        "previousStatus" VARCHAR(50),
        "newStatus" VARCHAR(50) NOT NULL,
        location VARCHAR(255),
        notes TEXT,
        "movedBy" UUID REFERENCES users(id),
        "movedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

    try {
      await client.query(createShipmentMovementsTable);
      console.log('✅ تم إنشاء جدول shipment_movements بنجاح');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ جدول shipment_movements موجود بالفعل');
      } else {
        console.error('❌ خطأ في إنشاء جدول shipment_movements:', error.message);
      }
    }

    // إنشاء جدول warehouse_release_orders
    console.log('\n🔧 إنشاء جدول warehouse_release_orders...');
    
    const createWarehouseReleaseOrdersTable = `
      CREATE TABLE IF NOT EXISTS warehouse_release_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderNumber" VARCHAR(50) NOT NULL UNIQUE,
        "customerId" UUID NOT NULL REFERENCES customers(id),
        "shipmentId" UUID REFERENCES shipments(id),
        "requestDate" DATE NOT NULL,
        "releaseDate" DATE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        "totalItems" INTEGER DEFAULT 0,
        "releasedItems" INTEGER DEFAULT 0,
        notes TEXT,
        "createdBy" UUID REFERENCES users(id),
        "approvedBy" UUID REFERENCES users(id),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

    try {
      await client.query(createWarehouseReleaseOrdersTable);
      console.log('✅ تم إنشاء جدول warehouse_release_orders بنجاح');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ جدول warehouse_release_orders موجود بالفعل');
      } else {
        console.error('❌ خطأ في إنشاء جدول warehouse_release_orders:', error.message);
      }
    }

    // إنشاء جدول stock_movements
    console.log('\n🔧 إنشاء جدول stock_movements...');
    
    const createStockMovementsTable = `
      CREATE TABLE IF NOT EXISTS stock_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "shipmentId" UUID NOT NULL REFERENCES shipments(id),
        "movementType" VARCHAR(50) NOT NULL, -- 'in', 'out', 'transfer'
        quantity DECIMAL(10,3) NOT NULL,
        "unitCost" DECIMAL(15,2),
        "totalCost" DECIMAL(15,2),
        "referenceType" VARCHAR(50), -- 'release_order', 'adjustment', etc.
        "referenceId" UUID,
        notes TEXT,
        "movedBy" UUID REFERENCES users(id),
        "movedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

    try {
      await client.query(createStockMovementsTable);
      console.log('✅ تم إنشاء جدول stock_movements بنجاح');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ جدول stock_movements موجود بالفعل');
      } else {
        console.error('❌ خطأ في إنشاء جدول stock_movements:', error.message);
      }
    }

    console.log('\n🎉 تم إنشاء جميع الجداول المفقودة بنجاح!');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// تشغيل السكريپت
createMissingTables().catch(console.error);
