import React, { useEffect } from 'react';
import {
  X,
  Sun,
  Moon,
  Laptop,
  Check,
  Eye,
  Type,
  ShieldCheck,
  Sparkles,
  Contrast,
  Dumbbell,
  Shield,
  UserCheck,
  User,
  LogOut,
  HardDrive,
  Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export const ThemeSettingsModal: React.FC = () => {
  const {
    theme,
    resolvedTheme,
    highContrast,
    fontSize,
    isThemeMenuOpen,
    setTheme,
    setHighContrast,
    setFontSize,
    setIsThemeMenuOpen,
  } = useTheme();

  const {
    currentUser,
    userProfile,
    effectiveRole,
    setEffectiveRoleOverride,
    googleAccessToken,
    signOut,
  } = useAuth();
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsThemeMenuOpen(false);
      }
    };
    if (isThemeMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isThemeMenuOpen, setIsThemeMenuOpen]);

  if (!isThemeMenuOpen) return null;

  const themeOptions: Array<{
    id: ThemeMode;
    title: string;
    description: string;
    icon: React.ElementType;
    previewBg: string;
    previewCard: string;
    previewText: string;
    previewBorder: string;
    accentDot: string;
  }> = [
    {
      id: 'dark',
      title: 'Dark Mode (Default)',
      description: 'Deep slate-950 with vivid emerald accents. Reduced eye strain in dim environments.',
      icon: Moon,
      previewBg: 'bg-slate-950',
      previewCard: 'bg-slate-900',
      previewText: 'text-slate-100',
      previewBorder: 'border-slate-800',
      accentDot: 'bg-emerald-400',
    },
    {
      id: 'light',
      title: 'High-Contrast Light Mode',
      description: 'Crisp white canvas with deep charcoal typography and sharp outlines for maximum daytime readability.',
      icon: Sun,
      previewBg: 'bg-slate-100',
      previewCard: 'bg-white',
      previewText: 'text-slate-900',
      previewBorder: 'border-slate-300',
      accentDot: 'bg-emerald-600',
    },
    {
      id: 'system',
      title: 'System Automatic',
      description: 'Automatically synchronizes with your device operating system display preferences.',
      icon: Laptop,
      previewBg: 'bg-gradient-to-r from-slate-900 to-slate-100',
      previewCard: 'bg-slate-800/80',
      previewText: 'text-slate-100',
      previewBorder: 'border-slate-700',
      accentDot: 'bg-cyan-400',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
      onClick={() => setIsThemeMenuOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl transition-all my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Dumbbell Icon branding */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-md shadow-emerald-500/20">
              <Dumbbell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 id="theme-modal-title" className="text-base font-black text-slate-900 dark:text-slate-100">
                  App Settings & Preferences
                </h3>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.2 text-[10px] font-bold">
                  PulseFit
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Display theme, accessibility options, and account controls
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsThemeMenuOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Theme Mode Selection Cards */}
        <div className="mt-5 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2 flex items-center justify-between">
            <span>Color Scheme & Theme</span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
              Active: {resolvedTheme} Mode
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTheme(opt.id)}
                  className={`relative flex flex-col justify-between rounded-2xl p-3.5 text-left border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Miniature swatch preview */}
                  <div
                    className={`h-12 w-full rounded-xl ${opt.previewBg} p-2 flex flex-col justify-between border ${opt.previewBorder} mb-3 overflow-hidden shadow-inner`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-1.5 w-8 rounded-full bg-slate-400/50" />
                      <div className={`h-2 w-2 rounded-full ${opt.accentDot}`} />
                    </div>
                    <div
                      className={`h-5 w-full rounded-lg ${opt.previewCard} border ${opt.previewBorder} flex items-center px-1.5 justify-between`}
                    >
                      <div className="h-1.5 w-10 rounded bg-slate-400/40" />
                      <div className="h-1.5 w-3 rounded bg-emerald-500" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                        <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{opt.id === 'system' ? 'System' : opt.id === 'light' ? 'Light' : 'Dark'}</span>
                      </div>
                      {isSelected && (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                      {opt.id === 'light' ? 'High-contrast light' : opt.id === 'dark' ? 'Classic dark slate' : 'Follows OS'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Accessibility Enhancements */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Accessibility Boosters
          </label>

          {/* High Contrast Borders & Text Toggle */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0 mt-0.5">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    High-Contrast Outlines & Pure Text
                  </h4>
                  {highContrast && (
                    <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold">
                      WCAG AAA Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Enhances borders and guarantees maximum readability under sunlight.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                highContrast ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              role="switch"
              aria-checked={highContrast}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  highContrast ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Text Size Scale Toggle */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0 mt-0.5">
                <Type className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Large Readable Text
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Scales up typography for easier reading during active workouts.
                </p>
              </div>
            </div>

            <div className="flex items-center rounded-xl bg-slate-200 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setFontSize('normal')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  fontSize === 'normal'
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setFontSize('large')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  fontSize === 'large'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                115%
              </button>
            </div>
          </div>
        </div>

        {/* 3. Account & Role Settings */}
        {currentUser && (
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              User & Role Management
            </label>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {userProfile?.displayName || currentUser.displayName || 'Current User'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {currentUser.email || 'Demo Account'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <HardDrive className="w-3 h-3" />
                  <span>{googleAccessToken ? 'Drive Linked' : 'Local Hybrid'}</span>
                </div>
              </div>

              {/* Role Switcher */}
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Switch Active Portal View:
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEffectiveRoleOverride('admin');
                      setIsThemeMenuOpen(false);
                      navigate('/admin');
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      effectiveRole === 'admin'
                        ? 'bg-purple-500 text-slate-950 border-purple-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEffectiveRoleOverride('trainer');
                      setIsThemeMenuOpen(false);
                      navigate('/trainer');
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      effectiveRole === 'trainer'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Trainer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEffectiveRoleOverride('user');
                      setIsThemeMenuOpen(false);
                      navigate('/user');
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      effectiveRole === 'user'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Client
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer info, sign out, & close */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          {currentUser && (
            <button
              type="button"
              onClick={() => {
                setIsThemeMenuOpen(false);
                signOut();
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={() => setIsThemeMenuOpen(false)}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 text-xs font-bold shadow-md transition-all active:scale-95"
            >
              Save & Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

