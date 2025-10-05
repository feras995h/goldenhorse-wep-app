import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = (process.env.DB_URL || process.env.DATABASE_URL || '').trim();
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

async function testEndpoints() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected\n');

    console.log('🧪 Testing database queries for failing endpoints:\n');
    console.log('='.repeat(70));

    // Test 1: Sales Summary
    console.log('\n1️⃣ Testing /api/sales/summary query:');
    try {
      const [salesResult] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_invoices,
          COALESCE(SUM(total), 0) as total_amount
        FROM sales_invoices
        WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      `);
      console.log('   ✅ Query successful');
      console.log('   📊 Result:', salesResult[0]);
    } catch (err) {
      console.log('   ❌ Error:', err.message);
    }

    // Test 2: Receipt Vouchers
    console.log('\n2️⃣ Testing /api/financial/vouchers/receipts query:');
    try {
      const [receiptsResult] = await sequelize.query(`
        SELECT 
          id, "voucherNumber", date, amount, status
        FROM receipt_vouchers
        ORDER BY date DESC
        LIMIT 5
      `);
      console.log('   ✅ Query successful');
      console.log(`   📊 Found ${receiptsResult.length} receipts`);
    } catch (err) {
      console.log('   ❌ Error:', err.message);
    }

    // Test 3: Payment Vouchers
    console.log('\n3️⃣ Testing /api/financial/vouchers/payments query:');
    try {
      const [paymentsResult] = await sequelize.query(`
        SELECT 
          id, "voucherNumber", date, amount, status
        FROM payment_vouchers
        ORDER BY date DESC
        LIMIT 5
      `);
      console.log('   ✅ Query successful');
      console.log(`   📊 Found ${paymentsResult.length} payments`);
    } catch (err) {
      console.log('   ❌ Error:', err.message);
    }

    // Test 4: Shipments ETA
    console.log('\n4️⃣ Testing /api/sales/shipments/eta-metrics query:');
    try {
      const [shipmentsResult] = await sequelize.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
          COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit
        FROM shipments
      `);
      console.log('   ✅ Query successful');
      console.log('   📊 Result:', shipmentsResult[0]);
    } catch (err) {
      console.log('   ❌ Error:', err.message);
    }

    // Test 5: Top Delayed Shipments
    console.log('\n5️⃣ Testing /api/sales/shipments/top-delays query:');
    try {
      const [delaysResult] = await sequelize.query(`
        SELECT 
          id, "trackingNumber", status, "estimatedArrival", "actualArrival"
        FROM shipments
        WHERE "estimatedArrival" IS NOT NULL
        ORDER BY "estimatedArrival" DESC
        LIMIT 10
      `);
      console.log('   ✅ Query successful');
      console.log(`   📊 Found ${delaysResult.length} shipments`);
    } catch (err) {
      console.log('   ❌ Error:', err.message);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Testing complete\n');

    await sequelize.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testEndpoints();
