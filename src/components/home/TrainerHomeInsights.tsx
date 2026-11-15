import React, { useMemo } from 'react';
import {
  Users,
  Dumbbell,
  Utensils,
  Flame,
  Scale,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Edit3,
  Calendar,
  Activity,
  Zap,
  Target,
  ExternalLink,
} from 'lucide-react';
import { UserProfile, DietPlan, WorkoutLog, FoodLog } from '../../types';
import { calculateBmi, getBmiCategory } from '../metrics/BmiWeightTracker';

export interface ClientInsightSummary {
  client: UserProfile;
  bmi: number;
  bmiCategory: { label: string; color: string; badgeBg: string };
  dietPlan: DietPlan | null;
  latestWorkout: WorkoutLog | null;
  todayNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    logged: boolean;
  };
  status: 'good' | 'warning' | 'needsPlan';
  statusLabel: string;
}

export interface TrainerHomeInsightsProps {
  clients: UserProfile[];
  dietPlans: DietPlan[];
  latestWorkoutLogs?: Record<string, WorkoutLog | null>;
  clientTodayNutritions?: Record<
    string,
    { calories: number; protein: number; carbs: number; fats: number; logged: boolean }
  >;
  onSelectClient: (client: UserProfile) => void;
  onEditMacroGoals: (client: UserProfile) => void;
  onAssignWorkout?: (client?: UserProfile) => void;
  onNavigateTab: (tab: 'clients' | 'workouts' | 'dietPlans') => void;
}

