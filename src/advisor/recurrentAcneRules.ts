/**
 * recurrentAcneRules.ts
 * Pure Rule-Based Tag Engine for Lumimei Recurrent Acne (ឡើងមុនញឹកញាប់)
 */

export interface AcneQuestionnaireAnswers {
  // Q1: 痘痘类型 (Acne Type)
  acneType:
    | 'closed_comedones'
    | 'whiteheads'
    | 'mostly_post_acne_marks'
    | 'inflammatory_papules'
    | 'deep_painful_acne'
    | 'mixed_acne';

  // Q2: 长痘部位 (Location - 辅助信息)
  location:
    | 'tzone'
    | 'cheeks'
    | 'chin_jawline'
    | 'all_over_face'
    | 'random_spots';

  // Q3: 肤质 (Skin Type)
  skinType:
    | 'very_oily'
    | 'combination_oily'
    | 'sensitive'
    | 'dry'
    | 'normal';

  // Q4: 持续时间 (Duration)
  duration:
    | 'under_1_month'
    | '1_to_6_months'
    | 'over_6_months'
    | 'recurring';

  // Q5: 新产品 (New product in last 2-4 weeks)
  hasNewProducts: 'yes' | 'no';

  // Q6: 作息与压力 (Sleep & Stress)
  sleepStress:
    | 'late_sleep'
    | 'stress'
    | 'late_and_stress'
    | 'normal_routine';

  // Q7: 经期周期 (Cycle pattern)
  cyclePattern:
    | 'cycle_related'
    | 'not_cycle_related'
    | 'not_applicable';

  // Q8: 诱发加重时机 (Triggers / When breakouts increase) - multiple values allowed
  triggers: Array<
    | 'after_new_product'
    | 'after_late_sleep'
    | 'during_stress'
    | 'after_makeup'
    | 'daily_makeup'
    | 'no_specific_pattern'
  >;

  // Q9: 现有在使用的护肤步骤/功效产品 (Current products used) - multiple values allowed
  currentProducts: Array<
    | 'acid'
    | 'retinol'
    | 'clay_mask'
    | 'scrub'
    | 'acne_treatment'
    | 'brightening'
    | 'cleanser'
    | 'makeup_remover'
    | 'none_minimal'
  >;
}

export interface AnalysisTags {
  new_product_related?: 'high';
  active_overload?: 'high' | 'medium';
  sleep_pattern?: 'high';
  stress_pattern?: 'high';
  cycle_pattern?: boolean;
  makeup_related?: 'high';
  oiliness?: 'very_oily' | 'combination_oily' | 'normal' | 'dry';
  sensitive_skin?: boolean;
  needs_hydration?: 'high';
  needs_barrier_support?: 'high';
  needs_simplification?: 'high';
  needs_oil_control?: 'high' | 'medium';
  needs_texture_support?: boolean;
  needs_makeup_removal?: 'high';
  needs_basic_cleansing?: 'high' | boolean;
  needs_post_acne_mark_support?: boolean;
  avoid_exfoliation?: boolean;
  professional_review_needed?: 'high' | boolean;
}

export interface RuleEvaluationResult {
  tags: AnalysisTags;
  activeCount: number;
  activeProductsFound: string[];
}

/**
 * Evaluates the 9 questions and generates deterministic Analysis Tags
 */
