import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Check, AlertCircle, X, Sparkles } from 'lucide-react';
import { Lunar } from 'lunar-javascript';
import {
  findSolarDatesFromBaZi,
  SolarMatch,
  getCompatibleBranch,
  getCompatibleStem,
  isStemBranchCompatible,
} from '../utils/baziReverse';

export interface GanzhiSelection {
  yearGan: string;
  yearZhi: string;
  monthGan: string;
  monthZhi: string;
  dayGan: string;
  dayZhi: string;
  timeGan: string;
  timeZhi: string;
}

interface GanzhiInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: Date, ganzhi: GanzhiSelection) => void;
  initialDate?: Date;
}

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 五虎遁：根据年干和月支推算月干 (月支从寅月开始)
const WU_HU_DUN: Record<string, string[]> = {
  '甲': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
  '己': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
  '乙': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
  '庚': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
  '丙': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
  '辛': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
  '丁': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
  '壬': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
  '戊': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
  '癸': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
};

// 五鼠遁：根据日干和时支推算时干 (时支从子时开始)
const WU_SHU_DUN: Record<string, string[]> = {
  '甲': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
  '己': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
  '乙': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
  '庚': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
  '丙': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
  '辛': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
  '丁': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
  '壬': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
  '戊': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
  '癸': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
};

function getMonthGan(yearGan: string, monthZhi: string): string {
  const zhiOrder = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
  const idx = zhiOrder.indexOf(monthZhi);
  const list = WU_HU_DUN[yearGan];
  if (list && idx >= 0) {
    return list[idx];
  }
  return '戊';
}

function getTimeGan(dayGan: string, timeZhi: string): string {
  const zhiOrder = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const idx = zhiOrder.indexOf(timeZhi);
  const list = WU_SHU_DUN[dayGan];
  if (list && idx >= 0) {
    return list[idx];
  }
  return '甲';
}

type ActiveFieldKey =
  | 'yearGan'
  | 'yearZhi'
  | 'monthGan'
  | 'monthZhi'
  | 'dayGan'
  | 'dayZhi'
  | 'timeGan'
  | 'timeZhi';

