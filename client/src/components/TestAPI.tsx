import React, { useState, useEffect } from 'react';
import { financialAPI } from '../services/api';

const TestAPI: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Testing API call...');
      const result = await financialAPI.getFinancialSummary();
      console.log('API Response:', result);
      setData(result);
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.message || 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAPI();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">اختبار API</h2>

      {loading && <p className="text-blue-600">جاري التحميل...</p>}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600">خطأ: {error}</p>
        </div>
      )}

      {data && (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-600">نجح الاتصال بالخادم!</p>
          <pre className="mt-2 text-sm">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      <button
        onClick={testAPI}
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      >
        إعادة المحاولة
      </button>
    </div>
  );
};

export default TestAPI;