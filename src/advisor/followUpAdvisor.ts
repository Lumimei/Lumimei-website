/**
 * followUpAdvisor.ts
 * Rule Engine and State for Lumimei Skin Follow-up Tracking ("បន្តតាមដាន")
 * 
 * Rules for Questions 1, 2, and 3:
 * Q1: ក្នុងរយៈពេលកន្លងមក បងប្អូនមានអារម្មណ៍ថាស្បែកមុខផ្លាស់ប្តូរយ៉ាងដូចម្តេច?
 *     - "ប្រសើរឡើងច្រើន" -> Skips Q2, goes directly to conclusion
 *     - Others ("ប្រសើរឡើងបន្តិច", "មិនមានការប្រែប្រួល", "ឡើងមុនលើសដើម", "មុខរោល/មុខរលាក") -> lead to Q2
 * Q2: បងប្អូនបានធ្វើតាមការណែនាំលើកមុនដែរឬទេ?
 *     - "បានធ្វើតាមគ្រប់ចំណុច" -> leads to Q3a: បងប្អូនធ្វើតាមប៉ុន្មានភាគរយដែរ? (៩០-១០០% / ៧០-៨៩% / ក្រោម ៧០%)
 *     - "បានធ្វើតាមខ្លះ" -> leads to Q3b: បងប្អូនបានធ្វើតាមចំណុចណាខ្លះ? (Multi-select from dynamic recommendations of previous report)
 *     - "មិនទាន់បានធ្វើតាមទាល់តែសោះ" -> Skips Q3, goes directly to conclusion
 * Conclusion Rules (ករណី ១, ២, ៣, ៤)
 */

import {
  ComedonesBaselineRecord,
  evaluateClosedComedonesRuleBased,
} from './closedComedonesAdvisor';

export type SkinChangeOption =
  | 'much_improved' // ប្រសើរឡើងច្រើន
  | 'slightly_improved' // ប្រសើរឡើងបន្តិច
  | 'no_change' // មិនមានការប្រែប្រួល
  | 'worsened' // ឡើងមុនលើសដើម
  | 'irritated_inflamed'; // មុខរោល/មុខរលាក

export type FollowedAdviceOption =
  | 'all' // បានធ្វើតាមគ្រប់ចំណុច
  | 'some' // បានធ្វើតាមខ្លះ
  | 'none'; // មិនទាន់បានធ្វើតាមទាល់តែសោះ

export type CompliancePercentageOption =
  | '90_100' // ៩០-១០០%
  | '70_89' // ៧០-៨៩%
  | 'below_70'; // ក្រោម ៧០%

export interface SkinFollowUpAnswers {
  date: string; // YYYY-MM-DD
  q1_skin_change: SkinChangeOption | '';
  q2_followed_advice?: FollowedAdviceOption | '';
  q3a_percentage?: CompliancePercentageOption | '';
  q3b_followed_items?: string[];
}

export interface FollowUpRecommendedProduct {
  nameKm: string;
  descriptionKm: string;
  routineStepKm: string;
}

export interface FollowUpConclusionResult {
  outcomeCase: 1 | 2 | 3 | 4;
  outcomeType: string;
  outcomeTitleKm: string;
  outcomeSubtitleKm: string;
  priorityLevel: 'low' | 'medium' | 'high' | 'urgent';
  priorityLabelKm: string;
  badgeColor: 'emerald' | 'amber' | 'orange' | 'rose';
  positiveHabitsToContinue: string[];
  actionsToAdjustOrStop: string[];
  recommendedProducts: FollowUpRecommendedProduct[];
  trackingPlanKm: string;
  fullExplanationKm: string;
}

export interface SkinFollowUpRecord {
  id: string;
  savedAt: string;
  answers: SkinFollowUpAnswers;
  conclusion: FollowUpConclusionResult;
}

const FOLLOWUP_HISTORY_STORAGE_KEY = 'lumimei_skin_followup_history';

/**
 * Extracts dynamic recommendations from the user's actual baseline report.
 */
