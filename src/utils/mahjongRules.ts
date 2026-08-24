import {
  MahjongTileData,
  Meld,
  MeldType,
  HuResult,
  AvailableClaim,
  ElementType,
} from '../types/mahjong';

// 1. Definition of all unique tile specs
export const TILE_DEFINITIONS: Array<Omit<MahjongTileData, 'id'>> = [
  // 5行 (5 * 4 = 20)
  { name: '木', category: 'element', element: 'wood', elementName: '木' },
  { name: '火', category: 'element', element: 'fire', elementName: '火' },
  { name: '土', category: 'element', element: 'earth', elementName: '土' },
  { name: '金', category: 'element', element: 'metal', elementName: '金' },
  { name: '水', category: 'element', element: 'water', elementName: '水' },

  // 10天干 (10 * 4 = 40)
  { name: '甲', category: 'stem', element: 'wood', elementName: '木', yinYang: 'yang' },
  { name: '乙', category: 'stem', element: 'wood', elementName: '木', yinYang: 'yin' },
  { name: '丙', category: 'stem', element: 'fire', elementName: '火', yinYang: 'yang' },
  { name: '丁', category: 'stem', element: 'fire', elementName: '火', yinYang: 'yin' },
  { name: '戊', category: 'stem', element: 'earth', elementName: '土', yinYang: 'yang' },
  { name: '己', category: 'stem', element: 'earth', elementName: '土', yinYang: 'yin' },
  { name: '庚', category: 'stem', element: 'metal', elementName: '金', yinYang: 'yang' },
  { name: '辛', category: 'stem', element: 'metal', elementName: '金', yinYang: 'yin' },
  { name: '壬', category: 'stem', element: 'water', elementName: '水', yinYang: 'yang' },
  { name: '癸', category: 'stem', element: 'water', elementName: '水', yinYang: 'yin' },

  // 12地支 (12 * 4 = 48)
  { name: '寅', category: 'branch', element: 'wood', elementName: '木', yinYang: 'yang' },
  { name: '卯', category: 'branch', element: 'wood', elementName: '木', yinYang: 'yin' },
  { name: '辰', category: 'branch', element: 'earth', elementName: '土', yinYang: 'yang' },
  { name: '巳', category: 'branch', element: 'fire', elementName: '火', yinYang: 'yin' },
  { name: '午', category: 'branch', element: 'fire', elementName: '火', yinYang: 'yang' },
  { name: '未', category: 'branch', element: 'earth', elementName: '土', yinYang: 'yin' },
  { name: '申', category: 'branch', element: 'metal', elementName: '金', yinYang: 'yang' },
  { name: '酉', category: 'branch', element: 'metal', elementName: '金', yinYang: 'yin' },
  { name: '戌', category: 'branch', element: 'earth', elementName: '土', yinYang: 'yang' },
  { name: '亥', category: 'branch', element: 'water', elementName: '水', yinYang: 'yin' },
  { name: '子', category: 'branch', element: 'water', elementName: '水', yinYang: 'yang' },
  { name: '丑', category: 'branch', element: 'earth', elementName: '土', yinYang: 'yin' },
];

// Color & theme styling mapping
export const ELEMENT_COLORS: Record<ElementType, {
  text: string;
  bg: string;
  badge: string;
  border: string;
  gradient: string;
}> = {
  wood: {
    text: '#10B981', // emerald
    bg: '#064E3B',
    badge: 'bg-emerald-950/80 text-emerald-400 border-emerald-700/50',
    border: 'border-emerald-500/40',
    gradient: 'from-emerald-600 to-emerald-900',
  },
  fire: {
    text: '#EF4444', // red
    bg: '#7F1D1D',
    badge: 'bg-rose-950/80 text-rose-400 border-rose-700/50',
    border: 'border-rose-500/40',
    gradient: 'from-red-600 to-rose-950',
  },
  earth: {
    text: '#F59E0B', // amber / brown
    bg: '#78350F',
    badge: 'bg-amber-950/80 text-amber-400 border-amber-700/50',
    border: 'border-amber-500/40',
    gradient: 'from-amber-600 to-amber-950',
  },
  metal: {
    text: '#F97316', // orange gold
    bg: '#7C2D12',
    badge: 'bg-orange-950/80 text-orange-400 border-orange-700/50',
    border: 'border-orange-500/40',
    gradient: 'from-orange-500 to-amber-800',
  },
  water: {
    text: '#38BDF8', // sky/cyan blue
    bg: '#0C4A6E',
    badge: 'bg-sky-950/80 text-sky-400 border-sky-700/50',
    border: 'border-sky-500/40',
    gradient: 'from-blue-600 to-sky-950',
  },
};

