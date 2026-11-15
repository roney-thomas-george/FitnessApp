import {
  DietPlan,
  ExerciseLogDetail,
  FoodItem,
  FoodLog,
  UserProfile,
  WeightRecord,
  WorkoutLog,
  WorkoutRoutine,
} from '../types';
import { ALL_INITIAL_WORKOUTS } from './workoutLibrary';

const STORAGE_KEY_PREFIX = 'pulsefit_demo_v5_';

export const INITIAL_DEMO_USERS: UserProfile[] = [
  {
    uid: 'demo-admin-uid',
    email: 'admin-demo@pulsefit.local',
    displayName: 'Demo Admin (Master Control)',
    role: 'admin',
    requestedRole: 'admin',
    onboardingCompleted: true,
    isActive: true,
    height: 182,
    currentWeight: 82,
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    uid: 'demo-trainer-uid',
    email: 'sarah.trainer@pulsefit.local',
    displayName: 'Coach Sarah Jenkins',
    role: 'trainer',
    requestedRole: 'trainer',
    onboardingCompleted: true,
    isActive: true,
    height: 172,
    currentWeight: 64,
    specialty: 'Strength, Hypertrophy & Sports Nutrition',
    experienceYears: 8,
    certifications: ['CSCS (NSCA)', 'Precision Nutrition L2', 'USAW Level 1'],
    bio: 'Former collegiate strength coach specializing in science-based hypertrophy, barbell biomechanics, and sustainable high-protein macro coaching.',
    createdAt: '2026-10-02T10:00:00.000Z',
  },
  {
    uid: 'demo-trainer-2-uid',
    email: 'marcus.trainer@pulsefit.local',
    displayName: 'Coach Marcus Vance',
    role: 'trainer',
    requestedRole: 'trainer',
    onboardingCompleted: true,
    isActive: true,
    height: 188,
    currentWeight: 92,
    specialty: 'Athletic Conditioning, HIIT & Mobility',
    experienceYears: 6,
    certifications: ['NASM-CPT', 'CrossFit L2', 'FMS Certified'],
    bio: 'Conditioning specialist focused on metabolic circuits, functional mobility, and athletic fat-loss programming.',
    createdAt: '2026-10-05T10:00:00.000Z',
  },
  {
    uid: 'demo-client-uid',
    email: 'alex.rivera@pulsefit.local',
    displayName: 'Alex Rivera (Athlete)',
    role: 'user',
    requestedRole: 'user',
    onboardingCompleted: true,
    fitnessGoal: 'Lean Recomposition',
    isActive: true,
    trainerId: 'demo-trainer-uid',
    height: 178,
    currentWeight: 75.4,
    targetWeight: 72.0,
    createdAt: '2026-10-10T10:00:00.000Z',
  },
  {
    uid: 'demo-client-2-uid',
    email: 'emma.watson@pulsefit.local',
    displayName: 'Emma Watson',
    role: 'user',
    requestedRole: 'trainer',
    onboardingCompleted: true,
    fitnessGoal: 'Coaching & Strength Specialty',
    isActive: true,
    trainerId: 'demo-trainer-uid',
    height: 165,
    currentWeight: 58.0,
    targetWeight: 56.0,
    specialty: 'Pilates & Functional Mobility',
    createdAt: '2026-10-12T10:00:00.000Z',
  },
  {
    uid: 'demo-client-3-uid',
    email: 'liam.chen@pulsefit.local',
    displayName: 'Liam Chen',
    role: 'user',
    requestedRole: 'user',
    onboardingCompleted: true,
    isActive: false, // Inactive example for admin demonstration
    trainerId: undefined,
    height: 175,
    currentWeight: 81.2,
    createdAt: '2026-10-15T10:00:00.000Z',
  },
];

export const INITIAL_DEMO_WORKOUTS: WorkoutRoutine[] = ALL_INITIAL_WORKOUTS;

