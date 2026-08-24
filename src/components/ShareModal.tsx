import React, { useState } from 'react';
import { X, Copy, Check, Share2, Sparkles, Download } from 'lucide-react';
import { TimeJuChartData } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartData: TimeJuChartData;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  chartData,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const { overviewPillars, stemHints, branchHints, dominantElement, favoredElement } = chartData;

  const summaryText = `【五行时间局排盘】
- 局造：${chartData.genderLabel} (${chartData.xunShou}) ${chartData.zodiac} · ${chartData.strokeCount}划
- 农历：${chartData.lunarText}
- 公历：${chartData.gregorianDateStr}
- 四柱：年【${overviewPillars.year.stem}${overviewPillars.year.branch}】月【${overviewPillars.month.stem}${overviewPillars.month.branch}】日【${overviewPillars.day.stem}${overviewPillars.day.branch}】时【${overviewPillars.hour.stem}${overviewPillars.hour.branch}】
- 主星：年【${overviewPillars.year.stemGod}】月【${overviewPillars.month.stemGod}】日【${overviewPillars.day.stemGod}】时【${overviewPillars.hour.stemGod}】
- 天干提示：${stemHints}
- 地支提示：${branchHints}
- 五行能量：最旺【${dominantElement}】，调候喜用【${favoredElement}】`;

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#141417] border border-slate-800 rounded-3xl shadow-2xl p-5 text-white animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-500/30">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">分享时间局</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-[#1C1C1E] border border-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card preview */}
        <div className="mt-4 p-4 rounded-2xl bg-[#0A0A0B] border border-slate-800 text-xs leading-relaxed font-mono whitespace-pre-wrap text-slate-300 shadow-inner">
          {summaryText}
        </div>

        {/* Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-900/30 active:scale-[0.99]"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制排盘文本' : '复制排盘摘要'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
