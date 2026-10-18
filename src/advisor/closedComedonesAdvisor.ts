/**
 * closedComedonesAdvisor.ts
 * 
 * 100% Rule-Based & Conditional Logic Skincare Analysis System for:
 * “មុនកប់” (Closed Comedones) — Lumimei
 * 
 * - NEVER calls Gemini API or external AI for skin evaluation.
 * - Same customer answers guarantee identical deterministic results every time.
 * - Evaluates structured customer questions.
 * - Dynamic questionnaire logic for Q9 ("មិន Makeup") and Q10 ("Sunscreen only").
 * - Extracts ALL findings without hiding any.
 * - Ranks priorities to guide order of action.
 * - Recognizes positive customer habits (Good Habit Rule).
 * - Enforces safety / professional review threshold (Professional Review Flag).
 * - Generates 7 structured consultation sections in Khmer using predefined templates.
 * - Saves initial analysis as Baseline and generates Follow-up / Re-analysis comparison.
 */

import { Language } from '../types';

// ============================================================================
// 1. QUESTIONNAIRE DATA STRUCTURES
// ============================================================================

export interface ClosedComedonesAnswers {
  // Q1: សភាពមុនកប់
  q1_appearance: 'skin_colored_non_inflamed' | 'whitehead_bumps' | 'inflamed_red_bumps' | 'unsure';

  // Q2: (Optional / Legacy) មុនធំ ក្រហម ហើម ឬឈឺ
  q2_inflammatory_count?: 'none' | '1_to_2' | '3_to_5' | 'more_than_5' | 'unsure';

  // Q3: រយៈពេលដែលកើតមាន
  q3_duration: 'less_than_1m' | '1_to_3m' | '3_to_6m' | '6_to_12m' | 'more_than_1y' | 'recurrent' | 'unsure';

  // Q4: តំបន់ដែលកើត (Multi-select)
  q4_areas: string[];

  // Q5: ចំនួនប្រហែល
  q5_amount: 'less_than_10' | '10_to_20' | '21_to_50' | 'more_than_50' | 'hard_to_estimate';

  // Q6: ការប្រែប្រួលក្នុង ១ ខែចុងក្រោយ
  q6_trend: 'improving' | 'stable' | 'slight_increase' | 'large_increase' | 'rapid_spike' | 'unsure';

  // Q7: ផលិតផលថ្មីក្នុង ១ ខែចុងក្រោយ
  q7_new_products: 'none' | '1_product' | '2_or_more' | 'unsure';

  // Q8: ផលិតផលប្រើប្រចាំថ្ងៃ (Multi-select)
  q8_daily_products: string[];

  // Q9: ភាពញឹកញាប់នៃការ Makeup
  q9_makeup_freq: 'daily' | '3_to_5_weekly' | '1_to_2_weekly' | 'occasional' | 'none';

  // Q10: របៀបសម្អាតមុនចូលគេង
  q10_cleansing_routine: 'double_cleanse_daily' | 'cleanser_only' | 'sometimes_forget' | 'sometimes_sleep_with_makeup' | 'unsure';

  // Q11: ចំនួនដងលាងមុខក្នុងមួយថ្ងៃ
  q11_wash_freq: 'once' | 'twice' | 'three_times' | 'more_than_three' | 'irregular';

  // Q12: អារម្មណ៍ស្បែកបន្ទាប់ពីលាងមុខ
  q12_post_wash_feeling: 'normal_comfortable' | 'slightly_tight' | 'very_tight_dry' | 'dry_flaking' | 'red_stinging' | 'gets_oily_fast';

  // Q13: ទម្លាប់ញិច ឬកេះមុនក្នុង ១ ខែចុងក្រោយ
  q13_picking_habit: 'never' | 'occasional' | 'frequent' | 'self_frequent' | 'salon_cleaning';

  // Q14: ពេលដែលមុនកើនឡើង (Multi-select)
  q14_aggravating_factors: string[];

  // Q15: (Optional / Legacy) ស្ថានភាពពិសេស ឬសញ្ញាប្រុងប្រយ័ត្ន (Multi-select)
  q15_warning_signs?: string[];

  // Q16: បងប្អូនប្តូរ ឬបោកស្រោមខ្នើយញឹកញាប់ប៉ុណ្ណា?
  q16_pillowcase: 'about_once_a_week' | 'about_once_a_month' | 'more_than_6_months' | 'irregular' | 'unsure';

  // Q18: បន្ទាប់ពីលាងមុខ បងប្អូនប្រើអ្វីដើម្បីជូតមុខ?
  q18_face_drying: 'clean_towel_face_only' | 'towel_reuse_multiple' | 'facial_tissue' | 'shared_towel' | 'air_dry' | 'other';
  q17_face_drying?: string;

  // Q19 - Conditional Question: បើប្រើកន្សែងមុខ បងប្អូនប្តូរ ឬបោកញឹកញាប់ប៉ុណ្ណា?
  q19_towel_wash_freq?: 'every_day' | 'every_2_3_days' | 'about_once_a_week' | 'more_than_1_week' | 'irregular' | '';
  q18_towel_wash_freq?: string;

  // New Exfoliation Question 1: ក្នុងមួយសប្ដាហ៍ បងប្អូនជម្រុះកោសិកាចាស់ៗលើផ្ទៃមុខប៉ុន្មានដង?
  q20_exfoliation_freq?: 'never' | 'once_a_week' | 'twice_a_week' | 'three_times_a_week' | 'more_than_three' | 'irregular' | 'unsure';

  // New Exfoliation Question 2: ពេលដែលបងប្អូនបានជម្រុះកោសិកាចាស់ៗហើយ ស្បែកមុខរបស់បងប្អូនមានអារម្មណ៍យ៉ាងដូចម្តេច?
  q21_exfoliation_feel?: string[];

  // New Exfoliation Question 3: បងប្អូនប្រើផលិតផល ឬវិធីអ្វីសម្រាប់ជម្រុះកោសិកាចាស់ៗ?
  q22_exfoliation_products?: string[];

  // Follow-up Q9a: អារម្មណ៍ក្រោយប្រើ Makeup Remover (បង្ហាញតែពេលអ្នកប្រើជ្រើស Makeup Remover ក្នុង Q8)
  q8_remover_feeling?: 'clean_no_sting' | 'clean_stings_eyes' | 'unclean_residue' | '';

  // Follow-up: អារម្មណ៍ក្រោយប្រើផលិតផលទាំងនោះរួច (បង្ហាញតែពេលអ្នកប្រើជ្រើស ផលិតផលព្យាបាលមុន ក្នុង Q8)
  q8_acne_treatment_feeling?:
    | 'effective_comfortable'
    | 'stings_dry_peeling'
    | 'ineffective'
    | 'acne_increased'
    | 'itchy_rash_burn'
    | 'ineffective_or_worse'
    | '';
}

export const EMPTY_CLOSED_COMEDONES_ANSWERS: ClosedComedonesAnswers = {
  q1_appearance: '' as any,
  q2_inflammatory_count: '' as any,
  q3_duration: '' as any,
  q4_areas: [],
  q5_amount: '' as any,
  q6_trend: '' as any,
  q7_new_products: '' as any,
  q8_daily_products: [],
  q9_makeup_freq: '' as any,
  q10_cleansing_routine: '' as any,
  q11_wash_freq: '' as any,
  q12_post_wash_feeling: '' as any,
  q13_picking_habit: '' as any,
  q14_aggravating_factors: [],
  q15_warning_signs: [],
  q16_pillowcase: '' as any,
  q18_face_drying: '' as any,
  q19_towel_wash_freq: '' as any,
  q20_exfoliation_freq: '' as any,
  q21_exfoliation_feel: [],
  q22_exfoliation_products: [],
  q8_remover_feeling: '',
  q8_acne_treatment_feeling: '',
};

export const DEFAULT_CLOSED_COMEDONES_ANSWERS: ClosedComedonesAnswers = {
  q1_appearance: 'skin_colored_non_inflamed',
  q2_inflammatory_count: 'none',
  q3_duration: '1_to_3m',
  q4_areas: ['cheeks', 'forehead'],
  q5_amount: '10_to_20',
  q6_trend: 'stable',
  q7_new_products: 'none',
  q8_daily_products: ['cleanser', 'sunscreen'],
  q9_makeup_freq: 'none',
  q10_cleansing_routine: 'cleanser_only',
  q11_wash_freq: 'twice',
  q12_post_wash_feeling: 'normal_comfortable',
  q13_picking_habit: 'never',
  q14_aggravating_factors: ['no_clear_reason'],
  q15_warning_signs: ['none_of_above'],
  q16_pillowcase: 'about_once_a_week',
  q18_face_drying: 'clean_towel_face_only',
  q19_towel_wash_freq: 'every_2_3_days',
  q20_exfoliation_freq: 'never',
  q21_exfoliation_feel: [],
  q22_exfoliation_products: [],
  q8_remover_feeling: '',
  q8_acne_treatment_feeling: '',
};

export interface ComedonesQuestionOption {
  value: string;
  labelKm: string;
  labelZh: string;
  labelEn: string;
}

export interface ComedonesQuestionDef {
  id: keyof ClosedComedonesAnswers;
  number: number;
  sectionKm?: string;
  sectionZh?: string;
  sectionEn?: string;
  titleKm: string;
  titleZh: string;
  titleEn: string;
  subtitleKm?: string;
  subtitleZh?: string;
  subtitleEn?: string;
  multiSelect?: boolean;
  options: ComedonesQuestionOption[];
}

export const COMEDONES_15_QUESTIONS: ComedonesQuestionDef[] = [
  {
    id: 'q1_appearance',
    number: 1,
    titleKm: '១. បច្ចុប្បន្ន មុនកប់ របស់បងប្អូន មានសភាពបែបណា?',
    titleZh: '1. 目前您的闭口主要呈现什么状态？',
    titleEn: '1. What do your closed comedones currently look like?',
    multiSelect: false,
    options: [
      {
        value: 'skin_colored_non_inflamed',
        labelKm: 'គ្រាប់តូចៗ ពណ៌ដូចស្បែក មិនក្រហម និងមិនឈឺ',
        labelZh: '肤色小颗粒，不发红也不疼痛',
        labelEn: 'Skin-colored small bumps, non-red and painless',
      },
      {
        value: 'whitehead_bumps',
        labelKm: 'គ្រាប់តូចៗ មានក្បាលស',
        labelZh: '微小闭口，带有微白米粒头',
        labelEn: 'Small bumps with whiteheads',
      },
      {
        value: 'inflamed_red_bumps',
        labelKm: 'គ្រាប់តូចៗខ្លះ ប្រែជាក្រហម ឬរលាក',
        labelZh: '部分小颗粒开始泛红发炎',
        labelEn: 'Some small bumps turning red or inflamed',
      },
      {
        value: 'unsure',
        labelKm: 'មិនប្រាកដ',
        labelZh: '不确定',
        labelEn: 'Unsure',
      },
    ],
  },
  {
    id: 'q3_duration',
    number: 2,
    titleKm: '២. មុនកប់នេះ កើតមានរយៈពេលប៉ុន្មានហើយ?',
    titleZh: '2. 这些闭口已经持续出现多长时间了？',
    titleEn: '2. How long have these closed comedones persisted?',
    multiSelect: false,
    options: [
      {
        value: 'less_than_1m',
        labelKm: 'តិចជាង ១ ខែ',
        labelZh: '少于 1 个月',
        labelEn: 'Less than 1 month',
      },
      {
        value: '1_to_3m',
        labelKm: '១–៣ ខែ',
        labelZh: '1–3 个月',
        labelEn: '1–3 months',
      },
      {
        value: '3_to_6m',
        labelKm: '៣–៦ ខែ',
        labelZh: '3–6 个月',
        labelEn: '3–6 months',
      },
      {
        value: '6_to_12m',
        labelKm: '៦–១២ ខែ',
        labelZh: '6–12 个月',
        labelEn: '6–12 months',
      },
      {
        value: 'more_than_1y',
        labelKm: 'លើសពី ១ ឆ្នាំ',
        labelZh: '超过 1 年',
        labelEn: 'Over 1 year',
      },
      {
        value: 'recurrent',
        labelKm: 'កើតហើយបាត់ ហើយកើតឡើងវិញញឹកញាប់',
        labelZh: '反复消长，时好时坏频繁发作',
        labelEn: 'Comes and goes, recurs frequently',
      },
      {
        value: 'unsure',
        labelKm: 'មិនប្រាកដ',
        labelZh: '不确定',
        labelEn: 'Unsure',
      },
    ],
  },
  {
    id: 'q4_areas',
    number: 3,
    titleKm: '៣. មុនកប់ ភាគច្រើនកើតនៅតំបន់ណាខ្លះ?',
    titleZh: '3. 闭口主要集中分布在面部哪些区域？',
    titleEn: '3. Which areas do closed comedones mostly appear on?',
    subtitleKm: 'អាចជ្រើសរើសបានច្រើនជាងមួយ',
    subtitleZh: '（可多选）',
    subtitleEn: '(Multiple choices allowed)',
    multiSelect: true,
    options: [
      {
        value: 'forehead',
        labelKm: 'ថ្ងាស',
        labelZh: '额头',
        labelEn: 'Forehead',
      },
      {
        value: 'nose',
        labelKm: 'ច្រមុះ',
        labelZh: '鼻子',
        labelEn: 'Nose',
      },
      {
        value: 'cheeks',
        labelKm: 'ថ្ពាល់',
        labelZh: '脸颊',
        labelEn: 'Cheeks',
      },
      {
        value: 'chin',
        labelKm: 'ចង្កា',
        labelZh: '下巴',
        labelEn: 'Chin',
      },
      {
        value: 'jawline',
        labelKm: 'តាមបន្ទាត់ថ្គាម',
        labelZh: '下颌缘 / 下巴两侧',
        labelEn: 'Jawline',
      },
      {
        value: 'almost_full_face',
        labelKm: 'ស្ទើរតែពេញផ្ទៃមុខ',
        labelZh: '几乎全脸分布',
        labelEn: 'Almost full face',
      },
    ],
  },
  {
    id: 'q5_amount',
    number: 4,
    titleKm: '៤. បច្ចុប្បន្ន មុនកប់មានប្រហែលប៉ុន្មាន?',
    titleZh: '4. 目前面部闭口大概有多少颗？',
    titleEn: '4. Approximately how many closed comedones are currently present?',
    multiSelect: false,
    options: [
      {
        value: 'less_than_10',
        labelKm: 'តិចជាង ១០ គ្រាប់',
        labelZh: '少于 10 颗',
        labelEn: 'Less than 10 bumps',
      },
      {
        value: '10_to_20',
        labelKm: '១០–២០ គ្រាប់',
        labelZh: '10–20 颗',
        labelEn: '10–20 bumps',
      },
      {
        value: '21_to_50',
        labelKm: '២១–៥០ គ្រាប់',
        labelZh: '21–50 颗',
        labelEn: '21–50 bumps',
      },
      {
        value: 'more_than_50',
        labelKm: 'លើសពី ៥០ គ្រាប់',
        labelZh: '超过 50 颗',
        labelEn: 'More than 50 bumps',
      },
      {
        value: 'hard_to_estimate',
        labelKm: 'ច្រើនពិបាកប៉ាន់ស្មាន',
        labelZh: '很多，难以估计',
        labelEn: 'Dense / Hard to estimate',
      },
    ],
  },
  {
    id: 'q6_trend',
    number: 5,
    titleKm: '៥. ក្នុងរយៈពេល ១ ខែចុងក្រោយ មុនកប់មានការប្រែប្រួលយ៉ាងដូចម្តេច?',
    titleZh: '5. 最近 1 个月内，面部闭知的变化趋势如何？',
    titleEn: '5. Over the last month, what has been the trend of your closed comedones?',
    multiSelect: false,
    options: [
      {
        value: 'improving',
        labelKm: 'ថយចុះ',
        labelZh: '正在减少好转',
        labelEn: 'Decreasing / Improving',
      },
      {
        value: 'stable',
        labelKm: 'ស្ទើរតែដដែល',
        labelZh: '基本持平无明显变化',
        labelEn: 'Stable / Almost same',
      },
      {
        value: 'slight_increase',
        labelKm: 'កើនឡើងបន្តិច',
        labelZh: '稍微有所增多',
        labelEn: 'Slightly increasing',
      },
      {
        value: 'large_increase',
        labelKm: 'កើនឡើងច្រើន',
        labelZh: '明显增多很多',
        labelEn: 'Significantly increasing',
      },
      {
        value: 'rapid_spike',
        labelKm: 'កើតឡើងភ្លាមៗច្រើនក្នុងរយៈពេលខ្លី',
        labelZh: '短期内突然爆发式激增',
        labelEn: 'Rapid sudden breakout in short period',
      },
      {
        value: 'unsure',
        labelKm: 'មិនប្រាកដ',
        labelZh: '不确定',
        labelEn: 'Unsure',
      },
    ],
  },
  {
    id: 'q7_new_products',
    number: 6,
    titleKm: '៦. ក្នុងរយៈពេល ១ ខែចុងក្រោយ បងប្អូនបានចាប់ផ្តើមប្រើ ឬប្តូរផលិតផលថែស្បែកថ្មីដែរឬទេ?',
    titleZh: '6. 最近 1 个月内，您是否开始使用或更换了新的护肤产品？',
    titleEn: '6. In the past month, have you introduced or switched to new skincare products?',
    multiSelect: false,
    options: [
      {
        value: 'none',
        labelKm: 'មិនមាន',
        labelZh: '没有，无新产品',
        labelEn: 'None, unchanged',
      },
      {
        value: '1_product',
        labelKm: 'មាន ១ មុខ',
        labelZh: '有 1 款新产品',
        labelEn: 'Yes, 1 new product',
      },
      {
        value: '2_or_more',
        labelKm: 'មាន ២ មុខ ឬច្រើនជាងនេះ',
        labelZh: '有 2 款或更多新产品',
        labelEn: 'Yes, 2 or more new products',
      },
      {
        value: 'unsure',
        labelKm: 'មិនប្រាកដ',
        labelZh: '不确定',
        labelEn: 'Unsure',
      },
    ],
  },
  {
    id: 'q8_daily_products',
    number: 7,
    titleKm: '៧. បច្ចុប្បន្ន បងប្អូនប្រើផលិតផលអ្វីខ្លះជាប្រចាំ?',
    titleZh: '7. 目前您日常正在持续使用的护肤品有哪些？',
    titleEn: '7. What skincare products are currently part of your routine?',
    subtitleKm: 'អាចជ្រើសរើសបានច្រើនជាងមួយ',
    subtitleZh: '（可多选）',
    subtitleEn: '(Multiple choices allowed)',
    multiSelect: true,
    options: [
      {
        value: 'makeup_remover',
        labelKm: 'Makeup Remover',
        labelZh: 'Makeup Remover 卸妆产品',
        labelEn: 'Makeup Remover',
      },
      {
        value: 'cleanser',
        labelKm: 'Cleanser (ហ្វូម/សាប៊ូលាងមុខ)',
        labelZh: 'Cleanser 洁面乳/洁面皂',
        labelEn: 'Cleanser',
      },
      {
        value: 'toner',
        labelKm: 'Toner (ទឹកជូតមុខ)',
        labelZh: 'Toner 爽肤水',
        labelEn: 'Toner',
      },
      {
        value: 'serum',
        labelKm: 'Serum (សេរ៉ូម)',
        labelZh: 'Serum 精华液',
        labelEn: 'Serum',
      },
      {
        value: 'moisturizer',
        labelKm: 'Moisturizer (ឡេ/គ្រីមផ្ដល់សំណើម)',
        labelZh: 'Moisturizer 保湿乳/霜',
        labelEn: 'Moisturizer',
      },
      {
        value: 'sunscreen',
        labelKm: 'Sunscreen (ឡេការពារកម្ដៅថ្ងៃ)',
        labelZh: 'Sunscreen 防晒霜',
        labelEn: 'Sunscreen',
      },
      {
        value: 'aha_bha',
        labelKm: 'AHA / BHA (អាស៊ីតជម្រុះកោសិកា)',
        labelZh: 'AHA / BHA 果酸水杨酸类',
        labelEn: 'AHA / BHA Chemical Exfoliant',
      },
      {
        value: 'retinol',
        labelKm: 'Retinol / Retinoid',
        labelZh: 'Retinol 视黄醇类',
        labelEn: 'Retinol / Retinoid',
      },
      {
        value: 'scrub',
        labelKm: 'ម៉ាសធម្មជាតិ',
        labelZh: '天然面膜 (ម៉ាសធម្មជាតិ)',
        labelEn: 'Natural Mask',
      },
      {
        value: 'acne_treatment',
        labelKm: 'ផលិតផលព្យាបាលមុន (Acne Treatment)',
        labelZh: '祛痘专项凝胶/药膏',
        labelEn: 'Acne Spot Treatment',
      },
      {
        value: 'unsure',
        labelKm: 'មិនប្រាកដ',
        labelZh: '不确定具体成分',
        labelEn: 'Unsure',
      },
    ],
  },
  {
    id: 'q9_makeup_freq',
    number: 9,
    titleKm: '៩. បងប្អូន Makeup ញឹកញាប់ប៉ុណ្ណា?',
    titleZh: '9. 您平时的化妆（底妆/彩妆）频率是怎样的？',
    titleEn: '9. How frequently do you wear makeup?',
    multiSelect: false,
    options: [
      {
        value: 'daily',
        labelKm: 'ស្ទើរតែរាល់ថ្ងៃ',
        labelZh: '几乎每天',
        labelEn: 'Almost every day',
      },
      {
        value: '3_to_5_weekly',
        labelKm: '៣–៥ ដងក្នុងមួយសប្ដាហ៍',
        labelZh: '每周 3–5 次',
        labelEn: '3–5 times per week',
      },
      {
        value: '1_to_2_weekly',
        labelKm: '១–២ ដងក្នុងមួយសប្ដាហ៍',
        labelZh: '每周 1–2 次',
        labelEn: '1–2 times per week',
      },
      {
        value: 'occasional',
        labelKm: 'ម្តងម្កាល',
        labelZh: '偶尔 / 极少',
        labelEn: 'Occasional',
      },
      {
        value: 'none',
        labelKm: 'មិន Makeup',
        labelZh: '完全不化妆',
        labelEn: 'No makeup',
      },
    ],
  },
  {
    id: 'q10_cleansing_routine',
    number: 10,
    titleKm: '១០. បន្ទាប់ពី Makeup ឬប្រើ Sunscreen បងប្អូនសម្អាតមុខមុនចូលគេងយ៉ាងដូចម្តេច?',
    titleZh: '10. 化妆或涂抹防晒后，睡前您是如何进行面部洁肤的？',
    titleEn: '10. After wearing makeup or sunscreen, how do you cleanse before bed?',
    multiSelect: false,
    options: [
      {
        value: 'double_cleanse_daily',
        labelKm: 'លុប Makeup រួចលាងមុខឲ្យស្អាតរាល់ថ្ងៃ',
        labelZh: '先卸妆后再彻底洁面，每天坚持',
        labelEn: 'Remove makeup then cleanse thoroughly every day',
      },
      {
        value: 'cleanser_only',
        labelKm: 'ប្រើតែហ្វូមលាងមុខ',
        labelZh: '只用普通洁面乳，不专门卸妆',
        labelEn: 'Use face cleanser only without dedicated remover',
      },
      {
        value: 'sometimes_forget',
        labelKm: 'ពេលខ្លះភ្លេចលុប Makeup',
        labelZh: '有时太累忘记卸妆',
        labelEn: 'Sometimes forget to remove makeup',
      },
      {
        value: 'sometimes_sleep_with_makeup',
        labelKm: 'ពេលខ្លះគេងទាំងមាន Makeup',
        labelZh: '偶尔会带妆入睡',
        labelEn: 'Sometimes sleep with makeup on',
      },
      {
        value: 'unsure',
        labelKm: 'មិនប្រាកដថាសម្អាតបានស្អាតឬអត់',
        labelZh: '不确定是否彻底洗净',
        labelEn: 'Unsure if thoroughly cleaned',
      },
    ],
  },
  {
    id: 'q11_wash_freq',
    number: 11,
    titleKm: '១១. បងប្អូនលាងសម្អាតមុខក្នុងមួយថ្ងៃប៉ុន្មានដង?',
    titleZh: '11. 您通常每天清洗面部多少次？',
    titleEn: '11. How many times a day do you wash your face?',
    multiSelect: false,
    options: [
      {
        value: 'once',
        labelKm: '១ ដង',
        labelZh: '1 次',
        labelEn: '1 time',
      },
      {
        value: 'twice',
        labelKm: '២ ដង',
        labelZh: '2 次',
        labelEn: '2 times',
      },
      {
        value: 'three_times',
        labelKm: '៣ ដង',
        labelZh: '3 次',
        labelEn: '3 times',
      },
      {
        value: 'more_than_three',
        labelKm: 'លើសពី ៣ ដង',
        labelZh: '超过 3 次',
        labelEn: 'More than 3 times',
      },
      {
        value: 'irregular',
        labelKm: 'មិនទៀងទាត់',
        labelZh: '不规律',
        labelEn: 'Irregular',
      },
    ],
  },
  {
    id: 'q12_post_wash_feeling',
    number: 12,
    titleKm: '១២. បន្ទាប់ពីលាងមុខរួច ស្បែករបស់បងប្អូនភាគច្រើនមានអារម្មណ៍យ៉ាងដូចម្តេច?',
    titleZh: '12. 洗完脸后，您的皮肤通常会有什么感受？',
    titleEn: '12. How does your skin feel right after washing?',
    multiSelect: false,
    options: [
      {
        value: 'normal_comfortable',
        labelKm: 'មានអារម្មណ៍ធម្មតា និងស្រួល',
        labelZh: '感觉水润自然舒适',
        labelEn: 'Normal and comfortable',
      },
      {
        value: 'slightly_tight',
        labelKm: 'តឹងបន្តិច',
        labelZh: '微有紧绷感',
        labelEn: 'Slightly tight',
      },
      {
        value: 'very_tight_dry',
        labelKm: 'តឹង និងស្ងួតខ្លាំង',
        labelZh: '严重紧绷干燥',
        labelEn: 'Very tight and dry',
      },
      {
        value: 'dry_flaking',
        labelKm: 'ស្ងួត ឬរបក',
        labelZh: '干燥甚至脱屑脱皮',
        labelEn: 'Dry or flaking',
      },
      {
        value: 'red_stinging',
        labelKm: 'ក្រហម ឬចាក់ៗ',
        labelZh: '泛红刺痛不适',
        labelEn: 'Red or stinging',
      },
      {
        value: 'gets_oily_fast',
        labelKm: 'ចាប់ផ្តើមខ្លាញ់លឿន',
        labelZh: '不久后很快反油',
        labelEn: 'Quickly becomes oily',
      },
    ],
  },
  {
    id: 'q13_picking_habit',
    number: 12,
    titleKm: '១៣. ក្នុងរយៈពេល ១ ខែចុងក្រោយ បងប្អូនធ្លាប់ញិច ឬកេះមុនកប់ដែរឬទេ?',
    titleZh: '13. 最近 1 个月内，您是否曾用手抠、挑过闭口粉刺？',
    titleEn: '13. Over the last month, have you scratched or picked at comedones?',
    multiSelect: false,
    options: [
      {
        value: 'never',
        labelKm: 'មិនធ្លាប់',
        labelZh: '从未挤过',
        labelEn: 'Never',
      },
      {
        value: 'occasional',
        labelKm: 'ម្តងម្កាល',
        labelZh: '偶尔按捺不住抠挤',
        labelEn: 'Occasionally',
      },
      {
        value: 'frequent',
        labelKm: 'ញឹកញាប់',
        labelZh: '经常挤痘',
        labelEn: 'Frequently',
      },
      {
        value: 'self_frequent',
        labelKm: 'ធ្វើដោយខ្លួនឯងជាញឹកញាប់',
        labelZh: '频繁自己用指甲或粉刺针清理',
        labelEn: 'Frequently pick by oneself',
      },
      {
        value: 'salon_cleaning',
        labelKm: 'ទៅហាង / Beauty Salon ឲ្យគេសម្អាត ឬញិច',
        labelZh: '去美容院做针清排痘',
        labelEn: 'Go to beauty salon for extraction',
      },
    ],
  },
  {
    id: 'q14_aggravating_factors',
    number: 13,
    titleKm: '១៤. បងប្អូនសង្កេតឃើញថា មុនកប់កើនឡើងនៅពេលណាខ្លះ?',
    titleZh: '14. 您观察到闭口通常在何时容易加重或增多？',
    titleEn: '14. When do you notice closed comedones flaring up?',
    subtitleKm: 'អាចជ្រើសរើសបានច្រើនជាងមួយ',
    subtitleZh: '（可多选）',
    subtitleEn: '(Multiple choices allowed)',
    multiSelect: true,
    options: [
      {
        value: 'after_new_product',
        labelKm: 'បន្ទាប់ពីប្រើផលិតផលថ្មី',
        labelZh: '换用某款新护肤品后',
        labelEn: 'After using new products',
      },
      {
        value: 'after_makeup',
        labelKm: 'បន្ទាប់ពី Makeup',
        labelZh: '化妆后、卸妆后',
        labelEn: 'After wearing makeup',
      },
      {
        value: 'late_sleep',
        labelKm: 'បន្ទាប់ពីគេងយប់ជ្រៅ',
        labelZh: '熬夜睡眠不足后',
        labelEn: 'After staying up late',
      },
      {
        value: 'stress',
        labelKm: 'ពេលមាន Stress',
        labelZh: '情绪压力大、焦虑时',
        labelEn: 'During stress',
      },
      {
        value: 'period',
        labelKm: 'មុន ឬអំឡុងពេលមករដូវ',
        labelZh: '经期前或经期中',
        labelEn: 'Before or during period',
      },
      {
        value: 'hot_sweat',
        labelKm: 'ពេលអាកាសធាតុក្តៅ ឬបែកញើសច្រើន',
        labelZh: '天气炎热、出汗较多时',
        labelEn: 'Hot weather or heavy sweating',
      },
      {
        value: 'mask',
        labelKm: 'បន្ទាប់ពីពាក់ម៉ាស់រយៈពេលយូរ',
        labelZh: '长时间佩戴口罩闷热后',
        labelEn: 'After wearing face masks long hours',
      },
      {
        value: 'no_clear_reason',
        labelKm: 'មិនមានមូលហេតុច្បាស់លាស់',
        labelZh: '无明显固定规律',
        labelEn: 'No clear trigger',
      },
      {
        value: 'unsure',
        labelKm: 'មិនប្រាកដ',
        labelZh: '不确定',
        labelEn: 'Unsure',
      },
    ],
  },
  // ==========================================================================
  // SECTION: “ទម្លាប់ប្រចាំថ្ងៃដែលប៉ះផ្ទាល់ជាមួយស្បែកមុខ” (Daily habits in direct contact with skin)
  // ==========================================================================
  {
    id: 'q16_pillowcase',
    number: 16,
    sectionKm: 'ទម្លាប់ប្រចាំថ្ងៃដែលប៉ះផ្ទាល់ជាមួយស្បែកមុខ',
    sectionZh: '直接接触面部肌肤的日常习惯',
    sectionEn: 'Daily Habits in Direct Contact with Facial Skin',
    titleKm: '១៦. បងប្អូនប្តូរ ឬបោកស្រោមខ្នើយញឹកញាប់ប៉ុណ្ណា?',
    titleZh: '16. 您更换或清洗枕头套的频率是？',
    titleEn: '16. How often do you change or wash your pillowcase?',
    subtitleKm: 'សូមជ្រើសរើសភាពញឹកញាប់នៃការប្តូរ ឬបោកស្រោមខ្នើយ',
    subtitleZh: '请选择您的换洗频率',
    subtitleEn: 'Please select how often you wash or change it',
    multiSelect: false,
    options: [
      {
        value: 'about_once_a_week',
        labelKm: 'ប្រហែល 1 ដងក្នុងមួយសប្ដាហ៍',
        labelZh: '大约每周 1 次',
        labelEn: 'About once a week',
      },
      {
        value: 'about_once_a_month',
        labelKm: 'ប្រហែល 1 ខែម្តង',
        labelZh: '大约每月 1 次',
        labelEn: 'About once a month',
      },
      {
        value: 'more_than_6_months',
        labelKm: 'លើសពី 6 ខែម្តង',
        labelZh: '超过 6 个月一次',
        labelEn: 'Over 6 months',
      },
      {
        value: 'irregular',
        labelKm: 'មិនទៀងទាត់',
        labelZh: '不规律',
        labelEn: 'Irregular',
      },
      {
        value: 'unsure',
        labelKm: 'មិនប្រាកដ',
        labelZh: '不确定',
        labelEn: 'Unsure',
      },
    ],
  },
  {
    id: 'q18_face_drying',
    number: 17,
    sectionKm: 'ទម្លាប់ប្រចាំថ្ងៃដែលប៉ះផ្ទាល់ជាមួយស្បែកមុខ',
    sectionZh: '直接接触面部肌肤的日常习惯',
    sectionEn: 'Daily Habits in Direct Contact with Facial Skin',
    titleKm: '១៧. បន្ទាប់ពីលាងមុខ បងប្អូនប្រើអ្វីដើម្បីជូតមុខ?',
    titleZh: '17. 洗脸后，您通常使用什么擦干面部？',
    titleEn: '17. After washing your face, what do you use to dry it?',
    subtitleKm: 'សូមជ្រើសរើសសម្ភារៈ ឬវិធីដែលបងប្អូនប្រើជូតមុខក្រោយលាងរួច',
    subtitleZh: '请选择您洁面后的擦拭方式',
    subtitleEn: 'Please select what you use to dry your face after washing',
    multiSelect: false,
    options: [
      {
        value: 'clean_towel_face_only',
        labelKm: 'កន្សែងមុខស្អាត ដែលប្រើសម្រាប់មុខតែប៉ុណ្ណោះ',
        labelZh: '面部专用洁净毛巾（仅供擦脸）',
        labelEn: 'Clean face towel (used exclusively for face)',
      },
      {
        value: 'towel_reuse_multiple',
        labelKm: 'កន្សែងមុខដែលប្រើច្រើនដងមុនបោក',
        labelZh: '多次重复使用后再清洗的面巾',
        labelEn: 'Face towel reused multiple times before washing',
      },
      {
        value: 'facial_tissue',
        labelKm: 'ក្រដាសជូតមុខ / Facial Tissue',
        labelZh: '一次性洗脸巾 / 面部纸巾',
        labelEn: 'Facial tissue / disposable towel',
      },
      {
        value: 'shared_towel',
        labelKm: 'កន្សែងរួមជាមួយអ្នកដទៃ',
        labelZh: '与他人共用毛巾',
        labelEn: 'Shared towel with others',
      },
      {
        value: 'air_dry',
        labelKm: 'ទុកឲ្យស្ងួតដោយខ្លួនឯង',
        labelZh: '自然风干 / 不使用毛巾擦拭',
        labelEn: 'Let air dry naturally',
      },
      {
        value: 'other',
        labelKm: 'ផ្សេងៗ',
        labelZh: '其他方式',
        labelEn: 'Other',
      },
    ],
  },
  {
    id: 'q19_towel_wash_freq',
    number: 18,
    sectionKm: 'ទម្លាប់ប្រចាំថ្ងៃដែលប៉ះផ្ទាល់ជាមួយស្បែកមុខ',
    sectionZh: '直接接触面部肌肤的日常习惯',
    sectionEn: 'Daily Habits in Direct Contact with Facial Skin',
    titleKm: '១៨. បើប្រើកន្សែងមុខ បងប្អូនប្តូរ ឬបោកញឹកញាប់ប៉ុណ្ណា?',
    titleZh: '18. 如果使用面巾，您通常多久更换或清洗一次？',
    titleEn: '18. If using a face towel, how often do you change or wash it?',
    subtitleKm: 'សំណួរសម្រាប់អ្នកប្រើកន្សែងមុខ៖ សូមជ្រើសរើសភាពញឹកញាប់នៃការបោក',
    subtitleZh: '（使用面巾者适用）请选择换洗频率',
    subtitleEn: '(For towel users) Please select how often you wash it',
    multiSelect: false,
    options: [
      {
        value: 'every_day',
        labelKm: 'រាល់ថ្ងៃ',
        labelZh: '每天换洗',
        labelEn: 'Every day',
      },
      {
        value: 'every_2_3_days',
        labelKm: 'រៀងរាល់ 2–3 ថ្ងៃ',
        labelZh: '每 2–3 天换洗',
        labelEn: 'Every 2–3 days',
      },
      {
        value: 'about_once_a_week',
        labelKm: 'ប្រហែល 1 ដងក្នុងមួយសប្ដាហ៍',
        labelZh: '大约每周 1 次',
        labelEn: 'About once a week',
      },
      {
        value: 'more_than_1_week',
        labelKm: 'លើសពី 1 សប្ដាហ៍',
        labelZh: '超过 1 周才换洗',
        labelEn: 'More than 1 week',
      },
      {
        value: 'irregular',
        labelKm: 'មិនទៀងទាត់',
        labelZh: '不规律换洗',
        labelEn: 'Irregular',
      },
    ],
  },
  // ==========================================================================
  // SECTION: “ការជម្រុះកោសិកាចាស់ៗ” (Exfoliation Routine)
  // ==========================================================================
  {
    id: 'q20_exfoliation_freq',
    number: 19,
    sectionKm: 'ការជម្រុះកោសិកាចាស់ៗ',
    sectionZh: '去角质护理习惯',
    sectionEn: 'Exfoliation Routine',
    titleKm: '១៩. ក្នុងមួយសប្ដាហ៍ បងប្អូនជម្រុះកោសិកាចាស់ៗលើផ្ទៃមុខប៉ុន្មានដង?',
    titleZh: '19. 您每周面部去角质几次？',
    titleEn: '19. How many times a week do you exfoliate your facial skin?',
    subtitleKm: 'សូមជ្រើសរើសតាមទម្លាប់ថែស្បែករបស់បងប្អូន',
    subtitleZh: '请选择您的去角质频率',
    subtitleEn: 'Please select your exfoliation frequency',
    multiSelect: false,
    options: [
      {
        value: 'never',
        labelKm: 'មិនដែលជម្រុះកោសិកាចាស់ៗទេ',
        labelZh: '从不去角质',
        labelEn: 'Never exfoliate',
      },
      {
        value: 'once_a_week',
        labelKm: '១ ដងក្នុងមួយសប្ដាហ៍',
        labelZh: '每周 1 次',
        labelEn: '1 time a week',
      },
      {
        value: 'twice_a_week',
        labelKm: '២ ដងក្នុងមួយសប្ដាហ៍',
        labelZh: '每周 2 次',
        labelEn: '2 times a week',
      },
      {
        value: 'three_times_a_week',
        labelKm: '៣ ដងក្នុងមួយសប្ដាហ៍',
        labelZh: '每周 3 次',
        labelEn: '3 times a week',
      },
      {
        value: 'more_than_three',
        labelKm: 'លើសពី ៣ ដងក្នុងមួយសប្ដាហ៍ (៤ ដង ឬច្រើនជាង)',
        labelZh: '每周 3 次以上（4 次或更多）',
        labelEn: 'More than 3 times a week (4+ times)',
      },
      {
        value: 'irregular',
        labelKm: 'មិនទៀងទាត់',
        labelZh: '不规律',
        labelEn: 'Irregular',
      },
      {
        value: 'unsure',
        labelKm: 'មិនប្រាកដ',
        labelZh: '不确定',
        labelEn: 'Unsure',
      },
    ],
  },
  {
    id: 'q21_exfoliation_feel',
    number: 20,
    sectionKm: 'ការជម្រុះកោសិកាចាស់ៗ',
    sectionZh: '去角质护理习惯',
    sectionEn: 'Exfoliation Routine',
    titleKm: '២០. ពេលដែលបងប្អូនបានជម្រុះកោសិកាចាស់ៗហើយ ស្បែកមុខរបស់បងប្អូនមានអារម្មណ៍យ៉ាងដូចម្តេច?',
    titleZh: '20. 去角质后，您的面部肌肤感觉如何？',
    titleEn: '20. After exfoliating, how does your facial skin feel?',
    subtitleKm: 'អាចជ្រើសរើសបានច្រើនជាងមួយ',
    subtitleZh: '（可多选）请选择您的皮肤感受',
    subtitleEn: 'Multiple choices allowed',
    multiSelect: true,
    options: [
      {
        value: 'oil_reduction_smooth',
        labelKm: 'កាត់បន្ថយមុខខ្លាញ់ មុខមុន និងម៉ត់រលោង',
        labelZh: '减少油光粉刺，感觉光滑',
        labelEn: 'Reduced oil & acne, smoother skin',
      },
      {
        value: 'tight',
        labelKm: 'ស្បែកតឹង ស្បែកស្ងួត ស្បែករបក',
        labelZh: '皮肤紧绷、干燥或起屑脱皮',
        labelEn: 'Skin feels tight, dry, or peeling',
      },
      {
        value: 'redness',
        labelKm: 'ស្បែកក្រហម',
        labelZh: '皮肤泛红',
        labelEn: 'Skin redness',
      },
      {
        value: 'stinging_burning',
        labelKm: 'មានអារម្មណ៍ចាក់ៗ ឬក្តៅ',
        labelZh: '有刺痛或发热灼热感',
        labelEn: 'Stinging or burning sensation',
      },
      {
        value: 'itching',
        labelKm: 'មានអារម្មណ៍រមាស់',
        labelZh: '有瘙痒感',
        labelEn: 'Skin itching',
      },
      {
        value: 'normal_no_issues',
        labelKm: 'មិនមានអារម្មណ៍ខុសប្រក្រតី',
        labelZh: '无任何异常感觉',
        labelEn: 'Normal / No abnormal sensation',
      },
      {
        value: 'unsure',
        labelKm: 'ធម្មតា',
        labelZh: '正常',
        labelEn: 'Normal',
      },
    ],
  },
];

