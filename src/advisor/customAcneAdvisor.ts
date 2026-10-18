/**
 * customAcneAdvisor.ts
 * 
 * Implements the user-specified 2-question AI Skincare Advisor logic:
 * 1. បងប្អូនមានមុខមុនប្រភេទណា?
 *    - មុនកប់/មុនកប់សាច់
 *    - មុនអង្កាម
 *    - មុនខ្ទុះ
 *    - មុនរលាក
 *    - មុនក្បាលស
 *    - មុនក្បាលខ្មៅ
 *    - មុនអកម៉ូន
 *    - ផ្សេងៗ
 * 
 * Rules:
 *    - មុនកប់/មុនកប់សាច់, មុនអង្កាម, មុនខ្ទុះ, មុនរលាក => Recommend ឈុតថែរក្សាមុខមុន (ធំ)
 *    - មុនក្បាលស, មុនក្បាលខ្មៅ => Recommend Lumimei ម៉ាសអង្ករ
 *    - មុនអកម៉ូន, ផ្សេងៗ => No Recommend
 * 
 * 2. បងប្អូនឆ្លាប់អោយគេញិចមុនទេ?
 *    - ឆ្លាប់ => នៅក្នុង report សរសេរថា "គួរតែបញ្ឈប់"
 *    - មិនឆ្លាប់ => នៅក្នុង report សរសេរថា "គួរតែបន្ត"
 */

import { Language, Product } from '../types';

export type PrimarySkinConcern =
  | 'acne'               // មុខមុន
  | 'dullness'           // មុខខ្មៅស្រអាប់
  | 'large_pores'        // មុខមានរន្ធញើសធំ
  | 'redness_irritation' // មុខរោល/មុខរលាក
  | 'thin_red_veins';    // មុខស្តើងសសៃក្រហម

export interface PrimaryConcernOption {
  id: PrimarySkinConcern;
  labelKm: string;
  labelZh: string;
  labelEn: string;
  descriptionKm: string;
  descriptionZh: string;
  descriptionEn: string;
}

export const PRIMARY_CONCERN_OPTIONS: PrimaryConcernOption[] = [
  {
    id: 'acne',
    labelKm: 'មុខមុន',
    labelZh: '痘痘粉刺 (Acne)',
    labelEn: 'Acne & Breakouts',
    descriptionKm: 'មុនកប់ មុនខ្ទុះ មុនរលាក មុនក្បាលស/ខ្មៅ ឬមុនអង្កាម',
    descriptionZh: '包括闭口、白头黑头、脓包痘或红肿发炎痘',
    descriptionEn: 'Closed comedones, whiteheads, blackheads, or inflamed pimples',
  },
  {
    id: 'dullness',
    labelKm: 'មុខខ្មៅស្រអាប់',
    labelZh: '暗沉暗黄 (Dull Skin)',
    labelEn: 'Dull Skin & Uneven Tone',
    descriptionKm: 'ស្បែកគ្មានពន្លឺ ស្រអាប់ ស្លេកស្លាំង ខ្វះសំណើម និងកោសិកាចាស់កកស្ទះ',
    descriptionZh: '肤色暗沉无光泽、粗糙发黄、老废角质堆积',
    descriptionEn: 'Lack of radiance, rough texture, tired and dehydrated skin',
  },
  {
    id: 'large_pores',
    labelKm: 'មុខមានរន្ធញើសធំ',
    labelZh: '毛孔粗大 (Large Pores)',
    labelEn: 'Large & Clogged Pores',
    descriptionKm: 'រន្ធញើសធំចំហ កកស្ទះជាតិខ្លាញ់ មិនម៉ត់រលោង',
    descriptionZh: '油脂分泌旺盛、毛孔粗大明显、易出油卡粉',
    descriptionEn: 'Excessive sebum, visible dilated pores, uneven skin surface',
  },
  {
    id: 'redness_irritation',
    labelKm: 'មុខរោល/មុខរលាក',
    labelZh: '泛红发炎 / 刺痒敏感 (Redness & Irritation)',
    labelEn: 'Redness & Irritation',
    descriptionKm: 'ស្បែកឡើងក្រហម រោល រមាស់ ឬងាយរលាកប្រតិកម្ម',
    descriptionZh: '屏障受损、换季泛红、刺痒不适、易敏感发炎',
    descriptionEn: 'Skin flushing, itching, irritation, compromised skin barrier',
  },
  {
    id: 'thin_red_veins',
    labelKm: 'មុខស្តើងសសៃក្រហម',
    labelZh: '角质层薄 / 红血丝 (Thin Skin with Red Veins)',
    labelEn: 'Thin Skin with Red Capillaries',
    descriptionKm: 'ស្បែកស្តើងងាយប្រតិកម្ម មើលឃើញសរសៃឈាមក្រហមៗលើផ្ទៃមុខ',
    descriptionZh: '表皮角质层过薄、微血管脆弱扩张、易红易烫',
    descriptionEn: 'Delicate fragile skin with visible red capillaries',
  },
];

export type CustomAcneType =
  | 'deep_closed'      // មុនកប់/មុនកប់សាច់
  | 'milia_textured'  // មុនអង្កាម
  | 'pustules'        // មុនខ្ទុះ
  | 'inflammatory'    // មុនរលាក
  | 'whiteheads'      // មុនក្បាលស
  | 'blackheads'      // មុនក្បាលខ្មៅ
  | 'hormonal'        // មុនអកម៉ូន
  | 'others';         // ផ្សេងៗ

export type CustomPoppingHistory = 'yes' | 'no'; // ឆ្លាប់ | មិនឆ្លាប់

// Duration for under-the-skin / closed comedones (មុនកប់ / មុនកប់សាច់)
export type ClosedComedonesDuration =
  | 'less_than_1_month'
  | '1_to_3_months'
  | '3_to_6_months'
  | 'more_than_6_months'
  | 'recurrent';

export interface ComedonesDurationOption {
  id: ClosedComedonesDuration;
  labelKm: string;
  labelZh: string;
  labelEn: string;
  group: 'short' | 'chronic';
}

export const COMEDONES_DURATION_OPTIONS: ComedonesDurationOption[] = [
  {
    id: 'less_than_1_month',
    labelKm: 'តិចជាង 1 ខែ',
    labelZh: '少于 1 个月',
    labelEn: 'Less than 1 month',
    group: 'short',
  },
  {
    id: '1_to_3_months',
    labelKm: '1–3 ខែ',
    labelZh: '1–3 个月',
    labelEn: '1–3 months',
    group: 'short',
  },
  {
    id: '3_to_6_months',
    labelKm: '3–6 ខែ',
    labelZh: '3–6 个月',
    labelEn: '3–6 months',
    group: 'short',
  },
  {
    id: 'more_than_6_months',
    labelKm: 'លើសពី 6 ខែ',
    labelZh: '6 个月以上',
    labelEn: 'More than 6 months',
    group: 'chronic',
  },
  {
    id: 'recurrent',
    labelKm: 'កើតហើយបាត់ រួចកើតឡើងវិញជាញឹកញាប់',
    labelZh: '反复发作，时好时坏',
    labelEn: 'Recurs frequently / comes and goes',
    group: 'chronic',
  },
];

