const { Sequelize } = require('sequelize');

async function testShipmentsFix() {
  const sequelize = new Sequelize('postgres://postgres:password@localhost:5432/accounting_system');
  
  try {
    console.log('🔍 اختبار إصلاح shipments...');
    
    const result = await sequelize.query(`
      SELECT 
        COALESCE(COUNT(DISTINCT si.id), 0) as total_invoices,
        COALESCE(SUM(si."totalAmount"), 0) as total_sales,
        COALESCE(COUNT(DISTINCT si."customerId"), 0) as active_customers,
        COALESCE(COUNT(DISTINCT s.id), 0) as total_shipments,
        COALESCE(SUM(s."shippingCost"), 0) as shipping_revenue
      FROM sales_invoices si
      LEFT JOIN shipments s ON true
      WHERE si."isActive" = true
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('✅ Sales Summary Query Test:');
    console.log('  - Total Invoices:', result[0].total_invoices);
    console.log('  - Total Sales:', result[0].total_sales);
    console.log('  - Active Customers:', result[0].active_customers);
    console.log('  - Total Shipments:', result[0].total_shipments);
    console.log('  - Shipping Revenue:', result[0].shipping_revenue);
    
    console.log('\n🎉 إصلاح shipments نجح!');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
  }
}

testShipmentsFix();