// ============================================================================
// 2. CONDITIONAL QUESTION LOGIC (Q9 / Q10 & Q18 / Q19)
// ============================================================================

/**
 * Checks if customer uses a face towel in Q18.
 * Towel options: clean_towel_face_only, towel_reuse_multiple, shared_towel.
 */
export function isUsingFaceTowel(answers: ClosedComedonesAnswers): boolean {
  const method = answers.q18_face_drying || answers.q17_face_drying;
  return (
    method === 'clean_towel_face_only' ||
    method === 'towel_reuse_multiple' ||
    method === 'shared_towel'
  );
}

/**
 * Checks if Q19 should be skipped.
 * Skip Q19 if customer does NOT use face towel (e.g. tissue, air dry, other).
 */
export function isQ19Skipped(answers: ClosedComedonesAnswers): boolean {
  return !isUsingFaceTowel(answers);
}

/**
 * Checks if Q10 should be skipped completely.
 * CASE 1: Q9 = "មិន Makeup" AND Q8 does NOT contain Sunscreen.
 */
export function isQ10Skipped(answers: ClosedComedonesAnswers): boolean {
  const isNoMakeup = answers.q9_makeup_freq === 'none';
  const hasSunscreen = (answers.q8_daily_products || []).includes('sunscreen');
  return isNoMakeup && !hasSunscreen;
}

/**
 * Returns dynamic definition for Q10 depending on Q9 and Sunscreen usage.
 * CASE 2: Q9 = "មិន Makeup" AND Q8 contains Sunscreen -> Remove "Makeup" from title.
 * CASE 3: Normal Q10.
 */
export function getQ10DynamicDefinition(answers: ClosedComedonesAnswers): ComedonesQuestionDef {
  const baseDef = COMEDONES_15_QUESTIONS.find((q) => q.id === 'q10_cleansing_routine')!;
  const isNoMakeup = answers.q9_makeup_freq === 'none';
  const hasSunscreen = (answers.q8_daily_products || []).includes('sunscreen');

  if (isNoMakeup && hasSunscreen) {
    return {
      ...baseDef,
      titleKm: '១០. បន្ទាប់ពីប្រើ Sunscreen បងប្អូនសម្អាតមុខមុនចូលគេងយ៉ាងដូចម្តេច?',
      titleZh: '10. 涂抹防晒后，睡前您是如何进行面部洁肤的？',
      titleEn: '10. After wearing sunscreen, how do you cleanse your face before bed?',
      options: [
        {
          value: 'double_cleanse_daily',
          labelKm: 'លុប Sunscreen រួចលាងមុខឲ្យស្អាតរាល់ថ្ងៃ',
          labelZh: '彻底卸除防晒后再洁面，每天坚持',
          labelEn: 'Remove sunscreen then cleanse thoroughly every day',
        },
        {
          value: 'cleanser_only',
          labelKm: 'ប្រើតែហ្វូមលាងមុខ',
          labelZh: '只用普通洁面乳，不专门卸除防晒',
          labelEn: 'Use face cleanser only without dedicated remover',
        },
        {
          value: 'sometimes_forget',
          labelKm: 'ពេលខ្លះភ្លេចលាងមុខស្អាតល្អ',
          labelZh: '有时太累忘记彻底清洗',
          labelEn: 'Sometimes forget to wash thoroughly',
        },
        {
          value: 'sometimes_sleep_with_makeup',
          labelKm: 'ពេលខ្លះគេងទាំងមិនបានលាងមុខ',
          labelZh: '偶尔不洗脸就入睡',
          labelEn: 'Sometimes sleep without washing face',
        },
        {
          value: 'unsure',
          labelKm: 'មិនប្រាកដថាសម្អាតបានស្អាតឬអត់',
          labelZh: '不确定是否彻底洗净',
          labelEn: 'Unsure if thoroughly cleaned',
        },
      ],
    };
  }

  return baseDef;
}

/**
 * Checks if Exfoliation Follow-up questions (Feeling & Products) should be skipped.
 * Skipped if customer selects "never" (មិនដែលជម្រុះកោសិកាចាស់ៗទេ).
 */
export function isExfoliationFollowUpSkipped(answers: ClosedComedonesAnswers): boolean {
  return answers.q20_exfoliation_freq === 'never';
}

/**
 * Dynamically computes question definition and Khmer/English/Chinese titles
 * for the 3 exfoliation questions based on whether Question 18 (Towel) is active.
 *
 * Rule from user:
 * - If NO Q18 (towel):
 *   - Exfoliation Freq is Q18
 *   - Exfoliation Feel is Q19
 *   - Exfoliation Products is Q20
 * - If WITH Q18 (towel):
 *   - Exfoliation Freq is Q19
 *   - Exfoliation Feel is Q20
 *   - Exfoliation Products is Q21
 */
export function getExfoliationQuestionDef(
  questionId: 'q20_exfoliation_freq' | 'q21_exfoliation_feel',
  answers: ClosedComedonesAnswers
): ComedonesQuestionDef {
  const hasTowel = isUsingFaceTowel(answers);

  if (questionId === 'q20_exfoliation_freq') {
    const num = hasTowel ? 19 : 18;
    const numKm = hasTowel ? '១៩' : '១៨';
    return {
      id: 'q20_exfoliation_freq',
      number: num,
      sectionKm: 'ការជម្រុះកោសិកាចាស់ៗ',
      sectionZh: '去角质护理习惯',
      sectionEn: 'Exfoliation Routine',
      titleKm: `${numKm}. ក្នុងមួយសប្ដាហ៍ បងប្អូនជម្រុះកោសិកាចាស់ៗលើផ្ទៃមុខប៉ុន្មានដង?`,
      titleZh: `${num}. 您每周面部去角质几次？`,
      titleEn: `${num}. How many times a week do you exfoliate your facial skin?`,
      subtitleKm: 'សូមជ្រើសរើសតាមទម្លាប់ថែស្បែករបស់បងប្អូន',
      subtitleZh: '请选择您的去角质频率',
      subtitleEn: 'Please select your exfoliation frequency',
      multiSelect: false,
      options: [
        {
          value: 'never',
          labelKm: 'មិនដែលជម្រុះកោសិកាចាស់ៗទេ',
          labelZh: '从不去角质',
          labelEn: 'Never exfoliate',
        },
        {
          value: 'once_a_week',
          labelKm: '១ ដងក្នុងមួយសប្ដាហ៍',
          labelZh: '每周 1 次',
          labelEn: '1 time a week',
        },
        {
          value: 'twice_a_week',
          labelKm: '២ ដងក្នុងមួយសប្ដាហ៍',
          labelZh: '每周 2 次',
          labelEn: '2 times a week',
        },
        {
          value: 'three_times_a_week',
          labelKm: '៣ ដងក្នុងមួយសប្ដាហ៍',
          labelZh: '每周 3 次',
          labelEn: '3 times a week',
        },
        {
          value: 'more_than_three',
          labelKm: 'លើសពី ៣ ដងក្នុងមួយសប្ដាហ៍ (៤ ដង ឬច្រើនជាង)',
          labelZh: '每周 3 次以上（4 次或更多）',
          labelEn: 'More than 3 times a week (4+ times)',
        },
        {
          value: 'irregular',
          labelKm: 'មិនទៀងទាត់',
          labelZh: '不规律',
          labelEn: 'Irregular',
        },
        {
          value: 'unsure',
          labelKm: 'មិនប្រាកដ',
          labelZh: '不确定',
          labelEn: 'Unsure',
        },
      ],
    };
  }

  if (questionId === 'q21_exfoliation_feel') {
    const num = hasTowel ? 20 : 19;
    const numKm = hasTowel ? '២០' : '១៩';
    return {
      id: 'q21_exfoliation_feel',
      number: num,
      sectionKm: 'ការជម្រុះកោសិកាចាស់ៗ',
      sectionZh: '去角质护理习惯',
      sectionEn: 'Exfoliation Routine',
      titleKm: `${numKm}. ពេលដែលបងប្អូនបានជម្រុះកោសិកាចាស់ៗហើយ ស្បែកមុខរបស់បងប្អូនមានអារម្មណ៍យ៉ាងដូចម្តេច?`,
      titleZh: `${num}. 去角质后，您的面部肌肤感觉如何？`,
      titleEn: `${num}. After exfoliating, how does your facial skin feel?`,
      subtitleKm: 'អាចជ្រើសរើសបានច្រើនជាងមួយ',
      subtitleZh: '（可多选）请选择您的皮肤感受',
      subtitleEn: 'Multiple choices allowed',
      multiSelect: true,
      options: [
        {
          value: 'oil_reduction_smooth',
          labelKm: 'កាត់បន្ថយមុខខ្លាញ់ មុខមុន និងម៉ត់រលោង',
          labelZh: '减少油光粉刺，感觉光滑',
          labelEn: 'Reduced oil & acne, smoother skin',
        },
        {
          value: 'tight',
          labelKm: 'ស្បែកតឹង ស្បែកស្ងួត ស្បែករបក',
          labelZh: '皮肤紧绷、干燥或起屑脱皮',
          labelEn: 'Skin feels tight, dry, or peeling',
        },
        {
          value: 'redness',
          labelKm: 'ស្បែកក្រហម',
          labelZh: '皮肤泛红',
          labelEn: 'Skin redness',
        },
        {
          value: 'stinging_burning',
          labelKm: 'មានអារម្មណ៍ចាក់ៗ ឬក្តៅ',
          labelZh: '有刺痛或发热灼热感',
          labelEn: 'Stinging or burning sensation',
        },
        {
          value: 'itching',
          labelKm: 'មានអារម្មណ៍រមាស់',
          labelZh: '有瘙痒感',
          labelEn: 'Skin itching',
        },
        {
          value: 'normal_no_issues',
          labelKm: 'មិនមានអារម្មណ៍ខុសប្រក្រតី',
          labelZh: '无任何异常感觉',
          labelEn: 'Normal / No abnormal sensation',
        },
        {
          value: 'unsure',
          labelKm: 'ធម្មតា',
          labelZh: '正常',
          labelEn: 'Normal',
        },
      ],
    };
  }

  // Fallback for safety
  return COMEDONES_15_QUESTIONS[0];
}

/**
 * Converts an integer to Khmer numerals.
 */
export function toKhmerNumeral(n: number): string {
  const digits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(n)
    .split('')
    .map((c) => digits[parseInt(c, 10)] ?? c)
    .join('');
}

/**
 * Follow-up question for Makeup Remover
 * (Shown ONLY when user chooses Makeup Remover in Q8)
 */
export const Q8_FOLLOWUP_REMOVER_DEF: ComedonesQuestionDef = {
  id: 'q8_remover_feeling',
  number: 9,
  sectionKm: 'ការ Remove Makeup',
  sectionZh: '卸妆洁肤体验',
  sectionEn: 'Makeup Removal Routine',
  titleKm: 'អារម្មណ៍ក្រោយប្រើ Makeup Remover',
  titleZh: '使用卸妆产品后的感受',
  titleEn: 'Experience after using Makeup Remover',
  subtitleKm: 'សូមជ្រើសរើសចម្លើយដែលត្រូវនឹងផលិតផល Remover របស់បងប្អូន',
  subtitleZh: '请选择符合您当前卸妆体验的一项',
  subtitleEn: 'Please select the option that best matches your remover experience',
  multiSelect: false,
  options: [
    {
      value: 'clean_no_sting',
      labelKm: 'Remove Makeup បានស្អាតល្អ មិនក្រហាយភ្នែក',
      labelZh: '卸妆干净彻底，眼周不刺痛',
      labelEn: 'Remover cleans thoroughly, no eye stinging',
    },
    {
      value: 'clean_stings_eyes',
      labelKm: 'Remove Makeup បានស្អាតល្អ តែក្រហាយភ្នែក',
      labelZh: '卸妆较干净，但眼周刺痛或熏眼',
      labelEn: 'Remover cleans thoroughly, but stings eyes',
    },
    {
      value: 'unclean_residue',
      labelKm: 'Remove Makeup មិនបានស្អាតទេ នៅសល់សំណល់ makeup ជាច្រើនទៀត',
      labelZh: '卸妆不够干净，残留很多底妆污垢',
      labelEn: 'Does not clean thoroughly, leaves makeup residue',
    },
  ],
};

/**
 * Follow-up question for Acne Treatment
 * (Shown ONLY when user chooses Acne Treatment in Q8)
 */
export const Q8_FOLLOWUP_ACNE_TREATMENT_DEF: ComedonesQuestionDef = {
  id: 'q8_acne_treatment_feeling',
  number: 8,
  sectionKm: 'ការថែទាំ & ព្យាបាលមុន',
  sectionZh: '护肤与修护体验',
  sectionEn: 'Skincare Product Experience',
  titleKm: '៨. អារម្មណ៍ក្រោយប្រើផលិតផលទាំងនោះរួច',
  titleZh: '8. 使用那些产品后的感受',
  titleEn: '8. Experience after using those products',
  subtitleKm: 'សូមជ្រើសរើសចម្លើយដែលត្រូវនឹងផលិតផលដែលបងប្អូនកំពុងប្រើ',
  subtitleZh: '请选择符合您当前使用护肤品体验的一项',
  subtitleEn: 'Please select the option that best matches your skincare product experience',
  multiSelect: false,
  options: [
    {
      value: 'effective_comfortable',
      labelKm: 'ព្យាបាលមុនបានល្អ ស្បែកមិនក្រហាយ មិនស្ងួតរបក',
      labelZh: '祛痘效果良好，皮肤无刺痛、紧绷脱皮',
      labelEn: 'Effective on acne, no burning, dryness, or peeling',
    },
    {
      value: 'stings_dry_peeling',
      labelKm: 'ព្យាបាលមុនបានល្អ តែស្បែកក្រហាយ ស្ងួតខ្លាំង ឬរបក',
      labelZh: '有祛痘效果，但皮肤发红刺痛、干燥紧绷起皮',
      labelEn: 'Effective, but skin feels stinging, dry, or peeling',
    },
    {
      value: 'ineffective',
      labelKm: 'ប្រើហើយមិនឃើញប្រសិទ្ធភាព',
      labelZh: '使用后不见好转 / 无明显改善',
      labelEn: 'Ineffective, no visible improvement',
    },
    {
      value: 'acne_increased',
      labelKm: 'ឬមុនកើនឡើងលើសដើម',
      labelZh: '或痘痘反而加重增多',
      labelEn: 'Or acne worsens and spreads more than before',
    },
    {
      value: 'itchy_rash_burn',
      labelKm: 'រមាស់ / រោល / រលាក / ក្រហាយ',
      labelZh: '发痒 / 起疹发红 / 敏感发炎 / 刺痛灼热',
      labelEn: 'Itchy / Rash / Irritated / Stinging or Burning',
    },
  ],
};

/**
 * Dynamically computes the full active, sequential list of questions for Deep Closed Comedones.
 * - Injects Question 8 (អារម្មណ៍ក្រោយប្រើផលិតផលទាំងនោះរួច) immediately after Question 7 (q8_daily_products) for ALL users.
 * - Injects Follow-up (Makeup Remover: អារម្មណ៍ក្រោយប្រើ Makeup Remover) next if user selected makeup_remover.
 * - Skips Q10 (Cleansing routine) if user does not wear makeup and does not use sunscreen.
 * - Dynamically updates Q10 title/options if user uses sunscreen but no makeup.
 * - Skips Q19 (Towel wash frequency) if user does not dry face with towel.
 * - Skips Q21 & Q22 (Exfoliation feel & products) if user answers 'never' for exfoliation frequency.
 * - Automatically renumbers all active questions 1..N with consistent Khmer numerals (១, ២, ៣...).
 */
export function getActiveComedonesQuestions(answers: ClosedComedonesAnswers): ComedonesQuestionDef[] {
  const result: ComedonesQuestionDef[] = [];
  const dailyProds = answers.q8_daily_products || [];

  // Base questions (Q1 to Q8 minus Q2)
  const baseIds: Array<keyof ClosedComedonesAnswers> = [
    'q1_appearance',
    'q3_duration',
    'q4_areas',
    'q5_amount',
    'q6_trend',
    'q7_new_products',
    'q8_daily_products',
  ];
  for (const id of baseIds) {
    const q = COMEDONES_15_QUESTIONS.find((def) => def.id === id);
    if (q) result.push(q);
  }

  // Question 8: អារម្មណ៍ក្រោយប្រើផលិតផលទាំងនោះរួច (Dynamic options depending on Q5: មុនកប់មានការប្រែប្រួលយ៉ាងដូចម្តេច?)
  let q8Options = [...Q8_FOLLOWUP_ACNE_TREATMENT_DEF.options];

  if (answers.q6_trend === 'improving') {
    // ថយចុះ: DO NOT show 'ineffective' ('ប្រើហើយមិនឃើញប្រសិទ្ធភាព'), 'acne_increased' ('ឬមុនកើនឡើងលើសដើម'), or 'itchy_rash_burn' ('រមាស់ / រោល / រលាក / ក្រហាយ')
    q8Options = q8Options.filter(
      (opt) =>
        opt.value !== 'ineffective' &&
        opt.value !== 'acne_increased' &&
        opt.value !== 'itchy_rash_burn'
    );
  } else if (
    answers.q6_trend === 'stable' ||
    answers.q6_trend === 'slight_increase' ||
    answers.q6_trend === 'large_increase' ||
    answers.q6_trend === 'rapid_spike'
  ) {
    // ស្ទើរតែដដែល, កើនឡើងបន្តិច, កើនឡើងច្រើន, កើតឡើងភ្លាមៗច្រើនក្នុងរយៈពេលខ្លី:
    // DO NOT show 'effective_comfortable' ('ព្យាបាលមុនបានល្អ ស្បែកមិនក្រហាយ មិនស្ងួតរបក')
    // or 'stings_dry_peeling' ('ព្យាបាលមុនបានល្អ តែស្បែកក្រហាយ ស្ងួតខ្លាំង ឬរបក')
    // Shows: 'ineffective', 'acne_increased', and 'itchy_rash_burn' ('រមាស់ / រោល / រលាក / ក្រហាយ')
    q8Options = q8Options.filter(
      (opt) => opt.value !== 'effective_comfortable' && opt.value !== 'stings_dry_peeling'
    );
  }

  result.push({
    ...Q8_FOLLOWUP_ACNE_TREATMENT_DEF,
    options: q8Options,
  });

  // Follow-up: Makeup Remover (អារម្មណ៍ក្រោយប្រើ Makeup Remover) - shown after Question 8 if user uses remover
  if (dailyProds.includes('makeup_remover')) {
    result.push(Q8_FOLLOWUP_REMOVER_DEF);
  }

  // Q9: Makeup frequency
  const q9Def = COMEDONES_15_QUESTIONS.find((q) => q.id === 'q9_makeup_freq');
  if (q9Def) result.push(q9Def);

  // Q10: Cleansing routine (skip if no makeup & no sunscreen)
  if (!isQ10Skipped(answers)) {
    result.push(getQ10DynamicDefinition(answers));
  }

  // Routine questions (Q11-Q14, Q16, Q18)
  const midIds: Array<keyof ClosedComedonesAnswers> = [
    'q11_wash_freq',
    'q12_post_wash_feeling',
    'q13_picking_habit',
    'q14_aggravating_factors',
    'q16_pillowcase',
    'q18_face_drying',
  ];
  for (const id of midIds) {
    const q = COMEDONES_15_QUESTIONS.find((def) => def.id === id);
    if (q) result.push(q);
  }

  // Q19: Towel wash freq (only if using face towel)
  if (isUsingFaceTowel(answers)) {
    const q19 = COMEDONES_15_QUESTIONS.find((def) => def.id === 'q19_towel_wash_freq');
    if (q19) result.push(q19);
  }

  // Q20: Exfoliation freq
  const q20 = COMEDONES_15_QUESTIONS.find((def) => def.id === 'q20_exfoliation_freq');
  if (q20) result.push(q20);

  // Exfoliation feel (skip if never) - Note: q22_exfoliation_products (question 21) is deleted per user request
  if (!isExfoliationFollowUpSkipped(answers)) {
    const q21 = COMEDONES_15_QUESTIONS.find((def) => def.id === 'q21_exfoliation_feel');
    if (q21) result.push(q21);
  }

  // Format all active questions with clean, sequential numbers
  return result.map((q, idx) => {
    const num = idx + 1;
    const numKm = toKhmerNumeral(num);
    const cleanTitleKm = q.titleKm.replace(/^[០-៩\d]+[\.、\s\-:]+\s*/, '');
    const cleanTitleZh = q.titleZh.replace(/^[\d]+[\.、\s\-:]+\s*/, '');
    const cleanTitleEn = q.titleEn.replace(/^[\d]+[\.、\s\-:]+\s*/, '');

    return {
      ...q,
      number: num,
      titleKm: `${numKm}. ${cleanTitleKm}`,
      titleZh: `${num}. ${cleanTitleZh}`,
      titleEn: `${num}. ${cleanTitleEn}`,
    };
  });
}

