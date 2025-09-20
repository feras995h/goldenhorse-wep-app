import React, { useEffect, useState } from 'react';
import { arAPI, salesAPI } from '../services/api';

const ARAging: React.FC = () => {
  const [asOf, setAsOf] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [customerId, setCustomerId] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const exportCSV = () => {
    const headers = ['customer','current','age_30','age_60','age_90','age_120_plus','total'];
    const lines = [headers.join(',')].concat(
      rows.map((r:any)=>[
        JSON.stringify(r.customer_name || r.customer_id || ''),
        r.current||0,
        r.age_30||0,
        r.age_60||0,
        r.age_90||0,
        r.age_120_plus||0,
        r.total||0
      ].join(','))
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ar_aging_${asOf}${customerId?`_${customerId.slice(0,8)}`:''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await arAPI.getAging({ as_of: asOf, customer_id: customerId || undefined });
      setRows(res.data?.aging || []);
    } finally {
      setLoading(false);
    }
  };

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
      <h1 className="text-2xl font-bold">تقرير أعمار الديون (AR Aging)</h1>

      <div className="flex items-end gap-3">
        <div>
          <label className="block text-sm">حتى تاريخ</label>
          <input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className="input input-bordered" />
        </div>
        <div className="flex-1 relative">
          <label className="block text-sm">العميل (اختياري)</label>
          <input
            value={customerQuery}
            onChange={(e) => setCustomerQuery(e.target.value)}
            onFocus={() => setShowOptions(customerOptions.length > 0)}
            className="input input-bordered w-full"
            placeholder="اكتب اسم العميل (اختياري، 2+ حروف)"
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
        <button onClick={load} className="btn btn-primary" disabled={loading}>{loading ? 'جاري...' : 'عرض'}</button>
        <button onClick={exportCSV} className="btn" disabled={rows.length===0}>تصدير CSV</button>
      </div>

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>العميل</th>
                <th>Current</th>
                <th>30</th>
                <th>60</th>
                <th>90</th>
                <th>120+</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, idx) => (
                <tr key={idx}>
                  <td>{r.customer_name || r.customer_id}</td>
                  <td>{r.current || 0}</td>
                  <td>{r.age_30 || 0}</td>
                  <td>{r.age_60 || 0}</td>
                  <td>{r.age_90 || 0}</td>
                  <td>{r.age_120_plus || 0}</td>
                  <td>{r.total || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ARAging;

