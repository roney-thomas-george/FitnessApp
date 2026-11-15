import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Dna,
  Wheat,
  Droplet,
  Target,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  PieChart,
  UserCheck,
  Utensils,
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { DietPlan, FoodItem, FoodLog, UserProfile } from '../../types';
import { demoStore } from '../../services/demoStore';

interface MacroOverviewProps {
  dietPlanOverride?: DietPlan | null;
  assignedTrainer?: UserProfile | null;
  todayFoodLogsOverride?: FoodLog[];
}

type MetricKey = 'calories' | 'protein' | 'carbs' | 'fats';

interface MacroSummary {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sodium: number;
  potassium: number;
  itemCount: number;
}

export const MacroOverview: React.FC<MacroOverviewProps> = ({
  dietPlanOverride,
  assignedTrainer,
  todayFoodLogsOverride,
}) => {
  const { currentUser } = useAuth();

  const todayISO = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(dietPlanOverride || null);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('calories');
  const [showDietGuidance, setShowDietGuidance] = useState<boolean>(true);

  useEffect(() => {
    if (dietPlanOverride) {
      setDietPlan(dietPlanOverride);
    }
  }, [dietPlanOverride]);

  // Subscribe to Trainer-Assigned Diet Plan when override isn't already provided
  useEffect(() => {
    if (!currentUser || dietPlanOverride) return;

    if (currentUser.isDemo) {
      const plans = demoStore.getDietPlans();
      const plan = plans.find((p) => p.userId === currentUser.uid) || plans[0];
      setDietPlan(plan || null);
      return;
    }

    try {
      const planQuery = query(collection(db, 'dietPlans'), where('userId', '==', currentUser.uid));
      const unsubscribe = onSnapshot(
        planQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            setDietPlan({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as DietPlan);
          } else {
            setDietPlan({
              id: 'default-plan',
              trainerId: 'trainer-default',
              userId: currentUser.uid,
              targetCalories: 2350,
              targetMacros: { protein: 165, carbs: 240, fats: 70 },
              targetMicros: { fiber: 35, sodium: 2300, potassium: 3500 },
              notes: 'High protein baseline across meals with slow-digesting carbs around workouts.',
              updatedAt: new Date().toISOString(),
            });
          }
        },
        () => {
          setDietPlan({
            id: 'default-plan',
            trainerId: 'trainer-default',
            userId: currentUser.uid,
            targetCalories: 2350,
            targetMacros: { protein: 165, carbs: 240, fats: 70 },
            targetMicros: { fiber: 35, sodium: 2300, potassium: 3500 },
            notes: 'High protein baseline across meals with slow-digesting carbs around workouts.',
            updatedAt: new Date().toISOString(),
          });
        }
      );
      return () => unsubscribe();
    } catch {
      // ignore
    }
  }, [currentUser, dietPlanOverride]);

  // Subscribe to Food Logs for selectedDate (or use live override for today)
  useEffect(() => {
    if (!currentUser) return;

    if (selectedDate === todayISO && todayFoodLogsOverride) {
      setLogs(todayFoodLogsOverride);
      return;
    }

    if (currentUser.isDemo) {
      const demoLogs = demoStore.getFoodLogs(currentUser.uid).filter((l) => l.date === selectedDate);
      setLogs(demoLogs);
      return;
    }

    try {
      const foodQuery = query(
        collection(db, 'foodLogs'),
        where('userId', '==', currentUser.uid),
        where('date', '==', selectedDate)
      );
      const unsubscribe = onSnapshot(
        foodQuery,
        (snapshot) => {
          const fetched: FoodLog[] = [];
          snapshot.forEach((docSnap) => {
            fetched.push({ id: docSnap.id, ...docSnap.data() } as FoodLog);
          });
          setLogs(fetched);
        },
        () => {
          const demoLogs = demoStore.getFoodLogs(currentUser.uid).filter((l) => l.date === selectedDate);
          setLogs(demoLogs);
        }
      );
      return () => unsubscribe();
    } catch {
      const demoLogs = demoStore.getFoodLogs(currentUser.uid).filter((l) => l.date === selectedDate);
      setLogs(demoLogs);
    }
  }, [currentUser, selectedDate, todayISO, todayFoodLogsOverride]);

  // Flatten logged items for drill-down inspection
  const allLoggedItems: FoodItem[] = useMemo(() => {
    const items: FoodItem[] = [];
    logs.forEach((log) => {
      if (log.items && log.items.length > 0) {
        items.push(...log.items);
      } else {
        const raw = log as unknown as Record<string, number>;
        if (raw.calories || raw.protein || raw.carbs || raw.fats) {
          items.push({
            name: 'Logged Meal Entry',
            calories: raw.calories || 0,
            protein: raw.protein || 0,
            carbs: raw.carbs || 0,
            fats: raw.fats || 0,
          });
        }
      }
    });
    return items;
  }, [logs]);

  const totals: MacroSummary = useMemo(
    () =>
      allLoggedItems.reduce(
        (acc, item) => {
          acc.calories += item.calories || 0;
          acc.protein += item.protein || 0;
          acc.carbs += item.carbs || 0;
          acc.fats += item.fats || 0;
          acc.fiber += item.fiber || 0;
          acc.sodium += item.sodium || 0;
          acc.potassium += item.potassium || 0;
          acc.itemCount += 1;
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sodium: 0, potassium: 0, itemCount: 0 }
      ),
    [allLoggedItems]
  );

  // Assigned Targets
  const targetCalories = dietPlan?.targetCalories || 2350;
  const targetProtein = dietPlan?.targetMacros?.protein || 165;
  const targetCarbs = dietPlan?.targetMacros?.carbs || 240;
  const targetFats = dietPlan?.targetMacros?.fats || 70;
  const targetFiber = dietPlan?.targetMicros?.fiber || 35;
  const targetSodium = dietPlan?.targetMicros?.sodium || 2300;
  const targetPotassium = dietPlan?.targetMicros?.potassium || 3500;

  const calcPercent = (val: number, target: number) =>
    target <= 0 ? 0 : Math.min(Math.round((val / target) * 100), 150);

  const proteinCals = totals.protein * 4;
  const carbsCals = totals.carbs * 4;
  const fatsCals = totals.fats * 9;
  const totalMacroCals = proteinCals + carbsCals + fatsCals || 1;
  const proteinShare = Math.round((proteinCals / totalMacroCals) * 100);
  const carbsShare = Math.round((carbsCals / totalMacroCals) * 100);
  const fatsShare = Math.max(0, 100 - proteinShare - carbsShare);

  const changeDateByDays = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === todayISO;

  // Unified metric definitions for single clickable card
  const metricConfigs: {
    key: MetricKey;
    label: string;
    unit: string;
    consumed: number;
    target: number;
    percent: number;
    kcalEquivalent: number;
    energyShare?: number;
    icon: React.ReactNode;
    accentText: string;
    barClass: string;
    ringClass: string;
    guidance: string;
  }[] = [
    {
      key: 'calories',
      label: 'Calories',
      unit: 'kcal',
      consumed: Math.round(totals.calories),
      target: targetCalories,
      percent: calcPercent(totals.calories, targetCalories),
      kcalEquivalent: Math.round(totals.calories),
      icon: <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />,
      accentText: 'text-amber-600 dark:text-amber-400',
      barClass: totals.calories > targetCalories ? 'bg-rose-500' : 'bg-amber-500',
      ringClass: 'border-amber-500 bg-amber-500/5',
      guidance:
        totals.calories > targetCalories
          ? `You are ${Math.round(totals.calories - targetCalories)} kcal above your coach's daily limit. Prioritize hydration and lean greens for any remaining meals.`
          : `You have ${Math.max(0, targetCalories - Math.round(totals.calories))} kcal left to hit today's coach target cleanly.`,
    },
    {
      key: 'protein',
      label: 'Protein',
      unit: 'g',
      consumed: Math.round(totals.protein * 10) / 10,
      target: targetProtein,
      percent: calcPercent(totals.protein, targetProtein),
      kcalEquivalent: Math.round(proteinCals),
      energyShare: proteinShare,
      icon: <Dna className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />,
      accentText: 'text-cyan-600 dark:text-cyan-400',
      barClass: 'bg-cyan-500',
      ringClass: 'border-cyan-500 bg-cyan-500/5',
      guidance:
        totals.protein >= targetProtein
          ? 'Protein goal achieved! Muscle protein synthesis support is dialed in for today.'
          : `${Math.round((targetProtein - totals.protein) * 10) / 10}g protein left — consider 1 scoop whey (~24g) or 150g grilled chicken/paneer.`,
    },
    {
      key: 'carbs',
      label: 'Carbs',
      unit: 'g',
      consumed: Math.round(totals.carbs * 10) / 10,
      target: targetCarbs,
      percent: calcPercent(totals.carbs, targetCarbs),
      kcalEquivalent: Math.round(carbsCals),
      energyShare: carbsShare,
      icon: <Wheat className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />,
      accentText: 'text-emerald-600 dark:text-emerald-400',
      barClass: 'bg-emerald-500',
      ringClass: 'border-emerald-500 bg-emerald-500/5',
      guidance:
        totals.carbs >= targetCarbs
          ? 'Daily carb tank is full — great glycogen fuel for training sessions.'
          : `${Math.round((targetCarbs - totals.carbs) * 10) / 10}g carbs remaining for sustained energy (oats, brown rice, sweet potato, fruit).`,
    },
    {
      key: 'fats',
      label: 'Fats',
      unit: 'g',
      consumed: Math.round(totals.fats * 10) / 10,
      target: targetFats,
      percent: calcPercent(totals.fats, targetFats),
      kcalEquivalent: Math.round(fatsCals),
      energyShare: fatsShare,
      icon: <Droplet className="w-4 h-4 text-rose-500 dark:text-rose-400" />,
      accentText: 'text-rose-600 dark:text-rose-400',
      barClass: 'bg-rose-500',
      ringClass: 'border-rose-500 bg-rose-500/5',
      guidance:
        totals.fats >= targetFats
          ? 'Healthy fat budget reached (9 kcal/g). Keep remaining snacks ultra-lean today.'
          : `${Math.round((targetFats - totals.fats) * 10) / 10}g healthy fats left (avocado, almonds, olive oil, egg yolks).`,
    },
  ];

  const activeMetric = metricConfigs.find((m) => m.key === selectedMetric) || metricConfigs[0];

  // Top food contributors sorted by currently selected metric
  const topContributors = useMemo(() => {
    return [...allLoggedItems]
      .sort((a, b) => (b[selectedMetric] || 0) - (a[selectedMetric] || 0))
      .slice(0, 5);
  }, [allLoggedItems, selectedMetric]);

  const remainingVal = Math.round((activeMetric.target - activeMetric.consumed) * 10) / 10;
  const coachName = assignedTrainer?.displayName || 'Your Coach';

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-xl backdrop-blur-xl space-y-5 transition-colors">
      {/* Header + Date Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
            <Target className="w-3.5 h-3.5" /> Nutrition &amp; Diet Adherence
          </span>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
            Macro-Nutrient &amp; Energy Overview
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any metric below to inspect detailed targets, energy share, and meal contributors.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 p-1.5 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => changeDateByDays(-1)}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            />
            {isToday && (
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                Today
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => changeDateByDays(1)}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trainer-Assigned Diet Tracker Strip */}
      <div className="rounded-2xl border border-cyan-500/25 bg-cyan-50/70 dark:bg-cyan-950/20 p-4 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Trainer-Assigned Diet Plan · {coachName}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
                Daily Targets: <strong className="text-slate-900 dark:text-slate-200">{targetCalories} kcal</strong> ·{' '}
                <span className="text-cyan-700 dark:text-cyan-400 font-semibold">{targetProtein}g P</span> ·{' '}
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{targetCarbs}g C</span> ·{' '}
                <span className="text-rose-700 dark:text-rose-400 font-semibold">{targetFats}g F</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDietGuidance(!showDietGuidance)}
            className="flex items-center gap-1 text-[11px] font-bold text-cyan-700 dark:text-cyan-400 hover:underline"
          >
            {showDietGuidance ? 'Hide Notes' : 'Show Coach Notes'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDietGuidance ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showDietGuidance && (
          <div className="mt-3 pt-3 border-t border-cyan-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-cyan-700 dark:text-cyan-400">Coach Prescription: </span>
              {dietPlan?.notes || 'Focus on hitting protein targets evenly across meals and whole-food micronutrients.'}
            </p>
            <span className="shrink-0 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {totals.itemCount} items tracked today
            </span>
          </div>
        )}
      </div>

      {/* UNIFIED SINGLE-CARD INTERACTIVE MACRO BAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-4">
        {/* 4 Clickable Summary Columns in ONE Unified Container */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {metricConfigs.map((m) => {
            const isSelected = m.key === selectedMetric;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMetric(m.key)}
                className={`text-left rounded-xl p-3 border transition-all cursor-pointer ${
                  isSelected
                    ? `${m.ringClass} ring-2 ring-offset-0 ring-emerald-500/20 shadow-sm bg-white dark:bg-slate-900`
                    : 'border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                    {m.icon}
                    {m.label}
                  </span>
                  <span className={`text-[11px] font-black tabular-nums ${m.accentText}`}>{m.percent}%</span>
                </div>

                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
                    {m.consumed}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                    / {m.target} {m.unit}
                  </span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 mt-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${m.barClass}`}
                    style={{ width: `${Math.min(m.percent, 100)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Energy Ratio Bar */}
        <div className="px-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5" /> Caloric Split Today
            </span>
            <span className="tabular-nums">
              P {proteinShare}% · C {carbsShare}% · F {fatsShare}%
            </span>
          </div>
          <div className="h-2 w-full flex overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="bg-cyan-500 transition-all duration-500" style={{ width: `${proteinShare}%` }} />
            <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${carbsShare}%` }} />
            <div className="bg-rose-500 transition-all duration-500" style={{ width: `${fatsShare}%` }} />
          </div>
        </div>

        {/* CLICKED METRIC EXPANDED INSIGHT PANEL */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              {activeMetric.icon}
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                {activeMetric.label} Detailed Breakdown
              </h4>
            </div>

            <div className="flex items-center gap-3 text-xs tabular-nums">
              <span className="text-slate-500 dark:text-slate-400">
                Energy equiv: <strong className="text-slate-900 dark:text-slate-100">{activeMetric.kcalEquivalent} kcal</strong>
                {activeMetric.energyShare !== undefined ? ` (${activeMetric.energyShare}% of intake)` : ''}
              </span>
              {remainingVal < 0 ? (
                <span className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5" /> {Math.abs(remainingVal)} {activeMetric.unit} over
                </span>
              ) : (
                <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {remainingVal} {activeMetric.unit} remaining
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {activeMetric.guidance}
          </p>

          {/* Per-food Contributors for the Clicked Metric */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5" /> Top {activeMetric.label} Sources Logged ({selectedDate})
            </p>
            {topContributors.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                No foods logged for this date yet. Use the Voice Logger or Food Search below to track against your trainer&apos;s plan.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {topContributors.map((food, idx) => (
                  <div
                    key={`${food.name}-${idx}`}
                    className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{food.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {food.servingSize || '1 serving'}
                      </p>
                    </div>
                    <span className={`shrink-0 font-black tabular-nums ${activeMetric.accentText}`}>
                      {food[selectedMetric]} {activeMetric.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Micronutrients Strip inside same overview */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Key Micronutrients
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Fiber &amp; Electrolytes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 tabular-nums">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Dietary Fiber</span>
              <span className="font-bold text-slate-900 dark:text-slate-200">
                {Math.round(totals.fiber * 10) / 10}g <span className="text-slate-500 font-normal">/ {targetFiber}g</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full bg-teal-500 transition-all duration-500"
                style={{ width: `${Math.min(calcPercent(totals.fiber, targetFiber), 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Sodium</span>
              <span className="font-bold text-slate-900 dark:text-slate-200">
                {Math.round(totals.sodium)}mg <span className="text-slate-500 font-normal">/ {targetSodium}mg</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${Math.min(calcPercent(totals.sodium, targetSodium), 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Potassium</span>
              <span className="font-bold text-slate-900 dark:text-slate-200">
                {Math.round(totals.potassium)}mg <span className="text-slate-500 font-normal">/ {targetPotassium}mg</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${Math.min(calcPercent(totals.potassium, targetPotassium), 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
