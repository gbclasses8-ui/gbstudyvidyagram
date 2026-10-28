import React from 'react';
import { Send, X, ShieldCheck, Bell, Sparkles } from 'lucide-react';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramModal: React.FC<TelegramModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleJoinTelegram = () => {
    window.open('https://t.me/GBFreestudy', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-[#1e0a24] to-[#120517] border-2 border-pink-500/50 shadow-[0_0_50px_rgba(236,72,153,0.35)] p-6 sm:p-7 text-center overflow-hidden">
        {/* Ambient pink lighting orb */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-pink-500/25 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-rose-600/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Close Button top-right */}
        <button
          onClick={onClose}
          aria-label="Close Telegram popup"
          className="absolute top-4 right-4 text-pink-300/70 hover:text-white bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-xl p-1.5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon */}
        <div className="mx-auto mb-4 relative w-20 h-20">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-pink-500 shadow-[0_0_25px_rgba(236,72,153,0.5)] p-0.5 bg-gradient-to-tr from-pink-600 to-rose-500">
            <img
              src="https://i.ibb.co/0R7qc34v/1093.jpg"
              alt="GB STUDY"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full p-1.5 text-white shadow-lg border border-[#120517]">
            <Send className="w-3.5 h-3.5 fill-current" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Join <span className="text-pink-500 drop-shadow-[0_0_12px_rgba(236,72,153,0.6)]">GB STUDY</span> Telegram Channel
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-pink-100/80 mt-2 mb-5 leading-relaxed">
          Stay connected with <strong className="text-pink-300">GB STUDY</strong> for free live class links, class PDF notes, daily practice problems (DPP), test updates, and instant batch notifications!
        </p>

        {/* Feature bullet highlights in pink boxes */}
        <div className="grid grid-cols-2 gap-2 text-left mb-6">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-[11px] font-semibold text-pink-200">
            <Bell className="w-4 h-4 text-pink-400 shrink-0" />
            <span>Instant Class Alerts</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-[11px] font-semibold text-pink-200">
            <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0" />
            <span>Direct PDF Notes</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleJoinTelegram}
            className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-sm tracking-wide shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:shadow-[0_0_28px_rgba(236,72,153,0.7)] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
          >
            <Send className="w-4 h-4 fill-current" />
            Join Telegram
          </button>
          <button
            onClick={onClose}
            className="py-3 px-6 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-200 font-bold text-sm transition-all cursor-pointer active:scale-98"
          >
            Close
          </button>
        </div>

        <p className="text-[10px] text-pink-300/60 mt-4 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-pink-400" />
          Official Channel: @GBFreestudy
        </p>
      </div>
    </div>
  );
};
