/**
 * analysisMessages.ts
 * Templates and text generators for the 6-part Lumimei Skin Analysis Report
 */

import { AcneQuestionnaireAnswers, AnalysisTags } from './recurrentAcneRules';
import { Language } from '../types';

export interface ObservationSummary {
  acneTypeLabel: string;
  locationLabel: string;
  skinTypeLabel: string;
  durationLabel: string;
  sentence: string;
}

export interface FocusPoint {
  tagKey: string;
  title: string;
  reason: string;
}

/**
 * 1. អ្វីដែល Lumimei សង្កេតឃើញ (What Lumimei Observed)
 * Summarizes: Acne Type + Location + Skin Type + Duration
 */
export function getObservationSummary(
  answers: AcneQuestionnaireAnswers,
  lang: Language
): ObservationSummary {
  const acneTypeMap: Record<string, { km: string; en: string; zh: string }> = {
    closed_comedones: {
      km: 'មុនកប់ / មុនក្បាលស',
      en: 'Closed comedones / Whiteheads',
      zh: '闭口粉刺 / 白头',
    },
    whiteheads: {
      km: 'មុនក្បាលស',
      en: 'Whiteheads',
      zh: '白头粉刺',
    },
    mostly_post_acne_marks: {
      km: 'ស្នាមមុនក្រហម និងស្នាមជាំខ្មៅ',
      en: 'Post-acne red and dark marks',
      zh: '痘印及色素沉淀',
    },
    inflammatory_papules: {
      km: 'មុនរលាកក្រហម',
      en: 'Inflammatory red bumps',
      zh: '炎症性泛红痘',
    },
    deep_painful_acne: {
      km: 'មុនធំៗឈឺចាប់ក្នុងសាច់',
      en: 'Deep painful / cystic acne',
      zh: '深层疼痛硬结痘',
    },
    mixed_acne: {
      km: 'មុនចម្រុះប្រភេទ',
      en: 'Mixed acne types',
      zh: '混合型痘痘',
    },
  };

  const locationMap: Record<string, { km: string; en: string; zh: string }> = {
    tzone: {
      km: 'តំបន់ T-zone (ថ្ងាស ច្រមុះ)',
      en: 'T-zone (forehead & nose)',
      zh: 'T区（额头及鼻子）',
    },
    cheeks: {
      km: 'ថ្ពាល់សងខាង',
      en: 'Cheeks',
      zh: '两侧脸颊',
    },
    chin_jawline: {
      km: 'ចង្កា និងថ្គាម',
      en: 'Chin and jawline',
      zh: '下巴与下颌缘',
    },
    all_over_face: {
      km: 'ពេញផ្ទៃមុខ',
      en: 'All over face',
      zh: '全脸分布',
    },
    random_spots: {
      km: 'រាយប៉ាយតាមកន្លែង',
      en: 'Scattered spots',
      zh: '零星散布',
    },
  };

  const skinTypeMap: Record<string, { km: string; en: string; zh: string }> = {
    very_oily: {
      km: 'ស្បែកខ្លាញ់ខ្លាំង',
      en: 'Very oily skin',
      zh: '重度油性肤质',
    },
    combination_oily: {
      km: 'ស្បែកចម្រុះលំអៀងខ្លាញ់',
      en: 'Combination-oily skin',
      zh: '混合偏油肤质',
    },
    sensitive: {
      km: 'ស្បែកស្តើង / ងាយរោល',
      en: 'Sensitive skin',
      zh: '敏感易刺激肤质',
    },
    dry: {
      km: 'ស្បែកស្ងួត ឬតឹងស្បែក',
      en: 'Dry / tight skin',
      zh: '偏干紧绷肤质',
    },
    normal: {
      km: 'ស្បែកធម្មតា',
      en: 'Normal skin',
      zh: '中性平衡肤质',
    },
  };

  const durationMap: Record<string, { km: string; en: string; zh: string }> = {
    under_1_month: {
      km: 'ទើបតែកើតតិចជាង ១ ខែ',
      en: 'Recently developed (<1 month)',
      zh: '近期出现（1个月内）',
    },
    '1_to_6_months': {
      km: 'មានរយៈពេល ១ ដល់ ៦ ខែ',
      en: 'Lasting 1 to 6 months',
      zh: '持续1至6个月',
    },
    over_6_months: {
      km: 'មានរយៈពេលលើសពី ៦ ខែ',
      en: 'Lasting over 6 months',
      zh: '持续6个月以上',
    },
    recurring: {
      km: 'កើតឡើងវិញជាញឹកញាប់ (រ៉ាំរ៉ៃ)',
      en: 'Recurring and chronic',
      zh: '经常反复发作',
    },
  };

  const aLabel = acneTypeMap[answers.acneType] || acneTypeMap.mixed_acne;
  const lLabel = locationMap[answers.location] || locationMap.random_spots;
  const sLabel = skinTypeMap[answers.skinType] || skinTypeMap.combination_oily;
  const dLabel = durationMap[answers.duration] || durationMap.recurring;

  const currentLangKey = lang === 'km' ? 'km' : lang === 'zh' ? 'zh' : 'en';

  let sentence = '';
  if (lang === 'km') {
    sentence = `ស្បែកមុខបងប្អូនបច្ចុប្បន្នស្ថិតក្នុងប្រភេទ «${sLabel.km}» ដែលមានបញ្ហា «${aLabel.km}» ច្រើននៅត្រង់ «${lLabel.km}» ដោយស្ថានភាពនេះ «${dLabel.km}»។`;
  } else if (lang === 'zh') {
    sentence = `您目前的肌肤属于「${sLabel.zh}」，主要在「${lLabel.zh}」表现为「${aLabel.zh}」，且此状态「${dLabel.zh}」。`;
  } else {
    sentence = `Your skin is currently classified as "${sLabel.en}", showing "${aLabel.en}" predominantly around "${lLabel.en}", with a pattern of being "${dLabel.en}".`;
  }

  return {
    acneTypeLabel: aLabel[currentLangKey],
    locationLabel: lLabel[currentLangKey],
    skinTypeLabel: sLabel[currentLangKey],
    durationLabel: dLabel[currentLangKey],
    sentence,
  };
}

