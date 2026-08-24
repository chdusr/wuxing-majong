import React from 'react';
import { X, ShieldAlert, Sparkles } from 'lucide-react';
import { TimeJuChartData } from '../types';

interface InteractionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartData: TimeJuChartData;
}

export const InteractionsModal: React.FC<InteractionsModalProps> = ({
  isOpen,
  onClose,
  chartData,
}) => {
  if (!isOpen) return null;

  const { allInteractions, stemHints, branchHints } = chartData;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#141417] border border-slate-800 rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl p-5 text-white max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-blue-950/60 text-blue-400 border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.3)]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">局中干支生克与刑冲合害</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-[#1C1C1E] border border-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overview banner */}
        <div className="mt-3 p-3.5 rounded-2xl bg-[#1C1C1E] border border-slate-800 text-xs leading-relaxed space-y-1.5 shadow-inner">
          <div><span className="text-slate-500 font-medium">天干简要：</span><span className="text-slate-300">{stemHints}</span></div>
          <div><span className="text-slate-500 font-medium">地支简要：</span><span className="text-yellow-400 font-semibold">{branchHints}</span></div>
        </div>

        {/* Detailed Interaction Items */}
        <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2.5">
          {allInteractions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              全局各柱干支生克中和，无明显剧烈刑冲合害，气场平顺稳健。
            </div>
          ) : (
            allInteractions.map((item, idx) => {
              let badgeColor = 'bg-blue-950/50 text-blue-400 border-blue-500/30';
              if (item.type === '自刑' || item.type === '刑') {
                badgeColor = 'bg-red-950/50 text-red-400 border-red-500/30';
              } else if (item.type === '暗合' || item.type === '合') {
                badgeColor = 'bg-green-950/50 text-green-400 border-green-500/30';
              } else if (item.type === '害' || item.type === '破') {
                badgeColor = 'bg-yellow-950/50 text-yellow-400 border-yellow-500/30';
              }

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeColor}`}>
                      {item.type}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-100">
                      {item.description}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
