import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Shield,
  UserCheck,
  User,
  LogOut,
  Utensils,
  Scale,
  Activity,
  Calendar,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    effectiveRole,
    setEffectiveRoleOverride,
    signOut,
  } = useAuth();
  const { setIsThemeMenuOpen } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const handleRoleSwitch = (targetRole: UserRole) => {
    setEffectiveRoleOverride(targetRole);
    if (targetRole === 'admin') {
      navigate('/admin');
    } else if (targetRole === 'trainer') {
      navigate('/trainer');
    } else {
      navigate('/user');
    }
  };

  const roleBadgeConfig: Record<
    UserRole,
    { label: string; badgeClass: string; icon: React.ReactNode }
  > = {
    admin: {
      label: 'Admin',
      badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      icon: <Shield className="w-3.5 h-3.5" />,
    },
    trainer: {
      label: 'Trainer',
      badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      icon: <UserCheck className="w-3.5 h-3.5" />,
    },
    user: {
      label: 'Client',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: <User className="w-3.5 h-3.5" />,
    },
  };

  const navLinks = [
    ...(effectiveRole === 'admin'
      ? [
          { to: '/admin', label: 'User Directory', icon: Shield },
          { to: '/trainer', label: 'Workouts Library', icon: Dumbbell },
          { to: '/user', label: 'Client View', icon: Activity },
        ]
      : []),
    ...(effectiveRole === 'trainer'
      ? [
          { to: '/trainer', label: 'Home', icon: LayoutDashboard },
          { to: '/trainer/clients', label: 'Clients', icon: Users },
          { to: '/trainer/workouts', label: 'Workouts', icon: Dumbbell },
          { to: '/trainer/diets', label: 'Meal Plans', icon: Utensils },
        ]
      : []),
    ...(effectiveRole === 'user'
      ? [
          { to: '/user', label: 'Home', icon: LayoutDashboard },
          { to: '/user/workouts', label: 'Workouts', icon: Dumbbell },
          { to: '/user/nutrition', label: 'Nutrition', icon: Utensils },
          { to: '/user/metrics', label: 'Body & BMI', icon: Scale },
          { to: '/user/calendar', label: 'Calendar', icon: Calendar },
        ]
      : []),
  ];

  const isLinkActive = (to: string) => {
    if (to === '/user') {
      return location.pathname === '/user' || location.pathname === '/user/';
    }
    if (to === '/trainer') {
      return location.pathname === '/trainer' || location.pathname === '/trainer/';
    }
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4">
            {/* Logo & Brand with Interactive Dumbbell Settings Trigger */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Top Dumbbell Icon: Tap to access all settings, themes, and display modes */}
              <button
                type="button"
                onClick={() => setIsThemeMenuOpen(true)}
                className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                title="Tap to open App Settings, Theme & Display Preferences"
                aria-label="App Settings and Theme"
              >
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] group-hover:rotate-12 transition-transform" />
                <span
                  className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white dark:bg-slate-950 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/60 shadow-sm"
                  title="Settings"
                >
                  ⚙
                </span>
              </button>

              <Link
                to={effectiveRole === 'admin' ? '/admin' : effectiveRole === 'trainer' ? '/trainer' : '/user'}
                className="flex flex-col group"
              >
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1 group-hover:text-emerald-500 transition-colors">
                  PulseFit <span className="text-emerald-500">Pro</span>
                </span>
                <span className="hidden sm:block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 -mt-1">
                  RBAC Fitness Suite
                </span>
              </Link>

              {/* Current Role Indicator */}
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
                · {roleBadgeConfig[effectiveRole].label}
              </span>
            </div>

            {/* User Controls: Quick Role Switcher & Sign Out (Theme settings live inside the Dumbbell menu) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Quick RBAC Switcher */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 sm:p-1 text-[10px] sm:text-[11px]">
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('admin')}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-md font-bold transition-colors whitespace-nowrap ${
                    effectiveRole === 'admin'
                      ? 'bg-purple-500 text-slate-950 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Switch view to Admin Home"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('trainer')}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-md font-bold transition-colors whitespace-nowrap ${
                    effectiveRole === 'trainer'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Switch view to Trainer Home"
                >
                  Trainer
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('user')}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-md font-bold transition-colors whitespace-nowrap ${
                    effectiveRole === 'user'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Switch view to Client Home"
                >
                  Client
                </button>
              </div>

              {/* Sign Out */}
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Single Unified Bottom Navigation Bar (Appears once at bottom across all viewports) */}
      <nav
        aria-label="Primary Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-2 py-1.5 shadow-2xl transition-colors"
      >
        <div className="mx-auto max-w-2xl flex items-center justify-around">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = isLinkActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all min-w-[56px] whitespace-nowrap ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
                <span className="line-clamp-1">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
