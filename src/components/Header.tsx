import React from 'react';
import { Send, BookOpen, BookmarkCheck, ArrowLeft, Search, X } from 'lucide-react';

interface HeaderProps {
  onGoHome: () => void;
  activeTab: 'all' | 'enrolled';
  onTabChange: (tab: 'all' | 'enrolled') => void;
  enrolledCount: number;
  totalBatchesCount: number;
  onOpenTelegram: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isInsideCourse: boolean;
  courseTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onGoHome,
  activeTab,
  onTabChange,
  enrolledCount,
  totalBatchesCount,
  onOpenTelegram,
  searchQuery,
  onSearchChange,
  isInsideCourse,
  courseTitle,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full pink-nav-glass transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Back button or Brand */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          {isInsideCourse ? (
            <button
              onClick={onGoHome}
              aria-label="Back to Batches"
              className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300 hover:bg-pink-500/20 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ) : null}

          <div
            onClick={onGoHome}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none min-w-0"
          >
            <div className="relative">
              <img
                src="https://i.ibb.co/0R7qc34v/1093.jpg"
                alt="GB STUDY"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-cover border-2 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.35)] group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-pink-500 rounded-full border-2 border-[#0c0510] animate-pulse"></span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-2xl font-black tracking-tight text-white drop-shadow-md">
                  GB <span className="text-pink-500 drop-shadow-[0_0_12px_rgba(236,72,153,0.7)]">STUDY</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-pink-300/70 truncate hidden sm:block">
                All Batches &bull; Free Video Lectures &bull; Notes
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search input on desktop (if on home) */}
        {!isInsideCourse && (
          <div className="hidden md:flex flex-1 max-w-md mx-2 relative items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-pink-400/60 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search batches, exams, teachers..."
              className="w-full bg-[#170a1c]/90 border border-pink-500/25 rounded-xl pl-10 pr-9 py-2 text-sm text-white placeholder-pink-300/40 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 text-pink-300/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Right side navigation buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {!isInsideCourse && (
            <div className="flex items-center bg-[#170a1c] border border-pink-500/20 rounded-xl p-1">
              <button
                onClick={() => onTabChange('all')}
                className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                    : 'text-pink-200/70 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Batches</span>
                <span className="bg-pink-950/80 text-pink-200 text-[10px] px-1.5 py-0.2 rounded font-black border border-pink-500/30">
                  {totalBatchesCount}
                </span>
              </button>

              <button
                onClick={() => onTabChange('enrolled')}
                className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'enrolled'
                    ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                    : 'text-pink-200/70 hover:text-white'
                }`}
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">My Enrolled</span>
                {enrolledCount > 0 && (
                  <span className="bg-pink-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {enrolledCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Telegram Action Button (Pink themed with live icon) */}
          <button
            onClick={onOpenTelegram}
            className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-[0_0_16px_rgba(236,72,153,0.45)] hover:shadow-[0_0_24px_rgba(236,72,153,0.6)] transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white fill-current" />
            <span className="hidden sm:inline">Join</span> Telegram
          </button>
        </div>
      </div>

      {/* Mobile search input row when on home */}
      {!isInsideCourse && (
        <div className="md:hidden px-3 pb-3 pt-1">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-pink-400/60 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search all batches, exams, teachers..."
              className="w-full bg-[#170a1c] border border-pink-500/25 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-pink-300/40 focus:outline-none focus:border-pink-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 text-pink-300/60 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
