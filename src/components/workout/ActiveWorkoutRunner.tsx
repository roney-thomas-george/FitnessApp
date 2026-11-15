import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Clock,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Timer,
  Coffee,
  Plus,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExerciseItem, ExerciseLogDetail, WorkoutRoutine } from '../../types';
import { YouTubePlayButton } from './YouTubeEmbed';

interface ActiveWorkoutRunnerProps {
  workout: WorkoutRoutine;
  isOpen: boolean;
  onClose: () => void;
  onFinishWorkout: (details: ExerciseLogDetail[], workoutTitle: string, durationMinutes: number) => Promise<void>;
}

export const ActiveWorkoutRunner: React.FC<ActiveWorkoutRunnerProps> = ({
  workout,
  isOpen,
  onClose,
  onFinishWorkout,
}) => {
  if (!isOpen) return null;

  // Session state
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSetIdx, setCurrentSetIdx] = useState(1);
  const [isSessionPaused, setIsSessionPaused] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Set Inputs
  const currentExercise: ExerciseItem = workout.exercises[currentExerciseIdx] || workout.exercises[0];
  const [currentWeight, setCurrentWeight] = useState<number>(20);
  const [currentReps, setCurrentReps] = useState<number>(currentExercise?.reps || 10);

  // Rest timer countdown state
  const [isResting, setIsResting] = useState(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(60);
  const [initialRestDuration, setInitialRestDuration] = useState(60);
  const [isRestPaused, setIsRestPaused] = useState(false);

  // Completed logs collector
  const [completedDetails, setCompletedDetails] = useState<ExerciseLogDetail[]>(() =>
    workout.exercises.map((ex) => ({
      exerciseId: ex.id,
      exerciseName: ex.name,
      setsCompleted: 0,
      repsCompleted: ex.reps,
      weightUsed: 20,
      completed: false,
    }))
  );

  const [isCompletedSession, setIsCompletedSession] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Master Session Elapsed Timer
  useEffect(() => {
    if (isCompletedSession || isSessionPaused) return;
    const interval = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompletedSession, isSessionPaused]);

  // Rest Countdown Timer
  useEffect(() => {
    if (!isResting || isRestPaused) return;

    if (restSecondsRemaining <= 0) {
      setIsResting(false);
      return;
    }

    const interval = setInterval(() => {
      setRestSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsResting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isResting, isRestPaused, restSecondsRemaining]);

  // Update default reps when exercise changes
  useEffect(() => {
    if (currentExercise) {
      setCurrentReps(currentExercise.reps || 10);
    }
  }, [currentExerciseIdx, currentExercise]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // User completes current set
  const handleCompleteSet = () => {
    // Record current set
    setCompletedDetails((prev) =>
      prev.map((det, idx) => {
        if (idx === currentExerciseIdx) {
          return {
            ...det,
            setsCompleted: det.setsCompleted + 1,
            repsCompleted: currentReps,
            weightUsed: currentWeight,
            completed: currentSetIdx >= currentExercise.sets,
          };
        }
        return det;
      })
    );

    // Check if more sets remain for this exercise
    if (currentSetIdx < currentExercise.sets) {
      setCurrentSetIdx((prev) => prev + 1);
      // Start rest break countdown
      setInitialRestDuration(60);
      setRestSecondsRemaining(60);
      setIsResting(true);
      setIsRestPaused(false);
    } else {
      // Exercise finished! Move to next exercise or finish routine
      if (currentExerciseIdx < workout.exercises.length - 1) {
        setCurrentExerciseIdx((prev) => prev + 1);
        setCurrentSetIdx(1);
        // Start rest between exercises
        setInitialRestDuration(90);
        setRestSecondsRemaining(90);
        setIsResting(true);
        setIsRestPaused(false);
      } else {
        // Routine completed!
        setIsCompletedSession(true);
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#38bdf8', '#fbbf24'],
        });
      }
    }
  };

  // Add more break time (+30 seconds)
  const handleExtendBreak = (secondsToAdd: number) => {
    setRestSecondsRemaining((prev) => prev + secondsToAdd);
    setInitialRestDuration((prev) => prev + secondsToAdd);
  };

  // Skip break and start set immediately
  const handleSkipBreak = () => {
    setIsResting(false);
    setRestSecondsRemaining(0);
  };

  // Finalize and submit workout
  const handleSaveAndExit = async () => {
    setIsSubmitting(true);
    try {
      const durationMins = Math.max(1, Math.round(sessionSeconds / 60));
      await onFinishWorkout(completedDetails, workout.title, durationMins);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalExercises = workout.exercises.length;
  const progressPercent = Math.round(
    ((currentExerciseIdx + (currentSetIdx - 1) / (currentExercise?.sets || 1)) / totalExercises) * 100
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto animate-in fade-in duration-200 transition-colors">
      {/* Mobile-style Top Sticky App Bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            title="Exit workout"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{workout.title}</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>Exercise {currentExerciseIdx + 1} of {totalExercises}</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{workout.muscleGroup}</span>
            </p>
          </div>
        </div>

        {/* Master Workout Timer & Pause Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{formatTime(sessionSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsSessionPaused(!isSessionPaused)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
              isSessionPaused
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
            title={isSessionPaused ? 'Resume workout' : 'Pause workout'}
          >
            {isSessionPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
          </button>
        </div>
      </header>

      {/* Progress Strip */}
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-900">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        />
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 sm:p-6 flex flex-col justify-between">
        {/* If Paused Banner */}
        {isSessionPaused && !isCompletedSession && (
          <div className="mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 p-4 text-center">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Workout Paused</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Take your time. Click Resume when you are ready to continue.</p>
            <button
              type="button"
              onClick={() => setIsSessionPaused(false)}
              className="mt-3 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all"
            >
              Resume Workout
            </button>
          </div>
        )}

        {/* WORKOUT FINISHED CELEBRATION VIEW */}
        {isCompletedSession ? (
          <div className="rounded-3xl border border-emerald-500/30 bg-white dark:bg-slate-900/90 p-6 text-center space-y-6 my-auto shadow-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/15">
              <Award className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Workout Crushed!</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{workout.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">All {totalExercises} exercises and sets completed!</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500">Total Duration</span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{formatTime(sessionSeconds)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500">Exercises</span>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100 tabular-nums">{totalExercises} / {totalExercises}</p>
              </div>
            </div>

            <div className="space-y-2 text-left max-h-48 overflow-y-auto rounded-2xl bg-slate-50 dark:bg-slate-950/60 p-3 border border-slate-200 dark:border-slate-800/80 text-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Completed Sets:</span>
              {completedDetails.map((det, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-200/70 dark:border-slate-800/40 last:border-0">
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{det.exerciseName}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">{det.setsCompleted} sets @ {det.weightUsed}kg</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveAndExit}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 py-3.5 text-sm font-black text-slate-950 shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              {isSubmitting ? 'Saving to Logs...' : 'Finish & Save to Logbook'}
            </button>
          </div>
        ) : isResting ? (
          /* REST BREAK / COUNTDOWN TIMER VIEW */
          <div className="rounded-3xl border border-cyan-500/30 bg-white dark:bg-slate-900/90 p-6 text-center space-y-6 my-auto shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                <Coffee className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Rest & Recovery Break</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRestPaused(!isRestPaused)}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                {isRestPaused ? 'Resume Timer' : 'Pause Timer'}
              </button>
            </div>

            {/* Big Countdown Display */}
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Next: Set {currentSetIdx} of {currentExercise.name}</p>
              <div className="my-4 flex items-center justify-center">
                <div className="flex h-36 w-36 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-950 border-4 border-cyan-500/35 shadow-xl shadow-cyan-500/10 relative">
                  <span className="text-4xl font-black font-mono text-cyan-600 dark:text-cyan-300 tabular-nums">
                    {restSecondsRemaining}s
                  </span>
                </div>
              </div>
            </div>

            {/* Long Break Extenders */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">Need a longer break?</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExtendBreak(30)}
                  className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 hover:border-cyan-500 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> +30s Break
                </button>
                <button
                  type="button"
                  onClick={() => handleExtendBreak(60)}
                  className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 hover:border-cyan-500 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> +60s Break
                </button>
              </div>
            </div>

            {/* Skip Button */}
            <button
              type="button"
              onClick={handleSkipBreak}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 py-3.5 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Skip Break & Start Set {currentSetIdx}
            </button>
          </div>
        ) : (
          /* ACTIVE EXERCISE VIEW */
          <div className="space-y-6 my-auto">
            {/* Exercise Card */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xl">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {currentExercise.targetMuscle || 'Target Muscle'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                    {currentExercise.name}
                  </h3>
                </div>

                {/* YOUTUBE PLAY BUTTON (Only opens popup on click) */}
                {currentExercise.youtubeUrl && (
                  <YouTubePlayButton
                    url={currentExercise.youtubeUrl}
                    title={currentExercise.name}
                    label="Form Video"
                  />
                )}
              </div>

              {currentExercise.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 mb-4">
                  &ldquo;{currentExercise.notes}&rdquo;
                </p>
              )}

              {/* Set Badges */}
              <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
                {Array.from({ length: currentExercise.sets }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 py-2 text-center rounded-xl text-xs font-bold border transition-all ${
                      i + 1 < currentSetIdx
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                        : i + 1 === currentSetIdx
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    Set {i + 1}
                  </div>
                ))}
              </div>

              {/* Set Input Controls (Weight & Reps) */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {/* Weight Input with Stepper */}
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Weight (KG)</span>
                  <div className="flex items-center justify-between mt-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentWeight((w) => Math.max(0, w - 2.5))}
                      className="h-9 w-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.5"
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 0)}
                      className="w-16 bg-transparent text-center text-xl font-black text-emerald-600 dark:text-emerald-400 focus:outline-none tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => setCurrentWeight((w) => w + 2.5)}
                      className="h-9 w-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Reps Input with Stepper */}
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Reps Completed</span>
                  <div className="flex items-center justify-between mt-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentReps((r) => Math.max(1, r - 1))}
                      className="h-9 w-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={currentReps}
                      onChange={(e) => setCurrentReps(parseInt(e.target.value) || 0)}
                      className="w-16 bg-transparent text-center text-xl font-black text-slate-900 dark:text-slate-100 focus:outline-none tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => setCurrentReps((r) => r + 1)}
                      className="h-9 w-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Complete Set Action Button */}
              <button
                type="button"
                onClick={handleCompleteSet}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 py-4 text-sm font-black text-slate-950 shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                Complete Set {currentSetIdx} & Start Rest
              </button>
            </div>
          </div>
        )}

        {/* Footer controls */}
        {!isCompletedSession && (
          <div className="flex items-center justify-between pt-4 text-xs text-slate-600 dark:text-slate-400">
            <span>
              {workout.exercises[currentExerciseIdx + 1] ? (
                <>Next: <strong className="text-slate-900 dark:text-slate-200">{workout.exercises[currentExerciseIdx + 1].name}</strong></>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Final Exercise of Routine</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                if (currentExerciseIdx < workout.exercises.length - 1) {
                  setCurrentExerciseIdx((i) => i + 1);
                  setCurrentSetIdx(1);
                  setIsResting(false);
                } else {
                  setIsCompletedSession(true);
                }
              }}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold flex items-center gap-1"
            >
              Skip to Next &rarr;
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