/**
 * 2. ចំណុចដែលគួរយកចិត្តទុកដាក់ (2-4 Top Focus Tags & Explanations)
 */
export function getFocusPoints(
  tags: AnalysisTags,
  lang: Language
): FocusPoint[] {
  const points: FocusPoint[] = [];

  if (tags.new_product_related === 'high') {
    points.push({
      tagKey: 'new_product_related',
      title:
        lang === 'km'
          ? 'ផលិតផលថ្មីអាចកំពុងជំរុញឱ្យស្បែករោល'
          : lang === 'zh'
          ? '新添护肤品可能引发了局部不适'
          : 'Recent new product trigger',
      reason:
        lang === 'km'
          ? 'ដោយសារបងប្អូនទើបតែបន្ថែមផលិតផលថ្មី ហើយសង្កេតឃើញមុនកើនឡើង ស្បែកអាចមិនទាន់សម្របខ្លួន ឬមានសារធាតុដែលធ្វើឱ្យស្ទះ។'
          : lang === 'zh'
          ? '因近期更换或新加护肤品后粉刺加重，提示当前配方或质地可能暂未适应或堵塞毛孔。'
          : 'Breakouts flared shortly after introducing new products, suggesting an ingredient intolerance or pore-clogging trigger.',
    });
  }

  if (tags.active_overload === 'high') {
    points.push({
      tagKey: 'active_overload',
      title:
        lang === 'km'
          ? 'ការប្រើប្រាស់សារធាតុសកម្មច្រើនលើសលប់'
          : lang === 'zh'
          ? '强功效活性成分叠加过多'
          : 'Multiple strong actives overload',
      reason:
        lang === 'km'
          ? 'ការប្រើ Acid, Retinol, ម៉ាសភក់ ឬស្ក្រាប់ព្រមគ្នា អាចធ្វើឱ្យរបាំងស្បែកចុះខ្សោយ និងងាយរលាកជាងមុន។'
          : lang === 'zh'
          ? '同时使用酸类、视黄醇、泥膜或磨砂等高功效产品，容易造成角质层水脂屏障削弱。'
          : 'Concurrent use of acids, retinoids, scrubs or clay masks can impair your moisture barrier and trigger reactive bumps.',
    });
  } else if (tags.active_overload === 'medium') {
    points.push({
      tagKey: 'active_overload_medium',
      title:
        lang === 'km'
          ? 'សារធាតុសកម្មចាប់ផ្តើមកកកុញច្រើន'
          : lang === 'zh'
          ? '已有两项功效型步骤需留意频次'
          : 'Moderate active treatments',
      reason:
        lang === 'km'
          ? 'បងប្អូនមានជំហានសារធាតុសកម្មចំនួន ២ ដែលត្រូវការតាមដានកុំឱ្យញឹកញាប់ពេក។'
          : lang === 'zh'
          ? '目前护肤中有两项去角质或功效产品，建议把控使用频次，避免过度刺激。'
          : 'You are using 2 active treatments; monitor usage frequency to avoid cumulative irritation.',
    });
  }

  if (tags.avoid_exfoliation) {
    points.push({
      tagKey: 'avoid_exfoliation',
      title:
        lang === 'km'
          ? 'ផ្អាកការជម្រុះ ឬខាត់ស្បែកជាបណ្ដោះអាសន្ន'
          : lang === 'zh'
          ? '现阶段需暂停一切去角质与深层吸附'
          : 'Pause exfoliation temporarily',
      reason:
        lang === 'km'
          ? 'ស្បែកកំពុងត្រូវការពេលសម្រាកដើម្បីស្ដារឡើងវិញ កុំទាន់អាលប្រើស្ក្រាប់ ឬម៉ាសភក់ខ្លាំង។'
          : lang === 'zh'
          ? '肌肤当前屏障相对脆弱，应暂停磨砂膏及高吸附泥膜，给予角质充裕修护时间。'
          : 'Your skin barrier requires rest; strictly avoid physical scrubs or drying clay masks for now.',
    });
  }

  if (tags.sensitive_skin) {
    points.push({
      tagKey: 'sensitive_skin',
      title:
        lang === 'km'
          ? 'ស្បែកស្តើង ងាយរមាស់ និងរោលក្រហម'
          : lang === 'zh'
          ? '肤质偏薄脆弱，易泛红受刺激'
          : 'Skin barrier sensitivity',
      reason:
        lang === 'km'
          ? 'ត្រូវផ្ដោតលើការលួងលោមស្បែក ផ្តល់សំណើមស្រទន់ និងចៀសវាងការប៉ះពាល់កកិតខ្លាំង។'
          : lang === 'zh'
          ? '应优先做好补水保湿与舒缓屏障，减少物理摩擦及复杂香精配方。'
          : 'Focus on gentle barrier hydration and avoid harsh mechanical friction.',
    });
  }

  if (tags.needs_makeup_removal === 'high') {
    points.push({
      tagKey: 'needs_makeup_removal',
      title:
        lang === 'km'
          ? 'ការលាងសម្អាតគ្រឿងសម្អាង និងធូលី'
          : lang === 'zh'
          ? '需强化温和卸妆清洁彻底度'
          : 'First-cleanse & makeup hygiene',
      reason:
        lang === 'km'
          ? 'ការផាត់មុខប្រចាំថ្ងៃអាចបន្សល់កាកសំណល់ក្នុងរន្ធញើស ប្រសិនបើមិនបានលាងសម្អាតជំហានដំបូងឱ្យស្អាត។'
          : lang === 'zh'
          ? '经常带妆若第一步未彻底乳化清洁，彩妆粉体与防晒剂易在毛孔积蓄引发反复闭口。'
          : 'Daily makeup or sunscreen requires dedicated gentle dissolution to prevent deep pore congestion.',
    });
  }

  if (tags.sleep_pattern === 'high') {
    points.push({
      tagKey: 'sleep_pattern',
      title:
        lang === 'km'
          ? 'ទម្លាប់ចូលគេងយឺតជះឥទ្ធិពលលើស្បែក'
          : lang === 'zh'
          ? '晚睡熬夜是显著的局部促发诱因'
          : 'Late sleep & circadian rhythm',
      reason:
        lang === 'km'
          ? 'ការគេងមិនគ្រប់គ្រាន់ធ្វើឱ្យស្បែកផលិតខ្លាញ់ច្រើនខុសប្រក្រតី និងកាត់បន្ថយសមត្ថភាពជួសជុលខ្លួនឯង។'
          : lang === 'zh'
          ? '夜间睡眠不足会促使皮脂腺分泌旺盛，同时减缓夜间表皮自然修护进程。'
          : 'Lack of restorative sleep elevates sebum production and impairs cellular repair.',
    });
  }

  if (tags.stress_pattern === 'high') {
    points.push({
      tagKey: 'stress_pattern',
      title:
        lang === 'km'
          ? 'សម្ពាធអារម្មណ៍ និងភាពតានតឹង'
          : lang === 'zh'
          ? '精神压力促发皮脂波动'
          : 'Stress-induced flare pattern',
      reason:
        lang === 'km'
          ? 'ភាពតានតឹងជំរុញអ័រម៉ូន Cortisol ដែលបង្កើនការរលាក និងការកកើតមុន។'
          : lang === 'zh'
          ? '压力升高促使身体皮质醇分泌，可能加剧面部微炎症与油脂分泌。'
          : 'Elevated stress triggers cortisol response, driving localized micro-inflammation.',
    });
  }

  if (tags.cycle_pattern) {
    points.push({
      tagKey: 'cycle_pattern',
      title:
        lang === 'km'
          ? 'ទំនាក់ទំនងនឹងវដ្តរដូវ'
          : lang === 'zh'
          ? '与生理周期密切相关'
          : 'Hormonal menstrual cycle link',
      reason:
        lang === 'km'
          ? 'មុនឡើងច្រើនមុនមករដូវជារឿងទូទៅ គួរផ្ដោតលើការរក្សាអនាម័យ និងបន្ថយកម្តៅស្បែកនៅសប្តាហ៍នោះ។'
          : lang === 'zh'
          ? '经期前黄体素波动易引发皮脂分泌增多，期间应保持清爽镇定，切忌用手抠挤。'
          : 'Pre-period progesterone shifts commonly stimulate oil; focus on gentle calming rather than harsh scrubbing.',
    });
  }

  if (tags.needs_oil_control === 'high') {
    points.push({
      tagKey: 'needs_oil_control',
      title:
        lang === 'km'
          ? 'តុល្យភាពជាតិខ្លាញ់លើផ្ទៃមុខ'
          : lang === 'zh'
          ? '表层水油平衡调理'
          : 'Sebum balance control',
      reason:
        lang === 'km'
          ? 'ជាតិខ្លាញ់លើសផ្សំជាមួយកោសិកាចាស់ៗបង្កជាការស្ទះរន្ធញើស។'
          : lang === 'zh'
          ? '过量油脂与老化角质混合极易形成毛孔栓塞，需温和平衡控油。'
          : 'Excess surface sebum combines with dead cells to form pore clogs.',
    });
  }

  // Return top 2–4 points
  return points.slice(0, 4);
}

