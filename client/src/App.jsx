import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import ShareManagement from './pages/ShareManagement';
import Activity from './pages/Activity';
import ProtectedViewer from './pages/ProtectedViewer';
import AccessDenied from './pages/AccessDenied';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Document Viewer (Dedicated DRM View) */}
          <Route path="/view/:token" element={<ProtectedViewer />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* Authenticated Sender Console */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/shares" element={<ShareManagement />} />
            <Route path="/activity" element={<Activity />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
