/**
 * skinReportsManager.ts
 * Unified manager for Lumimei Skin Analysis Reports & Follow-up Tracking Reports.
 * 
 * Supports the user format:
 * - 2026.9.24 ចាប់ផ្តើមវិភាគស្បែកមុខ -> ២៤ កញ្ញា ២០២៦ វិភាគស្បែកមុខ៖ ប្រភេទ មុនកប់
 * - 2026.10.01 បន្តតាមដាន -> ០១ តុលា ២០២៦ បន្តតាមដាន៖ ប្រភេទ មុនកប់
 */

import {
  ClosedComedonesAnswers,
  ClosedComedonesAnalysisResult,
  ComedonesAnalysisObject,
  DEFAULT_CLOSED_COMEDONES_ANSWERS,
  evaluateClosedComedonesRuleBased,
  getComedonesBaseline,
  saveComedonesBaseline,
  ComedonesBaselineRecord,
} from './closedComedonesAdvisor';
import {
  SkinFollowUpRecord,
  getFollowUpHistory,
  saveFollowUpRecord,
  evaluateFollowUpRules,
} from './followUpAdvisor';

export interface UnifiedSkinReport {
  id: string;
  type: 'initial_analysis' | 'follow_up';
  dateISO: string; // e.g. "2026-09-24"
  dateShort: string; // e.g. "2026.09.24"
  dateFormattedKhmer: string; // e.g. "២៤ កញ្ញា ២០២៦"
  titleKm: string; // e.g. "វិភាគស្បែកមុខ៖ ប្រភេទ មុនកប់" or "បន្តតាមដាន៖ ប្រភេទ មុនកប់"
  categoryKm: string; // "ចាប់ផ្តើមវិភាគស្បែកមុខ" or "បន្តតាមដាន"
  acneTypeKm: string; // "ប្រភេទ មុនកប់"
  outcomeLabelKm: string;
  priorityLevel?: 'low' | 'medium' | 'high' | 'urgent';
  badgeColor: 'emerald' | 'amber' | 'orange' | 'rose' | 'blue';
  analysisResult?: ClosedComedonesAnalysisResult;
  followUpRecord?: SkinFollowUpRecord;
  answers?: any;
}

const ANALYSIS_HISTORY_KEY = 'lumimei_skin_analysis_history';

/**
 * Formats YYYY-MM-DD or ISO string into exact Khmer date representation:
 * e.g. "2026-09-24" -> "២៤ កញ្ញា ២០២៦"
 * e.g. "2026-10-01" -> "០១ តុលា ២០២៦"
 */
