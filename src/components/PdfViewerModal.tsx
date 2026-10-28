import React, { useState } from 'react';
import { X, Download, ExternalLink, FileText, Loader2 } from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  pdfUrl: string | null;
  title: string;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  pdfUrl,
  title,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);

  if (!isOpen || !pdfUrl) return null;

  // Convert raw AppX / external PDF link to our working proxy endpoint
  const proxiedPdfUrl = pdfUrl.startsWith('/api/pdf_proxy')
    ? pdfUrl
    : `/api/pdf_proxy?url=${encodeURIComponent(pdfUrl)}`;

  const handleOpenExternal = () => {
    window.open(proxiedPdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-2 sm:p-5 animate-in fade-in duration-200"
    >
      {/* Top Header */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between p-3 sm:p-4 bg-[#1b0a22] border border-pink-500/30 rounded-t-2xl shadow-xl">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase text-pink-400 tracking-wider">
              GB STUDY PDF NOTES
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-white truncate">{title}</h3>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenExternal}
            className="py-1.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(236,72,153,0.5)] transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open in New Tab / Download</span>
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            aria-label="Close PDF Viewer"
            className="p-1.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 hover:text-white border border-pink-500/30 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="w-full max-w-5xl mx-auto flex-1 bg-[#100516] border-x border-b border-pink-500/30 rounded-b-2xl overflow-hidden relative flex flex-col shadow-2xl">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#100516] z-10">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-2" />
            <p className="text-xs text-pink-300 font-semibold">Loading GB STUDY PDF Notes...</p>
          </div>
        )}

        <iframe
          src={proxiedPdfUrl}
          title={title}
          onLoad={() => setLoading(false)}
          className="w-full h-full flex-1 border-0 bg-white"
        />

        {/* Action bar at bottom */}
        <div className="p-3 bg-[#170820] border-t border-pink-500/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="text-[11px] text-pink-300/80">
            Notes rendered via GB STUDY Secure PDF Proxy. Tap button on the right to download or open in Google Drive.
          </p>
          <button
            onClick={handleOpenExternal}
            className="px-4 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-200 text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            Download / Full Screen
          </button>
        </div>
      </div>
    </div>
  );
};
