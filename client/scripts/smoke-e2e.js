/* eslint-disable no-console */
(async () => {
  const base = process.env.API_BASE || 'http://localhost:3000/api';
  const j = (r) => r.json();
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  const addDays = (d, n) => new Date(d.getTime() + n*24*60*60*1000);

  const out = { steps: [] };

  try {
    // 1) Login
    const auth = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test', password: 'test123' })
    }).then(j);
    const token = auth.accessToken;
    if (!token) throw new Error('No accessToken from login');
    out.steps.push({ step: 'login', ok: true, user: auth.user });

    const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    // 2) Create test customer
    const custCode = `C${Date.now()}`;
    const customer = await fetch(`${base}/sales/customers`, {
      method: 'POST', headers: H,
      body: JSON.stringify({ code: custCode, name: `Test Customer ${custCode}`, phone: '0910000000', type: 'individual', creditLimit: 0, paymentTerms: 30, currency: 'LYD' })
    }).then(j);
    const customerId = (customer.id) || (customer.data && customer.data.id) || (customer.customer && customer.customer.id);
    if (!customerId) throw new Error('Failed to create customer');
    out.steps.push({ step: 'create_customer', ok: true, customerId });

    // 3) Get an account (prefer cash/bank)
    const accountsRes = await fetch(`${base}/financial/accounts?limit=200`, { headers: { Authorization: `Bearer ${token}` } }).then(j);
    const accounts = accountsRes.data || accountsRes.rows || accountsRes;
    out.steps.push({ step: 'accounts_snapshot', ok: true, sample: Array.isArray(accounts) ? accounts.slice(0, 10).map(a => ({code: a.code, name: a.name, isGroup: a.isGroup})) : accounts });
    const account = (Array.isArray(accounts) && accounts.find(a => a && a.isGroup === false)) || (accounts && accounts[0]) || null;
    if (!account || !account.id) throw new Error('No ledger account found');
    out.steps.push({ step: 'get_account', ok: true, account: { id: account.id, code: account.code, name: account.name, isGroup: account.isGroup } });

    // 4) Create a shipping invoice
    const shipPayload = {
      customerId,
      date: fmt(today),
      dueDate: fmt(addDays(today, 7)),
      currency: 'LYD',
      exchangeRate: 1,
      itemDescription: 'SmokeTest shipment description'
    };
    await new Promise(r => setTimeout(r, 1200));
    const shipInv = await fetch(`${base}/sales/shipping-invoices`, { method: 'POST', headers: H, body: JSON.stringify(shipPayload) }).then(j);
    const shipInvId = shipInv.id || (shipInv.data && shipInv.data.id);
    out.steps.push({ step: 'create_shipping_invoice', ok: !!shipInvId, id: shipInvId, error: shipInv.message, full: shipInv });

    // 5) List shipping invoices to confirm
    const shipList = await fetch(`${base}/sales/shipping-invoices?limit=5`, { headers: { Authorization: `Bearer ${token}` } }).then(j);
    out.steps.push({ step: 'list_shipping_invoices', ok: true, count: shipList.total || (shipList.data && shipList.data.length) || (shipList.length || 0) });

    // 6) Create a sales invoice with items
    const salesPayload = {
      customerId,
      date: fmt(today),
      dueDate: fmt(addDays(today, 14)),
      items: [ { description: 'Item A', quantity: 2, unitPrice: 100, totalPrice: 200 } ],
      notes: 'SmokeTest sales invoice'
    };
    await new Promise(r => setTimeout(r, 1200));
    const salesInv = await fetch(`${base}/sales/invoices`, { method: 'POST', headers: H, body: JSON.stringify(salesPayload) }).then(j);
    const salesInvId = salesInv.id || (salesInv.data && salesInv.data.id) || salesInv.invoiceId || salesInv.invoice?.id;
    out.steps.push({ step: 'create_sales_invoice', ok: !!salesInvId, id: salesInvId, error: salesInv.message, full: salesInv });

    // 7) Create receipt voucher allocating to the sales invoice
    const receiptPayload = {
      accountId: account.id,
      partyType: 'customer',
      partyId: customerId,
      amount: 200,
      receiptDate: fmt(today),
      paymentMethod: 'cash',
      currency: 'LYD',
      exchangeRate: 1,
      invoiceAllocations: salesInvId ? [ { invoiceId: salesInvId, amount: 200 } ] : []
    };
    await new Promise(r => setTimeout(r, 1200));
    const receipt = await fetch(`${base}/financial/vouchers/receipts`, { method: 'POST', headers: H, body: JSON.stringify(receiptPayload) }).then(j);
    out.steps.push({ step: 'create_receipt_voucher', ok: !!(receipt && (receipt.id || (receipt.data && receipt.data.id))), response: receipt });

    // 8) Fetch sales invoice to verify outstanding reduced
    let salesAfter = null;
    if (salesInvId) {
      await new Promise(r => setTimeout(r, 1200));
      salesAfter = await fetch(`${base}/sales/invoices/${salesInvId}`, { headers: { Authorization: `Bearer ${token}` } }).then(j);
    }
    out.steps.push({ step: 'verify_sales_invoice', ok: !!salesAfter, invoice: salesAfter });

    // 9) Create payment voucher (customer type for test)
    await new Promise(r => setTimeout(r, 1200));
    const paymentPayload = {
      accountId: account.id,
      partyType: 'customer',
      partyId: customerId,
      amount: 50,
      date: fmt(today),
      paymentMethod: 'cash',
      currency: 'LYD',
      exchangeRate: 1
    };
    const payment = await fetch(`${base}/financial/vouchers/payments`, { method: 'POST', headers: H, body: JSON.stringify(paymentPayload) }).then(j);
    out.steps.push({ step: 'create_payment_voucher', ok: !!(payment && (payment.id || (payment.data && payment.data.id))), response: payment });

    // 10) Done
    out.success = true;
  } catch (e) {
    out.success = false;
    out.error = e?.message || String(e);
  } finally {
    console.log(JSON.stringify(out, null, 2));
  }
})();