/**
 * 3. អ្វីគួរបន្ត (What to Keep / What to Continue)
 */
export function getWhatToKeep(
  answers: AcneQuestionnaireAnswers,
  tags: AnalysisTags,
  lang: Language
): string[] {
  const list: string[] = [];

  if (lang === 'km') {
    list.push('លាងសម្អាតមុខថ្នមៗជាមួយទឹកស្អាត និងផលិតផលទន់ភ្លន់ជាប្រចាំ');
    list.push('ផ្ដល់សំណើមគ្រប់គ្រាន់ជួយឱ្យស្បែកមានតុល្យភាពទឹក និងខ្លាញ់');
    list.push('លាបឡេការពារកំដៅថ្ងៃរាល់ពេលចេញក្រៅ ដើម្បីការពារស្នាមជាំ');
    if (tags.sleep_pattern || tags.stress_pattern) {
      list.push('រក្សាការគេងឱ្យបានគ្រប់គ្រាន់ ៧-៨ ម៉ោង និងផឹកទឹកឱ្យបានច្រើន');
    } else {
      list.push('តាមដានការវិវឌ្ឍនៃស្បែកជាប្រចាំ ដោយមិនប្តូរផលិតផលញឹកញាប់ពេក');
    }
  } else if (lang === 'zh') {
    list.push('坚持每日早晚用温水温和洗护，避免用力拉扯皮肤');
    list.push('做好清爽无负担的补水保湿，维护表皮健康水油平衡');
    list.push('外出坚持涂抹防晒或做好物理遮阳，防止痘印加深');
    if (tags.sleep_pattern || tags.stress_pattern) {
      list.push('尽量保证规律作息，避免连续熬夜，多喝温水辅助代谢');
    } else {
      list.push('保持耐心理性观察，避免频繁更换不同护肤产品');
    }
  } else {
    list.push('Maintain gentle daily facial hygiene with lukewarm water');
    list.push('Prioritize lightweight barrier hydration to balance oiliness');
    list.push('Apply broad-spectrum sunscreen daily to protect against hyperpigmentation');
    list.push('Maintain regular hydration and track skin stability patiently');
  }

  return list;
}

