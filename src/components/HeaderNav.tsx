import React from 'react';
import { ChevronLeft, Share2, Sparkles, Plus } from 'lucide-react';

interface HeaderNavProps {
  onRefresh: () => void;
  onOpenAddBirthday: () => void;
  onOpenAi: () => void;
  onOpenShare: () => void;
  isRealtime: boolean;
  onToggleRealtime: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  onRefresh,
  onOpenAddBirthday,
  onOpenAi,
  onOpenShare,
  isRealtime,
  onToggleRealtime,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#141417]/95 backdrop-blur-xl border-b border-slate-800/80 text-white">
      {/* Left button: Add Birthday / Time Ju */}
      <button
        type="button"
        onClick={onOpenAddBirthday}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#1C1C1E] border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all shadow-sm text-xs font-semibold"
        title="添加生日/时间局"
      >
        <Plus className="w-4 h-4 text-purple-400 stroke-[2.5]" />
        <span>添加</span>
      </button>

      {/* Center Title */}
      <div className="flex items-center gap-2 cursor-pointer select-none" onClick={onToggleRealtime}>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[17px] font-bold tracking-tight text-white">五行时局</span>
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold bg-[#1C1C1E] text-slate-300 rounded-md border border-slate-700">
              奇门
            </span>
          </div>
          <span className="text-[10px] font-medium text-slate-500 tracking-wider">iOS 专业版 2.0</span>
        </div>
        {isRealtime && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30 shadow-[0_0_12px_rgba(34,197,94,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>即时</span>
          </span>
        )}
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenAi}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-400 bg-blue-950/50 rounded-full border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.25)] active:scale-95 transition-transform"
          title="AI局象解析"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>解局</span>
        </button>

        <button
          type="button"
          onClick={onOpenShare}
          className="w-9 h-9 rounded-full bg-[#1C1C1E] border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white active:scale-95 transition-all shadow-sm"
          title="分享/保存排盘"
        >
          <Share2 className="w-4 h-4 stroke-[2]" />
        </button>
      </div>
    </header>
  );
};