export function getPreviousRecommendationsForFollowUp(
  baseline: ComedonesBaselineRecord | null
): { id: string; textKm: string }[] {
  const list: { id: string; textKm: string }[] = [];
  const seen = new Set<string>();

  if (baseline && baseline.answers) {
    try {
      const fullResult = evaluateClosedComedonesRuleBased(baseline.answers);

      // 1. From Section 4 (Reduce / Pause actions)
      if (Array.isArray(fullResult.section4_reduce_pause)) {
        fullResult.section4_reduce_pause.forEach((item, idx) => {
          const text = item.titleKm || item.detailKm;
          if (text && !seen.has(text)) {
            seen.add(text);
            list.push({ id: `pause_${idx}_${item.id || idx}`, textKm: text });
          }
        });
      }

      // 2. From Section 6 (Next steps / Habits)
      if (Array.isArray(fullResult.section6_next_steps)) {
        fullResult.section6_next_steps.forEach((item, idx) => {
          const text = item.titleKm || item.actionKm;
          if (text && !seen.has(text)) {
            seen.add(text);
            list.push({ id: `step_${idx}`, textKm: text });
          }
        });
      }

      // 3. From Section 5 (Positive Habits to continue)
      if (Array.isArray(fullResult.section5_continue)) {
        fullResult.section5_continue.forEach((item, idx) => {
          const text = item.titleKm || item.detailKm;
          if (text && !seen.has(text)) {
            seen.add(text);
            list.push({ id: `cont_${idx}`, textKm: text });
          }
        });
      }
    } catch (e) {
      console.error('Error evaluating baseline recommendations for follow up:', e);
    }
  } else if (baseline && baseline.analysisObject) {
    const obj = baseline.analysisObject;
    if (Array.isArray(obj.priorities)) {
      obj.priorities.forEach((p, idx) => {
        const text = p.titleKm || p.actionSummaryKm;
        if (text && !seen.has(text)) {
          seen.add(text);
          list.push({ id: `prio_${idx}`, textKm: text });
        }
      });
    }
    if (Array.isArray(obj.positive_habits)) {
      obj.positive_habits.forEach((h, idx) => {
        const text = h.titleKm;
        if (text && !seen.has(text)) {
          seen.add(text);
          list.push({ id: `ph_${idx}`, textKm: text });
        }
      });
    }
  }

  // Fallbacks if user hasn't completed initial report or list is short
  if (list.length < 3) {
    const fallbacks = [
      'ផ្អាកការញិច និងកេះក្បាលមុនជាដាច់ខាត',
      'ផ្តល់សំណើមដល់ស្បែក & ពង្រឹងរនាំងស្បែកជាមួយ Lumimei សេរ៉ូម និង ប្រេងដូង',
      'ផ្អាកផលិតផលព្យាបាលមុនចាស់ៗដែលបង្កការរំខាន ក្រហាយ ឬរបក',
      'លាងសម្អាតមុខថ្នមៗ មិនប្រើកម្លាំងដុសខ្លាំង',
      'ការពារស្បែកពីកម្ដៅថ្ងៃជាប្រចាំ'
    ];
    fallbacks.forEach((fb, idx) => {
      if (!seen.has(fb)) {
        seen.add(fb);
        list.push({ id: `fallback_${idx}`, textKm: fb });
      }
    });
  }

  return list;
}

/**
 * Evaluates Follow-up answers through the Rule Engine.
 */