/**
 * 4. អ្វីគួរកាត់បន្ថយ (What to Reduce / What to Avoid)
 */
export function getWhatToReduce(
  answers: AcneQuestionnaireAnswers,
  tags: AnalysisTags,
  lang: Language
): string[] {
  const list: string[] = [];

  if (lang === 'km') {
    if (tags.active_overload) {
      list.push('កាត់បន្ថយការប្រើ Acid, Retinol ឬស្ក្រាប់ខាត់មុខញឹកញាប់ពេក');
    }
    if (tags.avoid_exfoliation) {
      list.push('ផ្អាកម៉ាសភក់ ឬស្ក្រាប់គ្រើមៗរហូតដល់ស្បែករឹងមាំឡើងវិញ');
    }
    if (tags.new_product_related) {
      list.push('ផ្អាកផលិតផលថ្មីៗដែលទើបតែបន្ថែម ដើម្បីសង្កេតប្រតិកម្មស្បែក');
    }
    list.push('ចៀសវាងការយកដៃប៉ះ ញេច ឬឆ្កឹះមុន ដែលបង្កឱ្យមានស្នាម និងរលាក');
    if (tags.needs_makeup_removal) {
      list.push('កាត់បន្ថយការផាត់ម្សៅក្រាស់ៗ ឬទុកគ្រឿងសម្អាងលើមុខយូរម៉ោងពេក');
    }
  } else if (lang === 'zh') {
    if (tags.active_overload) {
      list.push('减少或降频使用酸类（AHA/BHA）、视黄醇或高浓度美白产品');
    }
    if (tags.avoid_exfoliation) {
      list.push('暂缓磨砂膏及强力吸附泥膜，防止加剧角质层变薄受损');
    }
    if (tags.new_product_related) {
      list.push('暂停最近新添的护肤新品，给皮肤 1–2 周空窗观察期');
    }
    list.push('切忌用手抠抓、挤压未成熟粉刺与红肿痘痘，避免遗留深色凹凸印痕');
    if (tags.needs_makeup_removal) {
      list.push('尽量减少厚重粉底长时间带妆，卸妆时避免粗暴化妆棉反复拉扯');
    }
  } else {
    if (tags.active_overload) {
      list.push('Reduce frequency of exfoliating acids (AHA/BHA) and retinoids');
    }
    if (tags.avoid_exfoliation) {
      list.push('Pause harsh physical face scrubs and drying clay masks');
    }
    if (tags.new_product_related) {
      list.push('Temporarily pause recently introduced new products to observe reactions');
    }
    list.push('Never pick, squeeze or scratch acne lesions to prevent post-inflammatory scarring');
  }

  return list;
}

