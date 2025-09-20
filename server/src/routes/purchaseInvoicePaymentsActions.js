import express from 'express';
import db from '../models/index.js';

const router = express.Router();
const { PurchaseInvoicePayment } = db;

// إلغاء التخصيص (Unmatching) لمطابقة دفع محددة
router.post('/:id/unmatch', async (req, res) => {
  try {
    const match = await PurchaseInvoicePayment.findByPk(req.params.id);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    await match.destroy();
    res.json({ success: true, message: 'تم إلغاء التخصيص بنجاح.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تحقق واجهي: التأكد من عدم تجاوز المبلغ المتبقي للفاتورة أو السند
router.post('/validate', async (req, res) => {
  try {
    const { purchaseInvoiceId, paymentVoucherId, matchedAmount } = req.body;
    // تحقق من المتبقي في الفاتورة
    const invoice = await db.PurchaseInvoice.findByPk(purchaseInvoiceId);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    const totalMatchedInvoice = await PurchaseInvoicePayment.sum('matchedAmount', { where: { purchaseInvoiceId } });
    const remainingInvoice = parseFloat(invoice.totalAmount) - (totalMatchedInvoice || 0);
    if (matchedAmount > remainingInvoice) {
      return res.status(400).json({ error: 'المبلغ يتجاوز المتبقي في الفاتورة.' });
    }
    // تحقق من المتبقي في السند
    const voucher = await db.PaymentVoucher.findByPk(paymentVoucherId);
    if (!voucher) return res.status(404).json({ error: 'Voucher not found' });
    const totalMatchedVoucher = await PurchaseInvoicePayment.sum('matchedAmount', { where: { paymentVoucherId } });
    const remainingVoucher = parseFloat(voucher.amount) - (totalMatchedVoucher || 0);
    if (matchedAmount > remainingVoucher) {
      return res.status(400).json({ error: 'المبلغ يتجاوز المتبقي في السند.' });
    }
    res.json({ valid: true, remainingInvoice, remainingVoucher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
