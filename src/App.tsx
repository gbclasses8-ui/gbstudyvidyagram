import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ALL_BATCHES } from './data/batchesData.ts';
import { Batch, FolderItem } from './types.ts';
import { Header } from './components/Header.tsx';
import { BatchCard } from './components/BatchCard.tsx';
import { CourseView } from './components/CourseView.tsx';
import { VideoPlayerModal } from './components/VideoPlayerModal.tsx';
import { TelegramModal } from './components/TelegramModal.tsx';
import { Footer } from './components/Footer.tsx';
import {
  Sparkles,
  Send,
  BookOpen,
  Flame,
  ChevronDown,
  FolderSearch,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Maths',
  'Railway',
  'SSC',
  'State / UP',
  'Reasoning',
  'English',
  'GS & Static GK',
  'Science',
  'Skills & AI',
];

const ITEMS_PER_PAGE = 12;

export default function App() {
  // Navigation State
  const [selectedCourse, setSelectedCourse] = useState<Batch | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'enrolled'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayCount, setDisplayCount] = useState<number>(ITEMS_PER_PAGE);

  // Enrolled Batches (Stored in localStorage - No Login Needed)
  const [enrolledBatchIds, setEnrolledBatchIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('gb_study_enrolled');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Telegram Modal State: Opens on initial site launch as requested
  const [isTelegramOpen, setIsTelegramOpen] = useState<boolean>(true);

  // Video Player Modal State
  const [activeVideoItem, setActiveVideoItem] = useState<FolderItem | null>(null);
  const [videoPlaylist, setVideoPlaylist] = useState<FolderItem[]>([]);

  // Open Notes directly in a new tab without showing any intermediate modal or "open in new tab" text
  const handleOpenPdfDirect = useCallback((pdfUrl: string) => {
    if (!pdfUrl) return;
    const target = pdfUrl.startsWith('/api/pdf_proxy')
      ? pdfUrl
      : `/api/pdf_proxy?url=${encodeURIComponent(pdfUrl)}`;
    window.open(target, '_blank', 'noopener,noreferrer');
  }, []);

  // Handle URL deep-linking on first load (e.g. ?course=60)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const courseIdParam = params.get('course') || params.get('id');
    if (courseIdParam) {
      const match = ALL_BATCHES.find((b) => String(b.id) === String(courseIdParam));
      if (match) {
        setSelectedCourse(match);
      }
    }
  }, []);

  // Update deep-linking in URL without full page reload
  useEffect(() => {
    if (selectedCourse) {
      const newUrl = `${window.location.pathname}?course=${selectedCourse.id}`;
      window.history.pushState({ courseId: selectedCourse.id }, '', newUrl);
    } else {
      window.history.pushState({}, '', window.location.pathname);
    }
  }, [selectedCourse]);

  // Toggle Enrollment in Batch
  const handleToggleEnroll = (batchId: number) => {
    setEnrolledBatchIds((prev) => {
      let updated: number[];
      if (prev.includes(batchId)) {
        updated = prev.filter((id) => id !== batchId);
      } else {
        updated = [...prev, batchId];
      }
      try {
        localStorage.setItem('gb_study_enrolled', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed saving enrolled batches', e);
      }
      return updated;
    });
  };

  // Filtered Batches Calculation
  const filteredBatches = useMemo(() => {
    return ALL_BATCHES.filter((batch) => {
      // Tab filter
      if (activeTab === 'enrolled' && !enrolledBatchIds.includes(batch.id)) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'All' && batch.category !== selectedCategory) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = batch.title.toLowerCase().includes(query);
        const matchesCategory = batch.category.toLowerCase().includes(query);
        return matchesTitle || matchesCategory;
      }
      return true;
    });
  }, [activeTab, selectedCategory, searchQuery, enrolledBatchIds]);

  const visibleBatches = useMemo(() => {
    return filteredBatches.slice(0, displayCount);
  }, [filteredBatches, displayCount]);

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + ITEMS_PER_PAGE);
  };

  // Reset pagination when category, tab, or search changes
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [selectedCategory, activeTab, searchQuery]);

  return (
    <div className="min-h-screen pink-mesh-bg text-stone-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      {/* Header */}
      <Header
        onGoHome={() => setSelectedCourse(null)}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedCourse(null);
        }}
        enrolledCount={enrolledBatchIds.length}
        totalBatchesCount={ALL_BATCHES.length}
        onOpenTelegram={() => setIsTelegramOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isInsideCourse={selectedCourse !== null}
        courseTitle={selectedCourse?.title}
      />

      {/* Main Body */}
      <main className="flex-1 w-full">
        {selectedCourse ? (
          /* Course/Batch View with Folders, Lectures & Direct Notes */
          <CourseView
            batch={selectedCourse}
            onBackToBatches={() => setSelectedCourse(null)}
            isEnrolled={enrolledBatchIds.includes(selectedCourse.id)}
            onToggleEnroll={handleToggleEnroll}
            onOpenVideo={(item, allVideos) => {
              setActiveVideoItem(item);
              setVideoPlaylist(allVideos);
            }}
            onOpenPdf={handleOpenPdfDirect}
          />
        ) : (
          /* Homepage: Hero Banner, Category Tabs & Batch Grid */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12">
            {/* Hero Strip Banner */}
            <div className="relative rounded-3xl p-6 sm:p-10 mb-8 overflow-hidden border border-pink-500/30 bg-gradient-to-r from-[#200928] via-[#15061b] to-[#250a2f] shadow-[0_0_40px_rgba(236,72,153,0.18)]">
              {/* Glow spots */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-bold mb-4 shadow-sm">
                    <Flame className="w-3.5 h-3.5 text-pink-400" />
                    <span>All Batches Unlocked Free</span>
                    <span className="text-pink-400">&bull;</span>
                    <span>No Login Required</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-3">
                    Welcome to <span className="text-pink-500 drop-shadow-[0_0_20px_rgba(236,72,153,0.7)]">GB STUDY</span>
                  </h1>

                  <p className="text-sm sm:text-base text-pink-200/80 max-w-2xl leading-relaxed mb-6">
                    Access India's best competitive batches including Maths Special, Railway Vande Bharat, SSC CGL/CHSL, UP Police, Reasoning, English, and GS with real video lectures and downloadable PDF notes.
                  </p>

                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                    <button
                      onClick={() => setIsTelegramOpen(true)}
                      className="py-3 px-6 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:shadow-[0_0_28px_rgba(236,72,153,0.7)] transition-all cursor-pointer active:scale-95"
                    >
                      <Send className="w-4 h-4 fill-current" />
                      <span>Join Telegram Channel</span>
                    </button>

                    <button
                      onClick={() => {
                        const el = document.getElementById('batches-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="py-3 px-6 rounded-2xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-200 font-bold text-sm transition-all cursor-pointer"
                    >
                      Explore {ALL_BATCHES.length} Batches
                    </button>
                  </div>
                </div>

                {/* Hero Right: Brand Badge with User Icon */}
                <div className="shrink-0 relative">
                  <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-2 border-pink-500/60 shadow-[0_0_35px_rgba(236,72,153,0.4)] p-1 bg-gradient-to-tr from-pink-600 via-rose-500 to-pink-400">
                    <img
                      src="https://i.ibb.co/0R7qc34v/1093.jpg"
                      alt="GB STUDY"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>
                  <div className="absolute -bottom-3 -right-3 bg-pink-600 text-white text-[11px] font-black px-3 py-1 rounded-xl shadow-lg border border-pink-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> GB STUDY
                  </div>
                </div>
              </div>
            </div>

            {/* Controls & Category Filter Bar */}
            <div id="batches-section" className="mb-8 space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Section Title */}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {activeTab === 'enrolled' ? 'My Enrolled Batches' : 'Available Batches'}
                    </h2>
                    <p className="text-xs text-pink-300/70 font-semibold">
                      Showing {filteredBatches.length} batch{filteredBatches.length !== 1 ? 'es' : ''}
                    </p>
                  </div>
                </div>

                {/* Tab switchers on desktop */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                      activeTab === 'all'
                        ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-600/30'
                        : 'bg-[#170a1c] text-pink-200/70 border-pink-500/20 hover:text-white hover:border-pink-500/40'
                    }`}
                  >
                    All Batches ({ALL_BATCHES.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('enrolled')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                      activeTab === 'enrolled'
                        ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-600/30'
                        : 'bg-[#170a1c] text-pink-200/70 border-pink-500/20 hover:text-white hover:border-pink-500/40'
                    }`}
                  >
                    My Enrolled ({enrolledBatchIds.length})
                  </button>
                </div>
              </div>

              {/* Horizontal Category Pill Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scroll pb-2 pt-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                      selectedCategory === cat
                        ? 'bg-pink-600 text-white border-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                        : 'bg-[#15081b]/80 text-pink-200/70 border-pink-500/20 hover:border-pink-500/50 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Batches Grid */}
            {visibleBatches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                {visibleBatches.map((batch) => (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    onSelectCourse={setSelectedCourse}
                    isEnrolled={enrolledBatchIds.includes(batch.id)}
                    onToggleEnroll={handleToggleEnroll}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="rounded-3xl p-12 text-center bg-[#15071c] border border-pink-500/20">
                <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center mx-auto mb-4 text-pink-400">
                  <FolderSearch className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Batches Found</h3>
                <p className="text-sm text-pink-200/70 max-w-sm mx-auto mb-6">
                  {searchQuery
                    ? `No batches matching "${searchQuery}". Please try another search keyword.`
                    : activeTab === 'enrolled'
                    ? 'You have not enrolled in any batch yet. Browse all batches and click Enroll.'
                    : 'No batches in this category.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
                {activeTab === 'enrolled' && (
                  <button
                    onClick={() => setActiveTab('all')}
                    className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-pink-600/30"
                  >
                    Browse All Batches
                  </button>
                )}
              </div>
            )}

            {/* Load More Button */}
            {visibleBatches.length < filteredBatches.length && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMore}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#200928] to-[#15061b] hover:border-pink-500 border border-pink-500/30 text-white font-extrabold text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.2)] hover:shadow-[0_0_25px_rgba(236,72,153,0.4)] transition-all cursor-pointer active:scale-95"
                >
                  <span>Load More Batches ({filteredBatches.length - visibleBatches.length} remaining)</span>
                  <ChevronDown className="w-4 h-4 text-pink-400" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Telegram Floating Quick Button */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsTelegramOpen(true)}
          title="Join Telegram Channel"
          className="p-3.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.6)] hover:shadow-[0_0_30px_rgba(236,72,153,0.8)] transition-all cursor-pointer active:scale-95"
        >
          <Send className="w-5 h-5 fill-current" />
          <span className="hidden sm:inline">Join Telegram</span>
        </button>
      </div>

      {/* Video Player Modal */}
      {activeVideoItem && (
        <VideoPlayerModal
          courseId={selectedCourse?.id || ''}
          videoItem={activeVideoItem}
          videoList={videoPlaylist}
          onClose={() => setActiveVideoItem(null)}
          onSelectVideo={(item) => setActiveVideoItem(item)}
          onOpenPdf={handleOpenPdfDirect}
        />
      )}

      {/* Telegram Popup Modal */}
      <TelegramModal
        isOpen={isTelegramOpen}
        onClose={() => setIsTelegramOpen(false)}
      />

      {/* Footer */}
      <Footer
        onOpenTelegram={() => setIsTelegramOpen(true)}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSelectedCourse(null);
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
