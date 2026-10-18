/**
 * SkinFollowUpView.tsx
 * Component for Lumimei Skincare Follow-up Tracking ("បន្តតាមដាន")
 * Features:
 *  - Top: Date picker for follow-up date with baseline comparison
 *  - Bottom: Dynamic Q&A Flow with Rule Engine for Q1, Q2, and Q3
 *  - Rule Engine Conclusion with recommendations and actions
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  ArrowRight,
  RotateCcw,
  CheckSquare,
  Square,
  BookmarkCheck,
  Send,
  HelpCircle,
  TrendingUp,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import {
  SkinChangeOption,
  FollowedAdviceOption,
  CompliancePercentageOption,
  SkinFollowUpAnswers,
  FollowUpConclusionResult,
  evaluateFollowUpRules,
  getPreviousRecommendationsForFollowUp,
  saveFollowUpRecord,
  getLatestFollowUpRecord,
  SkinFollowUpRecord,
} from '../advisor/followUpAdvisor';
import { ComedonesBaselineRecord } from '../advisor/closedComedonesAdvisor';

interface SkinFollowUpViewProps {
  baseline: ComedonesBaselineRecord | null;
  onOpenAiAdvisor?: () => void;
  onOpenReportTab: () => void;
}

export const SkinFollowUpView: React.FC<SkinFollowUpViewProps> = ({
  baseline,
  onOpenReportTab,
}) => {
  // Today's date default
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Form State
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [q1, setQ1] = useState<SkinChangeOption | ''>('');
  const [q2, setQ2] = useState<FollowedAdviceOption | ''>('');
  const [q3a, setQ3a] = useState<CompliancePercentageOption | ''>('');
  const [q3bItems, setQ3bItems] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [savedSuccessToast, setSavedSuccessToast] = useState<boolean>(false);

  // Dynamic recommendations pulled from the user's actual baseline
  const dynamicRecommendations = useMemo(() => {
    return getPreviousRecommendationsForFollowUp(baseline);
  }, [baseline]);

  // Days since baseline
  const daysSinceBaseline = useMemo(() => {
    if (!baseline || !baseline.savedAt) return null;
    const baseTime = new Date(baseline.savedAt).getTime();
    const selTime = new Date(selectedDate).getTime();
    const diff = Math.floor((selTime - baseTime) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  }, [baseline, selectedDate]);

  // Check if current flow is ready for conclusion
  const isReadyForConclusion = useMemo(() => {
    if (!q1) return false;
    // Q1 = much_improved -> skip Q2 and Q3, directly ready
    if (q1 === 'much_improved') return true;

    // Remaining 4 require Q2
    if (!q2) return false;

    // Q2 = all -> requires Q3a
    if (q2 === 'all') {
      return Boolean(q3a);
    }

    // Q2 = some -> requires at least choosing or proceeding with Q3b
    if (q2 === 'some') {
      return true; // user can pick whatever items they followed
    }

    // Q2 = none -> skip Q3, directly ready
    if (q2 === 'none') {
      return true;
    }

    return false;
  }, [q1, q2, q3a]);

  // Computed Conclusion Result
  const conclusionResult: FollowUpConclusionResult | null = useMemo(() => {
    if (!isReadyForConclusion) return null;

    const answers: SkinFollowUpAnswers = {
      date: selectedDate,
      q1_skin_change: q1,
      q2_followed_advice: q2,
      q3a_percentage: q3a,
      q3b_followed_items: q3bItems,
    };

    return evaluateFollowUpRules(answers);
  }, [isReadyForConclusion, selectedDate, q1, q2, q3a, q3bItems]);

  // Handle Q3b toggle
  const toggleQ3bItem = (textKm: string) => {
    setQ3bItems((prev) =>
      prev.includes(textKm) ? prev.filter((item) => item !== textKm) : [...prev, textKm]
    );
  };

  // Handle Save
  const handleSaveRecord = () => {
    if (!conclusionResult) return;

    const record: SkinFollowUpRecord = {
      id: `followup_${Date.now()}`,
      savedAt: new Date().toISOString(),
      answers: {
        date: selectedDate,
        q1_skin_change: q1,
        q2_followed_advice: q2,
        q3a_percentage: q3a,
        q3b_followed_items: q3bItems,
      },
      conclusion: conclusionResult,
    };

    saveFollowUpRecord(record);
    setSavedSuccessToast(true);
    setTimeout(() => setSavedSuccessToast(false), 3000);
  };

  // Reset form
  const handleReset = () => {
    setQ1('');
    setQ2('');
    setQ3a('');
    setQ3bItems([]);
    setIsSubmitted(false);
  };

  // Format date in Khmer representation
  const formatKhmerDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('km-KH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  // Format date to DD/MM/YYYY e.g. "03/10/2026"
  const formatToDDMMYYYY = (dateStr: string): string => {
    if (!dateStr) return '03/10/2026';
    try {
      const raw = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const parts = raw.split('-');
      if (parts.length === 3) {
        const y = parts[0];
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        return `${d}/${m}/${y}`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP: DATE PICKER SECTION */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 p-4 sm:p-5 rounded-3xl border border-emerald-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                  កាលបរិច្ឆេទតាមដាន
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {formatKhmerDate(selectedDate)}
              </p>
            </div>
          </div>

          {/* Date Picker Input (Displays DD/MM/YYYY e.g. 03/10/2026) */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
              ជ្រើសរើសថ្ងៃ៖
            </label>
            <div className="relative inline-flex items-center">
              <div className="bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs flex items-center justify-between gap-2.5 min-w-[125px] cursor-pointer hover:border-emerald-500 transition">
                <span className="font-mono text-xs font-black text-slate-900 tracking-wide">
                  {formatToDDMMYYYY(selectedDate)}
                </span>
                <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              />
            </div>
          </div>
        </div>

        {/* Baseline Reference Info */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-200/60 text-xs">
          {baseline ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-slate-600 font-semibold bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-100">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  ទិន្នន័យ Baseline ដើម៖{' '}
                  <strong className="text-slate-800">
                    {new Date(baseline.savedAt).toLocaleDateString('km-KH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </strong>
                </span>
              </span>

              {daysSinceBaseline !== null && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold ${
                    daysSinceBaseline >= 5 && daysSinceBaseline <= 15
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>
                    គម្លាត {daysSinceBaseline} ថ្ងៃ{' '}
                    {daysSinceBaseline >= 5 && daysSinceBaseline <= 15
                      ? '(សមស្របតាមដាន ៥-១៥ ថ្ងៃ)'
                      : '(រយៈពេលណែនាំ ៥–១៥ ថ្ងៃ)'}
                  </span>
                </span>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between w-full flex-wrap gap-2">
              <span className="text-slate-600 font-medium">
                សូមចាប់ផ្តើមកត់ត្រា និងឆ្លើយសំណួរតាមដានស្បែកមុខរបស់អ្នកខាងក្រោម៖
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. BOTTOM: Q&A QUESTIONNAIRE */}
      <div className="space-y-5">
        {/* ==================================================== */}
        {/* QUESTION 1 */}
        {/* ==================================================== */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
              ១
            </span>
            <div className="space-y-0.5">
              <h4 className="text-sm sm:text-base font-black text-slate-900">
                ក្នុងរយៈពេលកន្លងមក បងប្អូនមានអារម្មណ៍ថាស្បែកមុខផ្លាស់ប្តូរយ៉ាងដូចម្តេច?
              </h4>
              <p className="text-[11px] text-slate-500">
                សូមជ្រើសរើសចម្លើយមួយដែលត្រូវនឹងការប្រែប្រួលស្បែកមុខជាក់ស្តែងរបស់បងប្អូន
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {[
              {
                id: 'much_improved',
                label: 'ប្រសើរឡើងច្រើន',
                sub: 'ស្បែករលោង មុនកប់ថយចុះខ្លាំង គ្មានការរំខាន',
                icon: '🌟',
                color: 'border-emerald-300 hover:bg-emerald-50/50 peer-checked:border-emerald-600 peer-checked:bg-emerald-50',
              },
              {
                id: 'slightly_improved',
                label: 'ប្រសើរឡើងបន្តិច',
                sub: 'ឃើញមានការវិវត្តតិចតួច ប៉ុន្តែមិនទាន់ពេញចិត្តទាំងស្រុង',
                icon: '✨',
                color: 'border-teal-300 hover:bg-teal-50/50 peer-checked:border-teal-600 peer-checked:bg-teal-50',
              },
              {
                id: 'no_change',
                label: 'មិនមានការប្រែប្រួល',
                sub: 'កម្រិតមុន និងស្បែកមុខនៅដដែល មិនឃើញផលខុសប្លែក',
                icon: '⚖️',
                color: 'border-slate-300 hover:bg-slate-50 peer-checked:border-amber-600 peer-checked:bg-amber-50',
              },
              {
                id: 'worsened',
                label: 'ឡើងមុនលើសដើម',
                sub: 'ចំនួនគ្រាប់មុនកើនឡើង ឬចាប់ផ្តើមឡើងមុនថ្មីៗច្រើន',
                icon: '⚠️',
                color: 'border-amber-300 hover:bg-amber-50 peer-checked:border-orange-600 peer-checked:bg-orange-50',
              },
              {
                id: 'irritated_inflamed',
                label: 'មុខរោល/មុខរលាក',
                sub: 'ស្បែកក្រហាយ ក្រហម ស្ងួតរបក ឬរោលរលាកមិនស្រួល',
                icon: '🚨',
                color: 'border-rose-300 hover:bg-rose-50 peer-checked:border-rose-600 peer-checked:bg-rose-50',
              },
            ].map((opt) => (
              <label
                key={opt.id}
                className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                  q1 === opt.id
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="followup_q1"
                  value={opt.id}
                  checked={q1 === opt.id}
                  onChange={() => {
                    setQ1(opt.id as SkinChangeOption);
                    // Reset subordinate questions if user switches away
                    if (opt.id === 'much_improved') {
                      setQ2('');
                      setQ3a('');
                      setQ3bItems([]);
                    }
                  }}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{opt.icon}</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      {opt.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{opt.sub}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Special note for "ប្រសើរឡើងច្រើន" */}
          {q1 === 'much_improved' && (
            <div className="p-3 bg-emerald-100/70 rounded-2xl border border-emerald-300 flex items-center justify-between gap-3 text-xs text-emerald-950 font-bold animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  ចម្លើយ &quot;ប្រសើរឡើងច្រើន&quot; នឹងនាំទៅកាន់ការសន្និដ្ឋានភ្លាមៗ ដោយមិនបាច់ឆ្លើយសំណួរទី២!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* QUESTION 2: Shown only if Q1 is not 'much_improved' and Q1 is selected */}
        {/* ==================================================== */}
        {q1 && q1 !== 'much_improved' && (
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                ២
              </span>
              <div className="space-y-0.5">
                <h4 className="text-sm sm:text-base font-black text-slate-900">
                  បងប្អូនបានធ្វើតាមការណែនាំលើកមុនដែរឬទេ?
                </h4>
                <p className="text-[11px] text-slate-500">
                  ផ្អែកលើអនុសាសន៍ និងទម្លាប់ថែស្បែកដែលប្រព័ន្ធបានផ្តល់ជូនកាលពីលើកមុន
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {[
                {
                  id: 'all',
                  label: 'បានធ្វើតាមគ្រប់ចំណុច',
                  sub: 'អនុវត្តតាមយ៉ាងហ្មត់ចត់គ្រប់អនុសាសន៍',
                },
                {
                  id: 'some',
                  label: 'បានធ្វើតាមខ្លះ',
                  sub: 'អនុវត្តបានមួយចំនួន និងខកខានមួយចំនួន',
                },
                {
                  id: 'none',
                  label: 'មិនទាន់បានធ្វើតាមទាល់តែសោះ',
                  sub: 'មិនទាន់បានចាប់ផ្តើមអនុវត្តតាមឡើយ',
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`p-3 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-2 ${
                    q2 === opt.id
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="followup_q2"
                      value={opt.id}
                      checked={q2 === opt.id}
                      onChange={() => {
                        setQ2(opt.id as FollowedAdviceOption);
                        if (opt.id === 'all') {
                          setQ3bItems([]);
                        } else if (opt.id === 'some') {
                          setQ3a('');
                        } else {
                          // none
                          setQ3a('');
                          setQ3bItems([]);
                        }
                      }}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs sm:text-sm font-black text-slate-900 block leading-tight">
                        {opt.label}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">{opt.sub}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Note for 'none' */}
            {q2 === 'none' && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-2 text-xs text-amber-900 font-semibold animate-in fade-in">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  ចម្លើយ &quot;មិនទាន់បានធ្វើតាមទាល់តែសោះ&quot; នឹងនាំទៅកាន់ការសន្និដ្ឋានភ្លាមៗ ដោយមិនបាច់ឆ្លើយសំណួរទី៣។
                </span>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* QUESTION 3a: Shown if Q2 = 'all' */}
        {/* ==================================================== */}
        {q2 === 'all' && (
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                ៣
              </span>
              <div className="space-y-0.5">
                <h4 className="text-sm sm:text-base font-black text-slate-900">
                  បងប្អូនធ្វើតាមប៉ុន្មានភាគរយដែរ?
                </h4>
                <p className="text-[11px] text-slate-500">
                  ការវាយតម្លៃកម្រិតនៃការអនុវត្តផ្ទាល់ខ្លួន (Compliance rate)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {[
                { id: '90_100', label: '៩០-១០០%', sub: 'អនុវត្តជាប់លាប់ស្ទើរតែរាល់ថ្ងៃ' },
                { id: '70_89', label: '៧០-៨៩%', sub: 'អនុវត្តទៀងទាត់ មានភ្លេចម្តងម្កាល' },
                { id: 'below_70', label: 'ក្រោម ៧០%', sub: 'អនុវត្តមិនសូវទៀងទាត់' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-start gap-2.5 ${
                    q3a === opt.id
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="followup_q3a"
                    value={opt.id}
                    checked={q3a === opt.id}
                    onChange={() => setQ3a(opt.id as CompliancePercentageOption)}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-black text-slate-900 block">
                      {opt.label}
                    </span>
                    <p className="text-[11px] text-slate-500">{opt.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* QUESTION 3b: Shown if Q2 = 'some' */}
        {/* ==================================================== */}
        {q2 === 'some' && (
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                ៣
              </span>
              <div className="space-y-0.5">
                <h4 className="text-sm sm:text-base font-black text-slate-900">
                  បងប្អូនបានធ្វើតាមចំណុចណាខ្លះ?
                </h4>
                <p className="text-[11px] text-slate-500">
                  ជ្រើសបានច្រើន ពីបញ្ជីអនុសាសន៍ដែលបានផ្តល់ឱ្យលើកមុន (ទាញយកពីទិន្នន័យរបាយការណ៍ពិតប្រាកដរបស់អ្នក)
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {dynamicRecommendations.map((rec) => {
                const checked = q3bItems.includes(rec.textKm);
                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => toggleQ3bItem(rec.textKm)}
                    className={`w-full text-left p-3 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between gap-3 ${
                      checked
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs text-slate-900'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {checked ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 shrink-0" />
                      )}
                      <span className="text-xs sm:text-sm font-bold leading-snug">
                        {rec.textKm}
                      </span>
                    </div>
                    {checked && (
                      <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full shrink-0">
                        បានធ្វើតាម
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 italic">
              * ប្រសិនបើមានចំណុចដែលមិនបានធ្វើតាម មិនបាច់ចុចជ្រើសរើសឡើយ។
            </p>
          </div>
        )}

        {/* ==================================================== */}
        {/* SUBMIT / REVEAL CONCLUSION BUTTON */}
        {/* ==================================================== */}
        {isReadyForConclusion && !isSubmitted && (
          <div className="pt-2 animate-in fade-in">
            <button
              type="button"
              onClick={() => setIsSubmitted(true)}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>បង្ហាញការសន្និដ្ឋាន & អនុសាសន៍តាមច្បាប់ Rule Engine</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* 3. CONCLUSION & RECOMMENDATIONS DISPLAY */}
        {/* ==================================================== */}
        {isSubmitted && conclusionResult && (
          <div className="space-y-4 pt-2 animate-in fade-in duration-300">
            {/* Main Result Card */}
            <div
              className={`p-5 sm:p-6 rounded-3xl border-2 shadow-md space-y-4 ${
                conclusionResult.badgeColor === 'emerald'
                  ? 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-emerald-400'
                  : conclusionResult.badgeColor === 'amber'
                  ? 'bg-gradient-to-br from-amber-50/80 via-yellow-50/40 to-white border-amber-400'
                  : conclusionResult.badgeColor === 'orange'
                  ? 'bg-gradient-to-br from-orange-50 via-amber-50/50 to-white border-orange-400'
                  : 'bg-gradient-to-br from-rose-50 via-red-50/40 to-white border-rose-500'
              }`}
            >
              {/* Header Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  {conclusionResult.badgeColor === 'emerald' && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  )}
                  {conclusionResult.badgeColor === 'amber' && (
                    <Clock className="w-6 h-6 text-amber-600" />
                  )}
                  {conclusionResult.badgeColor === 'orange' && (
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  )}
                  {conclusionResult.badgeColor === 'rose' && (
                    <ShieldAlert className="w-6 h-6 text-rose-600" />
                  )}
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      {conclusionResult.outcomeTitleKm}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {conclusionResult.outcomeSubtitleKm}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-black px-3 py-1 rounded-xl shadow-2xs ${
                    conclusionResult.badgeColor === 'emerald'
                      ? 'bg-emerald-600 text-white'
                      : conclusionResult.badgeColor === 'amber'
                      ? 'bg-amber-500 text-white'
                      : conclusionResult.badgeColor === 'orange'
                      ? 'bg-orange-600 text-white'
                      : 'bg-rose-600 text-white animate-pulse'
                  }`}
                >
                  {conclusionResult.priorityLabelKm}
                </span>
              </div>

              {/* Full explanation */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {conclusionResult.fullExplanationKm}
              </p>

              {/* Box 1: អ្វីដែលបងប្អូនគួរបន្ត (Positive Habits to Continue) */}
              {conclusionResult.positiveHabitsToContinue.length > 0 && (
                <div className="bg-white/90 p-4 rounded-2xl border border-emerald-200 space-y-2">
                  <h4 className="text-xs font-black text-emerald-900 flex items-center gap-2 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>អ្វីដែលបងប្អូនគួរបន្ត (Positive Habits to Continue)</span>
                  </h4>
                  <ul className="space-y-1.5 pl-1">
                    {conclusionResult.positiveHabitsToContinue.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Box 2: អ្វីដែលត្រូវផ្អាក ឬកែសម្រួល (Actions / Habits to adjust or stop) */}
              {conclusionResult.actionsToAdjustOrStop.length > 0 && (
                <div className="bg-white/90 p-4 rounded-2xl border border-rose-200 space-y-2">
                  <h4 className="text-xs font-black text-rose-900 flex items-center gap-2 uppercase tracking-wider">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    <span>អ្វីដែលបងប្អូនត្រូវផ្អាក ឬកែសម្រួលជាបន្ទាន់</span>
                  </h4>
                  <ul className="space-y-1.5 pl-1">
                    {conclusionResult.actionsToAdjustOrStop.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Box 3: ផលិតផលដែលបានណែនាំ (Recommended Products) */}
              {conclusionResult.recommendedProducts.length > 0 && (
                <div className="bg-white/90 p-4 rounded-2xl border border-amber-200 space-y-3">
                  <h4 className="text-xs font-black text-amber-900 flex items-center gap-2 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>ផលិតផលណែនាំសម្រាប់ដំណាក់កាលនេះ</span>
                  </h4>
                  <div className="space-y-2">
                    {conclusionResult.recommendedProducts.map((prod, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">
                            {prod.nameKm}
                          </span>
                          <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                            {prod.routineStepKm}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {prod.descriptionKm}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Box 4: រយៈពេលតាមដានបន្ទាប់ */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-start gap-3 shadow-xs">
                <Clock className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                    ផែនការតាមដានបន្ទាប់ (Next Follow-up)
                  </span>
                  <p className="text-xs text-slate-200 leading-snug font-medium">
                    {conclusionResult.trackingPlanKm}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleReset}
                className="py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>វាយតម្លៃឡើងវិញ</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveRecord}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-98"
                >
                  <BookmarkCheck className="w-4 h-4 text-amber-300" />
                  <span>រក្សាទុកកំណត់ត្រានេះ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.open('https://t.me/lumimei_support', '_blank');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                  title="ពិគ្រោះបន្ថែម"
                >
                  <Send className="w-3.5 h-3.5 text-sky-600" />
                  <span>Telegram</span>
                </button>
              </div>
            </div>

            {/* Save Success Alert */}
            {savedSuccessToast && (
              <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold text-center shadow-lg animate-in fade-in flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>បានរក្សាទុកកំណត់ត្រាតាមដានដោយជោគជ័យ!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
