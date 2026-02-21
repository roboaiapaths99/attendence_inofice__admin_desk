import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterOrg from './pages/RegisterOrg';
import Dashboard from './pages/Dashboard';
import EmployeeMgmt from './pages/EmployeeMgmt';
import AttendanceLogs from './pages/AttendanceLogs';
import Settings from './pages/Settings';
import AdminMgmt from './pages/AdminMgmt';
import Layout from './components/Layout';

// Other placeholders for now (coming soon)
const Reports = () => <div className="text-white bg-slate-900/50 p-8 rounded-3xl border border-slate-800">Advanced Reports & Analytics Coming Soon</div>;

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617]">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-org" element={<RegisterOrg />} />

        {/* Protected Admin Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employees"
          element={
            <ProtectedRoute>
              <EmployeeMgmt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admins"
          element={
            <ProtectedRoute>
              <AdminMgmt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/logs"
          element={
            <ProtectedRoute>
              <AttendanceLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
