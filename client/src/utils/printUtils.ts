// Print utility functions for financial documents

export const printReceiptVoucher = (data: any) => {
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إيصال قبض</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            direction: rtl;
            text-align: right;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .receipt-title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
          }
          .receipt-subtitle {
            font-size: 18px;
            color: #666;
          }
          .receipt-details {
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px dashed #ccc;
          }
          .detail-label {
            font-weight: bold;
            color: #333;
          }
          .detail-value {
            color: #666;
          }
          .amount-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #333;
            border-radius: 5px;
          }
          .amount-label {
            font-size: 18px;
            margin-bottom: 10px;
          }
          .amount-value {
            font-size: 28px;
            font-weight: bold;
            color: #2e7d32;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
          }
          .signature-box {
            text-align: center;
            flex: 1;
          }
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
          }
          @media print {
            body {
              padding: 10px;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          <div class="receipt-title">إيصال قبض</div>
          <div class="receipt-subtitle">منضومة وائل للخدمات اللوجستية</div>
        </div>
        
        <div class="receipt-details">
          <div class="detail-row">
            <span class="detail-label">رقم الإيصال:</span>
            <span class="detail-value">${data.receiptNumber || '---'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">التاريخ:</span>
            <span class="detail-value">${data.date ? new Date(data.date).toLocaleDateString('ar-LY') : '---'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">الحساب:</span>
            <span class="detail-value">${data.accountName || '---'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">الوصف:</span>
            <span class="detail-value">${data.description || '---'}</span>
          </div>
          ${data.reference ? `
          <div class="detail-row">
            <span class="detail-label">المرجع:</span>
            <span class="detail-value">${data.reference}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="amount-section">
          <div class="amount-label">المبلغ المقبوض</div>
          <div class="amount-value">${data.amount ? new Intl.NumberFormat('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data.amount) : '0.00'} ${data.currency || 'LYD'}</div>
        </div>
        
        <div class="signature-section">
          <div class="signature-box">
            <div>المحصل</div>
            <div class="signature-line">التوقيع</div>
          </div>
          <div class="signature-box">
            <div>السائق</div>
            <div class="signature-line">التوقيع</div>
          </div>
          <div class="signature-box">
            <div>المستلم</div>
            <div class="signature-line">التوقيع</div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #2e7d32; color: white; border: none; border-radius: 5px; cursor: pointer;">طباعة الإيصال</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #757575; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">إغلاق</button>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
  }
};

export const printPaymentVoucher = (data: any) => {
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إيصال صرف</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            direction: rtl;
            text-align: right;
          }
          .payment-header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .payment-title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
          }
          .payment-subtitle {
            font-size: 18px;
            color: #666;
          }
          .payment-details {
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px dashed #ccc;
          }
          .detail-label {
            font-weight: bold;
            color: #333;
          }
          .detail-value {
            color: #666;
          }
          .amount-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #333;
            border-radius: 5px;
          }
          .amount-label {
            font-size: 18px;
            margin-bottom: 10px;
          }
          .amount-value {
            font-size: 28px;
            font-weight: bold;
            color: #c62828;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
          }
          .signature-box {
            text-align: center;
            flex: 1;
          }
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
          }
          @media print {
            body {
              padding: 10px;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="payment-header">
          <div class="payment-title">إيصال صرف</div>
          <div class="payment-subtitle">منضومة وائل للخدمات اللوجستية</div>
        </div>
        
        <div class="payment-details">
          <div class="detail-row">
            <span class="detail-label">رقم الإيصال:</span>
            <span class="detail-value">${data.paymentNumber || '---'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">التاريخ:</span>
            <span class="detail-value">${data.date ? new Date(data.date).toLocaleDateString('ar-LY') : '---'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">الحساب:</span>
            <span class="detail-value">${data.accountName || '---'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">الوصف:</span>
            <span class="detail-value">${data.description || '---'}</span>
          </div>
          ${data.reference ? `
          <div class="detail-row">
            <span class="detail-label">المرجع:</span>
            <span class="detail-value">${data.reference}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="amount-section">
          <div class="amount-label">المبلغ المدفوع</div>
          <div class="amount-value">${data.amount ? new Intl.NumberFormat('ar-LY').format(data.amount) : '0'} ${data.currency || 'LYD'}</div>
        </div>
        
        <div class="signature-section">
          <div class="signature-box">
            <div>الدائن</div>
            <div class="signature-line">التوقيع</div>
          </div>
          <div class="signature-box">
            <div>المحاسب</div>
            <div class="signature-line">التوقيع</div>
          </div>
          <div class="signature-box">
            <div>المدير المالي</div>
            <div class="signature-line">التوقيع</div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #c62828; color: white; border: none; border-radius: 5px; cursor: pointer;">طباعة الإيصال</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #757575; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">إغلاق</button>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
  }
};

export const printAccountStatement = (data: any) => {
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>كشف حساب</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            direction: rtl;
            text-align: right;
          }
          .statement-header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .statement-title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
          }
          .statement-subtitle {
            font-size: 18px;
            color: #666;
          }
          .account-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 5px;
          }
          .info-item {
            flex: 1;
          }
          .info-label {
            font-weight: bold;
            color: #333;
          }
          .info-value {
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #333;
            padding: 8px;
            text-align: right;
          }
          th {
            background: #e0e0e0;
            font-weight: bold;
          }
          .debit {
            color: #2e7d32;
          }
          .credit {
            color: #c62828;
          }
          .balance {
            font-weight: bold;
          }
          .summary {
            margin-top: 20px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 5px;
            text-align: left;
          }
          @media print {
            body {
              padding: 10px;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="statement-header">
          <div class="statement-title">كشف حساب</div>
          <div class="statement-subtitle">منضومة وائل للخدمات اللوجستية</div>
        </div>
        
        <div class="account-info">
          <div class="info-item">
            <div class="info-label">اسم الحساب:</div>
            <div class="info-value">${data.accountName || '---'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">رمز الحساب:</div>
            <div class="info-value">${data.accountCode || '---'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">الفترة:</div>
            <div class="info-value">${data.period || '---'}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>الوصف</th>
              <th>المدين</th>
              <th>الدائن</th>
              <th>الرصيد</th>
            </tr>
          </thead>
          <tbody>
            ${(data.transactions || []).map((transaction: any) => `
              <tr>
                <td>${transaction.date ? new Date(transaction.date).toLocaleDateString('ar-LY') : ''}</td>
                <td>${transaction.description || ''}</td>
                <td class="debit">${transaction.type === 'receipt' ? new Intl.NumberFormat('ar-LY').format(transaction.amount) : ''}</td>
                <td class="credit">${transaction.type === 'payment' ? new Intl.NumberFormat('ar-LY').format(transaction.amount) : ''}</td>
                <td class="balance">${new Intl.NumberFormat('ar-LY').format(transaction.balance || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="summary">
          <div>الرصيد الافتتاحي: ${new Intl.NumberFormat('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data.openingBalance || 0)} ${data.currency || 'LYD'}</div>
          <div>إجمالي المدين: ${new Intl.NumberFormat('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data.totalDebit || 0)} ${data.currency || 'LYD'}</div>
          <div>إجمالي الدائن: ${new Intl.NumberFormat('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data.totalCredit || 0)} ${data.currency || 'LYD'}</div>
          <div>الرصيد الختامي: ${new Intl.NumberFormat('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data.closingBalance || 0)} ${data.currency || 'LYD'}</div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 5px; cursor: pointer;">طباعة كشف الحساب</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #757575; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">إغلاق</button>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
  }
};