import React, { useState, useMemo } from 'react';
import { Play, X, ExternalLink, Youtube } from 'lucide-react';

interface YouTubeModalProps {
  url?: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Parses varied YouTube URLs into a clean privacy-enhanced embed URL
 */
export function extractYouTubeEmbedUrl(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // Pattern matches:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://youtube.com/v/VIDEO_ID
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);

  if (match && match[1]) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1`;
  }

  return null;
}

/**
 * Modal Popup for playing YouTube workout demonstration videos
 */
export const YouTubeModal: React.FC<YouTubeModalProps> = ({
  url,
  title = 'Exercise Technique Guide',
  isOpen,
  onClose,
}) => {
  const embedUrl = useMemo(() => (isOpen ? extractYouTubeEmbedUrl(url) : null), [url, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 dark:bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden p-4 sm:p-5 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-500">
              <Youtube className="w-4 h-4 fill-rose-600 dark:fill-rose-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{title}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Video Form & Technique Demo</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Close video"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Frame */}
        {embedUrl ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-inner">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="aspect-video w-full rounded-2xl bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold mb-2">Video link available</p>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs text-emerald-600 dark:text-emerald-400 font-bold transition-colors shadow-sm"
              >
                Watch on YouTube <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface YouTubePlayButtonProps {
  url?: string;
  title?: string;
  label?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Compact play button that pops up the YouTube video modal on demand
 */
export const YouTubePlayButton: React.FC<YouTubePlayButtonProps> = ({
  url,
  title = 'Exercise Technique',
  label = 'Watch Demo',
  compact = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!url) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`inline-flex items-center gap-1.5 font-bold transition-all active:scale-95 group ${
          compact
            ? 'p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs'
            : 'px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/20 text-xs shadow-sm shadow-rose-500/10'
        } ${className}`}
        title={`Watch YouTube guide for ${title}`}
      >
        <Play className="w-3.5 h-3.5 fill-current transition-transform group-hover:scale-110" />
        {!compact && <span>{label}</span>}
      </button>

      <YouTubeModal
        url={url}
        title={title}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export const YouTubeEmbed: React.FC<{ url?: string; title?: string; className?: string }> = ({
  url,
  title = 'Workout Demonstration',
}) => {
  return <YouTubePlayButton url={url} title={title} />;
};
