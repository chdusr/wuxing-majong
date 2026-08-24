import React, { useState } from 'react';
import { TimeJuChartData } from '../types';
import { ELEMENT_COLORS } from '../utils/baziEngine';

interface DetailedViewProps {
  chartData: TimeJuChartData;
  onOpenStemInfo?: (char: string, type: 'stem' | 'branch' | 'god') => void;
}

export const DetailedView: React.FC<DetailedViewProps> = ({
  chartData,
  onOpenStemInfo,
}) => {
  const [selectedDaYunIdx, setSelectedDaYunIdx] = useState<number>(0);
  const [selectedLiuNianYear, setSelectedLiuNianYear] = useState<number>(
    chartData.liuNianList[0]?.year || 2026
  );

  const { detailedColumns, liuYue, daYunList, liuNianList } = chartData;

  return (
    <div className="flex flex-col gap-3 px-3 pb-8 text-slate-200">
      {/* 1. Master Multi-Column Grid (流年, 小运, 年柱, 月柱, 日柱, 时柱) */}
      <div className="rounded-3xl bg-[#141417] border border-slate-800/80 p-3.5 shadow-2xl shadow-black/50 backdrop-blur-md overflow-x-auto">
        <div className="min-w-[340px]">
          {/* Header Row: 日期 | 流年 | 小运 | 年柱 | 月柱 | 日柱 | 时柱 */}
          <div className="grid grid-cols-7 text-center text-[12px] font-bold text-slate-400 pb-2 border-b border-slate-800/80">
            <div className="text-slate-500 font-medium">六柱</div>
            {detailedColumns.map((col, idx) => (
              <div key={idx} className="truncate">
                {col.header}
              </div>
            ))}
          </div>

          {/* Age Row (岁) */}
          <div className="grid grid-cols-7 text-center py-1.5 text-[11px] text-slate-400 border-b border-slate-800/40">
            <div className="text-slate-500 font-medium">虚岁</div>
            {detailedColumns.map((col, idx) => (
              <div key={idx} className="text-slate-400 font-mono">
                {col.age || ''}
              </div>
            ))}
          </div>

          {/* Year/Time Row (年) */}
          <div className="grid grid-cols-7 text-center py-1.5 text-[11px] text-slate-300 font-mono border-b border-slate-800/40">
            <div className="text-slate-500 font-sans font-medium">年份</div>
            {detailedColumns.map((col, idx) => (
              <div key={idx} className="truncate text-slate-300">
                {col.yearOrVal}
              </div>
            ))}
          </div>

          {/* Heavenly Stems (天干) with micro badges */}
          <div className="grid grid-cols-7 text-center py-2.5 items-center border-b border-slate-800/40">
            <div className="text-xs text-slate-500 font-medium">天干</div>
            {detailedColumns.map((col, idx) => {
              const color = ELEMENT_COLORS[col.pillar.stemElement];
              return (
                <div key={idx} className="flex flex-col items-center justify-center relative">
                  <div className="relative">
                    <span
                      onClick={() => onOpenStemInfo?.(col.pillar.stem, 'stem')}
                      className={`text-[26px] font-extrabold leading-none select-none cursor-pointer transition-transform hover:scale-105 active:scale-95 ${color.text}`}
                      style={{ textShadow: `0 0 12px ${color.glow}` }}
                    >
                      {col.pillar.stem}
                    </span>

                    {/* Micro Ten Gods Badges beside stem */}
                    <div className="absolute -top-1.5 -right-3 flex flex-col text-[8px] leading-[9px] text-slate-400 font-mono scale-90">
                      {col.pillar.stemMicroGods?.map((g, gIdx) => (
                        <span key={gIdx} className="opacity-80">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Earthly Branches (地支) */}
          <div className="grid grid-cols-7 text-center py-2.5 items-center border-b border-slate-800/40">
            <div className="text-xs text-slate-500 font-medium">地支</div>
            {detailedColumns.map((col, idx) => {
              const color = ELEMENT_COLORS[col.pillar.branchElement];
              const isHighlighted = col.pillar.isHighlighted;
              return (
                <div key={idx} className="flex items-center justify-center">
                  <span
                    onClick={() => onOpenStemInfo?.(col.pillar.branch, 'branch')}
                    className={`text-[26px] font-extrabold leading-none select-none cursor-pointer transition-transform hover:scale-105 active:scale-95 ${color.text} ${
                      isHighlighted ? 'text-blue-400 font-extrabold px-1 rounded' : ''
                    }`}
                    style={{ textShadow: `0 0 12px ${color.glow}` }}
                  >
                    {isHighlighted ? `(${col.pillar.branch})` : col.pillar.branch}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chang Sheng (长生宫) */}
          <div className="grid grid-cols-7 text-center py-2 text-[12px] text-slate-300 border-b border-slate-800/40">
            <div className="text-slate-500 text-[11px] leading-tight font-medium">长生</div>
            {detailedColumns.map((col, idx) => (
              <div key={idx} className="text-slate-300 text-xs">
                {col.pillar.changSheng}
              </div>
            ))}
          </div>

          {/* Kong Wang (空亡) */}
          <div className="grid grid-cols-7 text-center py-2 text-[12px] text-slate-400">
            <div className="text-slate-500 text-[11px] leading-tight font-medium">空亡</div>
            {detailedColumns.map((col, idx) => (
              <div key={idx} className="text-slate-400 font-mono text-xs">
                {col.pillar.kongWang}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Monthly Luck (流月) 12 Months Ribbon */}
      <div className="rounded-3xl bg-[#141417] border border-slate-800/80 p-3.5 shadow-xl shadow-black/30 backdrop-blur-md overflow-x-auto">
        <div className="flex flex-col gap-2 min-w-[320px]">
          {/* Row 1: 流月干 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium w-12 flex-shrink-0">流月干</span>
            <div className="flex-1 grid grid-cols-12 text-center text-[15px] font-bold">
              {liuYue.map((item, idx) => {
                const color = ELEMENT_COLORS[item.stemElement];
                return (
                  <span key={idx} className={`${color.text}`}>
                    {item.stem}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Row 2: 流月支 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium w-12 flex-shrink-0">流月支</span>
            <div className="flex-1 grid grid-cols-12 text-center text-[15px] font-bold">
              {liuYue.map((item, idx) => {
                const color = ELEMENT_COLORS[item.branchElement];
                return (
                  <span key={idx} className={`${color.text}`}>
                    {item.branch}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Major Luck Cycles (大运) */}
      <div className="rounded-3xl bg-[#141417] border border-slate-800/80 p-3.5 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 font-medium w-10 flex-shrink-0">大运</div>
          <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {daYunList.map((dy, idx) => {
              const isSelected = selectedDaYunIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDaYunIdx(idx)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center px-3 py-2 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-blue-950/60 border-blue-500/60 shadow-lg shadow-blue-900/30'
                      : 'bg-[#1C1C1E] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 font-mono">{dy.ageRange}</span>
                  {!dy.isXiaoYun && (
                    <span className="text-[9px] text-slate-500 font-mono">{dy.startYear}</span>
                  )}
                  <div className="flex items-center gap-0.5 text-[15px] font-bold mt-0.5">
                    {dy.isXiaoYun ? (
                      <span className="text-slate-300 text-xs py-0.5 font-medium">小运</span>
                    ) : (
                      <>
                        <span className={ELEMENT_COLORS[dy.stemElement].text}>{dy.stem}</span>
                        <span className={ELEMENT_COLORS[dy.branchElement].text}>{dy.branch}</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Annual Luck (流年) */}
      <div className="rounded-3xl bg-[#141417] border border-slate-800/80 p-3.5 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 font-medium w-10 flex-shrink-0">流年</div>
          <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {liuNianList.map((ln, idx) => {
              const isSelected = selectedLiuNianYear === ln.year;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedLiuNianYear(ln.year)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center px-3.5 py-2 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-blue-950/60 border-blue-500/60 shadow-lg shadow-blue-900/30'
                      : 'bg-[#1C1C1E] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[11px] text-slate-400 font-mono">{ln.year}</span>
                  <div className="flex items-center gap-0.5 text-[15px] font-bold mt-0.5">
                    <span className={ELEMENT_COLORS[ln.stemElement].text}>{ln.stem}</span>
                    <span className={ELEMENT_COLORS[ln.branchElement].text}>{ln.branch}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
