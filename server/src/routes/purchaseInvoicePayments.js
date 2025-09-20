import express from 'express';
import db from '../models/index.js';

const router = express.Router();
const { PurchaseInvoicePayment, PurchaseInvoice, PaymentVoucher, Supplier } = db;

// إنشاء مطابقة جديدة بين سند دفع وفاتورة مشتريات
router.post('/', async (req, res) => {
  try {
    const match = await PurchaseInvoicePayment.create(req.body);
    res.status(201).json(match);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// جلب جميع المطابقات مع تفاصيل الفاتورة والسند والمورد
router.get('/', async (req, res) => {
  try {
    const matches = await PurchaseInvoicePayment.findAll({
      include: [
        { model: PurchaseInvoice, as: 'purchaseInvoice', include: [{ model: Supplier, as: 'supplier' }] },
        { model: PaymentVoucher, as: 'paymentVoucher' }
      ]
    });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب مطابقة واحدة
router.get('/:id', async (req, res) => {
  try {
    const match = await PurchaseInvoicePayment.findByPk(req.params.id, {
      include: [
        { model: PurchaseInvoice, as: 'purchaseInvoice', include: [{ model: Supplier, as: 'supplier' }] },
        { model: PaymentVoucher, as: 'paymentVoucher' }
      ]
    });
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تحديث مطابقة
router.put('/:id', async (req, res) => {
  try {
    const [updated] = await PurchaseInvoicePayment.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Match not found' });
    const match = await PurchaseInvoicePayment.findByPk(req.params.id);
    res.json(match);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// حذف مطابقة
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await PurchaseInvoicePayment.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Match not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
