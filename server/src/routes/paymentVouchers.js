import express from 'express';
import db from '../models/index.js';

const router = express.Router();
const { PaymentVoucher, Supplier } = db;

// إنشاء سند دفع جديد
router.post('/', async (req, res) => {
  try {
    const voucher = await PaymentVoucher.create(req.body);
    res.status(201).json(voucher);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// جلب جميع سندات الدفع
router.get('/', async (req, res) => {
  try {
    const vouchers = await PaymentVoucher.findAll({ include: [{ model: Supplier, as: 'supplier' }] });
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب سند دفع واحد
router.get('/:id', async (req, res) => {
  try {
    const voucher = await PaymentVoucher.findByPk(req.params.id, { include: [{ model: Supplier, as: 'supplier' }] });
    if (!voucher) return res.status(404).json({ error: 'Voucher not found' });
    res.json(voucher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تحديث سند دفع
router.put('/:id', async (req, res) => {
  try {
    const [updated] = await PaymentVoucher.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Voucher not found' });
    const voucher = await PaymentVoucher.findByPk(req.params.id);
    res.json(voucher);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// حذف سند دفع
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await PaymentVoucher.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Voucher not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
