import React, { useState, useMemo } from 'react';
import { ChevronLeft, Check, User, MapPin, Search, Clock, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { Solar, Lunar } from 'lunar-javascript';
import { Gender } from '../types';
import { GanzhiInputModal, GanzhiSelection } from './GanzhiInputModal';

export interface BirthdayFormData {
  name: string;
  gender: Gender;
  city: string;
  cityLongitude: number;
  calendarType: 'solar' | 'lunar' | 'ganzhi';
  solarDate: Date;
  isTrueSolarTime: boolean;
}

interface AddBirthdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: BirthdayFormData) => void;
  currentDate?: Date;
  currentGender?: Gender;
}

// Major cities database with longitudes for True Solar Time calculation
export const CHINESE_CITIES = [
  { name: '北京', province: '直辖市', longitude: 116.40 },
  { name: '上海', province: '直辖市', longitude: 121.47 },
  { name: '广州', province: '广东', longitude: 113.26 },
  { name: '深圳', province: '广东', longitude: 114.05 },
  { name: '成都', province: '四川', longitude: 104.06 },
  { name: '重庆', province: '直辖市', longitude: 106.55 },
  { name: '杭州', province: '浙江', longitude: 120.15 },
  { name: '武汉', province: '湖北', longitude: 114.30 },
  { name: '西安', province: '陕西', longitude: 108.94 },
  { name: '南京', province: '江苏', longitude: 118.78 },
  { name: '天津', province: '直辖市', longitude: 117.20 },
  { name: '苏州', province: '江苏', longitude: 120.58 },
  { name: '长沙', province: '湖南', longitude: 112.93 },
  { name: '郑州', province: '河南', longitude: 113.62 },
  { name: '青岛', province: '山东', longitude: 120.38 },
  { name: '济南', province: '山东', longitude: 117.00 },
  { name: '合肥', province: '安徽', longitude: 117.28 },
  { name: '福州', province: '福建', longitude: 119.30 },
  { name: '厦门', province: '福建', longitude: 118.08 },
  { name: '昆明', province: '云南', longitude: 102.71 },
  { name: '沈阳', province: '辽宁', longitude: 123.43 },
  { name: '大连', province: '辽宁', longitude: 121.61 },
  { name: '哈尔滨', province: '黑龙江', longitude: 126.63 },
  { name: '长春', province: '吉林', longitude: 125.32 },
  { name: '南宁', province: '广西', longitude: 108.32 },
  { name: '贵阳', province: '贵州', longitude: 106.71 },
  { name: '南昌', province: '江西', longitude: 115.89 },
  { name: '太原', province: '山西', longitude: 112.55 },
  { name: '石家庄', province: '河北', longitude: 114.50 },
  { name: '兰州', province: '甘肃', longitude: 103.82 },
  { name: '乌鲁木齐', province: '新疆', longitude: 87.62 },
  { name: '拉萨', province: '西藏', longitude: 91.11 },
  { name: '银川', province: '宁夏', longitude: 106.27 },
  { name: '西宁', province: '青海', longitude: 101.78 },
  { name: '呼和浩特', province: '内蒙古', longitude: 111.65 },
  { name: '海口', province: '海南', longitude: 110.35 },
  { name: '三亚', province: '海南', longitude: 109.50 },
  { name: '香港', province: '特别行政区', longitude: 114.17 },
  { name: '澳门', province: '特别行政区', longitude: 113.54 },
  { name: '台北', province: '台湾', longitude: 121.56 },
];

const LUNAR_MONTH_NAMES = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
const LUNAR_DAY_NAMES = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
];
const SHI_CHEN_LIST = [
  { name: '早子时 (00:00-00:59)', hour: 0, minute: 0, branch: '子' },
  { name: '丑时 (01:00-02:59)', hour: 2, minute: 0, branch: '丑' },
  { name: '寅时 (03:00-04:59)', hour: 4, minute: 0, branch: '寅' },
  { name: '卯时 (05:00-06:59)', hour: 6, minute: 0, branch: '卯' },
  { name: '辰时 (07:00-08:59)', hour: 8, minute: 0, branch: '辰' },
  { name: '巳时 (09:00-10:59)', hour: 10, minute: 0, branch: '巳' },
  { name: '午时 (11:00-12:59)', hour: 12, minute: 0, branch: '午' },
  { name: '未时 (13:00-14:59)', hour: 14, minute: 0, branch: '未' },
  { name: '申时 (15:00-16:59)', hour: 16, minute: 0, branch: '申' },
  { name: '酉时 (17:00-18:59)', hour: 18, minute: 0, branch: '酉' },
  { name: '戌时 (19:00-20:59)', hour: 20, minute: 0, branch: '戌' },
  { name: '亥时 (21:00-22:59)', hour: 22, minute: 0, branch: '亥' },
  { name: '夜子时 (23:00-23:59)', hour: 23, minute: 30, branch: '子' },
];