// 2. Clashes (对冲关系)
export const CLASH_PAIRS: Record<string, string> = {
  // 天干四冲
  '甲': '庚', '庚': '甲',
  '乙': '辛', '辛': '乙',
  '壬': '丙', '丙': '壬',
  '丁': '癸', '癸': '丁',
  // 地支六冲
  '子': '午', '午': '子',
  '卯': '酉', '酉': '卯',
  '巳': '亥', '亥': '巳',
  '丑': '未', '未': '丑',
  '辰': '戌', '戌': '辰',
  '寅': '申', '申': '寅',
  // 五行冲
  '金': '木', '木': '金',
  '水': '火', '火': '水',
};

export function getClashOpposite(char: string): string | undefined {
  return CLASH_PAIRS[char];
}

// 3. Valid Set Patterns (砍的组合字典)
export interface KanPattern {
  name: string;
  type: MeldType;
  typeLabel: string;
  tiles: [string, string, string];
  key: string;
}

export const CANONICAL_KANS: KanPattern[] = [
  // 五行相生 (5 sets)
  { name: '金水木', type: 'five_elements_generation', typeLabel: '五行相生', tiles: ['金', '水', '木'], key: '金水木' },
  { name: '水木火', type: 'five_elements_generation', typeLabel: '五行相生', tiles: ['水', '木', '火'], key: '水木火' },
  { name: '木火土', type: 'five_elements_generation', typeLabel: '五行相生', tiles: ['木', '火', '土'], key: '木火土' },
  { name: '火土金', type: 'five_elements_generation', typeLabel: '五行相生', tiles: ['火', '土', '金'], key: '火土金' },
  { name: '土金水', type: 'five_elements_generation', typeLabel: '五行相生', tiles: ['土', '金', '水'], key: '土金水' },

  // 天干五合 (5 sets)
  { name: '甲己土', type: 'stem_combine', typeLabel: '天干五合', tiles: ['甲', '己', '土'], key: '甲己土' },
  { name: '乙庚金', type: 'stem_combine', typeLabel: '天干五合', tiles: ['乙', '庚', '金'], key: '乙庚金' },
  { name: '丙辛水', type: 'stem_combine', typeLabel: '天干五合', tiles: ['丙', '辛', '水'], key: '丙辛水' },
  { name: '丁壬木', type: 'stem_combine', typeLabel: '天干五合', tiles: ['丁', '壬', '木'], key: '丁壬木' },
  { name: '戊癸火', type: 'stem_combine', typeLabel: '天干五合', tiles: ['戊', '癸', '火'], key: '戊癸火' },

  // 地支六合 (6 sets)
  { name: '巳申水', type: 'branch_six_combine', typeLabel: '地支六合', tiles: ['巳', '申', '水'], key: '巳申水' },
  { name: '卯戌火', type: 'branch_six_combine', typeLabel: '地支六合', tiles: ['卯', '戌', '火'], key: '卯戌火' },
  { name: '寅亥木', type: 'branch_six_combine', typeLabel: '地支六合', tiles: ['寅', '亥', '木'], key: '寅亥木' },
  { name: '午未土', type: 'branch_six_combine', typeLabel: '地支六合', tiles: ['午', '未', '土'], key: '午未土' },
  { name: '辰酉金', type: 'branch_six_combine', typeLabel: '地支六合', tiles: ['辰', '酉', '金'], key: '辰酉金' },
  { name: '子丑土', type: 'branch_six_combine', typeLabel: '地支六合', tiles: ['子', '丑', '土'], key: '子丑土' },

  // 地支三合 (4 sets)
  { name: '寅午戌', type: 'branch_three_harmony', typeLabel: '地支三合', tiles: ['寅', '午', '戌'], key: '寅午戌' },
  { name: '亥卯未', type: 'branch_three_harmony', typeLabel: '地支三合', tiles: ['亥', '卯', '未'], key: '亥卯未' },
  { name: '申子辰', type: 'branch_three_harmony', typeLabel: '地支三合', tiles: ['申', '子', '辰'], key: '申子辰' },
  { name: '巳酉丑', type: 'branch_three_harmony', typeLabel: '地支三合', tiles: ['巳', '酉', '丑'], key: '巳酉丑' },

  // 地支三会 (4 sets)
  { name: '巳午未', type: 'branch_three_meet', typeLabel: '地支三会', tiles: ['巳', '午', '未'], key: '巳午未' },
  { name: '申酉戌', type: 'branch_three_meet', typeLabel: '地支三会', tiles: ['申', '酉', '戌'], key: '申酉戌' },
  { name: '亥子丑', type: 'branch_three_meet', typeLabel: '地支三会', tiles: ['亥', '子', '丑'], key: '亥子丑' },
  { name: '寅卯辰', type: 'branch_three_meet', typeLabel: '地支三会', tiles: ['寅', '卯', '辰'], key: '寅卯辰' },

  // 地支三刑 (2 sets)
  { name: '寅巳申', type: 'branch_three_penalty', typeLabel: '地支三刑', tiles: ['寅', '巳', '申'], key: '寅巳申' },
  { name: '丑未戌', type: 'branch_three_penalty', typeLabel: '地支三刑', tiles: ['丑', '未', '戌'], key: '丑未戌' },
];

