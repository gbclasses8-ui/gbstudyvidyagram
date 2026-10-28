import React, { useState } from 'react';
import { Play, Bookmark, BookmarkCheck, Share2, Check } from 'lucide-react';
import { Batch } from '../types.ts';

interface BatchCardProps {
  batch: Batch;
  onSelectCourse: (batch: Batch) => void;
  isEnrolled: boolean;
  onToggleEnroll: (batchId: number) => void;
}

export const BatchCard: React.FC<BatchCardProps> = ({
  batch,
  onSelectCourse,
  isEnrolled,
  onToggleEnroll,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/?course=${batch.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const thumbnailSrc =
    !imgError && batch.thumbnail && batch.thumbnail.trim() !== ''
      ? batch.thumbnail
      : 'https://i.ibb.co/0R7qc34v/1093.jpg';

  return (
    <div
      onClick={() => onSelectCourse(batch)}
      className="pink-glass-card rounded-2xl overflow-hidden flex flex-col group cursor-pointer border border-pink-500/20 hover:border-pink-500/60 shadow-lg transition-all duration-300"
    >
      {/* Thumbnail Aspect Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#15071c] border-b border-pink-500/15">
        <img
          src={thumbnailSrc}
          alt={batch.title}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120517] via-transparent to-black/20 pointer-events-none"></div>

        {/* Category Tag (Pink themed) */}
        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-pink-500/40 text-[10px] font-extrabold uppercase tracking-wider text-pink-300 shadow-md">
          {batch.category}
        </div>

        {/* Share Quick Button */}
        <button
          onClick={handleShare}
          title="Share Batch"
          aria-label="Share Batch"
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/70 backdrop-blur-md border border-pink-500/30 text-pink-200 hover:text-white hover:bg-pink-600 transition-all flex items-center justify-center shadow-md cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
        </button>

        {/* Enrolled Badge indicator */}
        {isEnrolled && (
          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-pink-600/90 backdrop-blur-sm border border-pink-400 text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
            <BookmarkCheck className="w-3 h-3" />
            Enrolled
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-pink-300 transition-colors">
            {batch.title}
          </h3>
          <p className="text-[11px] text-pink-300/60 font-medium mt-1">
            GB STUDY &bull; Verified Lectures &bull; Complete Batch
          </p>
        </div>

        {/* Buttons Row: Let's Study & Enroll */}
        <div className="flex items-center gap-2 pt-2 border-t border-pink-500/10">
          {/* Let's Study in Bold Pink as requested */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectCourse(batch);
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm tracking-wide shadow-[0_0_15px_rgba(236,72,153,0.35)] hover:shadow-[0_0_22px_rgba(236,72,153,0.6)] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Let's Study</span>
          </button>

          {/* Enroll / Enrolled Button in Pink */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleEnroll(batch.id);
            }}
            title={isEnrolled ? 'Unenroll Batch' : 'Enroll Batch'}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 border ${
              isEnrolled
                ? 'bg-pink-500/20 text-pink-200 border-pink-500/50 hover:bg-pink-500/30'
                : 'bg-[#1e0a24] text-pink-300 hover:text-white border-pink-500/30 hover:border-pink-500 hover:bg-pink-500/20'
            }`}
          >
            {isEnrolled ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-pink-400" />
                <span className="hidden xs:inline">Enrolled</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Enroll</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
