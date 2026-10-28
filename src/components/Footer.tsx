import React from 'react';
import { Send, Heart, BookOpen, ShieldCheck, Sparkles } from 'lucide-react';

interface FooterProps {
  onOpenTelegram: () => void;
  onSelectCategory?: (category: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTelegram, onSelectCategory }) => {
  return (
    <footer className="w-full bg-[#0d0512] border-t border-pink-500/20 pt-12 pb-8 mt-16 text-pink-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Telegram Hero Strip */}
        <div className="rounded-3xl bg-gradient-to-r from-pink-900/40 via-purple-950/40 to-pink-900/40 border border-pink-500/30 p-6 sm:p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(236,72,153,0.15)]">
          <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.4)] p-0.5 bg-gradient-to-tr from-pink-600 to-rose-500 shrink-0">
              <img
                src="https://i.ibb.co/0R7qc34v/1093.jpg"
                alt="GB STUDY"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                Join <span className="text-pink-400">GB STUDY</span> Official Telegram
              </h3>
              <p className="text-xs sm:text-sm text-pink-200/70 mt-1">
                Get real-time updates for new classes, test series, class notes PDF, and DPP sheets.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenTelegram}
            className="py-3 px-6 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4 fill-current" />
            <span>Join @GBFreestudy</span>
          </button>
        </div>

        {/* Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-pink-500/15">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src="https://i.ibb.co/0R7qc34v/1093.jpg"
                alt="GB STUDY"
                className="w-8 h-8 rounded-xl object-cover border border-pink-500/40"
              />
              <span className="text-xl font-black text-white">
                GB <span className="text-pink-500">STUDY</span>
              </span>
            </div>
            <p className="text-xs text-pink-200/70 leading-relaxed">
              Your comprehensive educational hub for all government competitive exams including SSC CGL, CHSL, Railway, UP Police, State Exams, and Skill Courses.
            </p>
            <div className="flex items-center gap-2 text-xs text-pink-400 font-semibold pt-1">
              <ShieldCheck className="w-4 h-4 text-pink-500" />
              <span>100% Free Access &bull; No Login Required</span>
            </div>
          </div>

          {/* Popular Categories */}
          <div>
            <h4 className="text-xs font-black uppercase text-pink-400 tracking-wider mb-3">
              Batch Categories
            </h4>
            <ul className="space-y-2 text-xs">
              {['Maths Special', 'Railway Vande Bharat', 'SSC CGL / GD', 'State / UP Police', 'Reasoning Special', 'GS & Static GK'].map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => onSelectCategory && onSelectCategory(cat.split(' ')[0])}
                    className="hover:text-pink-300 transition-colors cursor-pointer text-left"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct Support & Updates */}
          <div>
            <h4 className="text-xs font-black uppercase text-pink-400 tracking-wider mb-3">
              Community & Updates
            </h4>
            <p className="text-xs text-pink-200/70 mb-3 leading-relaxed">
              Follow our Telegram channel for the fastest updates on newly unlocked classes, test series, and PDFs.
            </p>
            <a
              href="https://t.me/GBFreestudy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-pink-400 hover:text-pink-300 underline"
            >
              <Send className="w-3.5 h-3.5" /> t.me/GBFreestudy
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-pink-300/50">
          <p>&copy; {new Date().getFullYear()} GB STUDY. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Designed for ambitious students with <Heart className="w-3.5 h-3.5 text-pink-500 fill-current" />
          </p>
        </div>
      </div>
    </footer>
  );
};