// Helper to check if 3 characters form a valid Kan (砍)
export function checkThreeTilesKan(names: string[]): { isValid: boolean; type: MeldType; typeLabel: string } | null {
  if (names.length !== 3) return null;

  // 1. Triplets (三同字)
  if (names[0] === names[1] && names[1] === names[2]) {
    return { isValid: true, type: 'triplet', typeLabel: '三同刻' };
  }

  // 2. Clash Melds (冲战砍: 2 of A + 1 of B where A and B clash)
  const counts: Record<string, number> = {};
  for (const n of names) counts[n] = (counts[n] || 0) + 1;
  const keys = Object.keys(counts);
  if (keys.length === 2) {
    const double = keys.find(k => counts[k] === 2);
    const single = keys.find(k => counts[k] === 1);
    if (double && single && CLASH_PAIRS[double] === single) {
      return { isValid: true, type: 'clash_meld', typeLabel: '冲战砍' };
    }
  }

  // 3. Fixed Kans (天干五合, 地支六合, 地支三合, 地支三会, 地支三刑)
  const sortedNames = [...names].sort();
  for (const kan of CANONICAL_KANS) {
    const kanSorted = [...kan.tiles].sort();
    if (sortedNames[0] === kanSorted[0] && sortedNames[1] === kanSorted[1] && sortedNames[2] === kanSorted[2]) {
      return { isValid: true, type: kan.type, typeLabel: kan.typeLabel };
    }
  }

  return null;
}