// ============================================================================
// 3. ANALYSIS OBJECT, FINDINGS, PRIORITIES & HABITS DATA TYPES
// ============================================================================

export type PriorityLevel = 'HIGH_ATTENTION' | 'MEDIUM_ATTENTION' | 'MONITOR' | 'POSITIVE_HABIT';

export interface ComedoneFinding {
  id: string;
  category:
    | 'comedone_count'
    | 'duration'
    | 'trend'
    | 'inflammation'
    | 'product_change'
    | 'cleansing_irritation'
    | 'active_products'
    | 'makeup_cleansing'
    | 'picking'
    | 'observed_pattern'
    | 'safety'
    | 'remover_irritation'
    | 'remover_residue'
    | 'acne_treatment_barrier'
    | 'acne_treatment_ineffective';
  titleKm: string;
  evidenceKm: string;
  importanceReasonKm: string;
  priorityLevel: PriorityLevel;
}

export interface ComedonePriority {
  id: string;
  rank: number;
  level: 'HIGH_ATTENTION' | 'MEDIUM_ATTENTION' | 'MONITOR';
  titleKm: string;
  evidencePointsKm: string[];
  reasonKm: string;
  actionSummaryKm?: string;
}

export interface ComedonePositiveHabit {
  id: string;
  titleKm: string;
  descriptionKm: string;
}

export interface ComedonesAnalysisObject {
  comedone_type: 'typical_closed_comedone_like' | 'whitehead_like' | 'comedone_with_inflammation' | 'uncertain';
  comedone_amount: 'low' | 'mild' | 'medium' | 'high' | 'high_attention' | 'unknown';
  comedone_extent: 'localized' | 'widespread';
  duration_level: 'recent' | 'persistent' | 'persistent_longer' | 'long_term' | 'recurrent' | 'uncertain';
  trend_level: 'improving' | 'stable' | 'increasing' | 'clearly_increasing' | 'rapidly_increasing' | 'uncertain';
  inflammation_level: 'none' | 'mild' | 'moderate' | 'high' | 'uncertain';

  product_change_factor: 'high' | 'medium' | 'low' | 'none';
  cleansing_irritation_factor: 'high' | 'medium' | 'low' | 'none';
  active_product_factor: 'high' | 'medium' | 'low' | 'none';
  makeup_cleansing_factor: 'high' | 'medium' | 'low' | 'not_applicable';
  picking_factor: 'high' | 'medium' | 'low' | 'none';
  irritation_signs: string[];

  observed_patterns: string[];

  professional_review_flag: boolean;

  findings: ComedoneFinding[];
  priorities: ComedonePriority[];
  positive_habits: ComedonePositiveHabit[];
}

export interface SuitableProductItem {
  id: string; // Store product ID: 'p1' | 'p2' | 'p3' | 'p4' | 'p5'
  customNameKm?: string;
}

export interface ComedoneSummaryItem {
  questionNumber: number;
  id: string;
  topicKm: string;
  summaryKm: string;
  category: 'condition' | 'routine' | 'habits_triggers' | 'skin_contact_habits' | 'exfoliation';
  categoryLabelKm: string;
}

export interface ClosedComedonesAnalysisResult {
  isUnsureThresholdExceeded?: boolean;
  unsureCount?: number;
  analysisObject: ComedonesAnalysisObject;

  // 7 SECTIONS OF FINAL RESULT
  // 1. ស្ថានភាពមុនកប់បច្ចុប្បន្ន
  section1_summary: {
    appearanceTextKm: string;
    amountTextKm: string;
    locationTextKm: string;
    durationTextKm: string;
    trendTextKm: string;
    inflammationTextKm: string;
    badgeLabelKm: string;
    badgeColor: 'emerald' | 'amber' | 'rose' | 'blue';
    trendStatus?: {
      titleKm: string;
      descriptionKm: string;
    };
    summaryItems: ComedoneSummaryItem[];
  };

  // 2. បញ្ហា និងកត្តាទាំងអស់ដែល Lumimei សង្កេតឃើញ (Never hidden!)
  section2_all_findings: ComedoneFinding[];

  // 3. អ្វីដែលគួរយកចិត្តទុកដាក់ជាមុន (Prioritized ranking)
  section3_priorities: ComedonePriority[];

  // 4. អ្វីដែលបងប្អូនគួរតែបញ្ឈប់
  section4_reduce_pause: Array<{
    id: string;
    titleKm: string;
    detailKm: string;
    tagKm: string;
  }>;

  // 5. អ្វីដែលបងប្អូនគួរបន្ត (Positive Habits)
  section5_continue: Array<{
    id: string;
    titleKm: string;
    detailKm: string;
  }>;

  // 6. អ្វីដែលបងប្អូនគួរតែធ្វើបន្ទាប់
  section6_next_steps: Array<{
    stepNumber: number;
    titleKm: string;
    actionKm: string;
  }>;

  // 7. ផលិតផលដែលសមស្របសម្រាប់បងប្អូន (Only stores product IDs referencing shared catalog)
  section7_products: {
    professionalReviewNotice?: {
      titleKm: string;
      bodyKm: string;
    };
    outOfScopeNoticeKm?: string;
    productDirectionsKm: Array<{
      categoryKm: string;
      adviceKm: string;
    }>;
    recommendedProductIds: string[];
    recommendedProducts: SuitableProductItem[];
  };
}

// ============================================================================
// 4. EVALUATE CLOSED COMEDONES WITH DETERMINISTIC RULE ENGINE
// ============================================================================

