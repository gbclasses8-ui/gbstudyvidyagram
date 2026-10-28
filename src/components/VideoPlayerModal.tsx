import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  FileText,
  Settings,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { FolderItem, VideoDetails } from '../types.ts';

interface VideoPlayerModalProps {
  courseId: number | string;
  videoItem: FolderItem | null;
  videoList?: FolderItem[];
  onClose: () => void;
  onOpenPdf: (pdfUrl: string, title: string) => void;
  onSelectVideo: (item: FolderItem) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  courseId,
  videoItem,
  videoList = [],
  onClose,
  onOpenPdf,
  onSelectVideo,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [isYouTube, setIsYouTube] = useState<string | null>(null);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [selectedQualityUrl, setSelectedQualityUrl] = useState<string | null>(null);
  const [currentQualityLabel, setCurrentQualityLabel] = useState<string>('Auto');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideControlsTimer = useRef<any>(null);

  // Current video index in list
  const currentIndex = videoList.findIndex((v) => String(v.id) === String(videoItem?.id));
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < videoList.length - 1;

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec)) return '00:00';
    const hrs = Math.floor(timeInSec / 3600);
    const mins = Math.floor((timeInSec % 3600) / 60);
    const secs = Math.floor(timeInSec % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Helper to determine if a string is a YouTube ID or URL
  const checkYouTubeId = (str?: string): string | null => {
    if (!str) return null;
    const trimmed = str.trim();
    if (!trimmed.includes('http') && trimmed.length === 11) {
      return trimmed;
    }
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };

  // Helper to proxy stream URL through our server
  const toProxyStream = (rawUrl: string): string => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('/api/video_stream')) return rawUrl;
    return `/api/video_stream?url=${encodeURIComponent(rawUrl)}`;
  };

  // Safe Play wrapper that handles in-flight play promises
  const safePlay = useCallback(async (video: HTMLVideoElement) => {
    try {
      const promise = video.play();
      if (promise !== undefined) {
        playPromiseRef.current = promise;
        await promise;
        setIsPlaying(true);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError' && err?.name !== 'NotAllowedError') {
        console.warn('Playback error:', err);
      }
      setIsPlaying(false);
    } finally {
      playPromiseRef.current = null;
    }
  }, []);

  // Safe Pause wrapper
  const safePause = useCallback(async (video: HTMLVideoElement) => {
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch {
        // Ignore error
      }
    }
    try {
      video.pause();
      setIsPlaying(false);
    } catch {
      // Ignore error
    }
  }, []);

  // Fetch video details
  useEffect(() => {
    if (!videoItem) return;

    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);
    setVideoDetails(null);
    setSelectedQualityUrl(null);
    setIsYouTube(null);

    // 1. Check if videoItem.file_link is YouTube
    const ytId = checkYouTubeId(videoItem.file_link);
    if (ytId) {
      setIsYouTube(ytId);
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        let data: any = null;

        // 1. Try local/Vercel serverless proxy first
        try {
          const res = await fetch(
            `/api/video_details?course_id=${encodeURIComponent(String(courseId))}&video_id=${encodeURIComponent(
              String(videoItem.id)
            )}`
          );
          if (res.ok) {
            data = await res.json();
          }
        } catch {
          // Fall through to direct fallback
        }

        // 2. Direct upstream fallback if proxy had delay
        if (!data || !data.success) {
          try {
            const directUrl = `https://studybeepro.site/get/fetchVideoDetailsById?course_id=${encodeURIComponent(
              String(courseId)
            )}&video_id=${encodeURIComponent(String(videoItem.id))}`;
            const directRes = await fetch(directUrl);
            if (directRes.ok) {
              data = await directRes.json();
            }
          } catch {
            // ignore
          }
        }

        if (isMounted) {
          if (data && data.success) {
            setVideoDetails(data);

            // Check if returned link is YouTube
            const ytCheck = checkYouTubeId(data.decoded_video_link);
            if (ytCheck) {
              setIsYouTube(ytCheck);
              setLoading(false);
              return;
            }

            // Pick stream URL (qualities[0] or decoded_video_link or file_link)
            const rawBest =
              data.qualities?.[0]?.url ||
              data.decoded_video_link ||
              videoItem.file_link;

            if (rawBest) {
              setSelectedQualityUrl(toProxyStream(rawBest));
              setCurrentQualityLabel(data.qualities?.[0]?.quality || 'Auto');
            } else {
              setErrorMsg('No playable stream found for this lecture.');
            }
          } else if (videoItem.file_link) {
            // Direct fallback
            setSelectedQualityUrl(toProxyStream(videoItem.file_link));
            setCurrentQualityLabel('Auto');
          } else {
            setErrorMsg('Video lecture is currently being processed or unavailable.');
          }
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('API error fetching video details, falling back to direct stream:', err);
          if (videoItem.file_link) {
            setSelectedQualityUrl(toProxyStream(videoItem.file_link));
            setCurrentQualityLabel('Auto');
            setLoading(false);
          } else {
            setErrorMsg('Unable to connect to lecture stream. Please try again later.');
            setLoading(false);
          }
        }
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [videoItem, courseId]);

  // Load stream into video element safely via Hls.js
  useEffect(() => {
    let isCancelled = false;
    const video = videoRef.current;
    if (!video || !selectedQualityUrl || isYouTube) return;

    const setupStream = async () => {
      // Wait for any in-flight play promise to settle
      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current;
        } catch {
          // ignore
        }
      }

      if (isCancelled) return;

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const streamUrl = selectedQualityUrl;

      if (streamUrl.includes('.m3u8') || streamUrl.includes('api/video_stream')) {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
          });
          hlsRef.current = hls;
          hls.loadSource(streamUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!isCancelled && videoRef.current) {
              safePlay(videoRef.current);
            }
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              console.warn('HLS fatal error:', data.type, data.details);
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  hls.destroy();
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
          if (!isCancelled) {
            safePlay(video);
          }
        }
      } else {
        video.src = streamUrl;
        if (!isCancelled) {
          safePlay(video);
        }
      }
    };

    setupStream();

    return () => {
      isCancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video) {
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
        } catch {
          // ignore
        }
      }
    };
  }, [selectedQualityUrl, isYouTube, safePlay]);

  // Auto hide controls
  const handleUserActivity = () => {
    setControlsVisible(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3500);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      safePlay(video);
    } else {
      safePause(video);
    }
  };

  const skipSeconds = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  const handleQualitySelect = (rawUrl: string, qualityLabel: string) => {
    const currentTimeSnapshot = videoRef.current ? videoRef.current.currentTime : 0;
    setSelectedQualityUrl(toProxyStream(rawUrl));
    setCurrentQualityLabel(qualityLabel);
    setShowQualityMenu(false);

    // Seek back to position after stream loads
    setTimeout(() => {
      if (videoRef.current && currentTimeSnapshot > 0) {
        videoRef.current.currentTime = currentTimeSnapshot;
      }
    }, 500);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  if (!videoItem) return null;

  const pdfUrl = videoItem.pdf_link || videoDetails?.decoded_pdf_link;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Video Element or YouTube Embed */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black">
        {isYouTube ? (
          <iframe
            src={`https://www.youtube.com/embed/${isYouTube}?autoplay=1&rel=0&modestbranding=1`}
            title={videoItem.Title}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            playsInline
            className="w-full h-full max-h-[100dvh] object-contain cursor-pointer"
            onClick={togglePlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
                setDuration(videoRef.current.duration || 0);
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration || 0);
              }
            }}
          />
        )}

        {/* Center Play Button Overlay when paused */}
        {!isYouTube && !isPlaying && !loading && !errorMsg && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] cursor-pointer z-20 group transition-all"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.7)] group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-3 drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]" />
            <p className="text-pink-200 font-bold text-sm tracking-wide">Connecting to GB STUDY Stream...</p>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 p-6 text-center">
            <AlertCircle className="w-14 h-14 text-pink-500 mb-3" />
            <h4 className="text-lg font-bold text-white mb-2">Lecture Stream Notice</h4>
            <p className="text-pink-200/80 text-sm max-w-md mb-6">{errorMsg}</p>
            <div className="flex gap-3">
              {videoItem.file_link && (
                <button
                  onClick={() => setSelectedQualityUrl(toProxyStream(videoItem.file_link!))}
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-pink-600/40"
                >
                  Retry Stream
                </button>
              )}
              {pdfUrl && (
                <button
                  onClick={() => onOpenPdf(pdfUrl, videoItem.Title)}
                  className="px-5 py-2.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-200 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-pink-400" /> PDF Notes
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Top Header Bar */}
      <div
        className={`absolute top-0 inset-x-0 p-3 sm:p-5 bg-gradient-to-b from-black/95 via-black/70 to-transparent flex items-center justify-between z-30 transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <button
            onClick={onClose}
            aria-label="Close Video"
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-pink-500/20 hover:bg-pink-500/40 border border-pink-500/40 text-pink-200 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                GB STUDY LECTURE
              </span>
            </div>
            <h2 className="text-xs sm:text-base font-extrabold text-white truncate drop-shadow-md">
              {videoItem.Title}
            </h2>
          </div>
        </div>

        {/* Top Right Action: PDF Notes if available */}
        <div className="flex items-center gap-2 shrink-0">
          {pdfUrl && (
            <button
              onClick={() => onOpenPdf(pdfUrl, videoItem.Title)}
              className="py-1.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(236,72,153,0.5)] transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Notes</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar (Visible for standard HTML5/HLS videos) */}
      {!isYouTube && (
        <div
          className={`absolute bottom-0 inset-x-0 p-3 sm:p-5 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col gap-2 z-30 transition-opacity duration-300 ${
            controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Seekbar with pink accent */}
          <div className="w-full flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-pink-950/80 rounded-lg appearance-none cursor-pointer transition-all hover:h-2.5"
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between gap-2 mt-1">
            {/* Left: Play/Pause, Rewind, Forward, Time, Prev/Next */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Prev Video */}
              <button
                onClick={() => hasPrev && onSelectVideo(videoList[currentIndex - 1])}
                disabled={!hasPrev}
                title="Previous Lecture"
                className={`p-1.5 sm:p-2 rounded-lg text-white transition-colors cursor-pointer ${
                  hasPrev ? 'hover:bg-pink-500/20 text-pink-200' : 'opacity-30 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Play / Pause in Pink */}
              <button
                onClick={togglePlay}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.6)] cursor-pointer active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />}
              </button>

              {/* Next Video */}
              <button
                onClick={() => hasNext && onSelectVideo(videoList[currentIndex + 1])}
                disabled={!hasNext}
                title="Next Lecture"
                className={`p-1.5 sm:p-2 rounded-lg text-white transition-colors cursor-pointer ${
                  hasNext ? 'hover:bg-pink-500/20 text-pink-200' : 'opacity-30 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* 10s Rewind & Forward */}
              <button
                onClick={() => skipSeconds(-10)}
                title="Skip 10s backward"
                className="p-1.5 sm:p-2 rounded-lg text-pink-200/80 hover:text-white hover:bg-pink-500/20 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
              <button
                onClick={() => skipSeconds(10)}
                title="Skip 10s forward"
                className="p-1.5 sm:p-2 rounded-lg text-pink-200/80 hover:text-white hover:bg-pink-500/20 transition-all cursor-pointer"
              >
                <RotateCw className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              {/* Volume Control */}
              <div className="hidden sm:flex items-center gap-1.5 ml-1">
                <button
                  onClick={toggleMute}
                  className="text-pink-200/80 hover:text-white p-1.5 cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-pink-900/60 rounded cursor-pointer"
                />
              </div>

              {/* Time display */}
              <span className="text-[11px] sm:text-xs font-semibold text-pink-200/80 ml-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right: Quality, Speed, Fullscreen */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Speed Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSpeedMenu(!showSpeedMenu);
                    setShowQualityMenu(false);
                  }}
                  className="px-2 py-1 rounded-lg bg-pink-500/15 hover:bg-pink-500/30 text-pink-200 text-xs font-bold border border-pink-500/30 cursor-pointer"
                >
                  {playbackSpeed}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-10 right-0 bg-[#1e0a24] border border-pink-500/40 rounded-xl py-1 px-1 shadow-2xl flex flex-col gap-0.5 z-40 min-w-20">
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => changeSpeed(s)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg text-left cursor-pointer transition-colors ${
                          playbackSpeed === s
                            ? 'bg-pink-600 text-white'
                            : 'text-pink-200/80 hover:bg-pink-500/20 hover:text-white'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality Selector */}
              {videoDetails?.qualities && videoDetails.qualities.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowQualityMenu(!showQualityMenu);
                      setShowSpeedMenu(false);
                    }}
                    className="px-2 py-1 rounded-lg bg-pink-500/15 hover:bg-pink-500/30 text-pink-200 text-xs font-bold border border-pink-500/30 flex items-center gap-1 cursor-pointer"
                  >
                    <Settings className="w-3 h-3 text-pink-400" />
                    <span>{currentQualityLabel}</span>
                  </button>
                  {showQualityMenu && (
                    <div className="absolute bottom-10 right-0 bg-[#1e0a24] border border-pink-500/40 rounded-xl py-1 px-1 shadow-2xl flex flex-col gap-0.5 z-40 min-w-28">
                      {videoDetails.qualities.map((q) => (
                        <button
                          key={q.quality}
                          onClick={() => handleQualitySelect(q.url, q.quality)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg text-left cursor-pointer transition-colors ${
                            currentQualityLabel === q.quality
                              ? 'bg-pink-600 text-white'
                              : 'text-pink-200/80 hover:bg-pink-500/20 hover:text-white'
                          }`}
                        >
                          {q.quality}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 sm:p-2 rounded-lg text-pink-200/80 hover:text-white hover:bg-pink-500/20 transition-all cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
