import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Dumbbell,
  Users,
  Calendar,
  Plus,
  Trash2,
  Play,
  Sparkles,
  Zap,
  Repeat,
  CheckCircle2,
  Layers,
  Target,
  ExternalLink,
  Library,
  Search,
} from 'lucide-react';
import { ExerciseItem, UserProfile, WorkoutRoutine } from '../../types';
import {
  WORKOUT_TEMPLATES,
  WorkoutTemplate,
  EXERCISE_CATALOG,
  CatalogExercise,
} from '../../services/workoutLibrary';
import { YouTubeEmbed } from '../workout/YouTubeEmbed';

export interface AssignWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: UserProfile[];
  initialClientId?: string;
  onSaveWorkout: (workout: WorkoutRoutine) => Promise<void>;
  trainerId: string;
  trainerName?: string;
}

export const AssignWorkoutModal: React.FC<AssignWorkoutModalProps> = ({
  isOpen,
  onClose,
  clients,
  initialClientId,
  onSaveWorkout,
  trainerId,
  trainerName = 'Coach',
}) => {
  const [routineType, setRoutineType] = useState<'push_pull' | 'single_exercise' | 'circuit' | 'custom'>('push_pull');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('template-ppl-push');
  const [title, setTitle] = useState('Push Power & Upper Chest Hypertrophy');
  const [muscleGroup, setMuscleGroup] = useState('Chest, Shoulders & Triceps');
  const [circuitRounds, setCircuitRounds] = useState<number>(3);
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(
    initialClientId ? [initialClientId] : []
  );
  const [assignToAll, setAssignToAll] = useState(false);
  const [exercises, setExercises] = useState<ExerciseItem[]>(WORKOUT_TEMPLATES[0].exercises);
  const [testingYoutubeUrl, setTestingYoutubeUrl] = useState<string | null>(null);
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [catalogMuscleFilter, setCatalogMuscleFilter] = useState<string>('All');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isSubmittingRef = useRef(false);

  // Sync initial client when modal opens or prop changes
  useEffect(() => {
    if (isOpen) {
      if (initialClientId) {
        setSelectedClientIds([initialClientId]);
        setAssignToAll(false);
      } else {
        setSelectedClientIds([]);
        setAssignToAll(false);
      }
      setTestingYoutubeUrl(null);
    }
  }, [isOpen, initialClientId]);

  if (!isOpen) return null;

  const muscleFilters = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'HIIT', 'Mobility'];
  const filteredCatalog = EXERCISE_CATALOG.filter((ex) => {
    const matchesMuscle = catalogMuscleFilter === 'All' || ex.muscleGroup === catalogMuscleFilter;
    const q = catalogSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      ex.name.toLowerCase().includes(q) ||
      ex.targetMuscle.toLowerCase().includes(q) ||
      ex.muscleGroup.toLowerCase().includes(q);
    return matchesMuscle && matchesQuery;
  });

  const handleAddFromCatalog = (catEx: CatalogExercise) => {
    setExercises((prev) => [
      ...prev,
      {
        id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: catEx.name,
        category: catEx.category,
        targetMuscle: catEx.targetMuscle,
        sets: catEx.sets,
        reps: catEx.reps,
        avatarType: 'letter',
        avatarLetter: catEx.avatarLetter,
        avatarBg: catEx.avatarBg,
        youtubeUrl: catEx.youtubeUrl,
        notes: catEx.notes,
      },
    ]);
  };

  // Filter templates by current routine type
  const availableTemplates = WORKOUT_TEMPLATES.filter((t) => t.routineType === routineType);

  const handleApplyTemplate = (tmpl: WorkoutTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setTitle(tmpl.title);
    setMuscleGroup(tmpl.muscleGroup);
    if (tmpl.circuitRounds) setCircuitRounds(tmpl.circuitRounds);
    setExercises(
      tmpl.exercises.map((e, idx) => ({
        ...e,
        id: `ex-${Date.now()}-${idx}`,
      }))
    );
  };

  const handleRoutineTypeChange = (type: 'push_pull' | 'single_exercise' | 'circuit' | 'custom') => {
    setRoutineType(type);
    if (type === 'custom') {
      setSelectedTemplateId('custom');
      setTitle('Custom Functional Training');
      setMuscleGroup('Full Body');
      setExercises([
        {
          id: `ex-${Date.now()}`,
          name: 'Barbell Bench Press',
          category: 'Workout',
          targetMuscle: 'Chest',
          sets: 4,
          reps: 10,
          avatarType: 'letter',
          avatarLetter: 'B',
          avatarBg: '#3b82f6',
          youtubeUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
          notes: 'Lower with control, touch sternum, press explosively.',
        },
      ]);
    } else {
      const match = WORKOUT_TEMPLATES.find((t) => t.routineType === type);
      if (match) {
        handleApplyTemplate(match);
      }
    }
  };

  const handleToggleClient = (clientId: string) => {
    setAssignToAll(false);
    setSelectedClientIds((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const handleToggleAssignAll = () => {
    if (!assignToAll) {
      setAssignToAll(true);
      setSelectedClientIds(clients.map((c) => c.uid));
    } else {
      setAssignToAll(false);
      setSelectedClientIds(initialClientId ? [initialClientId] : []);
    }
  };

  const handleAddExerciseRow = () => {
    setExercises((prev) => [
      ...prev,
      {
        id: `ex-${Date.now()}`,
        name: 'Dumbbell Lateral Raise',
        category: 'Workout',
        targetMuscle: 'Shoulders',
        sets: 3,
        reps: 15,
        avatarType: 'letter',
        avatarLetter: 'L',
        avatarBg: '#06b6d4',
        youtubeUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
        notes: 'Slight forward lean, raise arms in the scapular plane.',
      },
    ]);
  };

  const handleRemoveExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateExercise = (idx: number, field: keyof ExerciseItem, value: any) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || isSubmittingRef.current) return;
    if (exercises.length === 0) {
      return;
    }

    isSubmittingRef.current = true;
    const assignedTargetIds = assignToAll
      ? clients.map((c) => c.uid)
      : selectedClientIds.length > 0
      ? selectedClientIds
      : clients.map((c) => c.uid);

    const newWorkout: WorkoutRoutine = {
      id: `workout-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      muscleGroup: muscleGroup.trim(),
      routineType,
      circuitRounds: routineType === 'circuit' ? circuitRounds : undefined,
      trainerId,
      trainerName,
      assignedTo: assignedTargetIds,
      exercises,
      scheduledDate,
      createdAt: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      await onSaveWorkout(newWorkout);
      onClose();
    } finally {
      isSubmittingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Assign Workout to Client
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose Push/Pull split, Single Exercise focus, Circuit HIIT, or Custom routine with YouTube tutorials.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* STEP 1: Select Workout Format / Type */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              1. Choose Workout Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleRoutineTypeChange('push_pull')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  routineType === 'push_pull'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-black">Push / Pull / Legs</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2">
                  Compound split: Chest, Back, Legs & Arms
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleRoutineTypeChange('single_exercise')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  routineType === 'single_exercise'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-xs font-black">Single Exercise</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2">
                  Heavy Squat, Bench, or Deadlift focus
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleRoutineTypeChange('circuit')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  routineType === 'circuit'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black">Circuit Training</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2">
                  Timed rounds, MetCon & core stations
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleRoutineTypeChange('custom')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  routineType === 'custom'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black">Custom Workout</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2">
                  Build any freeform sequence from scratch
                </p>
              </button>
            </div>
          </div>

          {/* STEP 2: Pre-built Library Templates (if applicable) */}
          {availableTemplates.length > 0 && (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 p-3.5 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-2">
                Quick Template Presets ({availableTemplates.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {availableTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleApplyTemplate(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedTemplateId === t.id
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-500/50'
                    }`}
                  >
                    <span>{t.title}</span>
                    <span className="text-[10px] opacity-75">({t.exercises.length} ex)</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Assign to Client(s) & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assignee selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Assign To Client
                </label>
                <button
                  type="button"
                  onClick={handleToggleAssignAll}
                  className={`text-[11px] font-bold ${
                    assignToAll ? 'text-cyan-500 underline' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {assignToAll ? 'Assigned to ALL (Selected)' : 'Assign to All Clients'}
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                {clients.map((c) => {
                  const isChecked = assignToAll || selectedClientIds.includes(c.uid);
                  return (
                    <label
                      key={c.uid}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleClient(c.uid)}
                          className="rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                        />
                        <span>{c.displayName || c.email}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {c.currentWeight ? `${c.currentWeight} kg` : ''}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Scheduled Date & Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Scheduled Training Date
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setScheduledDate(new Date().toISOString().split('T')[0])}
                    className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-cyan-500"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tm = new Date(Date.now() + 86400000);
                      setScheduledDate(tm.toISOString().split('T')[0]);
                    }}
                    className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-cyan-500"
                  >
                    Tomorrow
                  </button>
                </div>
              </div>

              {routineType === 'circuit' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-amber-500 mb-1">
                    Circuit Total Rounds
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={circuitRounds}
                    onChange={(e) => setCircuitRounds(parseInt(e.target.value) || 3)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Muscle Group / Focus
                </label>
                <input
                  type="text"
                  required
                  value={muscleGroup}
                  onChange={(e) => setMuscleGroup(e.target.value)}
                  placeholder="e.g. Chest & Triceps, Posterior Chain, Full Body"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Routine Title */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Routine Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Heavy Barbell Squat Mastery, Pull Hypertrophy, etc."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-black focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* STEP 4: Exercise List with YouTube Video Tutorials */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Exercises & Form Videos ({exercises.length})
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCatalogPicker((v) => !v)}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1"
                >
                  <Library className="w-3.5 h-3.5" />
                  {showCatalogPicker ? 'Hide Video Catalog' : `Browse ${EXERCISE_CATALOG.length} Video Exercises`}
                </button>
                <button
                  type="button"
                  onClick={handleAddExerciseRow}
                  className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Blank Exercise
                </button>
              </div>
            </div>

            {showCatalogPicker && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Click any exercise to add with verified YouTube tutorial
                  </span>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder="Filter exercises..."
                      className="pl-8 pr-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {muscleFilters.map((mf) => (
                    <button
                      key={mf}
                      type="button"
                      onClick={() => setCatalogMuscleFilter(mf)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                        catalogMuscleFilter === mf
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {mf}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredCatalog.map((catEx) => (
                    <button
                      key={catEx.id}
                      type="button"
                      onClick={() => handleAddFromCatalog(catEx)}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-left transition-all group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          {catEx.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {catEx.muscleGroup} · {catEx.sets}×{catEx.reps} · YouTube
                        </p>
                      </div>
                      <Plus className="w-4 h-4 shrink-0 text-emerald-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {exercises.map((ex, idx) => (
                <div
                  key={ex.id || idx}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                      #{idx + 1}
                    </span>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Exercise Name (e.g. Barbell Squat)"
                        value={ex.name}
                        onChange={(e) => handleUpdateExercise(idx, 'name', e.target.value)}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Target Muscle (e.g. Quads & Glutes)"
                        value={ex.targetMuscle}
                        onChange={(e) => handleUpdateExercise(idx, 'targetMuscle', e.target.value)}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-medium"
                      />
                    </div>
                    {exercises.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Remove exercise"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Sets, Reps & Category */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Sets</label>
                      <input
                        type="number"
                        min={1}
                        value={ex.sets}
                        onChange={(e) => handleUpdateExercise(idx, 'sets', parseInt(e.target.value) || 3)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-center font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Reps</label>
                      <input
                        type="number"
                        min={1}
                        value={ex.reps}
                        onChange={(e) => handleUpdateExercise(idx, 'reps', parseInt(e.target.value) || 10)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-center font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Category</label>
                      <select
                        value={ex.category || 'Workout'}
                        onChange={(e) => handleUpdateExercise(idx, 'category', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-900 dark:text-slate-100"
                      >
                        <option value="Warmup">Warmup</option>
                        <option value="Workout">Workout</option>
                        <option value="Cooldown">Cooldown</option>
                      </select>
                    </div>
                  </div>

                  {/* YouTube Tutorial URL with Live Preview button */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5 flex items-center justify-between">
                      <span>YouTube Exercise Form Tutorial URL</span>
                      {ex.youtubeUrl && (
                        <button
                          type="button"
                          onClick={() => setTestingYoutubeUrl(testingYoutubeUrl === ex.youtubeUrl ? null : ex.youtubeUrl || null)}
                          className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          {testingYoutubeUrl === ex.youtubeUrl ? 'Hide Preview' : 'Test Form Video'}
                        </button>
                      )}
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={ex.youtubeUrl || ''}
                      onChange={(e) => handleUpdateExercise(idx, 'youtubeUrl', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>

                  {/* Test preview container if active for this video */}
                  {testingYoutubeUrl === ex.youtubeUrl && ex.youtubeUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 mt-2">
                      <YouTubeEmbed url={ex.youtubeUrl} title={ex.name} />
                    </div>
                  )}

                  {/* Coaching Notes */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">
                      Coaching Cues & Technique Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chest up, pause 1s at bottom, drive through heels"
                      value={ex.notes || ''}
                      onChange={(e) => handleUpdateExercise(idx, 'notes', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Assigning Routine...' : 'Confirm & Assign Routine'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
