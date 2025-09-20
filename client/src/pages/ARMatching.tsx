import React, { useEffect, useState } from 'react';
import { arAPI, salesAPI } from '../services/api';

const ARMatching: React.FC = () => {
  const [customerId, setCustomerId] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [customerQuery, setCustomerQuery] = useState<string>('');
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [allocating, setAllocating] = useState<string | null>(null);
  const [rowAllocations, setRowAllocations] = useState<Record<string, { receiptId?: string; amount?: number }>>({});
  const [allocations, setAllocations] = useState<any[]>([]);
  const [allocationsLoading, setAllocationsLoading] = useState(false);

  const refreshAllocations = async () => {
    if (!customerId) return;
    setAllocationsLoading(true);
    try {
      const res = await arAPI.getAllocations({ customer_id: customerId, limit: 200 });
      setAllocations(res.data || []);
    } finally {
      setAllocationsLoading(false);
    }
  };

  const loadData = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const [invRes, recRes] = await Promise.all([
        arAPI.getOpenInvoices({ customer_id: customerId, limit: 100 }),
        arAPI.getCustomerReceipts({ customer_id: customerId }),
      ]);
      setInvoices(invRes.data?.invoices || []);
      setReceipts(recRes.data || []);
      await refreshAllocations();
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async (invoiceId: string, receiptId: string, amount: number) => {
    if (!receiptId || !amount) return;
    setAllocating(invoiceId);
    try {
      await arAPI.allocate({ invoice_id: invoiceId, receipt_id: receiptId, amount });
      await loadData();
    } finally {
      setAllocating(null);
    }
  };

  const handleBatchAllocate = async () => {
    const allocations = Object.entries(rowAllocations)
      .map(([invoice_id, v]) => ({ invoice_id, receipt_id: v.receiptId!, amount: Number(v.amount || 0) }))
      .filter(a => a.receipt_id && a.amount > 0);
    if (allocations.length === 0) return;
    setLoading(true);
    try {
      await arAPI.allocateBatch({ allocations });
      setRowAllocations({});
      await loadData();
      await refreshAllocations();
    } finally {
      setLoading(false);
    }
  };

  const handleUnallocate = async (allocationId: string) => {
    if (!allocationId) return;
    const ok = window.confirm('هل تريد إلغاء هذا التخصيص؟');
    if (!ok) return;
    setLoading(true);
    try {
      await arAPI.unallocate({ allocation_id: allocationId });
      await loadData();
      await refreshAllocations();
    } finally {
      setLoading(false);
    }
  };

  const receiptRemaining = (rid?: string) => receipts.find((r:any)=>r.id===rid)?.remaining ?? 0;
  const receiptTotalsMap = React.useMemo(()=>{
    const m: Record<string, number> = {};
    Object.values(rowAllocations).forEach(v => {
      if (v.receiptId && v.amount && v.amount > 0) {
        m[v.receiptId] = (m[v.receiptId] || 0) + Number(v.amount);
      }
    });
    return m;
  }, [rowAllocations]);
  const isRowInvalid = (inv:any) => {
    const v = rowAllocations[inv.id];
    if (!v) return false;
    const amt = Number(v.amount || 0);
    if (amt > Number(inv.outstanding || 0)) return true;
    if (v.receiptId) {
      const totalForReceipt = receiptTotalsMap[v.receiptId] || 0;
      if (totalForReceipt > receiptRemaining(v.receiptId)) return true;
    }
    return false;
  };
  const totalSelected = Object.entries(rowAllocations).reduce((s,[id,v])=>s + (Number(v.amount||0)>0 && v.receiptId ? Number(v.amount||0) : 0), 0);
  const hasInvalid = invoices.some(inv => isRowInvalid(inv));

  useEffect(() => {
    let active = true;
    const fetchCustomers = async () => {
      if (customerQuery && customerQuery.trim().length >= 2) {
        try {
          const res = await salesAPI.getCustomers({ search: customerQuery, limit: 10 });
          if (!active) return;
          const rows = Array.isArray(res) ? res : (res.data || []);
          setCustomerOptions(rows);
          setShowOptions(rows.length > 0);
        } catch {
          setCustomerOptions([]);
          setShowOptions(false);
        }
      } else {
        setCustomerOptions([]);
        setShowOptions(false);
      }
    };
    fetchCustomers();
    return () => { active = false; };
  }, [customerQuery]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">مطابقة إيصالات القبض بالفواتير</h1>

      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <label className="block text-sm">العميل</label>
          <input
            value={customerQuery}
            onChange={(e) => setCustomerQuery(e.target.value)}
            onFocus={() => setShowOptions(customerOptions.length > 0)}
            className="input input-bordered w-full"
            placeholder="اكتب اسم العميل (2+ حروف)"
          />
          {showOptions && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-60 overflow-auto">
              {customerOptions.map((c: any) => (
                <div
                  key={c.id}
                  className="px-3 py-2 hover:bg-golden-50 cursor-pointer text-sm"
                  onClick={() => {
                    setCustomerId(c.id);
                    setSelectedCustomerName(c.name || c.displayName || c.code || c.id);
                    setCustomerQuery(c.name || c.displayName || c.code || c.id);
                    setShowOptions(false);
                  }}
                >
                  {(c.name || c.displayName) || c.code} <span className="text-gray-500 text-xs">({c.code || c.id?.slice(0,8)})</span>
                </div>
              ))}
              {customerOptions.length === 0 && (
                <div className="px-3 py-2 text-gray-500 text-sm">لا توجد نتائج</div>
              )}
            </div>
          )}
          {customerId && (
            <div className="text-xs text-gray-600 mt-1">المحدد: {selectedCustomerName}</div>
          )}
        </div>
        <button onClick={loadData} className="btn btn-primary" disabled={!customerId || loading}>
          {loading ? 'جاري التحميل...' : 'تحميل' }
        </button>
      </div>

      {invoices.length > 0 && (
        <div className="overflow-x-auto">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-600">الفواتير المفتوحة: {invoices.length}</div>
            <div className="flex items-center gap-3">
              <div className={`text-xs ${hasInvalid ? 'text-red-600' : 'text-gray-600'}`}>
                إجمالي التخصيص المختار: {totalSelected}
                {hasInvalid && <span className="ml-2">(هناك إدخالات غير صالحة يجب تعديلها)</span>}
              </div>
              <button
                onClick={handleBatchAllocate}
                className="btn btn-sm btn-primary"
                disabled={Object.values(rowAllocations).filter(v => v.receiptId && Number(v.amount || 0) > 0).length === 0 || loading || hasInvalid}
              >
                حفظ كل التخصيصات
              </button>
            </div>
          </div>
          <table className="table w-full">
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>التاريخ</th>
                <th>الإجمالي</th>
                <th>المتبقي</th>
                <th>التخصيص</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id}>
                  <td>{inv.invoiceNumber || inv.id.slice(0, 8)}</td>
                  <td>{inv.date?.slice(0,10)}</td>
                  <td>{inv.total}</td>
                  <td>{inv.outstanding}</td>
                  <td>
                    <div className="flex gap-2 items-center">
                      <select
                        className="select select-bordered select-sm"
                        value={rowAllocations[inv.id]?.receiptId || ''}
                        onChange={(e) => {
                          const rid = e.target.value || undefined as any;
                          setRowAllocations(prev => {
                            const prevRow = prev[inv.id] || {} as any;
                            const allowed = Math.min(Number(inv.outstanding || 0), receiptRemaining(rid));
                            let nextAmount = prevRow.amount ?? Math.min(Number(inv.outstanding || 0), allowed);
                            if (Number(nextAmount || 0) > allowed) nextAmount = allowed;
                            return {
                              ...prev,
                              [inv.id]: { ...prevRow, receiptId: rid, amount: nextAmount }
                            };
                          });
                        }}
                      >
                        <option value="">اختر إيصالاً</option>
                        {receipts.map((r: any) => (
                          <option key={r.id} value={r.id}>
                            {r.receipt_no} • المتبقي {r.remaining}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        max={inv.outstanding}
                        className={`input input-bordered input-sm w-28 ${isRowInvalid(inv) ? 'input-error border-red-500' : ''}`}
                        value={rowAllocations[inv.id]?.amount ?? inv.outstanding}
                        onChange={(e) => {
                          const val = Number(e.target.value || 0);
                          const rid = rowAllocations[inv.id]?.receiptId;
                          const allowed = Math.min(Number(inv.outstanding || 0), receiptRemaining(rid));
                          const nextVal = Math.max(0, Math.min(val, allowed));
                          setRowAllocations(prev => ({
                            ...prev,
                            [inv.id]: { ...prev[inv.id], amount: nextVal }
                          }));
                        }}
                      />
                      <div className="text-[11px] text-gray-500">
                        الحد الأقصى: {Math.min(Number(inv.outstanding || 0), receiptRemaining(rowAllocations[inv.id]?.receiptId))}
                      </div>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => {
                          const alloc = rowAllocations[inv.id];
                          const receiptId = alloc?.receiptId || '';
                          const amount = Number(alloc?.amount || 0);
                          if (!isRowInvalid(inv)) {
                            handleAllocate(inv.id, receiptId, amount);
                          }
                        }}
                        disabled={allocating === inv.id || isRowInvalid(inv) || !rowAllocations[inv.id]?.receiptId || Number(rowAllocations[inv.id]?.amount||0) <= 0}
                      >
                        {allocating === inv.id ? 'جارٍ...' : 'تخصيص فوري'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {customerId && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">التخصيصات الحالية</h3>
            <button className="btn btn-xs" onClick={refreshAllocations} disabled={allocationsLoading}>تحديث</button>
          </div>
          {allocationsLoading && <div className="text-sm text-gray-600">جاري التحميل...</div>}
          {!allocationsLoading && allocations.length === 0 && (
            <div className="text-sm text-gray-500">لا توجد تخصيصات لهذا العميل.</div>
          )}
          {allocations.length > 0 && (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>الإيصال</th>
                    <th>الفاتورة</th>
                    <th>المبلغ</th>
                    <th>التاريخ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((a:any) => (
                    <tr key={a.id}>
                      <td>{a.receipt_no || a.receipt_id?.slice(0,8)}</td>
                      <td>{a.invoice_no || a.invoice_id?.slice(0,8)}</td>
                      <td>{a.allocated_amount}</td>
                      <td>{(a.created_at||'').toString().slice(0,10)}</td>
                      <td>
                        <button className="btn btn-xs btn-error" onClick={() => handleUnallocate(a.id)}>إلغاء</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ARMatching;

