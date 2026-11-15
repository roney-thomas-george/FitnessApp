import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Dumbbell,
  Clock,
  Award,
  Sparkles,
  Flame,
  ArrowRight,
  Play,
  RotateCcw,
  Check,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import { ExerciseLogDetail, WorkoutLog, WorkoutRoutine } from '../../types';
import { YouTubeModal } from './YouTubeEmbed';
import { ActiveWorkoutRunner } from './ActiveWorkoutRunner';

function formatLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface WorkoutCalendarViewProps {
  scheduledWorkouts: WorkoutRoutine[];
  workoutLogs: WorkoutLog[];
  onLogCompletedWorkout?: (details: ExerciseLogDetail[], workoutTitle: string, durationMinutes?: number) => Promise<void>;
  onSelectWorkoutToRun?: (workout: WorkoutRoutine) => void;
}

export const WorkoutCalendarView: React.FC<WorkoutCalendarViewProps> = ({
  scheduledWorkouts,
  workoutLogs,
  onLogCompletedWorkout,
  onSelectWorkoutToRun,
}) => {
  // Calendar month state
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatLocalDateStr(today), [today]);

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Video and active runner state
  const [activeVideoModal, setActiveVideoModal] = useState<{ url: string; title: string } | null>(null);
  const [runningWorkout, setRunningWorkout] = useState<WorkoutRoutine | null>(null);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateStr(formatLocalDateStr(now));
  };

  // Build calendar matrix for currentMonthDate
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const str = formatLocalDateStr(prevDate);
      days.push({
        dateStr: str,
        dayNum: d,
        isCurrentMonth: false,
        isToday: str === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const current = new Date(year, month, d);
      const str = formatLocalDateStr(current);
      days.push({
        dateStr: str,
        dayNum: d,
        isCurrentMonth: true,
        isToday: str === todayStr,
      });
    }

    // Next month filler days to complete a 35 or 42 grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const str = formatLocalDateStr(nextDate);
      days.push({
        dateStr: str,
        dayNum: d,
        isCurrentMonth: false,
        isToday: str === todayStr,
      });
    }

    return days;
  }, [currentMonthDate, todayStr]);

  // Index logs by date YYYY-MM-DD
  const logsByDate = useMemo(() => {
    const map: Record<string, WorkoutLog[]> = {};
    workoutLogs.forEach((log) => {
      let dateKey = '';
      if (log.completedAt) {
        try {
          dateKey = formatLocalDateStr(new Date(log.completedAt));
        } catch {
          dateKey = log.completedAt.split('T')[0];
        }
      }
      if (dateKey) {
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(log);
      }
    });
    return map;
  }, [workoutLogs]);

  // Index scheduled workouts by scheduledDate
  const scheduledByDate = useMemo(() => {
    const map: Record<string, WorkoutRoutine[]> = {};
    scheduledWorkouts.forEach((w) => {
      if (w.scheduledDate) {
        const dateKey = w.scheduledDate.split('T')[0];
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(w);
      }
    });
    return map;
  }, [scheduledWorkouts]);

  // Selected date contents
  const selectedDateLogs = logsByDate[selectedDateStr] || [];
  const selectedDateScheduled = scheduledByDate[selectedDateStr] || [];

  // Month Statistics
  const monthStats = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    let completedInMonth = 0;
    let totalMinutesInMonth = 0;
    let scheduledInMonth = 0;

    workoutLogs.forEach((log) => {
      if (!log.completedAt) return;
      const d = new Date(log.completedAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        completedInMonth++;
        totalMinutesInMonth += log.durationMinutes || 30;
      }
    });

    scheduledWorkouts.forEach((w) => {
      if (!w.scheduledDate) return;
      const d = new Date(w.scheduledDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        scheduledInMonth++;
      }
    });

    return {
      completedInMonth,
      totalMinutesInMonth,
      scheduledInMonth,
    };
  }, [currentMonthDate, workoutLogs, scheduledWorkouts]);

  // Format month title
  const monthName = currentMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Format selected date nicely
  const formattedSelectedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  const isSelectedDateToday = selectedDateStr === todayStr;

  return (
    <div className="space-y-6">
      {/* Month Overview Banner with Quick Stats */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-xl backdrop-blur-md transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CalendarIcon className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Workout Calendar & History
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Training Schedule & Past Summaries
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Select any date to inspect scheduled trainer routines or review past completed workout performance.
            </p>
          </div>

          {/* Month Navigator Controls */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-sm"
            >
              Today
            </button>
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1 shadow-sm">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-bold text-slate-900 dark:text-slate-100 min-w-[130px] text-center">
                {monthName}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Month Metrics Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-3">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] mb-1">
              <span>Completed</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-slate-100">
              {monthStats.completedInMonth}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">sessions</span>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-3">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] mb-1">
              <span>Time Trained</span>
              <Clock className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-slate-100">
              {monthStats.totalMinutesInMonth}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mins</span>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-3">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] mb-1">
              <span>Scheduled</span>
              <Dumbbell className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-slate-100">
              {monthStats.scheduledInMonth}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">planned</span>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-3">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] mb-1">
              <span>Consistency</span>
              <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {monthStats.completedInMonth >= 8 ? 'High Streak' : 'Building'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Calendar Grid + Selected Day Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calendar Grid (7 cols on lg) */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 sm:p-5 shadow-xl backdrop-blur-md transition-colors">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((day, idx) => {
              const isSelected = day.dateStr === selectedDateStr;
              const hasLogs = !!logsByDate[day.dateStr]?.length;
              const hasScheduled = !!scheduledByDate[day.dateStr]?.length;

              return (
                <button
                  key={`cal-cell-${day.dateStr}-${day.isCurrentMonth ? 'cur' : 'fill'}-${idx}`}
                  type="button"
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={`relative flex flex-col items-center justify-between rounded-2xl p-1.5 sm:p-2 min-h-[58px] sm:min-h-[68px] transition-all text-left border ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-500/40'
                      : day.isToday
                      ? 'border-cyan-500/60 bg-cyan-50/40 dark:bg-slate-950/70 hover:border-cyan-600'
                      : day.isCurrentMonth
                      ? 'border-slate-200 dark:border-slate-800/80 bg-slate-50/70 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700'
                      : 'border-transparent bg-transparent opacity-30 hover:opacity-75'
                  }`}
                >
                  {/* Top row: Day number and Today badge */}
                  <div className="flex items-center justify-between w-full px-1">
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        isSelected
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : day.isToday
                          ? 'text-cyan-700 dark:text-cyan-400 font-extrabold'
                          : day.isCurrentMonth
                          ? 'text-slate-900 dark:text-slate-200'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {day.dayNum}
                    </span>
                    {day.isToday && (
                      <span className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />
                    )}
                  </div>

                  {/* Indicator Badges / Dots */}
                  <div className="flex flex-wrap items-center justify-center gap-1 mt-1 w-full">
                    {hasLogs && (
                      <span
                        className="inline-flex items-center justify-center h-4 sm:h-5 px-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] sm:text-[10px] font-bold"
                        title="Completed workout"
                      >
                        <Check className="w-2.5 h-2.5 sm:mr-0.5 stroke-[3]" />
                        <span className="hidden sm:inline">Done</span>
                      </span>
                    )}
                    {hasScheduled && (
                      <span
                        className="inline-flex items-center justify-center h-4 sm:h-5 px-1.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] sm:text-[10px] font-bold"
                        title="Scheduled workout"
                      >
                        <Dumbbell className="w-2.5 h-2.5 sm:mr-0.5" />
                        <span className="hidden sm:inline">Plan</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Scheduled
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400" /> Today
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              Tap any date to view exercises & summaries
            </span>
          </div>
        </div>

        {/* Right Column: Selected Date Details & Past Summaries (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xl backdrop-blur-md transition-colors">
            {/* Header of Inspector */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800/80">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                  {isSelectedDateToday ? "Today's Agenda" : 'Selected Date'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                  {formattedSelectedDate}
                </h3>
              </div>

              {isSelectedDateToday && (
                <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                  Today
                </span>
              )}
            </div>

            <div className="mt-4 space-y-4">
              {/* 1. Scheduled Workouts for this date */}
              {selectedDateScheduled.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span>Scheduled Routine ({selectedDateScheduled.length})</span>
                  </div>

                  {selectedDateScheduled.map((routine) => (
                    <div
                      key={routine.id}
                      className="rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-blue-50/70 dark:bg-blue-950/15 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="rounded-md bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 text-[10px] font-bold">
                            {routine.muscleGroup || 'Full Body'}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                            {routine.title}
                          </h4>
                          {routine.trainerName && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              By {routine.trainerName}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectWorkoutToRun) {
                              onSelectWorkoutToRun(routine);
                            } else {
                              setRunningWorkout(routine);
                            }
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 px-3 py-1.5 text-xs font-black text-slate-950 shadow-md active:scale-95 transition-all"
                        >
                          <Play className="w-3 h-3 fill-current" /> Start
                        </button>
                      </div>

                      {/* Exercises preview */}
                      <div className="space-y-1.5 pt-2 border-t border-blue-200 dark:border-blue-500/20 text-xs">
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          {routine.exercises.length} Exercises Included:
                        </div>
                        {routine.exercises.map((ex, idx) => (
                          <div
                            key={ex.id || idx}
                            className="flex items-center justify-between text-slate-700 dark:text-slate-300 py-0.5 text-[11px]"
                          >
                            <span className="font-medium truncate pr-2">
                              • {ex.name}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 shrink-0">
                              {ex.sets} × {ex.reps}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. Completed Workout Summaries for this date */}
              {selectedDateLogs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Past Workout Summary ({selectedDateLogs.length})</span>
                  </div>

                  {selectedDateLogs.map((log) => {
                    const completedDetails = log.details || [];
                    const totalSets = completedDetails.reduce(
                      (sum, d) => sum + (d.setsCompleted || 0),
                      0
                    );
                    const totalReps = completedDetails.reduce(
                      (sum, d) => sum + (d.repsCompleted || 0) * (d.setsCompleted || 1),
                      0
                    );
                    const maxWeight = Math.max(
                      0,
                      ...completedDetails.map((d) => d.weightUsed || 0)
                    );

                    const completedTimeStr = log.completedAt
                      ? new Date(log.completedAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : 'Earlier';

                    return (
                      <div
                        key={log.id}
                        className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/15 p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Completed at {completedTimeStr}</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                              {log.workoutTitle}
                            </h4>
                          </div>

                          {log.durationMinutes && (
                            <span className="rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 shadow-sm">
                              <Clock className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                              {log.durationMinutes}m
                            </span>
                          )}
                        </div>

                        {/* Performance metrics row */}
                        <div className="grid grid-cols-3 gap-2 py-2 border-y border-emerald-200 dark:border-emerald-500/20 text-center">
                          <div className="rounded-xl bg-white/80 dark:bg-slate-950/50 p-1.5 shadow-sm">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Sets Done</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{totalSets}</span>
                          </div>
                          <div className="rounded-xl bg-white/80 dark:bg-slate-950/50 p-1.5 shadow-sm">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Total Reps</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{totalReps}</span>
                          </div>
                          <div className="rounded-xl bg-white/80 dark:bg-slate-950/50 p-1.5 shadow-sm">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Max Weight</span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {maxWeight > 0 ? `${maxWeight}kg` : 'Bodyweight'}
                            </span>
                          </div>
                        </div>

                        {/* Exercise performance details breakdown */}
                        <div className="space-y-1.5 text-xs">
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                            Logged Exercises:
                          </span>
                          <div className="space-y-1">
                            {completedDetails.map((detail, idx) => (
                              <div
                                key={detail.exerciseId || idx}
                                className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg bg-white/80 dark:bg-slate-950/40 border border-slate-100 dark:border-transparent shadow-sm"
                              >
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2 flex items-center gap-1.5">
                                  <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400 shrink-0 stroke-[3]" />
                                  {detail.exerciseName}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 shrink-0">
                                  {detail.setsCompleted} sets × {detail.repsCompleted}
                                  {detail.weightUsed > 0 && ` (${detail.weightUsed}kg)`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. Empty State if no scheduled or logged workouts on this date */}
              {selectedDateScheduled.length === 0 && selectedDateLogs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-400 mx-auto flex items-center justify-center mb-3">
                    <CalendarIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Rest & Recovery Day
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[260px] mx-auto">
                    No workouts were scheduled or logged for this date. Hydrate, stretch, and allow muscle fibers to recover.
                  </p>

                  {/* If today, offer quick launch */}
                  {isSelectedDateToday && scheduledWorkouts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const routineToRun = scheduledWorkouts[0];
                        if (onSelectWorkoutToRun) {
                          onSelectWorkoutToRun(routineToRun);
                        } else {
                          setRunningWorkout(routineToRun);
                        }
                      }}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950 shadow-md active:scale-95 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Start Today&apos;s Workout Routine
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Active Workout Runner Modal (if launched from calendar) */}
      {runningWorkout && (
        <ActiveWorkoutRunner
          workout={runningWorkout}
          isOpen={!!runningWorkout}
          onClose={() => setRunningWorkout(null)}
          onFinishWorkout={async (details, workoutTitle, durationMinutes) => {
            if (onLogCompletedWorkout) {
              await onLogCompletedWorkout(details, workoutTitle, durationMinutes);
            }
            setRunningWorkout(null);
          }}
        />
      )}

      {/* Embedded YouTube Player Modal */}
      {activeVideoModal && (
        <YouTubeModal
          isOpen={!!activeVideoModal}
          url={activeVideoModal.url}
          title={activeVideoModal.title}
          onClose={() => setActiveVideoModal(null)}
        />
      )}
    </div>
  );
};
