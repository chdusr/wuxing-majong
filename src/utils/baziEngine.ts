import { Solar, Lunar } from 'lunar-javascript';
import { FiveElement, Gender, PillarData, TimeJuChartData, SolarTermInfo } from '../types';

// Element mapping
export const STEM_ELEMENTS: Record<string, FiveElement> = {
  '甲': 'wood', '乙': 'wood',
  '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth',
  '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water',
};

export const BRANCH_ELEMENTS: Record<string, FiveElement> = {
  '寅': 'wood', '卯': 'wood',
  '巳': 'fire', '午': 'fire',
  '辰': 'earth', '戌': 'earth', '丑': 'earth', '未': 'earth',
  '申': 'metal', '酉': 'metal',
  '亥': 'water', '子': 'water',
};

export const ELEMENT_NAMES: Record<FiveElement, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

export const ELEMENT_COLORS: Record<FiveElement, { text: string; bg: string; border: string; glow: string; badge: string; hex: string }> = {
  wood: {
    text: 'text-green-400',
    bg: 'bg-green-950/50',
    border: 'border-green-500/30',
    badge: 'bg-green-500/10 text-green-400 border-green-500/20',
    glow: 'rgba(34, 197, 94, 0.4)',
    hex: '#22C55E',
  },
  fire: {
    text: 'text-red-400',
    bg: 'bg-red-950/50',
    border: 'border-red-500/30',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    glow: 'rgba(239, 68, 68, 0.4)',
    hex: '#EF4444',
  },
  earth: {
    text: 'text-yellow-400',
    bg: 'bg-yellow-950/50',
    border: 'border-yellow-500/30',
    badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    glow: 'rgba(234, 179, 8, 0.4)',
    hex: '#EAB308',
  },
  metal: {
    text: 'text-slate-100',
    bg: 'bg-slate-800/50',
    border: 'border-slate-100/30',
    badge: 'bg-slate-100/10 text-slate-100 border-slate-100/20',
    glow: 'rgba(241, 245, 249, 0.4)',
    hex: '#F1F5F9',
  },
  water: {
    text: 'text-blue-400',
    bg: 'bg-blue-950/50',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    glow: 'rgba(59, 130, 246, 0.4)',
    hex: '#3B82F6',
  },
};

// Hidden stems for 12 Earthly Branches
export const HIDDEN_STEMS: Record<string, string[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲'],
};

// Ten Gods calculation relative to Day Master stem
const STEM_YIN_YANG: Record<string, boolean> = { // true = Yang, false = Yin
  '甲': true, '乙': false,
  '丙': true, '丁': false,
  '戊': true, '己': false,
  '庚': true, '辛': false,
  '壬': true, '癸': false,
};

const ELEMENT_RELATIONS: Record<FiveElement, { generate: FiveElement; overcome: FiveElement; generatedBy: FiveElement; overcomeBy: FiveElement }> = {
  wood: { generate: 'fire', overcome: 'earth', generatedBy: 'water', overcomeBy: 'metal' },
  fire: { generate: 'earth', overcome: 'metal', generatedBy: 'wood', overcomeBy: 'water' },
  earth: { generate: 'metal', overcome: 'water', generatedBy: 'fire', overcomeBy: 'wood' },
  metal: { generate: 'water', overcome: 'wood', generatedBy: 'earth', overcomeBy: 'fire' },
  water: { generate: 'wood', overcome: 'fire', generatedBy: 'metal', overcomeBy: 'earth' },
};

