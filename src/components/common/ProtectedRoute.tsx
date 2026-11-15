import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { OnboardingModal } from './OnboardingModal';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, userProfile, effectiveRole, isActive, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 transition-colors">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="mt-4 text-xs font-semibold tracking-wider uppercase text-slate-500">
          Authenticating PulseFit Profile...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Account State Verification: If disabled, redirect to inactive notice page
  if (isActive === false) {
    return <Navigate to="/inactive" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    // Redirect to default home for current role
    if (effectiveRole === 'admin') return <Navigate to="/admin" replace />;
    if (effectiveRole === 'trainer') return <Navigate to="/trainer" replace />;
    return <Navigate to="/user" replace />;
  }

  return (
    <>
      {userProfile?.onboardingCompleted === false && <OnboardingModal />}
      {children}
    </>
  );
};
