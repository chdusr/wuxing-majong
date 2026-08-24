export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export type Gender = 'male' | 'female'; // 乾造 (male) / 坤造 (female)

export interface PillarData {
  name: string; // '年柱' | '月柱' | '日柱' | '时柱' | '流年' | '小运'
  yearOrAge?: string; // e.g. '2026', '1岁', '1-5岁'
  stem: string; // 天干
  stemElement: FiveElement;
  stemGod: string; // 主星 / 十神 (e.g. 七杀, 比肩, 正官)
  stemMicroGods?: string[]; // Mini badges in detailed view (e.g. ['杀', '官', '印'])
  branch: string; // 地支
  branchElement: FiveElement;
  hiddenStems: {
    stem: string;
    element: FiveElement;
    elementName: string; // '火', '金', etc.
    god: string; // '正官', '比肩'
  }[];
  secondaryGods: string[]; // 副星 (e.g. ['正官', '正印'])
  changSheng: string; // 长生十二宫 (e.g. '沐浴', '临官', '死', '病')
  kongWang: string; // 空亡 (e.g. '寅卯', '午未')
  isHighlighted?: boolean;
}

export interface SolarTermInfo {
  prevTerm: { name: string; time: string };
  nextTerm: { name: string; time: string };
}

export interface TimeJuChartData {
  gender: Gender;
  genderLabel: string; // '乾造' | '坤造'
  chartTypeLabel: string; // '即时局' | '指定局'
  profileName?: string; // Optional user-defined name
  cityName?: string; // Optional birthplace city
  isTrueSolarTime?: boolean;
  strokeCount: number; // e.g. 21划
  xunShou: string; // e.g. '(甲申)'
  zodiac: string; // e.g. '属马'
  lunarText: string; // '农历: 农历丙午年七月十二 亥时'
  gregorianDateStr: string; // '2026-08-24 21:44:00'
  
  // Overview 4 pillars
  overviewPillars: {
    year: PillarData;
    month: PillarData;
    day: PillarData;
    hour: PillarData;
  };

  // Detailed 6 columns: [流年, 小运, 年柱, 月柱, 日柱, 时柱]
  detailedColumns: {
    header: string; // '流年', '小运', '年柱', '月柱', '日柱', '时柱'
    age?: string; // '1岁', '1-5岁'
    yearOrVal: string; // '2026', '8', '24', '21:44'
    pillar: PillarData;
  }[];

  // 12 Monthly luck
  liuYue: {
    monthIndex: number;
    stem: string;
    stemElement: FiveElement;
    branch: string;
    branchElement: FiveElement;
    name: string; // '寅月', '卯月', etc.
  }[];

  // DaYun 10-year luck periods
  daYunList: {
    index: number;
    ageRange: string; // '1-5岁' or '6岁'
    startYear: number; // 2031
    stem: string;
    branch: string;
    stemElement: FiveElement;
    branchElement: FiveElement;
    god: string;
    isXiaoYun?: boolean;
  }[];

  // Selected or current LiuNian list (5-10 years)
  liuNianList: {
    year: number;
    stem: string;
    branch: string;
    stemElement: FiveElement;
    branchElement: FiveElement;
    god: string;
  }[];

  // Solar terms
  solarTerms: SolarTermInfo;

  // Hints: branch & stem combinations, clashes, punishments, harms, dark combinations
  stemHints: string; // '无合局的关系'
  branchHints: string; // '午亥可暗合,申亥可相害,午午可自刑'
  allInteractions: {
    type: '合' | '冲' | '刑' | '害' | '破' | '暗合' | '自刑';
    description: string;
    detail: string;
  }[];

  // Five Elements percentages
  fiveElementsStats: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  dominantElement: string;
  favoredElement: string;
}