export function getTenGod(dayMaster: string, targetStem: string): string {
  if (dayMaster === targetStem) return '比肩';
  const dmElem = STEM_ELEMENTS[dayMaster];
  const targetElem = STEM_ELEMENTS[targetStem];
  const samePolarity = STEM_YIN_YANG[dayMaster] === STEM_YIN_YANG[targetStem];

  if (dmElem === targetElem) {
    return samePolarity ? '比肩' : '劫财';
  }
  if (ELEMENT_RELATIONS[dmElem].generate === targetElem) {
    return samePolarity ? '食神' : '伤官';
  }
  if (ELEMENT_RELATIONS[dmElem].overcome === targetElem) {
    return samePolarity ? '偏财' : '正财';
  }
  if (ELEMENT_RELATIONS[dmElem].overcomeBy === targetElem) {
    return samePolarity ? '七杀' : '正官';
  }
  if (ELEMENT_RELATIONS[dmElem].generatedBy === targetElem) {
    return samePolarity ? '偏印' : '正印';
  }
  return '比肩';
}

export function getShortGod(god: string): string {
  const map: Record<string, string> = {
    '比肩': '比',
    '劫财': '劫',
    '食神': '食',
    '伤官': '伤',
    '偏财': '才',
    '正财': '财',
    '七杀': '杀',
    '正官': '官',
    '偏印': '枭',
    '正印': '印',
  };
  return map[god] || god.slice(0, 1);
}

// 12 ChangSheng Palaces table
const CHANG_SHENG_MAP: Record<string, Record<string, string>> = {
  '甲': { '亥': '长生', '子': '沐浴', '丑': '冠带', '寅': '临官', '卯': '帝旺', '辰': '衰', '巳': '病', '午': '死', '未': '墓', '申': '绝', '酉': '胎', '戌': '养' },
  '乙': { '午': '长生', '巳': '沐浴', '辰': '冠带', '卯': '临官', '寅': '帝旺', '丑': '衰', '子': '病', '亥': '死', '戌': '墓', '酉': '绝', '申': '胎', '未': '养' },
  '丙': { '寅': '长生', '卯': '沐浴', '辰': '冠带', '巳': '临官', '午': '帝旺', '未': '衰', '申': '病', '酉': '死', '戌': '墓', '亥': '绝', '子': '胎', '丑': '养' },
  '戊': { '寅': '长生', '卯': '沐浴', '辰': '冠带', '巳': '临官', '午': '帝旺', '未': '衰', '申': '病', '酉': '死', '戌': '墓', '亥': '绝', '子': '胎', '丑': '养' },
  '丁': { '酉': '长生', '申': '沐浴', '未': '冠带', '午': '临官', '巳': '帝旺', '辰': '衰', '卯': '病', '寅': '死', '丑': '墓', '子': '绝', '亥': '胎', '戌': '养' },
  '己': { '酉': '长生', '申': '沐浴', '未': '冠带', '午': '临官', '巳': '帝旺', '辰': '衰', '卯': '病', '寅': '死', '丑': '墓', '子': '绝', '亥': '胎', '戌': '养' },
  '庚': { '巳': '长生', '午': '沐浴', '未': '冠带', '申': '临官', '酉': '帝旺', '戌': '衰', '亥': '病', '子': '死', '丑': '墓', '寅': '绝', '卯': '胎', '辰': '养' },
  '辛': { '子': '长生', '亥': '沐浴', '戌': '冠带', '酉': '临官', '申': '帝旺', '未': '衰', '午': '病', '巳': '死', '辰': '墓', '卯': '绝', '寅': '胎', '丑': '养' },
  '壬': { '申': '长生', '酉': '沐浴', '戌': '冠带', '亥': '临官', '子': '帝旺', '丑': '衰', '寅': '病', '卯': '死', '辰': '墓', '巳': '绝', '午': '胎', '未': '养' },
  '癸': { '卯': '长生', '寅': '沐浴', '丑': '冠带', '子': '临官', '亥': '帝旺', '戌': '衰', '酉': '病', '申': '死', '未': '墓', '午': '绝', '巳': '胎', '辰': '养' },
};

export function getChangSheng(dayMaster: string, branch: string): string {
  return CHANG_SHENG_MAP[dayMaster]?.[branch] || '沐浴';
}