export function evaluateClosedComedonesRuleBased(
  answers: ClosedComedonesAnswers,
  _language: Language = 'km'
): ClosedComedonesAnalysisResult {
  // --------------------------------------------------------------------------
  // RULE 1: Q1 + Q2 -> comedone_type & inflammation_level
  // --------------------------------------------------------------------------
  let comedone_type: ComedonesAnalysisObject['comedone_type'] = 'typical_closed_comedone_like';
  if (answers.q1_appearance === 'skin_colored_non_inflamed') {
    comedone_type = 'typical_closed_comedone_like';
  } else if (answers.q1_appearance === 'whitehead_bumps') {
    comedone_type = 'whitehead_like';
  } else if (answers.q1_appearance === 'inflamed_red_bumps') {
    comedone_type = 'comedone_with_inflammation';
  } else {
    comedone_type = 'uncertain';
  }

  let inflammation_level: ComedonesAnalysisObject['inflammation_level'] = 'none';
  let professional_review_flag = false;

  if (answers.q2_inflammatory_count === 'none') {
    inflammation_level = 'none';
  } else if (answers.q2_inflammatory_count === '1_to_2') {
    inflammation_level = 'mild';
  } else if (answers.q2_inflammatory_count === '3_to_5') {
    inflammation_level = 'moderate';
  } else if (answers.q2_inflammatory_count === 'more_than_5') {
    inflammation_level = 'high';
    professional_review_flag = true;
  } else {
    inflammation_level = 'uncertain';
  }

  // If Q1 showed inflamed red bumps and Q2 was none, elevate to mild
  if (answers.q1_appearance === 'inflamed_red_bumps' && inflammation_level === 'none') {
    inflammation_level = 'mild';
  } else if (answers.q1_appearance === 'inflamed_red_bumps' && inflammation_level === 'mild') {
    inflammation_level = 'moderate';
  }

  // --------------------------------------------------------------------------
  // RULE 2: Q3 -> duration_level
  // --------------------------------------------------------------------------
  let duration_level: ComedonesAnalysisObject['duration_level'] = 'recent';
  if (answers.q3_duration === 'less_than_1m' || answers.q3_duration === '1_to_3m') {
    duration_level = 'recent';
  } else if (answers.q3_duration === '3_to_6m') {
    duration_level = 'persistent';
  } else if (answers.q3_duration === '6_to_12m') {
    duration_level = 'persistent_longer';
  } else if (answers.q3_duration === 'more_than_1y') {
    duration_level = 'long_term';
  } else if (answers.q3_duration === 'recurrent') {
    duration_level = 'recurrent';
  } else {
    duration_level = 'uncertain';
  }

  // --------------------------------------------------------------------------
  // RULE 3: Q4 -> comedone_extent & Location Personalization
  // --------------------------------------------------------------------------
  const areas = answers.q4_areas || [];
  const comedone_extent: ComedonesAnalysisObject['comedone_extent'] =
    areas.includes('almost_full_face') || areas.length >= 4 ? 'widespread' : 'localized';

  const areaNamesMap: Record<string, string> = {
    forehead: 'ថ្ងាស',
    nose: 'ច្រមុះ',
    cheeks: 'ថ្ពាល់',
    chin: 'ចង្កា',
    jawline: 'បន្ទាត់ថ្គាម',
    almost_full_face: 'ស្ទើរតែពេញផ្ទៃមុខ',
  };
  const locationText = areas
    .filter((a) => a in areaNamesMap)
    .map((a) => areaNamesMap[a])
    .join(' និង ');

  // --------------------------------------------------------------------------
  // RULE 4: Q5 -> comedone_amount
  // --------------------------------------------------------------------------
  let comedone_amount: ComedonesAnalysisObject['comedone_amount'] = 'mild';
  if (answers.q5_amount === 'less_than_10') {
    comedone_amount = 'low';
  } else if (answers.q5_amount === '10_to_20') {
    comedone_amount = 'mild';
  } else if (answers.q5_amount === '21_to_50') {
    comedone_amount = 'medium';
  } else if (answers.q5_amount === 'more_than_50') {
    comedone_amount = 'high';
  } else {
    comedone_amount = 'high_attention';
  }

  // --------------------------------------------------------------------------
  // RULE 5: Q6 -> trend_level
  // --------------------------------------------------------------------------
  let trend_level: ComedonesAnalysisObject['trend_level'] = 'stable';
  if (answers.q6_trend === 'improving') {
    trend_level = 'improving';
  } else if (answers.q6_trend === 'stable') {
    trend_level = 'stable';
  } else if (answers.q6_trend === 'slight_increase') {
    trend_level = 'increasing';
  } else if (answers.q6_trend === 'large_increase') {
    trend_level = 'clearly_increasing';
  } else if (answers.q6_trend === 'rapid_spike') {
    trend_level = 'rapidly_increasing';
  } else {
    trend_level = 'uncertain';
  }

  // --------------------------------------------------------------------------
  // RULE 6: Q6 + Q7 + Q14 -> Product Change Rule
  // --------------------------------------------------------------------------
  let product_change_factor: ComedonesAnalysisObject['product_change_factor'] = 'none';
  const hasNewProduct = answers.q7_new_products === '1_product' || answers.q7_new_products === '2_or_more';
  const isAcneSurging =
    trend_level === 'increasing' || trend_level === 'clearly_increasing' || trend_level === 'rapidly_increasing';
  const hasObservedNewProductTrigger = (answers.q14_aggravating_factors || []).includes('after_new_product');

  if (hasNewProduct && isAcneSurging && hasObservedNewProductTrigger) {
    product_change_factor = 'high';
  } else if (hasNewProduct && isAcneSurging) {
    product_change_factor = 'medium';
  } else if (hasNewProduct && trend_level === 'improving') {
    product_change_factor = 'low';
  } else if (hasNewProduct) {
    product_change_factor = 'medium';
  }

  // --------------------------------------------------------------------------
  // RULE 7: Q8 + Q11 + Q12 -> Cleansing / Irritation Rule
  // --------------------------------------------------------------------------
  let cleansing_irritation_factor: ComedonesAnalysisObject['cleansing_irritation_factor'] = 'none';
  const irritationFeelings = ['very_tight_dry', 'dry_flaking', 'red_stinging', 'slightly_tight'];
  const hasStrongIrritationFeeling =
    answers.q12_post_wash_feeling === 'very_tight_dry' ||
    answers.q12_post_wash_feeling === 'dry_flaking' ||
    answers.q12_post_wash_feeling === 'red_stinging';

  const isOverwashing = answers.q11_wash_freq === 'three_times' || answers.q11_wash_freq === 'more_than_three';
  const isGentleWash = answers.q11_wash_freq === 'once' || answers.q11_wash_freq === 'twice';
  const isComfortableSkin = answers.q12_post_wash_feeling === 'normal_comfortable';

  if (isOverwashing && hasStrongIrritationFeeling) {
    cleansing_irritation_factor = 'high';
  } else if (isOverwashing || hasStrongIrritationFeeling) {
    cleansing_irritation_factor = 'medium';
  } else if (isGentleWash && isComfortableSkin) {
    cleansing_irritation_factor = 'low';
  }

  const irritation_signs: string[] = [];
  if (answers.q12_post_wash_feeling === 'slightly_tight') irritation_signs.push('តឹងស្បែកបន្តិចក្រោយលាង');
  if (answers.q12_post_wash_feeling === 'very_tight_dry') irritation_signs.push('តឹង និងស្ងួតខ្លាំង');
  if (answers.q12_post_wash_feeling === 'dry_flaking') irritation_signs.push('ស្ងួត ឬរបក');
  if (answers.q12_post_wash_feeling === 'red_stinging') irritation_signs.push('ក្រហម ឬចាក់ៗលើស្បែក');

  // --------------------------------------------------------------------------
  // RULE 8: Active Product Rule (Q8 + Q12)
  // --------------------------------------------------------------------------
  let active_product_factor: ComedonesAnalysisObject['active_product_factor'] = 'none';
  const dailyProds = answers.q8_daily_products || [];
  const activeItemsCount = [
    dailyProds.includes('aha_bha'),
    dailyProds.includes('retinol'),
    dailyProds.includes('scrub'),
    dailyProds.includes('acne_treatment'),
  ].filter(Boolean).length;

  if (activeItemsCount >= 2 && hasStrongIrritationFeeling) {
    active_product_factor = 'high';
    cleansing_irritation_factor = 'high';
  } else if (activeItemsCount >= 2 || (activeItemsCount >= 1 && hasStrongIrritationFeeling)) {
    active_product_factor = 'medium';
  } else if (activeItemsCount === 1) {
    active_product_factor = 'low';
  }

  // --------------------------------------------------------------------------
  // RULE 9: Makeup Conditional & Cleansing Rule (Q9 + Q10 + Q8)
  // --------------------------------------------------------------------------
  let makeup_cleansing_factor: ComedonesAnalysisObject['makeup_cleansing_factor'] = 'low';
  const isNoMakeup = answers.q9_makeup_freq === 'none';
  const hasSunscreen = dailyProds.includes('sunscreen');

  if (isNoMakeup && !hasSunscreen) {
    // CASE 1: Completely Not Applicable
    makeup_cleansing_factor = 'not_applicable';
  } else {
    const isFrequentMakeup =
      answers.q9_makeup_freq === 'daily' || answers.q9_makeup_freq === '3_to_5_weekly';
    const isDoubleCleanse = answers.q10_cleansing_routine === 'double_cleanse_daily';
    const isSleepingWithMakeup = answers.q10_cleansing_routine === 'sometimes_sleep_with_makeup';
    const isIrregularCleanse =
      answers.q10_cleansing_routine === 'sometimes_forget' ||
      answers.q10_cleansing_routine === 'cleanser_only' ||
      answers.q10_cleansing_routine === 'unsure';

    if (isFrequentMakeup && isSleepingWithMakeup) {
      makeup_cleansing_factor = 'high';
    } else if (isFrequentMakeup && isIrregularCleanse) {
      makeup_cleansing_factor = 'medium';
    } else if (isFrequentMakeup && isDoubleCleanse) {
      makeup_cleansing_factor = 'low';
    } else if (isSleepingWithMakeup) {
      makeup_cleansing_factor = 'high';
    } else if (isIrregularCleanse) {
      makeup_cleansing_factor = 'medium';
    } else {
      makeup_cleansing_factor = 'low';
    }
  }

  // Strengthen with Q14 trigger
  if (
    makeup_cleansing_factor !== 'not_applicable' &&
    (answers.q14_aggravating_factors || []).includes('after_makeup')
  ) {
    if (makeup_cleansing_factor === 'low') makeup_cleansing_factor = 'medium';
    else if (makeup_cleansing_factor === 'medium') makeup_cleansing_factor = 'high';
  }

  // --------------------------------------------------------------------------
  // RULE 10: Q13 Picking Rule
  // --------------------------------------------------------------------------
  let picking_factor: ComedonesAnalysisObject['picking_factor'] = 'none';
  if (answers.q13_picking_habit === 'never') {
    picking_factor = 'low';
  } else if (answers.q13_picking_habit === 'occasional') {
    picking_factor = 'medium';
  } else if (answers.q13_picking_habit === 'frequent' || answers.q13_picking_habit === 'self_frequent') {
    picking_factor = 'high';
  } else if (answers.q13_picking_habit === 'salon_cleaning') {
    picking_factor = 'medium';
  }

  // --------------------------------------------------------------------------
  // RULE 11: Q14 Observed Patterns
  // --------------------------------------------------------------------------
  const observed_patterns: string[] = [];
  const q14 = answers.q14_aggravating_factors || [];
  if (q14.includes('after_new_product')) observed_patterns.push('បន្ទាប់ពីប្រើផលិតផលថ្មី');
  if (q14.includes('after_makeup')) observed_patterns.push('បន្ទាប់ពី Makeup');
  if (q14.includes('late_sleep')) observed_patterns.push('បន្ទាប់ពីគេងយប់ជ្រៅ ឬគេងមិនគ្រប់គ្រាន់');
  if (q14.includes('stress')) observed_patterns.push('ពេលមាន Stress ឬអារម្មណ៍តានតឹង');
  if (q14.includes('period')) observed_patterns.push('មុន ឬអំឡុងពេលមករដូវ');
  if (q14.includes('hot_sweat')) observed_patterns.push('ពេលអាកាសធាតុក្តៅ ឬបែកញើសច្រើន');
  if (q14.includes('mask')) observed_patterns.push('បន្ទាប់ពីពាក់ម៉ាស់រយៈពេលយូរ');

  // --------------------------------------------------------------------------
  // RULE 12: Q15 Safety / Professional Review Threshold
  // --------------------------------------------------------------------------
  const q15 = answers.q15_warning_signs || [];
  const hasSevereSafetySigns =
    q15.includes('large_cystic_painful') ||
    q15.includes('many_bumps_itchy') ||
    q15.includes('red_burning_pain') ||
    q15.includes('rapid_escalation') ||
    q15.includes('clear_scars_forming') ||
    answers.q2_inflammatory_count === 'more_than_5' ||
    trend_level === 'rapidly_increasing';

  if (hasSevereSafetySigns) {
    professional_review_flag = true;
  }

  // ==========================================================================
  // 5. ALL FINDINGS GENERATION (NEVER HIDE ANY FINDING!)
  // ==========================================================================
  const findings: ComedoneFinding[] = [];
  const positive_habits: ComedonePositiveHabit[] = [];

  // Finding: Comedone Count & Density
  if (comedone_amount === 'high' || comedone_amount === 'high_attention') {
    findings.push({
      id: 'finding_comedone_count_high',
      category: 'comedone_count',
      titleKm: 'ចំនួនមុនកប់មានបរិមាណច្រើន (លើសពី ៥០ គ្រាប់ ឬពិបាកប៉ាន់ស្មាន)',
      evidenceKm: `ចម្លើយសំណួរទី ៥៖ បច្ចុប្បន្នមានមុនកប់ ${answers.q5_amount === 'more_than_50' ? 'លើសពី ៥០ គ្រាប់' : 'ច្រើនពិបាកប៉ាន់ស្មាន'}`,
      importanceReasonKm:
        'នៅពេលមុនកប់មានដង់ស៊ីតេក្រាស់ ស្បែកងាយនឹងវិវត្តទៅជាការកកស្ទះរ៉ាំរ៉ៃ និងអាចប្រែជារលាក ប្រសិនបើយើងប្រើផលិតផលខ្លាំងៗ ឬកេះញិច។',
      priorityLevel: 'HIGH_ATTENTION',
    });
  } else if (comedone_amount === 'medium') {
    findings.push({
      id: 'finding_comedone_count_medium',
      category: 'comedone_count',
      titleKm: 'ចំនួនមុនកប់ស្ថិតក្នុងកម្រិតមធ្យម (២១–៥០ គ្រាប់)',
      evidenceKm: 'ចម្លើយសំណួរទី ៥៖ បច្ចុប្បន្នមានមុនកប់ ២១–៥០ គ្រាប់',
      importanceReasonKm:
        'មុនកប់ចំនួននេះបង្ហាញពីការកកស្ទះដែលកំពុងប្រមូលផ្តុំក្នុងរន្ធញើស ត្រូវការការសម្អាត និងផ្តល់សំណើមត្រឹមត្រូវដើម្បីកុំឱ្យរីករាលដាល។',
      priorityLevel: 'MEDIUM_ATTENTION',
    });
  } else if (comedone_amount === 'low') {
    positive_habits.push({
      id: 'habit_low_comedones',
      titleKm: 'ចំនួនមុនកប់មានកម្រិតទាប (តិចជាង ១០ គ្រាប់)',
      descriptionKm: 'ការកកស្ទះស្ថិតក្នុងកម្រិតស្រាល ងាយស្រួលគ្រប់គ្រងដោយគ្រាន់តែរក្សាទម្លាប់សម្អាត និងសំណើមស្រាល។',
    });
  }

  // Finding: Duration
  if (duration_level === 'persistent_longer' || duration_level === 'long_term') {
    findings.push({
      id: 'finding_duration_long',
      category: 'duration',
      titleKm: 'បញ្ហាមុនកប់បានបន្តអស់រយៈពេលយូរគួរសម (លើសពី ៦ ខែ ទៅ ១ ឆ្នាំ)',
      evidenceKm: `ចម្លើយសំណួរទី ៣៖ កើតមានរយៈពេល ${answers.q3_duration === '6_to_12m' ? '៦–១២ ខែ' : 'លើសពី ១ ឆ្នាំ'}`,
      importanceReasonKm:
        'ការកកស្ទះដែលនៅបន្តយូរអង្វែងច្រើនតែផ្សារភ្ជាប់នឹងទម្លាប់ថែទាំស្បែកប្រចាំថ្ងៃដែលមិនទាន់ត្រូវក្បួន ឬការប្រើសារធាតុមិនសមស្របជាប់ជាប្រចាំ។',
      priorityLevel: 'MEDIUM_ATTENTION',
    });
  } else if (duration_level === 'recurrent') {
    findings.push({
      id: 'finding_duration_recurrent',
      category: 'duration',
      titleKm: 'មុនកប់មានលក្ខណៈកើតឡើងវិញញឹកញាប់ (កើតហើយបាត់ ហើយកើតឡើងវិញ)',
      evidenceKm: 'ចម្លើយសំណួរទី ៣៖ កើតហើយបាត់ ហើយកើតឡើងវិញញឹកញាប់',
      importanceReasonKm:
        'បង្ហាញពីកត្តាជះឥទ្ធិពលតាមវដ្ត ដូចជាការសម្អាតមិនបានស្អាតល្អជាប្រចាំ អ័រម៉ូន ឬបម្រែបម្រួលផលិតផល។',
      priorityLevel: 'MEDIUM_ATTENTION',
    });
  }

  // Finding: Trend
  if (trend_level === 'rapidly_increasing') {
    findings.push({
      id: 'finding_trend_rapid',
      category: 'trend',
      titleKm: 'មុនកប់មានការកើនឡើងភ្លាមៗច្រើនក្នុងរយៈពេលខ្លី',
      evidenceKm: 'ចម្លើយសំណួរទី ៦៖ កើតឡើងភ្លាមៗច្រើនក្នុងរយៈពេលខ្លី',
      importanceReasonKm:
        'ការកើនឡើងលឿនបែបនេះ ច្រើនតែបណ្តាលមកពីការរំខានស្រួចស្រាវលើស្បែក (ដូចជាប្រតិកម្មផលិតផលថ្មី ឬការសម្អាតមុខខុសបច្ចេកទេស)។',
      priorityLevel: 'HIGH_ATTENTION',
    });
  } else if (trend_level === 'clearly_increasing' || trend_level === 'increasing') {
    findings.push({
      id: 'finding_trend_increasing',
      category: 'trend',
      titleKm: 'មុនកប់កំពុងមាននិន្នាការកើនឡើងក្នុងរយៈពេល ១ ខែចុងក្រោយ',
      evidenceKm: `ចម្លើយសំណួរទី ៦៖ ${answers.q6_trend === 'large_increase' ? 'កើនឡើងច្រើន' : 'កើនឡើងបន្តិច'}`,
      importanceReasonKm:
        'ជាសញ្ញាបញ្ជាក់ថា ទម្លាប់ ឬផលិតផលបច្ចុប្បន្នកំពុងមានចំណុចដែលបង្កើនការកកស្ទះលើស្បែកបន្តិចម្តងៗ។',
      priorityLevel: 'MEDIUM_ATTENTION',
    });
  } else if (trend_level === 'improving') {
    // Note: ស្ថានភាពមុនកំពុងថយចុះជាវិជ្ជមាន is rendered in Section 1 (របាយការណ៍វិភាគស្បែកមុខ), not in positive_habits (អ្វីដែលបងប្អូនគួរបន្តធ្វើ)
  }

  // Finding: Inflammation Level
  if (inflammation_level === 'high') {
    findings.push({
      id: 'finding_inflammation_high',
      category: 'inflammation',
      titleKm: 'មានវត្តមានមុនធំ ក្រហម ហើម ឬឈឺច្រើន (លើសពី ៥ គ្រាប់)',
      evidenceKm: 'ចម្លើយសំណួរទី ២៖ មានមុនធំក្រហមហើមលើសពី ៥ គ្រាប់',
      importanceReasonKm:
        'ស្បែកកំពុងស្ថិតក្នុងដំណាក់កាលរលាកខ្លាំង មិនត្រូវប្រើផលិតផលអាស៊ីតខ្លាំង ឬខាត់ស្បែកឡើយ ព្រោះអាចធ្វើឱ្យរលាកកាន់តែរាលដាល។',
      priorityLevel: 'HIGH_ATTENTION',
    });
  } else if (inflammation_level === 'moderate') {
    findings.push({
      id: 'finding_inflammation_moderate',
      category: 'inflammation',
      titleKm: 'មានមុនរលាកក្រហមអមជាមួយមុនកប់ (៣–៥ គ្រាប់)',
      evidenceKm: 'ចម្លើយសំណួរទី ២៖ មានមុនក្រហម ៣–៥ គ្រាប់',
      importanceReasonKm:
        'មុនកប់មួយចំនួនបានវិវត្តទៅជារលាក ត្រូវការការសម្រាលស្បែក (Calming) និងការប្រុងប្រយ័ត្នចៀសវាងការឆ្លងមេរោគ។',
      priorityLevel: 'MEDIUM_ATTENTION',
    });
  }

  // Finding: Product Change
  if (product_change_factor === 'high') {
    findings.push({
      id: 'finding_product_change_high',
      category: 'product_change',
      titleKm: 'ការចាប់ផ្តើមប្រើផលិតផលថ្មី និងការកើនឡើងនៃមុនកប់ កើតឡើងក្នុងរយៈពេលប្រហាក់ប្រហែលគ្នា',
      evidenceKm: `ចម្លើយសំណួរទី ៧៖ បានប្តូរ/បន្ថែមផលិតផលថ្មី ${answers.q7_new_products === '1_product' ? '១ មុខ' : '២ មុខ ឬច្រើនជាង'} និងសំណួរទី ១៤ បានសង្កេតឃើញមុនកើនឡើងក្រោយប្រើផលិតផលថ្មី`,
      importanceReasonKm:
        'ការចាប់ផ្តើមប្រើផលិតផលថ្មី និងការកើនឡើងនៃមុនកប់ កើតឡើងក្នុងរយៈពេលប្រហាក់ប្រហែលគ្នា។ ដូច្នេះ ផលិតផលថ្មីគឺជាកត្តាមួយដែលគួរសង្កេត និងពិនិត្យបន្ថែម។',
      priorityLevel: 'HIGH_ATTENTION',
    });
  } else if (product_change_factor === 'medium') {
    findings.push({
      id: 'finding_product_change_medium',
      category: 'product_change',
      titleKm: 'មានការផ្លាស់ប្តូរផលិតផលថែស្បែកក្នុងរយៈពេល ១ ខែចុងក្រោយ',
      evidenceKm: `ចម្លើយសំណួរទី ៧៖ មានការប្រើផលិតផលថ្មី`,
      importanceReasonKm:
        'ស្បែកមុខត្រូវការពេលវេលាដើម្បីសម្របខ្លួន ការប្តូរផលិតផលថ្មីអាចជាកត្តារួមចំណែកដល់ការប្រែប្រួលនៃរន្ធញើស។',
      priorityLevel: 'MONITOR',
    });
  } else if (answers.q7_new_products === 'none') {
    positive_habits.push({
      id: 'habit_stable_products',
      titleKm: 'រក្សាការប្រើប្រាស់ផលិតផលថែស្បែកមានស្ថិរភាព (មិនប្តូរញឹកញាប់)',
      descriptionKm: 'ការមិនផ្លាស់ប្តូរផលិតផលញឹកញាប់ ជួយកាត់បន្ថយហានិភ័យនៃការប្រតិកម្ម និងធ្វើឱ្យស្បែកមានតុល្យភាព។',
    });
  }

  // Finding: Cleansing / Irritation
  if (cleansing_irritation_factor === 'high') {
    findings.push({
      id: 'finding_cleansing_irritation_high',
      category: 'cleansing_irritation',
      titleKm: 'ការសម្អាតមុខអាចញឹកញាប់ ឬខ្លាំងពេកសម្រាប់ស្បែកបច្ចុប្បន្ន',
      evidenceKm: `ចម្លើយសំណួរទី ១១៖ លាងមុខ ${answers.q11_wash_freq === 'three_times' ? '៣ ដង' : 'លើសពី ៣ ដង'} ក្នុងមួយថ្ងៃ និងសំណួរទី ១២៖ ស្បែកមានអារម្មណ៍ ${answers.q12_post_wash_feeling === 'very_tight_dry' ? 'តឹង និងស្ងួតខ្លាំង' : answers.q12_post_wash_feeling === 'dry_flaking' ? 'ស្ងួតរបក' : 'ក្រហមចាក់ៗ'}`,
      importanceReasonKm:
        'មានសញ្ញាដែលអាចបង្ហាញថា ស្បែកកំពុងរងការរំខាន។ ការលាងមុខច្រើនដងពេកអាចធ្វើឱ្យស្បែកបាត់បង់ជាតិសំណើម និងជំរុញឱ្យក្រពេញខ្លាញ់បញ្ចេញប្រេងមកប៉ះប៉ូវរហូតដល់កកស្ទះកាន់តែខ្លាំង។',
      priorityLevel: 'HIGH_ATTENTION',
    });
  } else if (cleansing_irritation_factor === 'medium') {
    findings.push({
      id: 'finding_cleansing_irritation_medium',
      category: 'cleansing_irritation',
      titleKm: 'មានសញ្ញាតឹងស្បែក ឬបាត់បង់សំណើមស្រាលក្រោយពេលលាងមុខ',
      evidenceKm: `ចម្លើយសំណួរទី ១២៖ ស្បែកមានអារម្មណ៍ ${answers.q12_post_wash_feeling === 'slightly_tight' ? 'តឹងបន្តិច' : 'ចាប់ផ្តើមខ្លាញ់លឿន'}`,
      importanceReasonKm:
        'ភាពតឹងក្រោយពេលលាងបង្ហាញថាសាប៊ូ ឬហ្វូមលាងមុខអាចមានកម្រិតសម្អាតជ្រៅពេក គួរបន្ថែមសំណើមឱ្យបានគ្រប់គ្រាន់។',
      priorityLevel: 'MONITOR',
    });
  } else if (cleansing_irritation_factor === 'low') {
    positive_habits.push({
      id: 'habit_gentle_cleansing',
      titleKm: 'ទម្លាប់លាងមុខបច្ចុប្បន្នមិនបង្ហាញសញ្ញារំខានច្បាស់លាស់ទេ',
      descriptionKm: 'ការលាងមុខ ១–២ ដងក្នុងមួយថ្ងៃ និងស្បែកមានអារម្មណ៍ធម្មតាស្រួល គឺជាទម្លាប់ត្រឹមត្រូវដែលគួររក្សាទុក។',
    });
  }

  // Finding: Active Products
  if (active_product_factor === 'high') {
    findings.push({
      id: 'finding_active_products_high',
      category: 'active_products',
      titleKm: 'ការប្រើ Active Products ច្រើនប្រភេទរួមគ្នា អាចខ្លាំងពេកសម្រាប់ស្បែកបច្ចុប្បន្ន',
      evidenceKm: `ចម្លើយសំណួរទី ៨៖ កំពុងប្រើប្រាស់សារធាតុសកម្មច្រើនមុខ (AHA/BHA, Retinol, Scrub, Acne Treatment) អមដោយសញ្ញាតឹង/ផ្សាក្នុងសំណួរទី ១២`,
      importanceReasonKm:
        'មានសញ្ញាដែលអាចបង្ហាញថា ស្បែកកំពុងរងការរំខាន។ ការប្រើប្រាស់សារធាតុជំរុះកោសិកាច្រើនមុខក្នុងពេលតែមួយ អាចធ្វើឱ្យស្បែកចុះខ្សោយ និងងាយឡើងមុនកប់។',
      priorityLevel: 'HIGH_ATTENTION',
    });
  } else if (active_product_factor === 'medium') {
    findings.push({
      id: 'finding_active_products_medium',
      category: 'active_products',
      titleKm: 'កំពុងប្រើប្រាស់ផលិតផល Active Products ឬគ្រីមខាត់មុខ',
      evidenceKm: 'ចម្លើយសំណួរទី ៨៖ មានការប្រើ AHA/BHA, Retinol ឬ Scrub ក្នុងទម្លាប់ប្រចាំថ្ងៃ',
      importanceReasonKm:
        'សារធាតុ Active ជួយជម្រុះកោសិកាចាស់ ប៉ុន្តែត្រូវប្រើក្នុងកម្រិត និងភាពញឹកញាប់សមស្រប ដើម្បីកុំឱ្យស្បែកស្ងួតខ្លាំង។',
      priorityLevel: 'MONITOR',
    });
  }

  // Finding: Makeup & Sunscreen Cleansing
  if (makeup_cleansing_factor === 'high') {
    findings.push({
      id: 'finding_makeup_cleansing_high',
      category: 'makeup_cleansing',
      titleKm: 'ការសម្អាត Makeup ឬ Sunscreen មិនទាន់ស្អាតល្អ និងពេលខ្លះគេងទាំងមិនបានលុប',
      evidenceKm: `ចម្លើយសំណួរទី ៩ & ១០៖ Makeup ញឹកញាប់ ហើយពេលខ្លះគេងទាំងមាន Makeup ឬមិនបានលុបស្អាត`,
      importanceReasonKm:
        'សំណល់ម្សៅ Makeup និងកម្ទេចធូលីដែលសេសសល់ពេញមួយយប់ គឺជាកត្តាចម្បងមួយដែលធ្វើឱ្យរន្ធញើសស្ទះ និងបង្កជាមុនកប់យ៉ាងឆាប់រហ័ស។',
      priorityLevel: 'HIGH_ATTENTION',
    });
  } else if (makeup_cleansing_factor === 'medium') {
    findings.push({
      id: 'finding_makeup_cleansing_medium',
      category: 'makeup_cleansing',
      titleKm: 'ការសម្អាតមុខក្រោយ Makeup ឬ Sunscreen មិនទាន់បានទៀងទាត់គ្រប់ជ្រុងជ្រោយ',
      evidenceKm: 'ចម្លើយសំណួរទី ១០៖ ប្រើតែហ្វូមធម្មតា ឬពេលខ្លះភ្លេចលុប Makeup/Sunscreen',
      importanceReasonKm:
        'ហ្វូមលាងមុខតែមួយមុខ មិនអាចលាងជម្រះជាតិប្រេង និងសារធាតុការពារកម្តៅថ្ងៃបានស្អាត ១០០% ទេ គួរអនុវត្ត Double Cleansing។',
      priorityLevel: 'MEDIUM_ATTENTION',
    });
  } else if (makeup_cleansing_factor === 'low') {
    positive_habits.push({
      id: 'habit_good_makeup_cleansing',
      titleKm: 'បងប្អូនមានទម្លាប់សម្អាត Makeup និង Sunscreen បានទៀងទាត់',
      descriptionKm: 'ការ Remove Makeup និងលាងសម្អាតមុខយ៉ាងហ្មត់ចត់រាល់ថ្ងៃ ជួយការពាររន្ធញើសមិនឱ្យកកស្ទះ។',
    });
  }

  // Finding & Positive Habit: Follow-up Q9 (Makeup Remover Feeling)
  const hasMakeupRemoverInRoutine = dailyProds.includes('makeup_remover');
  if (hasMakeupRemoverInRoutine && answers.q8_remover_feeling) {
    if (answers.q8_remover_feeling === 'clean_no_sting') {
      // ជម្រើស "Remover makeup បានស្អាតល្អ មិនក្រហាយភ្នែក"
      // → លទ្ធផល៖ ធម្មតា
      // → មិនបង្ហាញការព្រមានទេ ហើយដាក់ក្នុង "អ្វីដែលបងប្អូនគួរបន្ត (Positive Habits)"៖ វិធី Remove Makeup សមស្រប។
      positive_habits.push({
        id: 'habit_remover_proper',
        titleKm: 'វិធី Remove Makeup សមស្រប',
        descriptionKm:
          'ការ Remove Makeup បានស្អាតល្អ និងមិនធ្វើឱ្យរមាស់ ឬក្រហាយភ្នែក ជួយការពារការកកស្ទះរន្ធញើស និងរក្សាភាពស្រទន់ដល់ស្បែក។',
      });
    } else if (answers.q8_remover_feeling === 'clean_stings_eyes') {
      // ជម្រើស "Remover makeup បានស្អាតល្អ តែក្រហាយភ្នែក"
      // → លទ្ធផល៖ ផលិតផល Remove Makeup ធ្វើឱ្យរមាស់ភ្នែក
      // → អនុសាសន៍៖ ប្តូរទៅប្រើផលិតផល Remove Makeup ស្រទន់បែបធម្មជាតិ គ្មានក្លិន វិញ
      // → ដាក់ក្នុងប្រភេទ "ត្រូវកែសម្រួល" កម្រិតអាទិភាព៖ មធ្យម។
      // → ផលិតផលណែនាំ៖ Lumimei ប្រេងដូង Remove Makeup និងឡេការពារកម្តៅថ្ងៃ (Double Cleanse) ដោយអានតាម Product ID ពីទិន្នន័យផលិតផលរួម។
      findings.push({
        id: 'finding_remover_stings',
        category: 'remover_irritation',
        titleKm: 'ផលិតផល Remove Makeup ធ្វើឱ្យរមាស់ភ្នែក',
        evidenceKm: 'ចម្លើយសំណួរតាមដាន៖ Remover makeup បានស្អាតល្អ តែក្រហាយភ្នែក',
        importanceReasonKm:
          'ផលិតផល Remove Makeup ដែលធ្វើឱ្យក្រហាយភ្នែក អាចមានជាតិកាត់ ឬក្លិនក្រអូបដែលមិនសមស្របនឹងស្បែកប្រតិកម្ម។',
        priorityLevel: 'MEDIUM_ATTENTION', // Priority: Medium / មធ្យម (ត្រូវកែសម្រួល)
      });
    } else if (answers.q8_remover_feeling === 'unclean_residue') {
      // ជម្រើស "Remover makeup មិនបានស្អាតទេ នៅសល់សំណល់ makeup ជាច្រើនទៀត"
      // → លទ្ធផល៖ Remove Makeup មិនស្អាតគ្រប់គ្រាន់
      // → អនុសាសន៍៖ ប្តូរទៅប្រើផលិតផល Remove Makeup ដែលមានប្រសិទ្ធភាពខ្លាំងជាងមុន ឬប្រើវិធីសម្អាតពីរដង (Double Cleanse)។
      // → កម្រិតអាទិភាព៖ ខ្ពស់ (សំណល់ makeup អាចធ្វើឱ្យស្ទះរន្ធញើស និងកើតមុន)។
      // → ផលិតផលណែនាំ៖ Lumimei ប្រេងដូង Remove Makeup និងឡេការពារកម្តៅថ្ងៃ (Double Cleanse) ដោយអានតាម Product ID ពីទិន្នន័យផលិតផលរួម។
      findings.push({
        id: 'finding_remover_residue',
        category: 'remover_residue',
        titleKm: 'Remove Makeup មិនស្អាតគ្រប់គ្រាន់',
        evidenceKm: 'ចម្លើយសំណួរតាមដាន៖ Remover makeup មិនបានស្អាតទេ នៅសល់សំណល់ makeup ជាច្រើនទៀត',
        importanceReasonKm:
          'សំណល់ makeup និងឡេការពារកម្តៅថ្ងៃដែលនៅសល់ក្នុងរន្ធញើស ជាមូលហេតុចម្បងដែលបង្កឱ្យស្ទះរន្ធញើស និងកើតមុន។',
        priorityLevel: 'HIGH_ATTENTION', // Priority: High / ខ្ពស់ (ត្រូវកែសម្រួល)
      });
    }
  }

  // Finding & Positive Habit: សំណួរទី៨. អារម្មណ៍ក្រោយប្រើផលិតផលទាំងនោះរួច
  if (answers.q8_acne_treatment_feeling) {
    const selectedProdsTextKm = (() => {
      const prods = answers.q8_daily_products || [];
      const labelMap: Record<string, string> = {
        makeup_remover: 'Makeup Remover',
        cleanser: 'Cleanser (ហ្វូម/សាប៊ូលាងមុខ)',
        toner: 'Toner (ទឹកជូតមុខ)',
        serum: 'Serum (សេរ៉ូម)',
        moisturizer: 'Moisturizer (ឡេ/គ្រីមផ្ដល់សំណើម)',
        sunscreen: 'Sunscreen (ឡេការពារកម្ដៅថ្ងៃ)',
        aha_bha: 'AHA / BHA',
        retinol: 'Retinol',
        scrub: 'ម៉ាសធម្មជាតិ',
        acne_treatment: 'ផលិតផលព្យាបាលមុន',
        unsure: 'ផលិតផលមិនប្រាកដ',
      };
      const names = prods.map((p) => labelMap[p] || p).filter(Boolean);
      return names.length > 0 ? names.join(', ') : 'ផលិតផលបច្ចុប្បន្ន';
    })();

    if (answers.q8_acne_treatment_feeling === 'effective_comfortable') {
      // ជម្រើស "ព្យាបាលមុនបានល្អ ស្បែកមិនក្រហាយ មិនស្ងួតរបក"
      // → លទ្ធផល៖ ផលិតផលព្យាបាលមុនមានប្រសិទ្ធភាព
      // → ដាក់ក្នុង "អ្វីដែលបងប្អូនគួរបន្ត (Positive Habits to Continue)"៖ បន្តប្រើផលិតផលព្យាបាលមុនបច្ចុប្បន្ន
      // → មិនបង្កើតការព្រមាន ឬអនុសាសន៍ឈប់ប្រើឡើយ
      positive_habits.push({
        id: 'habit_acne_treatment_proper',
        titleKm: 'បន្តប្រើផលិតផលព្យាបាលមុនបច្ចុប្បន្ន',
        descriptionKm:
          'ផលិតផលព្យាបាលមុនដែលបងប្អូនកំពុងប្រើមានប្រសិទ្ធភាពល្អ និងសមស្របនឹងស្បែក ដោយមិនធ្វើឱ្យស្បែកក្រហាយ ឬស្ងួតរបកឡើយ។ បងប្អូនគួរបន្តការប្រើប្រាស់ជាប្រចាំ។',
      });
    } else if (answers.q8_acne_treatment_feeling === 'stings_dry_peeling') {
      // ជម្រើស "ព្យាបាលមុនបានល្អ តែស្បែកក្រហាយ ស្ងួតខ្លាំង ឬរបក"
      // → លទ្ធផល៖ មានប្រសិទ្ធភាពតែបង្កប្រតិកម្មរំខាន
      // → ធ្វើឱ្យកើតច្បាប់ 【ច្បាប់ ១៖ ការព្រមានស្បែករំខាន + ត្រូវបញ្ឈប់ផលិតផលបច្ចុប្បន្ន】ដែលបានកំណត់ពីមុន
      //   - ត្រូវឱ្យអ្នកប្រើឈប់ប្រើផលិតផលព្យាបាលមុនដែលបានជ្រើសក្នុងសំណួរទី៧ (រាយឈ្មោះច្បាស់លាស់)
      //   - ណែនាំប្តូរមកប្រើ Lumimei សេរ៉ូម និង Lumimei ប្រេងដូង ព្រោះអាចជួយទៅផ្តល់សំណើមដល់ស្បែក ជួយពង្រឹងរនាំងការពារស្បែកឲ្យបានរឹងមាំ និងជួយបណ្ដុះកោសិកាថ្មីៗ សាកសមសម្រាប់បងប្អូនដែលមានអារម្មណ៍ថា ស្បែកក្រហាយ ស្ងួត របក ខ្សោយ ខូចរនាំងការពារស្បែក ឬមើលទៅមិនសូវមានជីវិត
      //  - រយៈពេលតាមដានប្តូរទៅ ៥-១៥ ថ្ងៃ បន្ទាប់មកទៀត ណែនាំឱ្យអ្នកប្រើ ចូលទៅ តាមដានវិភាគស្បែកមុខ ដែលមានក្នុងគណនីខ្ញុំ បន្ថែមទៀត
      findings.push({
        id: 'finding_acne_treatment_stings',
        category: 'acne_treatment_barrier',
        titleKm: 'ផលិតផលមានប្រសិទ្ធភាពតែបង្កប្រតិកម្មរំខានស្បែក (ត្រូវបញ្ឈប់ផលិតផលបច្ចុប្បន្ន)',
        evidenceKm: `ចម្លើយសំណួរទី៨៖ ព្យាបាលមុនបានល្អ តែស្បែកក្រហាយ ស្ងួតខ្លាំង ឬរបក (ផលិតផលសំណួរទី៧៖ ${selectedProdsTextKm})`,
        importanceReasonKm:
          `ត្រូវឈប់ប្រើផលិតផលព្យាបាលមុនដែលបានជ្រើសក្នុងសំណួរទី៧ (${selectedProdsTextKm}) ជាបន្ទាន់ ព្រោះផលិតផលកំពុងបង្កឱ្យស្បែកក្រហាយ ស្ងួតខ្លាំង ឬរបក និងរំខានដល់របាំងការពារស្បែក។`,
        priorityLevel: 'HIGH_ATTENTION',
      });
    } else if (answers.q8_acne_treatment_feeling === 'ineffective') {
      // ជម្រើស "ប្រើហើយមិនឃើញប្រសិទ្ធភាព"
      // → លទ្ធផល៖ ផលមិនច្បាស់លាស់
      // → គួរតែឱ្យអ្នកប្រើឈប់ប្រើផលិតផលព្យាបាលមុនដែលបានជ្រើសក្នុងសំណួរទី៧ (រាយឈ្មោះច្បាស់លាស់)
      findings.push({
        id: 'finding_acne_treatment_ineffective',
        category: 'acne_treatment_ineffective',
        titleKm: 'ផលិតផលព្យាបាលមុនផលមិនច្បាស់លាស់ (ប្រើហើយមិនឃើញប្រសិទ្ធភាព)',
        evidenceKm: `ចម្លើយសំណួរទី៨៖ ប្រើហើយមិនឃើញប្រសិទ្ធភាព (ផលិតផលសំណួរទី៧៖ ${selectedProdsTextKm})`,
        importanceReasonKm:
          `គួរតែឱ្យអ្នកប្រើឈប់ប្រើផលិតផលព្យាបាលមុនដែលបានជ្រើសក្នុងសំណួរទី៧ (${selectedProdsTextKm}) ព្រោះផលិតផលបច្ចុប្បន្នមិនទាន់ឃើញប្រសិទ្ធភាពច្បាស់លាស់។`,
        priorityLevel: 'HIGH_ATTENTION',
      });
    } else if (
      answers.q8_acne_treatment_feeling === 'acne_increased' ||
      answers.q8_acne_treatment_feeling === 'ineffective_or_worse'
    ) {
      // ជម្រើស "ឬមុនកើនឡើងលើសដើម"
      // → លទ្ធផល៖ ផលិតផលប្រហែលជាមិនសមស្រប ឬវិធីប្រើមិនត្រឹមត្រូវ
      // - ត្រូវឱ្យអ្នកប្រើឈប់ប្រើផលិតផលព្យាបាលមុនដែលបានជ្រើសក្នុងសំណួរទី៧ (រាយឈ្មោះច្បាស់លាស់)
      findings.push({
        id: 'finding_acne_treatment_worse',
        category: 'acne_treatment_ineffective',
        titleKm: 'ផលិតផលប្រហែលជាមិនសមស្រប ឬវិធីប្រើមិនត្រឹមត្រូវ (មុនកើនឡើងលើសដើម)',
        evidenceKm: `ចម្លើយសំណួរទី៨៖ ឬមុនកើនឡើងលើសដើម (ផលិតផលសំណួរទី៧៖ ${selectedProdsTextKm})`,
        importanceReasonKm:
          `ត្រូវឱ្យអ្នកប្រើឈប់ប្រើផលិតផលព្យាបាលមុនដែលបានជ្រើសក្នុងសំណួរទី៧ (${selectedProdsTextKm}) ជាបន្ទាន់ ព្រោះផលិតផលប្រហែលជាមិនសមស្រប ឬវិធីប្រើមិនត្រឹមត្រូវ ដែលបណ្តាលឱ្យមុនកើនឡើងលើសដើម។`,
        priorityLevel: 'HIGH_ATTENTION',
      });
    } else if (answers.q8_acne_treatment_feeling === 'itchy_rash_burn') {
      findings.push({
        id: 'finding_acne_treatment_itchy_rash',
        category: 'acne_treatment_barrier',
        titleKm: 'ផលិតផលបង្កឱ្យរមាស់ រោល រលាក ឬក្រហាយ (ត្រូវបញ្ឈប់ផលិតផលបច្ចុប្បន្ន)',
        evidenceKm: `ចម្លើយសំណួរទី៨៖ រមាស់ / រោល / រលាក / ក្រហាយ (ផលិតផលសំណួរទី៧៖ ${selectedProdsTextKm})`,
        importanceReasonKm:
          `ត្រូវឈប់ប្រើផលិតផលដែលបានជ្រើសក្នុងសំណួរទី៧ (${selectedProdsTextKm}) ជាបន្ទាន់ ព្រោះផលិតផលកំពុងបង្កឱ្យស្បែករមាស់ រោល រលាក ឬក្រហាយ និងខូចខាតរបាំងការពារស្បែក។`,
        priorityLevel: 'HIGH_ATTENTION',
      });
    }
  }

  // Finding: Picking Habit
  if (picking_factor === 'high') {
    const isInflamed = inflammation_level === 'moderate' || inflammation_level === 'high';
    findings.push({
      id: 'finding_picking_high',
      category: 'picking',
      titleKm: 'ទម្លាប់ញិច កេះ ឬច្របាច់មុនកប់អាចរំខានដល់ស្បែក និងបង្កើនហានិភ័យនៃការរលាក',
      evidenceKm: `ចម្លើយសំណួរទី ១៣៖ មានទម្លាប់ញិចកេះមុន ${answers.q13_picking_habit === 'self_frequent' ? 'ដោយខ្លួនឯងជាញឹកញាប់' : 'ញឹកញាប់'}`,
      importanceReasonKm: isInflamed
        ? 'ដោយសារបច្ចុប្បន្នស្បែកមានមុនរលាកក្រហមរួចទៅហើយ ការញិចកេះនឹងរុញមេរោគចូលជ្រៅក្នុងរន្ធញើស និងបង្កឱ្យមានស្នាមជាំ ឬស្នាមខូងយូរអង្វែង។'
        : 'ការញិចមុនកប់ដែលគ្មានក្បាលច្បាស់លាស់ មិនត្រឹមតែមិនចេញនោះទេ ថែមទាំងធ្វើឱ្យជាលិកាស្បែកជុំវិញរងរបួស និងប្រែជាមុនរលាកធំៗ។',
      priorityLevel: 'HIGH_ATTENTION',
    });
  } else if (picking_factor === 'medium') {
    findings.push({
      id: 'finding_picking_medium',
      category: 'picking',
      titleKm: 'មានការញិច ឬកេះមុនម្តងម្កាល ឬទៅហាង Beauty Salon ញិច',
      evidenceKm: `ចម្លើយសំណួរទី ១៣៖ ${answers.q13_picking_habit === 'salon_cleaning' ? 'ទៅហាងសម្អាត/ញិច' : 'ម្តងម្កាលញិចមុន'}`,
      importanceReasonKm:
        'ការញិចដោយគ្មានអនាម័យត្រឹមត្រូវ ឬការសង្កត់ខ្លាំងលើស្បែក អាចជំរុញឱ្យកើតមុនក្រហមបន្ថែម។',
      priorityLevel: 'MONITOR',
    });
  } else if (picking_factor === 'low') {
    positive_habits.push({
      id: 'habit_no_picking',
      titleKm: 'មិនធ្លាប់ញិច កេះ ឬច្របាច់មុនកប់',
      descriptionKm: 'ការមិនញិចមុនគឺជាទម្លាប់ដ៏ល្អបំផុតក្នុងការការពារកុំឱ្យមុនកប់ប្រែជារលាក និងការពារស្នាមមុន។',
    });
  }

  // Finding: Observed Patterns (Personalized Trigger Recognition)
  if (observed_patterns.length > 0) {
    findings.push({
      id: 'finding_observed_patterns',
      category: 'observed_pattern',
      titleKm: `កត្តាជំរុញដែលបងប្អូនសង្កេតឃើញផ្ទាល់៖ ${observed_patterns.join(', ')}`,
      evidenceKm: `ចម្លើយសំណួរទី ១៤៖ សង្កេតឃើញមុនកើនឡើងនៅពេល៖ ${observed_patterns.join(', ')}`,
      importanceReasonKm:
        'ចំណុចទាំងនេះជាគន្លឹះសំខាន់ដែលជួយយើងយល់ដឹងពីឥរិយាបថស្បែកផ្ទាល់ខ្លួន ដើម្បីកែតម្រូវទម្លាប់រស់នៅ និងការថែទាំឱ្យចំពេល។',
      priorityLevel: 'MONITOR',
    });
  }

  // Finding: Safety / Warning Signs
  if (professional_review_flag) {
    findings.push({
      id: 'finding_safety_professional_review',
      category: 'safety',
      titleKm: 'មានសញ្ញាស្បែកមួយចំនួនដែលគួរយកចិត្តទុកដាក់ និងវាយតម្លៃបន្ថែម',
      evidenceKm: 'ចម្លើយសំណួរទី ២ ឬ ១៥៖ មានមុនរលាកច្រើន ឬមានសញ្ញាស្បែកក្រហម រមាស់ខ្លាំង និងស្នាមច្បាស់',
      importanceReasonKm:
        'តាមព័ត៌មានដែលបងប្អូនបានផ្តល់ បច្ចុប្បន្នមិនមែនមានតែមុនកប់ប៉ុណ្ណោះទេ។ មានសញ្ញាមួយចំនួនដែលគួរត្រូវបានវាយតម្លៃបន្ថែម។ Lumimei ណែនាំឲ្យបងប្អូនពិចារណាពិគ្រោះជាមួយអ្នកជំនាញស្បែក មុននឹងបន្ថែមផលិតផល Active ថ្មីៗ។',
      priorityLevel: 'HIGH_ATTENTION',
    });
  }

  // Add additional positive habits if present
  if (dailyProds.includes('sunscreen')) {
    positive_habits.push({
      id: 'habit_sunscreen',
      titleKm: 'ប្រើប្រាស់ឡេការពារកម្ដៅថ្ងៃ (Sunscreen) ជាប្រចាំ',
      descriptionKm: 'ការការពារស្បែកពីកាំរស្មី UV ជួយទប់ស្កាត់ការឡើងកម្តៅស្បែក និងការពារស្នាមអុជខ្មៅ។',
    });
  }
  if (dailyProds.includes('moisturizer')) {
    positive_habits.push({
      id: 'habit_moisturizer',
      titleKm: 'មានការផ្តល់សំណើមដោយ Moisturizer ជាប្រចាំ',
      descriptionKm: 'សំណើមគ្រប់គ្រាន់ជួយឱ្យស្បែកទន់ រន្ធញើសដំណើរការបញ្ចេញជាតិខ្លាញ់បានស្រួល និងកាត់បន្ថយការកកស្ទះ។',
    });
  }

  // If no negative findings, provide gentle positive affirmation
  if (findings.length === 0) {
    positive_habits.push({
      id: 'habit_all_good',
      titleKm: 'ទម្លាប់ថែទាំស្បែកបច្ចុប្បន្នមានតុល្យភាពល្អណាស់',
      descriptionKm:
        'Lumimei មិនបានសង្កេតឃើញទម្លាប់ណាមួយដែលត្រូវកែប្រែជាបន្ទាន់ទេ។ អាទិភាពគឺបន្តរក្សាទម្លាប់បច្ចុប្បន្ន និងតាមដានការប្រែប្រួលរបស់ស្បែក។',
    });
  }

  // ==========================================================================
  // 6. PRIORITIES RANKING (Guide order of action without hiding findings)
  // ==========================================================================

  function getPriorityEvidenceAndReason(
    f: ComedoneFinding,
    ans: ClosedComedonesAnswers
  ): { titleKm: string; evidencePointsKm: string[]; reasonKm: string; actionKm: string } {
    const q8 = ans.q8_daily_products || [];
    const activeLabelsMap: Record<string, string> = {
      aha_bha: 'AHA/BHA',
      retinol: 'Retinol',
      scrub: 'Scrub (ខាត់មុខ)',
      acne_treatment: 'ផលិតផលព្យាបាលមុន',
    };
    const usedActives = q8
      .filter((p) => ['aha_bha', 'retinol', 'scrub', 'acne_treatment'].includes(p))
      .map((p) => activeLabelsMap[p] || p);

    const washMap: Record<string, string> = {
      once: '១ ដងក្នុងមួយថ្ងៃ',
      twice: '២ ដងក្នុងមួយថ្ងៃ',
      three_times: '៣ ដងក្នុងមួយថ្ងៃ',
      more_than_three: 'លើសពី ៣ ដងក្នុងមួយថ្ងៃ',
      irregular: 'មិនទៀងទាត់',
    };

    const postWashMap: Record<string, string> = {
      normal_comfortable: 'ធម្មតា និងស្រួល',
      slightly_tight: 'តឹងបន្តិច',
      very_tight_dry: 'តឹង និងស្ងួតខ្លាំង',
      dry_flaking: 'ស្ងួត ឬរបក',
      red_stinging: 'ក្រហម ឬចាក់ៗ',
      gets_oily_fast: 'ឆាប់ចេញជាតិខ្លាញ់លឿន',
    };

    const makeupFreqMap: Record<string, string> = {
      daily: 'ស្ទើរតែរាល់ថ្ងៃ',
      '3_to_5_weekly': '៣–៥ ដងក្នុងមួយសប្ដាហ៍',
      '1_to_2_weekly': '១–២ ដងក្នុងមួយសប្ដាហ៍',
      occasional: 'ម្តងម្កាល',
      none: 'មិន Makeup',
    };

    const areaMap: Record<string, string> = {
      forehead: 'ថ្ងាស',
      nose: 'ច្រមុះ',
      cheeks: 'ថ្ពាល់',
      chin: 'ចង្កា',
      jawline: 'តាមបន្ទាត់ថ្គាម',
      almost_full_face: 'ស្ទើរតែពេញផ្ទៃមុខ',
    };

    const triggerMap: Record<string, string> = {
      after_new_product: 'ក្រោយប្រើផលិតផលថ្មី',
      after_makeup: 'ក្រោយ Makeup',
      late_sleep: 'ក្រោយគេងយប់ជ្រៅ',
      stress: 'ពេលមាន Stress',
      period: 'មុន ឬអំឡុងពេលមករដូវ',
      hot_sweat: 'ពេលអាកាសធាតុក្តៅ ឬបែកញើស',
      mask: 'ក្រោយពាក់ម៉ាស់យូរ',
    };

    const warningMap: Record<string, string> = {
      large_cystic_painful: 'មានមុនធំៗ ក្រហម ហើម ឬឈឺច្រើន',
      many_bumps_itchy: 'មានគ្រាប់តូចៗច្រើន និងរមាស់ខ្លាំង',
      red_burning_pain: 'ស្បែកក្រហម រមាស់ ឬឈឺខ្លាំង',
      rapid_escalation: 'មុនកើនឡើងលឿន',
      clear_scars_forming: 'ចាប់ផ្តើមមានស្នាមមុនច្បាស់',
      comedones_inflaming: 'មុនកប់ប្រែជារលាកញឹកញាប់',
    };

    if (f.category === 'cleansing_irritation') {
      const evidence: string[] = [];
      if (ans.q11_wash_freq) {
        evidence.push(`លាងមុខ ${washMap[ans.q11_wash_freq] || 'ជាប្រចាំ'}`);
      }
      if (ans.q12_post_wash_feeling && ans.q12_post_wash_feeling !== 'normal_comfortable') {
        evidence.push(`ស្បែកមានអារម្មណ៍${postWashMap[ans.q12_post_wash_feeling]}បន្ទាប់ពីលាងមុខ`);
      }
      if (usedActives.length > 0) {
        evidence.push(`បច្ចុប្បន្នកំពុងប្រើ ${usedActives.join(', ')}`);
      }
      if (evidence.length === 0) {
        evidence.push('ស្បែកមានអារម្មណ៍តឹង និងស្ងួតបន្ទាប់ពីលាងមុខ');
      }

      return {
        titleKm: 'ការលាងមុខអាចញឹកញាប់ពេក',
        evidencePointsKm: evidence,
        reasonKm:
          'ការលាងមុខញឹកញាប់ រួមជាមួយអារម្មណ៍តឹង និងស្ងួត អាចបង្ហាញថា ស្បែកកំពុងទទួលការរំខានច្រើនពេក។',
        actionKm: 'កាត់បន្ថយការលាងមុខមកត្រឹម ២ ដងក្នុងមួយថ្ងៃ និងប្តូរមកប្រើហ្វូមទន់ភ្លន់។',
      };
    }

    if (f.category === 'product_change') {
      const evidence: string[] = [];
      evidence.push(
        ans.q7_new_products === '1_product'
          ? 'ក្នុង 1 ខែចុងក្រោយ បានប្តូរផលិតផលថ្មី 1 មុខ'
          : 'ក្នុង 1 ខែចុងក្រោយ បានប្តូរផលិតផលថ្មី'
      );
      if (
        ans.q6_trend === 'large_increase' ||
        ans.q6_trend === 'slight_increase' ||
        ans.q6_trend === 'rapid_spike'
      ) {
        evidence.push('មុនកប់កើនឡើងក្នុងរយៈពេលដូចគ្នា');
      }
      if ((ans.q14_aggravating_factors || []).includes('after_new_product')) {
        evidence.push('បងប្អូនសង្កេតឃើញថា មុនកប់កើនឡើងបន្ទាប់ពីប្រើផលិតផលថ្មី');
      }

      return {
        titleKm: 'ការផ្លាស់ប្តូរផលិតផលថ្មីគួរត្រូវបានសង្កេត',
        evidencePointsKm: evidence,
        reasonKm:
          'ការកើនឡើងនៃមុនកប់កើតឡើងស្របពេលនឹងការប្រើផលិតផលថ្មី ដូច្នេះផលិតផលថ្មីអាចជាកត្តាមួយដែលគួរយកចិត្តទុកដាក់។',
        actionKm: 'ផ្អាក ឬពិនិត្យតាមដានផលិតផលថ្មីដែលទើបចាប់ផ្តើមប្រើឡើងវិញ។',
      };
    }

    if (f.category === 'picking') {
      const evidence: string[] = [];
      evidence.push(
        ans.q13_picking_habit === 'salon_cleaning'
          ? 'ធ្លាប់ទៅហាង ឬ Beauty Salon ឱ្យគេជួយសម្អាត ឬញិចមុន'
          : ans.q13_picking_habit === 'self_frequent'
          ? 'មានទម្លាប់ញិច ឬកេះមុនកប់ដោយខ្លួនឯងជាញឹកញាប់'
          : 'មានទម្លាប់ញិច ឬកេះមុនកប់ញឹកញាប់'
      );
      if (ans.q2_inflammatory_count && ans.q2_inflammatory_count !== 'none') {
        evidence.push('មានវត្តមានមុនធំ ក្រហម ឬឈឺអមនៅលើផ្ទៃមុខ');
      }
      if ((ans.q15_warning_signs || []).includes('clear_scars_forming')) {
        evidence.push('ចាប់ផ្តើមមានស្នាមមុនច្បាស់នៅលើផ្ទៃមុខ');
      }

      return {
        titleKm: 'ទម្លាប់ញិច ឬកេះមុនកប់គួរត្រូវបានកត់សម្គាល់',
        evidencePointsKm: evidence,
        reasonKm:
          'ការញិច ឬកេះមុនកប់ដោយក្រចកដៃ អាចជាកត្តាជំរុញឱ្យការកកស្ទះប្រែជារលាកក្រហម និងអាចបង្កើនហានិភ័យស្នាម ដែលគួរសង្កេតបន្ថែម។',
        actionKm: 'បញ្ឈប់ការញិច ឬកេះមុនដោយដៃជាបន្ទាន់ ដើម្បីការពារការរលាករាលដាល។',
      };
    }

    if (f.category === 'active_products') {
      const evidence: string[] = [];
      if (usedActives.length > 0) {
        evidence.push(`បច្ចុប្បន្នកំពុងប្រើ ${usedActives.join(', ')} ក្នុងទម្លាប់ប្រចាំថ្ងៃ`);
      } else {
        evidence.push('កំពុងប្រើប្រាស់ផលិតផល Active Products ក្នុងទម្លាប់ថែស្បែក');
      }
      if (ans.q12_post_wash_feeling && ans.q12_post_wash_feeling !== 'normal_comfortable') {
        evidence.push(`ស្បែកមានអារម្មណ៍${postWashMap[ans.q12_post_wash_feeling]}ក្រោយពេលលាងមុខ`);
      }

      return {
        titleKm: 'ការរួមបញ្ចូល Active Products ច្រើនមុខគួរត្រូវបានតាមដាន',
        evidencePointsKm: evidence,
        reasonKm:
          'ការប្រើប្រាស់សារធាតុជម្រុះកោសិកាច្រើនមុខក្នុងពេលតែមួយ អាចបង្ហាញថាស្បែកកំពុងរងការរំខាន និងអាចជាកត្តាមួយដែលគួរយកចិត្តទុកដាក់។',
        actionKm: 'ផ្អាកការប្រើ Active Products ច្រើនមុខក្នុងពេលតែមួយ ហើយផ្តោតលើការផ្តល់សំណើម។',
      };
    }

    if (f.category === 'makeup_cleansing') {
      const evidence: string[] = [];
      if (ans.q9_makeup_freq && ans.q9_makeup_freq !== 'none') {
        evidence.push(`Makeup ${makeupFreqMap[ans.q9_makeup_freq]}`);
      }
      if (ans.q10_cleansing_routine === 'cleanser_only') {
        evidence.push('ប្រើតែហ្វូមលាងមុខ ដោយមិនបានប្រើផលិតផលលុប Makeup/Sunscreen ឡើយ');
      } else if (ans.q10_cleansing_routine === 'sometimes_forget') {
        evidence.push('ពេលខ្លះភ្លេចសម្អាតមុខ ឬលុប Makeup មុនចូលគេង');
      } else if (ans.q10_cleansing_routine === 'sometimes_sleep_with_makeup') {
        evidence.push('ពេលខ្លះគេងទាំងមាន Makeup នៅលើផ្ទៃមុខ');
      } else if (ans.q10_cleansing_routine === 'unsure') {
        evidence.push('មិនទាន់ប្រាកដថាសម្អាតស្បែកបានស្អាតល្អឬអត់ឡើយ');
      }
      if ((ans.q14_aggravating_factors || []).includes('after_makeup')) {
        evidence.push('បងប្អូនសង្កេតឃើញថា មុនកប់កើនឡើងបន្ទាប់ពី Makeup');
      }

      return {
        titleKm: 'ការសម្អាត Makeup ឬ Sunscreen គួរយកចិត្តទុកដាក់បន្ថែម',
        evidencePointsKm: evidence,
        reasonKm:
          'សំណល់ម្សៅ Makeup ឬឡេការពារកម្តៅថ្ងៃដែលលាងមិនបានស្អាតល្អ អាចពាក់ព័ន្ធនឹងការកកស្ទះនៅក្នុងរន្ធញើស និងជាកត្តាមួយដែលគួរយកចិត្តទុកដាក់។',
        actionKm: 'អនុវត្ត Double Cleansing ឱ្យបានទៀងទាត់ និងមិនត្រូវគេងទាំងមាន Makeup ឡើយ។',
      };
    }

    if (f.category === 'safety') {
      const evidence: string[] = [];
      if (ans.q2_inflammatory_count === 'more_than_5') {
        evidence.push('មានមុនធំ ក្រហម ហើម ឬឈឺច្រើនលើសពី ៥ គ្រាប់');
      }
      const q15Signs = (ans.q15_warning_signs || [])
        .filter((s) => s !== 'none_of_above')
        .map((s) => warningMap[s] || s);
      if (q15Signs.length > 0) {
        evidence.push(`មានសញ្ញាស្បែក៖ ${q15Signs.join(', ')}`);
      }
      if (evidence.length === 0) {
        evidence.push('មានសញ្ញាស្បែករលាក ឬកើនឡើងលឿនដែលគួរប្រុងប្រយ័ត្ន');
      }

      return {
        titleKm: 'មានសញ្ញាស្បែកមួយចំនួនដែលគួរយកចិត្តទុកដាក់បន្ថែម',
        evidencePointsKm: evidence,
        reasonKm:
          'វត្តមានមុនរលាក ឬសញ្ញារមាស់ក្រហមខ្លាំង អាចបង្ហាញពីស្ថានភាពរលាកលើសពីកម្រិតមុនកប់ធម្មតា ដែលជាកត្តាមួយគួរយកចិត្តទុកដាក់ និងគួរសង្កេតបន្ថែម។',
        actionKm: 'ពិចារណាពិគ្រោះជាមួយអ្នកជំនាញស្បែក មុននឹងបន្ថែមផលិតផល Active ថ្មីៗ។',
      };
    }

    if (f.category === 'comedone_count') {
      const evidence: string[] = [];
      evidence.push(
        ans.q5_amount === 'more_than_50'
          ? 'បច្ចុប្បន្នមានមុនកប់ច្រើនលើសពី ៥០ គ្រាប់'
          : 'បច្ចុប្បន្នមានមុនកប់បរិមាណច្រើនពិបាកប៉ាន់ស្មាន'
      );
      const areas = (ans.q4_areas || []).map((a) => areaMap[a] || a);
      if (areas.length > 0) {
        evidence.push(`កើតមានភាគច្រើននៅតំបន់${areas.join(', ')}`);
      }

      return {
        titleKm: 'ដង់ស៊ីតេ និងចំនួនមុនកប់មានកម្រិតច្រើន',
        evidencePointsKm: evidence,
        reasonKm:
          'បរិមាណមុនកប់ច្រើន និងក្រាស់ អាចបង្ហាញពីការកកស្ទះដែលបានកកើតឡើងជាប់ៗគ្នា ដែលជាកត្តាមួយគួរយកចិត្តទុកដាក់ និងគួរសង្កេតបន្ថែម។',
        actionKm: 'រក្សាភាពអត់ធ្មត់ក្នុងការថែទាំ ព្រោះមុនកប់ក្រាស់ត្រូវការពេលវេលាដើម្បីសម្រាលរន្ធញើស។',
      };
    }

    if (f.category === 'trend') {
      const evidence: string[] = [];
      evidence.push(
        ans.q6_trend === 'rapid_spike'
          ? 'ក្នុងរយៈពេល ១ ខែចុងក្រោយ មុនកប់កើតឡើងភ្លាមៗច្រើនក្នុងរយៈពេលខ្លី'
          : 'ក្នុងរយៈពេល ១ ខែចុងក្រោយ មុនកប់មានការកើនឡើងច្រើន'
      );
      if (ans.q3_duration === 'less_than_1m' || ans.q3_duration === '1_to_3m') {
        evidence.push('មុនកប់ទើបតែកើតមានក្នុងរយៈពេលថ្មីៗ');
      }

      return {
        titleKm: 'ការកើនឡើងនៃមុនកប់ក្នុងរយៈពេលខ្លីគួរត្រូវបានសង្កេត',
        evidencePointsKm: evidence,
        reasonKm:
          'ការកើនឡើងលឿនក្នុងរយៈពេលខ្លី អាចពាក់ព័ន្ធនឹងបម្រែបម្រួលផលិតផល ឬកត្តារំខានថ្មីៗ ដែលជាកត្តាមួយគួរយកចិត្តទុកដាក់ និងគួរសង្កេតបន្ថែម។',
        actionKm: 'តាមដានការវិវត្តរបស់ស្បែក និងចៀសវាងការសាកល្បងផលិតផលច្រើនមុខ។',
      };
    }

    if (f.category === 'duration') {
      const evidence: string[] = [];
      evidence.push(
        ans.q3_duration === 'recurrent'
          ? 'មុនកប់កើតហើយបាត់ ហើយកើតឡើងវិញញឹកញាប់'
          : ans.q3_duration === 'more_than_1y'
          ? 'មុនកប់បានកើតមានរ៉ាំរ៉ៃលើសពី ១ ឆ្នាំមកហើយ'
          : 'មុនកប់បានកើតមានបន្តរយៈពេល ៦–១២ ខែ'
      );

      return {
        titleKm: 'មុនកប់ដែលបន្តកើតមានរយៈពេលយូរ ឬកើតឡើងវិញញឹកញាប់',
        evidencePointsKm: evidence,
        reasonKm:
          'ការកកស្ទះដែលនៅបន្តយូរអង្វែង អាចបង្ហាញថាកត្តារួមផ្សំក្នុងទម្លាប់ប្រចាំថ្ងៃនៅតែមានវត្តមាន ដូច្នេះជាកត្តាមួយដែលគួរយកចិត្តទុកដាក់។',
        actionKm: 'រក្សាភាពអត់ធ្មត់ក្នុងការថែទាំ ព្រោះមុនកប់រ៉ាំរ៉ៃត្រូវការពេល ២–៨ សប្តាហ៍ដើម្បីធូរស្បើយ។',
      };
    }

    if (f.category === 'observed_pattern') {
      const patternLabels = (ans.q14_aggravating_factors || [])
        .filter((t) => t !== 'no_clear_reason' && t !== 'unsure')
        .map((t) => triggerMap[t] || t);
      const evidence: string[] = [];
      if (patternLabels.length > 0) {
        evidence.push(`បងប្អូនសង្កេតឃើញមុនកប់កើនឡើងពេល៖ ${patternLabels.join(', ')}`);
      } else {
        evidence.push('មានកត្តាជំរុញផ្ទាល់ខ្លួនដែលសង្កេតឃើញពេលមុនកប់កើនឡើង');
      }

      return {
        titleKm: 'កត្តាជំរុញផ្ទាល់ខ្លួនដែលបងប្អូនសង្កេតឃើញ',
        evidencePointsKm: evidence,
        reasonKm:
          'កត្តាខាងក្រៅទាំងនេះ អាចពាក់ព័ន្ធនឹងការកកស្ទះរន្ធញើស ឬរំខានដល់ស្បែក ដែលជាកត្តាមួយគួរយកចិត្តទុកដាក់ និងគួរសង្កេតបន្ថែម។',
        actionKm: 'បន្តតាមដានការឆ្លើយតបរបស់ស្បែក និងរក្សាកំណត់ត្រាការប្រែប្រួល។',
      };
    }

    if (f.category === 'remover_irritation') {
      return {
        titleKm: 'ផលិតផល Remove Makeup ធ្វើឱ្យរមាស់ភ្នែក',
        evidencePointsKm: ['Remover makeup បានស្អាតល្អ តែក្រហាយភ្នែក'],
        reasonKm:
          'ផលិតផល Remove Makeup ដែលធ្វើឱ្យក្រហាយភ្នែក អាចមានជាតិកាត់ ឬក្លិនក្រអូបដែលមិនសមស្របនឹងស្បែកប្រតិកម្ម។',
        actionKm: 'ប្តូរទៅប្រើផលិតផល Remove Makeup ស្រទន់បែបធម្មជាតិ គ្មានក្លិន វិញ។',
      };
    }

    if (f.category === 'remover_residue') {
      return {
        titleKm: 'Remove Makeup មិនស្អាតគ្រប់គ្រាន់',
        evidencePointsKm: ['Remover makeup មិនបានស្អាតទេ នៅសល់សំណល់ makeup ជាច្រើនទៀត'],
        reasonKm:
          'សំណល់ makeup និងឡេការពារកម្តៅថ្ងៃដែលនៅសល់ក្នុងរន្ធញើស ជាមូលហេតុចម្បងដែលបង្កឱ្យស្ទះរន្ធញើស និងកើតមុន។',
        actionKm: 'ប្តូរទៅប្រើផលិតផល Remove Makeup ដែលមានប្រសិទ្ធភាពខ្លាំងជាងមុន ឬប្រើវិធីសម្អាតពីរដង (Double Cleanse)។',
      };
    }

    if (f.category === 'acne_treatment_barrier') {
      return {
        titleKm: 'ផលិតផលព្យាបាលមុនធ្វើឱ្យរមាស់ស្បែក ឬខូចរបាំងការពារ',
        evidencePointsKm: ['ព្យាបាលមុនបានល្អ តែស្បែកក្រហាយ ស្ងួតខ្លាំង ឬរបក'],
        reasonKm:
          'សារធាតុសកម្មក្នុងថ្នាំមុនកំពុងធ្វើឱ្យរបាំងការពារស្បែកចុះខ្សោយ និងស្ងួតរបក។',
        actionKm: 'បន្ថយភាពញឹកញាប់នៃការប្រើ ឬផ្អាកផលិតផលព្យាបាលមុនបណ្តោះអាសន្ន រួចពង្រឹងការផ្ដល់សំណើមស្ដាររបាំងស្បែក។',
      };
    }

    if (f.category === 'acne_treatment_ineffective') {
      return {
        titleKm: 'ផលិតផលព្យាបាលមុនមិនត្រូវនឹងប្រភេទស្បែក ឬមុនកើនឡើង',
        evidencePointsKm: ['ប្រើហើយមិនឃើញប្រសិទ្ធភាព ឬមុនកើនឡើងលើសដើម'],
        reasonKm:
          'ការបន្តប្រើផលិតផលដែលមិនត្រូវនឹងប្រភេទស្បែក ឬរន្ធញើសកកស្ទះ អាចបង្កឱ្យមុនកើនឡើងលើសដើម។',
        actionKm: 'ផ្អាកការប្រើប្រាស់ផលិតផលព្យាបាលមុនបច្ចុប្បន្ន រួចប្តូរមកបន្សាបជាតិពុល និងសម្អាតរន្ធញើសដោយវិធីធម្មជាតិស្រទន់វិញ។',
      };
    }

    // Clean any question number references from fallback evidence
    const cleanEvidence = f.evidenceKm
      .replace(/ចម្លើយសំណួរទី\s*\d+[^\s:]*(\s*&\s*\d+[^\s:]*)?\s*[:៖]\s*/g, '')
      .trim();

    return {
      titleKm: f.titleKm,
      evidencePointsKm: [cleanEvidence || f.evidenceKm],
      reasonKm: f.importanceReasonKm,
      actionKm: 'បន្តតាមដានការឆ្លើយតបរបស់ស្បែក និងរក្សាទម្លាប់ថែទាំត្រឹមត្រូវ។',
    };
  }

  const priorities: ComedonePriority[] = [];
  let rankCounter = 1;

  // 1. High Attention Findings first
  const highFindings = findings.filter((f) => f.priorityLevel === 'HIGH_ATTENTION');
  highFindings.forEach((f) => {
    const details = getPriorityEvidenceAndReason(f, answers);
    priorities.push({
      id: `priority_${f.id}`,
      rank: rankCounter++,
      level: 'HIGH_ATTENTION',
      titleKm: details.titleKm,
      evidencePointsKm: details.evidencePointsKm,
      reasonKm: details.reasonKm,
      actionSummaryKm: details.actionKm,
    });
  });

  // 2. Medium Attention Findings next
  const mediumFindings = findings.filter((f) => f.priorityLevel === 'MEDIUM_ATTENTION');
  mediumFindings.forEach((f) => {
    const details = getPriorityEvidenceAndReason(f, answers);
    priorities.push({
      id: `priority_${f.id}`,
      rank: rankCounter++,
      level: 'MEDIUM_ATTENTION',
      titleKm: details.titleKm,
      evidencePointsKm: details.evidencePointsKm,
      reasonKm: details.reasonKm,
      actionSummaryKm: details.actionKm,
    });
  });

  // 3. Monitor Findings
  const monitorFindings = findings.filter((f) => f.priorityLevel === 'MONITOR');
  monitorFindings.forEach((f) => {
    const details = getPriorityEvidenceAndReason(f, answers);
    priorities.push({
      id: `priority_${f.id}`,
      rank: rankCounter++,
      level: 'MONITOR',
      titleKm: details.titleKm,
      evidencePointsKm: details.evidencePointsKm,
      reasonKm: details.reasonKm,
      actionSummaryKm: details.actionKm,
    });
  });

  // ==========================================================================
  // 7. BUILD THE 7 SECTIONS OF FINAL RESULT
  // ==========================================================================

  // --- SECTION 1: ស្ថានភាពមុនកប់បច្ចុប្បន្ន ---
  const appearanceDescriptions: Record<string, string> = {
    typical_closed_comedone_like: 'គ្រាប់តូចៗ ពណ៌ដូចស្បែក មិនក្រហម និងមិនឈឺ (មុនកប់ធម្មតា)',
    whitehead_like: 'គ្រាប់តូចៗ មានក្បាលស ឬក្បាលបិទជិត (Whitehead-like)',
    comedone_with_inflammation: 'មុនកប់ដែលខ្លះបានប្រែជាក្រហម ឬរលាក',
    uncertain: 'មុនកប់',
  };

  const amountDescriptions: Record<string, string> = {
    low: 'តិចជាង ១០ គ្រាប់ (កម្រិតស្រាល)',
    mild: '១០–២០ គ្រាប់ (កម្រិតមធ្យមស្រាល)',
    medium: '២១–៥០ គ្រាប់ (កម្រិតមធ្យម)',
    high: 'លើសពី ៥០ គ្រាប់ (កម្រិតច្រើន)',
    high_attention: 'ច្រើនពិបាកប៉ាន់ស្មាន (កម្រិតគួរយកចិត្តទុកដាក់)',
    unknown: 'ច្រើនពិបាកប៉ាន់ស្មាន',
  };

  const durationDescriptions: Record<string, string> = {
    recent: 'ទើបតែកើតមានថ្មីៗ (តិចជាង ៣ ខែ)',
    persistent: 'បន្តកើតមាន ៣–៦ ខែ',
    persistent_longer: 'បន្តកើតមានយូរគួរសម (៦–១២ ខែ)',
    long_term: 'កើតមានរ៉ាំរ៉ៃ (លើសពី ១ ឆ្នាំ)',
    recurrent: 'កើតហើយបាត់ ហើយកើតឡើងវិញញឹកញាប់',
    uncertain: 'មិនប្រាកដ',
  };

  const trendDescriptions: Record<string, string> = {
    improving: 'កំពុងថយចុះជាវិជ្ជមាន',
    stable: 'ស្ទើរតែដដែល មានស្ថិរភាព',
    increasing: 'កំពុងកើនឡើងបន្តិចម្តងៗ',
    clearly_increasing: 'កំពុងកើនឡើងច្រើន',
    rapidly_increasing: 'កើនឡើងភ្លាមៗច្រើនក្នុងរយៈពេលខ្លី',
    uncertain: 'មិនប្រាកដ',
  };

  const inflammationDescriptions: Record<string, string> = {
    none: 'មិនមានមុនរលាកក្រហមទេ',
    mild: 'មានមុនរលាកក្រហមស្រាល ១–២ គ្រាប់',
    moderate: 'មានមុនរលាក ៣–៥ គ្រាប់',
    high: 'មានមុនរលាកក្រហមហើមច្រើន (លើសពី ៥ គ្រាប់)',
    uncertain: 'មិនប្រាកដ',
  };

  let badgeLabelKm = '';
  let badgeColor: 'emerald' | 'amber' | 'rose' | 'blue' = 'emerald';
  let trendStatus: { titleKm: string; descriptionKm: string } | undefined = undefined;

  if (trend_level === 'improving') {
    trendStatus = {
      titleKm: 'ស្ថានភាពមុនកំពុងថយចុះជាវិជ្ជមាន',
      descriptionKm: 'ការថយចុះនៃមុនកប់បង្ហាញថា ស្បែកកំពុងឆ្លើយតបល្អជាមួយទម្លាប់ថែទាំបច្ចុប្បន្ន។',
    };
    badgeColor = 'emerald';
  } else if (professional_review_flag || inflammation_level === 'high') {
    badgeLabelKm = 'ស្ថានភាពទូទៅ៖ មុនកប់អមដោយការរលាក (គួរយកចិត្តទុកដាក់)';
    badgeColor = 'rose';
  }

  const section1_summary = {
    appearanceTextKm: appearanceDescriptions[comedone_type] || 'មុនកប់',
    amountTextKm: amountDescriptions[comedone_amount] || 'កម្រិតមធ្យម',
    locationTextKm: locationText ? `តំបន់ ${locationText}` : 'តំបន់ពេញផ្ទៃមុខ',
    durationTextKm: durationDescriptions[duration_level] || '១–៣ ខែ',
    trendTextKm: trendDescriptions[trend_level] || 'ស្ទើរតែដដែល',
    inflammationTextKm: inflammationDescriptions[inflammation_level] || 'មិនមាន',
    badgeLabelKm,
    badgeColor,
    trendStatus,
    summaryItems: (() => {
      // ----------------------------------------------------------------------
      // Summary of All Customer Answers (Short, Readable, 1 Sentence per Item)
      // Non-diagnostic, strictly summarizing condition and routine. Respects skip logic.
      // ----------------------------------------------------------------------

      // Q1 Summary
      let q1Summary = 'មុនកប់ជាគ្រាប់តូចៗ ពណ៌ដូចស្បែក មិនក្រហម និងមិនឈឺ។';
      if (answers.q1_appearance === 'whitehead_bumps') {
        q1Summary = 'មុនកប់ជាគ្រាប់តូចៗ មានក្បាលស ឬក្បាលបិទជិត។';
      } else if (answers.q1_appearance === 'inflamed_red_bumps') {
        q1Summary = 'មុនកប់មួយចំនួនបានប្រែជាក្រហម ឬរលាក។';
      } else if (answers.q1_appearance === 'unsure') {
        q1Summary = 'មិនទាន់ប្រាកដពីទម្រង់ច្បាស់លាស់នៃគ្រាប់មុនកប់នៅឡើយ។';
      }

      // Q2 Summary
      let q2Summary = 'មិនមានវត្តមានមុនធំ ក្រហម ហើម ឬឈឺនោះទេ។';
      if (answers.q2_inflammatory_count === '1_to_2') {
        q2Summary = 'មានវត្តមានមុនធំ ក្រហម ហើម ឬឈឺអមប្រមាណ ១–២ គ្រាប់។';
      } else if (answers.q2_inflammatory_count === '3_to_5') {
        q2Summary = 'មានវត្តមានមុនធំ ក្រហម ហើម ឬឈឺអមប្រមាណ ៣–៥ គ្រាប់។';
      } else if (answers.q2_inflammatory_count === 'more_than_5') {
        q2Summary = 'មានវត្តមានមុនធំ ក្រហម ហើម ឬឈឺច្រើនលើសពី ៥ គ្រាប់។';
      } else if (answers.q2_inflammatory_count === 'unsure') {
        q2Summary = 'មិនទាន់ប្រាកដពីចំនួនមុនរលាកអមនៅឡើយទេ។';
      }

      // Q3 Summary
      let q3Summary = 'មុនកប់នេះកើតមានក្នុងរយៈពេល ១–៣ ខែ។';
      if (answers.q3_duration === 'less_than_1m') {
        q3Summary = 'មុនកប់នេះទើបតែកើតមានក្នុងរយៈពេលតិចជាង ១ ខែ។';
      } else if (answers.q3_duration === '3_to_6m') {
        q3Summary = 'មុនកប់នេះបានបន្តកើតមានក្នុងរយៈពេល ៣–៦ ខែ។';
      } else if (answers.q3_duration === '6_to_12m') {
        q3Summary = 'មុនកប់នេះបានបន្តកើតមានក្នុងរយៈពេល ៦–១២ ខែ។';
      } else if (answers.q3_duration === 'more_than_1y') {
        q3Summary = 'មុនកប់នេះបានកើតមានយូរអង្វែងលើសពី ១ ឆ្នាំមកហើយ។';
      } else if (answers.q3_duration === 'recurrent') {
        q3Summary = 'មុនកប់នេះតែងតែកើតហើយបាត់ ហើយកើតឡើងវិញញឹកញាប់។';
      } else if (answers.q3_duration === 'unsure') {
        q3Summary = 'មិនទាន់ប្រាកដពីថេរវេលានៃការកើតមុនកប់នេះច្បាស់លាស់ឡើយ។';
      }

      // Q4 Summary
      const selectedAreas = answers.q4_areas || [];
      let q4Summary = 'មុនកប់កើតមាននៅលើតំបន់ផ្ទៃមុខ។';
      if (selectedAreas.includes('almost_full_face')) {
        q4Summary = 'មុនកប់កើតមានរាយប៉ាយស្ទើរតែពេញផ្ទៃមុខ។';
      } else if (selectedAreas.length > 0) {
        const areaLabels = selectedAreas.map((a) => areaNamesMap[a] || a);
        q4Summary = `មុនកប់កើតមានភាគច្រើននៅតំបន់${areaLabels.join(', ')}។`;
      }

      // Q5 Summary
      let q5Summary = 'បច្ចុប្បន្នមានមុនកប់ចំនួនប្រមាណ ១០–២០ គ្រាប់។';
      if (answers.q5_amount === 'less_than_10') {
        q5Summary = 'បច្ចុប្បន្នមានមុនកប់ចំនួនតិចជាង ១០ គ្រាប់។';
      } else if (answers.q5_amount === '21_to_50') {
        q5Summary = 'បច្ចុប្បន្នមានមុនកប់ចំនួនប្រមាណ ២១–៥០ គ្រាប់។';
      } else if (answers.q5_amount === 'more_than_50') {
        q5Summary = 'បច្ចុប្បន្នមានមុនកប់ចំនួនច្រើនលើសពី ៥០ គ្រាប់។';
      } else if (answers.q5_amount === 'hard_to_estimate') {
        q5Summary = 'បច្ចុប្បន្នមានមុនកប់បរិមាណច្រើនពិបាកក្នុងការប៉ាន់ស្មាន។';
      }

      // Q6 Summary
      let q6Summary = 'ក្នុងរយៈពេល ១ ខែចុងក្រោយ ស្ថានភាពមុនកប់ស្ទើរតែដដែល។';
      if (answers.q6_trend === 'improving') {
        q6Summary = 'ក្នុងរយៈពេល ១ ខែចុងក្រោយ ស្ថានភាពមុនកប់មានការថយចុះ។';
      } else if (answers.q6_trend === 'slight_increase') {
        q6Summary = 'ក្នុងរយៈពេល ១ ខែចុងក្រោយ មុនកប់មានការកើនឡើងបន្តិច។';
      } else if (answers.q6_trend === 'large_increase') {
        q6Summary = 'ក្នុងរយៈពេល ១ ខែចុងក្រោយ មុនកប់មានការកើនឡើងច្រើន។';
      } else if (answers.q6_trend === 'rapid_spike') {
        q6Summary = 'ក្នុងរយៈពេល ១ ខែចុងក្រោយ មុនកប់កើតឡើងភ្លាមៗច្រើនក្នុងរយៈពេលខ្លី។';
      } else if (answers.q6_trend === 'unsure') {
        q6Summary = 'មិនទាន់ប្រាកដពីនិន្នាការប្រែប្រួលក្នុងរយៈពេល ១ ខែចុងក្រោយនៅឡើយទេ។';
      }

      // Q7 Summary
      let q7Summary = 'ក្នុងរយៈពេល ១ ខែចុងក្រោយ មិនបានចាប់ផ្តើមប្រើ ឬប្តូរផលិតផលថែស្បែកថ្មីឡើយ។';
      if (answers.q7_new_products === '1_product') {
        q7Summary = 'ក្នុងរយៈពេល ១ ខែចុងក្រោយ បានចាប់ផ្តើមប្រើ ឬប្តូរផលិតផលថ្មីចំនួន ១ មុខ។';
      } else if (answers.q7_new_products === '2_or_more') {
        q7Summary = 'ក្នុងរយៈពេល ១ ខែចុងក្រោយ បានចាប់ផ្តើមប្រើ ឬប្តូរផលិតផលថ្មីចំនួន ២ មុខ ឬច្រើនជាងនេះ។';
      } else if (answers.q7_new_products === 'unsure') {
        q7Summary = 'មិនទាន់ប្រាកដពីការចាប់ផ្តើម ឬប្តូរផលិតផលថ្មីក្នុងខែចុងក្រោយឡើយ។';
      }

      // Q8 Summary
      const dailyMap: Record<string, string> = {
        makeup_remover: 'ទឹក/ប្រេងលុប Makeup',
        cleanser: 'Cleanser (ហ្វូម/សាប៊ូលាងមុខ)',
        toner: 'Toner',
        serum: 'Serum',
        moisturizer: 'Moisturizer (ឡេ/គ្រីម)',
        sunscreen: 'Sunscreen (ឡេការពារកម្តៅថ្ងៃ)',
        makeup: 'Makeup (ម្សៅទ្រនាប់)',
        aha_bha: 'AHA/BHA',
        retinol: 'Retinol',
        scrub: 'Scrub (ខាត់ស្បែក)',
        acne_treatment: 'ផលិតផលព្យាបាលមុន',
      };
      const q8Selected = answers.q8_daily_products || [];
      let q8Summary = 'មិនទាន់ច្បាស់ពីផលិតផលជាក់លាក់ដែលកំពុងប្រើប្រចាំថ្ងៃនៅឡើយ។';
      if (q8Selected.length > 0 && !q8Selected.includes('unsure')) {
        const labels = q8Selected.map((item) => dailyMap[item] || item);
        q8Summary = `ផលិតផលដែលកំពុងប្រើប្រចាំថ្ងៃរួមមាន៖ ${labels.join(', ')}។`;
      }

      // Q9 Summary
      let q9Summary = 'មិនប្រើប្រាស់ Makeup នោះទេ។';
      if (answers.q9_makeup_freq === 'daily') {
        q9Summary = 'តែងតែ Makeup ស្ទើរតែរាល់ថ្ងៃ។';
      } else if (answers.q9_makeup_freq === '3_to_5_weekly') {
        q9Summary = 'Makeup ប្រមាណ ៣–៥ ដងក្នុងមួយសប្ដាហ៍។';
      } else if (answers.q9_makeup_freq === '1_to_2_weekly') {
        q9Summary = 'Makeup ប្រមាណ ១–២ ដងក្នុងមួយសប្ដាហ៍។';
      } else if (answers.q9_makeup_freq === 'occasional') {
        q9Summary = 'Makeup តែម្តងម្កាលប៉ុណ្ណោះ។';
      }

      // Q10 Summary (Only if NOT skipped by conditional logic)
      let q10SummaryItem: ComedoneSummaryItem | null = null;
      if (!isQ10Skipped(answers)) {
        const isNoMakeup = answers.q9_makeup_freq === 'none';
        let q10Text = 'មិនទាន់ប្រាកដថាសម្អាតស្បែកបានស្អាតល្អឬអត់ឡើយ។';
        if (isNoMakeup) {
          if (answers.q10_cleansing_routine === 'double_cleanse_daily') {
            q10Text = 'លុប Sunscreen រួចលាងសម្អាតមុខស្អាតរាល់ថ្ងៃមុនចូលគេង។';
          } else if (answers.q10_cleansing_routine === 'cleanser_only') {
            q10Text = 'ប្រើតែហ្វូមលាងមុខ ដោយមិនបានប្រើផលិតផលលុប Sunscreen ឡើយ។';
          } else if (answers.q10_cleansing_routine === 'sometimes_forget') {
            q10Text = 'ពេលខ្លះភ្លេចសម្អាតមុខមុនពេលចូលគេង។';
          } else if (answers.q10_cleansing_routine === 'sometimes_sleep_with_makeup') {
            q10Text = 'ពេលខ្លះគេងទាំងមិនបានលាងសម្អាតមុខ។';
          }
        } else {
          if (answers.q10_cleansing_routine === 'double_cleanse_daily') {
            q10Text = 'លុប Makeup រួចលាងសម្អាតមុខស្អាតរាល់ថ្ងៃមុនចូលគេង។';
          } else if (answers.q10_cleansing_routine === 'cleanser_only') {
            q10Text = 'ប្រើតែហ្វូមលាងមុខ ដោយមិនបានប្រើផលិតផលលុប Makeup ឡើយ។';
          } else if (answers.q10_cleansing_routine === 'sometimes_forget') {
            q10Text = 'ពេលខ្លះភ្លេចលុប Makeup មុនពេលចូលគេង។';
          } else if (answers.q10_cleansing_routine === 'sometimes_sleep_with_makeup') {
            q10Text = 'ពេលខ្លះគេងទាំងមាន Makeup នៅលើផ្ទៃមុខ។';
          }
        }

        q10SummaryItem = {
          questionNumber: 10,
          id: 'cleansing_routine',
          topicKm: isNoMakeup ? 'ការសម្អាត Sunscreen ពេលយប់' : 'ការសម្អាត Makeup ពេលយប់',
          summaryKm: q10Text,
          category: 'routine',
          categoryLabelKm: 'ទម្លាប់ថែទាំ & សម្អាតមុខ',
        };
      }

      // Q11 Summary
      let q11Summary = 'លាងសម្អាតមុខចំនួន ២ ដងក្នុងមួយថ្ងៃ។';
      if (answers.q11_wash_freq === 'once') {
        q11Summary = 'លាងសម្អាតមុខចំនួន ១ ដងក្នុងមួយថ្ងៃ។';
      } else if (answers.q11_wash_freq === 'three_times') {
        q11Summary = 'លាងសម្អាតមុខចំនួន ៣ ដងក្នុងមួយថ្ងៃ។';
      } else if (answers.q11_wash_freq === 'more_than_three') {
        q11Summary = 'លាងសម្អាតមុខញឹកញាប់លើសពី ៣ ដងក្នុងមួយថ្ងៃ។';
      } else if (answers.q11_wash_freq === 'irregular') {
        q11Summary = 'លាងសម្អាតមុខដោយកាលវិភាគមិនទៀងទាត់។';
      }

      // Q12 Summary
      let q12Summary = 'ក្រោយលាងមុខរួច ស្បែកមានអារម្មណ៍ធម្មតា និងស្រួល។';
      if (answers.q12_post_wash_feeling === 'slightly_tight') {
        q12Summary = 'ក្រោយលាងមុខរួច ស្បែកមានអារម្មណ៍តឹងបន្តិច។';
      } else if (answers.q12_post_wash_feeling === 'very_tight_dry') {
        q12Summary = 'ក្រោយលាងមុខរួច ស្បែកមានអារម្មណ៍តឹង និងស្ងួតខ្លាំង។';
      } else if (answers.q12_post_wash_feeling === 'dry_flaking') {
        q12Summary = 'ក្រោយលាងមុខរួច ស្បែកមានសភាពស្ងួត ឬរបក។';
      } else if (answers.q12_post_wash_feeling === 'red_stinging') {
        q12Summary = 'ក្រោយលាងមុខរួច ស្បែកមានសញ្ញាក្រហម ឬចាក់ៗ។';
      } else if (answers.q12_post_wash_feeling === 'gets_oily_fast') {
        q12Summary = 'ក្រោយលាងមុខរួច ស្បែកឆាប់ចាប់ផ្តើមចេញជាតិខ្លាញ់លឿន។';
      }

      // Q13 Summary
      let q13Summary = 'មិនធ្លាប់ញិច កេះ ឬច្របាច់មុនកប់ក្នុងរយៈពេល ៤ សប្ដាហ៍ចុងក្រោយឡើយ។';
      if (answers.q13_picking_habit === 'occasional') {
        q13Summary = 'ធ្លាប់ញិច កេះ ឬច្របាច់មុនកប់ម្តងម្កាល។';
      } else if (answers.q13_picking_habit === 'frequent') {
        q13Summary = 'តែងតែញិច កេះ ឬច្របាច់មុនកប់ញឹកញាប់។';
      } else if (answers.q13_picking_habit === 'self_frequent') {
        q13Summary = 'តែងតែញិច ឬកេះមុនកប់ដោយខ្លួនឯងជាញឹកញាប់។';
      } else if (answers.q13_picking_habit === 'salon_cleaning') {
        q13Summary = 'ធ្លាប់ទៅហាង ឬ Beauty Salon ឱ្យគេជួយសម្អាត ឬញិចមុន។';
      }

      // Q14 Summary
      const triggerMap: Record<string, string> = {
        after_new_product: 'ក្រោយប្រើផលិតផលថ្មី',
        after_makeup: 'ក្រោយ Makeup',
        late_sleep: 'ក្រោយគេងយប់ជ្រៅ',
        stress: 'ពេលមាន Stress',
        period: 'មុន ឬអំឡុងពេលមករដូវ',
        hot_sweat: 'ពេលអាកាសធាតុក្តៅ ឬបែកញើស',
        mask: 'ក្រោយពាក់ម៉ាស់យូរ',
      };
      const q14Selected = answers.q14_aggravating_factors || [];
      let q14Summary = 'មិនទាន់សង្កេតឃើញកត្តាជំរុញជាក់លាក់ណាមួយឡើយ។';
      if (q14Selected.includes('no_clear_reason')) {
        q14Summary = 'មិនទាន់សង្កេតឃើញមានកត្តាជំរុញជាក់លាក់ណាមួយនៅឡើយទេ។';
      } else if (q14Selected.includes('unsure')) {
        q14Summary = 'មិនទាន់ប្រាកដពីកត្តាដែលធ្វើឱ្យមុនកប់កើនឡើងនៅឡើយទេ។';
      } else if (q14Selected.length > 0) {
        const triggerLabels = q14Selected.map((t) => triggerMap[t] || t);
        q14Summary = `សង្កេតឃើញមុនកប់កើនឡើងនៅពេល៖ ${triggerLabels.join(', ')}។`;
      }

      // Q15 Summary
      const warningMap: Record<string, string> = {
        large_cystic_painful: 'មានមុនធំៗ ក្រហម ហើម ឬឈឺច្រើន',
        many_bumps_itchy: 'មានគ្រាប់តូចៗច្រើន និងរមាស់ខ្លាំង',
        red_burning_pain: 'ស្បែកក្រហម រមាស់ ឬឈឺខ្លាំង',
        rapid_escalation: 'មុនកើនឡើងលឿន',
        clear_scars_forming: 'ចាប់ផ្តើមមានស្នាមមុនច្បាស់',
        comedones_inflaming: 'មុនកប់ប្រែជារលាកញឹកញាប់',
      };
      const q15Selected = answers.q15_warning_signs || [];
      let q15Summary = 'បច្ចុប្បន្នមិនមានសញ្ញាស្បែកគួរឱ្យបារម្ភដូចជា ឈឺ ហើម រមាស់ ឬរលាកខ្លាំងឡើយ។';
      if (q15Selected.length > 0 && !q15Selected.includes('none_of_above')) {
        const warningLabels = q15Selected.map((w) => warningMap[w] || w);
        q15Summary = `មានសញ្ញាស្បែកគួរតាមដាន៖ ${warningLabels.join(', ')}។`;
      }

      // Q16 Summary: Pillowcase
      const q16Map: Record<string, string> = {
        about_once_a_week: 'ប្រហែល 1 ដងក្នុងមួយសប្ដាហ៍',
        about_once_a_month: 'ប្រហែល 1 ខែម្តង',
        more_than_6_months: 'លើសពី 6 ខែម្តង',
        irregular: 'មិនទៀងទាត់',
        unsure: 'មិនប្រាកដ',
      };
      const q16Summary = q16Map[answers.q16_pillowcase] || 'ប្រហែល 1 ដងក្នុងមួយសប្ដាហ៍';

      // Q18 Summary: Face drying method
      const q18Map: Record<string, string> = {
        clean_towel_face_only: 'កន្សែងមុខស្អាត ដែលប្រើសម្រាប់មុខតែប៉ុណ្ណោះ',
        towel_reuse_multiple: 'កន្សែងមុខដែលប្រើច្រើនដងមុនបោក',
        facial_tissue: 'ក្រដាសជូតមុខ / Facial Tissue',
        shared_towel: 'កន្សែងរួមជាមួយអ្នកដទៃ',
        air_dry: 'ទុកឲ្យស្ងួតដោយខ្លួនឯង',
        other: 'ផ្សេងៗ',
      };
      const q18Method = answers.q18_face_drying || answers.q17_face_drying || 'clean_towel_face_only';
      const q18Summary = q18Map[q18Method] || 'កន្សែងមុខស្អាត ដែលប្រើសម្រាប់មុខតែប៉ុណ្ណោះ';

      // Q19 Summary: Towel wash frequency (conditional)
      const q19Map: Record<string, string> = {
        every_day: 'រាល់ថ្ងៃ',
        every_2_3_days: 'រៀងរាល់ 2–3 ថ្ងៃ',
        about_once_a_week: 'ប្រហែល 1 ដងក្នុងមួយសប្ដាហ៍',
        more_than_1_week: 'លើសពី 1 សប្ដាហ៍',
        irregular: 'មិនទៀងទាត់',
      };
      const q19Summary = answers.q19_towel_wash_freq ? q19Map[answers.q19_towel_wash_freq] : '';

      // Q20 Summary: Exfoliation Frequency
      // 【ច្បាប់ភាពញឹកញាប់នៃការជម្រុះកោសិកាចាស់ៗ】
      // frequency <= 3 (never, 1, 2, 3 times/week) is normal.
      // frequency > 3 (more than 3 times/week) is too frequent.
      const q20Map: Record<string, string> = {
        never: 'មិនដែលជម្រុះកោសិកាចាស់ៗទេ (ធម្មតា)',
        once_a_week: 'ជម្រុះកោសិកាចាស់ៗ ១ ដងក្នុងមួយសប្ដាហ៍ (ធម្មតា)',
        twice_a_week: 'ជម្រុះកោសិកាចាស់ៗ ២ ដងក្នុងមួយសប្ដាហ៍ (ធម្មតា)',
        three_times_a_week: 'ជម្រុះកោសិកាចាស់ៗ ៣ ដងក្នុងមួយសប្ដាហ៍ (ធម្មតា)',
        more_than_three: 'ជម្រុះកោសិកាចាស់ៗលើសពី ៣ ដងក្នុងមួយសប្ដាហ៍ (ញឹកញាប់ពេក)',
        irregular: 'ជម្រុះកោសិកាចាស់ៗមិនទៀងទាត់',
        unsure: 'មិនប្រាកដពីភាពញឹកញាប់នៃការជម្រុះកោសិកាចាស់ៗ',
      };
      const q20Summary = answers.q20_exfoliation_freq ? (q20Map[answers.q20_exfoliation_freq] || 'មិនដែលជម្រុះកោសិកាចាស់ៗទេ (ធម្មតា)') : '';

      // Q21 Summary: Post-Exfoliation Skin Feeling (conditional)
      const q21Map: Record<string, string> = {
        oil_reduction_smooth: 'កាត់បន្ថយមុខខ្លាញ់ មុខមុន និងម៉ត់រលោង',
        tight: 'ស្បែកតឹង ស្បែកស្ងួត ស្បែករបក',
        dry: 'ស្បែកតឹង ស្បែកស្ងួត ស្បែករបក',
        peeling: 'ស្បែកតឹង ស្បែកស្ងួត ស្បែករបក',
        redness: 'ស្បែកក្រហម',
        stinging_burning: 'មានអារម្មណ៍ចាក់ៗ ឬក្តៅ',
        itching: 'មានអារម្មណ៍រមាស់',
        normal_no_issues: 'មិនមានអារម្មណ៍ខុសប្រក្រតី',
        unsure: 'ធម្មតា',
        normal: 'ធម្មតា',
      };
      const q21Summary = (answers.q21_exfoliation_feel || []).map((k) => q21Map[k] || k).join(', ');

      const items: ComedoneSummaryItem[] = [
        {
          questionNumber: 1,
          id: 'appearance',
          topicKm: 'សភាពមុនកប់',
          summaryKm: q1Summary,
          category: 'condition',
          categoryLabelKm: 'ស្ថានភាពស្បែក & មុនកប់',
        },
        {
          questionNumber: 2,
          id: 'duration',
          topicKm: 'រយៈពេលកើតមាន',
          summaryKm: q3Summary,
          category: 'condition',
          categoryLabelKm: 'ស្ថានភាពស្បែក & មុនកប់',
        },
        {
          questionNumber: 3,
          id: 'areas',
          topicKm: 'តំបន់ដែលកើត',
          summaryKm: q4Summary,
          category: 'condition',
          categoryLabelKm: 'ស្ថានភាពស្បែក & មុនកប់',
        },
        {
          questionNumber: 4,
          id: 'amount',
          topicKm: 'ចំនួនគ្រាប់មុន',
          summaryKm: q5Summary,
          category: 'condition',
          categoryLabelKm: 'ស្ថានភាពស្បែក & មុនកប់',
        },
        {
          questionNumber: 5,
          id: 'trend',
          topicKm: 'និន្នាការ ១ ខែចុងក្រោយ',
          summaryKm: q6Summary,
          category: 'condition',
          categoryLabelKm: 'ស្ថានភាពស្បែក & មុនកប់',
        },
        {
          questionNumber: 6,
          id: 'new_products',
          topicKm: 'ការផ្លាស់ប្តូរផលិតផល',
          summaryKm: q7Summary,
          category: 'routine',
          categoryLabelKm: 'ទម្លាប់ថែទាំ & សម្អាតមុខ',
        },
        {
          questionNumber: 7,
          id: 'daily_products',
          topicKm: 'ផលិតផលប្រើប្រចាំថ្ងៃ',
          summaryKm: q8Summary,
          category: 'routine',
          categoryLabelKm: 'ទម្លាប់ថែទាំ & សម្អាតមុខ',
        },
        ...(answers.q8_acne_treatment_feeling
          ? [
              {
                questionNumber: 8,
                id: 'acne_treatment_feeling',
                topicKm: 'អារម្មណ៍ក្រោយប្រើផលិតផលទាំងនោះរួច',
                summaryKm:
                  answers.q8_acne_treatment_feeling === 'effective_comfortable'
                    ? 'ព្យាបាលមុនបានល្អ ស្បែកមិនក្រហាយ មិនស្ងួតរបក (មានប្រសិទ្ធភាព)'
                    : answers.q8_acne_treatment_feeling === 'stings_dry_peeling'
                    ? 'ព្យាបាលមុនបានល្អ តែស្បែកក្រហាយ ស្ងួតខ្លាំង ឬរបក (បង្កប្រតិកម្មរំខាន)'
                    : answers.q8_acne_treatment_feeling === 'ineffective'
                    ? 'ប្រើហើយមិនឃើញប្រសិទ្ធភាព (ផលមិនច្បាស់លាស់)'
                    : answers.q8_acne_treatment_feeling === 'acne_increased'
                    ? 'ឬមុនកើនឡើងលើសដើម (ផលិតផលមិនសមស្រប/មុនកើនឡើង)'
                    : answers.q8_acne_treatment_feeling === 'itchy_rash_burn'
                    ? 'រមាស់ / រោល / រលាក / ក្រហាយ'
                    : 'ប្រើហើយមិនឃើញប្រសិទ្ធភាព ឬមុនកើនឡើងលើសដើម',
                category: 'routine' as const,
                categoryLabelKm: 'ទម្លាប់ថែទាំ & សម្អាតមុខ',
              },
            ]
          : []),
        ...(dailyProds.includes('makeup_remover') && answers.q8_remover_feeling
          ? [
              {
                questionNumber: 8,
                id: 'remover_feeling',
                topicKm: 'អារម្មណ៍ក្រោយប្រើ Makeup Remover',
                summaryKm:
                  answers.q8_remover_feeling === 'clean_no_sting'
                    ? 'Remove Makeup បានស្អាតល្អ មិនក្រហាយភ្នែក (ធម្មតា)'
                    : answers.q8_remover_feeling === 'clean_stings_eyes'
                    ? 'Remove Makeup បានស្អាតល្អ តែក្រហាយភ្នែក (រមាស់ភ្នែក)'
                    : 'Remove Makeup មិនបានស្អាតទេ នៅសល់សំណល់ makeup ជាច្រើនទៀត (មិនស្អាតគ្រប់គ្រាន់)',
                category: 'routine' as const,
                categoryLabelKm: 'ទម្លាប់ថែទាំ & សម្អាតមុខ',
              },
            ]
          : []),
        {
          questionNumber: 9,
          id: 'makeup_freq',
          topicKm: 'ទម្លាប់ Makeup',
          summaryKm: q9Summary,
          category: 'routine',
          categoryLabelKm: 'ទម្លាប់ថែទាំ & សម្អាតមុខ',
        },
        ...(q10SummaryItem ? [q10SummaryItem] : []),
        {
          questionNumber: 11,
          id: 'wash_freq',
          topicKm: 'ចំនួនដងលាងមុខ',
          summaryKm: q11Summary,
          category: 'routine',
          categoryLabelKm: 'ទម្លាប់ថែទាំ & សម្អាតមុខ',
        },
        {
          questionNumber: 12,
          id: 'post_wash',
          topicKm: 'អារម្មណ៍ស្បែកក្រោយលាង',
          summaryKm: q12Summary,
          category: 'routine',
          categoryLabelKm: 'ទម្លាប់ថែទាំ & សម្អាតមុខ',
        },
        {
          questionNumber: 13,
          id: 'picking_habit',
          topicKm: 'ទម្លាប់ញិច ឬកេះមុន',
          summaryKm: q13Summary,
          category: 'habits_triggers',
          categoryLabelKm: 'ទម្លាប់ផ្ទាល់ខ្លួន & កត្តាជំរុញ',
        },
        {
          questionNumber: 14,
          id: 'aggravating_factors',
          topicKm: 'កត្តាជំរុញផ្ទាល់ខ្លួន',
          summaryKm: q14Summary,
          category: 'habits_triggers',
          categoryLabelKm: 'ទម្លាប់ផ្ទាល់ខ្លួន & កត្តាជំរុញ',
        },
        {
          questionNumber: 16,
          id: 'pillowcase',
          topicKm: 'ការប្តូរ/បោកស្រោមខ្នើយ',
          summaryKm: q16Summary,
          category: 'skin_contact_habits',
          categoryLabelKm: 'ទម្លាប់ប្រចាំថ្ងៃដែលប៉ះផ្ទាល់ជាមួយស្បែកមុខ',
        },
        {
          questionNumber: 17,
          id: 'face_drying',
          topicKm: 'ការជូតមុខក្រោយលាង',
          summaryKm: q18Summary,
          category: 'skin_contact_habits',
          categoryLabelKm: 'ទម្លាប់ប្រចាំថ្ងៃដែលប៉ះផ្ទាល់ជាមួយស្បែកមុខ',
        },
        ...(isUsingFaceTowel(answers) && q19Summary
          ? [
              {
                questionNumber: 18,
                id: 'towel_wash_freq',
                topicKm: 'ភាពញឹកញាប់បោកកន្សែង',
                summaryKm: q19Summary,
                category: 'skin_contact_habits' as const,
                categoryLabelKm: 'ទម្លាប់ប្រចាំថ្ងៃដែលប៉ះផ្ទាល់ជាមួយស្បែកមុខ',
              },
            ]
          : []),
        ...(q20Summary
          ? [
              {
                questionNumber: isUsingFaceTowel(answers) ? 19 : 18,
                id: 'exfoliation_freq',
                topicKm: 'ភាពញឹកញាប់ជម្រុះកោសិកា',
                summaryKm: q20Summary,
                category: 'exfoliation' as const,
                categoryLabelKm: 'ទម្លាប់ជម្រុះកោសិកាចាស់ៗ',
              },
            ]
          : []),
        ...(!isExfoliationFollowUpSkipped(answers) && q21Summary
          ? [
              {
                questionNumber: isUsingFaceTowel(answers) ? 20 : 19,
                id: 'exfoliation_feel',
                topicKm: 'អារម្មណ៍ស្បែកក្រោយជម្រុះ',
                summaryKm: q21Summary,
                category: 'exfoliation' as const,
                categoryLabelKm: 'ទម្លាប់ជម្រុះកោសិកាចាស់ៗ',
              },
            ]
          : []),
      ];

      return items.map((item, idx) => ({
        ...item,
        questionNumber: idx + 1,
      }));
    })(),
  };

  // --- SECTION 4: អ្វីដែលបងប្អូនគួរតែបញ្ឈប់ (What to Stop / Reduce / Pause) ---
  // Purely states what to stop/reduce/pause and the impact/harm on skin. NO SOLUTIONS HERE!
  const section4_reduce_pause: ClosedComedonesAnalysisResult['section4_reduce_pause'] = [];

  if (cleansing_irritation_factor === 'high') {
    section4_reduce_pause.push({
      id: 'rp_overwash',
      titleKm: 'កាត់បន្ថយការលាងមុខញឹកញាប់ពេក',
      detailKm:
        'ការលាងមុខលើសពី ២ ដងក្នុងមួយថ្ងៃ អាចធ្វើឱ្យស្បែកបាត់បង់សំណើមធម្មជាតិ និងបង្ខំឱ្យក្រពេញខ្លាញ់បញ្ចេញប្រេងកាន់តែច្រើន ដែលអាចធ្វើឱ្យមុនកប់ងាយកើនឡើង។',
      tagKm: 'កាត់បន្ថយ',
    });
  }

  if (active_product_factor === 'high' || active_product_factor === 'medium') {
    section4_reduce_pause.push({
      id: 'rp_actives',
      titleKm: 'ផ្អាកការបន្ថែម Active Products ថ្មីជាបណ្ដោះអាសន្ន',
      detailKm:
        'ការប្រើ ឬបន្ថែមសារធាតុជម្រុះកោសិកា ឬអាស៊ីតខ្លាំងច្រើនមុខក្នុងពេលតែមួយ អាចធ្វើឱ្យស្បែករងការរំខាន ក្រហម និងងាយប្រតិកម្ម។',
      tagKm: 'ផ្អាកបណ្ដោះអាសន្ន',
    });
  }

  if (picking_factor === 'high' || picking_factor === 'medium') {
    section4_reduce_pause.push({
      id: 'rp_picking',
      titleKm: 'កាត់បន្ថយការញិច ឬកេះមុន',
      detailKm:
        'ការកេះ ឬញិចមុនកប់ដោយក្រចកដៃ អាចបំផ្លាញជាលិកាស្បែក និងជំរុញឱ្យការកកស្ទះប្រែជាមុនរលាកក្រហមធំៗ និងបន្សល់ស្នាមជាំយូរអង្វែង។',
      tagKm: 'បញ្ឈប់',
    });
  }

  if (makeup_cleansing_factor === 'high' || makeup_cleansing_factor === 'medium') {
    section4_reduce_pause.push({
      id: 'rp_makeup_neglect',
      titleKm: 'កុំគេងទាំងមាន Makeup',
      detailKm:
        'ការគេងទាំងមានគ្រឿងសម្អាង ឬប្រើតែហ្វូមធម្មតាដោយមិនបានលុប Makeup ជ្រះស្អាត អាចធ្វើឱ្យសំណល់ម្សៅកកស្ទះក្នុងរន្ធញើសពេញមួយយប់។',
      tagKm: 'បញ្ឈប់',
    });
  }

  if (product_change_factor === 'high') {
    section4_reduce_pause.push({
      id: 'rp_new_product',
      titleKm: 'កុំប្តូរផលិតផលច្រើនមុខក្នុងពេលតែមួយ',
      detailKm:
        'ការប្តូរ ឬសាកល្បងផលិតផលថ្មីៗច្រើនមុខក្នុងពេលតែមួយ ធ្វើឱ្យស្បែកមិនមានពេលសម្របខ្លួន និងពិបាកកំណត់ថាផលិតផលណាដែលបង្កការកកស្ទះ។',
      tagKm: 'កាត់បន្ថយ',
    });
  }

  // Habits: Face drying towel caution
  const dryingMethod = answers.q18_face_drying || answers.q17_face_drying;
  if (dryingMethod === 'towel_reuse_multiple' || dryingMethod === 'shared_towel') {
    section4_reduce_pause.push({
      id: 'rp_towel_hygiene',
      titleKm: 'កុំប្រើកន្សែងមុខរួមជាមួយអ្នកដទៃ ឬកន្សែងដែលប្រើច្រើនដងមុនបោក',
      detailKm:
        'កន្សែងមុខដែលសើម និងប្រើច្រើនដង អាចផ្ទុកបាក់តេរីដែលអាចផ្ទេរមកលើស្បែកមុខក្រោយពេលលាងសម្អាត និងបង្កើនហានិភ័យនៃការរលាក។',
      tagKm: 'បញ្ឈប់',
    });
  }

  // Habits: Pillowcase change caution
  if (answers.q16_pillowcase === 'more_than_6_months' || answers.q16_pillowcase === 'about_once_a_month' || answers.q16_pillowcase === 'irregular') {
    section4_reduce_pause.push({
      id: 'rp_pillowcase',
      titleKm: 'កុំទុកស្រោមខ្នើយយូរពេកដោយមិនបានបោក ឬប្តូរ',
      detailKm:
        'ស្រោមខ្នើយស្រូបយកជាតិប្រេង ញើស និងកោសិកាចាស់ៗរាល់យប់ ដែលអាចបង្កើនការកកស្ទះលើស្បែកមុខពេលគេង។',
      tagKm: 'កាត់បន្ថយ',
    });
  }

  // Habits: Exfoliation caution (over-exfoliation)
  // 【ច្បាប់ភាពញឹកញាប់នៃការជម្រុះកោសិកាចាស់ៗ】
  // - ០–៣ ដងក្នុងមួយសប្តាហ៍៖ ចាត់ទុកថា "ធម្មតា" (frequency <= 3) ហើយមិនត្រូវបង្ហាញការព្រមាន ឬអនុសាសន៍ "កាត់បន្ថយការជម្រុះកោសិកា" ឡើយ។
  // - លើសពី ៣ ដងក្នុងមួយសប្តាហ៍ (គឺ ៤ ដង ឬច្រើនជាងនេះ, frequency > 3)៖ ទើបចាត់ទុកថា "ជម្រុះញឹកញាប់ពេក" ហើយទើបបង្ហាញអនុសាសន៍ "កាត់បន្ថយការជម្រុះកោសិកា"។
  // ព្រំដែនច្បាស់លាស់៖ frequency <= 3 គឺធម្មតា, frequency > 3 គឺញឹកញាប់ពេក (លក្ខខណ្ឌវិនិច្ឆ័យតែមួយគត់)។
  if (answers.q20_exfoliation_freq === 'more_than_three') {
    section4_reduce_pause.push({
      id: 'rp_over_exfoliation',
      titleKm: 'កាត់បន្ថយការជម្រុះកោសិកាចាស់ៗញឹកញាប់ពេក',
      detailKm:
        'ការខាត់ ឬជម្រុះកោសិកាចាស់ៗញឹកញាប់ពេកលើសពី ៣ ដងក្នុងមួយសប្ដាហ៍ (៤ ដង ឬច្រើនជាងនេះ) អាចបំផ្លាញស្រទាប់សំណើមធម្មជាតិ និងធ្វើឱ្យស្បែកស្តើងងាយរលាកក្រហម។',
      tagKm: 'កាត់បន្ថយ',
    });
  }

  // Follow-up Q9 adjustments (Makeup Remover)
  if (answers.q8_remover_feeling === 'clean_stings_eyes') {
    section4_reduce_pause.push({
      id: 'rp_remover_stings',
      titleKm: 'ប្តូរផលិតផល Remove Makeup ដែលធ្វើឱ្យក្រហាយភ្នែក',
      detailKm:
        'ផលិតផល Remove Makeup ដែលធ្វើឱ្យក្រហាយភ្នែក អាចមានជាតិកាត់ ឬក្លិនក្រអូបដែលមិនសមស្របនឹងស្បែកប្រតិកម្ម។ គួរប្តូរទៅប្រើផលិតផល Remove Makeup ស្រទន់បែបធម្មជាតិ គ្មានក្លិន វិញ។',
      tagKm: 'ត្រូវកែសម្រួល',
    });
  } else if (answers.q8_remover_feeling === 'unclean_residue') {
    section4_reduce_pause.push({
      id: 'rp_remover_residue',
      titleKm: 'បញ្ឈប់ការ Remove Makeup មិនស្អាត ឬនៅសល់សំណល់',
      detailKm:
        'សំណល់ makeup និងឡេការពារកម្តៅថ្ងៃដែលនៅសល់ក្នុងរន្ធញើស ជាមូលហេតុចម្បងដែលបង្កឱ្យស្ទះរន្ធញើស និងកើតមុន។ គួរប្តូរទៅប្រើផលិតផល Remove Makeup ដែលមានប្រសិទ្ធភាពខ្លាំងជាងមុន ឬប្រើវិធីសម្អាតពីរដង (Double Cleanse)។',
      tagKm: 'ត្រូវកែសម្រួល',
    });
  }

  // Follow-up adjustments (សំណួរទី៨. អារម្មណ៍ក្រោយប្រើផលិតផលទាំងនោះរួច)
  if (answers.q8_acne_treatment_feeling) {
    const selectedProdsTextKm = (() => {
      const prods = answers.q8_daily_products || [];
      const labelMap: Record<string, string> = {
        makeup_remover: 'Makeup Remover',
        cleanser: 'Cleanser (ហ្វូម/សាប៊ូលាងមុខ)',
        toner: 'Toner (ទឹកជូតមុខ)',
        serum: 'Serum (សេរ៉ូម)',
        moisturizer: 'Moisturizer (ឡេ/គ្រីមផ្ដល់សំណើម)',
        sunscreen: 'Sunscreen (ឡេការពារកម្ដៅថ្ងៃ)',
        aha_bha: 'AHA / BHA',
        retinol: 'Retinol',
        scrub: 'ម៉ាសធម្មជាតិ',
        acne_treatment: 'ផលិតផលព្យាបាលមុន',
        unsure: 'ផលិតផលមិនប្រាកដ',
      };
      const names = prods.map((p) => labelMap[p] || p).filter(Boolean);
      return names.length > 0 ? names.join(', ') : 'ផលិតផលបច្ចុប្បន្ន';
    })();

    if (answers.q8_acne_treatment_feeling === 'stings_dry_peeling') {
      section4_reduce_pause.push({
        id: 'rp_acne_treatment_stings',
        titleKm: `ត្រូវឈប់ប្រើផលិតផលព្យាបាលមុនដែលបានជ្រើសក្នុងសំណួរទី៧ (${selectedProdsTextKm})`,
        detailKm:
          `ត្រូវឱ្យអ្នកប្រើឈប់ប្រើផលិតផលព្យាបាលមុនដែលបានជ្រើសក្នុងសំណួរទី៧ (${selectedProdsTextKm}) ជាបន្ទាន់ ព្រោះផលិតផលកំពុងបង្កឱ្យស្បែកក្រហាយ ស្ងួតខ្លាំង ឬរបក។`,
        tagKm: 'ត្រូវបញ្ឈប់',
      });
    } else if (answers.q8_acne_treatment_feeling === 'ineffective') {
      section4_reduce_pause.push({
        id: 'rp_acne_treatment_ineffective',
        titleKm: `គួរតែឈប់ប្រើផលិតផលព្យាបាលមុនដែលបានជ្រើសក្នុងសំណួរទី៧ (${selectedProdsTextKm})`,
        detailKm:
          `គួរតែឱ្យអ្នកប្រើឈប់ប្រើផលិតផលព្យាបាលមុនដែលបានជ្រើសក្នុងសំណួរទី៧ (${selectedProdsTextKm}) ព្រោះផលិតផលបច្ចុប្បន្នមិនទាន់ឃើញប្រសិទ្ធភាពច្បាស់លាស់។`,
        tagKm: 'គួរតែឈប់ប្រើ',
      });
    } else if (
      answers.q8_acne_treatment_feeling === 'acne_increased' ||
      answers.q8_acne_treatment_feeling === 'ineffective_or_worse'
    ) {
      section4_reduce_pause.push({
        id: 'rp_acne_treatment_worse',
        titleKm: `ត្រូវឈប់ប្រើផលិតផលព្យាបាលមុនដែលបានជ្រើសក្នុងសំណួរទី៧ (${selectedProdsTextKm})`,
        detailKm:
          `ត្រូវឱ្យអ្នកប្រើឈប់ប្រើផលិតផលព្យាបាលមុនដែលបានជ្រើសក្នុងសំណួរទី៧ (${selectedProdsTextKm}) ជាបន្ទាន់ ព្រោះផលិតផលប្រហែលជាមិនសមស្រប ឬវិធីប្រើមិនត្រឹមត្រូវ ដែលបណ្តាលឱ្យមុនកើនឡើង។`,
        tagKm: 'ត្រូវបញ្ឈប់',
      });
    } else if (answers.q8_acne_treatment_feeling === 'itchy_rash_burn') {
      section4_reduce_pause.push({
        id: 'rp_acne_treatment_itchy_rash',
        titleKm: `ត្រូវឈប់ប្រើផលិតផលព្យាបាលមុនដែលបានជ្រើសក្នុងសំណួរទី៧ (${selectedProdsTextKm})`,
        detailKm:
          `ត្រូវឱ្យអ្នកប្រើឈប់ប្រើផលិតផលដែលបានជ្រើសក្នុងសំណួរទី៧ (${selectedProdsTextKm}) ជាបន្ទាន់ ព្រោះផលិតផលកំពុងបង្កឱ្យស្បែករមាស់ រោល រលាក ឬក្រហាយ។`,
        tagKm: 'ត្រូវបញ្ឈប់',
      });
    }
  }

  if (section4_reduce_pause.length === 0) {
    section4_reduce_pause.push({
      id: 'rp_general_gentle',
      titleKm: 'កុំជូត ឬត្រដុសស្បែកមុខខ្លាំងៗជាមួយកន្សែងរឹង',
      detailKm:
        'ការត្រដុសកកិតខ្លាំងលើផ្ទៃមុខ អាចបង្កការរលាកដល់ស្រទាប់ការពារស្បែក និងជំរុញឱ្យមុនកប់ប្រែជារលាកក្រហម។',
      tagKm: 'កាត់បន្ថយ',
    });
  }

  // --- SECTION 5: អ្វីដែលបងប្អូនគួរបន្ត (Positive Habits) ---
  const section5_continue: ClosedComedonesAnalysisResult['section5_continue'] = positive_habits.map((h) => ({
    id: h.id,
    titleKm: h.titleKm,
    detailKm: h.descriptionKm,
  }));

  if (dryingMethod === 'facial_tissue') {
    section5_continue.push({
      id: 'cont_tissue',
      titleKm: 'បន្តប្រើក្រដាសជូតមុខ (Facial Tissue) ជូតមុខថ្នមៗ',
      detailKm: 'ការប្រើក្រដាសជូតមុខស្អាតជួយកាត់បន្ថយការផ្ទេរមេរោគ និងបាក់តេរីពីកន្សែងសើមបានយ៉ាងល្អ។',
    });
  } else if (dryingMethod === 'clean_towel_face_only' && (answers.q19_towel_wash_freq === 'every_day' || answers.q19_towel_wash_freq === 'every_2_3_days')) {
    section5_continue.push({
      id: 'cont_clean_towel',
      titleKm: 'បន្តប្រើកន្សែងមុខផ្ទាល់ខ្លួន និងបោកគក់ទៀងទាត់',
      detailKm: 'ការបោកសម្អាតកន្សែងមុខញឹកញាប់ជួយការពារការកកើតបាក់តេរី និងរក្សាអនាម័យស្បែកមុខបានល្អ។',
    });
  }

  if (answers.q16_pillowcase === 'about_once_a_week') {
    section5_continue.push({
      id: 'cont_pillowcase',
      titleKm: 'បន្តរក្សាទម្លាប់បោក ឬប្តូរស្រោមខ្នើយទៀងទាត់ (ប្រហែល 1 ដងក្នុងមួយសប្ដាហ៍)',
      detailKm: 'នេះជាទម្លាប់ដ៏ល្អក្នុងការកាត់បន្ថយការប្រមូលផ្តុំប្រេង និងធូលីដែលប៉ះផ្ទាល់ជាមួយស្បែកមុខរាល់យប់។',
    });
  }

  if (
    (answers.q20_exfoliation_freq === 'once_a_week' ||
      answers.q20_exfoliation_freq === 'twice_a_week' ||
      answers.q20_exfoliation_freq === 'three_times_a_week') &&
    ((answers.q21_exfoliation_feel || []).includes('oil_reduction_smooth') ||
      (answers.q21_exfoliation_feel || []).includes('normal_no_issues'))
  ) {
    section5_continue.push({
      id: 'cont_exfoliation',
      titleKm: 'បន្តរក្សាទម្លាប់ជម្រុះកោសិកាក្នុងកម្រិតល្មមសមស្រប (១–៣ ដងក្នុងមួយសប្តាហ៍)',
      detailKm:
        'ការជម្រុះកោសិកាក្នុងកម្រិតល្មមធម្មតា (១–៣ ដងក្នុងមួយសប្តាហ៍) ជួយសម្អាតកោសិកាចាស់ៗដែលកកស្ទះក្នុងរន្ធញើស ដោយមិនរំខានរបាំងការពារស្បែកឡើយ។',
    });
  }

  // --- SECTION 6: អ្វីដែលបងប្អូនគួរធ្វើបន្ទាប់ទៀត (What to Do Next / Action Plan & Solutions) ---
  const lumimeiAcneSetTitle = 'ឈុតថែរក្សាមុខមុន Lumimei (ធំ)';
  const lumimeiAcneSetAction =
    'ព្រោះឈុតថែរក្សាមុខមុន Lumimei (ឈុតធំ) ជាជំនួយការដ៏ល្អសម្រាប់ស្បែកដែលមានបញ្ហា មុនកប់ និងមុនផ្សេងៗ ជួយថែរក្សា និងកែលម្អសភាពស្បែកឱ្យកាន់តែប្រសើរឡើង ប្រកបដោយប្រសិទ្ធភាពខ្ពស់។ 💗\n\nអ្វីដែលពិសេសនោះ គឺ មិនចាំបាច់ញិច ឬកេះមុនដោយខ្លួនឯងទេ ក៏អាចថែរក្សា និងជួយកែលម្អបញ្ហាមុនបានដែល។ \nជួយកាត់បន្ថយការរលាក និងកាត់បន្ថយហានិភ័យនៃការបន្សល់ស្នាមមុនយូរអង្វែងនៅលើស្បែក។';

  // MAPPING DICTIONARY: Maps each Stop Item ID to its corresponding Solution / Next Action
  const stopToNextActionMap: Record<string, { titleKm: string; actionKm: string }> = {
    rp_overwash: {
      titleKm: 'លាងមុខត្រឹមតែ 1-2 ដងក្នុងមួយថ្ងៃ ដោយប្រើ Gentle Cleanser',
      actionKm:
        'កែសម្រួលការលាងមុខមកត្រឹមតែ ១ ទៅ ២ ដងក្នុងមួយថ្ងៃ ដោយប្រើហ្វូម ឬសាប៊ូដុសមុខទន់ភ្លន់ដែលមិនធ្វើឱ្យស្បែកតឹងស្ងួតក្រោយលាង ដើម្បីជួយរក្សាតុល្យភាពសំណើមធម្មជាតិរបស់ស្បែក។',
    },
    rp_actives: {
      titleKm: 'ផ្ដោតលើការផ្តល់សំណើម និងពង្រឹង Skin Barrier ជាមុនសិន',
      actionKm:
        'ផ្អាកការបន្ថែម ឬសាកល្បងសារធាតុជម្រុះ និងអាស៊ីតថ្មីៗជាបណ្ដោះអាសន្ន ហើយផ្ដោតលើការផ្តល់ជាតិសំណើមទន់ស្រាល និងពង្រឹងរបាំងការពារស្បែកឱ្យរឹងមាំសិន។',
    },
    rp_picking: {
      titleKm: 'រក្សាទម្លាប់លាងដៃឲ្យស្អាត មុនពេលប៉ះផ្ទៃមុខ',
      actionKm:
        'លាងដៃជាមួយសាប៊ូឱ្យស្អាតជានិច្ចមុនពេលប៉ះមុខ ឬលាបផលិតផល និងជៀសវាងការយកដៃកេះ ញិច ឬច្របាច់គ្រាប់មុន ដើម្បីទុកឱ្យស្បែកស្ដារឡើងវិញដោយខ្លួនឯង។',
    },
    rp_makeup_neglect: {
      titleKm: 'សម្អាត Makeup ឱ្យបានជ្រះស្អាតដោយវិធី Double Cleansing',
      actionKm:
        'ប្រើប្រេងជូតសម្អាតមុខ (Cleansing Oil) ឬ Cleansing Water ជាជំហានទីមួយ រួចតាមដោយហ្វូមលាងមុខទន់ភ្លន់រាល់ពេលដែលបាន Makeup មុនចូលគេង។',
    },
    rp_new_product: {
      titleKm: 'រក្សា Routine បច្ចុប្បន្នឱ្យមានស្ថិរភាព',
      actionKm:
        'បន្តប្រើប្រាស់ផលិតផលមូលដ្ឋានដែលមិនធ្វើឱ្យស្បែករំខានឱ្យបានជាប់លាប់ ហើយប្រសិនបើចង់បន្ថែមផលិតផលថ្មី សូមសាកល្បងម្តងមួយមុខ និងរង់ចាំសង្កេតការប្រែប្រួលយ៉ាងតិច ២ សប្តាហ៍។',
    },
    rp_towel_hygiene: {
      titleKm: 'ប្តូរមកប្រើក្រដាសជូតមុខ (Facial Tissue) ឬកន្សែងស្អាតផ្ទាល់ខ្លួន',
      actionKm:
        'ប្តូរមកប្រើក្រដាសជូតមុខស្អាតផ្តិតថ្នមៗ ឬប្រើកន្សែងមុខផ្ទាល់ខ្លួនដែលបោកគក់ និងហាលថ្ងៃឱ្យស្ងួតទៀងទាត់រៀងរាល់ ២–៣ ថ្ងៃម្តង។',
    },
    rp_pillowcase: {
      titleKm: 'បោកគក់ ឬប្តូរស្រោមខ្នើយរៀងរាល់ ១–២ សប្តាហ៍ម្តង',
      actionKm:
        'ប្តូរ ឬបោកស្រោមខ្នើយឱ្យបានទៀងទាត់រៀងរាល់ ១ ទៅ ២ សប្តាហ៍ម្តង ដើម្បីកាត់បន្ថយការប្រមូលផ្តុំប្រេង និងធូលីដែលប៉ះផ្ទាល់ជាមួយស្បែកមុខរាល់យប់។',
    },
    rp_over_exfoliation: {
      titleKm: 'កែសម្រួលការជម្រុះកោសិកាមកត្រឹមតែ ១–៣ ដងក្នុងមួយសប្ដាហ៍ ឬផ្អាកបណ្ដោះអាសន្ន',
      actionKm:
        'ផ្អាកការខាត់ស្បែក ឬប្រើអាស៊ីតខ្លាំងៗជាបណ្ដោះអាសន្ន ហើយកាត់បន្ថយមកត្រឹមមិនលើសពី ៣ ដងក្នុងមួយសប្ដាហ៍ (ណែនាំ ១–៣ ដង) ឬរង់ចាំរហូតដល់របាំងការពារស្បែករឹងមាំឡើងវិញ។',
    },
    rp_general_gentle: {
      titleKm: 'ផ្តិតថ្នមៗពេលសម្អាតមុខ ដោយមិនត្រដុសកកិតខ្លាំង',
      actionKm:
        'ប្រើក្រដាសជូតមុខ ឬកន្សែងទន់ផ្តិតថ្នមៗស្រូបយកសំណើមក្រោយលាងមុខ ដោយជៀសវាងការត្រដុសកកិតខ្លាំងលើផ្ទៃមុខ។',
    },
    rp_remover_stings: {
      titleKm: 'ឈុតលាងមុខ៣តង់',
      actionKm:
        'ក្នុងឈុតមាន៖\n' +
        'Lumimei ម៉ាសអង្ករ សម្រាប់ ជម្រុះកោសិកាចាស់ៗ\n' +
        'Lumimei ប្រេងដូង សម្រាប់ជួយ remove makeup\n' +
        'Lumimei សាប៊ូលាងមុខ សម្រាប់លាងសម្អាតស្បែកមុខបន្ថែម\n\n' +
        'អត្ថប្រយោជន៍ដែលអ្នកនឹងទទួលបាន៖\n' +
        'ជួយទៅបឺតជាតិពុល ជម្រុះកោសិកាចាស់ៗ\n' +
        'ជួយ remove makeup បានស្អាតល្អ\n' +
        'ជួយកម្ចាត់សំណល់ makeup និង ភាពកខ្វក់លើផ្ទៃមុខ\n' +
        'ជួយថែរក្សាស្បែកដែលងាយកើតមុន\n' +
        'ជួយឱ្យស្បែកមើលទៅម៉ត់រលោង និងរន្ធញើសមើលទៅតូចជាងមុន\n' +
        'ជួយផ្តល់សំណើមដល់ស្បែក\n' +
        'មិនធ្វើឲ្យក្រហាយភ្នែក រលាក រមាស់ស្បែកឡើយ\n\n' +
        'សាកសមសម្រាប់អ្នកដែលចូលចិត្ត Makeup និង remove makeup តាមបែបធម្មជាតិ',
    },
    rp_remover_residue: {
      titleKm: 'ឈុតលាងមុខ៣តង់',
      actionKm:
        'ក្នុងឈុតមាន៖\n' +
        'Lumimei ម៉ាសអង្ករ សម្រាប់ ជម្រុះកោសិកាចាស់ៗ\n' +
        'Lumimei ប្រេងដូង សម្រាប់ជួយ remove makeup\n' +
        'Lumimei សាប៊ូលាងមុខ សម្រាប់លាងសម្អាតស្បែកមុខបន្ថែម\n\n' +
        'អត្ថប្រយោជន៍ដែលអ្នកនឹងទទួលបាន៖\n' +
        'ជួយទៅបឺតជាតិពុល ជម្រុះកោសិកាចាស់ៗ\n' +
        'ជួយ remove makeup បានស្អាតល្អ\n' +
        'ជួយកម្ចាត់សំណល់ makeup និង ភាពកខ្វក់លើផ្ទៃមុខ\n' +
        'ជួយថែរក្សាស្បែកដែលងាយកើតមុន\n' +
        'ជួយឱ្យស្បែកមើលទៅម៉ត់រលោង និងរន្ធញើសមើលទៅតូចជាងមុន\n' +
        'ជួយផ្តល់សំណើមដល់ស្បែក\n' +
        'មិនធ្វើឲ្យក្រហាយភ្នែក រលាក រមាស់ស្បែកឡើយ\n\n' +
        'សាកសមសម្រាប់អ្នកដែលចូលចិត្ត Makeup និង remove makeup តាមបែបធម្មជាតិ',
    },
    rp_acne_treatment_stings: {
      titleKm: 'តាមដានស្ថានភាពស្បែក ៥–១៥ ថ្ងៃ (ចូលទៅ "បន្តតាមដាន" ក្នុងគណនីខ្ញុំ)',
      actionKm:
        'រយៈពេលតាមដានប្តូរទៅ ៥-១៥ ថ្ងៃ បន្ទាប់មកទៀត ណែនាំឱ្យអ្នកប្រើ ចូលទៅ "បន្តតាមដាន" ដែលមានក្នុងគណនីខ្ញុំ បន្ថែមទៀត ដើម្បីតាមដានការស្តារឡើងវិញនៃស្បែក។',
    },
    rp_acne_treatment_itchy_rash: {
      titleKm: 'តាមដានស្ថានភាពស្បែក ៥–១៥ ថ្ងៃ (ចូលទៅ "បន្តតាមដាន" ក្នុងគណនីខ្ញុំ)',
      actionKm:
        'រយៈពេលតាមដានប្តូរទៅ ៥-១៥ ថ្ងៃ បន្ទាប់មកទៀត ណែនាំឱ្យអ្នកប្រើ ចូលទៅ "បន្តតាមដាន" ដែលមានក្នុងគណនីខ្ញុំ បន្ថែមទៀត ដើម្បីតាមដានការស្តារឡើងវិញនៃស្បែក។',
    },
    rp_acne_treatment_ineffective: {
      titleKm: lumimeiAcneSetTitle,
      actionKm: lumimeiAcneSetAction,
    },
    rp_acne_treatment_worse: {
      titleKm: lumimeiAcneSetTitle,
      actionKm: lumimeiAcneSetAction,
    },
  };

  const section6_next_steps: ClosedComedonesAnalysisResult['section6_next_steps'] = [];
  let nextStepCounter = 1;
  const addedTitles = new Set<string>();

  const wearsMakeupOrSunscreen =
    (answers.q9_makeup_freq && answers.q9_makeup_freq !== 'none') ||
    (answers.q8_daily_products || []).includes('sunscreen') ||
    (answers.q8_daily_products || []).includes('foundation') ||
    (answers.q8_daily_products || []).includes('cushion') ||
    (answers.q14_aggravating_factors || []).includes('after_makeup');

  // Determine primary product recommendation for "អ្វីដែលបងប្អូនគួរធ្វើបន្ទាប់ទៀត"
  const isStingsDryPeeling =
    answers.q8_acne_treatment_feeling === 'stings_dry_peeling' ||
    answers.q8_acne_treatment_feeling === 'itchy_rash_burn';

  const isRemoverIssue =
    answers.q8_remover_feeling === 'clean_stings_eyes' ||
    answers.q8_remover_feeling === 'unclean_residue';

  const tripleCleanseTitle = 'ឈុតលាងមុខ៣តង់';
  const tripleCleanseActionText =
    'ក្នុងឈុតមាន៖\n' +
    'Lumimei ម៉ាសអង្ករ សម្រាប់ ជម្រុះកោសិកាចាស់ៗ\n' +
    'Lumimei ប្រេងដូង សម្រាប់ជួយ remove makeup\n' +
    'Lumimei សាប៊ូលាងមុខ សម្រាប់លាងសម្អាតស្បែកមុខបន្ថែម\n\n' +
    'អត្ថប្រយោជន៍ដែលអ្នកនឹងទទួលបាន៖\n' +
    'ជួយទៅបឺតជាតិពុល ជម្រុះកោសិកាចាស់ៗ\n' +
    'ជួយ remove makeup បានស្អាតល្អ\n' +
    'ជួយកម្ចាត់សំណល់ makeup និង ភាពកខ្វក់លើផ្ទៃមុខ\n' +
    'ជួយថែរក្សាស្បែកដែលងាយកើតមុន\n' +
    'ជួយឱ្យស្បែកមើលទៅម៉ត់រលោង និងរន្ធញើសមើលទៅតូចជាងមុន\n' +
    'ជួយផ្តល់សំណើមដល់ស្បែក\n' +
    'មិនធ្វើឲ្យក្រហាយភ្នែក រលាក រមាស់ស្បែកឡើយ\n\n' +
    'សាកសមសម្រាប់អ្នកដែលចូលចិត្ត Makeup និង remove makeup តាមបែបធម្មជាតិ';

  let primaryProductTitle = lumimeiAcneSetTitle;
  let primaryProductAction = lumimeiAcneSetAction;

  if (isRemoverIssue) {
    primaryProductTitle = tripleCleanseTitle;
    primaryProductAction = tripleCleanseActionText;
  } else if (isStingsDryPeeling) {
    primaryProductTitle = 'Lumimei សេរ៉ូម';
    primaryProductAction =
      'ព្រោះថា Lumimei សេរ៉ូម អាចជួយផ្ដល់សំណើមដល់ស្បែកមុខបងប្អូនពេញមួយថ្ងៃ ជួយកាត់បន្ថយស្បែកមុខស្ងួត តឹង និងរបក។\n\nសាកសមបំផុតចំពោះបងប្អូនដែលចង់ផ្ដល់សំណើមដល់ស្បែក អំឡុងពេលដែលមុខបងប្អូនឡើងមុន បងប្អូនមានស្បែកមុខងាយប្រតិកម្ម បងប្អូនមានមុខស្ដើង សរសៃក្រហម មុខខូចរបាំងការពារស្បែក គឺពូកែបំផុត ព្រោះ Lumimei សេរ៉ូម មិនត្រឹមតែអាចជួយផ្ដល់សំណើមដល់ស្បែកពេញមួយថ្ងៃនោះទេ តែក៏អាចជួយទៅព្យាបាលមុន ពង្រឹងរបាំងការពារស្បែកឲ្យបានរឹងមាំ ជួយបណ្ដុះកោសិកាថ្មីៗផងដែរ។';
  } else if (wearsMakeupOrSunscreen) {
    primaryProductTitle = 'ឈុតថែរក្សាមុខមុន Lumimei (ធំ)';
    primaryProductAction =
      'ណែនាំប្រើប្រាស់ ឈុតថែរក្សាមុខមុន Lumimei (ធំ) ដែលរួមមាន Lumimei ម៉ាសអង្ករ, Lumimei សេរ៉ូម, Lumimei ប្រេងដូង និង Lumimei សាប៊ូ។ ព្រោះឈុតថែរក្សាមុខមុន Lumimei (ឈុតធំ) ជាជំនួយការដ៏ល្អសម្រាប់ស្បែកដែលមានបញ្ហា មុនកប់ និងមុនផ្សេងៗ ជួយថែរក្សា និងកែលម្អសភាពស្បែកឱ្យកាន់តែប្រសើរឡើង ប្រកបដោយប្រសិទ្ធភាពខ្ពស់។ 💗\n\nអ្វីដែលពិសេសនោះ គឺ មិនចាំបាច់ញិច ឬកេះមុនដោយខ្លួនឯងទេ ក៏អាចថែរក្សា និងជួយកែលម្អបញ្ហាមុនបានដែល។ \nជួយកាត់បន្ថយការរលាក និងកាត់បន្ថយហានិភ័យនៃការបន្សល់ស្នាមមុនយូរអង្វែងនៅលើស្បែក។';
  } else {
    primaryProductTitle = 'ឈុតថែរក្សាមុខមុន Lumimei (តូច)';
    primaryProductAction =
      'ណែនាំប្រើប្រាស់ ឈុតថែរក្សាមុខមុន Lumimei (តូច) ដែលរួមមាន Lumimei ម៉ាសអង្ករ និង Lumimei សេរ៉ូម ដើម្បីជួយជម្រុះកោសិកាងាប់ៗ បឺតស្រូបជាតិខ្លាញ់កកស្ទះ និងផ្ដល់សំណើមជ្រៅ ជួយព្យាបាលមុនកប់ឱ្យឆាប់រលាយ និងពង្រឹងរបាំងការពារស្បែកឱ្យរឹងមាំ ដោយមិនបាច់ញិច ឬកេះមុនដោយខ្លួនឯងឡើយ។';
  }

  section6_next_steps.push({
    stepNumber: nextStepCounter++,
    titleKm: primaryProductTitle,
    actionKm: primaryProductAction,
  });
  addedTitles.add(primaryProductTitle);

  // If both remover issue AND stinging/irritation are reported, also recommend Lumimei សេរ៉ូម for barrier repair
  if (isRemoverIssue && isStingsDryPeeling) {
    const serumStepTitle = 'Lumimei សេរ៉ូម សម្រាប់ផ្ដល់សំណើម និងស្ដាររបាំងការពារស្បែក';
    if (!addedTitles.has(serumStepTitle)) {
      addedTitles.add(serumStepTitle);
      section6_next_steps.push({
        stepNumber: nextStepCounter++,
        titleKm: serumStepTitle,
        actionKm:
          'ព្រោះថា Lumimei សេរ៉ូម អាចជួយផ្ដល់សំណើមដល់ស្បែកមុខបងប្អូនពេញមួយថ្ងៃ ជួយកាត់បន្ថយស្បែកមុខស្ងួត តឹង និងរបក។\n\nសាកសមបំផុតចំពោះបងប្អូនដែលចង់ផ្ដល់សំណើមដល់ស្បែក អំឡុងពេលដែលមុខបងប្អូនឡើងមុន បងប្អូនមានស្បែកមុខងាយប្រតិកម្ម បងប្អូនមានមុខស្ដើង សរសៃក្រហម មុខខូចរបាំងការពារស្បែក គឺពូកែបំផុត ព្រោះ Lumimei សេរ៉ូម មិនត្រឹមតែអាចជួយផ្ដល់សំណើមដល់ស្បែកពេញមួយថ្ងៃនោះទេ តែក៏អាចជួយទៅព្យាបាលមុន ពង្រឹងរបាំងការពារស្បែកឲ្យបានរឹងមាំ ជួយបណ្ដុះកោសិកាថ្មីៗផងដែរ។',
      });
    }
  }

  // 1. Add corresponding solution actions for all displayed stop items (What to do instead & how to adjust habits)
  for (const rp of section4_reduce_pause) {
    const actionPlan = stopToNextActionMap[rp.id];
    if (actionPlan && !addedTitles.has(actionPlan.titleKm)) {
      addedTitles.add(actionPlan.titleKm);
      section6_next_steps.push({
        stepNumber: nextStepCounter++,
        titleKm: actionPlan.titleKm,
        actionKm: actionPlan.actionKm,
      });
    }
  }

  // 2. Ensure barrier and hydration priority is included if not yet present (What to do first)
  const barrierTitle = 'ផ្ដោតលើការផ្តល់សំណើម និងពង្រឹង Skin Barrier ជាមុនសិន';
  if (!addedTitles.has(barrierTitle)) {
    addedTitles.add(barrierTitle);
    section6_next_steps.push({
      stepNumber: nextStepCounter++,
      titleKm: barrierTitle,
      actionKm:
        'ផ្តល់ជាតិសំណើមទន់ស្រាល និងរក្សាជាតិទឹកឱ្យស្បែកមានតុល្យភាព ដើម្បីជួយឱ្យរន្ធញើសសម្រាក និងមិនបញ្ចេញជាតិប្រេងលើស។',
    });
  }

  // 3. Keep good habits step if user has existing positive habits
  if (section5_continue.length > 0) {
    const goodHabitTitle = 'រក្សាទម្លាប់ល្អៗដែលបងប្អូនកំពុងអនុវត្តឱ្យបានខ្ជាប់ខ្ជួន';
    if (!addedTitles.has(goodHabitTitle)) {
      addedTitles.add(goodHabitTitle);
      section6_next_steps.push({
        stepNumber: nextStepCounter++,
        titleKm: goodHabitTitle,
        actionKm:
          'បន្តរក្សាទម្លាប់វិជ្ជមានដែលបងប្អូនកំពុងអនុវត្តបានល្អ (ដូចជា ការការពារកម្តៅថ្ងៃ ការផឹកទឹកគ្រប់គ្រាន់ ឬអនាម័យស្បែកល្អ) ដើម្បីទ្រទ្រង់សុខភាពស្បែកយូរអង្វែង។',
      });
    }
  }

  // 4. Add step on tracking comedones progress over 2-4 weeks (What to track)
  const trackingTitle = 'បន្តតាមដានការវិវត្តរបស់មុនកប់ក្នុងរយៈពេល 2-4 សប្ដាហ៍ខាងមុខ';
  if (!addedTitles.has(trackingTitle)) {
    addedTitles.add(trackingTitle);
    section6_next_steps.push({
      stepNumber: nextStepCounter++,
      titleKm: trackingTitle,
      actionKm:
        'ដំណើរការផ្លាស់ប្តូរកោសិកាស្បែក (Skin cell turnover) ត្រូវការពេលប្រមាណ ២៨ ថ្ងៃ។ សូមតាមដានការប្រែប្រួលរបស់គ្រាប់មុនកប់ និងសង្កេតមើលថាតើស្បែកមានភាពរលោង និងថយចុះការរំខានដែរឬទេ។',
    });
  }

  // 5. Add expert consultation step (Consult expert if not improving)
  const consultTitle = 'ពិគ្រោះជាមួយអ្នកជំនាញបន្ថែម ប្រសិនបើសភាពស្បែកមិនមានភាពប្រសើរឡើង';
  if (!addedTitles.has(consultTitle)) {
    addedTitles.add(consultTitle);
    section6_next_steps.push({
      stepNumber: nextStepCounter++,
      titleKm: consultTitle,
      actionKm:
        'ប្រសិនបើអនុវត្តតាមទម្លាប់ថ្មី ២–៤ សប្តាហ៍ហើយ នៅតែមិនទាន់ឃើញការផ្លាស់ប្តូរវិជ្ជមាន ឬមានសញ្ញារលាកកាន់តែខ្លាំង សូមពិគ្រោះជាមួយអ្នកជំនាញស្បែក Lumimei ដើម្បីទទួលបានការវាយតម្លៃលម្អិតបន្ថែម។',
    });
  }

  // ==========================================================================
  // SECTION 7: ផលិតផល LUMIMEI ដែលសាកសមសម្រាប់ស្បែកមុខរបស់បងប្អូន
  // Strictly based on what is recommended in Section 5 (អ្វីដែលបងប្អូនគួរបន្តធ្វើ)
  // and Section 6 (អ្វីដែលបងប្អូនគួរធ្វើបន្ទាប់ទៀត). Do NOT recommend randomly.
  // ==========================================================================

  // Irritation check: High irritation / barrier compromise
  const isHighIrritation =
    cleansing_irritation_factor === 'high' ||
    irritation_signs.length >= 2 ||
    irritation_signs.includes('ក្រហម ឬចាក់ៗលើស្បែក') ||
    answers.q12_post_wash_feeling === 'red_stinging' ||
    (answers.q15_warning_signs || []).includes('red_burning_pain') ||
    (answers.q21_exfoliation_feel || []).includes('stinging_burning') ||
    (answers.q21_exfoliation_feel || []).includes('peeling');

  // Severe medical / out-of-scope triggers (cystic acne, severe infection, etc.)
  const hasSevereMedicalConcern =
    (answers.q15_warning_signs || []).includes('large_cystic_painful') ||
    (answers.q15_warning_signs || []).includes('many_bumps_itchy') ||
    (answers.q15_warning_signs || []).includes('red_burning_pain');

  // Combine all texts proposed in Section 5 (អ្វីដែលបងប្អូនគួរបន្តធ្វើ) and Section 6 (អ្វីដែលបងប្អូនគួរធ្វើបន្ទាប់ទៀត)
  const allProposedText = [
    ...section5_continue.map((item) => `${item.titleKm} ${item.detailKm}`),
    ...section6_next_steps.map((item) => `${item.titleKm} ${item.actionKm}`),
  ].join(' ');

  const hasRiceMask = allProposedText.includes('ម៉ាសអង្ករ');
  const hasSerum = allProposedText.includes('សេរ៉ូម');
  const hasCoconutOil = allProposedText.includes('ប្រេងដូង');
  const hasSoap = allProposedText.includes('សាប៊ូ');

  const hasLargeSet =
    allProposedText.includes('ឈុតថែរក្សាមុខមុន Lumimei (ធំ)') ||
    (hasRiceMask && hasSerum && hasCoconutOil && hasSoap);

  const hasTripleCleanseSet =
    allProposedText.includes('ឈុតលាងមុខ៣តង់') ||
    allProposedText.includes('ឈុតលាងមុខ ៣តង់') ||
    (hasRiceMask && hasCoconutOil && hasSoap && !hasSerum);

  const hasSmallSet =
    allProposedText.includes('ឈុតថែរក្សាមុខមុន Lumimei (តូច)') ||
    (hasRiceMask && hasSerum && !hasCoconutOil && !hasSoap);

  const hasDoubleCleanseSet =
    allProposedText.includes('ឈុតលាងមុខ ២តង់') ||
    allProposedText.includes('ឈុតលាងមុខ ២ តង់') ||
    (hasCoconutOil && hasSoap && !hasRiceMask && !hasSerum);

  const hasSerumOnly =
    allProposedText.includes('Lumimei សេរ៉ូម') ||
    (hasSerum && !hasRiceMask && !hasCoconutOil && !hasSoap);

  let recommendedProducts: SuitableProductItem[] = [];

  if (!hasSevereMedicalConcern) {
    if (hasLargeSet) {
      // 1. If ម៉ាសអង្ករ, សេរ៉ូម, ប្រេងដូង, សាប៊ូ are recommended -> ឈុតថែរក្សាមុខមុន Lumimei (ធំ)
      recommendedProducts = [{ id: 'p1', customNameKm: 'ឈុតថែរក្សាមុខមុន Lumimei (ធំ)' }];
    } else if (hasTripleCleanseSet) {
      // If ម៉ាសអង្ករ, ប្រេងដូង, សាប៊ូ (or ឈុតលាងមុខ៣តង់) are recommended -> ឈុតលាងមុខ៣តង់
      recommendedProducts = [{ id: 'p6', customNameKm: 'ឈុតលាងមុខ៣តង់' }];
    } else if (hasSmallSet) {
      // 2. If ម៉ាសអង្ករ, សេរ៉ូម are recommended -> ឈុតថែរក្សាមុខមុន Lumimei (តូច)
      recommendedProducts = [{ id: 'p2', customNameKm: 'ឈុតថែរក្សាមុខមុន Lumimei (តូច)' }];
    } else if (hasDoubleCleanseSet) {
      // 3. If ប្រេងដូង, សាប៊ូ are recommended -> ឈុតលាងមុខ ២តង់
      recommendedProducts = [{ id: 'p3', customNameKm: 'ឈុតលាងមុខ ២តង់' }];
    } else if (hasSerumOnly) {
      // 4. If only Lumimei សេរ៉ូម is recommended
      recommendedProducts = [{ id: 'p2', customNameKm: 'Lumimei សេរ៉ូម' }];
    } else if (hasCoconutOil && !hasRiceMask && !hasSoap && !hasSerum) {
      recommendedProducts = [{ id: 'p3', customNameKm: 'Lumimei ប្រេងដូង' }];
    } else if (hasSoap && !hasRiceMask && !hasCoconutOil && !hasSerum) {
      recommendedProducts = [{ id: 'p4', customNameKm: 'Lumimei សាប៊ូ (៣ដុំ)' }];
    }
  }

  // Directions based on recommended products
  const productDirectionsKm: Array<{ categoryKm: string; adviceKm: string }> = [];

  if (recommendedProducts.some((p) => p.id === 'p1')) {
    productDirectionsKm.push({
      categoryKm: 'ឈុតថែរក្សាមុខមុន Lumimei (ធំ)',
      adviceKm:
        'ប្រើប្រាស់ប្រេងដូង និងសាប៊ូសម្រាប់ Double Cleanse សម្អាតរន្ធញើស បិទម៉ាសអង្ករ ១–២ ដងក្នុងមួយសប្ដាហ៍ រួចលាបសេរ៉ូមផ្ដល់សំណើម និងពង្រឹងរបាំងការពារស្បែកជារៀងរាល់ថ្ងៃ។',
    });
  } else if (recommendedProducts.some((p) => p.id === 'p6' || p.customNameKm === 'ឈុតលាងមុខ៣តង់')) {
    productDirectionsKm.push({
      categoryKm: 'ឈុតលាងមុខ៣តង់',
      adviceKm:
        'ប្រើប្រេងដូងម៉ាស្សាថ្នមៗដើម្បី remove makeup និងកម្ចាត់កាកសំណល់ លាងសម្អាតបន្ថែមជាមួយសាប៊ូ និងបិទម៉ាសអង្ករ ១–២ ដងក្នុងមួយសប្ដាហ៍ ដើម្បីជម្រុះកោសិកាចាស់ៗ និងបឺតជាតិពុល។',
    });
  } else if (recommendedProducts.some((p) => p.id === 'p2' && p.customNameKm === 'ឈុតថែរក្សាមុខមុន Lumimei (តូច)')) {
    productDirectionsKm.push({
      categoryKm: 'ឈុតថែរក្សាមុខមុន Lumimei (តូច)',
      adviceKm:
        'បិទម៉ាសអង្ករ ១៥ នាទី ១–២ ដងក្នុងមួយសប្តាហ៍ ដើម្បីជម្រុះកោសិកាងាប់ៗ និងលាប Lumimei សេរ៉ូម ២–៣ ដំណក់ព្រឹក-ល្ងាច ដើម្បីផ្ដល់សំណើម និងកាត់បន្ថយមុន។',
    });
  } else if (recommendedProducts.some((p) => p.id === 'p2')) {
    productDirectionsKm.push({
      categoryKm: 'Lumimei សេរ៉ូម',
      adviceKm:
        'លាប ២–៣ ដំណក់លើផ្ទៃមុខស្អាតព្រឹក-ល្ងាច ដើម្បីផ្ដល់សំណើមពេញមួយថ្ងៃ ជួយកាត់បន្ថយស្បែកស្ងួត តឹង ក្រហាយ និងរបក។',
    });
  } else if (recommendedProducts.some((p) => p.id === 'p3')) {
    productDirectionsKm.push({
      categoryKm: 'ឈុតលាងមុខ ២តង់',
      adviceKm:
        'ប្រើប្រេងដូងម៉ាស្សាថ្នមៗលើស្បែកស្ងួត ដើម្បីរំលាយ makeup និងកាកសំណល់ រួចលាងសម្អាតជាមួយសាប៊ូ ដើម្បីឱ្យរន្ធញើសស្អាតស៊ីជម្រៅ។',
    });
  } else if (recommendedProducts.some((p) => p.id === 'p4')) {
    productDirectionsKm.push({
      categoryKm: 'Lumimei សាប៊ូ (៣ដុំ)',
      adviceKm:
        'ដុសសាប៊ូជាមួយទឹកឱ្យកើតពពុះ រួចម៉ាស្សាថ្នមៗលើផ្ទៃមុខ ១–២ ដងក្នុងមួយថ្ងៃ រួចលាងទឹកចេញឱ្យស្អាត។',
    });
  }

  // Out of Scope / No Force Recommendation Notice
  let outOfScopeNoticeKm: string | undefined = undefined;
  if (hasSevereMedicalConcern || recommendedProducts.length === 0) {
    if (hasSevereMedicalConcern) {
      // Clear recommended products list - do not force recommend products!
      recommendedProducts.length = 0;
    }
    outOfScopeNoticeKm =
      'បញ្ហានេះមិនស្ថិតក្នុងវិសាលភាព功效ផលិតផល Lumimei ដែលបានកំណត់សម្រាប់ប្រព័ន្ធនេះទេ។ សូមទាក់ទងបុគ្គលិក Lumimei ដើម្បីទទួលបានការណែនាំបន្ថែម។';
  }

  const recommendedProductIds = recommendedProducts.map((p) => p.id);

  let professionalReviewNotice: { titleKm: string; bodyKm: string } | undefined = undefined;
  if (professional_review_flag) {
    professionalReviewNotice = {
      titleKm: 'ការណែនាំពិសេសពី Lumimei (Professional Review Notice)',
      bodyKm:
        'តាមព័ត៌មានដែលបងប្អូនបានផ្តល់ បច្ចុប្បន្នមិនមែនមានតែមុនកប់ប៉ុណ្ណោះទេ។ មានសញ្ញាមួយចំនួនដែលគួរត្រូវបានវាយតម្លៃបន្ថែម។ Lumimei ណែនាំឲ្យបងប្អូនពិចារណាពិគ្រោះជាមួយអ្នកជំនាញស្បែក មុននឹងបន្ថែមផលិតផល Active ថ្មីៗ។',
    };
  }

  const analysisObject: ComedonesAnalysisObject = {
    comedone_type,
    comedone_amount,
    comedone_extent,
    duration_level,
    trend_level,
    inflammation_level,
    product_change_factor,
    cleansing_irritation_factor,
    active_product_factor,
    makeup_cleansing_factor,
    picking_factor,
    irritation_signs,
    observed_patterns,
    professional_review_flag,
    findings,
    priorities,
    positive_habits,
  };

  // Rule: If user selects 3 or more "មិនប្រាកដ" (unsure) answers across all questions,
  // do NOT perform any automated analysis. Guide user directly to Telegram specialist consultation.
  const activeQuestionsForUnsure = getActiveComedonesQuestions(answers);
  let unsureCount = 0;
  for (const q of activeQuestionsForUnsure) {
    const val = answers[q.id];
    if (val === 'unsure') {
      unsureCount++;
    } else if (Array.isArray(val) && val.includes('unsure')) {
      unsureCount++;
    }
  }
  const isUnsureThresholdExceeded = unsureCount >= 3;

  if (isUnsureThresholdExceeded) {
    return {
      isUnsureThresholdExceeded: true,
      unsureCount,
      analysisObject,
      section1_summary: {
        ...section1_summary,
        badgeLabelKm: 'ត្រូវការពិគ្រោះយោបល់ផ្ទាល់ជាមួយអ្នកជំនាញ',
        badgeColor: 'amber',
      },
      section2_all_findings: [],
      section3_priorities: [],
      section4_reduce_pause: [],
      section5_continue: [],
      section6_next_steps: [],
      section7_products: {
        productDirectionsKm: [],
        recommendedProductIds: [],
        recommendedProducts: [],
      },
    };
  }

  return {
    isUnsureThresholdExceeded: false,
    unsureCount,
    analysisObject,
    section1_summary,
    section2_all_findings: findings,
    section3_priorities: priorities,
    section4_reduce_pause,
    section5_continue,
    section6_next_steps,
    section7_products: {
      professionalReviewNotice,
      outOfScopeNoticeKm,
      productDirectionsKm,
      recommendedProductIds,
      recommendedProducts,
    },
  };
}

