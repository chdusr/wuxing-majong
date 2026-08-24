import React from 'react';

export type TabType = 'overview' | 'detailed';

interface SegmentedTabsProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

export const SegmentedTabs: React.FC<SegmentedTabsProps> = ({
  activeTab,
  onChange,
}) => {
  return (
    <div className="mx-3 mb-3 p-1 rounded-2xl bg-[#141417] border border-slate-800 flex items-center justify-between text-sm shadow-inner">
      <button
        type="button"
        onClick={() => onChange('overview')}
        className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 font-bold text-xs tracking-wide transition-all duration-200 ${
          activeTab === 'overview'
            ? 'bg-[#1C1C1E] text-white shadow-md border border-slate-700/80 scale-[1.01]'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${activeTab === 'overview' ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-700'}`} />
        <span>四柱总览</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('detailed')}
        className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 font-bold text-xs tracking-wide transition-all duration-200 ${
          activeTab === 'detailed'
            ? 'bg-[#1C1C1E] text-white shadow-md border border-slate-700/80 scale-[1.01]'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${activeTab === 'detailed' ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-700'}`} />
        <span>多柱与大运流年</span>
      </button>
    </div>
  );
};
