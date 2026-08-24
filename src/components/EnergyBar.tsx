import React, { useState } from 'react';
import { TimeJuChartData } from '../types';
import { ELEMENT_COLORS, ELEMENT_NAMES } from '../utils/baziEngine';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface EnergyBarProps {
  chartData: TimeJuChartData;
}

const ELEMENT_TIPS: Record<string, string> = {
  '木': '肝气舒发，宜修身养性，利于谋划布局、文书创意。',
  '火': '心火宣畅，行事敏捷热情，利于商务公关与品牌传播。',
  '土': '脾胃敦厚，沉着稳健守信，利于资产沉淀与团队协作。',
  '金': '肺气清肃，意志坚定果决，利于决断执行与规整制度。',
  '水': '肾气涵养，智谋灵动通达，利于资本流动与商机洞察。',
};

export const EnergyBar: React.FC<EnergyBarProps> = ({ chartData }) => {
  const { fiveElementsStats, dominantElement, favoredElement } = chartData;
  const [showGraph, setShowGraph] = useState(false);

  const elements: Array<{ key: 'wood' | 'fire' | 'earth' | 'metal' | 'water'; name: string }> = [
    { key: 'wood', name: '木' },
    { key: 'fire', name: '火' },
    { key: 'earth', name: '土' },
    { key: 'metal', name: '金' },
    { key: 'water', name: '水' },
  ];

  return (
    <div className="mx-3 mb-3 p-4 rounded-3xl bg-[#141417] border border-slate-800/80 shadow-2xl shadow-black/40 backdrop-blur-md transition-all">
      <div className="flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200 tracking-wide text-[13px]">五行能量分布</span>
          <button
            type="button"
            onClick={() => setShowGraph(!showGraph)}
            className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium px-2 py-0.5 rounded-full bg-blue-950/40 border border-blue-500/20 transition-colors"
          >
            <span>{showGraph ? '收起生克图' : '相生相克图'}</span>
            {showGraph ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-400">
            当旺: <strong className="text-yellow-400 font-bold">{dominantElement}旺</strong>
          </span>
          <span className="text-slate-400">
            喜用: <strong className="text-emerald-400 font-bold">{favoredElement}</strong>
          </span>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-5 gap-2">
        {elements.map((el) => {
          const val = fiveElementsStats[el.key];
          const colors = ELEMENT_COLORS[el.key];
          return (
            <div key={el.key} className="flex flex-col items-center gap-1.5">
              <div className="w-full bg-[#1C1C1E] h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(val, 8)}%`,
                    backgroundColor: colors.hex,
                    boxShadow: `0 0 10px ${colors.glow}`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between w-full text-[11px] px-0.5">
                <span className={`font-bold ${colors.text}`}>{el.name}</span>
                <span className="text-slate-400 font-mono text-[10px]">{val}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expandable Elegant Dark Pentagram Cycle Diagram */}
      {showGraph && (
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="text-[11px] tracking-[0.2em] text-slate-500 font-bold mb-3 uppercase">
            五行相生相克生息流转
          </div>
          
          <div className="relative w-56 h-56 my-2">
            {/* SVG Connecting lines (Outer Circle: Sheng, Inner Star: Ke) */}
            <svg className="w-full h-full opacity-30 absolute inset-0" viewBox="0 0 100 100">
              {/* Pentagram border (相生) */}
              <polygon
                points="50,14 84,39 71,80 29,80 16,39"
                fill="none"
                stroke="#60A5FA"
                strokeWidth="0.8"
              />
              {/* Inner star (相克) */}
              <polygon
                points="50,14 71,80 16,39 84,39 29,80"
                fill="none"
                stroke="#FACC15"
                strokeDasharray="2,2"
                strokeWidth="0.8"
              />
            </svg>

            {/* Fire (火) - Top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-11 h-11 bg-red-500 rounded-full flex flex-col items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-red-300/40 text-white select-none">
              <span className="font-bold text-xs">火</span>
              <span className="text-[8px] opacity-80 leading-none">{fiveElementsStats.fire}%</span>
            </div>

            {/* Earth (土) - Top Right */}
            <div className="absolute top-[32%] right-0 w-11 h-11 bg-yellow-500 rounded-full flex flex-col items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.5)] border border-yellow-200/40 text-black select-none">
              <span className="font-bold text-xs">土</span>
              <span className="text-[8px] opacity-80 leading-none">{fiveElementsStats.earth}%</span>
            </div>

            {/* Metal (金) - Bottom Right */}
            <div className="absolute bottom-1 right-6 w-11 h-11 bg-slate-100 rounded-full flex flex-col items-center justify-center shadow-[0_0_20px_rgba(241,245,249,0.5)] border border-white text-black select-none">
              <span className="font-bold text-xs">金</span>
              <span className="text-[8px] opacity-80 leading-none">{fiveElementsStats.metal}%</span>
            </div>

            {/* Water (水) - Bottom Left */}
            <div className="absolute bottom-1 left-6 w-11 h-11 bg-blue-500 rounded-full flex flex-col items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-blue-300/40 text-white select-none">
              <span className="font-bold text-xs">水</span>
              <span className="text-[8px] opacity-80 leading-none">{fiveElementsStats.water}%</span>
            </div>

            {/* Wood (木) - Top Left */}
            <div className="absolute top-[32%] left-0 w-11 h-11 bg-green-500 rounded-full flex flex-col items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.5)] border border-green-300/40 text-white select-none">
              <span className="font-bold text-xs">木</span>
              <span className="text-[8px] opacity-80 leading-none">{fiveElementsStats.wood}%</span>
            </div>
          </div>

          <div className="mt-3 text-center px-4 py-2 rounded-2xl bg-[#1C1C1E] border border-slate-800 w-full">
            <div className="text-xs font-semibold text-slate-300">
              今日主运：<span className="text-yellow-400 font-bold">{dominantElement}旺</span> · 调候喜用：<span className="text-emerald-400 font-bold">{favoredElement}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {ELEMENT_TIPS[dominantElement] || '气场生生不息，动静结合，顺应天时。'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
