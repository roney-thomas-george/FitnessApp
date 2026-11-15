import React, { useState, useRef } from 'react';
import {
  Scale,
  TrendingDown,
  TrendingUp,
  Activity,
  Plus,
  Calendar,
  Ruler,
  Award,
  Camera,
  Image,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';
import { WeightRecord } from '../../types';
import { ProgressPhotoMeta } from '../../services/googleDriveService';

interface BmiWeightTrackerProps {
  currentWeight: number; // in kg
  currentHeight: number; // in cm
  weightHistory: WeightRecord[];
  onLogWeight: (weightKg: number, heightCm: number, date: string, photoFile?: File) => Promise<void>;
  isSaving?: boolean;
  drivePhotos?: ProgressPhotoMeta[];
  isDriveConnected?: boolean;
}

export function calculateBmi(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || heightCm <= 0) return 0;
  const heightMeters = heightCm / 100;
  return Math.round((weightKg / (heightMeters * heightMeters)) * 10) / 10;
}

export function getBmiCategory(bmi: number): { label: string; color: string; badgeBg: string } {
  if (bmi < 18.5) {
    return { label: 'Underweight', color: 'text-amber-700 dark:text-amber-400', badgeBg: 'bg-amber-500/10 border-amber-500/25' };
  } else if (bmi < 25) {
    return { label: 'Healthy Weight', color: 'text-emerald-700 dark:text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/25' };
  } else if (bmi < 30) {
    return { label: 'Overweight', color: 'text-orange-700 dark:text-orange-400', badgeBg: 'bg-orange-500/10 border-orange-500/25' };
  } else {
    return { label: 'Obese Range', color: 'text-rose-700 dark:text-rose-400', badgeBg: 'bg-rose-500/10 border-rose-500/25' };
  }
}

