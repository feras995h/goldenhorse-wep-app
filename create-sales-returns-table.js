import { Sequelize } from 'sequelize';

async function createSalesReturnsTable() {
  console.log('🔧 إنشاء جدول sales_returns...');

  const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:XIclgABy2kg3ZZ2Nyh7GOYexxcm206RTNsSAJavhbF4ukgMfDiNqXSOhy8SIALUP@72.60.92.146:5432/golden-horse-shipping', {
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // Create sales_returns table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sales_returns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "returnNumber" VARCHAR(50) UNIQUE NOT NULL,
        date DATE NOT NULL,
        "customerId" UUID NOT NULL REFERENCES customers(id),
        "salesInvoiceId" UUID REFERENCES sales_invoices(id),
        reason VARCHAR(20) DEFAULT 'other' NOT NULL CHECK (reason IN ('defective', 'wrong_item', 'customer_request', 'damaged', 'other')),
        "reasonDescription" TEXT,
        items JSON NOT NULL DEFAULT '[]',
        subtotal DECIMAL(15,2) NOT NULL,
        "taxAmount" DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
        total DECIMAL(15,2) NOT NULL,
        "refundAmount" DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
        currency VARCHAR(10) DEFAULT 'LYD' NOT NULL CHECK (currency IN ('LYD', 'USD', 'EUR', 'CNY')),
        "exchangeRate" DECIMAL(10,4) DEFAULT 1.0000 NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
        "refundStatus" VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK ("refundStatus" IN ('pending', 'partial', 'completed', 'cancelled')),
        "refundMethod" VARCHAR(20) CHECK ("refundMethod" IN ('cash', 'bank_transfer', 'credit_note', 'exchange')),
        notes TEXT,
        attachments JSON DEFAULT '[]',
        "createdBy" UUID NOT NULL REFERENCES users(id),
        "approvedBy" UUID REFERENCES users(id),
        "approvedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ تم إنشاء جدول sales_returns');

    // Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_returns_number ON sales_returns("returnNumber")
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_returns_date ON sales_returns(date)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_returns_customer ON sales_returns("customerId")
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_returns_status ON sales_returns(status)
    `);

    console.log('✅ تم إنشاء indexes');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

createSalesReturnsTable();
