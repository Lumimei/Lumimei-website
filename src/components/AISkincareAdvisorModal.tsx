import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  CheckSquare,
  Square,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Language, Product } from '../types';
import {
  ClosedComedonesAnswers,
  ClosedComedonesAnalysisResult,
  EMPTY_CLOSED_COMEDONES_ANSWERS,
  DEFAULT_CLOSED_COMEDONES_ANSWERS,
  getActiveComedonesQuestions,
  evaluateClosedComedonesRuleBased,
  saveComedonesBaseline,
  getComedonesBaseline,
} from '../advisor/closedComedonesAdvisor';
import { saveSkinAnalysisReport } from '../advisor/skinReportsManager';
import { ClosedComedonesResultView } from './ClosedComedonesResultView';

interface AISkincareAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
  onNavigateToAccount?: () => void;
  onNavigateToFollowUp?: () => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onSelectProduct?: (product: Product) => void;
}

export const AISkincareAdvisorModal: React.FC<AISkincareAdvisorModalProps> = ({
  isOpen,
  onClose,
  language = 'km',
  onNavigateToAccount,
  onNavigateToFollowUp,
  onAddToCart,
  onSelectProduct,
}) => {
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Form State
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [view, setView] = useState<'questionnaire' | 'result'>('questionnaire');

  // Answers State: starts empty so user chooses their own answers without pre-selected values
  const [answers, setAnswers] = useState<ClosedComedonesAnswers>(() => EMPTY_CLOSED_COMEDONES_ANSWERS);

  // Evaluated result state
  const [result, setResult] = useState<ClosedComedonesAnalysisResult | null>(null);

  // Dynamic active questions
  const activeQuestions = useMemo(() => {
    return getActiveComedonesQuestions(answers);
  }, [answers]);

  // When modal is opened fresh, ensure answers start blank and user chooses themselves
  React.useEffect(() => {
    if (isOpen) {
      setAnswers(EMPTY_CLOSED_COMEDONES_ANSWERS);
      setCurrentStep(0);
      setView('questionnaire');
      setResult(null);
    }
  }, [isOpen]);

  // Format date to DD/MM/YYYY
  const formatToDDMMYYYY = (dateStr: string): string => {
    if (!dateStr) return '04/10/2026';
    try {
      const raw = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const parts = raw.split('-');
      if (parts.length === 3) {
        const y = parts[0];
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        return `${d}/${m}/${y}`;
      }
    } catch {}
    return dateStr;
  };

  // Format date in Khmer representation
  const formatKhmerDate = (dStr: string) => {
    try {
      const parts = (dStr || todayISO).split('-');
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

        return `${toKhmerNum(day, true)} ${khmerMonths[month]} ${toKhmerNum(year)}`;
      }
    } catch {}
    return dStr;
  };

  const totalQuestions = activeQuestions.length;
  const safeStep = Math.min(currentStep, Math.max(0, totalQuestions - 1));
  const currentQ = activeQuestions[safeStep];
  const progressPercent = Math.round(((safeStep + 1) / Math.max(1, totalQuestions)) * 100);

  // Check if current question has an answer chosen by the user
  const isCurrentAnswered = useMemo(() => {
    if (!currentQ) return false;
    const val = answers[currentQ.id];
    if (currentQ.multiSelect) {
      return Array.isArray(val) && val.length > 0;
    }
    return Boolean(val && typeof val === 'string' && val.trim().length > 0);
  }, [currentQ, answers]);

  // Toggle multi-select option
  const handleToggleMulti = (key: keyof ClosedComedonesAnswers, val: string) => {
    setAnswers((prev) => {
      const currentList = (prev[key] as string[]) || [];
      let nextList = [...currentList];
      if (nextList.includes(val)) {
        nextList = nextList.filter((item) => item !== val);
      } else {
        nextList.push(val);
      }
      return {
        ...prev,
        [key]: nextList,
      };
    });
  };

  // Handle single select option: clicking selects it (and clicking again toggles off)
  const handleSelectSingle = (key: keyof ClosedComedonesAnswers, val: string) => {
    setAnswers((prev) => {
      const nextVal = prev[key] === val ? '' : val;
      const nextAnswers: ClosedComedonesAnswers = {
        ...prev,
        [key]: nextVal,
      };

      // If user answers or changes Q5 (q6_trend), ensure Q8 (q8_acne_treatment_feeling) remains compatible
      if (key === 'q6_trend') {
        const trend = nextVal;
        const currentFeeling = nextAnswers.q8_acne_treatment_feeling;
        if (trend === 'improving') {
          // In Q8, only effective_comfortable and stings_dry_peeling are allowed
          if (
            currentFeeling === 'ineffective' ||
            currentFeeling === 'acne_increased' ||
            currentFeeling === 'itchy_rash_burn'
          ) {
            nextAnswers.q8_acne_treatment_feeling = '';
          }
        } else if (
          trend === 'stable' ||
          trend === 'slight_increase' ||
          trend === 'large_increase' ||
          trend === 'rapid_spike'
        ) {
          // In Q8, only ineffective, acne_increased, and itchy_rash_burn are allowed
          if (
            currentFeeling === 'effective_comfortable' ||
            currentFeeling === 'stings_dry_peeling'
          ) {
            nextAnswers.q8_acne_treatment_feeling = '';
          }
        }
      }

      return nextAnswers;
    });
  };

  // Submit and evaluate
  const handleSubmitAndEvaluate = () => {
    const evaluation = evaluateClosedComedonesRuleBased(answers, (language as Language) || 'km');
    setResult(evaluation);

    // Save baseline for follow-up and history
    saveComedonesBaseline(answers, evaluation.analysisObject, selectedDate);
    saveSkinAnalysisReport(
      answers,
      {
        headline: evaluation.section1_summary?.badgeLabelKm || 'របាយការណ៍វិភាគស្បែកមុខ',
        summaryParagraph: evaluation.section1_summary?.appearanceTextKm || '',
        analysisObject: evaluation.analysisObject,
        severityBadgeColor: evaluation.section1_summary?.badgeColor || 'emerald',
      },
      selectedDate
    );

    setView('result');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-battambang">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#2E8B57]/30">
        {/* ========================================================================= */}
        {/* 1. TOP HEADER */}
        {/* ========================================================================= */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-[#2E8B57]/15 bg-gradient-to-r from-[#2E8B57]/10 via-[#2E8B57]/5 to-transparent flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2E8B57] text-white flex items-center justify-center shadow-md shadow-[#2E8B57]/20 shrink-0">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#2E8B57] leading-tight">
                {language === 'km'
                  ? 'វិភាគស្បែកមុខដោយឥតគិតថ្លៃ'
                  : language === 'zh'
                  ? '免费皮肤分析'
                  : 'Free Skin Analysis'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Lumimei វិភាគស្បែកមុខបែបវិទ្យាសាស្ត្រ & ណែនាំរូបមន្តផ្ទាល់ខ្លួន
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2. TOP DATE PICKER */}
        {/* ========================================================================= */}
        <div className="bg-emerald-50/80 border-b border-emerald-200/80 px-4 py-3 sm:px-6 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2E8B57] text-white flex items-center justify-center shadow-xs shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                  កាលបរិច្ឆេទវិភាគ
                </span>
              </div>
              <p className="text-xs text-slate-700 font-bold">
                {formatKhmerDate(selectedDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
              ជ្រើសរើសថ្ងៃ៖
            </label>
            <div className="relative inline-flex items-center">
              <div className="bg-white border-2 border-emerald-400 hover:border-emerald-600 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs flex items-center justify-between gap-2.5 min-w-[130px] cursor-pointer transition">
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
                title="ជ្រើសរើសកាលបរិច្ឆេទវិភាគ"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. MODAL BODY */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800 font-battambang">
          {view === 'questionnaire' && currentQ ? (
            <div className="space-y-5">
              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2E8B57] animate-pulse" />
                    <span>
                      សំណួរទី {safeStep + 1} នៃ {totalQuestions}
                    </span>
                  </span>
                  <span className="text-[#2E8B57] bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 font-bold">
                    {progressPercent}%
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-[#2E8B57] transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-emerald-100 shadow-xs space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-xl bg-[#2E8B57] text-white text-sm font-black flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    {safeStep + 1}
                  </span>
                  <div className="space-y-1">
                    <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      {language === 'zh'
                        ? currentQ.titleZh || currentQ.titleKm
                        : language === 'en'
                        ? currentQ.titleEn || currentQ.titleKm
                        : currentQ.titleKm}
                    </h4>
                    {currentQ.subtitleKm && (
                      <p className="text-xs text-slate-500 font-medium">
                        {currentQ.subtitleKm}
                      </p>
                    )}
                  </div>
                </div>

                {/* Options List - Unified format identical to Question 3 (CheckSquare 打钩) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {currentQ.options.map((opt) => {
                    const isMulti = Boolean(currentQ.multiSelect);
                    const isSelected = isMulti
                      ? ((answers[currentQ.id] as string[]) || []).includes(opt.value)
                      : (answers[currentQ.id] as string) === opt.value;

                    const handleClick = () => {
                      if (isMulti) {
                        handleToggleMulti(currentQ.id, opt.value);
                      } else {
                        handleSelectSingle(currentQ.id, opt.value);
                      }
                    };

                    return (
                      <div
                        key={opt.value}
                        onClick={handleClick}
                        className={`p-3 sm:p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'border-[#2E8B57] bg-emerald-50/80 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="mt-0.5 text-[#2E8B57] shrink-0">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 fill-emerald-100 text-[#2E8B57]" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <span
                          className={`text-xs sm:text-sm font-black block leading-snug ${
                            isSelected ? 'text-emerald-950' : 'text-slate-800'
                          }`}
                        >
                          {language === 'zh'
                            ? opt.labelZh || opt.labelKm
                            : language === 'en'
                            ? opt.labelEn || opt.labelKm
                            : opt.labelKm}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                {safeStep > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>ត្រឡប់ក្រោយ</span>
                  </button>
                ) : (
                  <div />
                )}

                {safeStep < totalQuestions - 1 ? (
                  <button
                    type="button"
                    disabled={!isCurrentAnswered}
                    onClick={() => {
                      if (isCurrentAnswered) {
                        setCurrentStep((prev) => Math.min(totalQuestions - 1, prev + 1));
                      }
                    }}
                    className={`flex items-center gap-1.5 px-6 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm shadow-md transition ${
                      isCurrentAnswered
                        ? 'bg-[#2E8B57] hover:bg-[#257347] text-white cursor-pointer hover:shadow-lg'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>សំណួរបន្ទាប់</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!isCurrentAnswered}
                    onClick={() => {
                      if (isCurrentAnswered) {
                        handleSubmitAndEvaluate();
                      }
                    }}
                    className={`flex items-center gap-2 px-6 sm:px-8 py-3 rounded-2xl font-black text-sm sm:text-base shadow-lg transition ${
                      isCurrentAnswered
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white cursor-pointer animate-pulse hover:shadow-xl'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    <span>មើលលទ្ធផលវិភាគ</span>
                  </button>
                )}
              </div>
            </div>
          ) : view === 'result' && result ? (
            <ClosedComedonesResultView
              result={result}
              language={language}
              onRetake={() => {
                setView('questionnaire');
                setCurrentStep(0);
              }}
              onNavigateToFollowUp={() => {
                onClose();
                if (onNavigateToFollowUp) {
                  onNavigateToFollowUp();
                } else if (onNavigateToAccount) {
                  onNavigateToAccount();
                }
              }}
              onAddToCart={onAddToCart}
              onSelectProduct={onSelectProduct}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
