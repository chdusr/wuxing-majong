import React, { useState } from 'react';
import { X, Clock, Calendar, ChevronRight, Check } from 'lucide-react';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  isRealtime: boolean;
  onSetRealtime: (realtime: boolean) => void;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  onSelectDate,
  isRealtime,
  onSetRealtime,
}) => {
  // Format initial values
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const hours = String(currentDate.getHours()).padStart(2, '0');
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');

  const [inputDate, setInputDate] = useState(`${year}-${month}-${day}`);
  const [inputTime, setInputTime] = useState(`${hours}:${minutes}`);

  const handleApply = () => {
    try {
      const [y, m, d] = inputDate.split('-').map(Number);
      const [h, min] = inputTime.split(':').map(Number);
      const newDate = new Date(y, m - 1, d, h, min, 0);
      if (!isNaN(newDate.getTime())) {
        onSetRealtime(false);
        onSelectDate(newDate);
        onClose();
      }
    } catch {
      // ignore
    }
  };

  const handleSetNow = () => {
    onSetRealtime(true);
    onSelectDate(new Date());
    onClose();
  };

  const handleAdjustHour = (delta: number) => {
    const next = new Date(currentDate.getTime() + delta * 3600 * 1000);
    onSetRealtime(false);
    onSelectDate(next);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#141417] border border-slate-800 rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl p-5 text-white max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-blue-950/60 text-blue-400 border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.3)]">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">时间局时辰设定</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-[#1C1C1E] border border-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time Toggle Mode */}
        <div className="mt-4 p-3.5 rounded-2xl bg-[#1C1C1E] border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-xs font-bold text-slate-200">即时时间局 (秒级同步)</div>
              <div className="text-[11px] text-slate-400">跟随系统当前当下时辰即时流转</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSetNow}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
              isRealtime
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>定格即时</span>
          </button>
        </div>

        {/* Custom Date & Time Picker */}
        <div className="mt-4 flex flex-col gap-3">
          <div className="text-xs text-slate-400 font-medium">指定公历年月日与时分：</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">日期 (年-月-日)</label>
              <input
                type="date"
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">时间 (时:分)</label>
              <input
                type="time"
                value={inputTime}
                onChange={(e) => setInputTime(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Quick hour nudges */}
          <div className="flex items-center justify-between gap-2 mt-1">
            <button
              type="button"
              onClick={() => handleAdjustHour(-2)}
              className="flex-1 py-2 text-xs font-medium bg-[#1C1C1E] hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-300 transition-colors"
            >
              -1时辰 (-2h)
            </button>
            <button
              type="button"
              onClick={() => handleAdjustHour(-1)}
              className="flex-1 py-2 text-xs font-medium bg-[#1C1C1E] hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-300 transition-colors"
            >
              -1小时
            </button>
            <button
              type="button"
              onClick={() => handleAdjustHour(1)}
              className="flex-1 py-2 text-xs font-medium bg-[#1C1C1E] hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-300 transition-colors"
            >
              +1小时
            </button>
            <button
              type="button"
              onClick={() => handleAdjustHour(2)}
              className="flex-1 py-2 text-xs font-medium bg-[#1C1C1E] hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-300 transition-colors"
            >
              +1时辰 (+2h)
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleApply}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-900/30 active:scale-[0.99]"
          >
            <span>排定该时间局</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
