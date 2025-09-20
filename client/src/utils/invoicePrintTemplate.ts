import { CompanyInfoAr } from '../config/companyInfo';
import { formatCurrencyAmount } from './formatters';

export interface InvoiceForPrintItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
  totalAmount?: number;
}

export interface InvoiceForPrint {
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  customerName: string;
  notes?: string;
  currency?: string;
  items: InvoiceForPrintItem[];
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  paidAmount?: number;
}

function fmtCurrency(value: number | undefined, currency: string = 'LYD') {
  const v = typeof value === 'number' ? value : 0;
  const formatted = formatCurrencyAmount(v, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    showZeroDecimals: true
  });
  return `${formatted} \u062f.\u0644`;
}

function fmtDate(value?: string) {
  if (!value) return '-';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('ar-EG');
}

export function invoiceTemplateAr(inv: InvoiceForPrint, company: CompanyInfoAr, logoUrl?: string) {
  const currency = inv.currency || 'LYD';
  const items = inv.items || [];

  const computed = items.map(it => {
    const subtotal = (it.quantity || 0) * (it.unitPrice || 0);
    const discount = subtotal * ((it.discountPercent || 0) / 100);
    const taxable = subtotal - discount;
    const tax = taxable * ((it.taxPercent || 0) / 100);
    const total = typeof it.totalAmount === 'number' ? it.totalAmount : (taxable + tax);
    return { ...it, subtotal, discount, tax, total };
  });

  const subtotal = computed.reduce((s, it) => s + it.subtotal, 0);
  const discountAmount = computed.reduce((s, it) => s + it.discount, 0);
  const taxAmount = computed.reduce((s, it) => s + it.tax, 0);
  const totalAmount = typeof inv.totalAmount === 'number' ? inv.totalAmount : (subtotal - discountAmount + taxAmount);
  const paidAmount = typeof inv.paidAmount === 'number' ? inv.paidAmount : 0;
  const remaining = Math.max(0, totalAmount - paidAmount);

  const logoImg = logoUrl ? `<img class="logo" src="${logoUrl}" alt="Logo" />` : '';

  return `
    <div class="header">
      ${logoImg}
      <div class="company">
        <div class="name">${company.name || ''}</div>
        <div>${company.address || ''}</div>
        <div>${company.phone || ''}${company.email ? ' | ' + company.email : ''}</div>
      </div>
    </div>

    <div class="title">فاتورة مبيعات</div>

    <div class="meta">
      <div><span class="muted">رقم الفاتورة:</span> ${inv.invoiceNumber || '-'}</div>
      <div><span class="muted">التاريخ:</span> ${fmtDate(inv.date)}</div>
      <div><span class="muted">العميل:</span> ${inv.customerName || '-'}</div>
      <div><span class="muted">الاستحقاق:</span> ${fmtDate(inv.dueDate)}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>الوصف</th>
          <th>الكمية</th>
          <th>السعر</th>
          <th>الخصم %</th>
          <th>الضريبة %</th>
          <th>الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${computed.map(it => `
          <tr>
            <td>${it.description || ''}</td>
            <td>${(it.quantity || 0).toLocaleString('ar-EG')}</td>
            <td>${fmtCurrency(it.unitPrice || 0, currency)}</td>
            <td>${(it.discountPercent || 0).toLocaleString('ar-EG')}</td>
            <td>${(it.taxPercent || 0).toLocaleString('ar-EG')}</td>
            <td>${fmtCurrency(it.total, currency)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="row"><span class="muted">المجموع الفرعي:</span><span>${fmtCurrency(subtotal, currency)}</span></div>
      <div class="row"><span class="muted">الخصومات:</span><span>${fmtCurrency(discountAmount, currency)}</span></div>
      <div class="row"><span class="muted">الضرائب:</span><span>${fmtCurrency(taxAmount, currency)}</span></div>
      <div class="row" style="font-weight:700;"><span>الإجمالي:</span><span>${fmtCurrency(totalAmount, currency)}</span></div>
      <div class="row"><span class="muted">المدفوع:</span><span>${fmtCurrency(paidAmount, currency)}</span></div>
      <div class="row"><span class="muted">المتبقي:</span><span>${fmtCurrency(remaining, currency)}</span></div>
    </div>

    ${inv.notes ? `<div style="margin-top:14px"><span class="muted">ملاحظات:</span> ${inv.notes}</div>` : ''}

    <div class="footer">
      <div class="muted">شكراً لتعاملكم معنا</div>
      <div class="muted">تم الإنشاء بواسطة النظام</div>
    </div>
  `;
}

