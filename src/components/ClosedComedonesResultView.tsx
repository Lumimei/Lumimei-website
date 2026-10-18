import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  ArrowRight,
  ShieldAlert,
  Clock,
  Activity,
  ThumbsUp,
  XCircle,
  HelpCircle,
  ShoppingBag,
  Copy,
  Send,
} from 'lucide-react';
import { Language, Product } from '../types';
import { ClosedComedonesAnalysisResult } from '../advisor/closedComedonesAdvisor';
import { getAllStoredProducts } from '../utils/productManager';

interface ClosedComedonesResultViewProps {
  result: ClosedComedonesAnalysisResult;
  language?: Language;
  onRetake?: () => void;
  onNavigateToFollowUp?: () => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onSelectProduct?: (product: Product) => void;
}

export const ClosedComedonesResultView: React.FC<ClosedComedonesResultViewProps> = ({
  result,
  language = 'km',
  onRetake,
  onNavigateToFollowUp,
  onAddToCart,
  onSelectProduct,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyReport = () => {
    const summaryItems = result.section1_summary?.summaryItems || [];
    let reportText = `📋 របាយការណ៍វិភាគស្បែកមុខ Lumimei AI\n`;
    reportText += `ស្ថានភាព៖ ជ្រើសរើស «មិនប្រាកដ» ច្រើនជាង ៣ ដង\n\n`;
    reportText += `--- ព័ត៌មានចម្លើយរបស់អ្នក ---\n`;
    summaryItems.forEach((item) => {
      if (item.topicKm && item.summaryKm) {
        reportText += `• ${item.topicKm}៖ ${item.summaryKm}\n`;
      }
    });
    reportText += `\n✨ ការពិគ្រោះយោបល់ជាមួយអ្នកជំនាញគឺឥតគិតថ្លៃ!`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(reportText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }).catch(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // If user selected 3 or more "មិនប្រាកដ" (unsure) answers,
  // do NOT perform any analysis; guide user directly to Telegram specialist consultation.
  if (result.isUnsureThresholdExceeded) {
    return (
      <div className="space-y-6 font-battambang text-slate-800 animate-in fade-in duration-200">
        <div className="p-6 sm:p-8 rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#2E8B57] text-white flex items-center justify-center shadow-lg shadow-[#2E8B57]/30">
            <HelpCircle className="w-8 h-8 text-amber-300" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              លទ្ធផលវិភាគ
            </h3>
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              ត្រូវការពិគ្រោះយោបល់ផ្ទាល់ជាមួយអ្នកជំនាញ
            </span>
          </div>

          <div className="max-w-xl mx-auto space-y-4 text-left sm:text-center">
            <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-semibold">
              ដោយសារបងប្អូនបានជ្រើសរើសចម្លើយ «មិនប្រាកដ» ច្រើនជាង ៣ ដង Lumimei AI មិនទាន់មានព័ត៌មានគ្រប់គ្រាន់ ដើម្បីវិភាគស្បែកមុខរបស់បងប្អូនឱ្យបានច្បាស់លាស់នោះទេ។
            </p>

            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              សូមចម្លងរបាយការណ៍ (Report) របស់បងប្អូន រួចចុចប៊ូតុង Telegram ខាងក្រោម ហើយផ្ញើរបាយការណ៍នោះទៅកាន់អ្នកជំនាញ ដើម្បីទទួលបានការពិគ្រោះយោបល់ និងការណែនាំបន្ថែមដោយផ្ទាល់។
            </p>

            <div className="p-4 bg-emerald-100/80 rounded-2xl border border-emerald-300 text-emerald-950 font-black text-base text-center shadow-xs">
              ការពិគ្រោះយោបល់ជាមួយអ្នកជំនាញគឺឥតគិតថ្លៃ!
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4 max-w-md mx-auto">
            <button
              type="button"
              onClick={handleCopyReport}
              className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border-2 font-black text-xs sm:text-sm transition cursor-pointer shadow-xs ${
                copied
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-[#2E8B57] bg-white text-[#2E8B57] hover:bg-emerald-50'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>បានចម្លងរបាយការណ៍រួចរាល់!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>ចម្លងរបាយការណ៍ (Copy Report)</span>
                </>
              )}
            </button>

            <a
              href="https://t.me/lumimei_support"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ផ្ញើទៅកាន់ Telegram</span>
            </a>
          </div>

          {onRetake && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onRetake}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
              >
                ឆ្លើយសំណួរម្តងទៀត (Retake)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const allProducts = getAllStoredProducts();
  const {
    section1_summary,
    section3_priorities,
    section4_reduce_pause,
    section5_continue,
    section6_next_steps,
    section7_products,
  } = result;

  // Match recommended products strictly
  const recommendedItems = (section7_products?.recommendedProducts && section7_products.recommendedProducts.length > 0
    ? section7_products.recommendedProducts.map((item) => {
        const prod = allProducts.find((p) => p.id === item.id);
        if (!prod) return null;
        if (item.customNameKm) {
          return { ...prod, nameKm: item.customNameKm };
        }
        return prod;
      })
    : (section7_products?.recommendedProductIds || []).map((id) => allProducts.find((p) => p.id === id))
  ).filter(Boolean) as Product[];

  const badgeColor = section1_summary?.badgeColor || 'emerald';

  return (
    <div className="space-y-6 font-battambang text-slate-800 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* SECTION 1: ស្ថានភាពមុនកប់ពេលបច្ចុប្បន្ន (Current Condition Summary) */}
      {/* ========================================================================= */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border-2 shadow-md space-y-4 ${
          badgeColor === 'rose'
            ? 'bg-gradient-to-br from-rose-50/90 via-red-50/50 to-white border-rose-300'
            : badgeColor === 'amber'
            ? 'bg-gradient-to-br from-amber-50/90 via-yellow-50/40 to-white border-amber-300'
            : badgeColor === 'blue'
            ? 'bg-gradient-to-br from-sky-50/90 via-blue-50/40 to-white border-sky-300'
            : 'bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white border-emerald-300'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#2E8B57] text-white flex items-center justify-center shadow-md shadow-[#2E8B57]/20 shrink-0">
              <Activity className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                របាយការណ៍វិភាគស្បែកមុខ
              </h3>
            </div>
          </div>

          {section1_summary?.trendStatus ? (
            <div className="p-3 rounded-2xl bg-white/95 border border-emerald-300 shadow-2xs space-y-0.5 max-w-sm text-left">
              <div className="text-xs sm:text-sm font-black text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{section1_summary.trendStatus.titleKm}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {section1_summary.trendStatus.descriptionKm}
              </p>
            </div>
          ) : section1_summary?.badgeLabelKm ? (
            <span
              className={`text-xs font-black px-3.5 py-1.5 rounded-xl shadow-2xs ${
                badgeColor === 'rose'
                  ? 'bg-rose-600 text-white animate-pulse'
                  : badgeColor === 'amber'
                  ? 'bg-amber-600 text-white'
                  : badgeColor === 'blue'
                  ? 'bg-sky-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {section1_summary.badgeLabelKm}
            </span>
          ) : null}
        </div>

        {/* Classic / Original Clinical Definition Card for ស្ថានភាពមុនកប់ពេលបច្ចុប្បន្ន */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-white/95 border border-emerald-200/90 shadow-2xs space-y-2">
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
            មុនកប់ គឺជាប្រភេទមុនដែលកើតឡើងនៅពេលរន្ធញើសត្រូវបានស្ទះដោយខ្លាញ់ និងកោសិកាស្បែកចាស់ៗ។ ជាទូទៅ វាអាចមើលឃើញជាគ្រាប់តូចៗនៅក្រោមស្បែក និងមិនសូវមានក្បាលមុនច្បាស់។
          </p>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            ប្រសិនបើមុនកប់មានរយៈពេលយូរ ឬកើតឡើងវិញជាញឹកញាប់ គួរយកចិត្តទុកដាក់លើការសម្អាតស្បែក ការជ្រើសរើសផលិតផលថែរក្សាស្បែក និងទម្លាប់ប្រចាំថ្ងៃ ដើម្បីជួយកាត់បន្ថយការស្ទះរន្ធញើស។
          </p>
        </div>

        {/* Detailed Condition & Routine Summary Items */}
        {section1_summary?.summaryItems && section1_summary.summaryItems.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200/80">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>សង្ខេបចម្លើយ និងស្ថានភាពជាក់ស្តែងរបស់បងប្អូន ({section1_summary.summaryItems.length})៖</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {section1_summary.summaryItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white/95 border border-slate-200 text-xs space-y-0.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {item.topicKm}
                    </span>
                    {item.categoryLabelKm && (
                      <span className="text-[9px] text-slate-400 font-medium">
                        {item.categoryLabelKm}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-800 font-medium leading-snug pt-0.5">
                    {item.summaryKm}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: អ្វីដែលគួរយកចិត្តទុកដាក់ជាមុន (Priorities) */}
      {/* ========================================================================= */}
      {section3_priorities && section3_priorities.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3.5">
          <h4 className="text-xs sm:text-sm font-black text-amber-900 flex items-center gap-2 uppercase tracking-wide">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>អ្វីដែលគួរយកចិត្តទុកដាក់ដោះស្រាយជាអាទិភាព</span>
          </h4>

          <div className="space-y-2.5">
            {section3_priorities.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-1 flex items-start gap-3"
              >
                <span className="w-6 h-6 rounded-lg bg-amber-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="space-y-0.5">
                  <h5 className="text-xs sm:text-sm font-black text-amber-950">
                    {item.titleKm}
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {item.detailKm}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4 & 5: អ្វីដែលគួរតែបញ្ឈប់ & អ្វីដែលគួរបន្ត (Stop vs Continue) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* SECTION 4: អ្វីដែលគួរតែបញ្ឈប់ (Habits to Stop) */}
        <div className="bg-rose-50/70 p-5 rounded-3xl border border-rose-200 space-y-3">
          <h5 className="text-xs font-black text-rose-900 flex items-center gap-2 uppercase">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>អ្វីដែលបងប្អូនគួរតែបញ្ឈប់</span>
          </h5>

          {section4_reduce_pause && section4_reduce_pause.length > 0 ? (
            <div className="space-y-2">
              {section4_reduce_pause.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white/90 border border-rose-200/80 space-y-1"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-black text-rose-950">
                      {item.titleKm}
                    </span>
                    {item.tagKm && (
                      <span className="text-[10px] bg-rose-100 text-rose-900 font-bold px-1.5 py-0.5 rounded">
                        {item.tagKm}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {item.detailKm}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600 italic">
              មិនមានទម្លាប់គ្រោះថ្នាក់ដែលត្រូវបញ្ឈប់ជាបន្ទាន់នោះទេ។
            </p>
          )}
        </div>

        {/* SECTION 5: អ្វីដែលគួរបន្ត (Habits to Continue) */}
        <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-200 space-y-3">
          <h5 className="text-xs font-black text-emerald-900 flex items-center gap-2 uppercase">
            <ThumbsUp className="w-4 h-4 text-emerald-600" />
            <span>អ្វីដែលបងប្អូនគួរបន្តធ្វើ</span>
          </h5>

          {section5_continue && section5_continue.length > 0 ? (
            <div className="space-y-2">
              {section5_continue.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white/90 border border-emerald-200/80 space-y-1"
                >
                  <span className="text-xs font-black text-emerald-950 block">
                    {item.titleKm}
                  </span>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {item.detailKm}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600 italic">
              សូមចាប់ផ្តើមបង្កើតទម្លាប់ថែរក្សាស្បែកមុខជាប្រចាំថ្ងៃ។
            </p>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: អ្វីដែលបងប្អូនគួរធ្វើបន្ទាប់ទៀត (Next Steps) */}
      {/* ========================================================================= */}
      {section6_next_steps && section6_next_steps.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3.5">
          <h4 className="text-xs sm:text-sm font-black text-[#2E8B57] flex items-center gap-2 uppercase tracking-wide">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>អ្វីដែលបងប្អូនគួរធ្វើបន្ទាប់ទៀត</span>
          </h4>

          <div className="space-y-2.5">
            {section6_next_steps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3"
              >
                <span className="w-7 h-7 rounded-xl bg-[#2E8B57] text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {step.stepNumber}
                </span>
                <div className="space-y-0.5">
                  <h5 className="text-xs sm:text-sm font-black text-slate-900">
                    {step.titleKm}
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-line">
                    {step.actionKm}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 7: ផលិតផលដែលសមស្របសម្រាប់បងប្អូន (Recommended Routine Products) */}
      {/* ========================================================================= */}
      {recommendedItems.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-emerald-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-black text-[#2E8B57] flex items-center gap-2 uppercase">
              <ShoppingBag className="w-4 h-4 text-[#2E8B57]" />
              <span>ផលិតផល Lumimei ដែលសាកសមសម្រាប់ស្បែកមុខរបស់បងប្អូន</span>
            </h4>
            <span className="text-xs font-bold text-slate-500">
              {recommendedItems.length} មុខ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {recommendedItems.map((prod) => (
              <div
                key={prod.id}
                className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 flex items-center gap-3 hover:border-emerald-400 transition"
              >
                <img
                  src={prod.image}
                  alt={prod.nameKm}
                  className="w-16 h-16 rounded-xl object-cover border border-emerald-200 shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <h5 className="text-xs font-black text-slate-900 truncate">
                    {prod.nameKm}
                  </h5>
                  <p className="text-[11px] text-emerald-800 font-bold">
                    ${prod.priceUsd ? prod.priceUsd.toFixed(2) : '0.00'}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    {onSelectProduct && (
                      <button
                        type="button"
                        onClick={() => onSelectProduct(prod)}
                        className="text-[10px] font-bold text-slate-600 hover:text-emerald-700 underline cursor-pointer"
                      >
                        មើលលម្អិត
                      </button>
                    )}
                    {onAddToCart && (
                      <button
                        type="button"
                        onClick={() => onAddToCart(prod, 1)}
                        className="text-[10px] font-black bg-[#2E8B57] text-white px-2.5 py-1 rounded-lg hover:bg-[#257347] transition cursor-pointer"
                      >
                        ដាក់ក្នុងកន្ត្រក
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Directions / Advice for each product category */}
          {section7_products?.productDirectionsKm &&
            section7_products.productDirectionsKm.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-black text-slate-700 uppercase">
                  ការណែនាំអំពីការប្រើប្រាស់តាមលំដាប់៖
                </span>
                <div className="space-y-1.5">
                  {section7_products.productDirectionsKm.map((dir, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 text-xs text-slate-700 flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                      <span className="leading-snug">
                        <strong className="text-emerald-950">{dir.categoryKm}៖</strong>{' '}
                        {dir.adviceKm}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACTION BUTTONS (Retake, Print, Navigate to Follow-Up) */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
        {onRetake && (
          <button
            type="button"
            onClick={onRetake}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>កែប្រែចម្លើយ (Retake)</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
            title="បោះពុម្ពរបាយការណ៍"
          >
            <Printer className="w-4 h-4" />
            <span>បោះពុម្ព</span>
          </button>

          {onNavigateToFollowUp && (
            <button
              type="button"
              onClick={onNavigateToFollowUp}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2E8B57] hover:bg-[#257347] text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <span>ចូលទៅ «បន្តតាមដាន»</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