/**
 * Counts how many active questions have 'unsure' (មិនប្រាកដ) selected.
 */
export function countUnsureAnswers(answers: ClosedComedonesAnswers): number {
  const activeQuestions = getActiveComedonesQuestions(answers);
  let count = 0;
  for (const q of activeQuestions) {
    const val = answers[q.id];
    if (val === 'unsure') {
      count++;
    } else if (Array.isArray(val) && val.includes('unsure')) {
      count++;
    }
  }
  return count;
}

// ============================================================================
// 8. BASELINE STORAGE & FOLLOW-UP / RE-ANALYSIS COMPARISON
// ============================================================================

export interface ComedonesBaselineRecord {
  savedAt: string; // ISO string
  answers: ClosedComedonesAnswers;
  analysisObject: ComedonesAnalysisObject;
}

export interface ComedonesComparisonResult {
  hasBaseline: boolean;
  baselineDate: string;
  improvements: string[];
  stableAspects: string[];
  worsenedAspects: string[];
  resolvedFindings: string[];
  newFindings: string[];
  improvedHabits: string[];
  continueAdvice: string[];
  adjustAdvice: string[];
}

const BASELINE_LOCAL_STORAGE_KEY = 'lumimei_comedones_baseline_record';

/**
 * Saves analysis as initial Baseline to localStorage.
 */