export function formatToKhmerReportDate(dateStr: string): string {
  try {
    const raw = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = raw.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      const khmerNumbers = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
      const toKhmerNum = (n: number, pad = false) => {
        const s = pad && n < 10 ? `0${n}` : `${n}`;
        return s.split('').map((char) => khmerNumbers[parseInt(char, 10)] || char).join('');
      };

      const khmerMonths = [
        'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
        'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ',
      ];

      const dayKh = toKhmerNum(day, true);
      const monthKh = khmerMonths[month] || '';
      const yearKh = toKhmerNum(year);

      return `${dayKh} ${monthKh} ${yearKh}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export function formatToShortDate(dateStr: string): string {
  try {
    const raw = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = raw.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parseInt(parts[1], 10);
      const day = parts[2];
      return `${year}.${month}.${day}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Retrieves all initial skin analysis history records.
 */
export function getSkinAnalysisHistory(): ComedonesBaselineRecord[] {
  try {
    const raw = localStorage.getItem(ANALYSIS_HISTORY_KEY);
    if (!raw) {
      const existingBase = getComedonesBaseline();
      if (existingBase) {
        return [existingBase];
      }
      return [];
    }
    return JSON.parse(raw) as ComedonesBaselineRecord[];
  } catch (err) {
    console.error('Failed to load skin analysis history:', err);
    return [];
  }
}

/**
 * Pushes an analysis record to the analysis history.
 */
export function recordNewSkinAnalysis(
  answers: ClosedComedonesAnswers,
  analysisResult: ClosedComedonesAnalysisResult,
  savedAtDate?: string
): void {
  try {
    const history = getSkinAnalysisHistory();
    const dateISO = savedAtDate ? new Date(savedAtDate).toISOString() : new Date().toISOString();
    const newRecord: ComedonesBaselineRecord = {
      savedAt: dateISO,
      answers,
      analysisObject: analysisResult.analysisObject,
    };
    history.unshift(newRecord);
    localStorage.setItem(ANALYSIS_HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
    saveComedonesBaseline(answers, analysisResult.analysisObject, savedAtDate);
  } catch (err) {
    console.error('Failed to record new skin analysis:', err);
  }
}

/**
 * Saves a customized skin analysis report record.
 */
export function saveSkinAnalysisReport(
  answers: ClosedComedonesAnswers,
  customData: {
    headline: string;
    summaryParagraph: string;
    analysisObject: ComedonesAnalysisObject;
    severityBadgeColor: string;
  },
  savedAtDate?: string
): void {
  try {
    const history = getSkinAnalysisHistory();
    const dateISO = savedAtDate ? new Date(savedAtDate).toISOString() : new Date().toISOString();
    const newRecord: ComedonesBaselineRecord = {
      savedAt: dateISO,
      answers,
      analysisObject: customData.analysisObject,
    };
    history.unshift(newRecord);
    localStorage.setItem(ANALYSIS_HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
    saveComedonesBaseline(answers, customData.analysisObject, savedAtDate);
  } catch (err) {
    console.error('Failed to save skin analysis report:', err);
  }
}

/**
 * Retrieves all unified reports (keeping exclusively Follow-up "បន្តតាមដាន" tracking reports).
 */
export function getAllUnifiedSkinReports(): UnifiedSkinReport[] {
  const unified: UnifiedSkinReport[] = [];

  // 1. User Skin Analysis Reports (from Free Skin Analysis)
  const analyses = getSkinAnalysisHistory();
  analyses.forEach((item, idx) => {
    const dateStr = item.savedAt ? item.savedAt.split('T')[0] : '2026-10-03';
    const result = evaluateClosedComedonesRuleBased(item.answers);
    unified.push({
      id: `free_analysis_${idx}_${item.savedAt}`,
      type: 'initial_analysis',
      dateISO: dateStr,
      dateShort: formatToShortDate(dateStr),
      dateFormattedKhmer: formatToKhmerReportDate(dateStr),
      titleKm: 'វិភាគស្បែកមុខ៖ ប្រភេទ មុនកប់',
      categoryKm: 'វិភាគស្បែកមុខដោយឥតគិតថ្លៃ',
      acneTypeKm: 'ប្រភេទ មុនកប់',
      outcomeLabelKm: result.section1_summary?.badgeLabelKm || 'របាយការណ៍វិភាគស្បែកមុខ',
      priorityLevel: 'medium',
      badgeColor: 'emerald',
      analysisResult: result,
      answers: item.answers,
    });
  });

  // 2. Follow-up Reports ("បន្តតាមដាន")
  let followUps = getFollowUpHistory();
  if (followUps.length === 0) {
    // Seed with example 2026-10-01 follow-up record
    const exampleFollowUpAnswers = {
      date: '2026-10-01',
      q1_skin_change: 'much_improved' as const,
      q2_followed_advice: 'all' as const,
      q3a_percentage: '90_100' as const,
      q3b_followed_items: [],
    };
    const exampleConclusion = evaluateFollowUpRules(exampleFollowUpAnswers);
    const exampleRecord: SkinFollowUpRecord = {
      id: 'followup_seed_2026_10_01',
      savedAt: '2026-10-01T09:00:00.000Z',
      answers: exampleFollowUpAnswers,
      conclusion: exampleConclusion,
    };
    saveFollowUpRecord(exampleRecord);
    followUps = [exampleRecord];
  }

  followUps.forEach((item, idx) => {
    const dateStr = item.answers?.date || (item.savedAt ? item.savedAt.split('T')[0] : '2026-10-01');
    const conclusion = item.conclusion;

    unified.push({
      id: item.id || `followup_${idx}_${dateStr}`,
      type: 'follow_up',
      dateISO: dateStr,
      dateShort: formatToShortDate(dateStr),
      dateFormattedKhmer: formatToKhmerReportDate(dateStr),
      titleKm: 'បន្តតាមដាន៖ ប្រភេទ មុនកប់',
      categoryKm: 'បន្តតាមដាន',
      acneTypeKm: 'ប្រភេទ មុនកប់',
      outcomeLabelKm: conclusion?.outcomeTitleKm || 'លទ្ធផល៖ ផលល្អ',
      priorityLevel: conclusion?.priorityLevel || 'low',
      badgeColor: conclusion?.badgeColor || 'emerald',
      followUpRecord: item,
      answers: item.answers,
    });
  });

  // Sort descending by date
  unified.sort((a, b) => {
    const timeA = new Date(a.dateISO).getTime();
    const timeB = new Date(b.dateISO).getTime();
    return timeB - timeA;
  });

  return unified;
}
