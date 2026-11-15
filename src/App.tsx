/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/common/Navbar';
import { ThemeSettingsModal } from './components/common/ThemeSettingsModal';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { InactiveAccount } from './components/common/InactiveAccount';
import { AuthPage } from './pages/AuthPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { TrainerDashboard } from './pages/trainer/TrainerDashboard';
import { UserDashboard } from './pages/user/UserDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 transition-colors duration-150">
            <Navbar />
            <ThemeSettingsModal />
            <main className="flex-1">
              <Routes>
                {/* Public Auth Page */}
                <Route path="/auth" element={<AuthPage />} />

                {/* Disabled Account Notice */}
                <Route path="/inactive" element={<InactiveAccount />} />

                {/* Protected Admin Routes */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Trainer Routes (Admins can also view/override) */}
                <Route
                  path="/trainer/*"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'trainer']}>
                      <TrainerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected User (Client) Routes */}
                <Route
                  path="/user/*"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'trainer', 'user']}>
                      <UserDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Root redirect */}
                <Route path="/" element={<Navigate to="/user" replace />} />
                <Route path="*" element={<Navigate to="/user" replace />} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
