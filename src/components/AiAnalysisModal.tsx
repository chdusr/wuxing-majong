import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, Loader2, BookOpen, CheckCircle, RefreshCw } from 'lucide-react';
import { TimeJuChartData } from '../types';

interface AiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartData: TimeJuChartData;
}

export const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({
  isOpen,
  onClose,
  chartData,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [activeChip, setActiveChip] = useState<string>('全面局象解读');

  const chips = [
    '全面局象解读',
    '此时求财与商务谈判',
    '办事决断与出行方位',
    '人际互动与贵人化解',
    '五行能量与调候穿戴',
  ];

  const fetchAnalysis = async (customQ?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/analyze-timeju', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chartData,
          userQuestion: customQ || question || activeChip,
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysisText(data.analysis);
      } else {
        setAnalysisText('未能获取分析内容，请稍后重试。');
      }
    } catch (err: any) {
      setAnalysisText(`请求失败: ${err.message || '网络异常'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !analysisText) {
      fetchAnalysis('全面局象解读');
    }
  }, [isOpen, chartData.gregorianDateStr]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#141417] border border-slate-800 rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl p-5 text-white max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-blue-950/60 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">AI 五行时间局·气场详解</h3>
              <div className="text-xs text-slate-400">
                {chartData.genderLabel} · {chartData.lunarText.replace('农历: ', '')}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-[#1C1C1E] border border-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick prompt chips */}
        <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none flex-shrink-0">
          {chips.map((chip) => {
            const isSelected = activeChip === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setActiveChip(chip);
                  fetchAnalysis(chip);
                }}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 border border-blue-400/40'
                    : 'bg-[#1C1C1E] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-[#0A0A0B] border border-slate-800/80 text-sm leading-relaxed text-slate-200 shadow-inner">
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
              <p className="text-xs font-medium tracking-wide">正在结合干支生克、十神气数推演局象...</p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-xs sm:text-sm space-y-3 whitespace-pre-wrap font-sans">
              {analysisText}
            </div>
          )}
        </div>

        {/* Custom Input */}
        <div className="mt-3 flex items-center gap-2 flex-shrink-0">
          <input
            type="text"
            placeholder="向AI提问关于此时辰的特定事项 (如: 签约/面试/出行)..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && question.trim()) {
                fetchAnalysis(question);
              }
            }}
            className="flex-1 bg-[#1C1C1E] border border-slate-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="button"
            disabled={loading || !question.trim()}
            onClick={() => fetchAnalysis(question)}
            className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white flex items-center justify-center transition-colors shadow-lg shadow-blue-900/30 flex-shrink-0"
            title="发送提问"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
