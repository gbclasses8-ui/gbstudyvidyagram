import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Folder,
  Play,
  FileText,
  Calendar,
  ChevronRight,
  Share2,
  Bookmark,
  BookmarkCheck,
  Check,
  Search,
  X,
  FolderOpen,
  RotateCcw,
} from 'lucide-react';
import { Batch, FolderItem, BreadcrumbItem } from '../types.ts';
import { FALLBACK_FOLDERS } from '../data/fallbackFolders.ts';

interface CourseViewProps {
  batch: Batch;
  onBackToBatches: () => void;
  isEnrolled: boolean;
  onToggleEnroll: (batchId: number) => void;
  onOpenVideo: (item: FolderItem, allVideosInFolder: FolderItem[]) => void;
  onOpenPdf: (pdfUrl: string, title?: string) => void;
}

export const CourseView: React.FC<CourseViewProps> = ({
  batch,
  onBackToBatches,
  isEnrolled,
  onToggleEnroll,
  onOpenVideo,
  onOpenPdf,
}) => {
  const [navStack, setNavStack] = useState<BreadcrumbItem[]>([
    { id: '-1', title: batch.title },
  ]);
  const [items, setItems] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const currentFolder = navStack[navStack.length - 1];

  // Fetch folder contents with dual proxy, pre-seeded catalog, and direct upstream
  const fetchContents = async (folderId: string) => {
    setLoading(true);
    setErrorMsg(null);

    const fallbackKey = `${batch.id}:${folderId}`;
    const preSeeded = FALLBACK_FOLDERS[fallbackKey] || [];

    // 1. Try local/Vercel serverless proxy first
    try {
      const res = await fetch(
        `/api/folder_contents?course_id=${encodeURIComponent(String(batch.id))}&parent_id=${encodeURIComponent(
          folderId
        )}&start=0`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.status === 200 && Array.isArray(json.data) && json.data.length > 0) {
          setItems(json.data);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('API folder fetch failed, checking fallback and upstream:', e);
    }

    // 2. Direct upstream fallback (studybeepro.site)
    try {
      const directUrl = `https://studybeepro.site/get/folder_contentsv3?course_id=${encodeURIComponent(
        String(batch.id)
      )}&parent_id=${encodeURIComponent(folderId)}&start=0`;
      const directRes = await fetch(directUrl);
      if (directRes.ok) {
        const json = await directRes.json();
        if (json.status === 200 && Array.isArray(json.data) && json.data.length > 0) {
          setItems(json.data);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fall through to pre-seeded catalog
    }

    // 3. Pre-seeded permanent offline catalog fallback
    if (preSeeded && preSeeded.length > 0) {
      setItems(preSeeded);
      setLoading(false);
      return;
    }

    // Default to empty array without crashing or throwing notice
    setItems([]);
    setLoading(false);
  };

  useEffect(() => {
    fetchContents(currentFolder.id);
  }, [currentFolder.id, batch.id]);

  const handleNavigateToFolder = (id: string, title: string) => {
    setSearchQuery('');
    setNavStack((prev) => [...prev, { id, title }]);
  };

  const handleGoBack = () => {
    if (navStack.length > 1) {
      setSearchQuery('');
      setNavStack((prev) => prev.slice(0, prev.length - 1));
    } else {
      onBackToBatches();
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    setSearchQuery('');
    setNavStack((prev) => prev.slice(0, index + 1));
  };

  const handleShare = () => {
    const url = `${window.location.origin}/?course=${batch.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatDuration = (durationText?: string, secsStr?: string | number) => {
    if (secsStr && Number(secsStr) > 0) {
      let s = Number(secsStr);
      const h = Math.floor(s / 3600);
      s %= 3600;
      const m = Math.floor(s / 60);
      s %= 60;
      return [h, m, s]
        .map((v) => (v < 10 ? '0' + v : v))
        .filter((v, i) => v !== '00' || i > 0)
        .join(':');
    }
    if (durationText) {
      return durationText.replace('mins', ':').replace('secs', '').replace(/\s+/g, '').trim();
    }
    return '';
  };

  // Directly open PDF in a new tab without intermediate modals or confusing text
  const openPdfDirect = (rawPdfUrl?: string) => {
    if (!rawPdfUrl) return;
    onOpenPdf(rawPdfUrl);
  };

  // Filter items in current view
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    return (item.Title || '').toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  const allVideosInFolder = items.filter((i) => i.material_type === 'VIDEO');

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Course Header Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl pink-glass-card p-4 sm:p-7 border border-pink-500/30 overflow-hidden mb-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between relative z-10">
          <div className="flex items-start gap-3.5 sm:gap-5 min-w-0">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-pink-500/40 bg-[#120517] shrink-0 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
              <img
                src={batch.thumbnail || 'https://i.ibb.co/0R7qc34v/1093.jpg'}
                alt={batch.title}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://i.ibb.co/0R7qc34v/1093.jpg';
                }}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-black uppercase tracking-wider">
                  {batch.category}
                </span>
                <span className="text-pink-300/60 text-xs font-semibold">GB STUDY Verified Course</span>
              </div>
              <h1 className="text-base sm:text-2xl font-black text-white leading-snug drop-shadow-sm">
                {batch.title}
              </h1>
              <p className="text-xs sm:text-sm text-pink-200/70 mt-1 font-medium">
                Free access to all videos, chapters, DPPs, and official PDF notes.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 w-full md:w-auto pt-2 md:pt-0 border-t border-pink-500/10 md:border-0 justify-end shrink-0">
            <button
              onClick={() => onToggleEnroll(batch.id)}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isEnrolled
                  ? 'bg-pink-500/20 text-pink-200 border-pink-500/50 hover:bg-pink-500/30'
                  : 'bg-pink-600 hover:bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-600/30'
              }`}
            >
              {isEnrolled ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-pink-400" />
                  <span>Enrolled</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Enroll Free</span>
                </>
              )}
            </button>

            <button
              onClick={handleShare}
              className="py-2.5 px-3.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-200 hover:text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-pink-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Controls: Back Button, Breadcrumbs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6 bg-[#16081d]/90 p-2.5 sm:p-3 rounded-2xl border border-pink-500/20 backdrop-blur-md">
        {/* Left: Back button & Breadcrumb list */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scroll py-1">
          <button
            onClick={handleGoBack}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-pink-500/15 hover:bg-pink-500/30 border border-pink-500/30 text-pink-200 flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs sm:text-sm font-bold text-pink-300/70 whitespace-nowrap">
            {navStack.map((crumb, idx) => {
              const isLast = idx === navStack.length - 1;
              return (
                <React.Fragment key={crumb.id + idx}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-pink-500/40 shrink-0" />}
                  <button
                    onClick={() => handleBreadcrumbClick(idx)}
                    className={`max-w-[140px] sm:max-w-[200px] truncate transition-colors cursor-pointer ${
                      isLast
                        ? 'text-pink-400 font-extrabold cursor-default drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                        : 'hover:text-white'
                    }`}
                  >
                    {crumb.title}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Right: Search in folder */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-pink-400/60 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in this folder..."
            className="w-full bg-[#1b0a24] border border-pink-500/25 rounded-xl pl-9 pr-7 py-1.5 text-xs text-white placeholder-pink-300/40 focus:outline-none focus:border-pink-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-pink-400/70 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content State: Loading, Error, Empty, or Items */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-gradient-to-r from-pink-500/5 via-pink-500/10 to-pink-500/5 animate-pulse border border-pink-500/10"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-[#170820] border border-pink-500/20">
          <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center mx-auto mb-4 text-pink-400">
            <FolderOpen className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {searchQuery ? 'No Content Found' : 'Course Lectures Synchronizing'}
          </h3>
          <p className="text-pink-200/70 text-xs sm:text-sm max-w-sm mx-auto mb-5">
            {searchQuery
              ? `No items matching "${searchQuery}". Try a different keyword.`
              : 'Lectures and notes are being synchronized with the cloud. Tap refresh to check.'}
          </p>
          <button
            onClick={() => fetchContents(currentFolder.id)}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-pink-600/30 cursor-pointer transition-all active:scale-95"
          >
            Refresh Content
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredItems.map((item) => {
            const isFolder = item.material_type === 'FOLDER';
            const isVideo = item.material_type === 'VIDEO';
            const isPdf = item.material_type === 'PDF' || item.material_type === 'NOTES';

            if (isFolder) {
              const videoCount = Number(item.videos_count) || 0;
              const fileCount = Number(item.files_count) || 0;
              const hasThumbnail = item.thumbnail && item.thumbnail.trim() !== '';

              return (
                <div
                  key={item.id}
                  onClick={() => handleNavigateToFolder(item.id, item.Title)}
                  className="pink-row-card rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    <div className="w-14 h-12 sm:w-18 sm:h-14 rounded-xl overflow-hidden bg-[#120517] border border-pink-500/30 flex items-center justify-center shrink-0 shadow-inner group-hover:border-pink-500 transition-colors">
                      {hasThumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.Title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Folder className="w-6 h-6 sm:w-7 sm:h-7 text-pink-400 group-hover:scale-110 transition-transform" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                        {item.Title}
                      </h3>
                      <p className="text-xs font-semibold text-pink-400/80 mt-0.5">
                        {videoCount > 0 && `${videoCount} Video${videoCount > 1 ? 's' : ''}`}
                        {videoCount > 0 && fileCount > 0 && ' • '}
                        {fileCount > 0 && `${fileCount} PDF${fileCount > 1 ? 's' : ''}`}
                        {videoCount === 0 && fileCount === 0 && 'Folder'}
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-pink-500/10 group-hover:bg-pink-500 text-pink-300 group-hover:text-white flex items-center justify-center transition-all shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            }

            if (isVideo) {
              const durationStr = formatDuration(item.duration, item.duration_in_secs);
              const thumb = item.thumbnail || 'https://i.ibb.co/0R7qc34v/1093.jpg';
              const pdfUrl = item.pdf_link;

              return (
                <div
                  key={item.id}
                  className="pink-row-card rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 relative overflow-hidden group"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => onOpenVideo(item, allVideosInFolder)}
                    className="w-full sm:w-48 aspect-video bg-[#120517] rounded-xl overflow-hidden relative shrink-0 border border-pink-500/25 cursor-pointer shadow-md group-hover:border-pink-500/60 transition-colors"
                  >
                    <img
                      src={thumb}
                      alt={item.Title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://i.ibb.co/0R7qc34v/1093.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-pink-600/90 text-white flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.8)] group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                    {durationStr && (
                      <div className="absolute bottom-1.5 right-1.5 bg-black/85 backdrop-blur-sm border border-pink-500/30 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                        {durationStr}
                      </div>
                    )}
                  </div>

                  {/* Info and Actions */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                    <div>
                      <h3
                        onClick={() => onOpenVideo(item, allVideosInFolder)}
                        className="text-sm sm:text-base font-bold text-white group-hover:text-pink-300 transition-colors cursor-pointer line-clamp-2 leading-snug"
                      >
                        {item.Title}
                      </h3>
                      {(item.date_and_time || item.event_date) && (
                        <p className="text-[11px] text-pink-300/60 font-medium mt-1 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-pink-400" />
                          <span>{item.date_and_time || item.event_date}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3 sm:mt-2">
                      <button
                        onClick={() => onOpenVideo(item, allVideosInFolder)}
                        className="py-1.5 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(236,72,153,0.4)] transition-all cursor-pointer active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Watch Lecture</span>
                      </button>

                      {pdfUrl && (
                        <button
                          onClick={() => openPdfDirect(pdfUrl)}
                          className="py-1.5 px-3 sm:px-4 rounded-xl bg-pink-500/15 hover:bg-pink-500/30 border border-pink-500/30 text-pink-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5 text-pink-400" />
                          <span>Notes</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            if (isPdf) {
              const pdfUrl = item.file_link || item.pdf_link || item.download_link;
              return (
                <div
                  key={item.id}
                  onClick={() => openPdfDirect(pdfUrl)}
                  className="pink-row-card rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(236,72,153,0.15)] group-hover:bg-pink-500/25 transition-colors">
                      <FileText className="w-5 h-5 text-pink-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                        {item.Title}
                      </h3>
                      {item.event_date && (
                        <p className="text-[11px] text-pink-300/60 font-medium mt-0.5">
                          {item.event_date}
                        </p>
                      )}
                    </div>
                  </div>

                  {pdfUrl && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPdfDirect(pdfUrl);
                        }}
                        className="py-2 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(236,72,153,0.4)] transition-all cursor-pointer active:scale-95"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF Notes</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
};