export function getComedonesDurationLabel(id?: ClosedComedonesDuration, lang?: Language): string {
  if (!id) return '';
  const opt = COMEDONES_DURATION_OPTIONS.find((o) => o.id === id);
  if (!opt) return id;
  if (lang === 'zh') return opt.labelZh;
  if (lang === 'en') return opt.labelEn;
  return opt.labelKm;
}

// Question 5: Diet / Lifestyle for under-the-skin acne (មុនកប់/មុនកប់សាច់)
export type ComedonesDietItem =
  | 'sweet_desserts'
  | 'high_carb_processed'
  | 'dairy_products'
  | 'fried_fast_food'
  | 'vegetables_fruits';

export interface ComedonesDietOption {
  id: ComedonesDietItem;
  labelKm: string;
  labelZh: string;
  labelEn: string;
  recommendationType: 'reduce' | 'continue';
  reportVerdictKm: string;
  reportVerdictZh: string;
  reportVerdictEn: string;
  reasonKm: string;
  reasonZh: string;
  reasonEn: string;
  actionKm: string;
  actionZh: string;
  actionEn: string;
}

export const COMEDONES_DIET_OPTIONS: ComedonesDietOption[] = [
  {
    id: 'sweet_desserts',
    labelKm: 'ភេសជ្ជៈផ្អែមៗ នំផ្អែម / បង្អែម',
    labelZh: '含糖饮料、甜点 / 甜品',
    labelEn: 'Sugary drinks, sweets / desserts',
    recommendationType: 'reduce',
    reportVerdictKm: 'គួរកាត់បន្ថយ',
    reportVerdictZh: '建议减少摄入',
    reportVerdictEn: 'Should Reduce',
    reasonKm:
      'ព្រោះការទទួលទាន ភេសជ្ជៈផ្អែមៗ នំផ្អែម ឬបង្អែម ច្រើនហួសប្រមាណ គឺជាមូលហេតុចម្បងមួយដែលធ្វើឱ្យកើតមុន និងរលាកស្បែកយ៉ាងខ្លាំង។ នៅពេលបងបង្អូនញ៉ាំជាតិស្ករច្រើន វានឹងធ្វើឱ្យកម្រិតជាតិស្ករក្នុងឈាម និងអរម៉ូនអាំងស៊ុយលីន (Insulin) កើនឡើងភ្លាមៗ។ ការប្រែប្រួលនេះជម្រុញឱ្យរាងកាយផលិតជាតិប្រេង (Sebum) កាន់តែច្រើន និងបង្កជាការរលាកនៅក្រោមស្បែក ដែលធ្វើឱ្យស្ទះរន្ធញើស និងបង្កជា«មុនកប់»យ៉ាងងាយស្រួល',
    reasonZh:
      '过量摄入含糖饮料或甜食是引发痘痘与肌肤炎性反应的主因之一。摄入过多糖分会导致血糖与胰岛素（Insulin）骤升，刺激皮脂腺过度分泌油脂，加剧皮下炎症并造成毛孔堵塞，极易诱发闭口粉刺。',
    reasonEn:
      'Excessive consumption of sugary drinks or sweets is a major cause of acne and skin inflammation. High sugar intake causes rapid spikes in blood sugar and insulin, triggering excess sebum production and pore blockages.',
    actionKm:
      'អ្វីដែលបងបង្អូនគួរតែធ្វើ គួរបន្ថែមបន្លែ ផ្លែឈើ និងអាហារដែលមានតុល្យភាព ដើម្បីជួយថែរក្សាសុខភាពស្បែក និងរាងកាយទូទៅ។',
    actionZh:
      '建议多补充新鲜蔬果与均衡饮食，以帮助调理肌肤与整体健康。',
    actionEn:
      'What you should do: add more fresh vegetables, fruits, and a balanced diet to promote overall skin health.',
  },
  {
    id: 'high_carb_processed',
    labelKm: 'អាហារម្សៅច្រើន ដូចជា នំប៉័ង មី និងអាហារកែច្នៃ',
    labelZh: '高淀粉与精制碳水（如面包、面条、加工食品）',
    labelEn: 'High carb/starch (bread, noodles, processed foods)',
    recommendationType: 'reduce',
    reportVerdictKm: 'គួរកាត់បន្ថយ',
    reportVerdictZh: '建议减少摄入',
    reportVerdictEn: 'Should Reduce',
    reasonKm:
      'ការទទួលទានអាហារប្រភេទម្សៅកែច្នៃ ដូចជា នំប៉័ង មី និងអាហារកែច្នៃផ្សេងៗ ជាកត្តាម្យ៉ាងដែលធ្វើឱ្យរាងកាយបញ្ចេញជាតិស្ករលឿន ដែលបណ្តាលឱ្យអរម៉ូនអាំងស៊ុយលីនកើនឡើង ជំរុញឱ្យក្រពេញខ្លាញ់ផលិតខ្លាញ់កាន់តែច្រើន និងបង្កជាការរលាក រហូតដល់កើតមាន "មុនកប់" ឬមុនធំៗបានយ៉ាងងាយស្រួល',
    reasonZh:
      '大量摄入精制淀粉类（如白面包、泡面和加工食品）属于高升糖指数饮食，促使胰岛素水平激增并刺激油脂分泌，促成皮下炎症并极易引发闭口及大颗粒粉刺。',
    reasonEn:
      'Eating processed carbohydrates like bread and noodles causes rapid glucose release, raising insulin levels, which stimulates sebaceous glands to overproduce oil and trigger closed comedones.',
    actionKm:
      'អ្វីដែលបងបង្អូនគួរតែធ្វើ គួរបន្ថែមបន្លែ ផ្លែឈើ និងអាហារដែលមានតុល្យភាព ដើម្បីជួយថែរក្សាសុខភាពស្បែក និងរាងកាយទូទៅ។',
    actionZh:
      '建议增加富含纤维的粗粮、蔬菜与水果，保持营养均衡。',
    actionEn:
      'What you should do: add more vegetables, fruits, and balanced wholesome foods to support skin and systemic health.',
  },
  {
    id: 'dairy_products',
    labelKm: 'ទឹកដោះគោ / ផលិតផលទឹកដោះគោ',
    labelZh: '牛奶 / 乳制品',
    labelEn: 'Milk / dairy products',
    recommendationType: 'reduce',
    reportVerdictKm: 'គួរកាត់បន្ថយ',
    reportVerdictZh: '建议减少摄入',
    reportVerdictEn: 'Should Reduce',
    reasonKm:
      'ការផឹកទឹកដោះគោ ឬបរិភោគផលិតផលពីទឹកដោះគោ អាចជាមូលហេតុមួយធ្វើឱ្យមានមុន ព្រោះវាមានផ្ទុកសារធាតុស្រដៀងនឹងអ័រម៉ូនតេស្តូស្តេរ៉ូន និងអ័រម៉ូនផ្សេងៗទៀតដែលជំរុញការផលិតខ្លាញ់លើស្បែក។',
    reasonZh:
      '常喝牛奶或食用乳制品可能会诱发或加重粉刺，因为乳制品中含有类睾酮及其他荷尔蒙活性成分，会直接刺激皮脂腺分泌更多油脂。',
    reasonEn:
      'Drinking milk or consuming dairy products can contribute to acne because dairy contains precursors resembling testosterone and hormones that stimulate oil production in the skin.',
    actionKm:
      'អ្វីដែលបងបង្អូនគួរតែធ្វើ គួរបន្ថែមបន្លែ ផ្លែឈើ និងអាហារដែលមានតុល្យភាព ដើម្បីជួយថែរក្សាសុខភាពស្បែក និងរាងកាយទូទៅ។',
    actionZh:
      '建议适当减少乳制品摄入，多食用植物性均衡食物与新鲜蔬果。',
    actionEn:
      'What you should do: moderate dairy intake and add fresh vegetables, fruits, and balanced nutrients.',
  },
  {
    id: 'fried_fast_food',
    labelKm: 'គ្រឿងបំពង Fast Food / អាហារកែច្នៃញឹកញាប់',
    labelZh: '油炸食品、快餐 (Fast Food) / 加工食品',
    labelEn: 'Fried food, fast food, frequently processed food',
    recommendationType: 'reduce',
    reportVerdictKm: 'គួរកាត់បន្ថយ',
    reportVerdictZh: '建议减少摄入',
    reportVerdictEn: 'Should Reduce',
    reasonKm:
      'ព្រោះការញ៉ាំគ្រឿងបំពង និង Fast Food សម្បូរទៅដោយខ្លាញ់មិនល្អ (Trans fats) និងកាឡូរីខ្ពស់ ដែលជំរុញការរលាករាងកាយ និងក្រពេញខ្លាញ់បញ្ចេញសេប៊ូមលើសលប់ ធ្វើឱ្យស្ទះរន្ធញើស និងបង្កជា«មុនកប់»យ៉ាងងាយស្រួល។',
    reasonZh:
      '油炸食品和快餐富含饱和脂肪与反式脂肪酸，易引发机体微炎症反应并使皮脂分泌过度，极易堵塞毛孔形成闭口暗粒。',
    reasonEn:
      'Fried foods and fast food are rich in unhealthy fats that promote systemic inflammation and cause the sebaceous glands to oversecrete sebum, clogging pores and causing closed comedones.',
    actionKm:
      'អ្វីដែលបងបង្អូនគួរតែធ្វើ គួរបន្ថែមបន្លែ ផ្លែឈើ និងអាហារដែលមានតុល្យភាព ដើម្បីជួយថែរក្សាសុខភាពស្បែក និងរាងកាយទូទៅ។',
    actionZh:
      '建议减少油炸与高盐高脂快餐，多摄入清淡天然蔬果。',
    actionEn:
      'What you should do: reduce deep-fried/fast food and incorporate fresh fruits, vegetables, and nutrient-dense foods.',
  },
  {
    id: 'vegetables_fruits',
    labelKm: 'បន្លែ និងផ្លែឈើជាញឹកញាប់',
    labelZh: '经常吃新鲜蔬菜与水果',
    labelEn: 'Frequent vegetables & fruits',
    recommendationType: 'continue',
    reportVerdictKm: 'ល្អណាស់ គួរតែបន្ត',
    reportVerdictZh: '非常好，建议继续保持',
    reportVerdictEn: 'Great! Keep It Up',
    reasonKm:
      'ការបរិភោគបន្លែ ផ្លែឈើញឹកញាប់គឺល្អណាស់ព្រោះអាចជួយកាត់បន្ថយការរលាក និងសម្អាតរន្ធញើស តែបងប្អូនមិនត្រូវបរិភោគបន្លែ ផ្លែឈើណាដែលមានជាតិស្ករខ្ពស់នោះទេ។',
    reasonZh:
      '经常摄入新鲜蔬果能提供丰富的抗氧化剂、维生素及膳食纤维，有效缓解皮下氧化应激与炎性反应，帮助肌肤建立健康的水油平衡屏障。',
    reasonEn:
      'Regular consumption of fresh vegetables and fruits provides essential antioxidants, vitamins, and dietary fiber that combat inflammation and nourish radiant, balanced skin from within.',
    actionKm:
      'អ្វីដែលបងបង្អូនគួរតែធ្វើ បន្តទម្លាប់ដ៏ល្អនេះ និងរក្សាការញ៉ាំអាហារចម្រុះមុខដើម្បីសុខភាពស្បែករឹងមាំយូរអង្វែង។',
    actionZh:
      '建议继续坚持此良好膳食习惯，保持摄取丰富植物营养素。',
    actionEn:
      'What you should do: maintain this positive dietary routine and enjoy diverse natural foods for long-term resilient skin.',
  },
];