export const TrainerHomeInsights: React.FC<TrainerHomeInsightsProps> = ({
  clients,
  dietPlans,
  latestWorkoutLogs = {},
  clientTodayNutritions = {},
  onSelectClient,
  onEditMacroGoals,
  onAssignWorkout,
  onNavigateTab,
}) => {
  // Map diet plans
  const dietPlanMap = useMemo(() => {
    const map: Record<string, DietPlan> = {};
    dietPlans.forEach((p) => {
      map[p.userId] = p;
    });
    return map;
  }, [dietPlans]);

  // Aggregate insights for each client
  const clientInsights: ClientInsightSummary[] = useMemo(() => {
    return clients.map((client) => {
      const weight = client.currentWeight || 70;
      const height = client.height || 175;
      const bmi = calculateBmi(weight, height);
      const bmiCategory = getBmiCategory(bmi);
      const plan = dietPlanMap[client.uid] || null;
      const latestW = latestWorkoutLogs[client.uid] || null;
      const todayNut = clientTodayNutritions[client.uid] || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        logged: false,
      };

      let status: 'good' | 'warning' | 'needsPlan' = 'good';
      let statusLabel = 'On Track';

      if (!plan) {
        status = 'needsPlan';
        statusLabel = 'Needs Macro Plan';
      } else if (!todayNut.logged) {
        status = 'warning';
        statusLabel = 'No Meals Today';
      } else if (latestW) {
        const daysAgo = (Date.now() - new Date(latestW.completedAt).getTime()) / 86400000;
        if (daysAgo > 3) {
          status = 'warning';
          statusLabel = 'Inactive > 3 Days';
        }
      }

      return {
        client,
        bmi,
        bmiCategory,
        dietPlan: plan,
        latestWorkout: latestW,
        todayNutrition: todayNut,
        status,
        statusLabel,
      };
    });
  }, [clients, dietPlanMap, latestWorkoutLogs, clientTodayNutritions]);

  // High-level roster metrics
  const totalClients = clients.length;
  const clientsWithPlan = clientInsights.filter((c) => c.dietPlan !== null).length;
  const clientsLoggedNutritionToday = clientInsights.filter((c) => c.todayNutrition.logged).length;
  const activeWorkoutClients = clientInsights.filter((c) => c.latestWorkout !== null).length;
  const needsAttentionCount = clientInsights.filter((c) => c.status !== 'good').length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Top Banner / Welcome */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-bold text-cyan-600 dark:text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" /> Trainer Command Hub
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Live Roster Telemetry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Client Performance & Macro Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Real-time tracking of client weights, today&apos;s calories & protein consumption, and recent workouts.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onAssignWorkout && (
            <button
              type="button"
              onClick={() => onAssignWorkout(undefined)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <Dumbbell className="w-4 h-4" />
              <span>Assign Workout</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigateTab('workouts')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Dumbbell className="w-4 h-4 text-cyan-500" />
            <span>Workout Library</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('clients')}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
          >
            <Users className="w-4 h-4" />
            <span>Manage Clients</span>
          </button>
        </div>
      </div>

      {/* Roster KPI Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Clients
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalClients}</span>
              <span className="text-xs text-slate-400">athletes</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Logged Food Today
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {clientsLoggedNutritionToday}
              </span>
              <span className="text-xs text-slate-400">/ {totalClients} on track</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Lifters
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {activeWorkoutClients}
              </span>
              <span className="text-xs text-slate-400">with logs</span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-sm flex items-center gap-3.5">
          <div className={`p-3 rounded-xl border ${needsAttentionCount > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'}`}>
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Action Required
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-black ${needsAttentionCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {needsAttentionCount}
              </span>
              <span className="text-xs text-slate-400">need review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Client Insights Section */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-500" />
              Client Insights & Daily Compliance Roster
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quick access to current weight, today&apos;s calories & protein, and last active workout
            </p>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400">
            Showing {clientInsights.length} assigned clients
          </span>
        </div>

        {/* Client Insights Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientInsights.map((item) => {
            const { client, bmi, bmiCategory, dietPlan, latestWorkout, todayNutrition, statusLabel } = item;
            const weightLbs = Math.round((client.currentWeight || 70) * 2.20462 * 10) / 10;
            const targetCal = dietPlan?.targetCalories || 2400;
            const targetProt = dietPlan?.targetMacros?.protein || 170;
            const calPercent = Math.min(Math.round((todayNutrition.calories / targetCal) * 100), 100);
            const protPercent = Math.min(Math.round((todayNutrition.protein / targetProt) * 100), 100);

            // Last active workout text
            let lastWorkoutLabel = 'No workouts recorded yet';
            if (latestWorkout) {
              const diffMs = Date.now() - new Date(latestWorkout.completedAt).getTime();
              const hoursAgo = Math.floor(diffMs / 3600000);
              const daysAgo = Math.floor(hoursAgo / 24);
              if (hoursAgo < 1) lastWorkoutLabel = 'Just completed';
              else if (hoursAgo < 24) lastWorkoutLabel = `${hoursAgo}h ago`;
              else if (daysAgo === 1) lastWorkoutLabel = 'Yesterday';
              else lastWorkoutLabel = `${daysAgo}d ago`;
            }

            return (
              <div
                key={client.uid}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 p-4 hover:border-cyan-500/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Client Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-sm">
                        {client.displayName?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                          {client.displayName || 'Client'}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {client.email}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${bmiCategory.badgeBg} ${bmiCategory.color}`}
                    >
                      BMI {bmi}
                    </span>
                  </div>

                  {/* Weight & Body Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">Current Weight</span>
                      <strong className="text-slate-900 dark:text-slate-100 text-sm">
                        {client.currentWeight || '--'} kg
                      </strong>
                      <span className="text-[10px] text-slate-400 ml-1">({weightLbs} lbs)</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">Height</span>
                      <strong className="text-slate-900 dark:text-slate-100 text-sm">
                        {client.height || '--'} cm
                      </strong>
                    </div>
                  </div>

                  {/* Today's Calories & Protein Insight */}
                  <div className="space-y-2 mb-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-500" /> Today&apos;s Calories
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">
                        {todayNutrition.calories} <span className="text-slate-400">/ {targetCal} kcal</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${calPercent}%` }}
                      />
                    </div>

                    {/* Today's Protein */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-500" /> Today&apos;s Protein
                      </span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {todayNutrition.protein}g <span className="text-slate-400">/ {targetProt}g</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${protPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Last Active Workout */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 text-xs mb-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-3.5 h-3.5 text-cyan-500" /> Last Active Workout
                      </span>
                      <span className="text-[10px] font-semibold">{lastWorkoutLabel}</span>
                    </div>
                    {latestWorkout ? (
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs line-clamp-1">
                        {latestWorkout.workoutTitle}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No workouts completed yet</p>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  {onAssignWorkout && (
                    <button
                      type="button"
                      onClick={() => onAssignWorkout(client)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-400 hover:text-slate-950 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                      title="Assign Push/Pull, Single Exercise, Circuit, or Custom workout"
                    >
                      <Dumbbell className="w-3.5 h-3.5" />
                      <span>Workout</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onEditMacroGoals(client)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-slate-200/70 hover:bg-slate-300/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                    title="Edit calorie and macro targets"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Macros</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectClient(client)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-black transition-all flex items-center justify-center gap-1 shadow-sm"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
