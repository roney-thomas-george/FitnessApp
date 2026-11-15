import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Shield,
  UserCheck,
  User,
  CheckCircle2,
  UserPlus,
  LogIn,
  Scale,
  Ruler,
  Target,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const AuthPage: React.FC = () => {
  const { currentUser, effectiveRole, signInWithGoogle, signInAsDemo, registerAccount, loading } =
    useAuth();
  const [authTab, setAuthTab] = useState<'signin' | 'register'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Registration form fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRequestedRole, setRegRequestedRole] = useState<'user' | 'trainer'>('user');
  const [regWeight, setRegWeight] = useState('75');
  const [regHeight, setRegHeight] = useState('175');
  const [regTargetWeight, setRegTargetWeight] = useState('72');
  const [regGoal, setRegGoal] = useState('Strength & Lean Muscle');
  const [regSpecialty, setRegSpecialty] = useState('Strength & Nutrition Coaching');

  const navigate = useNavigate();

  if (currentUser && !loading) {
    const dest =
      effectiveRole === 'admin' ? '/admin' : effectiveRole === 'trainer' ? '/trainer' : '/user';
    return <Navigate to={dest} replace />;
  }

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsProcessing(true);
    try {
      await signInWithGoogle();
      navigate('/user');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in was interrupted';
      setAuthError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDemoSignIn = async (role: UserRole) => {
    setAuthError(null);
    setIsProcessing(true);
    try {
      await signInAsDemo(role);
      if (role === 'admin') navigate('/admin');
      else if (role === 'trainer') navigate('/trainer');
      else navigate('/user');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo sign-in failed';
      setAuthError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!regName.trim() || !regEmail.trim()) {
      setAuthError('Please provide your full name and email address.');
      return;
    }
    setIsProcessing(true);
    try {
      const created = await registerAccount({
        displayName: regName,
        email: regEmail,
        requestedRole: regRequestedRole,
        currentWeight: parseFloat(regWeight) || 75,
        height: parseFloat(regHeight) || 175,
        targetWeight: regRequestedRole === 'user' ? parseFloat(regTargetWeight) || 72 : undefined,
        fitnessGoal: regRequestedRole === 'user' ? regGoal.trim() : undefined,
        specialty: regRequestedRole === 'trainer' ? regSpecialty.trim() : undefined,
      });
      if (created.role === 'admin') navigate('/admin');
      else if (created.role === 'trainer') navigate('/trainer');
      else navigate('/user');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setAuthError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-xl shadow-emerald-500/20">
          <Dumbbell className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          PulseFit <span className="text-emerald-600 dark:text-emerald-400">Pro</span>
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          High-performance fitness coaching, voice macro logging & body metric analytics
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-colors">
          {/* Sign In / Register Switcher */}
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthTab('signin');
                setAuthError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                authTab === 'signin'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In / Demo
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                setAuthError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                authTab === 'register'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Register (Client / Trainer)
            </button>
          </div>

          {authError && (
            <div className="mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-700 dark:text-rose-300">
              {authError}
            </div>
          )}

          {authTab === 'signin' ? (
            <>
              {/* Primary Google Auth */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800/80 px-5 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google Account
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-500 uppercase tracking-wider font-semibold">
                    Or explore via instant demo roles
                  </span>
                </div>
              </div>

              {/* Demo Roles for instant testing without popups */}
              <div className="space-y-3">
                {/* Admin Demo */}
                <button
                  type="button"
                  onClick={() => handleDemoSignIn('admin')}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-purple-200 dark:border-purple-500/20 bg-purple-50/70 hover:bg-purple-100/70 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Administrator Role
                        </span>
                        <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                          Master Control
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Review access requests, assign roles & trainers, manage accounts.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold group-hover:translate-x-1 transition-transform">
                    Enter &rarr;
                  </span>
                </button>

                {/* Trainer Demo */}
                <button
                  type="button"
                  onClick={() => handleDemoSignIn('trainer')}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-cyan-200 dark:border-cyan-500/20 bg-cyan-50/70 hover:bg-cyan-100/70 dark:bg-cyan-950/20 dark:hover:bg-cyan-950/40 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Trainer Role
                        </span>
                        <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                          Coach Sarah
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Assign Push/Pull, Circuit & Custom workouts, manage client macros.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform">
                    Enter &rarr;
                  </span>
                </button>

                {/* Client Demo */}
                <button
                  type="button"
                  onClick={() => handleDemoSignIn('user')}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Client / Member Role
                        </span>
                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          Alex Rivera
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Track daily workouts, voice log food intake, log weight & BMI.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
                    Enter &rarr;
                  </span>
                </button>
              </div>
            </>
          ) : (
            /* NEW USER REGISTRATION FORM (Client or Trainer) */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  What access are you looking for?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRegRequestedRole('user')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      regRequestedRole === 'user'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs text-slate-900 dark:text-slate-100">
                      <User className="w-4 h-4 text-emerald-500" />
                      Register as Client
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Workouts, meal diary & coach tracking
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRequestedRole('trainer')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      regRequestedRole === 'trainer'
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 ring-2 ring-cyan-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs text-slate-900 dark:text-slate-100">
                      <UserCheck className="w-4 h-4 text-cyan-500" />
                      Register as Trainer
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Coach clients & prescribe plans
                    </p>
                  </button>
                </div>
                {regRequestedRole === 'trainer' && (
                  <p className="mt-2 text-[11px] text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-500/20 rounded-xl px-3 py-2">
                    Your Trainer request appears in the Admin User Directory so an Admin can approve & assign your Trainer access.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Jordan Taylor"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="jordan@example.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Scale className="w-3 h-3 text-emerald-500" /> Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={regWeight}
                    onChange={(e) => setRegWeight(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Ruler className="w-3 h-3 text-cyan-500" /> Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={regHeight}
                    onChange={(e) => setRegHeight(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                {regRequestedRole === 'user' ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Target className="w-3 h-3 text-indigo-500" /> Goal (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={regTargetWeight}
                      onChange={(e) => setRegTargetWeight(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-cyan-500" /> Specialty
                    </label>
                    <input
                      type="text"
                      value={regSpecialty}
                      onChange={(e) => setRegSpecialty(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {regRequestedRole === 'user' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fitness Goal
                  </label>
                  <input
                    type="text"
                    value={regGoal}
                    onChange={(e) => setRegGoal(e.target.value)}
                    placeholder="e.g. Build muscle, improve endurance, lose 4kg"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {isProcessing
                  ? 'Creating Account...'
                  : regRequestedRole === 'trainer'
                  ? 'Register & Request Trainer Access'
                  : 'Create Client Account'}
              </button>
            </form>
          )}

          {/* Feature Highlights */}
          <div className="mt-7 border-t border-slate-200 dark:border-slate-800/80 pt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Included Core Capabilities
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>YouTube Workout Embeds</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Web Speech Food Logging</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Macro & Micro Breakdown</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>BMI Trendline Charts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