export const AddBirthdayModal: React.FC<AddBirthdayModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentDate = new Date(),
  currentGender = 'male',
}) => {
  // Form State
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>(currentGender);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [cityLongitude, setCityLongitude] = useState<number>(120.0);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  // Calendar Type State
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar' | 'ganzhi'>('solar');

  // Solar Date State
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [day, setDay] = useState(currentDate.getDate());
  const [hour, setHour] = useState(currentDate.getHours());
  const [minute, setMinute] = useState(currentDate.getMinutes());

  // Lunar Date State
  const initialLunar = Lunar.fromDate(currentDate);
  const [lunarYear, setLunarYear] = useState(initialLunar.getYear());
  const [lunarMonth, setLunarMonth] = useState(Math.abs(initialLunar.getMonth()));
  const [isLeapMonth, setIsLeapMonth] = useState(initialLunar.getMonth() < 0);
  const [lunarDay, setLunarDay] = useState(initialLunar.getDay());
  const [selectedShiChenIndex, setSelectedShiChenIndex] = useState(11); // 亥时 default

  // Picker modal / inline expanded state
  const [showDateTimeEditor, setShowDateTimeEditor] = useState(false);
  const [showGanzhiModal, setShowGanzhiModal] = useState(false);

  // True Solar Time switch
  const [isTrueSolarTime, setIsTrueSolarTime] = useState(true);

  // Filter cities for search
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return CHINESE_CITIES;
    return CHINESE_CITIES.filter(
      c => c.name.includes(citySearch) || c.province.includes(citySearch)
    );
  }, [citySearch]);

  // Compute calculated Solar Date based on calendarType
  const computedSolarDate = useMemo(() => {
    if (calendarType === 'solar') {
      return new Date(year, month - 1, day, hour, minute, 0);
    } else {
      // Lunar calculation
      try {
        const m = isLeapMonth ? -lunarMonth : lunarMonth;
        const shichen = SHI_CHEN_LIST[selectedShiChenIndex];
        const lunar = Lunar.fromYmdHms(lunarYear, m, lunarDay, shichen.hour, shichen.minute, 0);
        const sol = lunar.getSolar();
        return new Date(sol.getYear(), sol.getMonth() - 1, sol.getDay(), shichen.hour, shichen.minute, 0);
      } catch {
        return new Date(year, month - 1, day, hour, minute, 0);
      }
    }
  }, [calendarType, year, month, day, hour, minute, lunarYear, lunarMonth, isLeapMonth, lunarDay, selectedShiChenIndex]);

  // True solar time offset description
  const trueSolarOffsetMinutes = useMemo(() => {
    if (!selectedCity) return 0;
    // Standard meridian for UTC+8 (Beijing Time) is 120.0°
    // Each degree difference = 4 minutes
    const offset = Math.round((cityLongitude - 120.0) * 4);
    return offset;
  }, [selectedCity, cityLongitude]);

  // Calibrated date after True Solar Time offset
  const calibratedDate = useMemo(() => {
    if (!isTrueSolarTime || !selectedCity) return computedSolarDate;
    const adjusted = new Date(computedSolarDate.getTime() + trueSolarOffsetMinutes * 60 * 1000);
    return adjusted;
  }, [computedSolarDate, isTrueSolarTime, selectedCity, trueSolarOffsetMinutes]);

  // Formatted date display string matching the screenshot
  const dateDisplayStr = useMemo(() => {
    if (calendarType === 'solar') {
      const y = computedSolarDate.getFullYear();
      const m = computedSolarDate.getMonth() + 1;
      const d = computedSolarDate.getDate();
      const hh = String(computedSolarDate.getHours()).padStart(2, '0');
      const mm = String(computedSolarDate.getMinutes()).padStart(2, '0');
      return `${y}年${m}月${d}日 ${hh}:${mm}`;
    } else if (calendarType === 'lunar') {
      const lunar = Lunar.fromDate(computedSolarDate);
      const shichen = SHI_CHEN_LIST[selectedShiChenIndex];
      return `${lunar.getYearInGanZhi()}(${lunar.getYearShengXiao()})年 ${isLeapMonth ? '闰' : ''}${LUNAR_MONTH_NAMES[lunarMonth - 1]}${LUNAR_DAY_NAMES[lunarDay - 1]} ${shichen.branch}时`;
    } else {
      const lunar = Lunar.fromDate(computedSolarDate);
      const ec = lunar.getEightChar();
      return `${ec.getYear()}年 ${ec.getMonth()}月 ${ec.getDay()}日 ${ec.getTime()}时`;
    }
  }, [calendarType, computedSolarDate, selectedShiChenIndex, isLeapMonth, lunarMonth, lunarDay]);

  const handleConfirm = () => {
    onConfirm({
      name: name.trim(),
      gender,
      city: selectedCity,
      cityLongitude,
      calendarType,
      solarDate: calibratedDate,
      isTrueSolarTime: isTrueSolarTime && !!selectedCity,
    });
    onClose();
  };

  const handleGanzhiDateSelect = (d: Date, _ganzhi: GanzhiSelection) => {
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setDay(d.getDate());
    setHour(d.getHours());
    setMinute(d.getMinutes());
    setCalendarType('ganzhi');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full sm:h-auto sm:max-h-[92vh] bg-[#141217] text-white flex flex-col sm:rounded-3xl border border-[#2E2838]/80 shadow-2xl overflow-y-auto">
        
        {/* 1. Header Bar: < 添加生日 */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3.5 bg-[#141217]/95 border-b border-[#2A2436]/70 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-slate-300 hover:text-white active:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <h2 className="text-[17px] font-bold text-slate-100 tracking-wide">添加生日</h2>
          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* Form Container */}
        <div className="flex-1 px-5 pt-4 pb-8 flex flex-col gap-4">
          
          {/* 2. 姓名 (Name Input with 0/20 counter) */}
          <div>
            <div className="relative rounded-xl bg-[#1C1824] border border-[#332C42] focus-within:border-purple-500/80 transition-colors">
              <input
                type="text"
                value={name}
                maxLength={20}
                onChange={e => setName(e.target.value)}
                placeholder="姓名"
                className="w-full bg-transparent px-4 py-3.5 text-base text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>
            <div className="text-right text-xs text-slate-500 font-mono mt-1 pr-1">
              {name.length}/20
            </div>
          </div>

          {/* 3. 性别选择 (Gender Switcher Pill: ✓ 男 | 👤 女) */}
          <div className="rounded-2xl bg-[#1C1824] border border-[#332C42] p-1 grid grid-cols-2 gap-1 select-none">
            {/* Male Button */}
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                gender === 'male'
                  ? 'bg-[#372E47] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {gender === 'male' && <Check className="w-4 h-4 text-slate-200 stroke-[2.5]" />}
              <span>男</span>
            </button>

            {/* Female Button */}
            <button
              type="button"
              onClick={() => setGender('female')}
              className={`py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                gender === 'female'
                  ? 'bg-[#442A3D] text-pink-200 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4 text-pink-400 fill-pink-400" />
              {gender === 'female' && <Check className="w-3.5 h-3.5 text-pink-300 stroke-[2.5]" />}
              <span>女</span>
            </button>
          </div>

          {/* 4. 城市选择 (City Picker with [ 🇨🇳 ] icon bracket) */}
          <div className="flex gap-2">
            {/* Country Flag Badge Box with Bracket Borders */}
            <div className="flex-shrink-0 w-16 rounded-xl bg-[#1C1824] border border-[#332C42] flex items-center justify-center text-lg select-none">
              <span className="scale-110">🇨🇳</span>
            </div>

            {/* City Input/Button */}
            <div className="flex-1 relative">
              <button
                type="button"
                onClick={() => setShowCityPicker(!showCityPicker)}
                className="w-full text-left rounded-xl bg-[#1C1824] border border-[#332C42] px-4 py-3.5 text-sm text-slate-100 flex items-center justify-between hover:border-purple-500/50 transition-colors"
              >
                <span className={selectedCity ? 'text-slate-100 font-medium' : 'text-slate-500'}>
                  {selectedCity ? `${selectedCity} (东经 ${cityLongitude}°)` : '城市'}
                </span>
                <MapPin className="w-4 h-4 text-slate-400" />
              </button>

              {/* City Selection Dropdown / Search Modal */}
              {showCityPicker && (
                <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-[#1A1622] border border-[#3E3550] rounded-2xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="relative mb-2">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={citySearch}
                      onChange={e => setCitySearch(e.target.value)}
                      placeholder="搜索城市名称..."
                      className="w-full bg-[#120F18] border border-[#332C42] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto grid grid-cols-3 gap-1.5 scrollbar-thin">
                    {filteredCities.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          setSelectedCity(c.name);
                          setCityLongitude(c.longitude);
                          setShowCityPicker(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left truncate transition-colors ${
                          selectedCity === c.name
                            ? 'bg-purple-600 text-white font-bold'
                            : 'bg-[#221D2D] text-slate-300 hover:bg-[#2C263A]'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. 日期类型选择 Tabs: 公历 | 农历 | 干支 */}
          <div className="pt-2">
            <div className="grid grid-cols-3 text-center border-b border-[#2A2436] relative">
              <button
                type="button"
                onClick={() => setCalendarType('solar')}
                className={`pb-2.5 text-sm font-medium transition-colors ${
                  calendarType === 'solar' ? 'text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                公历
              </button>
              <button
                type="button"
                onClick={() => setCalendarType('lunar')}
                className={`pb-2.5 text-sm font-medium transition-colors ${
                  calendarType === 'lunar' ? 'text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                农历
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalendarType('ganzhi');
                  setShowDateTimeEditor(false);
                  setShowGanzhiModal(true);
                }}
                className={`pb-2.5 text-sm font-medium transition-colors ${
                  calendarType === 'ganzhi' ? 'text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                干支
              </button>

              {/* Active Tab Underline Indicator matching screenshot */}
              <div
                className="absolute bottom-0 h-0.5 bg-gradient-to-r from-purple-400 to-indigo-400 transition-all duration-200"
                style={{
                  width: '33.33%',
                  left: calendarType === 'solar' ? '0%' : calendarType === 'lunar' ? '33.33%' : '66.66%',
                }}
              />
            </div>
          </div>

          {/* 6. 日期时间展示框 (Date & Time Display Box) */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                if (calendarType === 'ganzhi') {
                  setShowGanzhiModal(true);
                } else {
                  setShowDateTimeEditor(!showDateTimeEditor);
                }
              }}
              className="w-full text-center rounded-xl bg-[#1C1824] border border-[#332C42] py-3.5 px-4 text-base font-semibold text-slate-100 shadow-inner hover:border-purple-500/60 transition-colors flex items-center justify-center gap-2"
            >
              <span>{dateDisplayStr}</span>
              <CalendarIcon className="w-4 h-4 text-slate-400" />
            </button>

            {/* Interactive Date & Time Pickers / Editors */}
            {showDateTimeEditor && (
              <div className="rounded-2xl bg-[#191522] border border-[#372F47] p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                {calendarType === 'solar' ? (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-400 font-medium">调整公历年月日与时分：</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">年份</label>
                        <select
                          value={year}
                          onChange={e => setYear(Number(e.target.value))}
                          className="w-full bg-[#120F18] border border-[#332C42] rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                        >
                          {Array.from({ length: 120 }, (_, i) => 1930 + i).map(y => (
                            <option key={y} value={y}>{y}年</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">月份</label>
                        <select
                          value={month}
                          onChange={e => setMonth(Number(e.target.value))}
                          className="w-full bg-[#120F18] border border-[#332C42] rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{m}月</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">日期</label>
                        <select
                          value={day}
                          onChange={e => setDay(Number(e.target.value))}
                          className="w-full bg-[#120F18] border border-[#332C42] rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                        >
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                            <option key={d} value={d}>{d}日</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">时 (0-23)</label>
                        <select
                          value={hour}
                          onChange={e => setHour(Number(e.target.value))}
                          className="w-full bg-[#120F18] border border-[#332C42] rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                        >
                          {Array.from({ length: 24 }, (_, i) => i).map(h => (
                            <option key={h} value={h}>{String(h).padStart(2, '0')}点</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">分 (0-59)</label>
                        <select
                          value={minute}
                          onChange={e => setMinute(Number(e.target.value))}
                          className="w-full bg-[#120F18] border border-[#332C42] rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                        >
                          {Array.from({ length: 60 }, (_, i) => i).map(m => (
                            <option key={m} value={m}>{String(m).padStart(2, '0')}分</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-400 font-medium">调整农历年月日与时辰：</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">农历年份</label>
                        <select
                          value={lunarYear}
                          onChange={e => setLunarYear(Number(e.target.value))}
                          className="w-full bg-[#120F18] border border-[#332C42] rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                        >
                          {Array.from({ length: 100 }, (_, i) => 1940 + i).map(y => (
                            <option key={y} value={y}>{y}年</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">农历月份</label>
                        <select
                          value={lunarMonth}
                          onChange={e => setLunarMonth(Number(e.target.value))}
                          className="w-full bg-[#120F18] border border-[#332C42] rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                        >
                          {LUNAR_MONTH_NAMES.map((name, idx) => (
                            <option key={idx} value={idx + 1}>{name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">农历初几</label>
                        <select
                          value={lunarDay}
                          onChange={e => setLunarDay(Number(e.target.value))}
                          className="w-full bg-[#120F18] border border-[#332C42] rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                        >
                          {LUNAR_DAY_NAMES.map((name, idx) => (
                            <option key={idx} value={idx + 1}>{name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="leapMonth"
                          checked={isLeapMonth}
                          onChange={e => setIsLeapMonth(e.target.checked)}
                          className="rounded text-purple-600 focus:ring-0"
                        />
                        <label htmlFor="leapMonth" className="text-xs text-slate-300 cursor-pointer">
                          该月为闰月
                        </label>
                      </div>

                      <div className="w-1/2">
                        <select
                          value={selectedShiChenIndex}
                          onChange={e => setSelectedShiChenIndex(Number(e.target.value))}
                          className="w-full bg-[#120F18] border border-[#332C42] rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                        >
                          {SHI_CHEN_LIST.map((sc, idx) => (
                            <option key={idx} value={idx}>{sc.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 7. 真太阳时校准卡片 (True Solar Time Calibration Switch Row) */}
          <div className="rounded-2xl bg-[#1C1824] border border-[#332C42] p-4 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <span className="px-2 py-0.5 rounded-md bg-[#2B2438] text-[11px] font-medium text-slate-400 border border-[#3F3452] flex-shrink-0 mt-0.5">
                真太阳时
              </span>
              <div>
                <div className="text-xs text-slate-300 leading-snug">
                  {selectedCity
                    ? `已根据${selectedCity}(东经${cityLongitude}°)校准 ${trueSolarOffsetMinutes >= 0 ? '+' : ''}${trueSolarOffsetMinutes}分钟`
                    : '真太阳时校准需要选择城市'}
                </div>
              </div>
            </div>

            {/* iOS Style Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={isTrueSolarTime}
              onClick={() => setIsTrueSolarTime(!isTrueSolarTime)}
              className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-200 flex-shrink-0 ${
                isTrueSolarTime ? 'bg-[#7C3AED]' : 'bg-[#2E283C]'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                  isTrueSolarTime ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 8. 确定按钮 (Large Confirm Pill Button) */}
          <div className="pt-3">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-3.5 rounded-full bg-[#524467] hover:bg-[#61517A] active:bg-[#433755] text-slate-100 font-bold text-base tracking-widest shadow-lg shadow-purple-950/40 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>确定</span>
            </button>
          </div>

        </div>

        {/* Ganzhi Configuration Popup Modal */}
        <GanzhiInputModal
          isOpen={showGanzhiModal}
          onClose={() => setShowGanzhiModal(false)}
          onSelectDate={handleGanzhiDateSelect}
          initialDate={computedSolarDate}
        />
      </div>
    </div>
  );
};