export type CustomMakeupFrequency = 'daily' | 'occasional' | 'rarely' | 'never';

export interface MakeupFrequencyOption {
  id: CustomMakeupFrequency;
  labelKm: string;
  labelZh: string;
  labelEn: string;
}

export const MAKEUP_FREQUENCY_OPTIONS: MakeupFrequencyOption[] = [
  {
    id: 'daily',
    labelKm: 'ស្ទើរតែរាល់ថ្ងៃ',
    labelZh: '几乎每天',
    labelEn: 'Almost every day',
  },
  {
    id: 'occasional',
    labelKm: 'ម្តងម្កាល',
    labelZh: '偶尔',
    labelEn: 'Occasionally',
  },
  {
    id: 'rarely',
    labelKm: 'កម្រណាស់',
    labelZh: '很少化妆',
    labelEn: 'Rarely',
  },
  {
    id: 'never',
    labelKm: 'មិន Makeup',
    labelZh: '从不化妆',
    labelEn: 'Never wear makeup',
  },
];

export type CustomWashFrequency =
  | '1_time'
  | '2_times'
  | '3_times'
  | 'more_than_3'
  | 'irregular';

export interface WashFrequencyOption {
  id: CustomWashFrequency;
  labelKm: string;
  labelZh: string;
  labelEn: string;
}

