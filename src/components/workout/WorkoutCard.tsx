import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  MoreVertical,
  Play,
  Check,
  Timer,
  ChevronRight,
  Flame,
  Award,
  Sparkles,
  Info,
  RotateCcw,
  Volume2,
  Dumbbell,
  ChevronDown,
  Layers,
  Calendar,
  X,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExerciseItem, ExerciseLogDetail, UserProfile, WorkoutRoutine } from '../../types';
import { YouTubeModal } from './YouTubeEmbed';
import { ActiveWorkoutRunner } from './ActiveWorkoutRunner';

interface WorkoutCardProps {
  workout: WorkoutRoutine;
  allWorkouts?: WorkoutRoutine[];
  assignedTrainer?: UserProfile | null;
  onSelectWorkout?: (workoutId: string) => void;
  onLogCompletedWorkout?: (details: ExerciseLogDetail[], workoutTitle: string, durationMinutes?: number) => Promise<void>;
  readOnly?: boolean;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  allWorkouts = [],
  assignedTrainer,
  onSelectWorkout,
  onLogCompletedWorkout,
  readOnly = false,
}) => {
  // Active selected day in weekly strip (0 = Sun, 1 = Mon, ..., 6 = Sat)
  // Default to Wednesday (index 3) to mirror the user's reference screenshot or current day
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(3);
  const [isRunnerOpen, setIsRunnerOpen] = useState(false);
  const [activeVideoModal, setActiveVideoModal] = useState<{ url: string; title: string } | null>(null);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showWorkoutPickerModal, setShowWorkoutPickerModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active workout resolution (allows choosing any routine e.g. Tuesday's back on Wednesday)
  const [currentWorkoutId, setCurrentWorkoutId] = useState<string>(workout.id);

  // Sync if prop changes
  useEffect(() => {
    if (workout?.id) {
      setCurrentWorkoutId(workout.id);
    }
  }, [workout?.id]);

  const activeWorkout = useMemo(() => {
    if (allWorkouts && allWorkouts.length > 0) {
      const match = allWorkouts.find((w) => w.id === currentWorkoutId);
      if (match) return match;
    }
    return workout;
  }, [allWorkouts, currentWorkoutId, workout]);

  // Exercise completion state tracking
  const [completedExerciseIds, setCompletedExerciseIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    activeWorkout.exercises.forEach((ex) => {
      initial[ex.id] = false;
    });
    return initial;
  });

  // Reset/sync completion state whenever activeWorkout changes
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    activeWorkout.exercises.forEach((ex) => {
      initial[ex.id] = false;
    });
    setCompletedExerciseIds(initial);
  }, [activeWorkout.id]);

  // Calculate 7 days for the weekly strip
  const weekDays = useMemo(() => {
    // Reference days: S(8), M(9), T(10), W(11), T(12), F(13), S(14)
    const baseDate = new Date();
    // Anchor to a weekly calendar centered on current or standard week
    const currentDay = baseDate.getDay();
    const sundayDate = new Date(baseDate);
    sundayDate.setDate(baseDate.getDate() - currentDay);

    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return labels.map((label, i) => {
      const d = new Date(sundayDate);
      d.setDate(sundayDate.getDate() + i);
      return {
        label,
        dateNum: d.getDate(),
        fullDate: d,
        index: i,
      };
    });
  }, []);

  // Compute dynamic header title based on selected day
  const headerTitle = useMemo(() => {
    const todayIndex = new Date().getDay();
    if (selectedDayIndex === todayIndex) {
      return "Today's Workout";
    }
    if (selectedDayIndex === (todayIndex + 6) % 7) {
      return "Yesterday's Workout";
    }
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${dayNames[selectedDayIndex]}'s Workout`;
  }, [selectedDayIndex]);

  // Group exercises into Warmup, Workout, and Cooldown
  const groupedExercises = useMemo(() => {
    const warmup: ExerciseItem[] = [];
    const mainWorkout: ExerciseItem[] = [];
    const cooldown: ExerciseItem[] = [];

    activeWorkout.exercises.forEach((ex, idx) => {
      const cat = ex.category || (idx < 3 ? 'Warmup' : 'Workout');
      if (cat === 'Warmup') warmup.push(ex);
      else if (cat === 'Cooldown') cooldown.push(ex);
      else mainWorkout.push(ex);
    });

    return {
      warmup,
      mainWorkout,
      cooldown,
    };
  }, [activeWorkout.exercises]);

  const toggleExerciseCheck = (exerciseId: string) => {
    if (readOnly) return;
    setCompletedExerciseIds((prev) => {
      const nextState = !prev[exerciseId];
      if (nextState) {
        // subtle confetti for satisfying feedback
        confetti({
          particleCount: 25,
          spread: 40,
          origin: { y: 0.8 },
          colors: ['#10b981', '#3b82f6'],
        });
      }
      return { ...prev, [exerciseId]: nextState };
    });
  };

  const completedCount = Object.values(completedExerciseIds).filter(Boolean).length;
  const totalCount = activeWorkout.exercises.length || 1;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${activeWorkout.title} - PulseFit`,
          text: `Check out today's workout plan: ${activeWorkout.title}!`,
          url: window.location.href,
        });
        return;
      } catch {
        // fallback
      }
    }
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2500);
  };

  const handleResetWorkout = () => {
    const reset: Record<string, boolean> = {};
    activeWorkout.exercises.forEach((ex) => {
      reset[ex.id] = false;
    });
    setCompletedExerciseIds(reset);
    setShowOptionsMenu(false);
  };

  const handleFinishAll = async () => {
    if (!onLogCompletedWorkout || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const details: ExerciseLogDetail[] = activeWorkout.exercises.map((ex) => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        setsCompleted: ex.sets,
        repsCompleted: ex.reps,
        weightUsed: 20,
        completed: completedExerciseIds[ex.id] ?? true,
      }));
      await onLogCompletedWorkout(details, activeWorkout.title, 25);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#38bdf8', '#fbbf24'],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper renderer for exercise item row matching screenshot exactly
  const renderExerciseRow = (exercise: ExerciseItem) => {
    const isCompleted = !!completedExerciseIds[exercise.id];

    return (
      <div
        key={exercise.id}
        className="flex items-center justify-between py-2.5 transition-colors group"
      >
        {/* Left: Avatar + Title/Reps */}
        <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-3">
          {/* Avatar (Photo or Colored Letter Circle) */}
          <div className="relative shrink-0">
            {exercise.avatarType === 'image' && exercise.imageUrl ? (
              <img
                src={exercise.imageUrl}
                alt={exercise.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200/80 dark:border-slate-800 shadow-sm"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm"
                style={{
                  backgroundColor:
                    exercise.avatarBg ||
                    (exercise.avatarLetter === 'A'
                      ? '#e86689'
                      : exercise.avatarLetter === 'B'
                      ? '#a78b7b'
                      : '#7084c7'),
                }}
              >
                {exercise.avatarLetter || exercise.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Title & Subtitle */}
          <div className="min-w-0">
            <h4
              className={`text-[15px] font-semibold leading-snug transition-colors ${
                isCompleted
                  ? 'text-slate-400 dark:text-slate-500 line-through'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {exercise.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {exercise.reps} reps • {exercise.sets} {exercise.sets === 1 ? 'set' : 'sets'}
            </p>
          </div>
        </div>

        {/* Right: Play Button & Plus -> Tick Completion Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Circular Blue Play Button for YouTube popup */}
          {exercise.youtubeUrl && (
            <button
              type="button"
              onClick={() =>
                setActiveVideoModal({
                  url: exercise.youtubeUrl!,
                  title: exercise.name,
                })
              }
              className="w-8 h-8 rounded-full bg-[#1a66ff] hover:bg-blue-600 active:scale-90 flex items-center justify-center text-white shadow-sm transition-transform cursor-pointer"
              title={`Watch ${exercise.name} demo video`}
            >
              <Play className="w-3.5 h-3.5 fill-white text-white translate-x-0.5" />
            </button>
          )}

          {/* Plus (+) when incomplete -> Checkmark tick when completed */}
          {!readOnly && (
            <button
              type="button"
              onClick={() => toggleExerciseCheck(exercise.id)}
              className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 ${
                isCompleted
                  ? 'bg-emerald-500 text-white dark:text-slate-950 shadow-sm shadow-emerald-500/25'
                  : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
              title={isCompleted ? 'Completed (click to undo)' : 'Mark exercise complete'}
              aria-label={isCompleted ? `Mark ${exercise.name} incomplete` : `Mark ${exercise.name} complete`}
            >
              {isCompleted ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : (
                <Plus className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative mx-auto max-w-md w-full rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden font-sans pb-6 transition-all">
      {/* 1. Top App Bar */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-900">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedDayIndex((prev) => (prev > 0 ? prev - 1 : 6))}
            className="p-1 rounded-full text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            title="Previous Day"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
          </button>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {headerTitle}
          </h2>
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            title="Share workout"
          >
            <Share2 className="w-5 h-5 stroke-[2.2]" />
          </button>

          <button
            type="button"
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className="p-1.5 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            title="More options"
          >
            <MoreVertical className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Options Dropdown Menu */}
          {showOptionsMenu && (
            <div className="absolute right-0 top-10 z-20 w-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 text-xs animate-in fade-in zoom-in-95">
              <button
                type="button"
                onClick={handleResetWorkout}
                className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Reset Checks
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOptionsMenu(false);
                  setIsRunnerOpen(true);
                }}
                className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <Timer className="w-3.5 h-3.5 text-emerald-500" /> Launch Timer Mode
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOptionsMenu(false);
                  setShowCoachModal(true);
                }}
                className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <Info className="w-3.5 h-3.5 text-amber-500" /> Coach Advice
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Share Toast Notification */}
      {showShareToast && (
        <div className="mx-4 mt-2 p-2 rounded-xl bg-slate-900 text-white text-xs font-medium text-center shadow-md animate-in fade-in">
          Link copied to clipboard!
        </div>
      )}

      {/* 2. 7-Day Horizontal Calendar Strip */}
      <div className="px-3 pt-3 pb-2 border-b border-slate-100 dark:border-slate-900">
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDays.map((day) => {
            const isSelected = day.index === selectedDayIndex;
            return (
              <button
                key={day.index}
                type="button"
                onClick={() => setSelectedDayIndex(day.index)}
                className="flex flex-col items-center justify-center py-1 transition-all group"
              >
                {/* Day letter circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm scale-105'
                      : 'text-slate-500 dark:text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-900'
                  }`}
                >
                  {day.label}
                </div>

                {/* Date Number */}
                <span
                  className={`text-xs mt-1 font-semibold ${
                    isSelected
                      ? 'text-slate-900 dark:text-slate-100 font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {day.dateNum}
                </span>

                {/* Coral/Red underline indicator under active date */}
                <div
                  className={`h-0.5 w-6 rounded-full mt-1 transition-all ${
                    isSelected ? 'bg-[#f05a5a]' : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Workout Routine Selector & Switcher Bar (Replaces banner with clean, flexible routine choice) */}
      <div className="px-4 pt-3.5 pb-2">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 p-3.5 shadow-sm transition-colors">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Dumbbell className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                    {activeWorkout.title}
                  </h3>
                  <span className="shrink-0 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {activeWorkout.muscleGroup}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeWorkout.exercises.length} exercises · {activeWorkout.routineType === 'circuit' ? `Circuit (${activeWorkout.circuitRounds || 3} rounds)` : activeWorkout.routineType === 'single_exercise' ? 'Single Exercise Focus' : activeWorkout.routineType === 'push_pull' ? 'Push / Pull Split' : headerTitle}
                </p>
              </div>
            </div>

            {/* Choose / Switch Workout Routine Button */}
            {allWorkouts.length > 1 && (
              <button
                type="button"
                onClick={() => setShowWorkoutPickerModal(true)}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-black shadow-sm transition-all cursor-pointer"
                title="Choose which workout routine you want to do today"
              >
                <span>Choose Workout</span>
                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Quick Routine Catch-up Switcher Chips */}
          {allWorkouts.length > 1 && (
            <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
                Routines:
              </span>
              {allWorkouts.map((w) => {
                const isSelected = w.id === activeWorkout.id;
                // E.g. "Chest", "Back", "Legs", "Shoulders", "Core"
                const shortLabel = w.muscleGroup.split('&')[0].trim();
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setCurrentWorkoutId(w.id);
                      if (onSelectWorkout) onSelectWorkout(w.id);
                    }}
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                        : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Categorized Workout Sections */}
      <div className="px-4 pt-2 space-y-5">
        {/* Warmup Section */}
        {groupedExercises.warmup.length > 0 && (
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 mb-1">
              Warmup
            </h3>
            <div className="divide-y divide-slate-100/60 dark:divide-slate-900/60">
              {groupedExercises.warmup.map(renderExerciseRow)}
            </div>
          </div>
        )}

        {/* Workout Section */}
        {groupedExercises.mainWorkout.length > 0 && (
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 mb-1">
              Workout
            </h3>
            <div className="divide-y divide-slate-100/60 dark:divide-slate-900/60">
              {groupedExercises.mainWorkout.map(renderExerciseRow)}
            </div>
          </div>
        )}

        {/* Cooldown Section (if present) */}
        {groupedExercises.cooldown.length > 0 && (
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 mb-1">
              Cooldown
            </h3>
            <div className="divide-y divide-slate-100/60 dark:divide-slate-900/60">
              {groupedExercises.cooldown.map(renderExerciseRow)}
            </div>
          </div>
        )}
      </div>

      {/* 5. Mobile Guided Workout Launch Bar (Sticky at Bottom) */}
      {!readOnly && (
        <div className="mt-6 px-4 pt-3 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-emerald-500">
              {completedCount}/{totalCount} Completed
            </span>{' '}
            ({progressPercent}%)
          </div>

          <div className="flex items-center gap-2">
            {completedCount > 0 && onLogCompletedWorkout && (
              <button
                type="button"
                onClick={handleFinishAll}
                disabled={isSubmitting}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Log Done'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsRunnerOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Timer className="w-4 h-4" /> Start Guided Workout
            </button>
          </div>
        </div>
      )}

      {/* YouTube Video Modal Popup (On-demand, no heavy background iframes) */}
      {activeVideoModal && (
        <YouTubeModal
          isOpen={!!activeVideoModal}
          url={activeVideoModal.url}
          title={activeVideoModal.title}
          onClose={() => setActiveVideoModal(null)}
        />
      )}

      {/* Active Workout Timer Runner Modal */}
      {isRunnerOpen && (
        <ActiveWorkoutRunner
          workout={activeWorkout}
          isOpen={isRunnerOpen}
          onClose={() => setIsRunnerOpen(false)}
          onFinishWorkout={async (details, workoutTitle, durationMinutes) => {
            if (onLogCompletedWorkout) {
              await onLogCompletedWorkout(details, workoutTitle, durationMinutes);
            }
          }}
        />
      )}

      {/* Routine Chooser Modal: Client can choose which workout they are doing for the day */}
      {showWorkoutPickerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowWorkoutPickerModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl transition-all max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Dumbbell className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Choose Workout for Today
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pick any routine from your training plan
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowWorkoutPickerModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanation box matching user's scenario */}
            <div className="mt-3.5 p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-900 dark:text-cyan-200 leading-snug">
              <p className="font-bold flex items-center gap-1.5 text-cyan-800 dark:text-cyan-300 mb-0.5">
                <Info className="w-3.5 h-3.5" /> Flexible Scheduling
              </p>
              Missed yesterday&apos;s workout or want to swap days? Select any routine below to perform and log it as your session today.
            </div>

            {/* Workouts List */}
            <div className="mt-4 space-y-2.5">
              {allWorkouts.map((routine, idx) => {
                const isCurrent = routine.id === activeWorkout.id;
                const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const dayTag = weekdayNames[idx % weekdayNames.length];

                return (
                  <div
                    key={routine.id}
                    onClick={() => {
                      setCurrentWorkoutId(routine.id);
                      if (onSelectWorkout) onSelectWorkout(routine.id);
                      setShowWorkoutPickerModal(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {dayTag}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          {routine.muscleGroup}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {routine.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {routine.exercises.length} exercises ({routine.exercises.slice(0, 2).map((e) => e.name).join(', ')}...)
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isCurrent ? (
                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowWorkoutPickerModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coach Info Modal */}
      {showCoachModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowCoachModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl text-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 font-black mx-auto flex items-center justify-center text-xl shadow-md">
              {(assignedTrainer?.displayName || activeWorkout.trainerName || 'Coach')[0]?.toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                Assigned Coach
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                {assignedTrainer?.displayName || activeWorkout.trainerName || 'Coach Sarah Jenkins'}
              </h3>
              {assignedTrainer?.specialty && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {assignedTrainer.specialty}
                </p>
              )}
              {assignedTrainer?.certifications && assignedTrainer.certifications.length > 0 && (
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {assignedTrainer.certifications.join(' · ')}
                </p>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              &ldquo;{assignedTrainer?.bio || 'Focus on proper mobility during warmup sets, keep your core braced, and control every eccentric rep!'}&rdquo;
            </p>
            {assignedTrainer?.email && (
              <p className="text-[11px] text-slate-400">Contact: {assignedTrainer.email}</p>
            )}
            <button
              type="button"
              onClick={() => setShowCoachModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold hover:opacity-90"
            >
              Got it, Coach!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
