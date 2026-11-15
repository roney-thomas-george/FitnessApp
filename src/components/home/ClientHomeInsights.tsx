import React from 'react';
import {
  Flame,
  Scale,
  Dumbbell,
  Utensils,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Clock,
  Target,
  ChevronRight,
  Zap,
  Activity,
  Heart,
  UserCheck,
  Mail,
  Award,
  X,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';
import { UserProfile, DietPlan, FoodLog, WorkoutLog, WorkoutRoutine } from '../../types';
import { calculateBmi, getBmiCategory } from '../metrics/BmiWeightTracker';

export interface ClientHomeInsightsProps {
  userProfile: UserProfile | null;
  assignedTrainer?: UserProfile | null;
  dietPlan: DietPlan | null;
  todayFoodLogs: FoodLog[];
  workoutLogs: WorkoutLog[];
  assignedWorkouts: WorkoutRoutine[];
  onNavigate: (section: 'workouts' | 'nutrition' | 'metrics' | 'calendar') => void;
}

export const ClientHomeInsights: React.FC<ClientHomeInsightsProps> = ({
  userProfile,
  assignedTrainer,
  dietPlan,
  todayFoodLogs,
  workoutLogs,
  assignedWorkouts,
  onNavigate,
}) => {
  const [showCoachProfileModal, setShowCoachProfileModal] = React.useState(false);

  const coachProfile = assignedTrainer || {
    uid: 'demo-trainer-uid',
    email: 'sarah.coach@pulsefit.io',
    displayName: 'Coach Sarah Jenkins',
    role: 'trainer' as const,
    specialty: 'Hypertrophy, Strength Mechanics & Metabolic Conditioning',
    experienceYears: 8,
    certifications: ['CSCS', 'NASM-CPT', 'Precision Nutrition L2'],
    bio: 'Former collegiate strength athlete specializing in sustainable body recomposition, injury-free barbell biomechanics, and progressive overload periodization.',
  };
  // 1. Weight & BMI calculations
  const currentWeight = userProfile?.currentWeight || 75;
  const height = userProfile?.height || 178;
  const bmi = calculateBmi(currentWeight, height);
  const bmiCategory = getBmiCategory(bmi);
  const weightLbs = Math.round(currentWeight * 2.20462 * 10) / 10;
  const targetWeight = userProfile?.targetWeight || null;
  const weightDiff = targetWeight ? Math.round((currentWeight - targetWeight) * 10) / 10 : null;

  // 2. Today's nutrition totals calculation
  const todayCalories = todayFoodLogs.reduce((acc, log) => {
    if (log.calories !== undefined) return acc + log.calories;
    return acc + (log.items?.reduce((s, it) => s + (it.calories || 0), 0) || 0);
  }, 0);

  const todayProtein = Math.round(
    todayFoodLogs.reduce((acc, log) => {
      if (log.protein !== undefined) return acc + log.protein;
      return acc + (log.items?.reduce((s, it) => s + (it.protein || 0), 0) || 0);
    }, 0) * 10
  ) / 10;

  const todayCarbs = Math.round(
    todayFoodLogs.reduce((acc, log) => {
      if (log.carbs !== undefined) return acc + log.carbs;
      return acc + (log.items?.reduce((s, it) => s + (it.carbs || 0), 0) || 0);
    }, 0) * 10
  ) / 10;

  const todayFats = Math.round(
    todayFoodLogs.reduce((acc, log) => {
      if (log.fats !== undefined) return acc + log.fats;
      return acc + (log.items?.reduce((s, it) => s + (it.fats || 0), 0) || 0);
    }, 0) * 10
  ) / 10;

  const targetCalories = dietPlan?.targetCalories || 2400;
  const targetProtein = dietPlan?.targetMacros?.protein || 170;
  const targetCarbs = dietPlan?.targetMacros?.carbs || 240;
  const targetFats = dietPlan?.targetMacros?.fats || 70;

  const calPercent = Math.min(Math.round((todayCalories / targetCalories) * 100), 100);
  const protPercent = Math.min(Math.round((todayProtein / targetProtein) * 100), 100);
  const carbsPercent = Math.min(Math.round((todayCarbs / targetCarbs) * 100), 100);
  const fatsPercent = Math.min(Math.round((todayFats / targetFats) * 100), 100);

  const calRemaining = Math.max(targetCalories - todayCalories, 0);
  const protRemaining = Math.max(Math.round((targetProtein - todayProtein) * 10) / 10, 0);

  // 3. Today's workout status
  const todayIso = new Date().toISOString().split('T')[0];
  const todayWorkout = assignedWorkouts[0] || null;
  const completedToday = workoutLogs.some((l) => {
    return l.completedAt && l.completedAt.startsWith(todayIso);
  });
  const latestWorkout = workoutLogs[0] || null;

  // Workouts completed this week
  const oneWeekAgo = Date.now() - 7 * 86400000;
  const weeklyWorkoutsCount = workoutLogs.filter(
    (l) => new Date(l.completedAt).getTime() >= oneWeekAgo
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* High-Level Insights Hero Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* CARD 1: Current Weight & Body Health */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Body Weight & BMI
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {currentWeight} <span className="text-sm font-semibold text-slate-500">kg</span>
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1.5">
                    ({weightLbs} lbs)
                  </span>
                </h3>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${bmiCategory.badgeBg} ${bmiCategory.color}`}
            >
              BMI {bmi} • {bmiCategory.label}
            </span>
          </div>

          <div className="space-y-2 my-2 py-2 border-y border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Target className="w-3.5 h-3.5" /> Goal Weight
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {targetWeight ? `${targetWeight} kg` : '72.0 kg'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-500" /> Difference to Target
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {weightDiff !== null ? `${weightDiff > 0 ? '-' : '+'}${Math.abs(weightDiff)} kg` : '-3.4 kg'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('metrics')}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 group/btn"
          >
            <span>Log Weight & View History</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* CARD 2: Today's Calories & Protein Intake (User High Level Insights) */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Today&apos;s Nutrition
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {todayCalories}{' '}
                  <span className="text-sm font-semibold text-slate-500">
                    / {targetCalories} kcal
                  </span>
                </h3>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
              {calRemaining} kcal left
            </span>
          </div>

          {/* Prominent Protein Insight */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-100 dark:border-slate-800/80 mb-2">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Protein Today
              </span>
              <span className="font-black text-slate-900 dark:text-slate-100">
                {todayProtein}g <span className="text-slate-400">/ {targetProtein}g</span>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${protPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400">
              <span>{protPercent}% target met</span>
              <span>{protRemaining > 0 ? `${protRemaining}g remaining` : 'Goal achieved! 🎉'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('nutrition')}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 group/btn"
          >
            <span>Log Meal & Full Macros</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* CARD 3: Today's Workout & Training Status */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group sm:col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Training Status
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 line-clamp-1">
                  {todayWorkout ? todayWorkout.title : 'Routine Ready'}
                </h3>
              </div>
            </div>
            {completedToday ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black border bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20">
                Ready
              </span>
            )}
          </div>

          <div className="space-y-2 my-2 py-2 border-y border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Activity className="w-3.5 h-3.5" /> Target Muscle
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {todayWorkout?.muscleGroup || 'Full Body'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Completed This Week
              </span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">
                {weeklyWorkoutsCount} workouts
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('workouts')}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 group/btn"
          >
            <span>{completedToday ? 'View Workout Routine' : 'Start Workout Tracker'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Daily Macronutrient Balance Bar Widget */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-500" />
              Daily Macronutrient Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live consumption tracking towards your coach&apos;s daily target
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('nutrition')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            Open Food Logger <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Calories widget */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-100 dark:border-slate-800/80">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">Calories</span>
              <span className="font-extrabold text-amber-500">{calPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-2">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${calPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              <strong className="text-slate-900 dark:text-slate-100">{todayCalories}</strong> / {targetCalories} kcal
            </p>
          </div>

          {/* Protein widget */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-100 dark:border-slate-800/80">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">Protein</span>
              <span className="font-extrabold text-emerald-500">{protPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-2">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${protPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              <strong className="text-slate-900 dark:text-slate-100">{todayProtein}g</strong> / {targetProtein}g
            </p>
          </div>

          {/* Carbs widget */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-100 dark:border-slate-800/80">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">Carbs</span>
              <span className="font-extrabold text-cyan-500">{carbsPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-2">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all"
                style={{ width: `${carbsPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              <strong className="text-slate-900 dark:text-slate-100">{todayCarbs}g</strong> / {targetCarbs}g
            </p>
          </div>

          {/* Fats widget */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-100 dark:border-slate-800/80">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">Fats</span>
              <span className="font-extrabold text-rose-500">{fatsPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-2">
              <div
                className="h-full bg-rose-500 rounded-full transition-all"
                style={{ width: `${fatsPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              <strong className="text-slate-900 dark:text-slate-100">{todayFats}g</strong> / {targetFats}g
            </p>
          </div>
        </div>
      </div>

      {/* Quick Launchpad to App Sections */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 px-1">
          Quick Access Sections
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Workout Section */}
          <div
            onClick={() => onNavigate('workouts')}
            className="cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 hover:border-cyan-500/60 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-500 transition-colors">
                  Workout Tracker
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Timer, reps, & form popups
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-600 dark:text-cyan-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <span>Follow Routine</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. Nutrition Section */}
          <div
            onClick={() => onNavigate('nutrition')}
            className="cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 hover:border-emerald-500/60 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition-colors">
                  Nutrition Diary
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Voice meal logger & macros
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <span>Track Calories</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. Body & BMI Section */}
          <div
            onClick={() => onNavigate('metrics')}
            className="cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 hover:border-indigo-500/60 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-slate-950 transition-colors">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-500 transition-colors">
                  Body & BMI
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Weight records & photos
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <span>View Metrics</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 4. Calendar Section */}
          <div
            onClick={() => onNavigate('calendar')}
            className="cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 hover:border-amber-500/60 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors">
                  Workout Calendar
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Schedule & history log
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <span>Check Schedule</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Latest Completed Workout */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-cyan-500" />
              Latest Workout Completed
            </h3>
            {latestWorkout && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(latestWorkout.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {latestWorkout ? (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {latestWorkout.workoutTitle}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  {latestWorkout.durationMinutes || 30} mins
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {latestWorkout.details?.slice(0, 3).map((d, i) => (
                  <span
                    key={i}
                    className="text-[10px] rounded-lg bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 text-slate-600 dark:text-slate-300 font-medium"
                  >
                    {d.exerciseName} ({d.setsCompleted}s × {d.repsCompleted}r)
                  </span>
                ))}
                {(latestWorkout.details?.length || 0) > 3 && (
                  <span className="text-[10px] rounded-lg bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 text-slate-500">
                    +{(latestWorkout.details?.length || 0) - 3} more
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800">
              No completed workouts logged yet. Start today&apos;s routine to begin!
            </div>
          )}
        </div>

        {/* Latest Meal Log */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-500" />
              Latest Meals Recorded
            </h3>
            <span className="text-[10px] text-slate-400">
              {todayFoodLogs.length} logged today
            </span>
          </div>

          {todayFoodLogs.length > 0 ? (
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {todayFoodLogs.slice(0, 2).map((log) => {
                const cal =
                  log.calories ||
                  log.items?.reduce((s, it) => s + (it.calories || 0), 0) ||
                  0;
                const prot =
                  log.protein ||
                  log.items?.reduce((s, it) => s + (it.protein || 0), 0) ||
                  0;
                return (
                  <div
                    key={log.id}
                    className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{log.items?.[0]?.name || 'Meal items'}</span>
                        {(log.items?.length || 0) > 1 && (
                          <span className="text-[10px] text-slate-400">
                            (+{(log.items?.length || 0) - 1} items)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Logged via {log.loggedVia || 'manual'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-amber-500 block">
                        {cal} kcal
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {prot}g protein
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800">
              No meals logged today yet. Speak or type your meal to track!
            </div>
          )}
        </div>
      </div>

      {/* Assigned Coach Details Section */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 font-black flex items-center justify-center text-xl shadow-md">
              {coachProfile.displayName?.[0]?.toUpperCase() || 'C'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Your Assigned Coach
                </span>
                {coachProfile.experienceYears && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    · {coachProfile.experienceYears} yrs experience
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {coachProfile.displayName}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {coachProfile.specialty || 'Strength & Conditioning Specialist'}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-cyan-500" /> {coachProfile.email}
                </span>
                {coachProfile.certifications && coachProfile.certifications.length > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <Award className="w-3 h-3" /> {coachProfile.certifications.join(' · ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCoachProfileModal(true)}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 text-xs font-black hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400 dark:text-cyan-600" />
            <span>View Coach Details</span>
          </button>
        </div>

        {(coachProfile.bio || dietPlan?.notes) && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {coachProfile.bio && (
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Coach Background
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {coachProfile.bio}
                </p>
              </div>
            )}
            {dietPlan?.notes && (
              <div className="rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 p-3.5 border border-cyan-500/20">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block mb-1">
                  Latest Coaching Plan Note
                </span>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  &ldquo;{dietPlan.notes}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Coach Full Profile Modal */}
      {showCoachProfileModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowCoachProfileModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 font-black flex items-center justify-center text-xl shadow-md">
                  {coachProfile.displayName?.[0]?.toUpperCase() || 'C'}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    Assigned Head Coach
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {coachProfile.displayName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {coachProfile.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCoachProfileModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                  <Briefcase className="w-3 h-3 text-cyan-500" /> Coaching Specialty
                </span>
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {coachProfile.specialty || 'Strength, Hypertrophy & Nutrition Coaching'}
                </p>
                {coachProfile.experienceYears && (
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    {coachProfile.experienceYears} years of active coaching experience
                  </p>
                )}
              </div>

              {coachProfile.certifications && coachProfile.certifications.length > 0 && (
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
                    <Award className="w-3 h-3 text-emerald-500" /> Verified Credentials
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {coachProfile.certifications.map((cert) => (
                      <span
                        key={cert}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {coachProfile.bio && (
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Coaching Philosophy
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {coachProfile.bio}
                  </p>
                </div>
              )}

              {dietPlan?.notes && (
                <div className="rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 p-3.5 border border-cyan-500/20">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block mb-1">
                    Current Program Guidance
                  </span>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                    &ldquo;{dietPlan.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowCoachProfileModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all"
            >
              Close Coach Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
