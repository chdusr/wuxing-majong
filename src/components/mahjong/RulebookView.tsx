import React, { useState } from 'react';
import { MahjongTile } from './MahjongTile';
import { TILE_DEFINITIONS, CANONICAL_KANS, CLASH_PAIRS, ELEMENT_COLORS } from '../../utils/mahjongRules';
import { MahjongTileData } from '../../types/mahjong';
import {
  BookOpen,
  Swords,
  Layers,
  Sparkles,
  Flame,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const RulebookView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'clash' | 'combine' | 'fans' | 'faq'>('overview');

  // Convert definitions to tile objects for rendering
  const getTileObj = (name: string): MahjongTileData => {
    const def = TILE_DEFINITIONS.find(t => t.name === name) || TILE_DEFINITIONS[0];
    return {
      ...def,
      id: `rule_${name}`,
    };
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6 text-white animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-xs text-purple-300">
          <BookOpen className="w-3.5 h-3.5" />
          <span>五行麻将 · 规则与图谱全鉴</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-purple-200 to-amber-300">
          五行、干支、冲合刑会全集
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          依《五行麻将（图文版）》规则汇编，共 108 张牌，四人成局，融汇传统五行生克与干支历法。
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-[#171224] rounded-2xl border border-purple-500/20">
        {[
          { id: 'overview', label: '牌组与台规', icon: Layers },
          { id: 'clash', label: '冲战碰规则', icon: Swords },
          { id: 'combine', label: '吃牌·合刑会', icon: Sparkles },
          { id: 'fans', label: '胡牌与番数', icon: Award },
          { id: 'faq', label: '实战FAQ', icon: HelpCircle },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Table rules */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Card Composition Grid */}
          <div className="bg-[#191328] border border-purple-500/20 rounded-3xl p-5 space-y-4">
            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>108 张牌组构成 (每种各4张)</span>
            </h3>

            {/* 1. 五行牌 */}
            <div className="space-y-2 bg-[#120D1D] p-3.5 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold text-emerald-400">五行牌 (共20张)</span>
                <span className="text-slate-400">木、火、土、金、水 各4张</span>
              </div>
              <div className="flex items-center gap-2">
                {['木', '火', '土', '金', '水'].map(c => (
                  <MahjongTile key={c} tile={getTileObj(c)} size="sm" />
                ))}
              </div>
            </div>

            {/* 2. 十天干 */}
            <div className="space-y-2 bg-[#120D1D] p-3.5 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold text-amber-400">十天干牌 (共40张)</span>
                <span className="text-slate-400">甲、乙、丙、丁、戊、己、庚、辛、壬、癸 各4张</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].map(c => (
                  <MahjongTile key={c} tile={getTileObj(c)} size="sm" />
                ))}
              </div>
            </div>

            {/* 3. 十二地支 */}
            <div className="space-y-2 bg-[#120D1D] p-3.5 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold text-purple-400">十二地支牌 (共48张)</span>
                <span className="text-slate-400">寅、卯、辰、巳、午、未、申、酉、戌、亥、子、丑 各4张</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'].map(c => (
                  <MahjongTile key={c} tile={getTileObj(c)} size="sm" />
                ))}
              </div>
            </div>
          </div>

          {/* Table Seating & Wall Rules */}
          <div className="bg-[#191328] border border-purple-500/20 rounded-3xl p-5 space-y-3">
            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
              <Flame className="w-4 h-4" />
              <span>抓牌、起庄与台规细则</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">1.</span>
                <span><strong>顺时针抓牌，逆时针打牌</strong>：正前方为“对家”，左边为“上家”，右边为“下家”。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">2.</span>
                <span><strong>摸牌定庄</strong>：游戏前摸甲乙丙丁，摸到【甲】的玩家选座位先做庄。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">3.</span>
                <span><strong>牌墙落数</strong>：两家门前13落 (26张)，两家门前14落 (28张)，共108张。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">4.</span>
                <span><strong>掷骰起牌规则</strong>：
                  庄家掷两颗骰子。两骰之和：
                  <span className="block mt-1 pl-2 text-purple-200">
                    • <strong>5、9</strong>：从自己面前开始抓牌<br/>
                    • <strong>3、7、11</strong>：从对家面前开始抓牌<br/>
                    • <strong>4、8、12</strong>：从上家（左边）面前开始抓牌<br/>
                    • <strong>2、6、10</strong>：从下家（右边）面前开始抓牌<br/>
                    • 两骰中<strong>较小的点数</strong>，决定从右向左的第几落开始拿牌。
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">5.</span>
                <span>庄家起手抓14张，其余玩家抓13张，轮流摸打直至胡牌。</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: Clash & Clash Pung Rules */}
      {activeTab === 'clash' && (
        <div className="space-y-6">
          <div className="bg-[#191328] border border-purple-500/20 rounded-3xl p-5 space-y-4">
            <h3 className="text-base font-bold text-purple-300 flex items-center gap-2">
              <Swords className="w-4 h-4 text-purple-400" />
              <span>冲战碰机制 (金水主动)</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              五行麻将中除了“同字碰”（如两张甲碰第三张甲），还独创了<strong>【冲战碰】</strong>！若你手牌有对立冲牌的两张，对手打出冲牌，即可发起冲战碰。
            </p>

            {/* High Priority Highlight */}
            <div className="bg-amber-950/40 border border-amber-500/40 p-3.5 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200">
                <strong className="text-amber-300 block mb-0.5">冲战碰优先级最高：</strong>
                例如当对手打出【甲】时，玩家A有【甲甲】（普通同字碰），玩家B有【庚庚】（冲战碰），两者相遇时，<strong>【庚庚碰甲】优先！</strong>
              </div>
            </div>

            {/* Clash Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* 天干四冲 */}
              <div className="bg-[#120D1D] p-3.5 rounded-2xl border border-white/5 space-y-2">
                <span className="text-xs font-bold text-amber-400">天干四冲</span>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>甲 ⇋ 庚 冲</span>
                    <span className="text-slate-400">甲甲碰庚 / 庚庚碰甲</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>乙 ⇋ 辛 冲</span>
                    <span className="text-slate-400">乙乙碰辛 / 辛辛碰乙</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>壬 ⇋ 丙 冲</span>
                    <span className="text-slate-400">壬壬碰丙 / 丙丙碰壬</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>丁 ⇋ 癸 冲</span>
                    <span className="text-slate-400">丁丁碰癸 / 癸癸碰丁</span>
                  </div>
                </div>
              </div>

              {/* 地支六冲 & 五行冲 */}
              <div className="bg-[#120D1D] p-3.5 rounded-2xl border border-white/5 space-y-2">
                <span className="text-xs font-bold text-purple-400">地支六冲 & 五行冲</span>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>子 ⇋ 午 冲</span>
                    <span>卯 ⇋ 酉 冲</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>巳 ⇋ 亥 冲</span>
                    <span>丑 ⇋ 未 冲</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>辰 ⇋ 戌 冲</span>
                    <span>寅 ⇋ 申 冲</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-300 pt-1 border-t border-white/5">
                    <span>金 ⇋ 木 冲</span>
                    <span>水 ⇋ 火 冲</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Combinations & Chow Sets (做砍、吃牌) */}
      {activeTab === 'combine' && (
        <div className="space-y-6">
          <div className="bg-[#191328] border border-purple-500/20 rounded-3xl p-5 space-y-4">
            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>吃牌与做砍组合图鉴</span>
            </h3>
            <p className="text-xs text-slate-300">
              <strong>吃牌规则</strong>：吃牌只能吃<strong>上家</strong>打出的牌。只要手牌的两张与上家打出的一张能组成以下任一合法【砍】，即可吃牌。
            </p>

            {/* 1. 天干五合 */}
            <div className="bg-[#120D1D] p-3.5 rounded-2xl border border-white/5 space-y-2">
              <span className="text-xs font-bold text-emerald-400">天干五合 (合化五行)</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {[
                  { title: '甲己合土', tiles: ['甲', '己', '土'] },
                  { title: '乙庚合金', tiles: ['乙', '庚', '金'] },
                  { title: '丙辛合水', tiles: ['丙', '辛', '水'] },
                  { title: '丁壬合木', tiles: ['丁', '壬', '木'] },
                  { title: '戊癸合火', tiles: ['戊', '癸', '火'] },
                ].map(item => (
                  <div key={item.title} className="flex flex-col items-center p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[11px] font-bold text-amber-200 mb-1.5">{item.title}</span>
                    <div className="flex items-center gap-1">
                      {item.tiles.map(t => (
                        <MahjongTile key={t} tile={getTileObj(t)} size="xs" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. 地支六合 */}
            <div className="bg-[#120D1D] p-3.5 rounded-2xl border border-white/5 space-y-2">
              <span className="text-xs font-bold text-sky-400">地支六合</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {[
                  { title: '巳申合水', tiles: ['巳', '申', '水'] },
                  { title: '卯戌合火', tiles: ['卯', '戌', '火'] },
                  { title: '寅亥合木', tiles: ['寅', '亥', '木'] },
                  { title: '午未合土', tiles: ['午', '未', '土'] },
                  { title: '辰酉合金', tiles: ['辰', '酉', '金'] },
                  { title: '子丑合土', tiles: ['子', '丑', '土'] },
                ].map(item => (
                  <div key={item.title} className="flex flex-col items-center p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[11px] font-bold text-sky-200 mb-1.5">{item.title}</span>
                    <div className="flex items-center gap-1">
                      {item.tiles.map(t => (
                        <MahjongTile key={t} tile={getTileObj(t)} size="xs" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. 地支三合 */}
            <div className="bg-[#120D1D] p-3.5 rounded-2xl border border-white/5 space-y-2">
              <span className="text-xs font-bold text-rose-400">地支三合局</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { title: '寅午戌 (火局)', tiles: ['寅', '午', '戌'] },
                  { title: '亥卯未 (木局)', tiles: ['亥', '卯', '未'] },
                  { title: '申子辰 (水局)', tiles: ['申', '子', '辰'] },
                  { title: '巳酉丑 (金局)', tiles: ['巳', '酉', '丑'] },
                ].map(item => (
                  <div key={item.title} className="flex flex-col items-center p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[11px] font-bold text-rose-200 mb-1.5">{item.title}</span>
                    <div className="flex items-center gap-1">
                      {item.tiles.map(t => (
                        <MahjongTile key={t} tile={getTileObj(t)} size="xs" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. 地支三会与地支三刑 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#120D1D] p-3.5 rounded-2xl border border-white/5 space-y-2">
                <span className="text-xs font-bold text-amber-400">地支三会 (四方会局)</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { title: '巳午未 (南火)', tiles: ['巳', '午', '未'] },
                    { title: '申酉戌 (西金)', tiles: ['申', '酉', '戌'] },
                    { title: '亥子丑 (北水)', tiles: ['亥', '子', '丑'] },
                    { title: '寅卯辰 (东木)', tiles: ['寅', '卯', '辰'] },
                  ].map(item => (
                    <div key={item.title} className="flex flex-col items-center p-2 rounded-xl bg-black/40">
                      <span className="text-[10px] font-bold text-slate-300 mb-1">{item.title}</span>
                      <div className="flex items-center gap-1">
                        {item.tiles.map(t => (
                          <MahjongTile key={t} tile={getTileObj(t)} size="xs" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#120D1D] p-3.5 rounded-2xl border border-white/5 space-y-2">
                <span className="text-xs font-bold text-purple-400">地支三刑</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { title: '寅巳申 (无恩刑)', tiles: ['寅', '巳', '申'] },
                    { title: '丑未戌 (恃势刑)', tiles: ['丑', '未', '戌'] },
                  ].map(item => (
                    <div key={item.title} className="flex flex-col items-center p-2 rounded-xl bg-black/40">
                      <span className="text-[10px] font-bold text-slate-300 mb-1">{item.title}</span>
                      <div className="flex items-center gap-1">
                        {item.tiles.map(t => (
                          <MahjongTile key={t} tile={getTileObj(t)} size="xs" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 4: Winning Conditions & Fans (胡牌与番数说明) */}
      {activeTab === 'fans' && (
        <div className="space-y-6">
          <div className="bg-[#191328] border border-purple-500/20 rounded-3xl p-5 space-y-4">
            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>胡牌规则与番数阶梯 (源自规则第13页)</span>
            </h3>

            <div className="bg-purple-950/40 p-3.5 rounded-2xl border border-purple-500/30 text-xs text-purple-200">
              <strong>胡牌两大基本结构：</strong>
              <div className="mt-1 space-y-1">
                <div>① <strong>4砍 + 1将</strong> (共14张)：1对相同字做将，4组有效砍（同字刻子/天干五合/地支六合/三合/三会/三刑/冲战砍）。</div>
                <div>② <strong>七巧对</strong> (共14张)：7对相同字。</div>
              </div>
            </div>

            {/* Fan Level Table */}
            <div className="space-y-2.5">
              {[
                {
                  fan: '一番',
                  title: '啥都有 小P胡',
                  desc: '常规4砍+1将胡牌，无特殊纯粹组合。',
                  color: 'text-slate-300 border-slate-700 bg-slate-900/40',
                },
                {
                  fan: '二番',
                  title: '全部冲战',
                  desc: '4组砍全部由冲战砍（两同+一冲）组成。',
                  color: 'text-purple-300 border-purple-700/50 bg-purple-950/30',
                },
                {
                  fan: '三番',
                  title: '全碰 (对对胡)',
                  desc: '4组均为3张同字刻子 + 1对将。',
                  color: 'text-blue-300 border-blue-700/50 bg-blue-950/30',
                },
                {
                  fan: '三番',
                  title: '纯水火 / 金木冲战',
                  desc: '整幅手牌纯粹由水火或金木对决冲战元素组成。',
                  color: 'text-cyan-300 border-cyan-700/50 bg-cyan-950/30',
                },
                {
                  fan: '三番',
                  title: '三合三会三刑荟局',
                  desc: '手牌包含三合、三会、三刑多元融合格局。',
                  color: 'text-emerald-300 border-emerald-700/50 bg-emerald-950/30',
                },
                {
                  fan: '四番',
                  title: '纯三合 / 纯三会 / 纯三刑',
                  desc: '4组砍全部由纯粹的三合局、纯三会局或纯三刑局构成。',
                  color: 'text-amber-300 border-amber-700/50 bg-amber-950/30',
                },
                {
                  fan: '五番',
                  title: '七巧对 (7对子)',
                  desc: '手牌完全由7个独立对子构成（无需亮出砍）。',
                  color: 'text-rose-300 border-rose-700/50 bg-rose-950/30',
                },
              ].map(f => (
                <div key={f.title} className={`p-3 rounded-2xl border flex items-start justify-between gap-3 ${f.color}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm">{f.fan}：{f.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-black/40 border border-white/10">
                    {f.fan}
                  </span>
                </div>
              ))}
            </div>

            {/* Extra additions */}
            <div className="bg-[#120D1D] p-3.5 rounded-2xl border border-white/5 space-y-1.5 text-xs text-slate-300">
              <span className="font-bold text-amber-400 block mb-1">加番说明：</span>
              <div className="flex items-center justify-between">
                <span>杠上开花</span>
                <span className="text-amber-300 font-bold">+1 番</span>
              </div>
              <div className="flex items-center justify-between">
                <span>天胡 (起手庄家直接胡牌)</span>
                <span className="text-amber-300 font-bold">+5 番</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 5: FAQ */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          {[
            {
              q: '为什么别人打出甲，我可以拿庚庚去碰？',
              a: '五行麻将特色规则：天干中【甲庚相冲】。持有两张庚可以碰对手打出的甲，形成【庚庚甲】冲战砍。且冲战碰优先级高于普通同字碰！',
            },
            {
              q: '地支六合有哪些可以直接做砍或吃牌？',
              a: '巳申合水、卯戌合火、寅亥合木、午未合土、辰酉合金、子丑合土。例如你有巳和水，上家打申，即可吃申成砍！',
            },
            {
              q: '吃牌和碰牌有什么限制？',
              a: '吃牌仅能吃上家打出的牌；碰牌（包括普通碰与冲战碰）可碰任意玩家打出的牌。',
            },
            {
              q: '起牌如何确定方位？',
              a: '庄家掷两颗骰子，点数和为5/9从自己开始抓，3/7/11从对家抓，4/8/12从上家抓，2/6/10从下家抓。两骰中较小值决定从右向左第几落开始拿牌。',
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-[#191328] border border-purple-500/20 rounded-2xl p-4 space-y-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{item.q}</span>
              </h4>
              <p className="text-xs text-slate-300 pl-5 leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
