export type UserRole = 'admin' | 'trainer' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  requestedRole?: UserRole; // Access level requested by user during registration/onboarding
  onboardingCompleted?: boolean;
  fitnessGoal?: string;
  isActive: boolean;
  trainerId?: string; // If role === 'user', assigned trainer's uid
  height?: number; // In cm
  currentWeight?: number; // In kg
  targetWeight?: number; // In kg
  specialty?: string;
  bio?: string;
  experienceYears?: number;
  certifications?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ExerciseItem {
  id: string;
  name: string;
  targetMuscle: string;
  sets: number;
  reps: number;
  youtubeUrl?: string;
  notes?: string;
  category?: 'Warmup' | 'Workout' | 'Cooldown';
  avatarType?: 'letter' | 'image';
  avatarLetter?: string;
  avatarBg?: string;
  imageUrl?: string;
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  muscleGroup: string;
  trainerId: string;
  trainerName?: string;
  assignedTo: string[]; // List of user UIDs
  exercises: ExerciseItem[];
  routineType?: 'push_pull' | 'single_exercise' | 'circuit' | 'custom';
  circuitRounds?: number;
  scheduledDate?: string;
  createdAt: string;
}

export interface ExerciseLogDetail {
  exerciseId?: string;
  exerciseName: string;
  setsCompleted: number;
  repsCompleted: number;
  weightUsed: number; // in kg
  completed: boolean;
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  workoutId: string;
  workoutTitle: string;
  completedAt: string;
  durationMinutes?: number;
  details: ExerciseLogDetail[];
}

export interface MacroTarget {
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
}

export interface MicroTarget {
  fiber?: number; // grams
  sodium?: number; // mg
  potassium?: number; // mg
}

export interface DietPlan {
  id: string;
  trainerId: string;
  userId: string;
  targetCalories: number;
  targetMacros: MacroTarget;
  targetMicros?: MicroTarget;
  notes: string;
  updatedAt: string;
}

export interface FoodItem {
  name: string;
  servingSize?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sodium?: number;
  potassium?: number;
}

export interface FoodLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  items: FoodItem[];
  loggedVia: 'manual' | 'voice';
  loggedAt: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  itemCount?: number;
  driveFileId?: string | null;
}

export interface WeightRecord {
  id: string;
  userId: string;
  weight: number; // kg
  date: string; // ISO string or YYYY-MM-DD
  bmi: number;
  notes?: string;
}