export const WASH_FREQUENCY_OPTIONS: WashFrequencyOption[] = [
  {
    id: '1_time',
    labelKm: '1 ដង',
    labelZh: '1 次',
    labelEn: 'Once a day',
  },
  {
    id: '2_times',
    labelKm: '2 ដង',
    labelZh: '2 次',
    labelEn: 'Twice a day',
  },
  {
    id: '3_times',
    labelKm: '3 ដង',
    labelZh: '3 次',
    labelEn: '3 times a day',
  },
  {
    id: 'more_than_3',
    labelKm: 'លើសពី 3 ដង',
    labelZh: '3 次以上',
    labelEn: 'More than 3 times',
  },
  {
    id: 'irregular',
    labelKm: 'មិនទៀងទាត់',
    labelZh: '不规律',
    labelEn: 'Irregular',
  },
];

export type CustomFaceDryingMethod = 'towel' | 'tissue';

export interface FaceDryingOption {
  id: CustomFaceDryingMethod;
  labelKm: string;
  labelZh: string;
  labelEn: string;
}

export const FACE_DRYING_OPTIONS: FaceDryingOption[] = [
  {
    id: 'towel',
    labelKm: 'កន្សែងជូតមុខ',
    labelZh: '毛巾/面巾',
    labelEn: 'Face towel',
  },
  {
    id: 'tissue',
    labelKm: 'ក្រដាសជូតមុខ',
    labelZh: '洗脸巾/一次性面巾纸',
    labelEn: 'Facial tissue',
  },
];

export type AcneTriggerTime =
  | 'late_sleep'
  | 'stress'
  | 'product_reaction'
  | 'after_makeup'
  | 'unsure'
  | 'none';

export interface AcneTriggerOption {
  id: AcneTriggerTime;
  labelKm: string;
  labelZh: string;
  labelEn: string;
}

export const ACNE_TRIGGER_OPTIONS: AcneTriggerOption[] = [
  {
    id: 'late_sleep',
    labelKm: 'បន្ទាប់ពីគេងយប់ជ្រៅ',
    labelZh: '熬夜/睡得很晚之后',
    labelEn: 'After staying up late',
  },
  {
    id: 'stress',
    labelKm: 'ពេលមានសម្ពាធ',
    labelZh: '感到压力大/精神紧张时',
    labelEn: 'When under stress/pressure',
  },
  {
    id: 'product_reaction',
    labelKm: 'បន្ទាប់ពីប្រើផលិតផលណាមួយ',
    labelZh: '使用某款护肤/化妆品之后',
    labelEn: 'After using a specific product',
  },
  {
    id: 'after_makeup',
    labelKm: 'បន្ទាប់ពី makeup',
    labelZh: '化妆/卸妆之后',
    labelEn: 'After makeup',
  },
  {
    id: 'unsure',
    labelKm: 'មិនច្បាស់',
    labelZh: '不太确定/不清楚',
    labelEn: 'Unsure',
  },
  {
    id: 'none',
    labelKm: 'មិនមាននៅខាងលើ',
    labelZh: '以上均无',
    labelEn: 'None of the above',
  },
];

// Gender options for hormonal assessment
export type AdvisorGender = 'male' | 'female';

export interface GenderOption {
  id: AdvisorGender;
  labelKm: string;
  labelZh: string;
  labelEn: string;
}

export const GENDER_OPTIONS: GenderOption[] = [
  {
    id: 'male',
    labelKm: 'ប្រុស',
    labelZh: '男',
    labelEn: 'Male',
  },
  {
    id: 'female',
    labelKm: 'ស្រី',
    labelZh: '女',
    labelEn: 'Female',
  },
];

// Menstrual regularity options for Hormonal Acne (មុនអកម៉ូន)
export type MenstrualRegularity =
  | 'regular_every_month' // ទៀងទាត់រាល់ខែ
  | 'somewhat_irregular'  // មិនសូវទៀងទាត់
  | 'frequent_delayed'    // ខករដូវញឹកញាប់
  | 'unsure';             // មិនប្រាកដ

export interface MenstrualRegularityOption {
  id: MenstrualRegularity;
  labelKm: string;
  labelZh: string;
  labelEn: string;
}

export const MENSTRUAL_REGULARITY_OPTIONS: MenstrualRegularityOption[] = [
  {
    id: 'regular_every_month',
    labelKm: 'ទៀងទាត់រាល់ខែ',
    labelZh: '每月规律',
    labelEn: 'Regular every month',
  },
  {
    id: 'somewhat_irregular',
    labelKm: 'មិនសូវទៀងទាត់',
    labelZh: '不太规律',
    labelEn: 'Somewhat irregular',
  },
  {
    id: 'frequent_delayed',
    labelKm: 'ខករដូវញឹកញាប់',
    labelZh: '经常推迟/延期/月经失调',
    labelEn: 'Frequently delayed/irregular',
  },
  {
    id: 'unsure',
    labelKm: 'មិនប្រាកដ',
    labelZh: '不确定/不清楚',
    labelEn: 'Unsure',
  },
];

// Hormonal Recent Symptoms / Changes for Hormonal Acne (Female)
export type HormonalRecentSymptom =
  | 'high_stress'
  | 'lack_of_sleep'
  | 'menstrual_changes'
  | 'new_meds_supplements'
  | 'changed_skincare_makeup'
  | 'lifestyle_changes'
  | 'none';

export interface HormonalRecentSymptomOption {
  id: HormonalRecentSymptom;
  labelKm: string;
  labelZh: string;
  labelEn: string;
}

export const HORMONAL_RECENT_SYMPTOMS_OPTIONS: HormonalRecentSymptomOption[] = [
  {
    id: 'high_stress',
    labelKm: 'មានសម្ពាធផ្លូវចិត្ត (Stress) ច្រើន',
    labelZh: '精神压力较大 (Stress)',
    labelEn: 'High emotional stress',
  },
  {
    id: 'lack_of_sleep',
    labelKm: 'គេងមិនគ្រប់',
    labelZh: '睡眠不足 / 经常熬夜',
    labelEn: 'Lack of adequate sleep',
  },
  {
    id: 'menstrual_changes',
    labelKm: 'មានការប្រែប្រួលវដ្តរដូវ',
    labelZh: '月经周期出现明显变化',
    labelEn: 'Changes in menstrual cycle',
  },
  {
    id: 'new_meds_supplements',
    labelKm: 'ចាប់ផ្តើមប្រើថ្នាំ ឬ Supplement ថ្មី',
    labelZh: '近期开始服用新药物或营养补充剂',
    labelEn: 'Started new medication or supplements',
  },
  {
    id: 'changed_skincare_makeup',
    labelKm: 'ផ្លាស់ប្តូរ Skincare ឬ Makeup ថ្មី',
    labelZh: '更换新的护肤品或彩妆品',
    labelEn: 'Changed skincare or makeup products',
  },
  {
    id: 'lifestyle_changes',
    labelKm: 'មានការប្រែប្រួលទម្លាប់រស់នៅថ្មីៗ',
    labelZh: '生活作息或习惯有新变化',
    labelEn: 'Recent lifestyle habit changes',
  },
  {
    id: 'none',
    labelKm: 'មិនមានអ្វីប្រែប្រួលគួរឱ្យកត់សម្គាល់',
    labelZh: '没有明显的变化',
    labelEn: 'No noticeable changes',
  },
];

