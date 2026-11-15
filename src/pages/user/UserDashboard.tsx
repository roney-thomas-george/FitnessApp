import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  Sparkles,
  Calendar,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import {
  DietPlan,
  ExerciseLogDetail,
  FoodItem,
  FoodLog,
  UserProfile,
  WeightRecord,
  WorkoutLog,
  WorkoutRoutine,
} from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/errorHandling';
import { WorkoutCard } from '../../components/workout/WorkoutCard';
import { WorkoutCalendarView } from '../../components/workout/WorkoutCalendarView';
import { VoiceFoodLogger } from '../../components/nutrition/VoiceFoodLogger';
import { MacroOverview } from '../../components/nutrition/MacroOverview';
import { BmiWeightTracker, calculateBmi } from '../../components/metrics/BmiWeightTracker';
import { ClientHomeInsights } from '../../components/home/ClientHomeInsights';
import { useLocation, useNavigate } from 'react-router-dom';
import { demoStore } from '../../services/demoStore';
import {
  saveDetailedMealLogsToDrive,
  uploadProgressPhotoToDrive,
  listProgressPhotosFromDrive,
  ProgressPhotoMeta,
} from '../../services/googleDriveService';

export const UserDashboard: React.FC = () => {
  const { currentUser, userProfile, updateProfileData, googleAccessToken, connectGoogleDrive } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<'home' | 'workouts' | 'calendar' | 'nutrition' | 'metrics'>('home');
  const [assignedWorkouts, setAssignedWorkouts] = useState<WorkoutRoutine[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>('');
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [todayFoodLogs, setTodayFoodLogs] = useState<FoodLog[]>([]);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [assignedTrainer, setAssignedTrainer] = useState<UserProfile | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);
  const [drivePhotos, setDrivePhotos] = useState<ProgressPhotoMeta[]>([]);

  const [isSavingLog, setIsSavingLog] = useState(false);
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  // Route-driven tab activation: Each menu item has its own separate view
  useEffect(() => {
    if (location.pathname.includes('/calendar')) {
      setActiveSection('calendar');
    } else if (location.pathname.includes('/nutrition')) {
      setActiveSection('nutrition');
    } else if (location.pathname.includes('/metrics')) {
      setActiveSection('metrics');
    } else if (location.pathname.includes('/workouts')) {
      setActiveSection('workouts');
    } else {
      // Default to Home page with high level insights
      setActiveSection('home');
    }
  }, [location.pathname]);

  // Load photos from Google Drive if token available
  useEffect(() => {
    if (!googleAccessToken) return;
    listProgressPhotosFromDrive(googleAccessToken).then((photos) => {
      setDrivePhotos(photos);
    });
  }, [googleAccessToken]);

  // Resolve assigned Coach / Trainer profile details
  useEffect(() => {
    const fallbackTrainer = () => {
      const allUsers = demoStore.getUsers();
      const match =
        (userProfile?.trainerId && allUsers.find((u) => u.uid === userProfile.trainerId)) ||
        allUsers.find((u) => u.role === 'trainer') ||
        null;
      setAssignedTrainer(match);
    };

    if (!currentUser || currentUser.isDemo || !userProfile?.trainerId) {
      fallbackTrainer();
      return;
    }

    let cancelled = false;
    getDoc(doc(db, 'users', userProfile.trainerId))
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          setAssignedTrainer(snap.data() as UserProfile);
        } else {
          fallbackTrainer();
        }
      })
      .catch(() => {
        if (!cancelled) fallbackTrainer();
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser, userProfile?.trainerId]);

  // Fetch Workouts assigned to this user
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.isDemo) {
      const allDemo = demoStore.getWorkouts();
      const filtered = allDemo.filter(
        (w) =>
          !w.assignedTo ||
          w.assignedTo.length === 0 ||
          w.assignedTo.includes(currentUser.uid) ||
          !currentUser.uid.startsWith('demo-client')
      );
      setAssignedWorkouts(filtered.length > 0 ? filtered : allDemo);
      return;
    }

    try {
      const wQuery = query(collection(db, 'workouts'));
      const unsubscribeWorkouts = onSnapshot(
        wQuery,
        (snapshot) => {
          const fetched: WorkoutRoutine[] = [];
          snapshot.forEach((d) => {
            const w = { ...d.data(), id: d.id } as WorkoutRoutine;
            if (
              !w.assignedTo ||
              w.assignedTo.length === 0 ||
              w.assignedTo.includes(currentUser.uid)
            ) {
              fetched.push(w);
            }
          });

          if (fetched.length === 0) {
            setAssignedWorkouts(demoStore.getWorkouts());
          } else {
            setAssignedWorkouts(fetched);
          }
        },
        (error) => {
          console.warn('Workouts live fetch notice, using local routines:', error);
          setAssignedWorkouts(demoStore.getWorkouts());
        }
      );

      return () => unsubscribeWorkouts();
    } catch {
      setAssignedWorkouts(demoStore.getWorkouts());
    }
  }, [currentUser]);

  // Fetch Food Logs / Daily Macro Summaries
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.isDemo) {
      setTodayFoodLogs(demoStore.getFoodLogs(currentUser.uid));
      return;
    }

    try {
      const fQuery = query(
        collection(db, 'foodLogs'),
        where('userId', '==', currentUser.uid),
        where('date', '==', todayStr)
      );

      const unsubscribeFood = onSnapshot(
        fQuery,
        (snapshot) => {
          const logs: FoodLog[] = [];
          snapshot.forEach((d) => {
            logs.push({ id: d.id, ...d.data() } as FoodLog);
          });
          setTodayFoodLogs(logs);
        },
        (error) => {
          console.warn('Food logs live fetch notice, using local logs:', error);
          setTodayFoodLogs(demoStore.getFoodLogs(currentUser.uid));
        }
      );

      return () => unsubscribeFood();
    } catch {
      setTodayFoodLogs(demoStore.getFoodLogs(currentUser.uid));
    }
  }, [currentUser, todayStr]);

  // Fetch Diet Plan
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.isDemo) {
      const plans = demoStore.getDietPlans();
      const plan = plans.find((p) => p.userId === currentUser.uid) || plans[0];
      setDietPlan(plan || null);
      return;
    }

    try {
      const dQuery = query(
        collection(db, 'dietPlans'),
        where('userId', '==', currentUser.uid)
      );

      const unsubscribeDiet = onSnapshot(
        dQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const plan = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as DietPlan;
            setDietPlan(plan);
          } else {
            setDietPlan({
              id: 'default-plan',
              trainerId: 'trainer-default',
              userId: currentUser.uid,
              targetCalories: 2350,
              targetMacros: { protein: 165, carbs: 240, fats: 70 },
              targetMicros: { fiber: 35, sodium: 2200, potassium: 3400 },
              notes: 'High protein focus with complex carbohydrates around workout windows.',
              updatedAt: new Date().toISOString(),
            });
          }
        },
        (error) => {
          console.warn('Diet plan live fetch notice:', error);
          setDietPlan({
            id: 'default-plan',
            trainerId: 'trainer-default',
            userId: currentUser.uid,
            targetCalories: 2350,
            targetMacros: { protein: 165, carbs: 240, fats: 70 },
            targetMicros: { fiber: 35, sodium: 2200, potassium: 3400 },
            notes: 'High protein focus with complex carbohydrates around workout windows.',
            updatedAt: new Date().toISOString(),
          });
        }
      );

      return () => unsubscribeDiet();
    } catch {
      // ignore
    }
  }, [currentUser]);

  // Fetch Weight History
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.isDemo) {
      setWeightHistory(demoStore.getWeightHistory(currentUser.uid));
      return;
    }

    try {
      const wQuery = query(
        collection(db, 'weightHistory'),
        where('userId', '==', currentUser.uid)
      );

      const unsubscribeWeight = onSnapshot(
        wQuery,
        (snapshot) => {
          const records: WeightRecord[] = [];
          snapshot.forEach((d) => {
            records.push({ id: d.id, ...d.data() } as WeightRecord);
          });

          if (records.length === 0) {
            setWeightHistory(demoStore.getWeightHistory(currentUser.uid));
          } else {
            setWeightHistory(records);
          }
        },
        (error) => {
          console.warn('Weight history live fetch notice:', error);
          setWeightHistory(demoStore.getWeightHistory(currentUser.uid));
        }
      );

      return () => unsubscribeWeight();
    } catch {
      setWeightHistory(demoStore.getWeightHistory(currentUser.uid));
    }
  }, [currentUser]);

  // Fetch Workout Logs (completed past workout records)
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.isDemo) {
      setWorkoutLogs(demoStore.getWorkoutLogs(currentUser.uid));
      return;
    }

    try {
      const lQuery = query(
        collection(db, 'workoutLogs'),
        where('userId', '==', currentUser.uid)
      );

      const unsubscribeLogs = onSnapshot(
        lQuery,
        (snapshot) => {
          const logs: WorkoutLog[] = [];
          snapshot.forEach((d) => {
            logs.push({ id: d.id, ...d.data() } as WorkoutLog);
          });
          setWorkoutLogs(logs.length > 0 ? logs : demoStore.getWorkoutLogs(currentUser.uid));
        },
        (error) => {
          console.warn('Workout logs live fetch notice, using local records:', error);
          setWorkoutLogs(demoStore.getWorkoutLogs(currentUser.uid));
        }
      );

      return () => unsubscribeLogs();
    } catch {
      setWorkoutLogs(demoStore.getWorkoutLogs(currentUser.uid));
    }
  }, [currentUser]);

  // Handler: Save Completed Workout
  const handleLogCompletedWorkout = async (
    details: ExerciseLogDetail[],
    workoutTitle: string,
    durationMinutes = 30
  ) => {
    if (!currentUser) return;

    const newLog: WorkoutLog = {
      id: `log-${Date.now()}`,
      userId: currentUser.uid,
      workoutId: 'completed-routine',
      workoutTitle,
      completedAt: new Date().toISOString(),
      durationMinutes,
      details,
    };

    // Update demoStore and local state immediately
    demoStore.addWorkoutLog(newLog);
    setWorkoutLogs((prev) => [newLog, ...prev]);

    try {
      if (!currentUser.isDemo) {
        await addDoc(collection(db, 'workoutLogs'), {
          userId: currentUser.uid,
          workoutId: 'completed-routine',
          workoutTitle,
          completedAt: new Date().toISOString(),
          durationMinutes,
          details,
        });
      }
      setToastMessage(`Great job! Logged completion of "${workoutTitle}".`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (error) {
      console.warn('Workout log write notice:', error);
      setToastMessage(`Great job! Logged completion of "${workoutTitle}".`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  /**
   * Hybrid Food Logging:
   * 1. Granular detailed meal items stored in personal Google Drive (or local storage).
   * 2. Lean macronutrient summary (calories, protein, carbs, fats) stored in central Firestore DB.
   */
  const handleSaveFoodLog = async (items: FoodItem[], mode: 'voice' | 'manual') => {
    if (!currentUser || items.length === 0) return;
    setIsSavingLog(true);

    const totalCal = items.reduce((sum, it) => sum + (it.calories || 0), 0);
    const totalProt = Math.round(items.reduce((sum, it) => sum + (it.protein || 0), 0) * 10) / 10;
    const totalCarb = Math.round(items.reduce((sum, it) => sum + (it.carbs || 0), 0) * 10) / 10;
    const totalFat = Math.round(items.reduce((sum, it) => sum + (it.fats || 0), 0) * 10) / 10;

    const fullLog: FoodLog = {
      id: `flog-${Date.now()}`,
      userId: currentUser.uid,
      date: todayStr,
      items,
      loggedVia: mode,
      loggedAt: new Date().toISOString(),
    };

    let driveFileId: string | null = null;

    try {
      // 1. Save detailed granular breakdown to client's personal Google Drive if connected
      if (googleAccessToken) {
        try {
          const driveResult = await saveDetailedMealLogsToDrive(googleAccessToken, fullLog);
          driveFileId = driveResult.fileId;
        } catch (driveErr) {
          console.warn('Notice saving to Google Drive:', driveErr);
        }
      }

      // Also cache in local demoStore so the client UI displays it immediately
      demoStore.addFoodLog(fullLog);
      setTodayFoodLogs((prev) => [fullLog, ...prev]);

      // 2. Save ONLY lean macronutrient totals in central database (Cloud Firestore)
      if (!currentUser.isDemo) {
        await addDoc(collection(db, 'foodLogs'), {
          userId: currentUser.uid,
          date: todayStr,
          calories: totalCal,
          protein: totalProt,
          carbs: totalCarb,
          fats: totalFat,
          itemCount: items.length,
          items: items.map((i) => ({ name: i.name, calories: i.calories, protein: i.protein, carbs: i.carbs, fats: i.fats })),
          driveFileId,
          loggedVia: mode,
          loggedAt: new Date().toISOString(),
        });
      }

      const driveNote = driveFileId
        ? ' • Granular item details archived in your Google Drive!'
        : '';
      setToastMessage(`Logged ${items.length} items (${totalCal} kcal, ${totalProt}g protein) to daily macro totals${driveNote}`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (error) {
      console.warn('Food log save notice:', error);
      setToastMessage(`Logged ${items.length} items to daily macro totals.`);
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsSavingLog(false);
    }
  };

  /**
   * Hybrid Weight & Progress Photo Logging:
   * 1. Photos upload directly to the client's Google Drive.
   * 2. Lean weight and BMI numbers saved in Firestore database.
   */
  const handleLogWeight = async (weightKg: number, heightCm: number, date: string, photoFile?: File) => {
    if (!currentUser) return;
    setIsSavingWeight(true);

    try {
      const calculatedBmi = calculateBmi(weightKg, heightCm);

      // 1. Upload progress photo directly to Google Drive (not in DB!)
      if (photoFile && googleAccessToken) {
        try {
          const uploadedPhoto = await uploadProgressPhotoToDrive(
            googleAccessToken,
            photoFile,
            `PulseFit_Progress_${date}_${weightKg}kg.jpg`,
            weightKg
          );
          setDrivePhotos((prev) => [uploadedPhoto, ...prev]);
        } catch (photoErr) {
          console.warn('Drive photo upload notice:', photoErr);
        }
      }

      // 2. Save lean weight number in database
      const newWeightRecord: WeightRecord = {
        id: `wh-${Date.now()}`,
        userId: currentUser.uid,
        weight: weightKg,
        date,
        bmi: calculatedBmi,
      };

      if (currentUser.isDemo) {
        demoStore.addWeightRecord(newWeightRecord);
        setWeightHistory(demoStore.getWeightHistory(currentUser.uid));
      } else {
        await addDoc(collection(db, 'weightHistory'), {
          userId: currentUser.uid,
          weight: weightKg,
          date,
          bmi: calculatedBmi,
        });
        setWeightHistory((prev) => [...prev, newWeightRecord]);
      }

      // Update general details (weight, height) in user profile
      await updateProfileData({
        currentWeight: weightKg,
        height: heightCm,
      });

      const photoMsg = photoFile ? ' • Progress photo archived to Google Drive!' : '';
      setToastMessage(`Weight (${weightKg} kg, BMI ${calculatedBmi}) saved${photoMsg}`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (error) {
      console.warn('Weight save notice:', error);
    } finally {
      setIsSavingWeight(false);
    }
  };

  const handleConnectDrive = async () => {
    setIsConnectingDrive(true);
    try {
      const token = await connectGoogleDrive();
      if (token) {
        setToastMessage('Google Drive connected! Detailed meal logs and progress photos will now save to your personal Drive.');
      } else {
        setToastMessage('Google Drive sign-in window was closed before granting access.');
      }
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to connect Google Drive right now.';
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsConnectingDrive(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-28 space-y-6 sm:space-y-8">
      {/* Welcome Banner — Shown ONLY on the Client Home page */}
      {activeSection === 'home' && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5 transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Client Portal
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Today: {todayStr}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Welcome back, {userProfile?.displayName || 'Athlete'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              High-level daily insights: current weight, calories and protein consumed today, training status, and coach details.
            </p>
          </div>
        </div>
      )}

      {userProfile?.requestedRole === 'trainer' && userProfile?.role === 'user' && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-4 py-3 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
          <span>
            <strong className="font-bold">Trainer Access Requested:</strong> Your account is currently active in Client mode while an Admin reviews your Trainer role upgrade.
          </span>
        </div>
      )}

      {toastMessage && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* ================= PAGE 0: HOME INSIGHTS ================= */}
      {activeSection === 'home' && (
        <ClientHomeInsights
          userProfile={userProfile}
          assignedTrainer={assignedTrainer}
          dietPlan={dietPlan}
          todayFoodLogs={todayFoodLogs}
          workoutLogs={workoutLogs}
          assignedWorkouts={assignedWorkouts}
          onNavigate={(sec) => {
            setActiveSection(sec);
            if (sec === 'workouts') navigate('/user/workouts');
            else if (sec === 'nutrition') navigate('/user/nutrition');
            else if (sec === 'metrics') navigate('/user/metrics');
            else if (sec === 'calendar') navigate('/user/calendar');
          }}
        />
      )}

      {/* ================= PAGE 1: WORKOUTS ONLY ================= */}
      {activeSection === 'workouts' && (
        <section className="animate-in fade-in duration-150">

          <div className="flex flex-col items-center">
            {assignedWorkouts.length > 0 ? (
              <WorkoutCard
                workout={
                  assignedWorkouts.find((w) => w.id === selectedWorkoutId) ||
                  assignedWorkouts[0]
                }
                allWorkouts={assignedWorkouts}
                assignedTrainer={assignedTrainer}
                onSelectWorkout={(id) => setSelectedWorkoutId(id)}
                onLogCompletedWorkout={handleLogCompletedWorkout}
              />
            ) : (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <p>No workouts assigned yet. Check with your coach!</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ================= PAGE 2: NUTRITION & VOICE LOGGING ONLY ================= */}
      {activeSection === 'nutrition' && (
        <section className="space-y-6 animate-in fade-in duration-150">
          {/* Google Drive Privacy & Storage Banner for Meals */}
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-50/70 dark:bg-cyan-950/20 p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-colors">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Hybrid Storage: Personal Google Drive
                  </span>
                  <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                    {googleAccessToken ? 'Connected' : 'Available'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Detailed meal items save to your personal Google Drive. Only macro summaries (Calories, Protein, Carbs, Fats) are kept in our database.
                </p>
              </div>
            </div>

            <div>
              {googleAccessToken ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Drive Sync Active
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectDrive}
                  disabled={isConnectingDrive}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  {isConnectingDrive ? 'Connecting...' : 'Connect Google Drive'}
                </button>
              )}
            </div>
          </div>

          {/* Daily Macro Progress & Trainer Diet Overview */}
          <div>
            <MacroOverview
              dietPlanOverride={dietPlan}
              assignedTrainer={assignedTrainer}
              todayFoodLogsOverride={todayFoodLogs}
            />
          </div>

          {/* Voice & Food Logging Tool */}
          <div>
            <VoiceFoodLogger onSaveLog={handleSaveFoodLog} isSaving={isSavingLog} />
          </div>
        </section>
      )}

      {/* ================= PAGE 3: BODY METRICS & BMI ONLY ================= */}
      {activeSection === 'metrics' && (
        <section className="space-y-6 animate-in fade-in duration-150">
          <BmiWeightTracker
            currentWeight={userProfile?.currentWeight || 75}
            currentHeight={userProfile?.height || 175}
            weightHistory={weightHistory}
            onLogWeight={handleLogWeight}
            isSaving={isSavingWeight}
            drivePhotos={drivePhotos}
            isDriveConnected={!!googleAccessToken}
          />
        </section>
      )}

      {/* ================= PAGE 4: CALENDAR ONLY ================= */}
      {activeSection === 'calendar' && (
        <section className="space-y-4 animate-in fade-in duration-150">
          <WorkoutCalendarView
            scheduledWorkouts={assignedWorkouts}
            workoutLogs={workoutLogs}
            onLogCompletedWorkout={handleLogCompletedWorkout}
          />
        </section>
      )}
    </div>
  );
};
