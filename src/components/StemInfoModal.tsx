import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { STEM_ELEMENTS, BRANCH_ELEMENTS, ELEMENT_NAMES, ELEMENT_COLORS } from '../utils/baziEngine';

interface StemInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  char: string;
  type: 'stem' | 'branch' | 'god';
}

const GOD_EXPLANATIONS: Record<string, { desc: string; keywords: string; advice: string }> = {
  '比肩': {
    desc: '与日主同五行同阴阳，代表同伴、朋友、自尊、自主自立。',
    keywords: '自信、合伙、同辈、坚毅',
    advice: '宜借力团队合作，防固执己见。',
  },
  '劫财': {
    desc: '与日主同五行异阴阳，代表竞争、敏锐魄力、勇于突破。',
    keywords: '魄力、开创、博弈、敏锐',
    advice: '注意财务合理分配，避免冲动冒险。',
  },
  '食神': {
    desc: '日主所生同阴阳之五行，代表才华温和流露、福气、审美与口福。',
    keywords: '才艺、福禄、温雅、策划',
    advice: '利于创作表达、享受当下，多发挥专长。',
  },
  '伤官': {
    desc: '日主所生异阴阳之五行，代表卓越才华、突破陈规、辩才无碍。',
    keywords: '创新、敏捷、锋芒、灵感',
    advice: '锋芒微敛，利于创意发明与颠覆式革新。',
  },
  '偏财': {
    desc: '日主所克同阴阳之五行，代表流动资金、商业机运、外财与交际。',
    keywords: '商机、灵活、人脉、财源',
    advice: '把握市场机缘，重视风险对冲。',
  },
  '正财': {
    desc: '日主所克异阴阳之五行，代表稳健收入、勤勉务实、踏实经营。',
    keywords: '务实、信用、积蓄、恒心',
    advice: '立足主业，脚踏实地步步为营。',
  },
  '七杀': {
    desc: '克日主同阴阳之五行，又称偏官，代表权威、决断力、执行力与魄力。',
    keywords: '威严、魄力、危机管理、突破',
    advice: '行事讲求章法策略，将压力转化为动力。',
  },
  '正官': {
    desc: '克日主异阴阳之五行，代表名誉、秩序、公信力、规范与正统。',
    keywords: '自律、责任、声望、正派',
    advice: '循规蹈矩，重视诚信与品牌建立。',
  },
  '偏印': {
    desc: '生日主同阴阳之五行，又名枭神，代表独特悟性、研究、策略与直觉。',
    keywords: '玄思、洞察、灵性、钻研',
    advice: '发挥敏锐直觉，深入核心原理深耕。',
  },
  '正印': {
    desc: '生日主异阴阳之五行，代表仁慈厚重、学问、庇佑与贵人关怀。',
    keywords: '包容、学识、声誉、贵人',
    advice: '厚积薄发，广结善缘，得长辈贵人之助。',
  },
};

const STEM_EXPLANATIONS: Record<string, { element: string; nature: string; organ: string; desc: string }> = {
  '甲': { element: '阳木', nature: '参天大木，栋梁之材，直爽仁慈', organ: '胆、头部、神经', desc: '甲木参天，脱胎要火，春不容金，秋不容土。' },
  '乙': { element: '阴木', nature: '花草灌木，柔韧坚毅，适应力强', organ: '肝脏、颈部、经络', desc: '乙木虽柔，刲羊解牛，怀丁抱丙，跨凤乘猴。' },
  '丙': { element: '阳火', nature: '太阳之火，光明磊落，热情豪迈', organ: '小肠、心脑、目力', desc: '丙火猛烈，欺霜傲雪，能炼庚金，逢辛反怯。' },
  '丁': { element: '阴火', nature: '烛光灯火，文明内蕴，细腻沉稳', organ: '心脏、血液、舌', desc: '丁火柔中，内性昭融，抱乙而孝，合壬而忠。' },
  '戊': { element: '阳土', nature: '城墙厚土，沉稳包容，敦厚守信', organ: '胃、脾腹、肌肉', desc: '戊土固重，既中且正，静翕动辟，万物司命。' },
  '己': { element: '阴土', nature: '田园湿土，含蓄蕴藏，滋养万物', organ: '脾脏、胰腺、腹', desc: '己土卑湿，中正蓄藏，不愁木盛，不畏水狂。' },
  '庚': { element: '阳金', nature: '斧钺之金，刚毅坚固，果敢杀伐', organ: '大肠、骨骼、经骨', desc: '庚金带杀，刚健为最，得火而锐，逢水而清。' },
  '辛': { element: '阴金', nature: '珠宝首饰，温润灵秀，清莹秀澈', organ: '肺脏、呼吸、咽喉', desc: '辛金软弱，温润而清，畏土之叠，乐水之盈。' },
  '壬': { element: '阳水', nature: '江河之水，奔流不息，气势宏大', organ: '膀胱、泌尿、血液', desc: '壬水通河，能泄金气，刚中之德，周流不滞。' },
  '癸': { element: '阴水', nature: '雨露之水，润物无声，智谋深藏', organ: '肾脏、生殖、耳', desc: '癸水至弱，达于天津，得龙而运，功化斯神。' },
};