export interface CustomAdvisorAnswers {
  primaryConcern: PrimarySkinConcern;
  acneType?: CustomAcneType;
  gender?: AdvisorGender;
  poppingHistory?: CustomPoppingHistory;
  menstrualRegularity?: MenstrualRegularity;
  hormonalSymptoms?: HormonalRecentSymptom[];
  comedonesDuration?: ClosedComedonesDuration;
  comedonesDiet?: ComedonesDietItem[];
  makeupFrequency?: CustomMakeupFrequency;
  washFrequency?: CustomWashFrequency;
  faceDryingMethod?: CustomFaceDryingMethod;
  acneTriggers?: AcneTriggerTime[];
}

export interface AcneOption {
  id: CustomAcneType;
  labelKm: string;
  labelZh: string;
  labelEn: string;
  descriptionKm: string;
}

export const ACNE_OPTIONS: AcneOption[] = [
  {
    id: 'deep_closed',
    labelKm: 'មុនកប់',
    labelZh: '闭口粉刺 / 小颗粒 (Closed Comedones)',
    labelEn: 'Closed Comedones / Small Bumps',
    descriptionKm: 'គ្រាប់តូចៗ ពណ៌ដូចស្បែក មានក្បាលស ឬកកស្ទះជ្រៅក្នុងសាច់',
  },
  {
    id: 'milia_textured',
    labelKm: 'មុនអង្កាម',
    labelZh: '小米粒粉刺 / 粟粒粒',
    labelEn: 'Milia / Tiny Bumps',
    descriptionKm: 'គ្រាប់តូចៗដូចគ្រាប់អង្កាមលើស្បែកមុខ ស្ទាបទៅគ្រើម',
  },
  {
    id: 'pustules',
    labelKm: 'មុនខ្ទុះ',
    labelZh: '脓包痘 (Pustules)',
    labelEn: 'Pustules / Pus Acne',
    descriptionKm: 'មុនមានក្បាលខ្ទុះពណ៌ស/លឿង ងាយឆ្លងមេរោគ និងរលាក',
  },
  {
    id: 'inflammatory',
    labelKm: 'មុនរលាក',
    labelZh: '红肿发炎痘',
    labelEn: 'Inflammatory Red Bumps',
    descriptionKm: 'មុនហើមក្រហម មានអារម្មណ៍ផ្សា ឬឈឺនៅពេលប៉ះ',
  },
  {
    id: 'whiteheads',
    labelKm: 'មុនក្បាលស',
    labelZh: '白头粉刺 (Whiteheads)',
    labelEn: 'Whiteheads',
    descriptionKm: 'មុនក្បាលសតូចៗបិទជិតលើផ្ទៃស្បែក ដោយសារខ្លាញ់កកស្ទះ',
  },
  {
    id: 'blackheads',
    labelKm: 'មុនក្បាលខ្មៅ',
    labelZh: '黑头粉刺 (Blackheads)',
    labelEn: 'Blackheads',
    descriptionKm: 'មុនក្បាលខ្មៅលើច្រមុះ ឬថ្ពាល់ ដែលប៉ះខ្យល់ហើយឡើងខ្មៅ',
  },
  {
    id: 'hormonal',
    labelKm: 'មុនអកម៉ូន',
    labelZh: '内分泌/激素痘 (Hormonal)',
    labelEn: 'Hormonal Acne',
    descriptionKm: 'មុនឡើងតាមវដ្តរដូវ ភាពតានតឹង ឬការគេងយឺត ជុំវិញចង្កា/ថ្គាម',
  },
  {
    id: 'others',
    labelKm: 'ផ្សេងៗ',
    labelZh: '其他类型',
    labelEn: 'Other Conditions',
    descriptionKm: 'បញ្ហាមុនចម្រុះ ឬបញ្ហាស្បែកដែលមិនស្ថិតក្នុងចំណុចខាងលើ',
  },
];

export interface PoppingOption {
  id: CustomPoppingHistory;
  labelKm: string;
  labelZh: string;
  labelEn: string;
}

export const POPPING_OPTIONS: PoppingOption[] = [
  {
    id: 'yes',
    labelKm: 'ឆ្លាប់',
    labelZh: '挤过 / 曾去挤痘',
    labelEn: 'Yes, have squeezed/extracted',
  },
  {
    id: 'no',
    labelKm: 'មិនឆ្លាប់',
    labelZh: '从不挤痘',
    labelEn: 'No, never extracted',
  },
];

export type RecommendationType = 'set_acne_large' | 'rice_mask' | 'none';

export interface CustomRecommendationResult {
  recommendationType: RecommendationType;
  titleKm: string;
  titleZh: string;
  titleEn: string;
  productNameKm: string;
  productNameZh: string;
  productNameEn: string;
  priceUsd: number;
  originalPriceUsd?: number;
  priceKhr?: number;
  image: string;
  stock?: number;
  descriptionKm?: string;
  descriptionZh?: string;
  descriptionEn?: string;
  benefitsKm?: string[];
  product?: Product;
  badgeKm: string;
  badgeZh: string;
  badgeEn: string;
  reasonKm: string;
  reasonZh: string;
  reasonEn: string;
  storeProductId?: string;
  itemsKm?: string[];
}

export interface DeepClosedReport {
  durationId: ClosedComedonesDuration;
  durationLabelKm: string;
  durationLabelZh: string;
  durationLabelEn: string;
  reportKm: string;
  reportZh: string;
  reportEn: string;
  considerProductKm: string;
  considerProductZh: string;
  considerProductEn: string;
  dietReports: ComedonesDietOption[];
}

export interface CustomAdvisorEvaluationResult {
  recommendation: CustomRecommendationResult;
  poppingAdvice: {
    verdictKm: string;
    verdictZh: string;
    verdictEn: string;
    type: 'stop' | 'continue';
    descriptionKm: string;
    descriptionZh: string;
    descriptionEn: string;
  };
  deepClosedReport?: DeepClosedReport;
}

