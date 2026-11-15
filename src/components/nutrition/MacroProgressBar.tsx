import React from 'react';
import { Flame, Dna, Wheat, Droplet, Target, Sparkles } from 'lucide-react';
import { DietPlan, FoodLog } from '../../types';

interface MacroProgressBarProps {
  dietPlan?: DietPlan | null;
  todayLogs: FoodLog[];
}

export const MacroProgressBar: React.FC<MacroProgressBarProps> = ({ dietPlan, todayLogs }) => {
  // Aggregate all items eaten today
  const consumed = todayLogs.flatMap((log) => log.items).reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fats: acc.fats + (item.fats || 0),
      fiber: acc.fiber + (item.fiber || 0),
      sodium: acc.sodium + (item.sodium || 0),
      potassium: acc.potassium + (item.potassium || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sodium: 0, potassium: 0 }
  );

  // Targets from trainer or reasonable standard baseline
  const targetCalories = dietPlan?.targetCalories || 2200;
  const targetProtein = dietPlan?.targetMacros?.protein || 150;
  const targetCarbs = dietPlan?.targetMacros?.carbs || 220;
  const targetFats = dietPlan?.targetMacros?.fats || 65;

  const targetFiber = dietPlan?.targetMicros?.fiber || 30;
  const targetSodium = dietPlan?.targetMicros?.sodium || 2300;
  const targetPotassium = dietPlan?.targetMicros?.potassium || 3500;

  const getPercent = (current: number, target: number) => {
    if (target <= 0) return 0;
    return Math.min(Math.round((current / target) * 100), 150);
  };

  const calPercent = getPercent(consumed.calories, targetCalories);
  const proteinPercent = getPercent(consumed.protein, targetProtein);
  const carbsPercent = getPercent(consumed.carbs, targetCarbs);
  const fatsPercent = getPercent(consumed.fats, targetFats);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xl backdrop-blur-md transition-colors">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Daily Nutrition &amp; Macro Targets
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {dietPlan ? 'Assigned by your Coach' : 'Default Target Baseline (Ask your trainer for a custom plan)'}
          </p>
        </div>
        <div className="text-right tabular-nums">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Remaining</span>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {Math.max(0, targetCalories - Math.round(consumed.calories))} kcal
          </p>
        </div>
      </div>

      {/* Main Calories Bar */}
      <div className="mb-6 rounded-xl bg-slate-50 dark:bg-slate-950/80 p-4 border border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Total Energy</span>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100 tabular-nums">
                {Math.round(consumed.calories)}{' '}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {targetCalories} kcal</span>
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full tabular-nums ${
              calPercent > 105
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                : calPercent >= 80
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
            }`}
          >
            {calPercent}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className={`h-full transition-all duration-500 ${
              calPercent > 105
                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                : 'bg-gradient-to-r from-amber-500 to-emerald-400'
            }`}
            style={{ width: `${Math.min(calPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Three Major Macros Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5 tabular-nums">
        {/* Protein */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">
              <Dna className="w-3.5 h-3.5" /> Protein
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{proteinPercent}%</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              {Math.round(consumed.protein * 10) / 10}g
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Target: {targetProtein}g</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full bg-cyan-500 dark:bg-cyan-400 transition-all duration-500"
              style={{ width: `${Math.min(proteinPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Carbohydrates */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              <Wheat className="w-3.5 h-3.5" /> Carbs
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{carbsPercent}%</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              {Math.round(consumed.carbs * 10) / 10}g
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Target: {targetCarbs}g</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(carbsPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Fats */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
              <Droplet className="w-3.5 h-3.5" /> Fats
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{fatsPercent}%</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              {Math.round(consumed.fats * 10) / 10}g
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Target: {targetFats}g</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full bg-rose-500 dark:bg-rose-400 transition-all duration-500"
              style={{ width: `${Math.min(fatsPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Micronutrients strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 px-3.5 py-2.5 text-xs tabular-nums">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Micronutrients:
        </span>
        <div className="flex flex-wrap gap-4 text-slate-600 dark:text-slate-300">
          <span>
            Fiber:{' '}
            <strong className="text-slate-900 dark:text-slate-100">{Math.round(consumed.fiber * 10) / 10}g</strong> / {targetFiber}g
          </span>
          <span>
            Sodium:{' '}
            <strong className="text-slate-900 dark:text-slate-100">{Math.round(consumed.sodium)}mg</strong> / {targetSodium}mg
          </span>
          <span>
            Potassium:{' '}
            <strong className="text-slate-900 dark:text-slate-100">{Math.round(consumed.potassium)}mg</strong> / {targetPotassium}mg
          </span>
        </div>
      </div>
    </div>
  );
};
