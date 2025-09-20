export function openPrintWindow(title: string, html: string, extraCss: string = '') {
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) {
    alert('لم يتم فتح نافذة الطباعة. الرجاء السماح بالنوافذ المنبثقة (Pop-ups).');
    return;
  }

  const baseCss = `
    @page { size: A4; margin: 14mm; }
    html, body { direction: rtl; font-family: Tahoma, Arial, sans-serif; color: #111; }
    * { box-sizing: border-box; }
    .print-container { width: 100%; margin: 0 auto; }
    .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #ddd; padding-bottom: 12px; margin-bottom: 16px; }
    .logo { width: 90px; height: 90px; object-fit: contain; }
    .company { line-height: 1.6; }
    .company .name { font-size: 20px; font-weight: 700; }
    .meta { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px 16px; margin: 12px 0; }
    .title { text-align: center; font-size: 18px; font-weight: 700; margin: 12px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
    th { background: #f9fafb; text-align: right; }
    .totals { margin-top: 12px; width: 320px; margin-left: auto; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
    .footer { margin-top: 24px; display: flex; justify-content: space-between; font-size: 12px; color: #444; }
    .muted { color: #6b7280; }
  `;

  const doc = win.document;
  doc.open();
  doc.write(`<!doctype html><html lang="ar" dir="rtl"><head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>${baseCss}${extraCss}</style>
  </head><body>
    <div class="print-container">${html}</div>
    <script>
      window.onload = function(){
        window.focus();
        window.print();
      };
    </script>
  </body></html>`);
  doc.close();
}

