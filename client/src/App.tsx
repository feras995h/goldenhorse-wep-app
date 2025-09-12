import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import loadable from '@loadable/component';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LogoProvider } from './contexts/LogoContext';
import { FinancialDataProvider } from './contexts/FinancialDataContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Lazy load components for better performance
const Dashboard = loadable(() => import('./pages/Dashboard'));
const AdminDashboard = loadable(() => import('./pages/AdminDashboard'));
const SystemSettings = loadable(() => import('./pages/SystemSettings'));
const FinancialDashboard = loadable(() => import('./pages/FinancialDashboard'));
const ChartOfAccounts = loadable(() => import('./pages/ChartOfAccounts'));
const JournalEntries = loadable(() => import('./pages/JournalEntries'));
const CustomersManagement = loadable(() => import('./pages/CustomersManagement'));
const AccountStatement = loadable(() => import('./pages/AccountStatement'));
const InstantReports = loadable(() => import('./pages/InstantReports'));
const EmployeeAccountStatement = loadable(() => import('./pages/EmployeeAccountStatement'));
const EmployeeManagement = loadable(() => import('./pages/EmployeeManagement'));
const EmployeeAccountStatementNew = loadable(() => import('./pages/EmployeeAccountStatementNew'));
const EmployeePayroll = loadable(() => import('./pages/EmployeePayroll'));
const InvoiceManagement = loadable(() => import('./pages/InvoiceManagement'));
const InventoryManagement = loadable(() => import('./pages/InventoryManagement'));

// Admin redirect component
const AdminRedirect: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Dashboard />;
};
const SalesReports = loadable(() => import('./pages/SalesReports'));
const FixedAssetsManagement = loadable(() => import('./pages/FixedAssetsManagement'));
const FinancialReports = loadable(() => import('./pages/FinancialReports'));
const OpeningBalanceEntry = loadable(() => import('./pages/OpeningBalanceEntry'));
const AccountMonitoring = loadable(() => import('./pages/AccountMonitoring'));
const InvoiceReports = loadable(() => import('./pages/InvoiceReports'));
const SalesDashboard = loadable(() => import('./pages/SalesDashboard'));


function App() {
  return (
    <AuthProvider>
      <LogoProvider>
        <FinancialDataProvider>
          <Router>
            <Suspense fallback={
              <LoadingSpinner
                size="xl"
                text="جاري تحميل التطبيق..."
                fullScreen
              />
            }>
              <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* Admin redirect */}
              <Route path="dashboard" element={<AdminRedirect />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Role-specific dashboards */}
              <Route path="admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              <Route path="admin/settings" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SystemSettings />
                </ProtectedRoute>
              } />
              
              <Route path="financial" element={
                <ProtectedRoute allowedRoles={['admin', 'financial']}>
                  <Outlet />
                </ProtectedRoute>
              }>
                <Route index element={<FinancialDashboard />} />
                <Route path="accounts" element={<ChartOfAccounts />} />
                <Route path="chart-of-accounts" element={<ChartOfAccounts />} />
                <Route path="account-statement" element={<AccountStatement />} />
                <Route path="instant-reports" element={<InstantReports />} />
                <Route path="journal" element={<JournalEntries />} />
                <Route path="customers" element={<CustomersManagement />} />
                <Route path="employee-accounts" element={<EmployeeAccountStatementNew />} />
                <Route path="employees" element={<EmployeeManagement />} />
                <Route path="fixed-assets" element={<FixedAssetsManagement />} />
                <Route path="reports" element={<FinancialReports />} />
                <Route path="opening-balance" element={<OpeningBalanceEntry />} />
                <Route path="account-monitoring" element={<AccountMonitoring />} />
                <Route path="invoice-reports" element={<InvoiceReports />} />
                <Route path="employee-payroll" element={<EmployeePayroll />} />
                <Route path="settings" element={<SystemSettings />} />
              </Route>
              
              <Route path="sales" element={
                <ProtectedRoute allowedRoles={['admin', 'sales']}>
                  <SalesDashboard />
                </ProtectedRoute>
              } />

              <Route path="sales/invoices" element={
                <ProtectedRoute allowedRoles={['admin', 'sales']}>
                  <InvoiceManagement />
                </ProtectedRoute>
              } />

              <Route path="sales/inventory" element={
                <ProtectedRoute allowedRoles={['admin', 'sales']}>
                  <InventoryManagement />
                </ProtectedRoute>
              } />

              <Route path="sales/reports" element={
                <ProtectedRoute allowedRoles={['admin', 'sales']}>
                  <SalesReports />
                </ProtectedRoute>
              } />
              

            </Route>
            
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </FinancialDataProvider>
      </LogoProvider>
    </AuthProvider>
  );
}

export default App;