export const INITIAL_DEMO_WORKOUT_LOGS: WorkoutLog[] = [
  {
    id: 'log-1',
    userId: 'demo-client-uid',
    workoutId: 'workout-push-1',
    workoutTitle: 'Shoulder & Upper Body Conditioning',
    completedAt: '2026-11-11T10:45:00.000Z',
    durationMinutes: 28,
    details: [
      { exerciseName: 'Shoulder rolls', setsCompleted: 1, repsCompleted: 15, weightUsed: 0, completed: true },
      { exerciseName: 'Arm circles (Level 1)', setsCompleted: 1, repsCompleted: 15, weightUsed: 0, completed: true },
      { exerciseName: 'Alternate toe touches - In Reps', setsCompleted: 1, repsCompleted: 12, weightUsed: 0, completed: true },
      { exerciseName: 'Barbell military press - In Reps', setsCompleted: 4, repsCompleted: 12, weightUsed: 40, completed: true },
      { exerciseName: 'Barbell Upright row', setsCompleted: 3, repsCompleted: 12, weightUsed: 35, completed: true },
      { exerciseName: 'Dumbbell lateral raise', setsCompleted: 4, repsCompleted: 12, weightUsed: 10, completed: true },
    ],
  },
  {
    id: 'log-2',
    userId: 'demo-client-uid',
    workoutId: 'workout-push-chest',
    workoutTitle: 'Hypertrophy Push & Upper Chest Power',
    completedAt: '2026-11-09T09:30:00.000Z',
    durationMinutes: 38,
    details: [
      { exerciseName: 'Barbell Flat Bench Press', setsCompleted: 4, repsCompleted: 10, weightUsed: 75, completed: true },
      { exerciseName: 'Incline Dumbbell Bench Press', setsCompleted: 3, repsCompleted: 12, weightUsed: 26, completed: true },
      { exerciseName: 'Dumbbell Lateral Raises', setsCompleted: 4, repsCompleted: 15, weightUsed: 12, completed: true },
      { exerciseName: 'Tricep Rope Pushdowns', setsCompleted: 3, repsCompleted: 12, weightUsed: 25, completed: true },
    ],
  },
  {
    id: 'log-3',
    userId: 'demo-client-uid',
    workoutId: 'workout-pull-sat',
    workoutTitle: 'Back Thickness & Bicep Sculpt',
    completedAt: '2026-11-07T11:15:00.000Z',
    durationMinutes: 42,
    details: [
      { exerciseName: 'Barbell Bent Over Row', setsCompleted: 4, repsCompleted: 10, weightUsed: 60, completed: true },
      { exerciseName: 'Lat Pulldown', setsCompleted: 3, repsCompleted: 12, weightUsed: 55, completed: true },
      { exerciseName: 'Incline Dumbbell Bicep Curl', setsCompleted: 3, repsCompleted: 12, weightUsed: 14, completed: true },
    ],
  },
  {
    id: 'log-4',
    userId: 'demo-client-uid',
    workoutId: 'workout-legs-mon',
    workoutTitle: 'Leg Hypertrophy & Posterior Chain',
    completedAt: '2026-11-04T16:20:00.000Z',
    durationMinutes: 45,
    details: [
      { exerciseName: 'Barbell Back Squat', setsCompleted: 4, repsCompleted: 8, weightUsed: 95, completed: true },
      { exerciseName: 'Romanian Deadlift', setsCompleted: 3, repsCompleted: 10, weightUsed: 80, completed: true },
      { exerciseName: 'Walking Lunges', setsCompleted: 3, repsCompleted: 12, weightUsed: 18, completed: true },
    ],
  },
  {
    id: 'log-5',
    userId: 'demo-client-uid',
    workoutId: 'workout-full-body',
    workoutTitle: 'Full Body Functional Conditioning',
    completedAt: '2026-11-01T08:00:00.000Z',
    durationMinutes: 35,
    details: [
      { exerciseName: 'Kettlebell Swings', setsCompleted: 4, repsCompleted: 20, weightUsed: 24, completed: true },
      { exerciseName: 'Push-ups', setsCompleted: 4, repsCompleted: 15, weightUsed: 0, completed: true },
      { exerciseName: 'Pull-ups', setsCompleted: 3, repsCompleted: 8, weightUsed: 0, completed: true },
    ],
  },
];

export const INITIAL_DEMO_DIET_PLANS: DietPlan[] = [
  {
    id: 'plan_demo-client-uid',
    trainerId: 'demo-trainer-uid',
    userId: 'demo-client-uid',
    targetCalories: 2450,
    targetMacros: { protein: 175, carbs: 250, fats: 72 },
    targetMicros: { fiber: 35, sodium: 2300, potassium: 3500 },
    notes: 'Prioritize 40g protein post-workout. Maintain 3.5L hydration daily.',
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_DEMO_FOOD_LOGS: FoodLog[] = [
  {
    id: 'flog-1',
    userId: 'demo-client-uid',
    date: new Date().toISOString().split('T')[0],
    loggedVia: 'voice',
    loggedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    items: [
      {
        name: '2x Whole Egg',
        servingSize: '2 large (100g)',
        calories: 148,
        protein: 12.6,
        carbs: 0.8,
        fats: 10.0,
        sodium: 142,
        potassium: 138,
      },
      {
        name: 'Oatmeal',
        servingSize: '1 bowl (40g dry)',
        calories: 153,
        protein: 5.3,
        carbs: 27.4,
        fats: 2.6,
        fiber: 4.0,
        potassium: 147,
      },
      {
        name: 'Banana',
        servingSize: '1 medium (118g)',
        calories: 105,
        protein: 1.3,
        carbs: 27.0,
        fats: 0.3,
        fiber: 3.1,
        potassium: 422,
      },
    ],
  },
];

export const INITIAL_DEMO_WEIGHT_HISTORY: WeightRecord[] = [
  { id: 'wh-1', userId: 'demo-client-uid', weight: 77.8, date: '2026-10-18', bmi: 24.6 },
  { id: 'wh-2', userId: 'demo-client-uid', weight: 77.1, date: '2026-10-25', bmi: 24.3 },
  { id: 'wh-3', userId: 'demo-client-uid', weight: 76.4, date: '2026-11-02', bmi: 24.1 },
  { id: 'wh-4', userId: 'demo-client-uid', weight: 75.8, date: '2026-11-08', bmi: 23.9 },
  { id: 'wh-5', userId: 'demo-client-uid', weight: 75.4, date: new Date().toISOString().split('T')[0], bmi: 23.8 },
];

function loadLocal<T>(key: string, defaultData: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) return defaultData;
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
}

function saveLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function dedupeById<T extends { id: string }>(items: T[], storageKey?: string): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];
  let changed = false;

  for (const item of items) {
    if (!item || !item.id || seen.has(item.id)) {
      changed = true;
      continue;
    }
    seen.add(item.id);
    deduped.push(item);
  }

  if (changed && storageKey) {
    saveLocal(storageKey, deduped);
  }
  return deduped;
}

