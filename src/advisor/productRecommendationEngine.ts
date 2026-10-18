/**
 * productRecommendationEngine.ts
 * Pure Rule Engine for Lumimei Product Scoring and Matching
 */

import { AcneQuestionnaireAnswers, AnalysisTags } from './recurrentAcneRules';
import { ADVISOR_PRODUCTS, AdvisorProduct, ProductId } from './productCatalog';

export type RecommendationTier = 'recommended' | 'consider' | 'not_prioritized';

export interface ProductScoringResult {
  productId: ProductId;
  product: AdvisorProduct;
  score: number;
  tier: RecommendationTier;
  tierLabelKm: string;
  tierLabelEn: string;
  tierLabelZh: string;
  reasonsKm: string[];
  reasonsEn: string[];
  reasonsZh: string[];
  mainExplanationKm: string;
  mainExplanationEn: string;
  mainExplanationZh: string;
}

export interface EngineResult {
  rankedProducts: ProductScoringResult[];
  recommendedPrimary: ProductScoringResult[]; // top 1-2 recommended
  considerationProducts: ProductScoringResult[];
  notPrioritizedProducts: ProductScoringResult[];
  outOfScopeNoticeKm?: string;
}

export function evaluateProductRecommendations(
  answers: AcneQuestionnaireAnswers,
  tags: AnalysisTags
): EngineResult {
  const triggers = answers.triggers || [];
  const currentProducts = answers.currentProducts || [];

  // ----------------------------------------------------
  // 1. Lumimei ម៉ាសអង្ករ (Rice Mask)
  // ----------------------------------------------------
  let riceMaskScore = 0;
  const riceReasonsKm: string[] = [];
  const riceReasonsEn: string[] = [];
  const riceReasonsZh: string[] = [];

  if (tags.needs_oil_control === 'high') {
    riceMaskScore += 3;
    riceReasonsKm.push('ជួយស្រូបយកខ្លាញ់លើស និងសម្អាតផ្ទៃមុខ');
    riceReasonsEn.push('Absorbs excess sebum and purifies surface oil');
    riceReasonsZh.push('帮助吸附多余油脂并净化肌肤表层');
  }
  if (tags.needs_texture_support) {
    riceMaskScore += 2;
    riceReasonsKm.push('ជួយសម្រួលស្បែកគ្រើម និងជម្រុះកោសិកាចាស់ៗថ្នមៗ');
    riceReasonsEn.push('Gently smooths rough skin texture');
    riceReasonsZh.push('温和改善粗糙不平整肤质');
  }
  if (
    answers.acneType === 'closed_comedones' ||
    answers.acneType === 'whiteheads'
  ) {
    riceMaskScore += 2;
    riceReasonsKm.push('ជួយសម្អាតកាកសំណល់ស្ទះក្នុងរន្ធញើស ដែលជាប្រភពនៃមុនកប់');
    riceReasonsEn.push('Helps unclog congested pores causing comedones');
    riceReasonsZh.push('有助于疏通造成闭口粉刺的毛孔堵塞');
  }

  // Negative safety factors for Rice Mask
  if (answers.skinType === 'sensitive' || tags.sensitive_skin) {
    riceMaskScore -= 4;
    riceReasonsKm.push('ស្បែកកំពុងងាយប្រតិកម្ម ត្រូវប្រយ័ត្នក្នុងការជម្រុះកោសិកា');
    riceReasonsEn.push('Sensitive skin requires caution with clay/exfoliation');
    riceReasonsZh.push('敏感偏薄肌肤需格外谨慎清洁角质');
  }
  if (tags.avoid_exfoliation) {
    riceMaskScore -= 6;
    riceReasonsKm.push('របាំងស្បែកទន់ខ្សោយ ត្រូវផ្អាកការខាត់ ឬជម្រុះកោសិកាជាមុន');
    riceReasonsEn.push('Skin barrier needs rest; avoid exfoliating for now');
    riceReasonsZh.push('屏障较脆弱，现阶段需暂停一切去角质清洁');
  }
  if (tags.active_overload === 'high') {
    riceMaskScore -= 4;
    riceReasonsKm.push('កំពុងប្រើសារធាតុសកម្មច្រើនរួចហើយ');
    riceReasonsEn.push('Already using high-strength actives');
    riceReasonsZh.push('当前已有较多功效型产品堆叠');
  }
  if (currentProducts.includes('clay_mask')) {
    riceMaskScore -= 3;
    riceReasonsKm.push('បងប្អូនមានប្រើម៉ាសភក់រួចហើយ');
    riceReasonsEn.push('Already using a clay mask');
    riceReasonsZh.push('日常已有使用泥膜步骤');
  }
  if (currentProducts.includes('scrub')) {
    riceMaskScore -= 3;
    riceReasonsKm.push('បងប្អូនមានប្រើស្ក្រាប់ខាត់មុខរួចហើយ');
    riceReasonsEn.push('Already using physical scrub');
    riceReasonsZh.push('日常已有磨砂去角质步骤');
  }
  if (currentProducts.includes('acid')) {
    riceMaskScore -= 2;
    riceReasonsKm.push('បងប្អូនមានប្រើផលិតផលជាតិអាស៊ីត (Acid)');
    riceReasonsEn.push('Already using acid exfoliants');
    riceReasonsZh.push('日常正在使用酸类成分');
  }
  if (currentProducts.includes('retinol')) {
    riceMaskScore -= 2;
    riceReasonsKm.push('បងប្អូនមានប្រើ Retinol');
    riceReasonsEn.push('Already using Retinol');
    riceReasonsZh.push('日常正在使用 A醇/视黄醇');
  }

  // ----------------------------------------------------
  // 2. Lumimei សេរ៉ូម (Serum)
  // ----------------------------------------------------
  let serumScore = 0;
  const serumReasonsKm: string[] = [];
  const serumReasonsEn: string[] = [];
  const serumReasonsZh: string[] = [];

  if (tags.needs_hydration === 'high') {
    serumScore += 3;
    serumReasonsKm.push('ផ្ដល់សំណើមជ្រៅជួយឱ្យស្បែកមានតុល្យភាពទឹកនិងខ្លាញ់');
    serumReasonsEn.push('Deeply hydrates and balances moisture levels');
    serumReasonsZh.push('深层补充水分并平衡水油状态');
  }
  if (tags.needs_barrier_support === 'high') {
    serumScore += 4;
    serumReasonsKm.push('ជួយស្ដារ និងពង្រឹងរបាំងការពារស្បែកដែលខ្សោយ');
    serumReasonsEn.push('Strengthens and calms weakened skin barrier');
    serumReasonsZh.push('密集修护稳固受损脆弱的肌肤屏障');
  }
  if (answers.skinType === 'sensitive' || tags.sensitive_skin) {
    serumScore += 3;
    serumReasonsKm.push('រូបមន្តស្រាលស្រទន់ ជួយសម្រាលការរោលក្រហម');
    serumReasonsEn.push('Gentle comfort for sensitive irritation');
    serumReasonsZh.push('温和舒缓，减轻泛红不适');
  }
  if (answers.skinType === 'dry') {
    serumScore += 3;
    serumReasonsKm.push('ជួយកាត់បន្ថយភាពតឹង និងស្ងួតស្បែក');
    serumReasonsEn.push('Relieves dryness and skin tightness');
    serumReasonsZh.push('有效缓解干燥紧绷');
  }
  if (tags.active_overload === 'high') {
    serumScore += 3;
    serumReasonsKm.push('ជួយសម្រាលស្បែកដែលនឿយហត់ពីសារធាតុសកម្មច្រើន');
    serumReasonsEn.push('Soothes skin stressed by too many active treatments');
    serumReasonsZh.push('舒缓因多重功效刺激产生的肌肤负担');
  }
  if (tags.needs_simplification === 'high') {
    serumScore += 2;
    serumReasonsKm.push('ផ្ដោតលើការលួងលោមស្បែកក្នុងទម្រង់សាមញ្ញបំផុត');
    serumReasonsEn.push('Focuses on clean hydration in simplified routine');
    serumReasonsZh.push('在精简护肤中专注温和补水与安抚');
  }
  if (tags.needs_post_acne_mark_support) {
    serumScore += 2;
    serumReasonsKm.push('ជួយផ្ដល់សំណើមគាំទ្រការសះស្បើយ និងបំប៉នស្នាម');
    serumReasonsEn.push('Supports recovery and care for post-acne marks');
    serumReasonsZh.push('滋养修护印痕，辅助痘后恢复');
  }

  // ----------------------------------------------------
  // 3. Lumimei ប្រេងដូង (Coconut Oil)
  // ----------------------------------------------------
  let coconutScore = 0;
  const coconutReasonsKm: string[] = [];
  const coconutReasonsEn: string[] = [];
  const coconutReasonsZh: string[] = [];

  const hasDailyMakeup = triggers.includes('daily_makeup');
  const hasAfterMakeup = triggers.includes('after_makeup');
  const hasOccasionalMakeup = hasAfterMakeup && !hasDailyMakeup;

  if (tags.needs_makeup_removal === 'high') {
    coconutScore += 4;
    coconutReasonsKm.push('ជួយរំលាយគ្រឿងសម្អាង និងធូលីជាប់ស្បែកជំហានដំបូង');
    coconutReasonsEn.push('Dissolves makeup and stubborn impurities gently');
    riceReasonsZh.push('第一步温和融解彩妆与深层毛孔污垢');
  }
  if (hasDailyMakeup) {
    coconutScore += 3;
    coconutReasonsKm.push('បងប្អូនផាត់មុខប្រចាំថ្ងៃ ត្រូវការលាងសម្អាតពីរតង់ឱ្យស្អាតល្អ');
    coconutReasonsEn.push('Essential first-step cleanse for daily makeup wearers');
    coconutReasonsZh.push('日常有化妆习惯，需要双重清洁避免残留');
  }
  if (hasOccasionalMakeup) {
    coconutScore += 2;
    coconutReasonsKm.push('ជួយសម្អាតគ្រឿងសម្អាងពេលផាត់មុខម្ដងម្កាល');
    coconutReasonsEn.push('Gentle makeup cleanser for occasional makeup');
    coconutReasonsZh.push('适合日常偶尔化妆时的温和卸除');
  }
  if (hasAfterMakeup) {
    coconutScore += 2;
    coconutReasonsKm.push('កាត់បន្ថយការស្ទះរន្ធញើសដែលកើតឡើងក្រោយពេលផាត់មុខ');
    coconutReasonsEn.push('Helps prevent congestion often noticed after makeup');
    coconutReasonsZh.push('减少带妆后可能产生的毛孔堵塞隐患');
  }
  if (currentProducts.includes('makeup_remover')) {
    coconutScore -= 2;
    coconutReasonsKm.push('បងប្អូនមានទឹកជូតគ្រឿងសម្អាងរួចហើយ');
    coconutReasonsEn.push('Already using a makeup remover');
    coconutReasonsZh.push('日常已有卸妆产品');
  }

  // ----------------------------------------------------
  // 4. Lumimei សាប៊ូ (Soap)
  // ----------------------------------------------------
  let soapScore = 0;
  const soapReasonsKm: string[] = [];
  const soapReasonsEn: string[] = [];
  const soapReasonsZh: string[] = [];

  if (answers.skinType === 'very_oily') {
    soapScore += 3;
    soapReasonsKm.push('ជួយលាងសម្អាតជាតិខ្លាញ់កកកុញ និងកាកសំណល់លើស្បែក');
    soapReasonsEn.push('Thoroughly washes away excess sebum and residue');
    soapReasonsZh.push('洗净多余油脂与表层油腻堆积');
  }
  if (answers.skinType === 'combination_oily') {
    soapScore += 2;
    soapReasonsKm.push('ជួយឱ្យផ្ទៃមុខមានអារម្មណ៍ស្រស់ថ្លា និងស្អាតល្អ');
    soapReasonsEn.push('Refreshing cleanse for combination zones');
    soapReasonsZh.push('为混合偏油肤质提供清爽洗感');
  }
  if (tags.needs_basic_cleansing) {
    soapScore += 3;
    soapReasonsKm.push('ជាជំហានលាងសម្អាតគ្រឹះប្រចាំថ្ងៃដ៏សំខាន់');
    soapReasonsEn.push('Serves as essential daily foundational cleanser');
    soapReasonsZh.push('作为每日基础必备的日常温和洗护');
  }
  if (hasDailyMakeup) {
    soapScore += 1;
    soapReasonsKm.push('ជួយលាងសម្អាតជំហានទីពីរ (Double Cleanse) បន្ទាប់ពីលាងប្រេង');
    soapReasonsEn.push('Acts as second cleanse following oil cleanser');
    soapReasonsZh.push('作为卸妆后的第二重水洗清洁');
  }
  if (answers.skinType === 'dry') {
    soapScore -= 2;
    soapReasonsKm.push('ស្បែកស្ងួត ត្រូវប្រយ័ត្នកុំឱ្យបាត់បង់សំណើម');
    soapReasonsEn.push('Dry skin needs extra hydrating cleansers');
    soapReasonsZh.push('偏干肤质需格外注意保水保湿');
  }
  if (answers.skinType === 'sensitive' || tags.sensitive_skin) {
    soapScore -= 2;
    soapReasonsKm.push('ស្បែកស្តើងងាយរោល ត្រូវការការលាងបែបស្រាលបំផុត');
    soapReasonsEn.push('Sensitive skin requires ultra-mild touch');
    soapReasonsZh.push('敏感泛红肌需极轻柔清洁手法');
  }
  if (currentProducts.includes('cleanser')) {
    soapScore -= 1;
    soapReasonsKm.push('បងប្អូនមានហ្វូមលាងមុខប្រចាំថ្ងៃរួចហើយ');
    soapReasonsEn.push('Already have a regular facial cleanser');
    soapReasonsZh.push('日常已备有洁面单品');
  }

  // ----------------------------------------------------
  // Classification helper
  // score >= 5 → recommended
  // score 3-4 → consider
  // score <= 2 → not_prioritized
  // ----------------------------------------------------
  function classify(
    id: ProductId,
    score: number,
    reasonsKm: string[],
    reasonsEn: string[],
    reasonsZh: string[]
  ): ProductScoringResult {
    let tier: RecommendationTier = 'not_prioritized';
    let tierLabelKm = 'បច្ចុប្បន្នមិនទាន់ជាអាទិភាព';
    let tierLabelEn = 'Currently not prioritized';
    let tierLabelZh = '目前不优先';

    if (score >= 5) {
      tier = 'recommended';
      tierLabelKm = 'កាន់តែសមស្របនឹងទិសដៅថែទាំបច្ចុប្បន្ន';
      tierLabelEn = 'Better matches current care direction';
      tierLabelZh = '更符合你目前的护理方向';
    } else if (score >= 3) {
      tier = 'consider';
      tierLabelKm = 'អាចពិចារណាបាន';
      tierLabelEn = 'Can be considered';
      tierLabelZh = '可以考虑';
    }

    const product = ADVISOR_PRODUCTS[id];

    // Build polite, non-medical explanations
    let mainExplanationKm = '';
    let mainExplanationEn = '';
    let mainExplanationZh = '';

    if (tier === 'recommended') {
      mainExplanationKm = `ផ្អែកលើចម្លើយរបស់បងប្អូន ផលិតផលនេះ${tierLabelKm}៖ ${reasonsKm.slice(0, 2).join(' និង ')}។`;
      mainExplanationEn = `Based on your responses, this product ${tierLabelEn}: ${reasonsEn.slice(0, 2).join(' and ')}.`;
      mainExplanationZh = `根据您的问卷回答，此单品${tierLabelZh}：${reasonsZh.slice(0, 2).join('，')}。`;
    } else if (tier === 'consider') {
      mainExplanationKm = `ផលិតផលនេះ${tierLabelKm} ប្រសិនបងប្អូនចង់ពង្រឹងបន្ថែមលើផ្នែកនេះ ប៉ុន្តែមិនមែនជាបន្ទាន់បំផុតឡើយ។`;
      mainExplanationEn = `This product ${tierLabelEn} if you wish to supplement this area, though not urgently required.`;
      mainExplanationZh = `此单品${tierLabelZh}，可作为辅助备选，但非当前最紧迫核心。`;
    } else {
      mainExplanationKm = `ស្ថានភាពស្បែកបច្ចុប្បន្ន${tierLabelKm} ដោយសារយើងផ្ដោតលើការសម្រាល និងការពារស្បែកជាចម្បង។`;
      mainExplanationEn = `For your current skin stage, this is ${tierLabelEn} to prioritize soothing and protection first.`;
      mainExplanationZh = `针对您当下的肤况，此单品${tierLabelZh}，现阶段建议优先以温和维稳为先。`;
    }

    return {
      productId: id,
      product,
      score,
      tier,
      tierLabelKm,
      tierLabelEn,
      tierLabelZh,
      reasonsKm,
      reasonsEn,
      reasonsZh,
      mainExplanationKm,
      mainExplanationEn,
      mainExplanationZh,
    };
  }

  const list: ProductScoringResult[] = [
    classify('rice_mask', riceMaskScore, riceReasonsKm, riceReasonsEn, riceReasonsZh),
    classify('serum', serumScore, serumReasonsKm, serumReasonsEn, serumReasonsZh),
    classify('coconut_oil', coconutScore, coconutReasonsKm, coconutReasonsEn, coconutReasonsZh),
    classify('soap', soapScore, soapReasonsKm, soapReasonsEn, soapReasonsZh),
  ];

  // Sort descending by score
  const rankedProducts = [...list].sort((a, b) => b.score - a.score);

  // Top 1–2 recommended products (only those >= 5, or if none >=5, highest consider)
  const recommendedOnly = rankedProducts.filter((p) => p.tier === 'recommended');
  const considerOnly = rankedProducts.filter((p) => p.tier === 'consider');
  const notPrioritizedOnly = rankedProducts.filter((p) => p.tier === 'not_prioritized');

  let recommendedPrimary: ProductScoringResult[] = [];
  if (recommendedOnly.length > 0) {
    recommendedPrimary = recommendedOnly.slice(0, 2);
  } else if (considerOnly.length > 0) {
    // Only offer if actually matches with consider tier
    recommendedPrimary = considerOnly.slice(0, 1);
  }

  let outOfScopeNoticeKm: string | undefined = undefined;
  if (recommendedPrimary.length === 0) {
    outOfScopeNoticeKm =
      'បញ្ហានេះមិនស្ថិតក្នុងវិសាលភាព功效ផលិតផល Lumimei ដែលបានកំណត់សម្រាប់ប្រព័ន្ធនេះទេ។ សូមទាក់ទងបុគ្គលិក Lumimei ដើម្បីទទួលបានការណែនាំបន្ថែម។';
  }

  return {
    rankedProducts,
    recommendedPrimary,
    considerationProducts: considerOnly,
    notPrioritizedProducts: notPrioritizedOnly,
    outOfScopeNoticeKm,
  };
}
