import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Scale,
  Dumbbell,
  Utensils,
  Clock,
  ChevronRight,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sliders,
  TrendingDown,
  TrendingUp,
  X,
  Flame,
  LayoutGrid,
  List,
  Target,
  ArrowRight,
  Info,
} from 'lucide-react';
import { UserProfile, DietPlan, WorkoutLog } from '../../types';
import { calculateBmi, getBmiCategory } from '../metrics/BmiWeightTracker';

export interface ClientOverviewProps {
  clients: UserProfile[];
  dietPlans: DietPlan[];
  latestWorkoutLogs?: Record<string, WorkoutLog | null>;
  onSaveDietPlan: (plan: DietPlan) => Promise<void>;
  onSelectClient?: (client: UserProfile) => void;
  onAssignWorkout?: (client: UserProfile) => void;
  selectedClientId?: string;
}

export const ClientOverview: React.FC<ClientOverviewProps> = ({
  clients,
  dietPlans,
  latestWorkoutLogs = {},
  onSaveDietPlan,
  onSelectClient,
  onAssignWorkout,
  selectedClientId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'needsDiet' | 'active'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Macro Editor Modal State
  const [editingClient, setEditingClient] = useState<UserProfile | null>(null);
  const [targetCalories, setTargetCalories] = useState<number>(2400);
  const [proteinGrams, setProteinGrams] = useState<number>(170);
  const [carbsGrams, setCarbsGrams] = useState<number>(240);
  const [fatsGrams, setFatsGrams] = useState<number>(70);
  const [fiberGrams, setFiberGrams] = useState<number>(35);
  const [dietNotes, setDietNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Map diet plans by userId
  const dietPlansByUserId = useMemo(() => {
    const map: Record<string, DietPlan> = {};
    dietPlans.forEach((plan) => {
      map[plan.userId] = plan;
    });
    return map;
  }, [dietPlans]);

  // Filter clients based on search and status
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const name = (client.displayName || '').toLowerCase();
      const email = (client.email || '').toLowerCase();
      const query = searchTerm.toLowerCase();
      const matchesSearch = name.includes(query) || email.includes(query);
      if (!matchesSearch) return false;

      const hasDiet = !!dietPlansByUserId[client.uid];
      const hasWorkout = !!latestWorkoutLogs[client.uid];

      if (filterMode === 'needsDiet') return !hasDiet;
      if (filterMode === 'active') return hasWorkout;
      return true;
    });
  }, [clients, searchTerm, filterMode, dietPlansByUserId, latestWorkoutLogs]);

  // Open the macro editor for a specific client
  const handleOpenMacroEditor = (client: UserProfile) => {
    setEditingClient(client);
    const existing = dietPlansByUserId[client.uid];
    if (existing) {
      setTargetCalories(existing.targetCalories || 2400);
      setProteinGrams(existing.targetMacros?.protein || 170);
      setCarbsGrams(existing.targetMacros?.carbs || 240);
      setFatsGrams(existing.targetMacros?.fats || 70);
      setFiberGrams(existing.targetMicros?.fiber || 35);
      setDietNotes(existing.notes || '');
    } else {
      // Default initial recommended macros based on current weight
      const weight = client.currentWeight || 75;
      const defaultCalories = Math.round(weight * 32);
      const defaultProtein = Math.round(weight * 2.2);
      const defaultFats = Math.round((defaultCalories * 0.25) / 9);
      const defaultCarbs = Math.round((defaultCalories - (defaultProtein * 4 + defaultFats * 9)) / 4);

      setTargetCalories(defaultCalories);
      setProteinGrams(defaultProtein);
      setCarbsGrams(defaultCarbs);
      setFatsGrams(defaultFats);
      setFiberGrams(35);
      setDietNotes(`Individualized nutrition plan for ${client.displayName}. Focus on post-workout protein and 3L daily hydration.`);
    }
  };

  // Preset Macro Application
  const applyPreset = (preset: 'cut' | 'maintain' | 'bulk') => {
    if (!editingClient) return;
    const weight = editingClient.currentWeight || 75;

    if (preset === 'cut') {
      const cal = Math.round(weight * 26);
      const prot = Math.round(weight * 2.4);
      const fat = Math.round((cal * 0.25) / 9);
      const carb = Math.round((cal - (prot * 4 + fat * 9)) / 4);
      setTargetCalories(cal);
      setProteinGrams(prot);
      setCarbsGrams(carb);
      setFatsGrams(fat);
      setFiberGrams(35);
    } else if (preset === 'maintain') {
      const cal = Math.round(weight * 32);
      const prot = Math.round(weight * 2.0);
      const fat = Math.round((cal * 0.28) / 9);
      const carb = Math.round((cal - (prot * 4 + fat * 9)) / 4);
      setTargetCalories(cal);
      setProteinGrams(prot);
      setCarbsGrams(carb);
      setFatsGrams(fat);
      setFiberGrams(35);
    } else if (preset === 'bulk') {
      const cal = Math.round(weight * 38);
      const prot = Math.round(weight * 2.2);
      const fat = Math.round((cal * 0.25) / 9);
      const carb = Math.round((cal - (prot * 4 + fat * 9)) / 4);
      setTargetCalories(cal);
      setProteinGrams(prot);
      setCarbsGrams(carb);
      setFatsGrams(fat);
      setFiberGrams(40);
    }
  };

  // Save updated diet plan
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setIsSaving(true);

    try {
      const existing = dietPlansByUserId[editingClient.uid];
      const planToSave: DietPlan = {
        id: existing?.id || `diet-${editingClient.uid}`,
        trainerId: existing?.trainerId || 'current-trainer',
        userId: editingClient.uid,
        targetCalories: Number(targetCalories),
        targetMacros: {
          protein: Number(proteinGrams),
          carbs: Number(carbsGrams),
          fats: Number(fatsGrams),
        },
        targetMicros: {
          fiber: Number(fiberGrams),
        },
        notes: dietNotes || 'Custom nutrition targets set by trainer.',
        updatedAt: new Date().toISOString(),
      };

      await onSaveDietPlan(planToSave);
      setSaveSuccessNotice(`Successfully updated nutrition goals for ${editingClient.displayName}!`);
      setTimeout(() => setSaveSuccessNotice(null), 3500);
      setEditingClient(null);
    } catch (err) {
      console.error('Error saving diet plan:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to format date relative or readable
  const formatLogDate = (dateStr?: string) => {
    if (!dateStr) return 'No workouts logged yet';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));

      if (diffHours < 24) {
        if (diffHours <= 1) return 'Just today';
        return `${diffHours} hours ago`;
      }
      if (diffHours < 48) return 'Yesterday';
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Math summary for the modal
  const calculatedCalories = proteinGrams * 4 + carbsGrams * 4 + fatsGrams * 9;
  const calDifference = calculatedCalories - targetCalories;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-xs font-bold">
              <Users className="w-3.5 h-3.5" /> Client Roster ({clients.length})
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Live Overview & Macro Goal Management
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Client Performance & Goals Overview
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Monitor client body weight, recent workout completion, and set custom caloric & macronutrient targets.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search client by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            All Clients ({clients.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'active'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Active Workouts
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('needsDiet')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'needsDiet'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Needs Macro Plan
          </button>
        </div>
      </div>

      {/* Roster View (Grid Cards Mode) */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-xs text-slate-500">
              No clients found matching your search.
            </div>
          ) : (
            filteredClients.map((client) => {
              const clientWeight = client.currentWeight || 70;
              const clientHeight = client.height || 175;
              const bmi = calculateBmi(clientWeight, clientHeight);
              const bmiCat = getBmiCategory(bmi);
              const dietPlan = dietPlansByUserId[client.uid];
              const lastLog = latestWorkoutLogs[client.uid];
              const isSelected = selectedClientId === client.uid;

              return (
                <div
                  key={client.uid}
                  className={`rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-50/20 dark:bg-cyan-950/20 ring-2 ring-cyan-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="p-5 space-y-4">
                    {/* Client Header info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shrink-0">
                          {client.displayName?.[0] || 'C'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {client.displayName || 'Client Athlete'}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {client.email}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${bmiCat.badgeBg} ${bmiCat.color}`}
                        title={`BMI: ${bmi} (${bmiCat.label})`}
                      >
                        BMI {bmi}
                      </span>
                    </div>

                    {/* Weight & Body Stats */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                          Current Weight
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-base font-black text-slate-900 dark:text-slate-100">
                            {clientWeight} kg
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({Math.round(clientWeight * 2.20462)} lbs)
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                          Height & Stature
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-base font-black text-slate-900 dark:text-slate-100">
                            {clientHeight} cm
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({Math.floor(clientHeight / 30.48)}&apos;{Math.round((clientHeight % 30.48) / 2.54)}&quot;)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Last Active Workout */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Dumbbell className="w-3 h-3 text-emerald-500" /> Last Active Workout
                        </span>
                        <span>{formatLogDate(lastLog?.completedAt)}</span>
                      </div>

                      {lastLog ? (
                        <div className="mt-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {lastLog.workoutTitle}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                            <span>{lastLog.durationMinutes || 30} mins</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {lastLog.details?.length || 5} exercises logged
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No workout logs recorded yet.</p>
                      )}
                    </div>

                    {/* Current Calorie & Macro Goals */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-500" /> Daily Macro Goals
                        </span>
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                          {dietPlan ? `${dietPlan.targetCalories.toLocaleString()} kcal` : 'Unassigned'}
                        </span>
                      </div>

                      {dietPlan ? (
                        <div className="space-y-1.5">
                          {/* Macro pills */}
                          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                            <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">
                              P: {dietPlan.targetMacros.protein}g
                            </div>
                            <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                              C: {dietPlan.targetMacros.carbs}g
                            </div>
                            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                              F: {dietPlan.targetMacros.fats}g
                            </div>
                          </div>

                          {/* Mini distribution bar */}
                          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                            <div
                              className="bg-blue-500 h-full"
                              style={{ width: `${Math.round(((dietPlan.targetMacros.protein * 4) / dietPlan.targetCalories) * 100)}%` }}
                              title="Protein %"
                            />
                            <div
                              className="bg-amber-500 h-full"
                              style={{ width: `${Math.round(((dietPlan.targetMacros.carbs * 4) / dietPlan.targetCalories) * 100)}%` }}
                              title="Carbs %"
                            />
                            <div
                              className="bg-emerald-500 h-full"
                              style={{ width: `${Math.round(((dietPlan.targetMacros.fats * 9) / dietPlan.targetCalories) * 100)}%` }}
                              title="Fats %"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-600/80 dark:text-amber-400/80 italic text-[11px]">
                          No personalized macros set yet. Tap &apos;Edit Goals&apos; below.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-3 bg-slate-100/60 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    {onAssignWorkout && (
                      <button
                        type="button"
                        onClick={() => onAssignWorkout(client)}
                        className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all active:scale-95 shadow-sm"
                        title="Assign Workout (Push/Pull, Single, Circuit, or Custom)"
                      >
                        <Dumbbell className="w-3.5 h-3.5" />
                        <span>Assign Workout</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenMacroEditor(client)}
                      className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all active:scale-95 shadow-sm"
                      title="Edit Calorie & Macro Goals"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Macros</span>
                    </button>

                    {onSelectClient && (
                      <button
                        type="button"
                        onClick={() => onSelectClient(client)}
                        className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
                        title="Inspect full client dossier"
                      >
                        Inspect
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Roster View (Table Mode) */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Athlete</th>
                <th className="px-4 py-3.5">Weight / BMI</th>
                <th className="px-4 py-3.5">Last Active Workout</th>
                <th className="px-4 py-3.5">Macro Targets</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No clients match your filter.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const weight = client.currentWeight || 70;
                  const bmi = calculateBmi(weight, client.height || 175);
                  const bmiCat = getBmiCategory(bmi);
                  const dietPlan = dietPlansByUserId[client.uid];
                  const lastLog = latestWorkoutLogs[client.uid];

                  return (
                    <tr
                      key={client.uid}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-center shrink-0">
                            {client.displayName?.[0] || 'C'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {client.displayName || 'Client Athlete'}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {client.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Weight & BMI */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {weight} kg
                        </div>
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${bmiCat.badgeBg} ${bmiCat.color} mt-0.5`}>
                          BMI {bmi}
                        </span>
                      </td>

                      {/* Last Workout */}
                      <td className="px-4 py-3">
                        {lastLog ? (
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                              {lastLog.workoutTitle}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {formatLogDate(lastLog.completedAt)} • {lastLog.durationMinutes || 30}m
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None logged yet</span>
                        )}
                      </td>

                      {/* Macros */}
                      <td className="px-4 py-3">
                        {dietPlan ? (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {dietPlan.targetCalories.toLocaleString()} kcal
                            </span>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="text-blue-500 font-semibold">{dietPlan.targetMacros.protein}g P</span>
                              <span>•</span>
                              <span className="text-amber-500 font-semibold">{dietPlan.targetMacros.carbs}g C</span>
                              <span>•</span>
                              <span className="text-emerald-500 font-semibold">{dietPlan.targetMacros.fats}g F</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-500 text-[11px] font-bold">Unassigned</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onAssignWorkout && (
                            <button
                              type="button"
                              onClick={() => onAssignWorkout(client)}
                              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 font-bold transition-colors"
                              title="Assign Workout to Client"
                            >
                              Workout
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenMacroEditor(client)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-bold transition-colors"
                            title="Edit Calorie & Macro Goals"
                          >
                            Edit Macros
                          </button>
                          {onSelectClient && (
                            <button
                              type="button"
                              onClick={() => onSelectClient(client)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors"
                            >
                              Inspect
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= EDIT CALORIE / MACRO GOALS MODAL ================= */}
      {editingClient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto"
          onClick={() => setEditingClient(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl transition-all my-auto max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Edit Nutrition & Macro Goals
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Client: <strong className="text-slate-800 dark:text-slate-200">{editingClient.displayName}</strong> ({editingClient.currentWeight || 75} kg)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-4">
              {/* Preset buttons */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Coach Calculation Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('cut')}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-amber-500 text-left transition-colors"
                  >
                    <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">⚡ Fat Loss</span>
                    <span className="text-[10px] text-slate-400">High protein deficit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('maintain')}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-emerald-500 text-left transition-colors"
                  >
                    <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">⚖️ Maintain</span>
                    <span className="text-[10px] text-slate-400">Balanced recomposition</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('bulk')}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-blue-500 text-left transition-colors"
                  >
                    <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">💪 Lean Bulk</span>
                    <span className="text-[10px] text-slate-400">Surplus for hypertrophy</span>
                  </button>
                </div>
              </div>

              {/* Target Calories */}
              <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20">
                <label className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500" /> Daily Target Calories (kcal)
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 text-sm font-black">
                    {targetCalories} kcal
                  </span>
                </label>
                <input
                  type="number"
                  min="1200"
                  max="6000"
                  step="25"
                  required
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Specific Macronutrients Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Protein */}
                <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/20">
                  <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="400"
                    required
                    value={proteinGrams}
                    onChange={(e) => setProteinGrams(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {proteinGrams * 4} kcal ({Math.round(((proteinGrams * 4) / (targetCalories || 1)) * 100)}%)
                  </span>
                </div>

                {/* Carbs */}
                <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20">
                  <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                    Carbohydrates (g)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="600"
                    required
                    value={carbsGrams}
                    onChange={(e) => setCarbsGrams(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {carbsGrams * 4} kcal ({Math.round(((carbsGrams * 4) / (targetCalories || 1)) * 100)}%)
                  </span>
                </div>

                {/* Fats */}
                <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20">
                  <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    Fats (g)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="200"
                    required
                    value={fatsGrams}
                    onChange={(e) => setFatsGrams(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {fatsGrams * 9} kcal ({Math.round(((fatsGrams * 9) / (targetCalories || 1)) * 100)}%)
                  </span>
                </div>
              </div>

              {/* Macro Math Balance Checker */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Calculated sum from macros:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {calculatedCalories} kcal
                  </span>
                </div>
                {Math.abs(calDifference) > 50 && (
                  <p className="text-[11px] text-amber-500 mt-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    Macros sum differs from target calories by {calDifference > 0 ? `+${calDifference}` : calDifference} kcal.
                  </p>
                )}
              </div>

              {/* Fiber & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fiber Goal (g)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="70"
                    value={fiberGrams}
                    onChange={(e) => setFiberGrams(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Coach Guidance & Hydration Notes
                  </label>
                  <input
                    type="text"
                    value={dietNotes}
                    onChange={(e) => setDietNotes(e.target.value)}
                    placeholder="e.g. 3.5L water daily, creatine 5g with meal 1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Modal footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving Goals...' : 'Save Macro Goals'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