// JiaZi Xun & KongWang
export function getKongWang(ganZhi: string): { xunShou: string; kongWang: string } {
  const stem = ganZhi.slice(0, 1);
  const branch = ganZhi.slice(1, 2);
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  
  const sIdx = stems.indexOf(stem);
  const bIdx = branches.indexOf(branch);
  if (sIdx === -1 || bIdx === -1) return { xunShou: '(甲子)', kongWang: '戌亥' };
  
  const diff = (bIdx - sIdx + 12) % 12;
  const xunHeadBranch = branches[diff];
  const xunShou = `(甲${xunHeadBranch})`;
  
  const kong1 = branches[(diff + 10) % 12];
  const kong2 = branches[(diff + 11) % 12];
  return { xunShou, kongWang: `${kong1}${kong2}` };
}

// Inter-Pillar Interactions (合、冲、刑、害、破、暗合、自刑)
export function detectInteractions(stems: string[], branches: string[]): {
  stemHints: string;
  branchHints: string;
  interactions: { type: '合' | '冲' | '刑' | '害' | '破' | '暗合' | '自刑'; description: string; detail: string }[];
} {
  const interactions: { type: '合' | '冲' | '刑' | '害' | '破' | '暗合' | '自刑'; description: string; detail: string }[] = [];
  const stemInteractions: string[] = [];
  const branchInteractions: string[] = [];

  // Stem Combinations
  const stemHe: Record<string, string> = {
    '甲己': '甲己合化土', '己甲': '甲己合化土',
    '乙庚': '乙庚合化金', '庚乙': '乙庚合化金',
    '丙辛': '丙辛合化水', '辛丙': '丙辛合化水',
    '丁壬': '丁壬合化木', '壬丁': '丁壬合化木',
    '戊癸': '戊癸合化火', '癸戊': '戊癸合化火',
  };

  const stemChong: Record<string, string> = {
    '甲庚': '甲庚相冲', '庚甲': '甲庚相冲',
    '乙辛': '乙辛相冲', '辛乙': '乙辛相冲',
    '丙壬': '丙壬相冲', '壬丙': '丙壬相冲',
    '丁癸': '丁癸相冲', '癸丁': '丁癸相冲',
  };

  // Branch interactions
  const branchSixHe: Record<string, string> = {
    '子丑': '子丑六合化土', '丑子': '子丑六合化土',
    '寅亥': '寅亥六合化木', '亥寅': '寅亥六合化木',
    '卯戌': '卯戌六合化火', '戌卯': '卯戌六合化火',
    '辰酉': '辰酉六合化金', '酉辰': '辰酉六合化金',
    '巳申': '巳申六合化水', '申巳': '巳申六合化水',
    '午未': '午未六合化土', '未午': '午未六合化土',
  };

  const branchAnHe: Record<string, string> = {
    '午亥': '午亥可暗合', '亥午': '午亥可暗合',
    '寅丑': '寅丑可暗合', '丑寅': '寅丑可暗合',
    '卯申': '卯申可暗合', '申卯': '卯申可暗合',
    '子巳': '子巳可暗合', '巳子': '子巳可暗合',
  };

  const branchChong: Record<string, string> = {
    '子午': '子午相冲', '午子': '子午相冲',
    '丑未': '丑未相冲', '未丑': '丑未相冲',
    '寅申': '寅申相冲', '申寅': '寅申相冲',
    '卯酉': '卯酉相冲', '酉卯': '卯酉相冲',
    '辰戌': '辰戌相冲', '戌辰': '辰戌相冲',
    '巳亥': '巳亥相冲', '亥巳': '巳亥相冲',
  };

  const branchHai: Record<string, string> = {
    '子未': '子未相害', '未子': '子未相害',
    '丑午': '丑午相害', '午丑': '丑午相害',
    '寅巳': '寅巳相害', '巳寅': '寅巳相害',
    '卯辰': '卯辰相害', '辰卯': '卯辰相害',
    '申亥': '申亥可相害', '亥申': '申亥可相害',
    '酉戌': '酉戌相害', '戌酉': '酉戌相害',
  };

  const branchPo: Record<string, string> = {
    '子酉': '子酉相破', '酉子': '子酉相破',
    '丑辰': '丑辰相破', '辰丑': '丑辰相破',
    '寅亥': '寅亥相破', '亥寅': '寅亥相破',
    '卯午': '卯午相破', '午卯': '卯午相破',
    '巳申': '巳申相破', '申巳': '巳申相破',
    '未戌': '未戌相破', '戌未': '未戌相破',
  };

  // Self punishment: 辰辰, 午午, 酉酉, 亥亥
  const branchCounts: Record<string, number> = {};
  branches.forEach(b => { branchCounts[b] = (branchCounts[b] || 0) + 1; });
  ['辰', '午', '酉', '亥'].forEach(zi => {
    if ((branchCounts[zi] || 0) >= 2) {
      const msg = `${zi}${zi}可自刑`;
      branchInteractions.push(msg);
      interactions.push({ type: '自刑', description: msg, detail: `局中出现双${zi}，构成自刑，需注意情绪内耗或思虑过甚。` });
    }
  });

  // Check unique pairwise stem
  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      const pair = stems[i] + stems[j];
      if (stemHe[pair]) {
        stemInteractions.push(stemHe[pair]);
        interactions.push({ type: '合', description: stemHe[pair], detail: '天干相合，主相辅相成、情投意合或牵绊转化。' });
      } else if (stemChong[pair]) {
        stemInteractions.push(stemChong[pair]);
        interactions.push({ type: '冲', description: stemChong[pair], detail: '天干相冲，主冲突动荡、变动频繁或环境变迁。' });
      }
    }
  }

  // Check unique pairwise branch
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const pair = branches[i] + branches[j];
      if (branchAnHe[pair]) {
        if (!branchInteractions.includes(branchAnHe[pair])) {
          branchInteractions.push(branchAnHe[pair]);
          interactions.push({ type: '暗合', description: branchAnHe[pair], detail: '地支暗合，主暗中贵人相助、私下成事或潜在机缘。' });
        }
      }
      if (branchSixHe[pair]) {
        if (!branchInteractions.includes(branchSixHe[pair])) {
          branchInteractions.push(branchSixHe[pair]);
          interactions.push({ type: '合', description: branchSixHe[pair], detail: '地支六合，主亲和顺畅、合作共赢。' });
        }
      }
      if (branchHai[pair]) {
        if (!branchInteractions.includes(branchHai[pair])) {
          branchInteractions.push(branchHai[pair]);
          interactions.push({ type: '害', description: branchHai[pair], detail: '地支相害，主暗防阻滞、小人是非或口舌嫌隙。' });
        }
      }
      if (branchChong[pair]) {
        if (!branchInteractions.includes(branchChong[pair])) {
          branchInteractions.push(branchChong[pair]);
          interactions.push({ type: '冲', description: branchChong[pair], detail: '地支相冲，气场碰撞，主变动、走动或调整。' });
        }
      }
      if (branchPo[pair]) {
        if (!branchInteractions.includes(branchPo[pair])) {
          interactions.push({ type: '破', description: branchPo[pair], detail: '地支相破，主细微损耗或局部重组。' });
        }
      }
    }
  }

  const stemHints = stemInteractions.length > 0 ? stemInteractions.join('，') : '无合局的关系';
  const branchHints = branchInteractions.length > 0 ? branchInteractions.join(',') : '地支气场平和';

  return { stemHints, branchHints, interactions };
}

