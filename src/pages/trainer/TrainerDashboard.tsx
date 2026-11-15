import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Dumbbell,
  Utensils,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import {
  DietPlan,
  FoodLog,
  UserProfile,
  WeightRecord,
  WorkoutLog,
  WorkoutRoutine,
} from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/errorHandling';
import { YouTubeEmbed } from '../../components/workout/YouTubeEmbed';
import { demoStore } from '../../services/demoStore';
import { TrainerHomeInsights } from '../../components/home/TrainerHomeInsights';
import { ClientOverview } from '../../components/trainer/ClientOverview';
import { AssignWorkoutModal } from '../../components/trainer/AssignWorkoutModal';

export const TrainerDashboard: React.FC = () => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'home' | 'clients' | 'workouts' | 'dietPlans'>('home');
  const [workoutFormatFilter, setWorkoutFormatFilter] = useState<
    'all' | 'push_pull' | 'single_exercise' | 'circuit' | 'custom'
  >('all');

  // State
  const [assignedClients, setAssignedClients] = useState<UserProfile[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutRoutine[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [latestWorkoutLogsMap, setLatestWorkoutLogsMap] = useState<Record<string, WorkoutLog | null>>({});
  const [clientTodayNutritionsMap, setClientTodayNutritionsMap] = useState<
    Record<string, { calories: number; protein: number; carbs: number; fats: number; logged: boolean }>
  >({});
  const [clientLogs, setClientLogs] = useState<{
    workoutLogs: WorkoutLog[];
    foodLogs: FoodLog[];
    weightHistory: WeightRecord[];
  }>({ workoutLogs: [], foodLogs: [], weightHistory: [] });

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Assign Workout Modal state
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [assignWorkoutClientId, setAssignWorkoutClientId] = useState<string | undefined>(undefined);

  // New Diet Plan Form state
  const [showDietModal, setShowDietModal] = useState(false);
  const [dietUserId, setDietUserId] = useState('');
  const [dietCalories, setDietCalories] = useState(2400);
  const [dietProtein, setDietProtein] = useState(170);
  const [dietCarbs, setDietCarbs] = useState(240);
  const [dietFats, setDietFats] = useState(70);
  const [dietFiber, setDietFiber] = useState(35);
  const [dietNotes, setDietNotes] = useState('Target high hydration (3.5L/day), 1g protein per lb lean body mass.');

  // Fetch assigned clients
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.isDemo) {
      const allClients = demoStore.getUsers().filter((u) => u.role === 'user');
      setAssignedClients(allClients);
      if (allClients.length > 0 && !selectedClient) {
        setSelectedClient(allClients[0]);
      }
      setLoading(false);
      return;
    }

    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const clientsList: UserProfile[] = [];
        snapshot.forEach((d) => {
          const u = d.data() as UserProfile;
          if (u.role === 'user') {
            if (isAdmin || u.trainerId === currentUser.uid || !u.trainerId) {
              clientsList.push(u);
            }
          }
        });
        setAssignedClients(clientsList);
        if (clientsList.length > 0 && !selectedClient) {
          setSelectedClient(clientsList[0]);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Clients fetch note, using local demo clients:', error);
        const allClients = demoStore.getUsers().filter((u) => u.role === 'user');
        setAssignedClients(allClients);
        if (allClients.length > 0 && !selectedClient) setSelectedClient(allClients[0]);
        setLoading(false);
      }
    );

    return () => unsubscribeUsers();
  }, [currentUser, isAdmin]);

  // Synchronize route with activeTab
  useEffect(() => {
    if (location.pathname.includes('/clients')) {
      setActiveTab('clients');
    } else if (location.pathname.includes('/workouts')) {
      setActiveTab('workouts');
    } else if (location.pathname.includes('/diets') || location.pathname.includes('/dietPlans')) {
      setActiveTab('dietPlans');
    } else {
      setActiveTab('home');
    }
  }, [location.pathname]);

  // Aggregate latest workout log and today's nutrition for each client
  useEffect(() => {
    if (assignedClients.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const wMap: Record<string, WorkoutLog | null> = {};
    const nMap: Record<
      string,
      { calories: number; protein: number; carbs: number; fats: number; logged: boolean }
    > = {};

    assignedClients.forEach((client) => {
      const wLogs = demoStore.getWorkoutLogs(client.uid);
      wMap[client.uid] = wLogs[0] || null;

      const fLogs = demoStore.getFoodLogs(client.uid);
      const todayLogs = fLogs.filter((f) => f.date === todayStr);
      const calories = todayLogs.reduce(
        (acc, f) => acc + (f.calories || f.items?.reduce((s, it) => s + (it.calories || 0), 0) || 0),
        0
      );
      const protein =
        Math.round(
          todayLogs.reduce(
            (acc, f) => acc + (f.protein || f.items?.reduce((s, it) => s + (it.protein || 0), 0) || 0),
            0
          ) * 10
        ) / 10;
      const carbs =
        Math.round(
          todayLogs.reduce(
            (acc, f) => acc + (f.carbs || f.items?.reduce((s, it) => s + (it.carbs || 0), 0) || 0),
            0
          ) * 10
        ) / 10;
      const fats =
        Math.round(
          todayLogs.reduce(
            (acc, f) => acc + (f.fats || f.items?.reduce((s, it) => s + (it.fats || 0), 0) || 0),
            0
          ) * 10
        ) / 10;

      nMap[client.uid] = {
        calories,
        protein,
        carbs,
        fats,
        logged: todayLogs.length > 0,
      };
    });

    setLatestWorkoutLogsMap(wMap);
    setClientTodayNutritionsMap(nMap);

    if (!currentUser?.isDemo) {
      try {
        const unsubW = onSnapshot(collection(db, 'workoutLogs'), (snap) => {
          const liveWMap: Record<string, WorkoutLog | null> = { ...wMap };
          snap.forEach((d) => {
            const l = { id: d.id, ...d.data() } as WorkoutLog;
            if (
              !liveWMap[l.userId] ||
              new Date(l.completedAt).getTime() > new Date(liveWMap[l.userId]!.completedAt).getTime()
            ) {
              liveWMap[l.userId] = l;
            }
          });
          setLatestWorkoutLogsMap(liveWMap);
        });

        const unsubF = onSnapshot(collection(db, 'foodLogs'), (snap) => {
          const liveNMap: Record<
            string,
            { calories: number; protein: number; carbs: number; fats: number; logged: boolean }
          > = { ...nMap };
          snap.forEach((d) => {
            const f = { id: d.id, ...d.data() } as FoodLog;
            if (f.date === todayStr) {
              const cal = f.calories || f.items?.reduce((s, it) => s + (it.calories || 0), 0) || 0;
              const prot = f.protein || f.items?.reduce((s, it) => s + (it.protein || 0), 0) || 0;
              const carb = f.carbs || f.items?.reduce((s, it) => s + (it.carbs || 0), 0) || 0;
              const fat = f.fats || f.items?.reduce((s, it) => s + (it.fats || 0), 0) || 0;
              liveNMap[f.userId] = {
                calories: (liveNMap[f.userId]?.calories || 0) + cal,
                protein: Math.round(((liveNMap[f.userId]?.protein || 0) + prot) * 10) / 10,
                carbs: Math.round(((liveNMap[f.userId]?.carbs || 0) + carb) * 10) / 10,
                fats: Math.round(((liveNMap[f.userId]?.fats || 0) + fat) * 10) / 10,
                logged: true,
              };
            }
          });
          setClientTodayNutritionsMap(liveNMap);
        });

        return () => {
          unsubW();
          unsubF();
        };
      } catch (e) {
        console.warn('Real-time client telemetry listener note:', e);
      }
    }
  }, [assignedClients, currentUser]);

  const handleSaveDietPlan = async (plan: DietPlan) => {
    demoStore.saveDietPlan(plan);
    setDietPlans((prev) => {
      const idx = prev.findIndex((p) => p.userId === plan.userId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = plan;
        return copy;
      }
      return [plan, ...prev];
    });
    if (!currentUser?.isDemo) {
      try {
        await setDoc(doc(db, 'dietPlans', plan.id), plan, { merge: true });
      } catch (e) {
        console.warn('Diet plan save note:', e);
      }
    }
    setNotification('Macro goals successfully updated for client!');
    setTimeout(() => setNotification(null), 3500);
  };

  // Fetch Workouts created by this trainer (or all if admin)
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.isDemo) {
      setWorkouts(demoStore.getWorkouts());
      return;
    }

    const wQuery = query(collection(db, 'workouts'));
    const unsubscribeWorkouts = onSnapshot(
      wQuery,
      (snapshot) => {
        const fetched: WorkoutRoutine[] = [];
        snapshot.forEach((d) => {
          const w = { ...d.data(), id: d.id } as WorkoutRoutine;
          if (isAdmin || w.trainerId === currentUser.uid) {
            fetched.push(w);
          }
        });
        setWorkouts(fetched);
      },
      (error) => {
        console.warn('Workouts fetch note, using local demo routines:', error);
        setWorkouts(demoStore.getWorkouts());
      }
    );

    return () => unsubscribeWorkouts();
  }, [currentUser, isAdmin]);

  // Fetch Diet Plans
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.isDemo) {
      setDietPlans(demoStore.getDietPlans());
      return;
    }

    const dQuery = query(collection(db, 'dietPlans'));
    const unsubscribeDiet = onSnapshot(
      dQuery,
      (snapshot) => {
        const plans: DietPlan[] = [];
        snapshot.forEach((d) => {
          plans.push({ id: d.id, ...d.data() } as DietPlan);
        });
        setDietPlans(plans);
      },
      (error) => {
        console.warn('Diet plans fetch note, using local demo plans:', error);
        setDietPlans(demoStore.getDietPlans());
      }
    );

    return () => unsubscribeDiet();
  }, [currentUser]);

  // When a client is selected, inspect their workout logs, food diaries, and weight history
  useEffect(() => {
    if (!selectedClient) return;

    if (currentUser?.isDemo) {
      setClientLogs({
        workoutLogs: [
          {
            id: 'demo-wlog-1',
            userId: selectedClient.uid,
            workoutId: 'w-1',
            workoutTitle: 'Hypertrophy Push & Upper Chest Power',
            completedAt: new Date(Date.now() - 86400000).toISOString(),
            details: [
              { exerciseName: 'Barbell Flat Bench Press', setsCompleted: 4, repsCompleted: 10, weightUsed: 75, completed: true },
              { exerciseName: 'Incline Dumbbell Bench Press', setsCompleted: 3, repsCompleted: 12, weightUsed: 26, completed: true },
            ],
          },
        ],
        foodLogs: demoStore.getFoodLogs(selectedClient.uid),
        weightHistory: demoStore.getWeightHistory(selectedClient.uid),
      });
      return;
    }

    const loadClientData = async () => {
      try {
        const wSnap = await getDocs(
          query(collection(db, 'workoutLogs'), where('userId', '==', selectedClient.uid))
        );
        const wLogs: WorkoutLog[] = [];
        wSnap.forEach((d) => wLogs.push({ id: d.id, ...d.data() } as WorkoutLog));

        const fSnap = await getDocs(
          query(collection(db, 'foodLogs'), where('userId', '==', selectedClient.uid))
        );
        const fLogs: FoodLog[] = [];
        fSnap.forEach((d) => fLogs.push({ id: d.id, ...d.data() } as FoodLog));

        const wtSnap = await getDocs(
          query(collection(db, 'weightHistory'), where('userId', '==', selectedClient.uid))
        );
        const wtLogs: WeightRecord[] = [];
        wtSnap.forEach((d) => wtLogs.push({ id: d.id, ...d.data() } as WeightRecord));

        setClientLogs({
          workoutLogs: wLogs.sort(
            (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          ),
          foodLogs: fLogs.sort(
            (a, b) => new Date(b.loggedAt || b.date).getTime() - new Date(a.loggedAt || a.date).getTime()
          ),
          weightHistory: wtLogs.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          ),
        });
      } catch (err) {
        console.warn('Error loading client inspection data:', err);
        setClientLogs({
          workoutLogs: [],
          foodLogs: demoStore.getFoodLogs(selectedClient.uid),
          weightHistory: demoStore.getWeightHistory(selectedClient.uid),
        });
      }
    };

    loadClientData();
  }, [selectedClient, currentUser]);

  const handleOpenAssignWorkout = (client?: UserProfile) => {
    setAssignWorkoutClientId(client?.uid);
    setShowWorkoutModal(true);
  };

  const handleSaveAssignedWorkout = async (workout: WorkoutRoutine) => {
    if (!currentUser) return;
    try {
      const { id: _ignoredId, ...workoutPayload } = workout;
      if (currentUser.isDemo) {
        const created = demoStore.addWorkout(workoutPayload);
        setWorkouts((prev) => [created, ...prev.filter((w) => w.id !== created.id)]);
      } else {
        await addDoc(collection(db, 'workouts'), workoutPayload);
      }
      setNotification(`Assigned "${workout.title}" to ${workout.assignedTo.length} client(s)!`);
      setTimeout(() => setNotification(null), 3500);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'workouts');
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      if (currentUser?.isDemo) {
        demoStore.deleteWorkout(workoutId);
        setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
      } else {
        await deleteDoc(doc(db, 'workouts', workoutId));
      }
      setNotification('Workout routine removed');
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `workouts/${workoutId}`);
    }
  };

  const handleSaveDietPlanModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !dietUserId) return;

    try {
      const planDocId = `plan_${dietUserId}`;
      const plan: DietPlan = {
        id: planDocId,
        trainerId: currentUser.uid,
        userId: dietUserId,
        targetCalories: Number(dietCalories),
        targetMacros: {
          protein: Number(dietProtein),
          carbs: Number(dietCarbs),
          fats: Number(dietFats),
        },
        targetMicros: {
          fiber: Number(dietFiber),
          sodium: 2300,
          potassium: 3500,
        },
        notes: dietNotes,
        updatedAt: new Date().toISOString(),
      };

      if (currentUser.isDemo) {
        demoStore.saveDietPlan(plan);
        setDietPlans((prev) => {
          const idx = prev.findIndex((p) => p.userId === plan.userId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = plan;
            return next;
          }
          return [plan, ...prev];
        });
      } else {
        await setDoc(doc(db, 'dietPlans', planDocId), plan);
      }

      setNotification('Custom meal & macro plan successfully assigned!');
      setTimeout(() => setNotification(null), 3000);
      setShowDietModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'dietPlans');
    }
  };

  const filteredWorkouts = Array.from(
    new Map(
      (workoutFormatFilter === 'all'
        ? workouts
        : workouts.filter((w) => (w.routineType || 'custom') === workoutFormatFilter)
      ).map((w) => [w.id, w])
    ).values()
  );

  const routineTypeLabel = (type?: WorkoutRoutine['routineType'], rounds?: number) => {
    if (type === 'push_pull') return 'Push / Pull';
    if (type === 'single_exercise') return 'Single Exercise';
    if (type === 'circuit') return `Circuit · ${rounds || 3} Rounds`;
    return 'Custom Routine';
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-28">
      {/* Sub-page Header (Home tab renders its own dedicated TrainerHomeInsights header) */}
      {activeTab !== 'home' && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6 mb-8 transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs font-bold text-cyan-600 dark:text-cyan-400">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Trainer Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {activeTab === 'clients' && 'Assigned Clients & Dossiers'}
              {activeTab === 'workouts' && 'Workouts & Video Library'}
              {activeTab === 'dietPlans' && 'Active Meal & Macro Plans'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {activeTab === 'clients' && 'Inspect client telemetry, adjust macro goals, or assign a custom training routine.'}
              {activeTab === 'workouts' && 'Assign Push/Pull, Single Exercise, Circuit Training, or Custom routines backed by YouTube tutorials.'}
              {activeTab === 'dietPlans' && 'Review and prescribe individualized daily calorie and macronutrient targets.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenAssignWorkout(undefined)}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Assign Workout
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedClient) setDietUserId(selectedClient.uid);
                setShowDietModal(true);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-all shadow-sm"
            >
              <Utensils className="w-4 h-4" /> Assign Meal Plan
            </button>
          </div>
        </div>
      )}

      {notification && (
        <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {notification}
        </div>
      )}

      {/* Tab 0: Trainer Home Insights */}
      {activeTab === 'home' && (
        <TrainerHomeInsights
          clients={assignedClients}
          dietPlans={dietPlans}
          latestWorkoutLogs={latestWorkoutLogsMap}
          clientTodayNutritions={clientTodayNutritionsMap}
          onSelectClient={(client) => {
            setSelectedClient(client);
            setActiveTab('clients');
            navigate('/trainer/clients');
          }}
          onEditMacroGoals={(client) => {
            setSelectedClient(client);
            setActiveTab('clients');
            navigate('/trainer/clients');
          }}
          onAssignWorkout={(client) => handleOpenAssignWorkout(client)}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            navigate(`/trainer/${tab === 'dietPlans' ? 'diets' : tab}`);
          }}
        />
      )}

      {/* Tab 1: Clients & Progress Inspection */}
      {activeTab === 'clients' && (
        <div className="space-y-8">
          {/* Comprehensive Client Overview & Quick Actions */}
          <ClientOverview
            clients={assignedClients}
            dietPlans={dietPlans}
            latestWorkoutLogs={latestWorkoutLogsMap}
            onSaveDietPlan={handleSaveDietPlan}
            onSelectClient={(c) => setSelectedClient(c)}
            onAssignWorkout={(c) => handleOpenAssignWorkout(c)}
            selectedClientId={selectedClient?.uid}
          />

          {/* Detailed Dossier for Selected Client */}
          {selectedClient && (
            <div className="border-t border-slate-200 dark:border-slate-800/80 pt-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    Deep Telemetry Inspection
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {selectedClient.displayName}&apos;s Historical Dossier
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Review full workout completion logs, exercise weights, and dietary entries
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAssignWorkout(selectedClient)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5"
                  >
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span>Assign Workout</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDietUserId(selectedClient.uid);
                      setShowDietModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Prescribe Meal Plan</span>
                  </button>
                </div>
              </div>

              {/* Summary metric stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
                <div className="rounded-xl bg-white dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Current Weight</span>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100">{selectedClient.currentWeight || '--'} kg</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Height</span>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100">{selectedClient.height || '--'} cm</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Workouts Finished</span>
                  <p className="text-lg font-black text-cyan-600 dark:text-cyan-400">{clientLogs.workoutLogs.length}</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Food Logs Recorded</span>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{clientLogs.foodLogs.length}</p>
                </div>
              </div>

              {/* Workout completion history & Food diary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Workout Logs History */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Workout Completion History ({clientLogs.workoutLogs.length})
                  </h4>
                  {clientLogs.workoutLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No completed workouts logged yet.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {clientLogs.workoutLogs.map((log) => (
                        <div
                          key={log.id}
                          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-3.5 text-xs"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{log.workoutTitle}</span>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(log.completedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {log.details?.map((detail, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 text-[11px] text-slate-700 dark:text-slate-300"
                              >
                                {detail.exerciseName}: {detail.setsCompleted}s × {detail.repsCompleted}r @ {detail.weightUsed}kg
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Food Diary Inspection */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Client Food Diary & Meals ({clientLogs.foodLogs.length})
                  </h4>
                  {clientLogs.foodLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No dietary logs submitted yet.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {clientLogs.foodLogs.map((log) => {
                        const totalCal = log.items.reduce((acc, i) => acc + (i.calories || 0), 0);
                        const totalProt = Math.round(log.items.reduce((acc, i) => acc + (i.protein || 0), 0) * 10) / 10;
                        return (
                          <div
                            key={log.id}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-3.5 text-xs"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-slate-200">Date: {log.date}</span>
                                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold">
                                  via {log.loggedVia}
                                </span>
                              </div>
                              <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                {totalCal} kcal • {totalProt}g protein
                              </span>
                            </div>
                            <div className="space-y-1">
                              {log.items.map((it, idx) => (
                                <p key={idx} className="text-slate-600 dark:text-slate-400 text-[11px]">
                                  • {it.name} ({it.servingSize}) &mdash; {it.calories} kcal, P: {it.protein}g, C: {it.carbs}g, F: {it.fats}g
                                </p>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Workout Library */}
      {activeTab === 'workouts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: `All Routines (${workouts.length})` },
                  { id: 'push_pull', label: 'Push / Pull' },
                  { id: 'single_exercise', label: 'Single Exercise' },
                  { id: 'circuit', label: 'Circuit Training' },
                  { id: 'custom', label: 'Custom' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setWorkoutFormatFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    workoutFormatFilter === tab.id
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleOpenAssignWorkout(undefined)}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Create & Assign Routine
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                        <span className="text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                          {routineTypeLabel(workout.routineType, workout.circuitRounds)}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {workout.muscleGroup}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                        {workout.title}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteWorkout(workout.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                      title="Delete routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Assigned to {workout.assignedTo?.length || 0} client(s)
                  </p>

                  {/* First exercise embedded YouTube preview */}
                  {workout.exercises[0]?.youtubeUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                      <YouTubeEmbed
                        url={workout.exercises[0].youtubeUrl}
                        title={workout.exercises[0].name}
                      />
                    </div>
                  )}

                  {/* Exercises list */}
                  <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-800/80 pt-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {workout.exercises.length} Exercises Included:
                    </span>
                    {workout.exercises.map((ex, idx) => (
                      <div
                        key={ex.id || idx}
                        className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-200/70 dark:border-slate-800/40"
                      >
                        <span className="font-semibold">{ex.name}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] tabular-nums">
                          {ex.sets} sets × {ex.reps} reps
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Diet Plans */}
      {activeTab === 'dietPlans' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Prescribed Nutrition & Macro Plans
            </h3>
            <button
              type="button"
              onClick={() => setShowDietModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 transition-all"
            >
              <Plus className="w-4 h-4" /> Create Macro Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dietPlans.map((plan) => {
              const client = assignedClients.find((c) => c.uid === plan.userId);
              return (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xl transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3 mb-3">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {client?.displayName || `User UID: ${plan.userId.slice(0, 8)}...`}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{client?.email || 'Assigned Client'}</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold border border-emerald-500/20">
                      Active Target
                    </span>
                  </div>

                  <div className="mb-4 rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Target Calories</span>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">{plan.targetCalories} kcal</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3 tabular-nums">
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800">
                      <span className="block text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase">Protein</span>
                      <strong className="text-slate-900 dark:text-slate-100">{plan.targetMacros?.protein}g</strong>
                    </div>
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800">
                      <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Carbs</span>
                      <strong className="text-slate-900 dark:text-slate-100">{plan.targetMacros?.carbs}g</strong>
                    </div>
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800">
                      <span className="block text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase">Fats</span>
                      <strong className="text-slate-900 dark:text-slate-100">{plan.targetMacros?.fats}g</strong>
                    </div>
                  </div>

                  {plan.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/60">
                      &ldquo;{plan.notes}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Assign Workout Routine (Push/Pull, Single Exercise, Circuit, Custom) */}
      <AssignWorkoutModal
        isOpen={showWorkoutModal}
        onClose={() => {
          setShowWorkoutModal(false);
          setAssignWorkoutClientId(undefined);
        }}
        clients={assignedClients}
        initialClientId={assignWorkoutClientId}
        onSaveWorkout={handleSaveAssignedWorkout}
        trainerId={currentUser?.uid || 'demo-trainer-uid'}
        trainerName={userProfile?.displayName || 'Coach Sarah Jenkins'}
      />

      {/* Modal: New Diet Plan */}
      {showDietModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Prescribe Nutrition Plan
              </h3>
              <button
                type="button"
                onClick={() => setShowDietModal(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveDietPlanModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Client</label>
                <select
                  required
                  value={dietUserId}
                  onChange={(e) => setDietUserId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Choose client...</option>
                  {assignedClients.map((c) => (
                    <option key={c.uid} value={c.uid}>
                      {c.displayName || c.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Daily Caloric Target (kcal)
                </label>
                <input
                  type="number"
                  required
                  value={dietCalories}
                  onChange={(e) => setDietCalories(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={dietProtein}
                    onChange={(e) => setDietProtein(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 text-center text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={dietCarbs}
                    onChange={(e) => setDietCarbs(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 text-center text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-rose-600 dark:text-rose-400 mb-1">Fats (g)</label>
                  <input
                    type="number"
                    value={dietFats}
                    onChange={(e) => setDietFats(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 text-center text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Coaching & Hydration Guidelines
                </label>
                <textarea
                  rows={2}
                  value={dietNotes}
                  onChange={(e) => setDietNotes(e.target.value)}
                  placeholder="e.g. Drink 3L water, eat 50g carbs pre-workout..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-slate-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDietModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20"
                >
                  Assign Macro Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
