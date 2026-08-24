import React, { useState } from 'react';
import { Sparkles, CheckCircle, XCircle, Trophy, ArrowRight, RotateCcw, Swords } from 'lucide-react';
import { playClaimSound, triggerHaptic } from '../../utils/soundEffects';

interface QuizQuestion {
  id: number;
  title: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_DATA: QuizQuestion[] = [
  {
    id: 1,
    title: '冲战碰优先级判定',
    category: '碰牌规则',
    question: '对手打出一张【甲】牌。玩家A手牌有【甲甲】（同字碰），玩家B手牌有【庚庚】（天干甲庚冲战碰）。两者同时声称碰牌时，谁优先？',
    options: ['玩家A（甲甲碰甲）优先', '玩家B（庚庚碰甲）优先且必须让位', '看谁叫碰更快', '由庄家掷骰子决定'],
    correctIndex: 1,
    explanation: '规则明确规定：甲甲碰甲与庚庚碰甲相遇时，【庚庚碰甲】优先！冲战碰优先于普通同字碰。',
  },
  {
    id: 2,
    title: '天干五合做砍',
    category: '吃牌与做砍',
    question: '在天干五合规则中，【乙庚合金】由哪三张牌组成一组有效砍？',
    options: ['乙 + 庚 + 金', '乙 + 庚 + 土', '乙 + 辛 + 金', '甲 + 庚 + 金'],
    correctIndex: 0,
    explanation: '天干五合为：甲己土、乙庚金、丙辛水、丁壬木、戊癸火。因此乙庚金是由【乙】、【庚】、【金】三张组成。',
  },
  {
    id: 3,
    title: '地支六合吃牌判定',
    category: '吃牌规则',
    question: '若你手牌持有【巳】和【水】，上家打出哪张牌时你可以宣布吃牌？',
    options: ['打出【申】（巳申水）', '打出【午】（巳午未）', '打出【亥】（巳亥冲）', '打出【火】（水火冲）'],
    correctIndex: 0,
    explanation: '地支六合为：巳申水、卯戌火、寅亥木、午未土、辰酉金、子丑土。持有巳与水，上家打出【申】即可吃牌成砍！',
  },
  {
    id: 4,
    title: '地支三会局方向判定',
    category: '三会局',
    question: '地支三会中，【巳午未】代表什么方位的会局？',
    options: ['南方火局', '东方木局', '西方金局', '北方水局'],
    correctIndex: 0,
    explanation: '地支三会：巳午未（南方火）、申酉戌（西方金）、亥子丑（北方水）、寅卯辰（东方木）。',
  },
  {
    id: 5,
    title: '番数阶梯判定',
    category: '番数计算',
    question: '若胡牌时4组砍全部由冲战砍（如庚庚甲、辛辛乙、子子午、申申寅）组成，结算应记为几番？',
    options: ['一番（小P胡）', '二番（全部冲战）', '三番（全碰）', '五番（七巧对）'],
    correctIndex: 1,
    explanation: '根据番数说明：4组均为冲战坎时属于【二番牌面：全部冲战】。',
  },
  {
    id: 6,
    title: '地支三刑组合',
    category: '地支三刑',
    question: '下列哪一组牌属于合法的地支三刑砍？',
    options: ['寅 巳 申', '寅 午 戌', '亥 卯 未', '申 酉 戌'],
    correctIndex: 0,
    explanation: '地支三刑有两组：【寅巳申】与【丑未戌】，均可做砍或吃牌。',
  },
];

export const QuizChallenge: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const q = QUIZ_DATA[currentIdx];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOpt(idx);
    setIsAnswered(true);

    if (idx === q.correctIndex) {
      setScore(prev => prev + 1);
      playClaimSound('hu');
      triggerHaptic('medium');
    } else {
      triggerHaptic('heavy');
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < QUIZ_DATA.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOpt(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <div className="w-full max-w-xl mx-auto p-6 bg-[#181226] border border-purple-500/30 rounded-3xl text-center space-y-5 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Trophy className="w-8 h-8 text-amber-950 stroke-[2.2]" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white">答题通关完成！</h2>
          <p className="text-xs text-slate-400">
            你答对了 <strong className="text-amber-400 font-mono text-lg">{score}</strong> / {QUIZ_DATA.length} 道五行麻将规则题目
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200">
          {score === QUIZ_DATA.length ? (
            <span className="text-amber-300 font-bold">🎉 太厉害了！你已经完全掌握了五行冲战与干支生克规则！</span>
          ) : (
            <span>基础扎实！随时可查看规则图解温故知新。</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleRestart}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>重新测验</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6 text-white animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-[#191328] px-4 py-3 rounded-2xl border border-purple-500/20">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-slate-300">五行麻将规则实战问答</span>
        </div>
        <span className="text-xs font-mono text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
          第 {currentIdx + 1} / {QUIZ_DATA.length} 题
        </span>
      </div>

      {/* Question Card */}
      <div className="bg-[#181226] border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-700/50">
            {q.category}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed pt-1">
            {q.question}
          </h3>
        </div>

        {/* Options */}
        <div className="space-y-2.5 pt-2">
          {q.options.map((opt, idx) => {
            const isChosen = selectedOpt === idx;
            const isCorrect = idx === q.correctIndex;

            let btnStyle = 'bg-[#120D1D] border-slate-700/80 hover:border-purple-500 text-slate-200';
            if (isAnswered) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950';
              } else if (isChosen && !isCorrect) {
                btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-md shadow-rose-950';
              } else {
                btnStyle = 'opacity-40 bg-[#120D1D] border-transparent text-slate-400';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-3.5 rounded-2xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-between ${btnStyle}`}
              >
                <span>{opt}</span>
                {isAnswered && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                {isAnswered && isChosen && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next */}
        {isAnswered && (
          <div className="pt-3 border-t border-purple-500/20 space-y-3 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-300 block mb-0.5">解析：</strong>
              {q.explanation}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950 font-black text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center gap-1.5 transition-all transform hover:scale-101"
            >
              <span>{currentIdx + 1 < QUIZ_DATA.length ? '下一题' : '查看结果'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
