import React from 'react';
import { ShieldAlert, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const InactiveAccount: React.FC = () => {
  const { signOut, userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
      <div className="max-w-md w-full rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Account Suspended</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Your PulseFit Pro account (<strong className="text-slate-900 dark:text-slate-200">{userProfile?.email}</strong>) has been set to
          inactive by an administrator. Access to workouts, metrics, and dietary logs is temporarily restricted.
        </p>

        <div className="mt-6 rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 text-left text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <p className="font-semibold text-slate-800 dark:text-slate-300">Need help regaining access?</p>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Contact your gym administrator or support@pulsefit.local</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 py-2.5 px-4 text-xs font-bold text-white dark:text-slate-200 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
};
