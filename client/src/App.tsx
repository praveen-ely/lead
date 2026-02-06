import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LeadList from './pages/LeadList';
import UserPreferences from './pages/UserPreferences';
import UserLogin from './pages/UserLogin';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import UserDashboard from './pages/UserDashboard';
import AdminSettings from './pages/AdminSettings';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <main className="min-h-screen">
          <Routes>
            {/* Login Routes */}
            <Route path="/login" element={<UserLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />

            {/* User Routes */}
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/leads" element={<LeadList />} />
            <Route path="/preferences" element={<UserPreferences />} />

            {/* Default */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
