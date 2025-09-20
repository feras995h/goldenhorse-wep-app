import express from 'express';
import db from '../models/index.js';

const router = express.Router();
const { PurchaseInvoice, Supplier } = db;

// إنشاء فاتورة مشتريات جديدة
router.post('/', async (req, res) => {
  try {
    const invoice = await PurchaseInvoice.create(req.body);
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// جلب جميع فواتير المشتريات
router.get('/', async (req, res) => {
  try {
    const invoices = await PurchaseInvoice.findAll({ include: [{ model: Supplier, as: 'supplier' }] });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب فاتورة مشتريات واحدة
router.get('/:id', async (req, res) => {
  try {
    const invoice = await PurchaseInvoice.findByPk(req.params.id, { include: [{ model: Supplier, as: 'supplier' }] });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تحديث فاتورة مشتريات
router.put('/:id', async (req, res) => {
  try {
    const [updated] = await PurchaseInvoice.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Invoice not found' });
    const invoice = await PurchaseInvoice.findByPk(req.params.id);
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// حذف فاتورة مشتريات
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await PurchaseInvoice.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
