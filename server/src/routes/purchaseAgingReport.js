import express from 'express';
import db from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();
const { PurchaseInvoice, Supplier, PurchaseInvoicePayment } = db;

// تقرير أعمار الديون للموردين
router.get('/aging', async (req, res) => {
  try {
    // جلب جميع الفواتير المفتوحة مع المورد
    const invoices = await PurchaseInvoice.findAll({
      where: { status: { [Op.ne]: 'paid' } },
      include: [{ model: Supplier, as: 'supplier' }]
    });

    // حساب المبالغ المدفوعة لكل فاتورة
    const invoiceIds = invoices.map(inv => inv.id);
    const payments = await PurchaseInvoicePayment.findAll({
      where: { purchaseInvoiceId: { [Op.in]: invoiceIds } }
    });
    const paidMap = {};
    payments.forEach(p => {
      paidMap[p.purchaseInvoiceId] = (paidMap[p.purchaseInvoiceId] || 0) + parseFloat(p.matchedAmount);
    });

    // بناء تقرير الأعمار
    const today = new Date();
    const agingBuckets = [
      { label: '0-30', from: 0, to: 30 },
      { label: '31-60', from: 31, to: 60 },
      { label: '61-90', from: 61, to: 90 },
      { label: '91+', from: 91, to: 10000 }
    ];
    const report = {};
    invoices.forEach(inv => {
      const due = new Date(inv.dueDate);
      const days = Math.floor((today - due) / (1000 * 60 * 60 * 24));
      const paid = paidMap[inv.id] || 0;
      const outstanding = parseFloat(inv.totalAmount) - paid;
      if (outstanding <= 0) return;
      const bucket = agingBuckets.find(b => days >= b.from && days <= b.to) || agingBuckets[agingBuckets.length-1];
      const supplierId = inv.supplierId;
      if (!report[supplierId]) {
        report[supplierId] = {
          supplier: inv.supplier,
          buckets: { '0-30': 0, '31-60': 0, '61-90': 0, '91+': 0 },
          total: 0
        };
      }
      report[supplierId].buckets[bucket.label] += outstanding;
      report[supplierId].total += outstanding;
    });
    res.json(Object.values(report));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