export function evaluateCustomAdvisor(
  answers: CustomAdvisorAnswers,
  catalog?: Product[]
): CustomAdvisorEvaluationResult {
  const {
    primaryConcern = 'acne',
    acneType = 'deep_closed',
    poppingHistory = 'yes',
    comedonesDuration = 'less_than_1_month',
    comedonesDiet = ['sweet_desserts'],
  } = answers;

  // Build specific report if deep_closed (មុនកប់/មុនកប់សាច់)
  let deepClosedReport: DeepClosedReport | undefined = undefined;
  if (primaryConcern === 'acne' && acneType === 'deep_closed') {
    const isShort =
      comedonesDuration === 'less_than_1_month' ||
      comedonesDuration === '1_to_3_months' ||
      comedonesDuration === '3_to_6_months';

    const selectedDietReports = COMEDONES_DIET_OPTIONS.filter((opt) =>
      (comedonesDiet || []).includes(opt.id)
    );

    if (isShort) {
      deepClosedReport = {
        durationId: comedonesDuration,
        durationLabelKm: getComedonesDurationLabel(comedonesDuration, 'km'),
        durationLabelZh: getComedonesDurationLabel(comedonesDuration, 'zh'),
        durationLabelEn: getComedonesDurationLabel(comedonesDuration, 'en'),
        reportKm:
          'មុនកប់ គឺជាប្រភេទមុនដែលកើតឡើងនៅពេលរន្ធញើសត្រូវបានស្ទះដោយខ្លាញ់ និងកោសិកាស្បែកចាស់ៗ។ ជាទូទៅ វាអាចមើលឃើញជាគ្រាប់តូចៗនៅក្រោមស្បែក និងមិនសូវមានក្បាលមុនច្បាស់។',
        reportZh:
          '闭口粉刺主要是皮脂和老废角质堵塞毛孔所致。通常表现为皮下隐匿的小颗粒，表面没有明显的脓头。',
        reportEn:
          'Closed comedones occur when pores are clogged with sebum and dead skin cells. They typically appear as tiny bumps beneath the skin without a distinct visible head.',
        considerProductKm: 'ឈុតថែរក្សាមុខមុន (ធំ)',
        considerProductZh: 'Lumimei 祛痘修护大套装',
        considerProductEn: 'Acne Care Set (Large)',
        dietReports: selectedDietReports,
      };
    } else {
      deepClosedReport = {
        durationId: comedonesDuration,
        durationLabelKm: getComedonesDurationLabel(comedonesDuration, 'km'),
        durationLabelZh: getComedonesDurationLabel(comedonesDuration, 'zh'),
        durationLabelEn: getComedonesDurationLabel(comedonesDuration, 'en'),
        reportKm:
          'ប្រសិនបើមុនកប់មានរយៈពេលយូរ ឬកើតឡើងវិញជាញឹកញាប់ គួរយកចិត្តទុកដាក់លើការសម្អាតស្បែក ការជ្រើសរើសផលិតផលថែរក្សាស្បែក និងទម្លាប់ប្រចាំថ្ងៃ ដើម្បីជួយកាត់បន្ថយការស្ទះរន្ធញើស។',
        reportZh:
          '如果闭口粉刺持续时间较长或反复发作，需要重点关注面部深层清洁、合理挑选护肤品以及日常生活作息习惯，以有效减轻毛孔堵塞。',
        reportEn:
          'If closed comedones persist for a long time or recur frequently, special attention should be given to gentle skin cleansing, selecting appropriate skincare, and daily habits to minimize pore congestion.',
        considerProductKm: 'ឈុតថែរក្សាមុខមុន (ធំ)',
        considerProductZh: 'Lumimei 祛痘修护大套装',
        considerProductEn: 'Acne Care Set (Large)',
        dietReports: selectedDietReports,
      };
    }
  }

  let rec: CustomRecommendationResult;

  // 1. NON-ACNE FLOWS
  if (primaryConcern === 'dullness') {
    rec = {
      recommendationType: 'rice_mask',
      titleKm: 'ណែនាំផលិតផល Lumimei',
      titleZh: 'Lumimei 护肤品推荐',
      titleEn: 'Lumimei Recommended Product',
      badgeKm: '✨ ដំណោះស្រាយមុខខ្មៅស្រអាប់',
      badgeZh: '✨ 焕亮去黄核心推荐',
      badgeEn: '✨ Radiant Skin Solution',
      storeProductId: 'p1',
      priceUsd: 0,
      image: '',
      productNameKm: '',
      productNameZh: '',
      productNameEn: '',
      reasonKm: 'សម្រាប់បញ្ហាស្បែកមុខខ្មៅស្រអាប់ ត្រូវការការជម្រុះកោសិកាងាប់ៗដែលកកស្ទះលើផ្ទៃមុខ និងបឺតជាតិពុល។',
      reasonZh: '针对肤色暗沉暗黄问题，建议温和清理老废角质与毛孔污垢。',
      reasonEn: 'For dull skin, gentle pore purification and clarifying dead skin cells is recommended.',
    };
  } else if (primaryConcern === 'large_pores') {
    rec = {
      recommendationType: 'rice_mask',
      titleKm: 'ណែនាំផលិតផល Lumimei',
      titleZh: 'Lumimei 护肤品推荐',
      titleEn: 'Lumimei Recommended Product',
      badgeKm: '✨ សម្អាត & បង្រួមរន្ធញើស',
      badgeZh: '✨ 深层净毛孔·控油收敛',
      badgeEn: '✨ Pore Tightening Solution',
      storeProductId: 'p1',
      priceUsd: 0,
      image: '',
      productNameKm: '',
      productNameZh: '',
      productNameEn: '',
      reasonKm: 'សម្រាប់បញ្ហារន្ធញើសធំ និងកកស្ទះខ្លាញ់ ត្រូវការការសម្អាតរន្ធញើសយ៉ាងជ្រៅ និងគ្រប់គ្រងជាតិខ្លាញ់។',
      reasonZh: '针对毛孔粗大与油脂过度分泌，需深层吸附毛孔堆积物并控油收敛。',
      reasonEn: 'For enlarged and congested pores, deep sebum control and pore cleansing is recommended.',
    };
  } else if (primaryConcern === 'redness_irritation') {
    rec = {
      recommendationType: 'none',
      titleKm: 'ការណែនាំថែទាំ៖ លួងលោមស្បែកមុខរោល និងរលាក',
      titleZh: '专业修护建议：舒缓泛红发炎肌',
      titleEn: 'Care Direction: Soothing Redness & Irritation',
      badgeKm: '🛡️ ថែទាំស្បែករោល & រលាក',
      badgeZh: '🛡️ 舒缓降红·温和修护',
      badgeEn: '🛡️ Soothing & Barrier Support',
      priceUsd: 0,
      image: '',
      productNameKm: '',
      productNameZh: '',
      productNameEn: '',
      reasonKm:
        'សម្រាប់មុខរោល និងមុខរលាក របាំងការពារស្បែកកំពុងមានបញ្ហាខ្សោយ។ Lumimei ណែនាំឱ្យផ្អាកផលិតផលគីមីកាត់ខ្លាំង រក្សាការលាងមុខថ្នមៗ និងទាក់ទងមកក្រុមការងារ Lumimei តាម Telegram ដើម្បីពិគ្រោះយោបល់រកវិធីថែទាំសមស្របបំផុត។',
      reasonZh:
        '泛红刺痒通常代表肌肤表皮屏障受损。建议立即暂停一切刺激性去角质或高浓度酸类产品，坚持极简舒缓保湿，并推荐直接点击下方 Telegram 与 Lumimei 专业护肤顾问一对一沟通定制温和方案。',
      reasonEn:
        'Skin redness and irritation signify a compromised skin barrier. Avoid harsh exfoliants or active chemicals. Keep your routine gentle and contact Lumimei via Telegram for personalized soothing guidance.',
    };
  } else if (primaryConcern === 'thin_red_veins') {
    rec = {
      recommendationType: 'none',
      titleKm: 'ការណែនាំថែទាំ៖ ស្បែកស្តើង និងមានសរសៃក្រហម',
      titleZh: '专业修护建议：角质薄红血丝屏障修护',
      titleEn: 'Care Direction: Fragile Skin & Visible Capillaries',
      badgeKm: '🌿 ថែទាំស្បែកស្តើងទន់ភ្លន់',
      badgeZh: '🌿 屏障强化建议',
      badgeEn: '🌿 Gentle Barrier Care',
      priceUsd: 0,
      image: '',
      productNameKm: '',
      productNameZh: '',
      productNameEn: '',
      reasonKm:
        'សម្រាប់ស្បែកមុខស្តើង និងមានសរសៃក្រហម ស្រទាប់ការពារស្បែកគឺស្តើងខ្លាំង ងាយប្រតិកម្មនឹងកម្តៅថ្ងៃ ឬផលិតផលកាត់។ Lumimei សូមណែនាំកុំឱ្យប្រើផលិតផលខាត់មុខខ្លាំងៗ និងសូមទាក់ទងមកក្រុមការងារ Lumimei តាម Telegram ដើម្បីពិនិត្យលម្អិតមុនពេលសម្រេចចិត្តប្រើប្រាស់ផលិតផលណាមួយ។',
      reasonZh:
        '角质层薄、微血管脆弱扩张的肌肤极其娇嫩，严禁进行物理磨砂或深度焕肤刺激。建议优先修护皮脂膜屏障，避免暴晒或温差刺激，并建议通过下方 Telegram 咨询获取定制修护指导。',
      reasonEn:
        'Delicate thin skin with visible veins requires maximum barrier strengthening. Avoid all abrasive scrubs and harsh chemicals. Contact our Lumimei specialist via Telegram for a safe, bespoke routine.',
    };
  } else {
    // 2. ACNE FLOW (primaryConcern === 'acne')
    if (acneType === 'deep_closed') {
      rec = {
        recommendationType: 'set_acne_large',
        titleKm: 'ណែនាំផលិតផល Lumimei',
        titleZh: 'Lumimei 护肤品推荐',
        titleEn: 'Lumimei Recommended Product',
        badgeKm: '✨ ណែនាំឱ្យប្រើប្រាស់ជាឈុត',
        badgeZh: '✨ 专属推荐套装',
        badgeEn: '✨ Recommended Complete Set',
        storeProductId: 'p1',
        priceUsd: 0,
        image: '',
        productNameKm: '',
        productNameZh: '',
        productNameEn: '',
        reasonKm: 'មុនកប់ គឺជាប្រភេទមុនដែលកើតឡើងនៅពេលរន្ធញើសត្រូវបានស្ទះដោយខ្លាញ់ និងកោសិកាស្បែកចាស់ៗ។',
        reasonZh: '闭口粉刺主要是皮脂和老废角质堵塞毛孔所致。建议搭配整套全面护理流程，温和疏通毛孔。',
        reasonEn: 'Closed comedones occur when pores are clogged with sebum and dead skin cells.',
      };
    } else if (
      acneType === 'milia_textured' ||
      acneType === 'pustules' ||
      acneType === 'inflammatory'
    ) {
      rec = {
        recommendationType: 'set_acne_large',
        titleKm: 'ណែនាំផលិតផល Lumimei',
        titleZh: 'Lumimei 护肤品推荐',
        titleEn: 'Lumimei Recommended Product',
        badgeKm: '✨ ណែនាំឱ្យប្រើប្រាស់ជាឈុត',
        badgeZh: '✨ 专属推荐套装',
        badgeEn: '✨ Recommended Complete Set',
        storeProductId: 'p1',
        priceUsd: 0,
        image: '',
        productNameKm: '',
        productNameZh: '',
        productNameEn: '',
        reasonKm: 'សម្រាប់ប្រភេទមុននេះ ការថែទាំជាឈុតពេញលេញជួយសម្អាតជាតិពុល ជម្រុះកោសិកាងាប់ៗ កាត់បន្ថយការរលាក និងស្ដាររបាំងស្បែក។',
        reasonZh: '针对此类顽固或发炎痘痘，建议搭配整套全面护理流程，温和净化毛孔与舒缓修复。',
        reasonEn: 'For this type of acne, a complete routine provides full-cycle care from pore purification to soothing.',
      };
    } else if (acneType === 'whiteheads' || acneType === 'blackheads') {
      rec = {
        recommendationType: 'rice_mask',
        titleKm: 'ណែនាំផលិតផល Lumimei',
        titleZh: 'Lumimei 护肤品推荐',
        titleEn: 'Lumimei Recommended Product',
        badgeKm: '✨ ណែនាំផលិតផលចម្បង',
        badgeZh: '✨ 核心推荐单品',
        badgeEn: '✨ Recommended Single Product',
        storeProductId: 'p1',
        priceUsd: 0,
        image: '',
        productNameKm: '',
        productNameZh: '',
        productNameEn: '',
        reasonKm: 'សម្រាប់មុនក្បាលស និងមុនក្បាលខ្មៅ ជួយបឺតកាកសំណល់ខ្លាញ់ សម្អាតរន្ធញើស និងជម្រុះកោសិកាងាប់ៗ។',
        reasonZh: '针对白头与黑头粉刺，帮助温和吸附毛孔油脂污垢，软化老化角质。',
        reasonEn: 'For whiteheads and blackheads, purifying congested pores and drawing out excess sebum is key.',
      };
    } else {
      // No Recommend (hormonal or others)
      rec = {
        recommendationType: 'none',
        titleKm: 'គ្មានការណែនាំផលិតផលជាក់លាក់ទេ (No Recommend)',
        titleZh: '暂不推荐特定护肤品（保持精简护肤）',
        titleEn: 'No Product Recommended (Prioritize Minimal Care)',
        badgeKm: '💡 ការណែនាំថែទាំពិសេស',
        badgeZh: '💡 专业护理建议',
        badgeEn: '💡 Skincare Guidance',
        priceUsd: 0,
        image: '',
        productNameKm: '',
        productNameZh: '',
        productNameEn: '',
        reasonKm:
          'សម្រាប់ប្រភេទមុនអកម៉ូន ឬបញ្ហាស្បែកផ្សេងៗ Lumimei មិនណែនាំឱ្យប្រញាប់ទិញផលិតផលច្រើនមុខនោះទេ។ បញ្ហានេះច្រើនបណ្ដាលមកពីកត្តាខាងក្នុង (អ័រម៉ូន ដំណេក ស្ត្រេស ឬរបបអាហារ)។ សូមរក្សាការថែទាំបែបសាមញ្ញ និងទាក់ទងមកក្រុមការងារ Lumimei តាម Telegram ដើម្បីពិគ្រោះយោបល់ផ្ទាល់ខ្លួន។',
        reasonZh:
          '针对内分泌/激素痘或其他类型问题，目前暂不推荐盲目购买多款护肤品。此类情况通常与内分泌紊乱、熬夜晚睡、精神压力或饮食相关。建议保持温和基础清洁，必要时可直接联系 Lumimei 进行一对一护肤咨询。',
        reasonEn:
          'For hormonal acne or other special conditions, Lumimei does not prioritize selling skincare products. These issues are often linked to internal balance, sleep, or stress. We recommend minimal gentle care and a direct Telegram consultation.',
      };
    }
  }

  // Popping Evaluation Rule (Relevant for acne flow)
  const poppingAdvice =
    poppingHistory === 'yes'
      ? {
          verdictKm: 'គួរតែបញ្ឈប់',
          verdictZh: '建议立即停止挤痘',
          verdictEn: 'Should Stop Squeezing',
          type: 'stop' as const,
          descriptionKm:
            'គួរតែបញ្ឈប់៖ ការញិចមុន ឬឱ្យគេញិចមុនញឹកញាប់ អាចបណ្ដាលឱ្យរលាកស្បែកកាន់តែខ្លាំង បាក់បែកជាលិកា និងបន្សល់ទុកនូវស្នាមក្រហម/ខ្មៅ ឬស្នាមខូងដែលពិបាកព្យាបាល។ ស្បែកមុខត្រូវការពេលវេលាដើម្បីជាសះស្បើយដោយធម្មជាតិ ដូច្នេះគួរតែបញ្ឈប់ការញិចមុនជាបន្ទាន់។',
          descriptionZh:
            '建议立即停止挤痘：频繁挤痘或前往美容院强力清痘极易破坏皮肤深层屏障，加重炎症反应并留下难褪的色素沉着甚至凹洞痘坑。皮肤具有自我修护机制，请务必停止挤压刺激。',
          descriptionEn:
            'Should Stop: Squeezing or professional extraction frequently causes deeper inflammation, breaks down collagen tissue, and leads to stubborn post-acne marks or scars. It is strongly advised to stop picking or squeezing pimples.',
        }
      : {
          verdictKm: 'គួរតែបន្ត',
          verdictZh: '请继续保持良好习惯',
          verdictEn: 'Should Continue Keeping It Up',
          type: 'continue' as const,
          descriptionKm:
            'មិនឆ្លាប់អោយគេញិចមុន ឬញិចមុនដោយខ្លួនឯងគឺជាចំនុចល្អណាស់ បងប្អូនគួរតែបន្ត',
          descriptionZh:
            '从不去美容院挤痘或自行挤痘是非常好的护肤习惯，建议继续保持。',
          descriptionEn:
            'Never having acne extracted or squeezing it yourself is a great habit, you should continue keeping it up.',
        };

  return {
    recommendation: rec,
    poppingAdvice,
    deepClosedReport,
  };
}