// Generate complete shuffled deck of 108 tiles
export function createDeck(): MahjongTileData[] {
  const deck: MahjongTileData[] = [];
  let uid = 0;

  TILE_DEFINITIONS.forEach(def => {
    for (let i = 0; i < 4; i++) {
      deck.push({
        ...def,
        id: `${def.name}_${i}_${uid++}`,
      });
    }
  });

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

// Check Chow possibilities from discarded card (from left player)
export function findEatOptions(hand: MahjongTileData[], discarded: MahjongTileData): Array<{ tiles: MahjongTileData[]; kan: KanPattern }> {
  const results: Array<{ tiles: MahjongTileData[]; kan: KanPattern }> = [];
  const targetName = discarded.name;

  // Search in canonical combinations that contain targetName
  for (const kan of CANONICAL_KANS) {
    if (kan.tiles.includes(targetName)) {
      // The other two needed tiles
      const remainingNeeded = [...kan.tiles];
      const idx = remainingNeeded.indexOf(targetName);
      remainingNeeded.splice(idx, 1);

      const [needA, needB] = remainingNeeded;
      const foundA = hand.find(t => t.name === needA);
      const foundB = hand.find(t => t.name === needB && t.id !== foundA?.id);

      if (foundA && foundB) {
        results.push({
          tiles: [foundA, foundB],
          kan,
        });
      }
    }
  }

  return results;
}

// Check Pung possibilities (Normal Pung & Clash Pung)
export function findPungOptions(
  hand: MahjongTileData[],
  discarded: MahjongTileData
): {
  normalPung: MahjongTileData[] | null;
  clashPung: MahjongTileData[] | null;
} {
  const targetName = discarded.name;

  // 1. Normal Pung: 2 matching identical tiles
  const matching = hand.filter(t => t.name === targetName);
  const normalPung = matching.length >= 2 ? matching.slice(0, 2) : null;

  // 2. Clash Pung: 2 tiles that clash with discarded
  const clashTarget = CLASH_PAIRS[targetName];
  let clashPung: MahjongTileData[] | null = null;
  if (clashTarget) {
    const clashMatching = hand.filter(t => t.name === clashTarget);
    if (clashMatching.length >= 2) {
      clashPung = clashMatching.slice(0, 2);
    }
  }

  return { normalPung, clashPung };
}

// Check Kong (杠) possibilities (3 identical in hand matching discarded, or 4 in hand)
export function findKongOptions(hand: MahjongTileData[], discarded?: MahjongTileData): MahjongTileData[][] {
  if (discarded) {
    const matching = hand.filter(t => t.name === discarded.name);
    if (matching.length >= 3) {
      return [matching.slice(0, 3)];
    }
    return [];
  }

  // Concealed Kong (暗杠)
  const counts: Record<string, MahjongTileData[]> = {};
  for (const t of hand) {
    counts[t.name] = counts[t.name] || [];
    counts[t.name].push(t);
  }
  return Object.values(counts).filter(arr => arr.length === 4);
}

// Full Hu Check Algorithm (14 tiles: combination of hand + declared melds)
export function checkHu(
  hand: MahjongTileData[],
  declaredMelds: Meld[] = [],
  isTianHu: boolean = false,
  isGangShangKaiHua: boolean = false
): HuResult {
  const totalCount = hand.length + declaredMelds.length * 3;
  if (totalCount !== 14) {
    return {
      isHu: false,
      fans: 0,
      fanDetails: [],
      explanation: `牌数不对 (当前${totalCount}张，需14张)`,
    };
  }

  // 1. Check 7 Pairs (七巧对: only if no declared open melds)
  if (declaredMelds.length === 0 && hand.length === 14) {
    const counts: Record<string, MahjongTileData[]> = {};
    for (const t of hand) {
      counts[t.name] = counts[t.name] || [];
      counts[t.name].push(t);
    }
    const pairs = Object.values(counts).filter(arr => arr.length === 2 || arr.length === 4);
    const totalPairUnits = Object.values(counts).reduce((acc, arr) => acc + Math.floor(arr.length / 2), 0);

    if (totalPairUnits === 7) {
      const fanDetails = ['五番：七巧对 (7对子)'];
      let fanScore = 5;
      if (isTianHu) {
        fanDetails.push('加番：天胡 (+5番)');
        fanScore += 5;
      }
      if (isGangShangKaiHua) {
        fanDetails.push('加番：杠上开花 (+1番)');
        fanScore += 1;
      }

      return {
        isHu: true,
        isSevenPairs: true,
        fans: fanScore,
        fanDetails,
        explanation: '胡牌：七巧对',
      };
    }
  }

  // 2. Check 4 Kans + 1 Pair
  const neededKans = 4 - declaredMelds.length;
  const kanSolutions: MahjongTileData[][][] = [];
  let winningPair: MahjongTileData[] | undefined;

  // Group hand by unique tile name for pairs
  const tileNames = Array.from(new Set(hand.map(t => t.name)));

  for (const pairName of tileNames) {
    const matching = hand.filter(t => t.name === pairName);
    if (matching.length >= 2) {
      // Pick 2 as pair
      const pair = matching.slice(0, 2);
      const remaining = [...hand];
      // remove pair
      remaining.splice(remaining.findIndex(t => t.id === pair[0].id), 1);
      remaining.splice(remaining.findIndex(t => t.id === pair[1].id), 1);

      // Try decomposing remaining tiles into neededKans
      const foundKans = solveKans(remaining, neededKans);
      if (foundKans) {
        winningPair = pair;
        kanSolutions.push(foundKans);
        break; // found valid winning structure
      }
    }
  }

  if (!winningPair || kanSolutions.length === 0) {
    return {
      isHu: false,
      fans: 0,
      fanDetails: [],
      explanation: '尚未满足4砍+1将或七巧对条件',
    };
  }

  // Combine internal solved Kans with declared Melds to evaluate Fans
  const internalKans = kanSolutions[0];
  const allKans: Array<{ tiles: MahjongTileData[]; type: MeldType; typeLabel: string }> = [
    ...declaredMelds.map(m => ({ tiles: m.tiles, type: m.type, typeLabel: m.typeLabel })),
    ...internalKans.map(tiles => {
      const res = checkThreeTilesKan(tiles.map(t => t.name))!;
      return { tiles, type: res.type, typeLabel: res.typeLabel };
    }),
  ];

  // Calculate Fans according to Page 13 of PDF
  const fanCalc = calculateFans(allKans, winningPair, isTianHu, isGangShangKaiHua);

  return {
    isHu: true,
    isSevenPairs: false,
    fans: fanCalc.fans,
    fanDetails: fanCalc.details,
    pair: winningPair,
    kans: allKans.map(k => k.tiles),
    explanation: fanCalc.explanation,
  };
}

// Backtracking solver to decompose hand into K sets of valid 3-card Kans
function solveKans(tiles: MahjongTileData[], countNeeded: number): MahjongTileData[][] | null {
  if (countNeeded === 0 && tiles.length === 0) return [];
  if (tiles.length !== countNeeded * 3) return null;

  // Try picking the first tile and find 2 others that form a valid Kan
  const first = tiles[0];
  const rest = tiles.slice(1);

  for (let i = 0; i < rest.length; i++) {
    for (let j = i + 1; j < rest.length; j++) {
      const candidateNames = [first.name, rest[i].name, rest[j].name];
      const check = checkThreeTilesKan(candidateNames);
      if (check && check.isValid) {
        const currentKan = [first, rest[i], rest[j]];
        const remainingTiles = rest.filter((_, idx) => idx !== i && idx !== j);
        const sub = solveKans(remainingTiles, countNeeded - 1);
        if (sub !== null) {
          return [currentKan, ...sub];
        }
      }
    }
  }

  return null;
}

// Detailed Fan calculation according to Page 13 of the rules
export function calculateFans(
  allKans: Array<{ tiles: MahjongTileData[]; type: MeldType; typeLabel: string }>,
  pair: MahjongTileData[],
  isTianHu: boolean,
  isGangShangKaiHua: boolean
): { fans: number; details: string[]; explanation: string } {
  const details: string[] = [];
  let baseFan = 1;
  let summaryTitle = '一番：小P胡 (常规胡牌)';

  const allKansTypes = allKans.map(k => k.type);

  // Check 1: 纯三合 / 纯三会 / 纯三刑 (四番)
  const isPureSanHe = allKansTypes.every(t => t === 'branch_three_harmony');
  const isPureSanHui = allKansTypes.every(t => t === 'branch_three_meet');
  const isPureSanXing = allKansTypes.every(t => t === 'branch_three_penalty');

  if (isPureSanHe || isPureSanHui || isPureSanXing) {
    baseFan = 4;
    const name = isPureSanHe ? '纯三合' : isPureSanHui ? '纯三会' : '纯三刑';
    summaryTitle = `四番：${name}`;
    details.push(`四番牌面：${name} (4组全为${name})`);
  }
  // Check 2: 全碰 (对对胡 / 4刻子) (三番)
  else if (allKansTypes.every(t => t === 'triplet' || t === 'kong')) {
    baseFan = 3;
    summaryTitle = '三番：全碰 (对对胡)';
    details.push('三番牌面：全碰 (4组均为同字刻子)');
  }
  // Check 3: 纯水火 / 金木冲战 (三番)
  else if (
    allKans.every(k =>
      k.tiles.every(t => t.element === 'water' || t.element === 'fire')
    ) &&
    pair.every(t => t.element === 'water' || t.element === 'fire')
  ) {
    baseFan = 3;
    summaryTitle = '三番：纯水火冲战';
    details.push('三番牌面：纯水火对决冲战');
  } else if (
    allKans.every(k =>
      k.tiles.every(t => t.element === 'metal' || t.element === 'wood')
    ) &&
    pair.every(t => t.element === 'metal' || t.element === 'wood')
  ) {
    baseFan = 3;
    summaryTitle = '三番：纯金木冲战';
    details.push('三番牌面：纯金木对决冲战');
  }
  // Check 4: 三合三会三刑荟局 (三番)
  else if (
    allKansTypes.every(t =>
      ['branch_three_harmony', 'branch_three_meet', 'branch_three_penalty'].includes(t)
    )
  ) {
    baseFan = 3;
    summaryTitle = '三番：三合三会三刑荟局';
    details.push('三番牌面：三合三会三刑荟局');
  }
  // Check 5: 全部冲战 (二番)
  else if (allKansTypes.every(t => t === 'clash_meld')) {
    baseFan = 2;
    summaryTitle = '二番：全部冲战';
    details.push('二番牌面：全部冲战 (4组均为冲对立砍)');
  }
  // Check 6: 小P胡 (一番)
  else {
    baseFan = 1;
    summaryTitle = '一番：啥都有 小P胡';
    details.push('一番牌面：啥都有 小P胡 (常规4砍+1将)');
  }

  let totalFans = baseFan;

  // Add extra fans (加番)
  if (isTianHu) {
    totalFans += 5;
    details.push('加番：天胡 (+5番)');
  }
  if (isGangShangKaiHua) {
    totalFans += 1;
    details.push('加番：杠上开花 (+1番)');
  }

  return {
    fans: totalFans,
    details,
    explanation: summaryTitle,
  };
}

export interface HuAuditReport {
  isHu: boolean;
  isSevenPairs: boolean;
  totalTilesCount: number;
  tileCountValid: boolean;
  pair?: MahjongTileData[];
  kans?: Array<{ tiles: MahjongTileData[]; type: MeldType; typeLabel: string; isValid: boolean }>;
  fans: number;
  fanDetails: string[];
  explanation: string;
  auditMessage: string;
  diagnostics: {
    status: 'pass' | 'fail' | 'incomplete';
    tileCountMsg: string;
    pairMsg: string;
    kansMsg: string;
    advice: string;
  };
}

// Comprehensive Audit & Diagnostic tool for player Hu declaration
export function auditHuHand(
  hand: MahjongTileData[],
  declaredMelds: Meld[] = [],
  isTianHu: boolean = false,
  isGangShangKaiHua: boolean = false
): HuAuditReport {
  const totalCount = hand.length + declaredMelds.length * 3;
  const tileCountValid = totalCount === 14;

  const standardHu = checkHu(hand, declaredMelds, isTianHu, isGangShangKaiHua);

  if (standardHu.isHu) {
    const kansAudit = (standardHu.kans || []).map(k => {
      const info = checkThreeTilesKan(k.map(t => t.name));
      return {
        tiles: k,
        type: info?.type || ('triplet' as MeldType),
        typeLabel: info?.typeLabel || '有效砍牌',
        isValid: true,
      };
    });

    return {
      isHu: true,
      isSevenPairs: !!standardHu.isSevenPairs,
      totalTilesCount: totalCount,
      tileCountValid: true,
      pair: standardHu.pair,
      kans: kansAudit,
      fans: standardHu.fans,
      fanDetails: standardHu.fanDetails,
      explanation: standardHu.explanation,
      auditMessage: `【审核通过】恭喜！手牌完全符合五行胡牌规则，达到 ${standardHu.fans} 番！`,
      diagnostics: {
        status: 'pass',
        tileCountMsg: `手牌张数检测：14张齐整 (手牌${hand.length}张 + 副露${declaredMelds.length}组)`,
        pairMsg: standardHu.isSevenPairs ? '七巧对：7组对子完整' : `雀头将牌：【${standardHu.pair?.[0]?.name || ''}${standardHu.pair?.[1]?.name || ''}】合规`,
        kansMsg: standardHu.isSevenPairs ? '七巧对无需凑砍' : `砍牌检验：4组砍牌全数合规达标`,
        advice: '牌型完美，可直接宣布胡牌！',
      },
    };
  }

  // Not Hu yet - compile diagnostic feedback
  let tileCountMsg = `张数检测：当前共 ${totalCount} 张 (正常胡牌需整14张)`;
  if (!tileCountValid) {
    if (totalCount < 14) tileCountMsg += '，尚缺张数，请先摸牌或碰吃补齐';
    else tileCountMsg += '，多牌相公，无法成胡';
  } else {
    tileCountMsg += ' (张数达标)';
  }

  // Check pairs in hand
  const counts: Record<string, number> = {};
  for (const t of hand) counts[t.name] = (counts[t.name] || 0) + 1;
  const pairNames = Object.keys(counts).filter(k => counts[k] >= 2);
  const pairMsg = pairNames.length > 0
    ? `对子检测：现有对子【${pairNames.join('、')}】，可作为雀头候选`
    : '对子检测：当前手牌没有同字对子，缺少雀头将牌';

  // Check closest Kan possibilities
  const adviceList: string[] = [];
  if (pairNames.length === 0) {
    adviceList.push('需留一对相同牌作为雀头将牌');
  }
  adviceList.push('检查是否有孤张未形成相生(如金水木)、五合(如甲己土)、三合(如寅午戌)、六合(如巳申水)或冲战砍');

  return {
    isHu: false,
    isSevenPairs: false,
    totalTilesCount: totalCount,
    tileCountValid,
    fans: 0,
    fanDetails: [],
    explanation: '尚未满足4砍+1将或七巧对条件',
    auditMessage: '【审核未通过】当前手牌组合尚未达成五行麻将胡牌标准 (防炸胡保护中)',
    diagnostics: {
      status: totalCount === 14 ? 'fail' : 'incomplete',
      tileCountMsg,
      pairMsg,
      kansMsg: '砍牌检验：部分手牌未能成砍 (未满足三同/相生/五合/六合/三合/三会/三刑/冲战)',
      advice: adviceList.join('；'),
    },
  };
}

// Audit user's manual 4 Kans + 1 Pair decomposition
export function auditManualDecomposition(
  kanSlots: MahjongTileData[][],
  pairSlot: MahjongTileData[],
  declaredMelds: Meld[] = [],
  isTianHu: boolean = false,
  isGangShangKaiHua: boolean = false
): HuAuditReport {
  // Total kans needed = 4 - declaredMelds.length
  const neededKans = 4 - declaredMelds.length;
  const activeKanSlots = kanSlots.slice(0, neededKans);

  // Check pair
  const isPairValid = pairSlot.length === 2 && pairSlot[0].name === pairSlot[1].name;

  // Check each kan slot
  const kanAudits = activeKanSlots.map(slot => {
    if (slot.length !== 3) {
      return {
        tiles: slot,
        type: 'triplet' as MeldType,
        typeLabel: '张数不足',
        isValid: false,
      };
    }
    const check = checkThreeTilesKan(slot.map(t => t.name));
    if (check && check.isValid) {
      return {
        tiles: slot,
        type: check.type,
        typeLabel: check.typeLabel,
        isValid: true,
      };
    }
    return {
      tiles: slot,
      type: 'triplet' as MeldType,
      typeLabel: '未成有效砍',
      isValid: false,
    };
  });

  const allKansValid = kanAudits.length === neededKans && kanAudits.every(k => k.isValid);

  if (isPairValid && allKansValid) {
    const combinedKans = [
      ...declaredMelds.map(m => ({ tiles: m.tiles, type: m.type, typeLabel: m.typeLabel })),
      ...kanAudits.map(k => ({ tiles: k.tiles, type: k.type, typeLabel: k.typeLabel })),
    ];

    const fanCalc = calculateFans(combinedKans, pairSlot, isTianHu, isGangShangKaiHua);

    return {
      isHu: true,
      isSevenPairs: false,
      totalTilesCount: 14,
      tileCountValid: true,
      pair: pairSlot,
      kans: combinedKans.map(k => ({ ...k, isValid: true })),
      fans: fanCalc.fans,
      fanDetails: fanCalc.details,
      explanation: fanCalc.explanation,
      auditMessage: `【自证审核通过】恭喜！手动摆出的 4砍+1将 完全符合五行规则！共 ${fanCalc.fans} 番！`,
      diagnostics: {
        status: 'pass',
        tileCountMsg: '手牌张数检测：14张完整无误',
        pairMsg: `雀头将牌：【${pairSlot[0].name}${pairSlot[1].name}】对子达标`,
        kansMsg: `4组砍牌全数合规 (${combinedKans.map(k => k.typeLabel).join('、')})`,
        advice: '自证完美，可立即提交胡牌！',
      },
    };
  }

  // Diagnostics for manual mode
  const invalidKanIndices = kanAudits
    .map((k, idx) => (!k.isValid ? `砍槽${idx + 1}` : null))
    .filter(Boolean);

  let pairMsg = '雀头将牌：未放置2张相同字对子';
  if (pairSlot.length === 2) {
    if (pairSlot[0].name === pairSlot[1].name) {
      pairMsg = `雀头将牌：【${pairSlot[0].name}${pairSlot[1].name}】对子达标 ✓`;
    } else {
      pairMsg = `雀头将牌：【${pairSlot[0].name}】与【${pairSlot[1].name}】不同字，无法作将 ✕`;
    }
  } else if (pairSlot.length > 0) {
    pairMsg = `雀头将牌：当前仅有 ${pairSlot.length} 张，需凑齐2张相同牌`;
  }

  const kansMsg = invalidKanIndices.length > 0
    ? `砍牌检验：${invalidKanIndices.join('、')} 不符合五行做砍规则`
    : (activeKanSlots.length < neededKans ? '砍牌检验：尚有砍槽未填满' : '砍牌检验：合规达标 ✓');

  return {
    isHu: false,
    isSevenPairs: false,
    totalTilesCount: kanSlots.flat().length + pairSlot.length + declaredMelds.length * 3,
    tileCountValid: false,
    fans: 0,
    fanDetails: [],
    explanation: '手动摆牌未满足全部合规条件',
    auditMessage: '【自证审核未通过】请检查未合规的砍槽或雀头将牌',
    diagnostics: {
      status: 'fail',
      tileCountMsg: '请将 14 张牌（含副露）完整分配至各个槽位',
      pairMsg,
      kansMsg,
      advice: '可点击「智能摆入」自动分解手牌，或参考规则调整牌槽组合',
    },
  };
}

// Find all tiles that would make the hand Hu (听牌分析)
export function getTingTiles(
  hand: MahjongTileData[],
  declaredMelds: Meld[] = []
): Array<{ tileName: string; fans: number; explanation: string }> {
  // Hand should have 13, 10, 7, 4, or 1 cards
  const targetCount = 14 - declaredMelds.length * 3;
  if (hand.length !== targetCount - 1) {
    return [];
  }

  const results: Array<{ tileName: string; fans: number; explanation: string }> = [];
  const checked = new Set<string>();

  for (const def of TILE_DEFINITIONS) {
    if (checked.has(def.name)) continue;
    checked.add(def.name);

    const testTile: MahjongTileData = {
      ...def,
      id: `ting_test_${def.name}`,
    };

    const testHand = [...hand, testTile];
    const huRes = checkHu(testHand, declaredMelds);
    if (huRes.isHu) {
      results.push({
        tileName: def.name,
        fans: huRes.fans,
        explanation: huRes.explanation,
      });
    }
  }

  return results;
}

// Sort hand by: Elements (木火土金水) -> Stems (甲-癸) -> Branches (子-亥)
export function sortHand(hand: MahjongTileData[]): MahjongTileData[] {
  const categoryOrder: Record<string, number> = {
    element: 1,
    stem: 2,
    branch: 3,
  };

  const nameOrder: Record<string, number> = {
    '木': 1, '火': 2, '土': 3, '金': 4, '水': 5,
    '甲': 11, '乙': 12, '丙': 13, '丁': 14, '戊': 15, '己': 16, '庚': 17, '辛': 18, '壬': 19, '癸': 20,
    '寅': 31, '卯': 32, '辰': 33, '巳': 34, '午': 35, '未': 36, '申': 37, '酉': 38, '戌': 39, '亥': 40, '子': 41, '丑': 42,
  };

  return [...hand].sort((a, b) => {
    const catA = categoryOrder[a.category] || 99;
    const catB = categoryOrder[b.category] || 99;
    if (catA !== catB) return catA - catB;

    const ordA = nameOrder[a.name] || 99;
    const ordB = nameOrder[b.name] || 99;
    return ordA - ordB;
  });
}