const BRANCH_EXPLANATIONS: Record<string, { element: string; animal: string; month: string; desc: string }> = {
  '子': { element: '阳水', animal: '鼠', month: '仲冬十一月', desc: '子水主智慧、流通、深思熟虑。藏干【癸水】。' },
  '丑': { element: '阴土', animal: '牛', month: '季冬十二月', desc: '丑土为金库，湿土蓄水，坚忍持重。藏干【己、癸、辛】。' },
  '寅': { element: '阳木', animal: '虎', month: '孟春正月', desc: '寅木为三阳开泰，朝气蓬勃，生机盎然。藏干【甲、丙、戊】。' },
  '卯': { element: '阴木', animal: '兔', month: '仲春二月', desc: '卯木为花草繁茂，温润如玉，细腻敏捷。藏干【乙木】。' },
  '辰': { element: '阳土', animal: '龙', month: '季春三月', desc: '辰土为水库，温湿含润，应变能力极强。藏干【戊、乙、癸】。' },
  '巳': { element: '阴火', animal: '蛇', month: '孟夏四月', desc: '巳火金长生之地，热情敏捷，变化多端。藏干【丙、庚、戊】。' },
  '午': { element: '阳火', animal: '马', month: '仲夏五月', desc: '午火为太阳正中之烈焰，光明果断，尊贵尊荣。藏干【丁、己】。' },
  '未': { element: '阴土', animal: '羊', month: '季夏六月', desc: '未土为木库，燥土生金，宽厚温和。藏干【己、丁、乙】。' },
  '申': { element: '阳金', animal: '猴', month: '孟秋七月', desc: '申金为水之长生，坚固刚硬，机敏干练。藏干【庚、壬、戊】。' },
  '酉': { element: '阴金', animal: '鸡', month: '仲秋八月', desc: '酉金纯正之金，精密专注，艺术审美极高。藏干【辛金】。' },
  '戌': { element: '阳土', animal: '狗', month: '季秋九月', desc: '戌土为火库，忠勇守信，稳健坚实。藏干【戊、辛、丁】。' },
  '亥': { element: '阴水', animal: '猪', month: '孟冬十月', desc: '亥水为木之长生，涵养深沉，温厚包容。藏干【壬、甲】。' },
};

export const StemInfoModal: React.FC<StemInfoModalProps> = ({
  isOpen,
  onClose,
  char,
  type,
}) => {
  if (!isOpen || !char) return null;

  let title = '';
  let contentNode = null;

  if (type === 'god') {
    const info = GOD_EXPLANATIONS[char] || {
      desc: '八字十神之一，反映天干地支与日主的阴阳生克关系。',
      keywords: '气场、调候、十神',
      advice: '顺应时运，中和为美。',
    };
    title = `十神详解 · 【${char}】`;
    contentNode = (
      <div className="space-y-3 text-xs leading-relaxed text-gray-300">
        <div><span className="text-amber-400 font-semibold">【本义象意】：</span>{info.desc}</div>
        <div><span className="text-blue-400 font-semibold">【核心特征】：</span>{info.keywords}</div>
        <div><span className="text-emerald-400 font-semibold">【处事指南】：</span>{info.advice}</div>
      </div>
    );
  } else if (type === 'stem') {
    const info = STEM_EXPLANATIONS[char];
    title = `天干详解 · 【${char}】`;
    if (info) {
      contentNode = (
        <div className="space-y-2.5 text-xs leading-relaxed text-gray-300">
          <div><span className="text-amber-400 font-semibold">【五行阴阳】：</span>{info.element}</div>
          <div><span className="text-blue-400 font-semibold">【象义本性】：</span>{info.nature}</div>
          <div><span className="text-rose-400 font-semibold">【对应经络】：</span>{info.organ}</div>
          <div className="p-2.5 rounded-xl bg-white/5 font-serif italic text-gray-400 border border-white/5">
            "{info.desc}"
          </div>
        </div>
      );
    }
  } else if (type === 'branch') {
    const info = BRANCH_EXPLANATIONS[char];
    title = `地支详解 · 【${char}】`;
    if (info) {
      contentNode = (
        <div className="space-y-2.5 text-xs leading-relaxed text-gray-300">
          <div><span className="text-amber-400 font-semibold">【五行生肖】：</span>{info.element}（{info.animal}）</div>
          <div><span className="text-blue-400 font-semibold">【节气时令】：</span>{info.month}</div>
          <div><span className="text-emerald-400 font-semibold">【气场藏干】：</span>{info.desc}</div>
        </div>
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-sm bg-[#141417] border border-slate-800 rounded-3xl shadow-2xl p-5 text-white animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-100">{title}</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-[#1C1C1E] border border-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-3.5">
          {contentNode}
        </div>
      </div>
    </div>
  );
};
