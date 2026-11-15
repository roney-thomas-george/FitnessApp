import React, { useState } from 'react';
import {
  Dumbbell,
  User,
  UserCheck,
  CheckCircle2,
  Scale,
  Ruler,
  Target,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const OnboardingModal: React.FC = () => {
  const { userProfile, updateProfileData } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [requestedRole, setRequestedRole] = useState<'user' | 'trainer'>(
    userProfile?.requestedRole === 'trainer' ? 'trainer' : 'user'
  );
  const [currentWeight, setCurrentWeight] = useState<string>(
    String(userProfile?.currentWeight || 75)
  );
  const [height, setHeight] = useState<string>(String(userProfile?.height || 175));
  const [targetWeight, setTargetWeight] = useState<string>(
    String(userProfile?.targetWeight || 72)
  );
  const [fitnessGoal, setFitnessGoal] = useState(
    userProfile?.fitnessGoal || 'Lean Strength & Conditioning'
  );
  const [specialty, setSpecialty] = useState(
    userProfile?.specialty || 'Strength, Hypertrophy & Nutrition Coaching'
  );
  const [experienceYears, setExperienceYears] = useState<string>(
    String(userProfile?.experienceYears || 2)
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!userProfile || userProfile.onboardingCompleted !== false) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfileData({
        displayName: displayName.trim() || userProfile.displayName || 'PulseFit Member',
        requestedRole,
        currentWeight: parseFloat(currentWeight) || 75,
        height: parseFloat(height) || 175,
        targetWeight: requestedRole === 'user' ? parseFloat(targetWeight) || 72 : undefined,
        fitnessGoal: requestedRole === 'user' ? fitnessGoal.trim() : undefined,
        specialty: requestedRole === 'trainer' ? specialty.trim() : undefined,
        experienceYears:
          requestedRole === 'trainer' ? parseInt(experienceYears, 10) || 1 : undefined,
        onboardingCompleted: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl my-auto transition-colors">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md">
            <Dumbbell className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Welcome to PulseFit Pro
            </span>
            <h2
              id="onboarding-title"
              className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100"
            >
              Complete Your Profile & Access Request
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Role / Access Preference */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              What access are you looking for?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRequestedRole('user')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  requestedRole === 'user'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Client / Athlete
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Follow workouts, log meals, and track body metrics with a coach.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRequestedRole('trainer')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  requestedRole === 'trainer'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 ring-2 ring-cyan-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Trainer / Coach
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Manage clients, assign training plans & macro goals (Admin assigns access).
                </p>
              </button>
            </div>
            {requestedRole === 'trainer' && (
              <p className="mt-2 text-[11px] text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-500/20 rounded-xl px-3 py-2">
                Your Trainer access request will be sent to the Admin for approval. Until then, you can preview the Client portal.
              </p>
            )}
          </div>

          {/* Basic Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-emerald-500" /> Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5 text-cyan-500" /> Height (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {requestedRole === 'user' ? (
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-indigo-500" /> Target (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-cyan-500" /> Experience (yrs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {requestedRole === 'user' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Fitness Goal
                </label>
                <input
                  type="text"
                  value={fitnessGoal}
                  onChange={(e) => setFitnessGoal(e.target.value)}
                  placeholder="e.g., Muscle gain, fat loss, athletic endurance"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Coaching Specialty
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g., Hypertrophy, Weight Loss, Sports Conditioning"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSaving ? 'Saving Profile...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};