// Compute Stroke Count for Time Ju (e.g. 21划)
export function computeStrokeCount(stems: string[], branches: string[]): number {
  const strokeMap: Record<string, number> = {
    '甲': 5, '乙': 1, '丙': 5, '丁': 2, '戊': 5, '己': 3, '庚': 8, '辛': 7, '壬': 4, '癸': 9,
    '子': 3, '丑': 4, '寅': 11, '卯': 5, '辰': 7, '巳': 3, '午': 4, '未': 5, '申': 5, '酉': 7, '戌': 6, '亥': 6,
  };
  let sum = 0;
  stems.forEach(s => sum += strokeMap[s] || 4);
  branches.forEach(b => sum += strokeMap[b] || 5);
  // Mod or format realistic BaZi / Time Ju stroke index
  return sum % 32 + 10;
}

// Build complete Time Ju Chart
export function calculateTimeJuChart(
  date: Date,
  gender: Gender = 'male',
  options?: {
    profileName?: string;
    cityName?: string;
    isTrueSolarTime?: boolean;
    chartTypeLabel?: string;
  }
): TimeJuChartData {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  const yearGan = eightChar.getYearGan();
  const yearZhi = eightChar.getYearZhi();
  const monthGan = eightChar.getMonthGan();
  const monthZhi = eightChar.getMonthZhi();
  const dayGan = eightChar.getDayGan();
  const dayZhi = eightChar.getDayZhi();
  const timeGan = eightChar.getTimeGan();
  const timeZhi = eightChar.getTimeZhi();

  const dayMaster = dayGan;
  const dayGanZhi = `${dayGan}${dayZhi}`;
  const { xunShou } = getKongWang(dayGanZhi);

  // Pillar builder helper
  function buildPillar(name: string, stem: string, branch: string, highlight = false): PillarData {
    const stemElem = STEM_ELEMENTS[stem] || 'metal';
    const branchElem = BRANCH_ELEMENTS[branch] || 'fire';
    const stemGod = getTenGod(dayMaster, stem);
    const hiddenList = (HIDDEN_STEMS[branch] || []).map(hs => {
      const hElem = STEM_ELEMENTS[hs] || 'fire';
      const hGod = getTenGod(dayMaster, hs);
      return {
        stem: hs,
        element: hElem,
        elementName: ELEMENT_NAMES[hElem],
        god: hGod,
      };
    });

    const secondaryGods = hiddenList.map(h => h.god);
    const changSheng = getChangSheng(dayMaster, branch);
    const { kongWang } = getKongWang(`${stem}${branch}`);

    // Micro gods badges for detailed view (e.g. 杀/官/印)
    const microGods = [getShortGod(stemGod), ...secondaryGods.map(getShortGod)].slice(0, 3);

    return {
      name,
      stem,
      stemElement: stemElem,
      stemGod,
      stemMicroGods: microGods,
      branch,
      branchElement: branchElem,
      hiddenStems: hiddenList,
      secondaryGods,
      changSheng,
      kongWang,
      isHighlighted: highlight,
    };
  }

  const yearPillar = buildPillar('年柱', yearGan, yearZhi);
  const monthPillar = buildPillar('月柱', monthGan, monthZhi);
  const dayPillar = buildPillar('日柱', dayGan, dayZhi);
  const hourPillar = buildPillar('时柱', timeGan, timeZhi, true);

  // Compute interactions
  const allStems = [yearGan, monthGan, dayGan, timeGan];
  const allBranches = [yearZhi, monthZhi, dayZhi, timeZhi];
  const { stemHints, branchHints, interactions } = detectInteractions(allStems, allBranches);

  // Solar Terms
  const prevJieQi = lunar.getPrevJieQi(true);
  const nextJieQi = lunar.getNextJieQi(true);
  const prevSolar = prevJieQi ? prevJieQi.getSolar() : solar;
  const nextSolar = nextJieQi ? nextJieQi.getSolar() : solar;

  const solarTerms: SolarTermInfo = {
    prevTerm: {
      name: prevJieQi ? prevJieQi.getName() : '立秋',
      time: `${prevSolar.getYear()}-${String(prevSolar.getMonth()).padStart(2, '0')}-${String(prevSolar.getDay()).padStart(2, '0')} 00:00:00`,
    },
    nextTerm: {
      name: nextJieQi ? nextJieQi.getName() : '处暑',
      time: `${nextSolar.getYear()}-${String(nextSolar.getMonth()).padStart(2, '0')}-${String(nextSolar.getDay()).padStart(2, '0')} 00:00:00`,
    },
  };

  // LiuNian current pillar
  const curYear = solar.getYear();
  const liuNianPillar = buildPillar('流年', yearGan, yearZhi);
  liuNianPillar.yearOrAge = '1岁';

  // XiaoYun pillar (e.g. 戊子 for early years)
  // XiaoYun rotates based on gender and stem polarity
  const isYang = STEM_YIN_YANG[yearGan];
  const isForward = (gender === 'male' && isYang) || (gender === 'female' && !isYang);
  const stemsSeq = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const branchesSeq = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const timeStemIdx = stemsSeq.indexOf(timeGan);
  const timeBranchIdx = branchesSeq.indexOf(timeZhi);
  const xiaoYunStem = stemsSeq[(timeStemIdx + (isForward ? 1 : -1) + 10) % 10];
  const xiaoYunBranch = branchesSeq[(timeBranchIdx + (isForward ? 1 : -1) + 12) % 12];
  const xiaoYunPillar = buildPillar('小运', xiaoYunStem, xiaoYunBranch);
  xiaoYunPillar.yearOrAge = '1-5岁';

  // Detailed 6 Columns: [流年, 小运, 年柱, 月柱, 日柱, 时柱]
  const detailedColumns = [
    {
      header: '流年',
      age: '1岁',
      yearOrVal: `${curYear}`,
      pillar: liuNianPillar,
    },
    {
      header: '小运',
      age: '1-5岁',
      yearOrVal: `${curYear}`,
      pillar: xiaoYunPillar,
    },
    {
      header: '年柱',
      age: undefined,
      yearOrVal: `${curYear}`,
      pillar: yearPillar,
    },
    {
      header: '月柱',
      age: undefined,
      yearOrVal: `${solar.getMonth()}`,
      pillar: monthPillar,
    },
    {
      header: '日柱',
      age: undefined,
      yearOrVal: `${solar.getDay()}`,
      pillar: dayPillar,
    },
    {
      header: '时柱',
      age: undefined,
      yearOrVal: `${String(solar.getHour()).padStart(2, '0')}:${String(solar.getMinute()).padStart(2, '0')}`,
      pillar: hourPillar,
    },
  ];

  // 12 Monthly luck stems and branches starting from 寅月 (Tiger month)
  // Using the Year Stem to determine Yin month stem:
  // 甲己之年丙作首，乙庚之岁戊为头，丙辛必定寻庚起，丁壬壬位顺行流，若问戊癸何方发，甲寅之上好追求。
  const monthStartStemMap: Record<string, string> = {
    '甲': '丙', '己': '丙',
    '乙': '戊', '庚': '戊',
    '丙': '庚', '辛': '庚',
    '丁': '壬', '壬': '壬',
    '戊': '甲', '癸': '甲',
  };
  const startStem = monthStartStemMap[yearGan] || '庚';
  const startStemIdx = stemsSeq.indexOf(startStem);
  const monthBranchOrder = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];

  const liuYue = monthBranchOrder.map((branch, i) => {
    const s = stemsSeq[(startStemIdx + i) % 10];
    return {
      monthIndex: i + 1,
      stem: s,
      stemElement: STEM_ELEMENTS[s],
      branch,
      branchElement: BRANCH_ELEMENTS[branch],
      name: `${branch}月`,
    };
  });

  // DaYun Calculation
  const daYunList = [
    {
      index: 0,
      ageRange: '1-5岁',
      startYear: curYear,
      stem: '小',
      branch: '运',
      stemElement: 'water' as FiveElement,
      branchElement: 'water' as FiveElement,
      god: '小运',
      isXiaoYun: true,
    },
  ];

  // Derive DaYun sequence from month pillar
  const mStemIdx = stemsSeq.indexOf(monthGan);
  const mBranchIdx = branchesSeq.indexOf(monthZhi);
  const startDaYunAge = 6; // Classical rounded start age
  for (let i = 1; i <= 8; i++) {
    const dyStem = stemsSeq[(mStemIdx + (isForward ? i : -i) + 100) % 10];
    const dyBranch = branchesSeq[(mBranchIdx + (isForward ? i : -i) + 120) % 12];
    const dyAge = startDaYunAge + (i - 1) * 10;
    const dyYear = curYear + (dyAge - 1);
    daYunList.push({
      index: i,
      ageRange: `${dyAge}岁`,
      startYear: dyYear,
      stem: dyStem,
      branch: dyBranch,
      stemElement: STEM_ELEMENTS[dyStem],
      branchElement: BRANCH_ELEMENTS[dyBranch],
      god: getTenGod(dayMaster, dyStem),
      isXiaoYun: false,
    });
  }

  // Next 5-10 LiuNian years
  const liuNianList = [];
  const yearStemIdx = stemsSeq.indexOf(yearGan);
  const yearBranchIdx = branchesSeq.indexOf(yearZhi);
  for (let i = 0; i < 5; i++) {
    const y = curYear + i;
    const lnStem = stemsSeq[(yearStemIdx + i) % 10];
    const lnBranch = branchesSeq[(yearBranchIdx + i) % 12];
    liuNianList.push({
      year: y,
      stem: lnStem,
      branch: lnBranch,
      stemElement: STEM_ELEMENTS[lnStem],
      branchElement: BRANCH_ELEMENTS[lnBranch],
      god: getTenGod(dayMaster, lnStem),
    });
  }

  // Five Elements Distribution calculation
  const elementCount: Record<FiveElement, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  allStems.forEach(s => { elementCount[STEM_ELEMENTS[s]] += 1.2; });
  allBranches.forEach(b => {
    elementCount[BRANCH_ELEMENTS[b]] += 1.0;
    (HIDDEN_STEMS[b] || []).forEach(hs => {
      elementCount[STEM_ELEMENTS[hs]] += 0.4;
    });
  });

  const totalPoints = Object.values(elementCount).reduce((a, b) => a + b, 0) || 1;
  const fiveElementsStats = {
    wood: Math.round((elementCount.wood / totalPoints) * 100),
    fire: Math.round((elementCount.fire / totalPoints) * 100),
    earth: Math.round((elementCount.earth / totalPoints) * 100),
    metal: Math.round((elementCount.metal / totalPoints) * 100),
    water: Math.round((elementCount.water / totalPoints) * 100),
  };

  // Find dominant & favored
  const dominantElement = (Object.keys(fiveElementsStats) as FiveElement[]).reduce((a, b) =>
    fiveElementsStats[a] > fiveElementsStats[b] ? a : b
  );
  const favoredElement = ELEMENT_RELATIONS[dominantElement].overcomeBy;

  const zodiac = lunar.getYearShengXiao();
  const strokeCount = computeStrokeCount(allStems, allBranches);

  return {
    gender,
    genderLabel: gender === 'male' ? '乾造' : '坤造',
    chartTypeLabel: options?.chartTypeLabel || (options?.profileName ? `${options.profileName}的局` : '即时局'),
    profileName: options?.profileName,
    cityName: options?.cityName,
    isTrueSolarTime: options?.isTrueSolarTime,
    strokeCount,
    xunShou,
    zodiac: `属${zodiac}`,
    lunarText: `农历: 农历${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${eightChar.getTimeZhi()}时`,
    gregorianDateStr: `${solar.getYear()}-${String(solar.getMonth()).padStart(2, '0')}-${String(solar.getDay()).padStart(2, '0')} ${String(solar.getHour()).padStart(2, '0')}:${String(solar.getMinute()).padStart(2, '0')}`,
    overviewPillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
    },
    detailedColumns,
    liuYue,
    daYunList,
    liuNianList,
    solarTerms,
    stemHints,
    branchHints,
    allInteractions: interactions,
    fiveElementsStats,
    dominantElement: ELEMENT_NAMES[dominantElement],
    favoredElement: ELEMENT_NAMES[favoredElement],
  };
}