export function evaluateFollowUpRules(
  answers: SkinFollowUpAnswers
): FollowUpConclusionResult {
  const { q1_skin_change, q2_followed_advice, q3a_percentage, q3b_followed_items } = answers;

  // ----------------------------------------------------
  // ករណី ១៖ ចម្លើយទី១ = "ប្រសើរឡើងច្រើន" ឬ "ប្រសើរឡើងបន្តិច"
  // → លទ្ធផល៖ ផលល្អ
  // → ដាក់ក្នុង "អ្វីដែលបងប្អូនគួរបន្ត"៖ បន្តរបបថែរក្សាស្បែកបច្ចុប្បន្ន មិនចាំបាច់កែប្រែអ្វីទេ
  // → កម្រិតអាទិភាព៖ ទាប
  // ----------------------------------------------------
  if (q1_skin_change === 'much_improved' || q1_skin_change === 'slightly_improved') {
    return {
      outcomeCase: 1,
      outcomeType: 'positive_progress',
      outcomeTitleKm: 'លទ្ធផល៖ ផលល្អ (Positive Progress)',
      outcomeSubtitleKm: 'ស្បែកមានការវិវត្តជាវិជ្ជមានគួរឱ្យកត់សម្គាល់ ឆ្លើយតបយ៉ាងល្អជាមួយនឹងការថែទាំកន្លងមក',
      priorityLevel: 'low',
      priorityLabelKm: 'កម្រិតអាទិភាព៖ ទាប (មិនចាំបាច់កែប្រែអ្វីទេ)',
      badgeColor: 'emerald',
      positiveHabitsToContinue: [
        'បន្តរបបថែរក្សាស្បែកបច្ចុប្បន្ន មិនចាំបាច់កែប្រែអ្វីទេ',
        'បន្តការលាងសម្អាត និងផ្តល់សំណើមទៀងទាត់តាមទម្លាប់ដែលកំពុងធ្វើ',
        'បន្តចៀសវាងការប៉ះពាល់មុខ ឬញិចកេះក្បាលមុន'
      ],
      actionsToAdjustOrStop: [],
      recommendedProducts: [],
      trackingPlanKm: 'បន្តរក្សាទម្លាប់ល្អនេះ និងចូលមក "បន្តតាមដាន" ក្នុងគណនីខ្ញុំរៀងរាល់ ៥-១៥ ថ្ងៃម្តង ដើម្បីត្រួតពិនិត្យវឌ្ឍនភាព។',
      fullExplanationKm: 'ស្បែករបស់បងប្អូនកំពុងឆ្លើយតបយ៉ាងល្អជាមួយនឹងទម្លាប់ថែទាំបច្ចុប្បន្ន។ អ្វីដែលសំខាន់បំផុតនៅពេលនេះ គឺការរក្សាស្ថិរភាព និងមិនប្តូរផលិតផលញឹកញាប់ឡើយ។'
    };
  }

  // ----------------------------------------------------
  // ករណី ៤៖ ចម្លើយទី១ = "មុខរោល/មុខរលាក"
  // → សញ្ញាអាសន្នរនាំងការពារស្បែកខូចខាត (ខ្ពស់បំផុត / បន្ទាន់)
  // ----------------------------------------------------
  if (q1_skin_change === 'irritated_inflamed') {
    return {
      outcomeCase: 4,
      outcomeType: 'urgent_irritation',
      outcomeTitleKm: 'សញ្ញាអាសន្ន៖ ស្បែករោល/រលាក និងខូចខាតរនាំងការពារស្បែក',
      outcomeSubtitleKm: 'ស្បែកកំពុងរងប្រតិកម្មរំខាន ឬខូចរនាំងការពារស្បែក ទាមទារការសង្គ្រោះបន្ទាន់',
      priorityLevel: 'urgent',
      priorityLabelKm: 'កម្រិតអាទិភាព៖ បន្ទាន់ (Urgent Attention)',
      badgeColor: 'rose',
      positiveHabitsToContinue: [
        'លាងមុខថ្នមៗដោយប្រើតែទឹកស្អាត ឬជែលលាងមុខកម្រិតស្រាលបំផុត'
      ],
      actionsToAdjustOrStop: [
        'ត្រូវឱ្យអ្នកប្រើឈប់ប្រើផលិតផលព្យាបាលមុនចាស់ៗ ឬផលិតផលសកម្មខ្លាំងជាបន្ទាន់',
        'ឈប់ប្រើហ្វូមលាងមុខដែលធ្វើឱ្យស្បែកតឹងស្ងួត ក្រហាយ ឬរបក',
        'ហាមប្រើទឹកក្តៅលាងមុខ និងហាមញិចកេះមុខដាច់ខាត'
      ],
      recommendedProducts: [
        {
          nameKm: 'Lumimei សេរ៉ូម និង Lumimei ប្រេងដូង',
          descriptionKm: 'ជួយទៅផ្តល់សំណើមដល់ស្បែក ជួយពង្រឹងរនាំងការពារស្បែកឲ្យបានរឹងមាំ និងជួយបណ្ដុះកោសិកាថ្មីៗ សាកសមសម្រាប់បងប្អូនដែលមានអារម្មណ៍ថា ស្បែកក្រហាយ ស្ងួត របក ខ្សោយ ខូចរនាំងការពារស្បែក ឬមើលទៅមិនសូវមានជីវិត',
          routineStepKm: 'ស្តាររនាំងស្បែក & បំប៉នសំណើមបន្ទាន់'
        }
      ],
      trackingPlanKm: 'រយៈពេលតាមដានប្តូរទៅ ៥-១៥ ថ្ងៃ បន្ទាប់មកទៀត ណែនាំឱ្យអ្នកប្រើ ចូលទៅ "បន្តតាមដាន" ដែលមានក្នុងគណនីខ្ញុំ បន្ថែមទៀត។',
      fullExplanationKm: 'ស្បែករបស់បងប្អូនកំពុងបង្ហាញសញ្ញារលាក ឬខូចរនាំងការពារស្បែកធ្ងន់ធ្ងរ។ អាទិភាពដំបូងគឺត្រូវបញ្ឈប់ផលិតផលរំខានទាំងអស់ ហើយផ្តោតទាំងស្រុងលើការពង្រឹងរនាំងស្បែកឡើងវិញជាមួយ Lumimei សេរ៉ូម និង ប្រេងដូង។'
    };
  }

  // ----------------------------------------------------
  // ករណី ៣៖ ចម្លើយទី១ = "ឡើងមុនលើសដើម"
  // ----------------------------------------------------
  if (q1_skin_change === 'worsened') {
    const isCompliant = q2_followed_advice === 'all' || q2_followed_advice === 'some';

    if (isCompliant) {
      return {
        outcomeCase: 3,
        outcomeType: 'warning_flare_purging',
        outcomeTitleKm: 'លទ្ធផល៖ មុនកើនឡើង (អាចជាការរុញក្បាលមុនចាស់ ឬប្រតិកម្មផលិតផល)',
        outcomeSubtitleKm: 'ស្បែកកំពុងរុញមុនកប់ចាស់ៗចេញ ឬមានផលិតផលខ្លះមិនត្រូវនឹងស្បែក',
        priorityLevel: 'high',
        priorityLabelKm: 'កម្រិតអាទិភាព៖ ខ្ពស់ (High Priority)',
        badgeColor: 'orange',
        positiveHabitsToContinue: [
          'បន្តលាងសម្អាតមុខថ្នមៗ មិនប្រើកម្លាំងដុសខ្លាំង',
          'បន្តការពារកម្ដៅថ្ងៃ'
        ],
        actionsToAdjustOrStop: [
          'ផ្អាកជាបន្ទាន់នូវផលិតផល Active ខ្លាំង ឬផលិតផលព្យាបាលមុនចាស់ៗដែលបង្កប្រតិកម្មក្រហាយ',
          'ហាមញិចកេះមុនជាដាច់ខាត ព្រោះអាចបណ្តាលឱ្យរលាកកាន់តែខ្លាំង និងបន្សល់ស្នាមយូរអង្វែង',
          'ណែនាំប្តូរមកប្រើ Lumimei សេរ៉ូម និង Lumimei ប្រេងដូង ព្រោះអាចជួយទៅផ្តល់សំណើមដល់ស្បែក ជួយពង្រឹងរនាំងការពារស្បែកឲ្យបានរឹងមាំ និងជួយបណ្ដុះកោសិកាថ្មីៗ'
        ],
        recommendedProducts: [
          {
            nameKm: 'Lumimei សេរ៉ូម និង Lumimei ប្រេងដូង',
            descriptionKm: 'ជួយទៅផ្តល់សំណើមដល់ស្បែក ជួយពង្រឹងរនាំងការពារស្បែកឲ្យបានរឹងមាំ និងជួយបណ្ដុះកោសិកាថ្មីៗ',
            routineStepKm: 'ពង្រឹងរនាំងស្បែក & កាត់បន្ថយការរលាក'
          }
        ],
        trackingPlanKm: 'រយៈពេលតាមដានប្តូរទៅ ៥-១៥ ថ្ងៃ បន្ទាប់មកទៀត ណែនាំឱ្យអ្នកប្រើ ចូលទៅ "បន្តតាមដាន" ដែលមានក្នុងគណនីខ្ញុំ បន្ថែមទៀត។',
        fullExplanationKm: 'ការកើនឡើងនៃគ្រាប់មុនអាចកើតឡើងក្នុងដំណាក់កាលដំបូងនៃការរុញមុនកប់ចាស់ៗចេញ ឬមកពីស្បែករងប្រតិកម្ម។ ការពង្រឹងរនាំងការពារស្បែកជាមួយ Lumimei សេរ៉ូម និង ប្រេងដូង នឹងជួយសម្រួលឱ្យស្បែកឆាប់ជាសះស្បើយដោយគ្មានស្នាម។'
      };
    } else {
      // Not compliant
      return {
        outcomeCase: 3,
        outcomeType: 'warning_noncompliant_worsened',
        outcomeTitleKm: 'លទ្ធផល៖ មុនកើនឡើងដោយសារមិនទាន់បានកែសម្រួលមូលហេតុចម្បង',
        outcomeSubtitleKm: 'ទម្លាប់រំខានស្បែក និងផលិតផលខុសនៅតែបន្តធ្វើឱ្យស្បែកកាន់តែខូចខាត',
        priorityLevel: 'high',
        priorityLabelKm: 'កម្រិតអាទិភាព៖ ខ្ពស់ (High Priority)',
        badgeColor: 'orange',
        positiveHabitsToContinue: [],
        actionsToAdjustOrStop: [
          'ត្រូវបញ្ឈប់ផលិតផលដែលបានកំណត់ក្នុងសំណួរមុនជាបន្ទាន់',
          'បញ្ឈប់ការញិចកេះមុនជាដាច់ខាត'
        ],
        recommendedProducts: [
          {
            nameKm: 'ឈុតថែរក្សាមុខមុន Lumimei (ធំ)',
            descriptionKm:
              'ព្រោះឈុតថែរក្សាមុខមុន Lumimei (ឈុតធំ) ជាជំនួយការដ៏ល្អសម្រាប់ស្បែកដែលមានបញ្ហា មុនកប់ និងមុនផ្សេងៗ ជួយថែរក្សា និងកែលម្អសភាពស្បែកឱ្យកាន់តែប្រសើរឡើង ប្រកបដោយប្រសិទ្ធភាពខ្ពស់។ 💗 អ្វីដែលពិសេសនោះ គឺ មិនចាំបាច់ញិច ឬកេះមុនដោយខ្លួនឯងទេ ក៏អាចថែរក្សា និងជួយកែលម្អបញ្ហាមុនបានដែល។ ជួយកាត់បន្ថយការរលាក និងកាត់បន្ថយហានិភ័យនៃការបន្សល់ស្នាមមុនយូរអង្វែងនៅលើស្បែក។',
            routineStepKm: 'ឈុតព្យាបាលពេញលេញ'
          }
        ],
        trackingPlanKm: 'រយៈពេលតាមដានប្តូរទៅ ៥-១៥ ថ្ងៃ បន្ទាប់មកទៀត ណែនាំឱ្យអ្នកប្រើ ចូលទៅ "បន្តតាមដាន" ដែលមានក្នុងគណនីខ្ញុំ បន្ថែមទៀត។',
        fullExplanationKm: 'មុនកើនឡើងច្រើនជាងមុនដោយសារមូលហេតុចម្បងមិនទាន់ត្រូវបានដោះស្រាយ។ ការចាប់ផ្តើមអនុវត្តតាមការណែនាំ និងបញ្ឈប់ទម្លាប់ខុសជាបន្ទាន់ គឺជាដំណោះស្រាយគន្លឹះ។'
      };
    }
  }

  // ----------------------------------------------------
  // ករណី ២៖ ចម្លើយទី១ = "មិនមានការប្រែប្រួល"
  // ----------------------------------------------------
  if (q2_followed_advice === 'all' && (q3a_percentage === '90_100' || q3a_percentage === '70_89')) {
    return {
      outcomeCase: 2,
      outcomeType: 'moderate_adaptation',
      outcomeTitleKm: 'លទ្ធផល៖ ស្បែកត្រូវការពេលសម្របខ្លួនបន្ថែម ឬកែសម្រួលជំហានថែទាំ',
      outcomeSubtitleKm: 'បានអនុវត្តគ្រប់ចំណុចល្អហើយ តែស្បែកត្រូវការពេលបន្តិចទៀត',
      priorityLevel: 'medium',
      priorityLabelKm: 'កម្រិតអាទិភាព៖ មធ្យម (Medium Priority)',
      badgeColor: 'amber',
      positiveHabitsToContinue: [
        'បន្តរក្សាការលាងសម្អាតមុខថ្នមៗ និងផ្តល់សំណើមរនាំងការពារស្បែក'
      ],
      actionsToAdjustOrStop: [
        'បន្តអនុវត្តតាមផែនការថែទាំ ៥-១៥ ថ្ងៃបន្ថែមទៀត ព្រោះវដ្តជម្រុះកោសិកាស្បែកធម្មជាតិទាមទារពេលសមស្រប',
        'ប្រសិនបើនៅតែមិនមានការប្រែប្រួលបន្ទាប់ពី ៥-១៥ ថ្ងៃទៀត ណែនាំប្តូរមកប្រើ ឈុតថែរក្សាមុខមុន Lumimei (ធំ) ដើម្បីជួយព្យាបាលមុនកប់បានលឿននិងមានប្រសិទ្ធភាពខ្ពស់ ដោយមិនចាំបាច់ឲ្យគេញិចមុន ហើយមិនបន្សល់ស្នាមយូរអង្វែង'
      ],
      recommendedProducts: [
        {
          nameKm: 'ឈុតថែរក្សាមុខមុន Lumimei (ធំ)',
          descriptionKm: 'អ្នកឯកទេសជួយព្យាបាលមុនកប់ បានយ៉ាងមានប្រសិទ្ធភាពខ្ពស់ ដោយមិនចាំបាច់ឲ្យគេញិចមុន ហើយមិនបន្សល់ស្នាមយូរអង្វែង',
          routineStepKm: 'ឈុតព្យាបាលពេញលេញ'
        }
      ],
      trackingPlanKm: 'រយៈពេលតាមដានប្តូរទៅ ៥-១៥ ថ្ងៃ បន្ទាប់មកទៀត ណែនាំឱ្យអ្នកប្រើ ចូលទៅ "បន្តតាមដាន" ដែលមានក្នុងគណនីខ្ញុំ បន្ថែមទៀត។',
      fullExplanationKm: 'ស្បែកមុខត្រូវការពេលជាមធ្យមពី ២៨ ទៅ ៤៥ ថ្ងៃក្នុងការជម្រុះកោសិកាស្បែកចាស់ និងបណ្តុះកោសិកាថ្មី។ ការអនុវត្តជាប់លាប់ ៥-១៥ ថ្ងៃទៀតនឹងជួយឱ្យលទ្ធផលកាន់តែច្បាស់លាស់។'
    };
  }

  if (q2_followed_advice === 'some') {
    const followedItems = (q3b_followed_items && q3b_followed_items.length > 0)
      ? q3b_followed_items
      : ['ចំណុចអនុសាសន៍ដែលបងប្អូនបានចាប់ផ្តើមអនុវត្តរួច'];

    return {
      outcomeCase: 2,
      outcomeType: 'moderate_incomplete',
      outcomeTitleKm: 'លទ្ធផល៖ ប្រសិទ្ធភាពមិនទាន់ពេញលេញ ដោយសារការអនុវត្តនៅមានកម្រិត',
      outcomeSubtitleKm: 'បានអនុវត្តខ្លះៗ ស្បែកមិនទាន់ទទួលបានប្រសិទ្ធភាពអតិបរមា',
      priorityLevel: 'medium',
      priorityLabelKm: 'កម្រិតអាទិភាព៖ មធ្យម (Medium Priority)',
      badgeColor: 'amber',
      positiveHabitsToContinue: followedItems,
      actionsToAdjustOrStop: [
        'ត្រូវអនុវត្តបន្ថែមនូវរាល់ចំណុចអនុសាសន៍ដែលនៅសល់ឱ្យបានខ្ជាប់ខ្ជួនគ្រប់ចំណុច',
        'ផ្អាករាល់ផលិតផលដែលបង្កការរំខាន និងឈប់ញិចកេះមុនជាដាច់ខាត',
        'អនុវត្តតាមផែនការថែទាំពេញលេញឱ្យបានយ៉ាងតិច ៥-១៥ ថ្ងៃ'
      ],
      recommendedProducts: [],
      trackingPlanKm: 'រយៈពេលតាមដានប្តូរទៅ ៥-១៥ ថ្ងៃ បន្ទាប់មកទៀត ណែនាំឱ្យអ្នកប្រើ ចូលទៅ "បន្តតាមដាន" ដែលមានក្នុងគណនីខ្ញុំ បន្ថែមទៀត។',
      fullExplanationKm: 'ការថែរក្សាស្បែកមុខតម្រូវឱ្យមានការសហការរវាងការសម្អាត ការផ្តល់សំណើម និងការបញ្ឈប់ផលិតផលរំខាន។ ប្រសិនបើខ្វះជំហានណាមួយ ស្បែកនឹងពិបាកវិវត្តទៅមុខ។'
    };
  }

  // q2 === 'none' OR q3a === 'below_70'
  return {
    outcomeCase: 2,
    outcomeType: 'moderate_noncompliant',
    outcomeTitleKm: 'លទ្ធផល៖ ស្បែកមិនទាន់មានការផ្លាស់ប្តូរ ដោយសារមិនទាន់បានអនុវត្តតាមការណែនាំ',
    outcomeSubtitleKm: 'ទាមទារការចាប់ផ្តើមអនុវត្តតាមផែនការថែទាំ',
    priorityLevel: 'medium',
    priorityLabelKm: 'កម្រិតអាទិភាព៖ មធ្យម (Medium Priority)',
    badgeColor: 'amber',
    positiveHabitsToContinue: [],
    actionsToAdjustOrStop: [
      'ត្រូវចាប់ផ្តើមអនុវត្តតាមផែនការថែទាំស្បែកដែលបានណែនាំលើកមុនឱ្យបានត្រឹមត្រូវជាបន្ទាន់',
      'បញ្ឈប់ផលិតផលខុស និងទម្លាប់រំខានស្បែក',
      'ផ្តល់សំណើម និងពង្រឹងរនាំងស្បែកឱ្យបានខ្ជាប់ខ្ជួន'
    ],
    recommendedProducts: [],
    trackingPlanKm: 'ចាប់ផ្តើមអនុវត្តឱ្យបានខ្ជាប់ខ្ជួនក្នុងរយៈពេល ៥-១៥ ថ្ងៃ បន្ទាប់មកទៀត ចូលទៅ "បន្តតាមដាន" ក្នុងគណនីខ្ញុំ ម្តងទៀត។',
    fullExplanationKm: 'ស្ថានភាពស្បែកមិនទាន់មានការផ្លាស់ប្តូរ ដោយសារបងប្អូនមិនទាន់បានអនុវត្តតាមការណែនាំ។ សូមចាប់ផ្តើមកែប្រែទម្លាប់ និងផលិតផលចាប់ពីថ្ងៃនេះតទៅ។'
  };
}

/**
 * Saves a follow-up record to localStorage.
 */
export function saveFollowUpRecord(record: SkinFollowUpRecord): void {
  try {
    const existing = getFollowUpHistory();
    existing.unshift(record);
    localStorage.setItem(FOLLOWUP_HISTORY_STORAGE_KEY, JSON.stringify(existing.slice(0, 20)));
  } catch (err) {
    console.error('Failed to save follow-up record:', err);
  }
}

/**
 * Retrieves the follow-up history from localStorage.
 */
export function getFollowUpHistory(): SkinFollowUpRecord[] {
  try {
    const raw = localStorage.getItem(FOLLOWUP_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SkinFollowUpRecord[];
  } catch (err) {
    console.error('Failed to load follow-up history:', err);
    return [];
  }
}

/**
 * Retrieves the latest follow-up record from localStorage.
 */
export function getLatestFollowUpRecord(): SkinFollowUpRecord | null {
  const history = getFollowUpHistory();
  return history.length > 0 ? history[0] : null;
}
