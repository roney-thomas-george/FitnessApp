import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  Volume2,
  AlertCircle,
  Flame,
  Dna,
  Wheat,
  Droplet,
} from 'lucide-react';
import { FoodItem } from '../../types';
import { parseSpokenFoodText, searchFoodItem } from '../../services/nutritionApi';

// Browser Web Speech Recognition interfaces
interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence?: number;
}

interface SpeechRecognitionResultLike {
  isFinal?: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex?: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
}

interface VoiceFoodLoggerProps {
  onSaveLog: (items: FoodItem[], mode: 'voice' | 'manual') => Promise<void>;
  isSaving?: boolean;
}

export const VoiceFoodLogger: React.FC<VoiceFoodLoggerProps> = ({ onSaveLog, isSaving = false }) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'search'>('voice');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [parsedItems, setParsedItems] = useState<FoodItem[]>([]);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let finalCombined = '';
        let interimCombined = '';
        const count = event.results?.length || 0;

        for (let i = 0; i < count; i++) {
          const result = event.results[i];
          const text = result?.[0]?.transcript || '';
          if (result?.isFinal) {
            finalCombined += text + ' ';
          } else {
            interimCombined += text + ' ';
          }
        }

        const combined = (finalCombined + interimCombined).replace(/\s+/g, ' ').trim();
        setInterimText(interimCombined.trim());
        if (combined) {
          setTranscript(combined);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Please allow microphone permission in your browser.');
        } else if (event.error === 'network') {
          setErrorMessage('Speech recognition network error. Check your internet connection or use typed entry below.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setErrorMessage(`Speech recognition notice: ${event.error || 'Stopped'}`);
        }
        setIsListening(false);
        setInterimText('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech Recognition init error:', e);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Automatically parse spoken or typed transcript into food items
  useEffect(() => {
    if (transcript.trim().length > 2) {
      const items = parseSpokenFoodText(transcript);
      setParsedItems(items);
    } else if (!transcript.trim()) {
      setParsedItems([]);
    }
  }, [transcript]);

  const toggleListening = () => {
    setErrorMessage(null);

    if (!speechSupported || !recognitionRef.current) {
      setErrorMessage('Speech Recognition is not supported in this browser. Type your meal below or use Food Search.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      setInterimText('');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
        setErrorMessage('Could not activate microphone. Check browser permissions.');
      }
    }
  };

  const handleManualSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchFoodItem(searchQuery);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickLookupForItem = async (itemName: string) => {
    setActiveTab('search');
    setSearchQuery(itemName);
    setIsSearching(true);
    try {
      const results = await searchFoodItem(itemName);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const addSearchedItem = (item: FoodItem) => {
    setParsedItems((prev) => [...prev, item]);
  };

  const removeItem = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof FoodItem, value: number) => {
    setParsedItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: Math.max(0, value) };
        }
        return item;
      })
    );
  };

  const scaleItemPortion = (index: number, factor: number) => {
    setParsedItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          servingSize: `${factor}× (${item.servingSize || '1 portion'})`,
          calories: Math.max(1, Math.round(item.calories * factor)),
          protein: Math.round(item.protein * factor * 10) / 10,
          carbs: Math.round(item.carbs * factor * 10) / 10,
          fats: Math.round(item.fats * factor * 10) / 10,
          fiber: item.fiber ? Math.round(item.fiber * factor * 10) / 10 : undefined,
          sodium: item.sodium ? Math.round(item.sodium * factor) : undefined,
          potassium: item.potassium ? Math.round(item.potassium * factor) : undefined,
        };
      })
    );
  };

  const handleSave = async () => {
    if (parsedItems.length === 0) return;
    await onSaveLog(parsedItems, activeTab === 'voice' ? 'voice' : 'manual');
    setTranscript('');
    setInterimText('');
    setParsedItems([]);
    setSearchResults([]);
    setSearchQuery('');
  };

  const totalCalories = Math.round(parsedItems.reduce((sum, item) => sum + (item.calories || 0), 0));
  const totalProtein = Math.round(parsedItems.reduce((sum, item) => sum + (item.protein || 0), 0) * 10) / 10;
  const totalCarbs = Math.round(parsedItems.reduce((sum, item) => sum + (item.carbs || 0), 0) * 10) / 10;
  const totalFats = Math.round(parsedItems.reduce((sum, item) => sum + (item.fats || 0), 0) * 10) / 10;

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-xl backdrop-blur-md transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Dietary Intake Tracker
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Speak natural portions (&ldquo;200g chicken, 2 boiled eggs, 1 tbsp peanut butter&rdquo;) or search the database.
          </p>
        </div>

        {/* Mode Switch */}
        <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'voice'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" /> Voice Log
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'search'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Food Search
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Voice Mode */}
      {activeTab === 'voice' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 p-4 border border-slate-200 dark:border-slate-800/90">
            {/* Record Button */}
            <div className="relative flex items-center justify-center">
              {isListening && (
                <>
                  <span className="absolute h-16 w-16 animate-ping rounded-full bg-emerald-500/25" />
                  <span className="absolute h-20 w-20 animate-pulse rounded-full bg-emerald-500/15" />
                </>
              )}
              <button
                type="button"
                onClick={toggleListening}
                className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 ${
                  isListening
                    ? 'bg-rose-500 hover:bg-rose-600 text-white ring-4 ring-rose-500/20'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
                title={isListening ? 'Click to stop listening' : 'Click to start voice recognition'}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    isListening ? 'bg-rose-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {isListening ? 'Listening... Speak your meal' : 'Tap mic to speak your meal'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Supports weights & units: &ldquo;200g chicken breast, 1 cup brown rice, half avocado, 2 boiled eggs&rdquo;
              </p>
              {interimText && (
                <p className="mt-1 text-[11px] italic text-emerald-600 dark:text-emerald-400">
                  Hearing: &ldquo;{interimText}&rdquo;
                </p>
              )}
            </div>

            {/* Quick sample meals */}
            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-end">
              <button
                type="button"
                onClick={() => setTranscript('3 boiled eggs, 1 cup oatmeal and 1 banana')}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-semibold transition-colors"
              >
                Breakfast Demo
              </button>
              <button
                type="button"
                onClick={() => setTranscript('200g grilled chicken breast with 1 cup brown rice and steamed broccoli')}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-semibold transition-colors"
              >
                Lunch Demo
              </button>
              <button
                type="button"
                onClick={() => setTranscript('2 scoops whey protein with 1 tbsp peanut butter and 240ml milk')}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-semibold transition-colors"
              >
                Shake Demo
              </button>
            </div>
          </div>

          {/* Editable Transcript Area */}
          <div>
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Speech Transcript (editable):</span>
              {transcript && (
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('');
                    setInterimText('');
                    setParsedItems([]);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-500 dark:hover:text-rose-400"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Spoken words appear here in real time, or type any meal (e.g. '200g salmon and 150g sweet potato')..."
                rows={2}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 pr-28 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
              />
              {transcript && (
                <div className="absolute right-2.5 bottom-2.5">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> {parsedItems.length} parsed
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Search Mode */}
      {activeTab === 'search' && (
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleManualSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search USDA & OpenFoodFacts (e.g., salmon, paneer, dal, sweet potato, oats)..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="max-h-52 overflow-y-auto space-y-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/80 p-2">
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800/50 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 dark:text-slate-200 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {item.servingSize} · <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{item.calories} kcal</span> · P: {item.protein}g · C: {item.carbs}g · F: {item.fats}g
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addSearchedItem(item)}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-slate-950 font-bold text-[11px] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recognized Items Breakdown */}
      {parsedItems.length > 0 && (
        <div className="mt-5 space-y-3 border-t border-slate-200 dark:border-slate-800/80 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Recognized Food Items ({parsedItems.length})
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">Scale portion or edit macros inline</span>
          </div>

          <div className="space-y-2.5">
            {parsedItems.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 lg:grid-cols-12 items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/90 p-3.5"
              >
                <div className="lg:col-span-5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                    <button
                      type="button"
                      onClick={() => handleQuickLookupForItem(item.name.replace(/^[\d.]+x?\s*\w*\s*/i, ''))}
                      className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline shrink-0"
                      title="Look up alternative entries"
                    >
                      Refine
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.servingSize || '1 portion'}</p>

                  {/* Portion Multiplier Controls */}
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-slate-400 mr-1">Portion:</span>
                    {[0.5, 1.5, 2].map((mult) => (
                      <button
                        key={mult}
                        type="button"
                        onClick={() => scaleItemPortion(idx, mult)}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-[10px] font-bold text-slate-700 dark:text-slate-300 tabular-nums transition-colors"
                      >
                        {mult}×
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 grid grid-cols-4 gap-1.5 text-center">
                  <div className="rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800/80">
                    <span className="block text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold">Calories</span>
                    <input
                      type="number"
                      value={item.calories}
                      onChange={(e) => updateItem(idx, 'calories', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent text-center text-xs font-black text-slate-900 dark:text-slate-100 focus:outline-none tabular-nums"
                    />
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800/80">
                    <span className="block text-[10px] text-cyan-600 dark:text-cyan-400 uppercase font-bold">Protein</span>
                    <input
                      type="number"
                      step="0.5"
                      value={item.protein}
                      onChange={(e) => updateItem(idx, 'protein', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent text-center text-xs font-black text-slate-900 dark:text-slate-100 focus:outline-none tabular-nums"
                    />
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800/80">
                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">Carbs</span>
                    <input
                      type="number"
                      step="0.5"
                      value={item.carbs}
                      onChange={(e) => updateItem(idx, 'carbs', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent text-center text-xs font-black text-slate-900 dark:text-slate-100 focus:outline-none tabular-nums"
                    />
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800/80">
                    <span className="block text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold">Fats</span>
                    <input
                      type="number"
                      step="0.5"
                      value={item.fats}
                      onChange={(e) => updateItem(idx, 'fats', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent text-center text-xs font-black text-slate-900 dark:text-slate-100 focus:outline-none tabular-nums"
                    />
                  </div>
                </div>

                <div className="lg:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Meal Total Bar */}
          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">Total Energy</p>
                  <p className="text-base font-black text-amber-600 dark:text-amber-400 tabular-nums">{totalCalories} kcal</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                  <Dna className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">Total Protein</p>
                  <p className="text-base font-black text-cyan-600 dark:text-cyan-400 tabular-nums">{totalProtein}g</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Wheat className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">Total Carbs</p>
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{totalCarbs}g</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <Droplet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">Total Fats</p>
                  <p className="text-base font-black text-rose-600 dark:text-rose-400 tabular-nums">{totalFats}g</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setParsedItems([])}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSaving ? 'Logging Food...' : 'Confirm & Log To Diary'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
