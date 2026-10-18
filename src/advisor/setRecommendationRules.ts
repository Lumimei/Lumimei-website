/**
 * setRecommendationRules.ts
 * Set matching logic based on customer profile, safety constraints, and product scores
 */

import { AcneQuestionnaireAnswers, AnalysisTags } from './recurrentAcneRules';
import { ProductScoringResult } from './productRecommendationEngine';
import { getProductByIdOrFallback } from '../data/products';

export type SetId =
  | 'acne_care_large'
  | 'acne_care_small'
  | 'cleansing_3_step'
  | 'cleansing_2_step';

export interface RecommendedSet {
  id: SetId;
  storeProductId: string; // 'p1', 'p2', 'p3', etc.
  nameKm: string;
  nameEn: string;
  nameZh: string;
  priceUsd: number;
  itemsKm: string[];
  itemsEn: string[];
  itemsZh: string[];
  image: string;
  reasonKm: string;
  reasonEn: string;
  reasonZh: string;
}

export function evaluateSetRecommendation(
  answers: AcneQuestionnaireAnswers,
  tags: AnalysisTags,
  productScores: ProductScoringResult[]
): RecommendedSet | null {
  const getScore = (id: string) =>
    productScores.find((p) => p.productId === id)?.score ?? 0;

  const riceScore = getScore('rice_mask');
  const serumScore = getScore('serum');
  const soapScore = getScore('soap');
  const coconutScore = getScore('coconut_oil');

  // Safety flags
  const isSafetyRiskForExfoliation =
    tags.avoid_exfoliation === true ||
    tags.sensitive_skin === true ||
    tags.active_overload === 'high';

  const needsFullRoutine =
    answers.currentProducts.includes('none_minimal') ||
    answers.currentProducts.length <= 1;

  // 1) acne_care_large (Rice Mask + Serum + Coconut Oil + Soap)
  // 只有当：需要完整 routine + Serum 匹配 (score >= 3) + Soap 匹配 (score >= 3) + Rice Mask 没有触发 avoid_exfoliation 才推荐
  if (
    needsFullRoutine &&
    serumScore >= 3 &&
    soapScore >= 3 &&
    !isSafetyRiskForExfoliation &&
    riceScore >= 3
  ) {
    const prod = getProductByIdOrFallback('p1');
    return {
      id: 'acne_care_large',
      storeProductId: 'p1',
      nameKm: prod.nameKm || 'ឈុតថែរក្សាមុខមុន (ធំ)',
      nameEn: prod.name || 'Acne Care Set (Large)',
      nameZh: prod.nameZh || 'Lumimei 祛痘修护大套装',
      priceUsd: prod.priceUsd,
      itemsKm: ['ម៉ាសអង្ករ', 'សេរ៉ូម', 'ប្រេងដូង', 'សាប៊ូ'],
      itemsEn: ['Rice Mask', 'Serum', 'Coconut Oil', 'Soap'],
      itemsZh: ['大米面膜', '修护精华', '冷榨椰子油', '草本手工皂'],
      image: prod.image,
      reasonKm:
        'កាន់តែសមស្របសម្រាប់បងប្អូនដែលត្រូវការជំហានថែទាំគ្រប់ជ្រុងជ្រោយ ចាប់ពីការលាងសម្អាត រហូតដល់ការបំប៉ន និងសម្រួលស្បែក។',
      reasonEn:
        'Best for customers who need a complete, balanced routine from gentle cleansing to barrier nourishing.',
      reasonZh:
        '更符合需要建立整套完整护肤流程的顾客，涵盖温和清洁、深层调理与舒缓滋润。',
    };
  }

  // 2) cleansing_3_step (Rice Mask + Coconut Oil + Soap)
  // 适合：needs_makeup_removal high + needs_oil_control medium/high + Rice Mask 没有被排除
  const hasHighMakeupRemoval = tags.needs_makeup_removal === 'high';
  const hasOilControlNeed =
    tags.needs_oil_control === 'high' || tags.needs_oil_control === 'medium';

  if (
    hasHighMakeupRemoval &&
    hasOilControlNeed &&
    !isSafetyRiskForExfoliation &&
    riceScore >= 3
  ) {
    const prod = getProductByIdOrFallback('p1');
    return {
      id: 'cleansing_3_step',
      storeProductId: 'p1', // related cleansing bundle
      nameKm: prod.nameKm || 'ឈុតលាងសម្អាត ៣ តង់ (Cleansing Trio)',
      nameEn: prod.name || '3-Step Deep Cleansing Set',
      nameZh: prod.nameZh || 'Lumimei 三重净肤清洁套装',
      priceUsd: prod.priceUsd,
      itemsKm: ['ប្រេងដូង', 'សាប៊ូ', 'ម៉ាសអង្ករ'],
      itemsEn: ['Coconut Oil', 'Soap', 'Rice Mask'],
      itemsZh: ['冷榨椰子油', '草本洁面皂', '大米面膜'],
      image: prod.image,
      reasonKm:
        'កាន់តែសមស្របសម្រាប់បងប្អូនដែលផាត់មុខ និងមានជាតិខ្លាញ់កកកុញច្រើន ត្រូវការការសម្អាត និងបឺតជាតិពុលយ៉ាងម៉ត់ចត់។',
      reasonEn:
        'Tailored for regular makeup wearers with oily/congested pores needing layered purification.',
      reasonZh:
        '更符合日常带妆、皮脂旺盛且需要多步深层净透的肌肤护理。',
    };
  }

  // 3) cleansing_2_step (Coconut Oil + Soap)
  // 适合：needs_makeup_removal high + 需要基础清洁 + Rice Mask 不是当前重点
  if (
    hasHighMakeupRemoval &&
    (tags.needs_basic_cleansing || isSafetyRiskForExfoliation || riceScore < 3)
  ) {
    const prod = getProductByIdOrFallback('p3');
    return {
      id: 'cleansing_2_step',
      storeProductId: 'p3',
      nameKm: prod.nameKm || 'ឈុតលាងមុខ ២ តង់ (Double Cleansing Set)',
      nameEn: prod.name || 'Double Cleansing Set',
      nameZh: prod.nameZh || 'Lumimei 双重水油洁面套装',
      priceUsd: prod.priceUsd,
      itemsKm: ['ប្រេងដូង', 'សាប៊ូ'],
      itemsEn: ['Coconut Oil', 'Soap'],
      itemsZh: ['冷榨椰子油', '草本洁面皂'],
      image: prod.image,
      reasonKm:
        'កាន់តែសមស្របសម្រាប់ការលាងសម្អាតគ្រឿងសម្អាង និងធូលីកខ្វក់ឱ្យបានស្អាតល្អ ដោយមិនធ្វើឱ្យស្បែកស្ងួត ឬរោល។',
      reasonEn:
        'Ideal for gentle, thorough makeup and impurity removal without harsh stripping.',
      reasonZh:
        '更符合需要温和卸妆洁面、避免毛孔彩妆残留且不伤角质屏障的护理需求。',
    };
  }

  // 4) acne_care_small (Rice Mask)
  // 只有 Rice Mask score >= 5 才推荐
  if (riceScore >= 5 && !isSafetyRiskForExfoliation) {
    const prod = getProductByIdOrFallback('p2');
    return {
      id: 'acne_care_small',
      storeProductId: 'p2',
      nameKm: prod.nameKm || 'ឈុតថែរក្សាមុខមុន (តូច)',
      nameEn: prod.name || 'Acne Care Set (Small)',
      nameZh: prod.nameZh || 'Lumimei 祛痘修护小套装',
      priceUsd: prod.priceUsd,
      itemsKm: ['ម៉ាសអង្ករធម្មជាតិ'],
      itemsEn: ['Natural Rice Mask'],
      itemsZh: ['天然大米清洁面膜'],
      image: prod.image,
      reasonKm:
        'កាន់តែសមស្របសម្រាប់បងប្អូនដែលចង់ផ្តោតលើការកាត់បន្ថយខ្លាញ់ និងជម្រុះកាកសំណល់ស្ទះលើផ្ទៃមុខជាជំហានដំបូង។',
      reasonEn:
        'Targeted starting point for clarifying oiliness and softening congested pore plugs.',
      reasonZh:
        '更符合以净化毛孔油脂、改善闭口粗糙为首要重点的初阶护理。',
    };
  }

  return null;
}