export function getPrimaryConcernLabel(id: PrimarySkinConcern, lang: Language): string {
  const opt = PRIMARY_CONCERN_OPTIONS.find((o) => o.id === id);
  if (!opt) return id;
  if (lang === 'zh') return opt.labelZh;
  if (lang === 'en') return opt.labelEn;
  return opt.labelKm;
}

export function getAcneLabel(id: CustomAcneType, lang: Language): string {
  const opt = ACNE_OPTIONS.find((o) => o.id === id);
  if (!opt) return id;
  if (lang === 'zh') return opt.labelZh;
  if (lang === 'en') return opt.labelEn;
  return opt.labelKm;
}

export function getPoppingLabel(id: CustomPoppingHistory, lang: Language): string {
  const opt = POPPING_OPTIONS.find((o) => o.id === id);
  if (!opt) return id;
  if (lang === 'zh') return opt.labelZh;
  if (lang === 'en') return opt.labelEn;
  return opt.labelKm;
}

export function getMakeupFrequencyLabel(id: CustomMakeupFrequency, lang: Language): string {
  const opt = MAKEUP_FREQUENCY_OPTIONS.find((o) => o.id === id);
  if (!opt) return id;
  if (lang === 'zh') return opt.labelZh;
  if (lang === 'en') return opt.labelEn;
  return opt.labelKm;
}