export function evaluateRecurrentAcneRules(
  answers: AcneQuestionnaireAnswers
): RuleEvaluationResult {
  const tags: AnalysisTags = {};

  const triggers = answers.triggers || [];
  const currentProducts = answers.currentProducts || [];

  // 1) 新产品
  // Q5=有 + Q8=使用产品后痘痘增加 → new_product_related = high
  const acneIncreasedAfterProduct = triggers.includes('after_new_product');
  if (answers.hasNewProducts === 'yes' && acneIncreasedAfterProduct) {
    tags.new_product_related = 'high';
  }

  // 2) 功效产品过多
  // Q9 中以下产品计算 activeCount: acid, retinol, clay_mask, scrub, acne_treatment, brightening
  const activeProductKeys = [
    'acid',
    'retinol',
    'clay_mask',
    'scrub',
    'acne_treatment',
    'brightening',
  ];
  const activeProductsFound = currentProducts.filter((p) =>
    activeProductKeys.includes(p)
  );
  const activeCount = activeProductsFound.length;

  if (activeCount === 2) {
    tags.active_overload = 'medium';
  } else if (activeCount >= 3) {
    tags.active_overload = 'high';
    tags.needs_simplification = 'high';
  }

  const isSensitiveSkin = answers.skinType === 'sensitive';
  if (isSensitiveSkin) {
    tags.sensitive_skin = true;
    tags.needs_barrier_support = 'high';
    tags.needs_hydration = 'high';
  }

  // 如果 sensitive + activeCount>=2 → avoid_exfoliation=true, needs_barrier_support=high
  if (isSensitiveSkin && activeCount >= 2) {
    tags.avoid_exfoliation = true;
    tags.needs_barrier_support = 'high';
  }

  // If active_overload is high, barrier needs support
  if (tags.active_overload === 'high') {
    tags.avoid_exfoliation = true;
    tags.needs_barrier_support = 'high';
  }

  // 3) 作息
  // late_sleep + after_late_sleep → sleep_pattern high
  const hasLateSleepHabit =
    answers.sleepStress === 'late_sleep' ||
    answers.sleepStress === 'late_and_stress';
  const hasLateSleepTrigger = triggers.includes('after_late_sleep');
  if (hasLateSleepHabit && hasLateSleepTrigger) {
    tags.sleep_pattern = 'high';
  }

  // stress + during_stress → stress_pattern high
  const hasStressHabit =
    answers.sleepStress === 'stress' ||
    answers.sleepStress === 'late_and_stress';
  const hasStressTrigger = triggers.includes('during_stress');
  if (hasStressHabit && hasStressTrigger) {
    tags.stress_pattern = 'high';
  }

  // 4) 经期
  // cycle_related → cycle_pattern=true
  if (answers.cyclePattern === 'cycle_related') {
    tags.cycle_pattern = true;
  }

  // 5) 化妆
  // daily makeup → needs_makeup_removal high
  const hasDailyMakeup = triggers.includes('daily_makeup');
  if (hasDailyMakeup) {
    tags.needs_makeup_removal = 'high';
  }

  // after_makeup → makeup_related high → needs_makeup_removal high
  const hasAfterMakeupTrigger = triggers.includes('after_makeup');
  if (hasAfterMakeupTrigger) {
    tags.makeup_related = 'high';
    tags.needs_makeup_removal = 'high';
  }

  // 6) 肤质
  // very_oily → needs_oil_control high
  if (answers.skinType === 'very_oily') {
    tags.oiliness = 'very_oily';
    tags.needs_oil_control = 'high';
    tags.needs_basic_cleansing = true;
  } else if (answers.skinType === 'combination_oily') {
    tags.oiliness = 'combination_oily';
    tags.needs_oil_control = 'medium';
  } else if (answers.skinType === 'dry') {
    tags.oiliness = 'dry';
    tags.needs_hydration = 'high';
  } else if (answers.skinType === 'normal') {
    tags.oiliness = 'normal';
  }

  // Needs basic cleansing if no cleanser or using minimal
  const hasCleanser = currentProducts.includes('cleanser');
  if (!hasCleanser || tags.needs_simplification === 'high') {
    tags.needs_basic_cleansing = true;
  }

  // 7) 痘痘类型
  // closed_comedones / whiteheads → needs_texture_support
  if (
    answers.acneType === 'closed_comedones' ||
    answers.acneType === 'whiteheads'
  ) {
    tags.needs_texture_support = true;
  }

  // mostly_post_acne_marks → needs_post_acne_mark_support
  if (answers.acneType === 'mostly_post_acne_marks') {
    tags.needs_post_acne_mark_support = true;
  }

  // deep_painful_acne → professional_review_needed
  if (answers.acneType === 'deep_painful_acne') {
    tags.professional_review_needed = true;
    // 如果 deep_painful_acne + over_6_months/recurring → professional_review_needed=high
    if (
      answers.duration === 'over_6_months' ||
      answers.duration === 'recurring'
    ) {
      tags.professional_review_needed = 'high';
    }
  }

  return {
    tags,
    activeCount,
    activeProductsFound,
  };
}
