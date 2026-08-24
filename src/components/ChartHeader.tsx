import React from 'react';
import { TimeJuChartData } from '../types';
import { Calendar, RefreshCw, ChevronRight, MapPin, User } from 'lucide-react';

interface ChartHeaderProps {
  chartData: TimeJuChartData;
  onToggleGender: () => void;
  onOpenDatePicker: () => void;
  onOpenAddBirthday?: () => void;
  onRefreshNow: () => void;
  isRealtime: boolean;
}

export const ChartHeader: React.FC<ChartHeaderProps> = ({
  chartData,
  onToggleGender,
  onOpenDatePicker,
  onOpenAddBirthday,
  onRefreshNow,
  isRealtime,
}) => {
  const isMale = chartData.gender === 'male';

  return (
    <div className="relative mx-3 mt-2 mb-3 p-4 rounded-3xl bg-[#141417] border border-slate-800/80 shadow-2xl shadow-black/60">
      <div className="flex items-center gap-3.5">
        {/* Gender Icon / Switcher */}
        <button
          type="button"
          onClick={onToggleGender}
          className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-all transform active:scale-95 shadow-md ${
            isMale
              ? 'bg-blue-950/60 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.25)]'
              : 'bg-red-950/60 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
          }`}
          title="点击切换 乾造/坤造"
        >
          {isMale ? '♂' : '♀'}
        </button>

        {/* Info Column */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[15px] font-bold text-white tracking-wide">
            {chartData.profileName && (
              <span
                onClick={onOpenAddBirthday}
                className="cursor-pointer px-2 py-0.5 rounded-lg bg-purple-950/50 border border-purple-500/40 text-purple-300 hover:bg-purple-900/50 transition-colors flex items-center gap-1"
              >
                <User className="w-3 h-3 text-purple-400" />
                <span>{chartData.profileName}</span>
              </span>
            )}
            <span
              onClick={onToggleGender}
              className="cursor-pointer px-2 py-0.5 rounded-lg bg-[#1C1C1E] border border-slate-800 text-slate-100 hover:border-slate-700 transition-colors"
            >
              {chartData.genderLabel}
            </span>
            <span className="text-slate-400 font-medium">{chartData.chartTypeLabel}</span>
            <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-bold border border-yellow-500/20">
              {chartData.strokeCount}划
            </span>
            <span className="text-slate-300 font-semibold">{chartData.xunShou}</span>
            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
              {chartData.zodiac}
            </span>
            {chartData.cityName && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 text-[11px] font-medium border border-blue-500/20 flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />
                <span>{chartData.cityName}</span>
              </span>
            )}
          </div>

          <div
            onClick={onOpenDatePicker}
            className="mt-1.5 text-[13px] text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors group"
            title="点击修改时辰日期"
          >
            <span className="truncate group-hover:text-blue-400 transition-colors">{chartData.lunarText}</span>
            <Calendar className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 flex-shrink-0" />
            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400 flex-shrink-0" />
          </div>
        </div>

        {/* Quick Actions on the Right */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={onRefreshNow}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
              isRealtime
                ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                : 'bg-[#1C1C1E] hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
            title="重置到当下即时时辰"
          >
            <RefreshCw className={`w-4 h-4 ${isRealtime ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          </button>
        </div>
      </div>
    </div>
  );
};