// In-memory / localStorage demo repository
export const demoStore = {
  getUsers(): UserProfile[] {
    return loadLocal<UserProfile[]>('users', INITIAL_DEMO_USERS);
  },
  saveUser(updatedUser: UserProfile) {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.uid === updatedUser.uid);
    if (idx >= 0) users[idx] = updatedUser;
    else users.push(updatedUser);
    saveLocal('users', users);
  },
  getWorkouts(): WorkoutRoutine[] {
    return dedupeById(
      loadLocal<WorkoutRoutine[]>('workouts', INITIAL_DEMO_WORKOUTS),
      'workouts'
    );
  },
  addWorkout(workout: Omit<WorkoutRoutine, 'id'>): WorkoutRoutine {
    const workouts = this.getWorkouts();
    const newW: WorkoutRoutine = { ...workout, id: uniqueId('demo-w') };
    const next = [newW, ...workouts.filter((w) => w.id !== newW.id)];
    saveLocal('workouts', next);
    return newW;
  },
  deleteWorkout(id: string) {
    const workouts = this.getWorkouts().filter((w) => w.id !== id);
    saveLocal('workouts', workouts);
  },
  getDietPlans(): DietPlan[] {
    return dedupeById(
      loadLocal<DietPlan[]>('dietPlans', INITIAL_DEMO_DIET_PLANS),
      'dietPlans'
    );
  },
  saveDietPlan(plan: DietPlan) {
    const plans = this.getDietPlans();
    const idx = plans.findIndex((p) => p.userId === plan.userId);
    if (idx >= 0) plans[idx] = plan;
    else plans.push(plan);
    saveLocal('dietPlans', plans);
  },
  getFoodLogs(userId: string): FoodLog[] {
    const all = dedupeById(
      loadLocal<FoodLog[]>('foodLogs', INITIAL_DEMO_FOOD_LOGS),
      'foodLogs'
    );
    return all.filter((l) => l.userId === userId || userId === 'demo-client-uid');
  },
  addFoodLog(log: Omit<FoodLog, 'id'>): FoodLog {
    const all = dedupeById(
      loadLocal<FoodLog[]>('foodLogs', INITIAL_DEMO_FOOD_LOGS),
      'foodLogs'
    );
    const newLog: FoodLog = { ...log, id: uniqueId('flog') };
    const next = [newLog, ...all.filter((l) => l.id !== newLog.id)];
    saveLocal('foodLogs', next);
    return newLog;
  },
  getWeightHistory(userId: string): WeightRecord[] {
    const all = dedupeById(
      loadLocal<WeightRecord[]>('weightHistory', INITIAL_DEMO_WEIGHT_HISTORY),
      'weightHistory'
    );
    return all.filter((w) => w.userId === userId || userId === 'demo-client-uid');
  },
  addWeightRecord(rec: Omit<WeightRecord, 'id'>): WeightRecord {
    const all = dedupeById(
      loadLocal<WeightRecord[]>('weightHistory', INITIAL_DEMO_WEIGHT_HISTORY),
      'weightHistory'
    );
    const newRec: WeightRecord = { ...rec, id: uniqueId('wh') };
    all.push(newRec);
    saveLocal('weightHistory', all);
    return newRec;
  },
  getWorkoutLogs(userId: string): WorkoutLog[] {
    const all = dedupeById(
      loadLocal<WorkoutLog[]>('workoutLogs', INITIAL_DEMO_WORKOUT_LOGS),
      'workoutLogs'
    );
    return all.filter((l) => l.userId === userId || userId === 'demo-client-uid');
  },
  addWorkoutLog(log: Omit<WorkoutLog, 'id'>): WorkoutLog {
    const all = dedupeById(
      loadLocal<WorkoutLog[]>('workoutLogs', INITIAL_DEMO_WORKOUT_LOGS),
      'workoutLogs'
    );
    const newLog: WorkoutLog = { ...log, id: uniqueId('log') };
    const next = [newLog, ...all.filter((l) => l.id !== newLog.id)];
    saveLocal('workoutLogs', next);
    return newLog;
  },
};