export const GanzhiInputModal: React.FC<GanzhiInputModalProps> = ({
  isOpen,
  onClose,
  onSelectDate,
  initialDate = new Date(),
}) => {
  // Initialize GanZhi based on current date
  const initGanzhi = useMemo(() => {
    const lunar = Lunar.fromDate(initialDate);
    const ec = lunar.getEightChar();
    return {
      yearGan: ec.getYearGan() || '甲',
      yearZhi: ec.getYearZhi() || '子',
      monthGan: ec.getMonthGan() || '戊',
      monthZhi: ec.getMonthZhi() || '辰',
      dayGan: ec.getDayGan() || '甲',
      dayZhi: ec.getDayZhi() || '辰',
      timeGan: ec.getTimeGan() || '甲',
      timeZhi: ec.getTimeZhi() || '子',
    };
  }, [initialDate]);

  const [yearGan, setYearGan] = useState(initGanzhi.yearGan);
  const [yearZhi, setYearZhi] = useState(initGanzhi.yearZhi);
  const [monthGan, setMonthGan] = useState(initGanzhi.monthGan);
  const [monthZhi, setMonthZhi] = useState(initGanzhi.monthZhi);
  const [dayGan, setDayGan] = useState(initGanzhi.dayGan);
  const [dayZhi, setDayZhi] = useState(initGanzhi.dayZhi);
  const [timeGan, setTimeGan] = useState(initGanzhi.timeGan);
  const [timeZhi, setTimeZhi] = useState(initGanzhi.timeZhi);

  // Active highlighted cell key (default to dayZhi as in screenshot)
  const [activeField, setActiveField] = useState<ActiveFieldKey>('dayZhi');

  // Selected matching date
  const [selectedSolarIndex, setSelectedSolarIndex] = useState<number>(0);

  // Auto update when Year Gan/Zhi changes (with 60 Jiazi compatibility)
  const handleYearGanChange = (val: string) => {
    const validZhi = getCompatibleBranch(val, yearZhi);
    setYearGan(val);
    setYearZhi(validZhi);
    const newMonthGan = getMonthGan(val, monthZhi);
    setMonthGan(newMonthGan);
  };

  const handleYearZhiChange = (val: string) => {
    const validGan = getCompatibleStem(val, yearGan);
    setYearZhi(val);
    setYearGan(validGan);
    const newMonthGan = getMonthGan(validGan, monthZhi);
    setMonthGan(newMonthGan);
  };

  const handleMonthZhiChange = (val: string) => {
    setMonthZhi(val);
    const newMonthGan = getMonthGan(yearGan, val);
    setMonthGan(newMonthGan);
  };

  // Auto update when Day Gan/Zhi changes (with 60 Jiazi compatibility)
  const handleDayGanChange = (val: string) => {
    const validZhi = getCompatibleBranch(val, dayZhi);
    setDayGan(val);
    setDayZhi(validZhi);
    const newTimeGan = getTimeGan(val, timeZhi);
    setTimeGan(newTimeGan);
  };

  const handleDayZhiChange = (val: string) => {
    const validGan = getCompatibleStem(val, dayGan);
    setDayZhi(val);
    setDayGan(validGan);
    const newTimeGan = getTimeGan(validGan, timeZhi);
    setTimeGan(newTimeGan);
  };

  const handleTimeZhiChange = (val: string) => {
    setTimeZhi(val);
    const newTimeGan = getTimeGan(dayGan, val);
    setTimeGan(newTimeGan);
  };

  // Search matching solar dates across full 1900-2100 range
  const matchingSolarDates = useMemo(() => {
    const dates: SolarMatch[] = findSolarDatesFromBaZi(
      yearGan,
      yearZhi,
      monthGan,
      monthZhi,
      dayGan,
      dayZhi,
      timeGan,
      timeZhi,
      1900,
      2100
    );
    return dates;
  }, [yearGan, yearZhi, monthGan, monthZhi, dayGan, dayZhi, timeGan, timeZhi]);

  useEffect(() => {
    setSelectedSolarIndex(0);
  }, [matchingSolarDates]);

  const handleConfirmDate = (d: Date) => {
    onSelectDate(d, {
      yearGan,
      yearZhi,
      monthGan,
      monthZhi,
      dayGan,
      dayZhi,
      timeGan,
      timeZhi,
    });
    onClose();
  };

  // Check if current active field is Gan or Zhi
  const isGanField = ['yearGan', 'monthGan', 'dayGan', 'timeGan'].includes(activeField);
  const optionsList = isGanField ? HEAVENLY_STEMS : EARTHLY_BRANCHES;

  const handleSelectOption = (item: string) => {
    switch (activeField) {
      case 'yearGan':
        handleYearGanChange(item);
        break;
      case 'yearZhi':
        handleYearZhiChange(item);
        break;
      case 'monthGan':
        // monthGan is derived via 五虎遁, clicking changes yearGan / monthZhi
        setActiveField('monthZhi');
        break;
      case 'monthZhi':
        handleMonthZhiChange(item);
        break;
      case 'dayGan':
        handleDayGanChange(item);
        break;
      case 'dayZhi':
        handleDayZhiChange(item);
        break;
      case 'timeGan':
        // timeGan is derived via 五鼠遁, clicking changes timeZhi
        setActiveField('timeZhi');
        break;
      case 'timeZhi':
        handleTimeZhiChange(item);
        break;
    }
  };

  // Current value of active field
  const currentActiveValue = {
    yearGan,
    yearZhi,
    monthGan,
    monthZhi,
    dayGan,
    dayZhi,
    timeGan,
    timeZhi,
  }[activeField];

  // Helper for rendering Ganzhi box matching screenshot
  const renderBox = (
    label: string,
    fieldKey: ActiveFieldKey,
    value: string,
    showArrow: boolean = true
  ) => {
    const isActive = activeField === fieldKey;

    return (
      <div className="relative pt-1">
        <div
          onClick={() => {
            if (fieldKey === 'monthGan') {
              setActiveField('monthZhi');
            } else if (fieldKey === 'timeGan') {
              setActiveField('timeZhi');
            } else {
              setActiveField(fieldKey);
            }
          }}
          className={`relative rounded-xl border px-2.5 py-2 cursor-pointer text-center select-none transition-all duration-150 ${
            isActive
              ? 'border-[#D97AFF] bg-[#241A30] shadow-[0_0_12px_rgba(217,122,255,0.35)] ring-1 ring-[#D97AFF]'
              : 'border-[#3D334E] bg-[#1C1726] hover:border-slate-400/60'
          }`}
        >
          {/* Box Header Label floating on top border */}
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#171420] px-1.5 text-[11px] text-slate-400 font-medium leading-tight whitespace-nowrap">
            {label}
          </span>

          {/* Character + Caret */}
          <div className="flex items-center justify-center gap-1 text-[17px] font-bold text-slate-100 mt-0.5">
            <span className="tracking-wider">{value}</span>
            {showArrow && (
              <span className="text-[10px] text-slate-400 scale-90 -mr-0.5">▼</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#171420] text-white flex flex-col rounded-3xl border border-[#3A304C] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Top Title: 干支输入 */}
        <div className="relative pt-5 pb-2 text-center">
          <h3 className="text-[19px] font-bold text-slate-100 tracking-wider">干支输入</h3>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4x2 GanZhi Grid Container matching reference screenshot */}
        <div className="px-4 py-2">
          <div className="grid grid-cols-4 gap-2.5">
            {/* Row 1: 年干, 月干, 日干, 时干 */}
            {renderBox('年干', 'yearGan', yearGan, true)}
            {renderBox('月干', 'monthGan', monthGan, false)}
            {renderBox('日干', 'dayGan', dayGan, true)}
            {renderBox('时干', 'timeGan', timeGan, false)}

            {/* Row 2: 年支, 月支, 日支, 时支 */}
            {renderBox('年支', 'yearZhi', yearZhi, true)}
            {renderBox('月支', 'monthZhi', monthZhi, true)}
            {renderBox('日支', 'dayZhi', dayZhi, true)}
            {renderBox('时支', 'timeZhi', timeZhi, true)}
          </div>

          {/* Quick Selection Options Buttons */}
          <div className="mt-4 p-2.5 rounded-2xl bg-[#1F192B] border border-[#352B47]">
            <div className="text-[11px] text-slate-400 mb-1.5 px-1 flex items-center justify-between">
              <span>选择{isGanField ? '天干' : '地支'}：</span>
              <span className="text-purple-300 font-semibold">当前选中: {currentActiveValue}</span>
            </div>
            <div className={`grid gap-1.5 ${isGanField ? 'grid-cols-5' : 'grid-cols-6'}`}>
              {optionsList.map(opt => {
                const isSelected = currentActiveValue === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`py-1.5 rounded-xl text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-[#8B5CF6] text-white shadow-md shadow-purple-900/40 scale-105 ring-1 ring-purple-300'
                        : 'bg-[#292238] text-slate-300 hover:bg-[#342C47]'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Prompt: 点击选择公历时间 */}
        <div className="px-5 pt-3 pb-1.5 text-center">
          <p className="text-xs text-slate-400 font-medium tracking-wide">点击选择公历时间</p>
        </div>

        {/* Solar Date Result Cards */}
        <div className="px-4 pb-3 space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
          {matchingSolarDates.length > 0 ? (
            matchingSolarDates.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedSolarIndex(idx);
                  handleConfirmDate(item.date);
                }}
                className={`w-full rounded-2xl p-3.5 flex items-center gap-3.5 cursor-pointer border transition-all ${
                  selectedSolarIndex === idx
                    ? 'bg-[#2B233D] border-[#D97AFF] shadow-lg ring-1 ring-[#D97AFF]'
                    : 'bg-[#211B2D] border-[#3B324D] hover:border-slate-400'
                }`}
              >
                {/* Calendar Icon Box */}
                <div className="w-10 h-10 rounded-xl bg-[#2A2338] border border-[#44385B] flex items-center justify-center text-slate-200 flex-shrink-0">
                  <Calendar className="w-5 h-5 text-slate-200 stroke-[1.8]" />
                </div>

                {/* Date text display */}
                <div className="flex-1 text-left">
                  <div className="text-base font-bold text-slate-100 tracking-wide font-mono">
                    {item.display}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>公历</span>
                    <span className="text-[11px] text-purple-300/80 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">
                      {item.year}年
                    </span>
                  </div>
                </div>

                {selectedSolarIndex === idx && (
                  <Check className="w-5 h-5 text-[#D97AFF] stroke-[2.5]" />
                )}
              </div>
            ))
          ) : (
            <div className="p-4 rounded-2xl bg-[#201A2C] border border-[#382E4B] text-center text-xs text-slate-400 space-y-1">
              <AlertCircle className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <div className="text-slate-300 font-medium">当前干支组合在搜索区间内无完全对应公历日期</div>
              <div className="text-[11px] text-slate-500">提示：月干由五虎遁决定，时干由五鼠遁决定</div>
            </div>
          )}
        </div>

        {/* Footer Cancel / Confirm */}
        <div className="px-4 pb-4 pt-1 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full bg-[#272036] hover:bg-[#322A45] text-slate-300 text-sm font-medium transition-colors"
          >
            取消
          </button>
          {matchingSolarDates.length > 0 && (
            <button
              type="button"
              onClick={() => handleConfirmDate(matchingSolarDates[selectedSolarIndex].date)}
              className="flex-1 py-2.5 rounded-full bg-[#7C3AED] hover:bg-[#8B5CF6] active:bg-[#6D28D9] text-white text-sm font-bold transition-all shadow-md shadow-purple-950/40"
            >
              确定应用
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
