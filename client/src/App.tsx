import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LogoProvider } from './contexts/LogoContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import SystemSettings from './pages/SystemSettings';
import FinancialDashboard from './pages/FinancialDashboard';

import ChartOfAccounts from './pages/ChartOfAccounts';
import JournalEntries from './pages/JournalEntries';
import CustomersManagement from './pages/CustomersManagement';
import AccountStatement from './pages/AccountStatement';
import InstantReports from './pages/InstantReports';
import EmployeeAccountStatement from './pages/EmployeeAccountStatement';
import FixedAssetsManagement from './pages/FixedAssetsManagement';
import FinancialReports from './pages/FinancialReports';
import OpeningBalanceEntry from './pages/OpeningBalanceEntry';
import AccountMonitoring from './pages/AccountMonitoring';
import InvoiceReports from './pages/InvoiceReports';
import SalesDashboard from './pages/SalesDashboard';
import CustomerServiceDashboard from './pages/CustomerServiceDashboard';
import OperationsDashboard from './pages/OperationsDashboard';

function App() {
  return (
    <AuthProvider>
      <LogoProvider>
        <Router>
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
              <Route path="employee-accounts" element={<EmployeeAccountStatement />} />
              <Route path="fixed-assets" element={<FixedAssetsManagement />} />
              <Route path="reports" element={<FinancialReports />} />
              <Route path="opening-balance" element={<OpeningBalanceEntry />} />
              <Route path="account-monitoring" element={<AccountMonitoring />} />
              <Route path="invoice-reports" element={<InvoiceReports />} />
              <Route path="settings" element={<SystemSettings />} />
            </Route>
            
            <Route path="sales" element={
              <ProtectedRoute allowedRoles={['sales']}>
                <SalesDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="customer-service" element={
              <ProtectedRoute allowedRoles={['customer_service']}>
                <CustomerServiceDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="operations" element={
              <ProtectedRoute allowedRoles={['operations']}>
                <OperationsDashboard />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Router>
      </LogoProvider>
    </AuthProvider>
  );
}

export default App;