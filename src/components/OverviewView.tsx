import React from 'react';
import { TimeJuChartData } from '../types';
import { ELEMENT_COLORS, ELEMENT_NAMES } from '../utils/baziEngine';
import { Info, Sparkles, ChevronRight, Compass } from 'lucide-react';

interface OverviewViewProps {
  chartData: TimeJuChartData;
  onSelectInteractions?: () => void;
  onOpenStemInfo?: (char: string, type: 'stem' | 'branch' | 'god') => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  chartData,
  onSelectInteractions,
  onOpenStemInfo,
}) => {
  const { overviewPillars, solarTerms, stemHints, branchHints, dominantElement, favoredElement } = chartData;
  const pillars = [
    { title: '年柱', data: overviewPillars.year, tag: '年' },
    { title: '月柱', data: overviewPillars.month, tag: '月' },
    { title: '日柱', data: overviewPillars.day, tag: '日', isFocus: true },
    { title: '时柱', data: overviewPillars.hour, tag: '时' },
  ];

  return (
    <div className="flex flex-col gap-3 px-3 pb-8 text-slate-200">
      {/* 1. Main 4 Pillars Matrix Card */}
      <div className="rounded-3xl bg-[#141417] border border-slate-800/80 p-4 shadow-2xl shadow-black/50 backdrop-blur-md">
        {/* Table Header: 日期, 年柱, 月柱, 日柱, 时柱 */}
        <div className="grid grid-cols-5 text-center text-[13px] font-bold text-slate-400 pb-2.5 border-b border-slate-800/80">
          <div className="text-slate-500 font-medium">四柱</div>
          {pillars.map((p, idx) => (
            <div key={idx} className={`flex items-center justify-center gap-1 ${p.isFocus ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>
              <span>{p.title}</span>
            </div>
          ))}
        </div>

        {/* Row 1: 主星 (Main Ten God) */}
        <div className="grid grid-cols-5 text-center py-2.5 items-center text-[13px] text-slate-300 border-b border-slate-800/40">
          <div className="text-slate-500 font-medium text-xs">主星</div>
          {pillars.map((p, idx) => (
            <div
              key={idx}
              onClick={() => onOpenStemInfo?.(p.data.stemGod, 'god')}
              className="cursor-pointer hover:text-white font-medium transition-colors"
            >
              <span className="px-1.5 py-0.5 rounded-md bg-[#1C1C1E] border border-slate-800 text-xs">
                {p.data.stemGod}
              </span>
            </div>
          ))}
        </div>

        {/* Row 2: 天干 (Large Five-Elements Colored Characters) */}
        <div className="grid grid-cols-5 text-center py-3 items-center border-b border-slate-800/40">
          <div className="text-xs text-slate-500 font-medium">天干</div>
          {pillars.map((p, idx) => {
            const color = ELEMENT_COLORS[p.data.stemElement];
            return (
              <div
                key={idx}
                onClick={() => onOpenStemInfo?.(p.data.stem, 'stem')}
                className="flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 group select-none"
              >
                <span
                  className={`text-[34px] font-extrabold leading-none ${color.text}`}
                  style={{ textShadow: `0 0 16px ${color.glow}` }}
                >
                  {p.data.stem}
                </span>
                <span className={`mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${color.badge}`}>
                  {ELEMENT_NAMES[p.data.stemElement]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Row 3: 地支 (Large Five-Elements Colored Characters) */}
        <div className="grid grid-cols-5 text-center py-3 items-center">
          <div className="text-xs text-slate-500 font-medium">地支</div>
          {pillars.map((p, idx) => {
            const color = ELEMENT_COLORS[p.data.branchElement];
            return (
              <div
                key={idx}
                onClick={() => onOpenStemInfo?.(p.data.branch, 'branch')}
                className="flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 group select-none"
              >
                <span
                  className={`text-[34px] font-extrabold leading-none ${color.text}`}
                  style={{ textShadow: `0 0 16px ${color.glow}` }}
                >
                  {p.data.branch}
                </span>
                <span className={`mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${color.badge}`}>
                  {ELEMENT_NAMES[p.data.branchElement]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Hidden Stems (藏干) Card */}
      <div className="rounded-3xl bg-[#141417] border border-slate-800/80 p-3.5 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="grid grid-cols-5 text-center items-center">
          <div className="text-xs text-slate-500 font-medium self-center">藏干</div>
          {pillars.map((p, idx) => (
            <div key={idx} className="flex flex-col gap-1 text-[12px] items-center">
              {p.data.hiddenStems.map((hs, hIdx) => {
                const color = ELEMENT_COLORS[hs.element];
                return (
                  <span
                    key={hIdx}
                    className={`font-semibold tracking-wide ${color.text}`}
                  >
                    {hs.stem}{hs.elementName}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Secondary Gods (副星) Card */}
      <div className="rounded-3xl bg-[#141417] border border-slate-800/80 p-3.5 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="grid grid-cols-5 text-center items-center">
          <div className="text-xs text-slate-500 font-medium self-center">副星</div>
          {pillars.map((p, idx) => (
            <div key={idx} className="flex flex-col gap-1 text-[12px] text-slate-300 items-center">
              {p.data.secondaryGods.map((sg, sIdx) => (
                <span key={sIdx} className="font-normal text-slate-400">
                  {sg}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Solar Terms (节气) Card */}
      <div className="rounded-3xl bg-[#141417] border border-slate-800/80 p-3.5 shadow-xl shadow-black/30 backdrop-blur-md flex items-center justify-between text-[13px]">
        <div className="text-xs text-slate-500 font-medium w-1/5 text-center">节气交令</div>
        <div className="flex-1 flex flex-col gap-1 text-slate-300 pl-4 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-sans">{solarTerms.prevTerm.name}</span>
            <span className="text-slate-200">{solarTerms.prevTerm.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-sans">{solarTerms.nextTerm.name}</span>
            <span className="text-slate-200">{solarTerms.nextTerm.time}</span>
          </div>
        </div>
      </div>

      {/* 5. Featured Prediction Banner (In the style of Elegant Dark) */}
      <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-4 flex items-center justify-between shadow-lg shadow-blue-900/30 border border-blue-400/20">
        <div className="px-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">时局预测分析</div>
          <div className="text-base sm:text-lg font-bold mt-0.5 text-white">
            {dominantElement}旺乘令 · 喜用{favoredElement}
          </div>
          <div className="text-[11px] text-white/80 mt-0.5 truncate max-w-[200px]">
            天干{stemHints.substring(0, 12)}...
          </div>
        </div>
        <button
          type="button"
          onClick={onSelectInteractions}
          className="bg-white hover:bg-slate-100 text-blue-600 px-4 py-2 rounded-2xl font-bold text-xs active:scale-95 transition-all shadow-md flex-shrink-0"
        >
          查看生克
        </button>
      </div>

      {/* 6. Time Ju Hints (【时间局提示】) Card */}
      <div className="rounded-3xl bg-[#141417] border border-slate-800/80 p-4 shadow-xl shadow-black/40 backdrop-blur-md">
        <div className="flex items-center justify-center gap-1.5 pb-3 mb-2 border-b border-slate-800 text-center">
          <span className="text-[15px] font-bold text-white tracking-wider">【时间局提示】</span>
        </div>

        <div className="flex flex-col gap-2.5 text-[13px] leading-relaxed">
          <div className="flex items-start gap-2">
            <span className="text-slate-400 flex-shrink-0 font-medium">天干提示:</span>
            <span className="text-slate-200">{stemHints}</span>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-slate-400 flex-shrink-0 font-medium">地支提示:</span>
            <span className="text-yellow-400/95 font-medium">{branchHints}</span>
          </div>
        </div>

        {chartData.allInteractions.length > 0 && (
          <button
            type="button"
            onClick={onSelectInteractions}
            className="w-full mt-3.5 py-2.5 px-3 rounded-2xl bg-[#1C1C1E] hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center justify-center gap-1.5 transition-colors active:scale-[0.99]"
          >
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>查看刑冲合害生克深度细解 ({chartData.allInteractions.length}项)</span>
          </button>
        )}
      </div>
    </div>
  );
};