export function saveComedonesBaseline(
  answers: ClosedComedonesAnswers,
  analysisObject: ComedonesAnalysisObject,
  savedAt?: string
): void {
  try {
    const record: ComedonesBaselineRecord = {
      savedAt: savedAt ? new Date(savedAt).toISOString() : new Date().toISOString(),
      answers,
      analysisObject,
    };
    localStorage.setItem(BASELINE_LOCAL_STORAGE_KEY, JSON.stringify(record));
  } catch (err) {
    console.error('Failed to save comedones baseline:', err);
  }
}

/**
 * Retrieves the stored baseline record.
 */
export function getComedonesBaseline(): ComedonesBaselineRecord | null {
  try {
    const raw = localStorage.getItem(BASELINE_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ComedonesBaselineRecord;
  } catch (err) {
    console.error('Failed to load comedones baseline:', err);
    return null;
  }
}

/**
 * Clears the baseline record (for reset / new customer).
 */
export function clearComedonesBaseline(): void {
  try {
    localStorage.removeItem(BASELINE_LOCAL_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear baseline:', err);
  }
}

/**
 * Compares current analysis with stored Baseline.
 */
export function compareComedonesWithBaseline(
  currentAnalysis: ComedonesAnalysisObject,
  baseline: ComedonesBaselineRecord
): ComedonesComparisonResult {
  const improvements: string[] = [];
  const stableAspects: string[] = [];
  const worsenedAspects: string[] = [];
  const resolvedFindings: string[] = [];
  const newFindings: string[] = [];
  const improvedHabits: string[] = [];
  const continueAdvice: string[] = [];
  const adjustAdvice: string[] = [];

  const baseObj = baseline.analysisObject;

  // 1. Compare Comedone Amount
  const amountWeight: Record<string, number> = {
    low: 1,
    mild: 2,
    medium: 3,
    high: 4,
    high_attention: 5,
    unknown: 3,
  };
  const currentAmtScore = amountWeight[currentAnalysis.comedone_amount] || 3;
  const baseAmtScore = amountWeight[baseObj.comedone_amount] || 3;

  if (currentAmtScore < baseAmtScore) {
    improvements.push('ចំនួនមុនកប់មានការថយចុះតិចជាងមុន');
  } else if (currentAmtScore === baseAmtScore) {
    stableAspects.push('ចំនួនគ្រាប់មុនកប់នៅរក្សាស្ថិរភាពដដែល');
  } else {
    worsenedAspects.push('ចំនួនមុនកប់មានការកើនឡើងច្រើនជាងមុន');
  }

  // 2. Compare Trend
  if (currentAnalysis.trend_level === 'improving' && baseObj.trend_level !== 'improving') {
    improvements.push('និន្នាការស្បែកបានប្រែប្រួលមករកការថយចុះជាវិជ្ជមាន');
  } else if (currentAnalysis.trend_level === 'stable') {
    stableAspects.push('និន្នាការស្បែកស្ថិតក្នុងកម្រិតថេរ');
  }

  // 3. Compare Picking Habit
  const pickingWeight: Record<string, number> = { low: 1, medium: 2, high: 3, none: 1 };
  if ((pickingWeight[currentAnalysis.picking_factor] || 1) < (pickingWeight[baseObj.picking_factor] || 1)) {
    improvements.push('បានកាត់បន្ថយទម្លាប់ញិចកេះមុនបានល្អជាងមុន');
    improvedHabits.push('ទម្លាប់មិនញិចមុន');
  } else if ((pickingWeight[currentAnalysis.picking_factor] || 1) > (pickingWeight[baseObj.picking_factor] || 1)) {
    worsenedAspects.push('ទម្លាប់ញិចកេះមុនកើនឡើង ដែលគួរប្រយ័ត្ន');
  }

  // 4. Compare Cleansing Irritation
  const cleansingWeight: Record<string, number> = { low: 1, medium: 2, high: 3, none: 1 };
  if ((cleansingWeight[currentAnalysis.cleansing_irritation_factor] || 1) < (cleansingWeight[baseObj.cleansing_irritation_factor] || 1)) {
    improvements.push('ស្បែកមានអារម្មណ៍ធូរស្រាល និងមិនសូវតឹងស្ងួតក្រោយលាងមុខដូចមុន');
    improvedHabits.push('ការលាងសម្អាតមុខមានតុល្យភាពល្អ');
  }

  // 5. Compare Findings (Resolved vs New)
  const currentFindingIds = new Set(currentAnalysis.findings.map((f) => f.id));
  const baseFindingIds = new Set(baseObj.findings.map((f) => f.id));

  baseObj.findings.forEach((bf) => {
    if (!currentFindingIds.has(bf.id)) {
      resolvedFindings.push(bf.titleKm);
    }
  });

  currentAnalysis.findings.forEach((cf) => {
    if (!baseFindingIds.has(cf.id)) {
      newFindings.push(cf.titleKm);
    }
  });

  // Action advice
  if (improvements.length > 0) {
    continueAdvice.push('បន្តអនុវត្តទម្លាប់ល្អដែលបានកែប្រែដោយជោគជ័យ');
  }
  if (worsenedAspects.length > 0 || newFindings.length > 0) {
    adjustAdvice.push('ពិនិត្យចំណុចដែលទើបរកឃើញថ្មី និងកែតម្រូវតាមការណែនាំជាបន្ទាន់');
  }

  const baselineDateFormatted = new Date(baseline.savedAt).toLocaleDateString('km-KH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return {
    hasBaseline: true,
    baselineDate: baselineDateFormatted,
    improvements,
    stableAspects,
    worsenedAspects,
    resolvedFindings,
    newFindings,
    improvedHabits,
    continueAdvice,
    adjustAdvice,
  };
}