export const BmiWeightTracker: React.FC<BmiWeightTrackerProps> = ({
  currentWeight,
  currentHeight,
  weightHistory,
  onLogWeight,
  isSaving = false,
  drivePhotos = [],
  isDriveConnected = false,
}) => {
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');

  // Input states
  const [inputWeight, setInputWeight] = useState<string>(currentWeight ? String(currentWeight) : '75');
  const [inputHeight, setInputHeight] = useState<string>(currentHeight ? String(currentHeight) : '175');
  const [inputFeet, setInputFeet] = useState<string>('5');
  const [inputInches, setInputInches] = useState<string>('9');
  const [inputDate, setInputDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hoveredPoint, setHoveredPoint] = useState<WeightRecord | null>(null);

  // Photo upload state
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute live values in kg & cm
  const resolvedWeightKg =
    weightUnit === 'kg'
      ? parseFloat(inputWeight) || 70
      : Math.round(((parseFloat(inputWeight) || 154) / 2.20462) * 10) / 10;

  const resolvedHeightCm =
    heightUnit === 'cm'
      ? parseFloat(inputHeight) || 175
      : Math.round(((parseFloat(inputFeet) || 5) * 30.48 + (parseFloat(inputInches) || 9) * 2.54) * 10) / 10;

  const liveBmi = calculateBmi(resolvedWeightKg, resolvedHeightCm);
  const bmiCategory = getBmiCategory(liveBmi);

  // Sort weight history chronologically
  const sortedHistory = [...weightHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Trend analysis
  const hasHistory = sortedHistory.length > 1;
  const firstRecord = sortedHistory[0];
  const lastRecord = sortedHistory[sortedHistory.length - 1];
  const netDiff = hasHistory ? Math.round((lastRecord.weight - firstRecord.weight) * 10) / 10 : 0;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogWeight(resolvedWeightKg, resolvedHeightCm, inputDate, selectedPhoto || undefined);
    setSelectedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // SVG Chart Calculation
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 35;

  const weights = sortedHistory.map((h) => (weightUnit === 'kg' ? h.weight : Math.round(h.weight * 2.20462 * 10) / 10));
  const minWeight = weights.length ? Math.floor(Math.min(...weights) - 2) : 60;
  const maxWeight = weights.length ? Math.ceil(Math.max(...weights) + 2) : 90;
  const weightRange = maxWeight - minWeight || 1;

  const points = sortedHistory.map((entry, index) => {
    const val = weightUnit === 'kg' ? entry.weight : Math.round(entry.weight * 2.20462 * 10) / 10;
    const x = padding + (index / Math.max(sortedHistory.length - 1, 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((val - minWeight) / weightRange) * (chartHeight - padding * 2);
    return { x, y, entry, val };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xl backdrop-blur-md transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Body Metric & BMI Progress Tracker
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Log weight & height. Photos save directly to personal Google Drive, keeping database lean.
          </p>
        </div>

        {/* Unit Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setWeightUnit('kg')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                weightUnit === 'kg' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              KG
            </button>
            <button
              type="button"
              onClick={() => setWeightUnit('lbs')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                weightUnit === 'lbs' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              LBS
            </button>
          </div>
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setHeightUnit('cm')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                heightUnit === 'cm' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              CM
            </button>
            <button
              type="button"
              onClick={() => setHeightUnit('ft')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                heightUnit === 'ft' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              FT/IN
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards & Live BMI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Current Weight */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Current Weight</span>
            <Scale className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {weightUnit === 'kg'
              ? `${resolvedWeightKg} kg`
              : `${Math.round(resolvedWeightKg * 2.20462 * 10) / 10} lbs`}
          </p>
          {hasHistory && (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium">
              {netDiff > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +{netDiff} kg overall
                </span>
              ) : netDiff < 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" /> {netDiff} kg overall
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">Stable weight</span>
              )}
            </p>
          )}
        </div>

        {/* Current Height */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Height</span>
            <Ruler className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {heightUnit === 'cm'
              ? `${resolvedHeightCm} cm`
              : `${Math.floor(resolvedHeightCm / 30.48)}' ${Math.round((resolvedHeightCm % 30.48) / 2.54)}"`}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Used for body surface & BMI</p>
        </div>

        {/* Calculated BMI */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Body Mass Index</span>
            <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{liveBmi || '--'}</p>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${bmiCategory.badgeBg} ${bmiCategory.color}`}>
              {bmiCategory.label}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Normal healthy range is 18.5 - 24.9</p>
        </div>
      </div>

      {/* Interactive Weight Trend Line Chart */}
      <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/80 p-4 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Historical Weight Trend ({weightUnit.toUpperCase()})
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{sortedHistory.length} logs recorded</span>
        </div>

        {sortedHistory.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-xs">
            <Scale className="w-8 h-8 mb-2 opacity-40 text-slate-400 dark:text-slate-600" />
            <p>No weight logs yet. Submit your first measurement below!</p>
          </div>
        ) : (
          <div className="relative">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 overflow-visible"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = padding + ratio * (chartHeight - padding * 2);
                const gridVal = Math.round(maxWeight - ratio * weightRange);
                return (
                  <g key={i}>
                    <line
                      x1={padding}
                      y1={y}
                      x2={chartWidth - padding}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-300 dark:text-slate-700"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <text
                      x={padding - 6}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="9"
                      textAnchor="end"
                    >
                      {gridVal}
                    </text>
                  </g>
                );
              })}

              {points.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylinePoints}
                />
              )}

              {points.map((p, idx) => (
                <g key={idx} className="cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint?.id === p.entry.id ? 7 : 4.5}
                    fill="#10b981"
                    stroke="white"
                    strokeWidth="2"
                    onMouseEnter={() => setHoveredPoint(p.entry)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="transition-all"
                  />
                  {(idx === 0 || idx === points.length - 1 || idx % Math.ceil(points.length / 4) === 0) && (
                    <text
                      x={p.x}
                      y={chartHeight - 8}
                      fill="#64748b"
                      fontSize="9"
                      textAnchor="middle"
                    >
                      {p.entry.date.slice(5)}
                    </text>
                  )}
                </g>
              ))}
            </svg>

            {hoveredPoint && (
              <div className="absolute top-2 right-4 rounded-lg bg-white dark:bg-slate-900 border border-emerald-500/40 p-2 text-xs shadow-lg">
                <p className="text-slate-500 dark:text-slate-400">{hoveredPoint.date}</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {weightUnit === 'kg'
                    ? `${hoveredPoint.weight} kg`
                    : `${Math.round(hoveredPoint.weight * 2.20462 * 10) / 10} lbs`}{' '}
                  • BMI {hoveredPoint.bmi}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Photos Stored in Personal Google Drive */}
      {drivePhotos.length > 0 && (
        <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              Client Check-in Progress Photos (Saved in Your Google Drive)
            </h4>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Stored Privately
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {drivePhotos.map((photo) => (
              <div
                key={photo.id}
                className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 group shadow-sm"
              >
                <div className="aspect-square w-full bg-slate-100 dark:bg-slate-950 relative flex items-center justify-center overflow-hidden">
                  {photo.thumbnailLink ? (
                    <img
                      src={photo.thumbnailLink}
                      alt={photo.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <Image className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                  )}
                </div>
                <div className="p-2 text-center text-[10px]">
                  <p className="font-bold text-slate-800 dark:text-slate-200">{photo.date}</p>
                  {photo.weightKg && <p className="text-emerald-600 dark:text-emerald-400 font-semibold">{photo.weightKg} kg</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Form with Optional Check-In Photo */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 p-4 shadow-sm transition-colors">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 mb-3 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          Log New Measurement & Check-In Photo
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
          {/* Weight Input */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Weight ({weightUnit.toUpperCase()})
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={inputWeight}
              onChange={(e) => setInputWeight(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Height Input */}
          {heightUnit === 'cm' ? (
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Height (CM)</label>
              <input
                type="number"
                step="0.5"
                required
                value={inputHeight}
                onChange={(e) => setInputHeight(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Feet</label>
                <input
                  type="number"
                  value={inputFeet}
                  onChange={(e) => setInputFeet(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Inches</label>
                <input
                  type="number"
                  value={inputInches}
                  onChange={(e) => setInputInches(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Log Date</label>
            <div className="relative">
              <input
                type="date"
                required
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 px-4 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <Award className="w-4 h-4" />
              {isSaving ? 'Recording...' : 'Record Metric'}
            </button>
          </div>
        </div>

        {/* Optional Progress Photo Attachment */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-200">Attach Check-in Progress Photo (Optional):</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Photo uploads directly to your personal Google Drive folder, avoiding central database bloat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              className="hidden"
            />
            {photoPreview ? (
              <div className="flex items-center gap-2">
                <img src={photoPreview} alt="Preview" className="h-8 w-8 rounded-lg object-cover border border-emerald-500" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPhoto(null);
                    setPhotoPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" /> Choose Photo
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
