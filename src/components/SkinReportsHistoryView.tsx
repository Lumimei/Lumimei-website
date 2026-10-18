/**
 * SkinReportsHistoryView.tsx
 * Displays all Lumimei Skin Analysis and Follow-up reports in the exact requested card layout:
 * - Top: Show Date Picker
 * - Bottom: Responsive cards (Mobile: 1 card/row, Desktop: 3 cards/row)
 * - Exact format:
 *   - ២៤ កញ្ញា ២០២៦ | វិភាគស្បែកមុខ៖ ប្រភេទ មុនកប់
 *   - ០១ តុលា ២០២៦ | បន្តតាមដាន៖ ប្រភេទ មុនកប់
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Sparkles,
  Activity,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  Printer,
  Send,
  Filter,
  RotateCcw,
} from 'lucide-react';
import {
  UnifiedSkinReport,
  getAllUnifiedSkinReports,
  formatToKhmerReportDate,
} from '../advisor/skinReportsManager';
import { Language } from '../types';

interface SkinReportsHistoryViewProps {
  language?: Language;
  onOpenFollowUpTab: () => void;
}

export const SkinReportsHistoryView: React.FC<SkinReportsHistoryViewProps> = ({
  language = 'km',
  onOpenFollowUpTab,
}) => {
  // All reports list
  const [reports, setReports] = useState<UnifiedSkinReport[]>(() => getAllUnifiedSkinReports());

  // Dynamic today ISO date (e.g. 2026-10-03)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Date filter state - default to today's date
  const [filterDate, setFilterDate] = useState<string>(todayStr);
  const [isFilterActive, setIsFilterActive] = useState<boolean>(false);

  // Selected report for full detail modal/view
  const [selectedReport, setSelectedReport] = useState<UnifiedSkinReport | null>(null);

  // Filtered reports: show all reports initially; filter if user actively chose a specific date
  const filteredReports = useMemo(() => {
    if (!isFilterActive || !filterDate) return reports;
    return reports.filter((r) => r.dateISO === filterDate);
  }, [reports, filterDate, isFilterActive]);

  // Format date to DD/MM/YYYY e.g. "03/10/2026"
  const formatToDDMMYYYY = (dateStr: string): string => {
    const target = dateStr || todayStr;
    try {
      const raw = target.includes('T') ? target.split('T')[0] : target;
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
    return target;
  };

  // Format today's date in Khmer
  const todayFormattedKhmer = useMemo(() => {
    const todayISO = new Date().toISOString().split('T')[0];
    return formatToKhmerReportDate(todayISO);
  }, []);

  // If a report is selected, render its comprehensive detail view
  if (selectedReport) {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        {/* Back navigation header */}
        <div className="flex items-center justify-between p-3.5 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setSelectedReport(null)}
            className="flex items-center gap-2 text-xs sm:text-sm font-black text-emerald-800 hover:text-emerald-950 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ត្រឡប់ទៅបញ្ជីរបាយការណ៍ (Back to Reports List)</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold bg-emerald-600 text-white px-2.5 py-1 rounded-xl shadow-2xs">
              {selectedReport.dateFormattedKhmer}
            </span>
          </div>
        </div>

        {/* Follow-up Tracking Result */}
        {selectedReport.followUpRecord && (
          <div className="space-y-4">
            {(() => {
              const conclusion = selectedReport.followUpRecord.conclusion;
              return (
                <div
                  className={`p-5 sm:p-6 rounded-3xl border-2 shadow-md space-y-4 ${
                    conclusion.badgeColor === 'emerald'
                      ? 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-emerald-400'
                      : conclusion.badgeColor === 'amber'
                      ? 'bg-gradient-to-br from-amber-50/80 via-yellow-50/40 to-white border-amber-400'
                      : conclusion.badgeColor === 'orange'
                      ? 'bg-gradient-to-br from-orange-50 via-amber-50/50 to-white border-orange-400'
                      : 'bg-gradient-to-br from-rose-50 via-red-50/40 to-white border-rose-500'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Activity className="w-5 h-5 text-amber-300" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                          {selectedReport.titleKm}
                        </h3>
                        <p className="text-xs text-slate-600">
                          {conclusion.outcomeTitleKm} · {selectedReport.dateFormattedKhmer}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-black px-3 py-1 rounded-xl shadow-2xs ${
                        conclusion.badgeColor === 'emerald'
                          ? 'bg-emerald-600 text-white'
                          : conclusion.badgeColor === 'amber'
                          ? 'bg-amber-500 text-white'
                          : conclusion.badgeColor === 'orange'
                          ? 'bg-orange-600 text-white'
                          : 'bg-rose-600 text-white animate-pulse'
                      }`}
                    >
                      {conclusion.priorityLabelKm}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {conclusion.fullExplanationKm}
                  </p>

                  {/* Positive Habits */}
                  {conclusion.positiveHabitsToContinue.length > 0 && (
                    <div className="bg-white/90 p-4 rounded-2xl border border-emerald-200 space-y-2">
                      <h4 className="text-xs font-black text-emerald-900 flex items-center gap-2 uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>អ្វីដែលបងប្អូនគួរបន្ត (Positive Habits to Continue)</span>
                      </h4>
                      <ul className="space-y-1.5 pl-1">
                        {conclusion.positiveHabitsToContinue.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions to Adjust or Stop */}
                  {conclusion.actionsToAdjustOrStop.length > 0 && (
                    <div className="bg-white/90 p-4 rounded-2xl border border-rose-200 space-y-2">
                      <h4 className="text-xs font-black text-rose-900 flex items-center gap-2 uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>អ្វីដែលបងប្អូនត្រូវផ្អាក ឬកែសម្រួលជាបន្ទាន់</span>
                      </h4>
                      <ul className="space-y-1.5 pl-1">
                        {conclusion.actionsToAdjustOrStop.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Products */}
                  {conclusion.recommendedProducts.length > 0 && (
                    <div className="bg-white/90 p-4 rounded-2xl border border-amber-200 space-y-3">
                      <h4 className="text-xs font-black text-amber-900 flex items-center gap-2 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>ផលិតផលណែនាំសម្រាប់ដំណាក់កាលនេះ</span>
                      </h4>
                      <div className="space-y-2">
                        {conclusion.recommendedProducts.map((prod, idx) => (
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

                  {/* Next Tracking Notice */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-start gap-3 shadow-xs">
                    <Clock className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                        ផែនការតាមដានបន្ទាប់ (Next Follow-up)
                      </span>
                      <p className="text-xs text-slate-200 leading-snug font-medium">
                        {conclusion.trackingPlanKm}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Initial Free Skin Analysis Result */}
        {selectedReport.type === 'initial_analysis' && (
          <div className="space-y-4">
            <div className="p-5 sm:p-6 rounded-3xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white shadow-md space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Activity className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      {selectedReport.titleKm}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {selectedReport.outcomeLabelKm} · {selectedReport.dateFormattedKhmer}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-black px-3 py-1 rounded-xl shadow-2xs bg-emerald-600 text-white">
                  {selectedReport.acneTypeKm}
                </span>
              </div>

              <div className="p-4 bg-white/90 rounded-2xl border border-emerald-200 space-y-2">
                <h4 className="text-xs font-black text-emerald-900 flex items-center gap-2 uppercase">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>អនុសាសន៍ថែរក្សាស្បែកមុខ (Recommended Routine)</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  ណែនាំប្រើប្រាស់ ឈុតថែរក្សាមុខមុន Lumimei (ហ្វូមលាងមុខ សេរ៉ូម និងប្រេងដូងធម្មជាតិ) ដើម្បីជួយរំលាយមុនកប់ ពង្រឹងរនាំងការពារស្បែក និងកាត់បន្ថយការវិវត្តទៅជាមុនរលាក។
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReport(null);
                    onOpenFollowUpTab();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  <span>ចូលទៅ «បន្តតាមដាន»</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200 font-battambang">
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
                  កាលបរិច្ឆេទរបាយការណ៍វិភាគស្បែកមុខ
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {filterDate ? formatToKhmerReportDate(filterDate) : todayFormattedKhmer}
              </p>
            </div>
          </div>

          {/* Interactive Date Picker */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
              ជ្រើសរើសថ្ងៃ៖
            </label>
            <div className="relative inline-flex items-center">
              <div className="bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs flex items-center justify-between gap-2.5 min-w-[125px] cursor-pointer hover:border-emerald-500 transition">
                <span className="font-mono text-xs font-black text-slate-900 tracking-wide">
                  {formatToDDMMYYYY(filterDate)}
                </span>
                <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setIsFilterActive(true);
                }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              />
            </div>
            {isFilterActive && (
              <button
                type="button"
                onClick={() => {
                  setIsFilterActive(false);
                  setFilterDate(todayStr);
                }}
                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                title="បង្ហាញទាំងអស់"
              >
                បង្ហាញទាំងអស់
              </button>
            )}
          </div>
        </div>

        {/* Counter & Status Info */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200/60 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-semibold">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>
              របាយការណ៍សរុប៖{' '}
              <strong className="text-slate-900 font-black">{filteredReports.length}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenFollowUpTab}
              className="text-[11px] font-black text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              + បន្តតាមដាន
            </button>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM: CARDS GRID (Mobile: 1 card/row, Desktop: 3 cards/row) */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12 space-y-4 bg-slate-50 rounded-3xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-extrabold text-slate-800">
              មិនមានរបាយការណ៍សម្រាប់កាលបរិច្ឆេទនេះទេ
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              សូមចុចខាងក្រោមដើម្បីបង្ហាញរបាយការណ៍ទាំងអស់ ឬបន្តតាមដាន។
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setFilterDate('')}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl font-bold text-xs hover:bg-slate-300 transition cursor-pointer"
            >
              បង្ហាញរបាយការណ៍ទាំងអស់
            </button>
            <button
              onClick={onOpenFollowUpTab}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition cursor-pointer shadow-sm"
            >
              + បន្តតាមដាន
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="group p-5 sm:p-6 rounded-3xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-center bg-white shadow-2xs hover:shadow-md hover:-translate-y-0.5 border-emerald-500/30 hover:border-emerald-600"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm sm:text-base font-black text-emerald-800">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                  <span>{report.dateFormattedKhmer}</span>
                </div>
                <h4 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-700 transition leading-snug">
                  {report.titleKm}
                </h4>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