export function getWashFrequencyLabel(id: CustomWashFrequency, lang: Language): string {
  const opt = WASH_FREQUENCY_OPTIONS.find((o) => o.id === id);
  if (!opt) return id;
  if (lang === 'zh') return opt.labelZh;
  if (lang === 'en') return opt.labelEn;
  return opt.labelKm;
}

export function getFaceDryingMethodLabel(id: CustomFaceDryingMethod, lang: Language): string {
  const opt = FACE_DRYING_OPTIONS.find((o) => o.id === id);
  if (!opt) return id;
  if (lang === 'zh') return opt.labelZh;
  if (lang === 'en') return opt.labelEn;
  return opt.labelKm;
}

export function getAcneTriggerLabel(id: AcneTriggerTime, lang: Language): string {
  const opt = ACNE_TRIGGER_OPTIONS.find((o) => o.id === id);
  if (!opt) return id;
  if (lang === 'zh') return opt.labelZh;
  if (lang === 'en') return opt.labelEn;
  return opt.labelKm;
}

export function getMenstrualRegularityLabel(id: MenstrualRegularity, lang: Language): string {
  const opt = MENSTRUAL_REGULARITY_OPTIONS.find((o) => o.id === id);
  if (!opt) return id;
  if (lang === 'zh') return opt.labelZh;
  if (lang === 'en') return opt.labelEn;
  return opt.labelKm;
}

export function getGenderLabel(id?: AdvisorGender, lang: Language = 'km'): string {
  if (!id) return '';
  const opt = GENDER_OPTIONS.find((o) => o.id === id);
  if (!opt) return id;
  if (lang === 'zh') return opt.labelZh;
  if (lang === 'en') return opt.labelEn;
  return opt.labelKm;
}

export function getHormonalSymptomLabel(id: HormonalRecentSymptom, lang: Language): string {
  const opt = HORMONAL_RECENT_SYMPTOMS_OPTIONS.find((o) => o.id === id);
  if (!opt) return id;
  if (lang === 'zh') return opt.labelZh;
  if (lang === 'en') return opt.labelEn;
  return opt.labelKm;
}



