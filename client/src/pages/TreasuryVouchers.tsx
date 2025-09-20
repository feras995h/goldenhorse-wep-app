import React, { useEffect, useMemo, useState } from 'react';
import { financialAPI } from '../services/api';
import { Plus, RefreshCw, Receipt, CreditCard, XCircle, Search } from 'lucide-react';

interface AccountOption { id: string; code: string; name: string; type: string; }
interface ReceiptVoucher { id: string; receiptNo: string; receiptDate: string; amount: number; account?: { id:string; code:string; name:string }; remarks?: string; }
interface PaymentVoucher { id: string; paymentNumber: string; date: string; amount: number; account?: { id:string; code:string; name:string }; remarks?: string; }

type Tab = 'receipts' | 'payments';

const TreasuryVouchers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('receipts');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [receipts, setReceipts] = useState<ReceiptVoucher[]>([]);
  const [payments, setPayments] = useState<PaymentVoucher[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // تم إزالة متغيرات البحث عن الحسابات لأنها ستتم تلقائياً

  // Party (customer/employee)
  const [partyType, setPartyType] = useState<'' | 'customer' | 'employee'>('');
  const [partyQuery, setPartyQuery] = useState('');
  const [partyOptions, setPartyOptions] = useState<Array<{ id: string; name: string; phone?: string }>>([]);
  const [partyId, setPartyId] = useState<string>('');
  const [partyDisplay, setPartyDisplay] = useState<string>('');

  const [form, setForm] = useState({
    amount: 0,
    date: new Date().toISOString().slice(0,10),
    paymentMethod: 'cash',
    remarks: '',
    revenueType: 'general', // للإيصالات
    expenseType: 'general'  // للمدفوعات
  });

  const [formErrors, setFormErrors] = useState<Record<string,string>>({});

  const title = useMemo(() => activeTab === 'receipts' ? 'إيصالات القبض' : 'إيصالات الصرف', [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === 'receipts') {
        const res = await financialAPI.get('/financial/vouchers/receipts', { params: { limit: 50 } });
        setReceipts(res.data || res); // backend returns {success,data}
      } else {
        const res = await financialAPI.get('/financial/vouchers/payments', { params: { limit: 50 } });
        setPayments(res.data || res);
      }
    } catch (e:any) {
      setError(e?.message || 'تعذر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [activeTab]);

  const openCreateModal = (tab: Tab) => {
    setActiveTab(tab);
    setForm({ amount: 0, date: new Date().toISOString().slice(0,10), paymentMethod: 'cash', remarks: '', revenueType: 'general', expenseType: 'general' });
    setPartyType('');
    setPartyQuery('');
    setPartyOptions([]);
    setPartyId('');
    setPartyDisplay('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string,string> = {};
    if (!form.amount || form.amount <= 0) errs.amount = 'أدخل مبلغاً صحيحاً';
    if (!form.date) errs.date = 'التاريخ مطلوب';
    // الحسابات ستتم تلقائياً في الخادم بناءً على نوع الدفع
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      setError(null);
      if (activeTab === 'receipts') {
        await financialAPI.createReceiptVoucher({
          // لا نرسل accountId أو counterAccountId - سيتم تحديدهما تلقائياً في الخادم
          amount: form.amount,
          receiptDate: form.date,
          paymentMethod: form.paymentMethod,
          remarks: form.remarks,
          partyType: partyType || undefined,
          partyId: partyId || undefined,
          // معلومات إضافية لتحديد نوع الإيراد تلقائياً
          revenueType: partyType === 'customer' ? 'customer_payment' : form.revenueType
        });
      } else {
        await financialAPI.createPaymentVoucher({
          // لا نرسل accountId أو counterAccountId - سيتم تحديدهما تلقائياً في الخادم
          amount: form.amount,
          date: form.date,
          paymentMethod: form.paymentMethod,
          remarks: form.remarks,
          partyType: partyType || undefined,
          partyId: partyId || undefined,
          // معلومات إضافية لتحديد نوع المصروف تلقائياً
          expenseType: form.expenseType
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (e:any) {
      setError(e?.response?.data?.message || e?.message || 'فشل إنشاء السند');
    } finally {
      setSubmitting(false);
    }
  };

  // تم إزالة البحث عن الحسابات لأنها ستتم تلقائياً في الخادم

  // Party search (debounced)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!partyType || !partyQuery || partyQuery.length < 1) { setPartyOptions([]); return; }
      try {
        if (partyType === 'customer') {
          const res = await financialAPI.getCustomers({ search: partyQuery, limit: 15 });
          const data = (res.data || res)?.data || (res.data || res);
          if (!cancelled) setPartyOptions((data || []).map((c: any) => ({ id: c.id, name: c.name, phone: c.phone })));
        } else if (partyType === 'employee') {
          const res = await financialAPI.getEmployees({ search: partyQuery, limit: 15 });
          const data = (res.data || res)?.data || (res.data || res);
          if (!cancelled) setPartyOptions((data || []).map((e: any) => ({ id: e.id, name: e.name, phone: e.phone })));
        }
      } catch {}
    };
    const id = setTimeout(run, 250);
    return () => { cancelled = true; clearTimeout(id); };
  }, [partyType, partyQuery]);

  // تم إزالة دوال القوالب السريعة لأن الحسابات ستتم تلقائياً في الخادم

  // تم إزالة البحث عن الحسابات لأنها ستتم تلقائياً في الخادم

  const renderTable = () => {
    if (activeTab === 'receipts') {
      return (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">رقم السند</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">التاريخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الحساب</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">المبلغ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receipts.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">{r.receiptNo}</td>
                    <td className="px-6 py-3">{new Date(r.receiptDate).toLocaleDateString('ar-EG')}</td>
                    <td className="px-6 py-3">{r.account?.code} - {r.account?.name}</td>
                    <td className="px-6 py-3 font-semibold">{r.amount.toLocaleString('ar-LY', { style: 'currency', currency: 'LYD' })}</td>
                    <td className="px-6 py-3 text-gray-500">{r.remarks || '-'}</td>
                  </tr>
                ))}
                {receipts.length === 0 && !loading && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">لا توجد إيصالات</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    return (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">رقم السند</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الحساب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">المبلغ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{p.paymentNumber}</td>
                  <td className="px-6 py-3">{new Date(p.date).toLocaleDateString('ar-EG')}</td>
                  <td className="px-6 py-3">{p.account?.code} - {p.account?.name}</td>
                  <td className="px-6 py-3 font-semibold">{p.amount.toLocaleString('ar-LY', { style: 'currency', currency: 'LYD' })}</td>
                  <td className="px-6 py-3 text-gray-500">{p.remarks || '-'}</td>
                </tr>
              ))}
              {payments.length === 0 && !loading && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">لا توجد مدفوعات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="card-gradient border-r-4 border-emerald-500 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg ml-4">
              {activeTab === 'receipts' ? <Receipt className="h-8 w-8 text-white"/> : <CreditCard className="h-8 w-8 text-white"/>}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
              <p className="text-lg text-gray-600">إدارة إيصالات القبض والصرف وربطها بدليل الحسابات</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => loadData()} className="btn btn-secondary flex items-center" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </button>
            <button onClick={() => openCreateModal(activeTab)} className="btn btn-primary flex items-center">
              <Plus className="h-4 w-4 ml-2"/>
              {activeTab === 'receipts' ? 'إيصال قبض جديد' : 'إيصال صرف جديد'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-2 flex items-center gap-2">
        <button onClick={() => setActiveTab('receipts')} className={`px-4 py-2 rounded ${activeTab==='receipts'?'bg-emerald-600 text-white':'bg-gray-100'}`}>القبض</button>
        <button onClick={() => setActiveTab('payments')} className={`px-4 py-2 rounded ${activeTab==='payments'?'bg-emerald-600 text-white':'bg-gray-100'}`}>الصرف</button>
        <div className="ml-auto relative hidden">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4"/>
          <input className="form-input pr-9" placeholder="بحث..." />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-100 text-red-800">{error}</div>
      )}

      {renderTable()}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{activeTab === 'receipts' ? 'إنشاء إيصال قبض' : 'إنشاء إيصال صرف'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="h-6 w-6"/></button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">التاريخ</label>
                  <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} className="form-input"/>
                  {formErrors.date && <p className="text-xs text-red-600 mt-1">{formErrors.date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المبلغ</label>
                  <input type="number" min={0} step="0.01" value={form.amount} onChange={e=>setForm(p=>({...p,amount:parseFloat(e.target.value)||0}))} className="form-input"/>
                  {formErrors.amount && <p className="text-xs text-red-600 mt-1">{formErrors.amount}</p>}
                </div>
              </div>


              {/* Party selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">طرف التعامل</label>
                  <select value={partyType} onChange={e=>{setPartyType(e.target.value as any); setPartyQuery(''); setPartyOptions([]); setPartyId(''); setPartyDisplay('');}} className="form-select">
                    <option value="">— اختر —</option>
                    <option value="customer">زبون</option>
                    <option value="employee">مندوب/موظف</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">البحث عن الطرف</label>
                  <input value={partyDisplay || partyQuery} onChange={e=>{setPartyDisplay(''); setPartyQuery(e.target.value);}} disabled={!partyType} className="form-input" placeholder={partyType? 'اكتب اسم الطرف...' : 'اختر نوع الطرف أولاً'} />
                  {!!partyType && (
                    <div className="mt-1 max-h-40 overflow-auto border rounded">
                      {partyOptions.map(p => (
                        <button key={p.id} onClick={()=>{setPartyId(p.id); setPartyDisplay(`${p.name}${p.phone? ' - '+p.phone : ''}`); setPartyOptions([]);}} className={`block w-full text-right px-3 py-2 hover:bg-gray-50 ${partyId===p.id?'bg-emerald-50':''}`}>
                          {p.name}{p.phone? ' - '+p.phone : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* معلومة للمستخدم */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="mr-3">
                    <p className="text-sm text-blue-800">
                      <strong>تحديد تلقائي للحسابات:</strong> سيتم اختيار الحسابات المناسبة تلقائياً بناءً على طريقة الدفع ونوع العملية.
                      {activeTab === 'receipts' ? ' (صندوق/بنك ← ذمم عملاء/إيرادات)' : ' (صندوق/بنك ← مصروفات/ذمم موردين)'}
                    </p>
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">طريقة الدفع</label>
                  <select value={form.paymentMethod} onChange={e=>setForm(p=>({...p,paymentMethod:e.target.value}))} className="form-select">
                    <option value="cash">نقداً</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="check">شيك</option>
                    <option value="credit_card">بطاقة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {activeTab === 'receipts' ? 'نوع الإيراد' : 'نوع المصروف'}
                  </label>
                  {activeTab === 'receipts' ? (
                    <select value={form.revenueType} onChange={e=>setForm(p=>({...p,revenueType:e.target.value}))} className="form-select">
                      <option value="general">إيراد عام</option>
                      <option value="storage">إيرادات التخزين</option>
                      <option value="handling">إيرادات المناولة</option>
                      <option value="shipping">إيرادات الشحن</option>
                    </select>
                  ) : (
                    <select value={form.expenseType} onChange={e=>setForm(p=>({...p,expenseType:e.target.value}))} className="form-select">
                      <option value="general">مصروف عام</option>
                      <option value="purchase">مصروف مشتريات</option>
                      <option value="transport">مصروف نقل</option>
                      <option value="salary">مصروف رواتب</option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ملاحظات</label>
                <input value={form.remarks} onChange={e=>setForm(p=>({...p,remarks:e.target.value}))} className="form-input" placeholder="اختياري"/>
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button onClick={()=>setIsModalOpen(false)} className="btn btn-outline">إلغاء</button>
              <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary">{submitting?'جاري الحفظ...':'حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasuryVouchers;