/**
 * 6. Safety Notice
 * If deep_painful_acne + over_6_months / recurring -> professional_review_needed = high
 */
export function getSafetyNotice(
  answers: AcneQuestionnaireAnswers,
  tags: AnalysisTags,
  lang: Language
): { isHighPriority: boolean; title: string; message: string } {
  const isHighPriority = tags.professional_review_needed === 'high';

  if (lang === 'km') {
    return {
      isHighPriority,
      title: isHighPriority
        ? '⚠️ ការកត់សម្គាល់សំខាន់អំពីសុវត្ថិភាពស្បែក'
        : '🌿 ការណែនាំអំពីការថែទាំស្បែកប្រកបដោយសុវត្ថិភាព',
      message: isHighPriority
        ? 'ការរៀបចំទម្លាប់ថែទាំប្រចាំថ្ងៃ (Skincare Routine) អាចជួយសម្រួល និងផ្តល់ផាសុកភាពដល់ស្បែក ប៉ុន្តែសម្រាប់មុនធំៗឈឺចាប់ក្នុងសាច់ ឬស្ថានភាពដែលអូសបន្លាយយូរលើសពី ៦ ខែ / រ៉ាំរ៉ៃ យើងខ្ញុំសូមណែនាំឱ្យបងប្អូនឆ្លៀតពិគ្រោះយោបល់បន្ថែមជាមួយគ្រូពេទ្យជំនាញសើស្បែក ដើម្បីទទួលបានការវាយតម្លៃផ្នែកវេជ្ជសាស្រ្តត្រឹមត្រូវ។'
        : 'ការថែរក្សាស្បែកប្រចាំថ្ងៃជាដំណើរការយឺតៗទន់ភ្លន់។ ប្រសិនបើសង្កេតឃើញមានសញ្ញារោលខ្លាំង សូមផ្អាក និងផ្ដោតលើការលួងលោមស្បែកជាចម្បង។',
    };
  } else if (lang === 'zh') {
    return {
      isHighPriority,
      title: isHighPriority
        ? '⚠️ 重点肌肤安全与专业就医提示'
        : '🌿 温和日常护理建议',
      message: isHighPriority
        ? '日常精简护理能够协助梳理护肤步骤、缓解表层不适，但针对深层持续疼痛、持续加重或已反复超过 6 个月的囊肿结节情况，建议您同步咨询专业皮肤科医师进行面对面临床排查。'
        : '日常护肤为循序渐进的温和调理。如有任何突发不适，请暂停所有新步骤并专注舒缓。',
    };
  } else {
    return {
      isHighPriority,
      title: isHighPriority
        ? '⚠️ Important Skin Safety Notice'
        : '🌿 Daily Skincare Safety Note',
      message: isHighPriority
        ? 'Daily topical care helps optimize your routine, but deep, persistent, painful acne lasting over 6 months should also be evaluated by a dermatologist for comprehensive medical guidance.'
        : 'Maintain gentle consistency. If you experience discomfort, pause all active steps and focus on soothing hydration.',
    };
  }
}
