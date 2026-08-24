import { Solar } from 'lunar-javascript';

export interface SolarMatch {
  date: Date;
  display: string;
  year: number;
}

// 阳干
const YANG_STEMS = new Set(['甲', '丙', '戊', '庚', '壬']);
// 阴干
const YIN_STEMS = new Set(['乙', '丁', '己', '辛', '癸']);
// 阳支
const YANG_BRANCHES = new Set(['子', '寅', '辰', '午', '申', '戌']);
// 阴支
const YIN_BRANCHES = new Set(['丑', '卯', '巳', '未', '酉', '亥']);

export function isStemBranchCompatible(stem: string, branch: string): boolean {
  if (YANG_STEMS.has(stem) && YANG_BRANCHES.has(branch)) return true;
  if (YIN_STEMS.has(stem) && YIN_BRANCHES.has(branch)) return true;
  return false;
}

export function getCompatibleBranch(stem: string, currentBranch: string): string {
  if (isStemBranchCompatible(stem, currentBranch)) return currentBranch;
  // If incompatible, shift by 1 to get compatible branch
  const allBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const idx = allBranches.indexOf(currentBranch);
  const newIdx = (idx + 1) % 12;
  return allBranches[newIdx];
}

export function getCompatibleStem(branch: string, currentStem: string): string {
  if (isStemBranchCompatible(currentStem, branch)) return currentStem;
  const allStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const idx = allStems.indexOf(currentStem);
  const newIdx = (idx + 1) % 10;
  return allStems[newIdx];
}

const ZHI_HOUR_MAP: Record<string, number> = {
  '子': 0,
  '丑': 2,
  '寅': 4,
  '卯': 6,
  '辰': 8,
  '巳': 10,
  '午': 12,
  '未': 14,
  '申': 16,
  '酉': 18,
  '戌': 20,
  '亥': 22,
};

// Solar months for 12 JieQi:
// 寅(2~3月), 卯(3~4月), 辰(4~5月), 巳(5~6月), 午(6~7月), 未(7~8月),
// 申(8~9月), 酉(9~10月), 戌(10~11月), 亥(11~12月), 子(12~1月), 丑(1~2月)
const ZHI_MONTH_RANGES: Record<string, number[]> = {
  '寅': [2, 3],
  '卯': [3, 4],
  '辰': [4, 5],
  '巳': [5, 6],
  '午': [6, 7],
  '未': [7, 8],
  '申': [8, 9],
  '酉': [9, 10],
  '戌': [10, 11],
  '亥': [11, 12],
  '子': [12, 1],
  '丑': [1, 2],
};

export function findSolarDatesFromBaZi(
  yearGan: string,
  yearZhi: string,
  monthGan: string,
  monthZhi: string,
  dayGan: string,
  dayZhi: string,
  timeGan: string,
  timeZhi: string,
  startYear: number = 1900,
  endYear: number = 2100
): SolarMatch[] {
  const targetYearGz = yearGan + yearZhi;
  const targetMonthGz = monthGan + monthZhi;
  const targetDayGz = dayGan + dayZhi;
  const testHour = ZHI_HOUR_MAP[timeZhi] ?? 0;

  const results: SolarMatch[] = [];
  const seen = new Set<string>();

  // Full high-speed search across 1900 to 2100
  for (let y = startYear; y <= endYear; y++) {
    // Fast check if middle of year (Jun 1) matches year GanZhi
    try {
      const midSolar = Solar.fromYmd(y, 6, 1);
      if (midSolar.getLunar().getEightChar().getYear() !== targetYearGz) {
        continue;
      }
    } catch {
      continue;
    }

    const months = ZHI_MONTH_RANGES[monthZhi] || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const scanYears = monthZhi === '丑' ? [y + 1] : monthZhi === '子' ? [y, y + 1] : [y];

    for (const sy of scanYears) {
      if (sy < 1900 || sy > 2100) continue;
      for (const sm of months) {
        for (let sd = 1; sd <= 31; sd++) {
          try {
            const sol = Solar.fromYmdHms(sy, sm, sd, testHour, 0, 0);
            // Ignore overflow dates (e.g. Feb 30)
            if (sol.getMonth() !== sm || sol.getDay() !== sd) continue;

            const ec = sol.getLunar().getEightChar();
            // Check 4 pillars match
            if (
              ec.getYear() === targetYearGz &&
              ec.getMonth() === targetMonthGz &&
              ec.getDay() === targetDayGz &&
              ec.getTimeZhi() === timeZhi
            ) {
              const yStr = String(sol.getYear()).padStart(4, '0');
              const mStr = String(sol.getMonth()).padStart(2, '0');
              const dStr = String(sol.getDay()).padStart(2, '0');
              const hhStr = String(sol.getHour()).padStart(2, '0');
              const mmStr = String(sol.getMinute()).padStart(2, '0');
              const key = `${yStr}-${mStr}-${dStr} ${hhStr}:${mmStr}`;

              if (!seen.has(key)) {
                seen.add(key);
                results.push({
                  date: new Date(
                    sol.getYear(),
                    sol.getMonth() - 1,
                    sol.getDay(),
                    sol.getHour(),
                    sol.getMinute(),
                    0
                  ),
                  display: key,
                  year: sol.getYear(),
                });
              }
            }
          } catch {
            // Ignore invalid date exceptions
          }
        }
      }
    }
  }

  // If no match found under exact monthGan due to custom edge cases, also search by monthZhi
  if (results.length === 0) {
    for (let y = startYear; y <= endYear; y++) {
      try {
        const midSolar = Solar.fromYmd(y, 6, 1);
        if (midSolar.getLunar().getEightChar().getYear() !== targetYearGz) continue;
      } catch {
        continue;
      }

      const months = ZHI_MONTH_RANGES[monthZhi] || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const scanYears = monthZhi === '丑' ? [y + 1] : monthZhi === '子' ? [y, y + 1] : [y];

      for (const sy of scanYears) {
        if (sy < 1900 || sy > 2100) continue;
        for (const sm of months) {
          for (let sd = 1; sd <= 31; sd++) {
            try {
              const sol = Solar.fromYmdHms(sy, sm, sd, testHour, 0, 0);
              if (sol.getMonth() !== sm || sol.getDay() !== sd) continue;

              const ec = sol.getLunar().getEightChar();
              if (
                ec.getYear() === targetYearGz &&
                ec.getMonthZhi() === monthZhi &&
                ec.getDay() === targetDayGz &&
                ec.getTimeZhi() === timeZhi
              ) {
                const yStr = String(sol.getYear()).padStart(4, '0');
                const mStr = String(sol.getMonth()).padStart(2, '0');
                const dStr = String(sol.getDay()).padStart(2, '0');
                const hhStr = String(sol.getHour()).padStart(2, '0');
                const mmStr = String(sol.getMinute()).padStart(2, '0');
                const key = `${yStr}-${mStr}-${dStr} ${hhStr}:${mmStr}`;

                if (!seen.has(key)) {
                  seen.add(key);
                  results.push({
                    date: new Date(
                      sol.getYear(),
                      sol.getMonth() - 1,
                      sol.getDay(),
                      sol.getHour(),
                      sol.getMinute(),
                      0
                    ),
                    display: key,
                    year: sol.getYear(),
                  });
                }
              }
            } catch {}
          }
        }
      }
    }
  }

  // Sort results prioritizing nearest to year 2000 / modern range
  results.sort((a, b) => {
    const diffA = Math.abs(a.year - 2000);
    const diffB = Math.abs(b.year - 2000);
    return diffA - diffB;
  });

  return results;
}
