import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Check,
  X,
  Trash2,
  HelpCircle,
  Phone,
  Send,
  MessageSquare,
  Award,
  Sparkles,
  RefreshCw,
  Eye,
  AlertTriangle,
  User,
  Filter,
  Facebook,
  Camera,
  ExternalLink,
} from 'lucide-react';
import {
  QuizSubmission,
  subscribeToQuizSubmissions,
  verifyQuizSubmission,
  rejectQuizSubmission,
  deleteQuizSubmission,
} from '../../lib/quizSubmissionService';

interface VerifyManagementProps {
  language: 'km' | 'en' | 'zh';
}

export const VerifyManagement: React.FC<VerifyManagementProps> = ({ language }) => {
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reject Modal State
  const [rejectingSubId, setRejectingSubId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('ចម្លើយមិនទាន់ស្របតាមសំណួរ សូមឆ្លើយម្តងទៀត');

  // Delete Confirmation Modal State
  const [deletingSub, setDeletingSub] = useState<QuizSubmission | null>(null);

  // Expanded card state to view answers
  const [expandedSubIds, setExpandedSubIds] = useState<{ [subId: string]: boolean }>({});

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToQuizSubmissions((list) => {
      setSubmissions(list);
      setLoading(false);
      // Auto-expand all pending cards by default
      const expands: { [key: string]: boolean } = {};
      list.forEach((s) => {
        expands[s.id] = true;
      });
      setExpandedSubIds(expands);
    });

    return () => unsubscribe();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleVerify = async (sub: QuizSubmission) => {
    setActionLoadingId(sub.id);
    try {
      const success = await verifyQuizSubmission(sub.id, 'Admin Lumimei');
      if (success) {
        // Immediately reflect verified status in local view state
        setSubmissions((prev) =>
          prev.map((item) =>
            item.id === sub.id
              ? {
                  ...item,
                  status: 'verified',
                  pointsAwarded: sub.pointsAwarded || 10,
                  verifiedAt: new Date().toISOString(),
                  verifiedBy: 'Admin Lumimei',
                }
              : item
          )
        );
        showToast(
          language === 'km'
            ? `🎉 បានផ្ទៀងផ្ទាត់ជោគជ័យ! បន្ថែម +${sub.pointsAwarded || 10} ពិន្ទុជូន ${sub.customerName} រួចរាល់។`
            : `🎉 Verified! Added +${sub.pointsAwarded || 10} points to ${sub.customerName}.`,
          'success'
        );
      }
    } catch {
      showToast('មានបញ្ហាក្នុងការផ្ទៀងផ្ទាត់។ សូមព្យាយាមម្តងទៀត', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingSubId) return;
    const targetId = rejectingSubId;
    const currentReason = rejectReason;
    setActionLoadingId(targetId);
    try {
      await rejectQuizSubmission(targetId, currentReason, 'Admin Lumimei');
      // Immediately reflect rejected status in local view state
      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === targetId
            ? {
                ...item,
                status: 'rejected',
                rejectionReason: currentReason,
                verifiedAt: new Date().toISOString(),
                verifiedBy: 'Admin Lumimei',
              }
            : item
        )
      );
      showToast('បានបដិសេធចម្លើយនេះរួចរាល់', 'success');
      setRejectingSubId(null);
    } catch {
      showToast('មានបញ្ហាក្នុងការបដិសេធ', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSub) return;
    const subId = deletingSub.id;
    setActionLoadingId(subId);
    try {
      await deleteQuizSubmission(subId);
      setSubmissions((prev) => prev.filter((s) => s.id !== subId));
      showToast(
        language === 'km'
          ? 'បានលុបទិន្នន័យជោគជ័យ'
          : language === 'zh'
          ? '已成功删除问答记录'
          : 'Submission deleted successfully',
        'success'
      );
      setDeletingSub(null);
    } catch {
      showToast(
        language === 'km'
          ? 'មានបញ្ហាក្នុងការលុប'
          : language === 'zh'
          ? '删除失败，请重试'
          : 'Failed to delete submission',
        'error'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const toggleExpand = (subId: string) => {
    setExpandedSubIds((prev) => ({ ...prev, [subId]: !prev[subId] }));
  };

  // Stats
  const totalCount = submissions.length;
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const verifiedCount = submissions.filter((s) => s.status === 'verified').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

  // Filter & Search
  const filteredSubmissions = submissions.filter((sub) => {
    if (activeStatusFilter !== 'all' && sub.status !== activeStatusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = sub.customerName?.toLowerCase().includes(q);
      const matchPhone = sub.customerPhone?.toLowerCase().includes(q);
      const matchAnswer = sub.answers?.some(
        (a) => a.answer?.toLowerCase().includes(q) || a.questionText?.toLowerCase().includes(q)
      );
      return matchName || matchPhone || matchAnswer;
    }
    return true;
  });

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString('km-KH', { month: 'short', day: 'numeric', year: 'numeric' })} - ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold font-battambang animate-in slide-in-from-top ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700 shadow-emerald-950/20'
              : 'bg-rose-900 text-white border-rose-700 shadow-rose-950/20'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-opensans flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span>
              {language === 'km'
                ? 'ផ្ទៀងផ្ទាត់ការឆ្លើយ Game & សំនួរ (Verify)'
                : language === 'zh'
                ? '问答游戏审核验证 (Verify)'
                : 'Quiz & Game Verification (Verify)'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-battambang mt-1">
            {language === 'km'
              ? 'រាល់អតិថិជនឆ្លើយសំនួរពីទំព័រ «លេង Game ឆ្លើយសំនួរ» នឹងបញ្ជូនមកទីនេះ ដើម្បីអោយ Admin ផ្ទៀងផ្ទាត់ (Verify) ផ្ដល់ពិន្ទុរង្វាន់ជូន'
              : 'Customer answers from the Quiz Game page will appear here for Admin to verify and award points.'}
          </p>
        </div>

        {/* Pending Badge Counter */}
        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-900 rounded-2xl text-xs font-extrabold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <span>
              {language === 'km'
                ? `មាន ${pendingCount} ការឆ្លើយកំពុងរង់ចាំ Verify!`
                : `${pendingCount} submissions pending review!`}
            </span>
          </div>
        )}
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: All Submissions */}
        <button
          type="button"
          onClick={() => setActiveStatusFilter('all')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            activeStatusFilter === 'all'
              ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500">
              {language === 'km' ? 'ការឆ្លើយសរុប' : 'Total Submissions'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-opensans">{totalCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {language === 'km' ? 'គ្រប់ចម្លើយដែលបានផ្ញើ' : 'All submitted quizzes'}
          </p>
        </button>

        {/* Card 2: Pending Verify */}
        <button
          type="button"
          onClick={() => setActiveStatusFilter('pending')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer relative overflow-hidden ${
            activeStatusFilter === 'pending'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200 shadow-sm'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          {pendingCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-800">
              {language === 'km' ? 'រង់ចាំផ្ទៀងផ្ទាត់' : 'Pending Verify'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-900 font-opensans">{pendingCount}</p>
          <p className="text-[10px] text-amber-700 font-medium mt-0.5">
            {language === 'km' ? 'ត្រូវការ Admin អនុម័ត' : 'Awaiting admin review'}
          </p>
        </button>

        {/* Card 3: Verified */}
        <button
          type="button"
          onClick={() => setActiveStatusFilter('verified')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            activeStatusFilter === 'verified'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200 shadow-sm'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-800">
              {language === 'km' ? 'បានផ្ទៀងផ្ទាត់ & ពិន្ទុ' : 'Verified (+Points)'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-900 font-opensans">{verifiedCount}</p>
          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
            {language === 'km' ? 'បានផ្ដល់ពិន្ទុរួចរាល់' : 'Points awarded'}
          </p>
        </button>

        {/* Card 4: Rejected */}
        <button
          type="button"
          onClick={() => setActiveStatusFilter('rejected')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            activeStatusFilter === 'rejected'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200 shadow-sm'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rose-800">
              {language === 'km' ? 'បានបដិសេធ' : 'Rejected'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-900 font-opensans">{rejectedCount}</p>
          <p className="text-[10px] text-rose-700 font-medium mt-0.5">
            {language === 'km' ? 'ចម្លើយមិនត្រឹមត្រូវ' : 'Invalid answers'}
          </p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeStatusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'km' ? 'ទាំងអស់' : 'All'} ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeStatusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-amber-800 hover:bg-amber-100/60'
            }`}
          >
            <span>{language === 'km' ? 'រង់ចាំផ្ទៀងផ្ទាត់' : 'Pending'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/30 text-[10px]">{pendingCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStatusFilter('verified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeStatusFilter === 'verified'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-emerald-800 hover:bg-emerald-100/60'
            }`}
          >
            {language === 'km' ? 'បានផ្ទៀងផ្ទាត់' : 'Verified'} ({verifiedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeStatusFilter === 'rejected'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'text-rose-800 hover:bg-rose-100/60'
            }`}
          >
            {language === 'km' ? 'បដិសេធ' : 'Rejected'} ({rejectedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              language === 'km'
                ? 'ស្វែងរកតាមឈ្មោះ, លេខទូរសព្ទ...'
                : 'Search by customer name or phone...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">
              {language === 'km' ? 'មិនមានទិន្នន័យឆ្លើយសំនួរទេ' : 'No quiz submissions found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {activeStatusFilter === 'pending'
                ? 'អបអរសាទរ! មិនមានចម្លើយដែលកំពុងរង់ចាំផ្ទៀងផ្ទាត់នៅពេលនេះឡើយ។'
                : 'មិនមានកំណត់ត្រាចម្លើយដែលត្រូវនឹងការស្វែងរករបស់អ្នកទេ។'}
            </p>
          </div>
        ) : (
          filteredSubmissions.map((sub) => {
            const isPending = sub.status === 'pending';
            const isVerified = sub.status === 'verified';
            const isRejected = sub.status === 'rejected';
            const isExpanded = expandedSubIds[sub.id] ?? true;
            const isOperating = actionLoadingId === sub.id;
            const pointsToAward =
              sub.pointsAwarded && sub.pointsAwarded > (sub.answers?.length || 1)
                ? sub.pointsAwarded
                : (sub.answers?.length || 1) * 10;

            return (
              <div
                key={sub.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
                  isPending
                    ? 'border-amber-300 ring-1 ring-amber-100'
                    : isVerified
                    ? 'border-emerald-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Header Card Bar */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 bg-slate-50/50">
                  {/* Customer Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-base font-extrabold shrink-0 shadow-2xs ${
                        isPending
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isVerified
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}
                    >
                      {sub.customerName ? sub.customerName.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                          {sub.customerName}
                        </h3>

                        {/* Status Badge */}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black shrink-0">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>{language === 'km' ? 'រង់ចាំផ្ទៀងផ្ទាត់' : 'Pending Verify'}</span>
                          </span>
                        )}

                        {isVerified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-black shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>{language === 'km' ? 'បានផ្ទៀងផ្ទាត់' : 'Verified'}</span>
                          </span>
                        )}

                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-[11px] font-black shrink-0">
                            <XCircle className="w-3 h-3 text-rose-700" />
                            <span>{language === 'km' ? 'បដិសេធ' : 'Rejected'}</span>
                          </span>
                        )}

                        {/* Task Type Badge */}
                        {sub.screenshot || sub.taskType === 'photo_task' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-extrabold shrink-0">
                            <Facebook className="w-3 h-3 text-blue-600 fill-blue-600" />
                            <span>{sub.taskTitle || 'Facebook Follow'} (+{sub.pointsAwarded || 10} pts)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 text-[11px] font-extrabold shrink-0">
                            <Award className="w-3 h-3 text-purple-600" />
                            <span>+{pointsToAward} {language === 'km' ? 'ពិន្ទុ' : 'pts'}</span>
                          </span>
                        )}
                      </div>

                      {/* Contact & Date Details */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        {sub.customerPhone && (
                          <a
                            href={`tel:${sub.customerPhone}`}
                            className="flex items-center gap-1 font-semibold text-slate-700 hover:text-emerald-700 transition"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{sub.customerPhone}</span>
                          </a>
                        )}

                        {sub.telegram && (
                          <span className="flex items-center gap-1 text-sky-700 font-medium">
                            <Send className="w-3 h-3 text-sky-500" />
                            <span>{sub.telegram}</span>
                          </span>
                        )}

                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">{formatDate(sub.submittedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar for This Submission: Verify & Reject side-by-side on mobile & desktop */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    {/* If Pending: Show Big Verify & Reject Buttons in the SAME ROW */}
                    {isPending && (
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial">
                        <button
                          type="button"
                          disabled={isOperating}
                          onClick={() => handleVerify({ ...sub, pointsAwarded: pointsToAward })}
                          className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          {isOperating ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-emerald-200" />
                          )}
                          <span>
                            {language === 'km'
                              ? `ផ្ទៀងផ្ទាត់ & ផ្ដល់ +${pointsToAward} ពិន្ទុ`
                              : `Verify & Award +${pointsToAward} Pts`}
                          </span>
                        </button>

                        <button
                          type="button"
                          disabled={isOperating}
                          onClick={() => {
                            setRejectingSubId(sub.id);
                            setRejectReason('ចម្លើយមិនទាន់ស្របតាមសំណួរ សូមឆ្លើយម្តងទៀត');
                          }}
                          className="px-3 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 hover:text-rose-800 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{language === 'km' ? 'បដិសេធ' : 'Reject'}</span>
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                      {/* If Already Verified: Show Verified Info */}
                      {isVerified && (
                        <div className="text-right mr-1">
                          <span className="text-[11px] text-emerald-700 font-bold block whitespace-nowrap">
                            ✓ បានផ្ទៀងផ្ទាត់ (+{pointsToAward} ពិន្ទុ)
                          </span>
                          {sub.verifiedAt && (
                            <span className="text-[10px] text-slate-400 block whitespace-nowrap">{formatDate(sub.verifiedAt)}</span>
                          )}
                        </div>
                      )}

                      {/* If Rejected: Show Note */}
                      {isRejected && (
                        <div className="text-right mr-1">
                          <span className="text-[11px] text-rose-700 font-bold block max-w-[140px] truncate">
                            ✗ បានបដិសេធ ({sub.rejectionReason})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleVerify({ ...sub, pointsAwarded: pointsToAward })}
                            className="text-[10px] text-slate-500 hover:text-emerald-700 underline mt-0.5 cursor-pointer block text-right ml-auto"
                          >
                            {language === 'km' ? 'ផ្ទៀងផ្ទាត់ឡើងវិញ' : 'Re-verify'}
                          </button>
                        </div>
                      )}

                      {/* Toggle Expand View */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(sub.id)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition cursor-pointer"
                        title="ពង្រីក/បង្រួមចម្លើយ"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingSub(sub);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition cursor-pointer"
                        title={
                          language === 'km'
                            ? 'លុបចោលកំណត់ត្រានេះ'
                            : language === 'zh'
                            ? '删除此条问答记录'
                            : 'Delete submission'
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Question and Answers or Photo Task Content */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-3 bg-white">
                    {sub.screenshot || sub.taskType === 'photo_task' ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                            {language === 'km' ? 'ភារកិច្ចរូបភាព Screenshot ផ្ទៀងផ្ទាត់៖' : 'Screenshot Mission Proof:'}
                          </p>
                          <span className="text-xs text-blue-700 font-black bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                            +{sub.pointsAwarded || 10} {language === 'km' ? 'ពិន្ទុ' : 'Points'}
                          </span>
                        </div>

                        <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              <Facebook className="w-4 h-4 fill-white" />
                            </span>
                            <div>
                              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                                {sub.taskTitle || 'Follow Facebook Page: Lumimei Cambodia'}
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                Task ID: <span className="font-mono text-slate-700">{sub.taskId || 'task-fb-follow-cambodia'}</span>
                              </p>
                            </div>
                          </div>

                          {sub.screenshot ? (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                <Camera className="w-3.5 h-3.5 text-blue-600" />
                                <span>{language === 'km' ? 'រូបភាព Screenshot បាន Upload ផ្ទៀងផ្ទាត់៖' : 'Uploaded Screenshot Proof:'}</span>
                              </span>
                              <div className="inline-block border-2 border-slate-300 rounded-2xl overflow-hidden shadow-xs bg-black/5 p-1 max-w-full">
                                <img
                                  src={sub.screenshot}
                                  alt="Facebook Screenshot proof"
                                  className="max-h-80 sm:max-h-96 w-auto object-contain rounded-xl hover:scale-[1.02] transition duration-200 cursor-pointer"
                                  onClick={() => window.open(sub.screenshot, '_blank')}
                                  title="ចុចដើម្បីបើកមើលរូបភាពពេញ"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                              ពុំមានរូបភាព Screenshot ភ្ជាប់មកជាមួយទេ
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                            {language === 'km'
                              ? `ចម្លើយសរុប ${sub.answers?.length || 0} សំនួរ៖`
                              : `Customer Answers (${sub.answers?.length || 0} Questions):`}
                          </p>
                          <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-lg">
                            {sub.answers?.length || 0} x +10 = +{pointsToAward} {language === 'km' ? 'ពិន្ទុ' : 'Points'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          {sub.answers?.map((ans, idx) => (
                            <div
                              key={ans.questionId || idx}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-md bg-purple-200 text-purple-900 text-[10px] font-black flex items-center justify-center shrink-0">
                                    {ans.questionNum || idx + 1}
                                  </span>
                                  <span>{ans.questionText}</span>
                                </span>
                                <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-md shrink-0">
                                  +10 pts
                                </span>
                              </div>

                              <div className="bg-white p-2.5 rounded-lg border border-purple-100 text-xs text-slate-900 font-medium">
                                <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider mb-0.5">
                                  {language === 'km' ? 'ចម្លើយអតិថិជន៖' : 'Answer:'}
                                </span>
                                <p className="font-semibold text-slate-800 break-words italic">
                                  "{ans.answer}"
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Quick action buttons in the SAME ROW on mobile (Reject + Verify) */}
                    {isPending && (
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2 sm:justify-end">
                        <button
                          type="button"
                          disabled={isOperating}
                          onClick={() => {
                            setRejectingSubId(sub.id);
                            setRejectReason('ចម្លើយមិនទាន់ស្របតាមសំណួរ សូមឆ្លើយម្តងទៀត');
                          }}
                          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 hover:text-rose-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                        >
                          <X className="w-4 h-4 text-rose-600" />
                          <span>{language === 'km' ? 'បដិសេធ' : 'Reject'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isOperating}
                          onClick={() => handleVerify({ ...sub, pointsAwarded: pointsToAward })}
                          className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          {isOperating ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 text-emerald-200" />
                          )}
                          <span>
                            {language === 'km'
                              ? `ផ្ទៀងផ្ទាត់ & ផ្ដល់ +${pointsToAward} ពិន្ទុ`
                              : `Verify & Award +${pointsToAward} Pts`}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal Dialog */}
      {rejectingSubId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>{language === 'km' ? 'បដិសេធចម្លើយសំនួរ' : 'Reject Quiz Submission'}</span>
              </h3>
              <button
                onClick={() => setRejectingSubId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {language === 'km'
                ? 'សូមបញ្ចូលមូលហេតុនៃការបដិសេធ ដើម្បីឱ្យអតិថិជនបានដឹង និងអាចកែសម្រួលចម្លើយឆ្លើយឡើងវិញ៖'
                : 'Please specify reason for rejection:'}
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 rounded-xl p-3 text-xs text-slate-900 outline-none"
              placeholder="មូលហេតុបដិសេធ..."
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingSubId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {language === 'km' ? 'លុបចោល' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={actionLoadingId !== null}
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition shadow-sm cursor-pointer"
              >
                {actionLoadingId ? 'កំពុងដំណើរការ...' : language === 'km' ? 'បញ្ជាក់ការបដិសេធ' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <span>
                  {language === 'km'
                    ? 'លុបទិន្នន័យឆ្លើយសំនួរ'
                    : language === 'zh'
                    ? '删除审核记录'
                    : 'Delete Quiz Submission'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setDeletingSub(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200/70 rounded-2xl p-3.5 space-y-1">
              <p className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                <span>{deletingSub.customerName}</span>
                {deletingSub.customerPhone && (
                  <span className="font-semibold text-rose-700">({deletingSub.customerPhone})</span>
                )}
              </p>
              <p className="text-[11px] text-rose-700">
                {deletingSub.taskType === 'photo_task'
                  ? deletingSub.taskTitle || 'Facebook Follow Task'
                  : `${deletingSub.answers?.length || 0} សំនួរ (+${deletingSub.pointsAwarded || 10} pts)`}
                {' • '}
                {formatDate(deletingSub.submittedAt)}
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'km'
                ? 'តើអ្នកប្រាកដជាចង់លុបទិន្នន័យឆ្លើយសំនួរនេះមែនទេ? សកម្មភាពនេះនឹងលុបចេញពីប្រព័ន្ធរហូត មិនអាចត្រឡប់វិញបានឡើយ។'
                : language === 'zh'
                ? '确定要永久删除此条审核记录吗？删除后无法恢复。'
                : 'Are you sure you want to permanently delete this submission? This action cannot be undone.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSub(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {language === 'km' ? 'លុបចោល' : language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={actionLoadingId !== null}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-extrabold transition shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoadingId ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>
                  {actionLoadingId
                    ? (language === 'km' ? 'កំពុងលុប...' : language === 'zh' ? '正在删除...' : 'Deleting...')
                    : (language === 'km' ? 'លុបចេញ' : language === 'zh' ? '确认删除' : 'Delete')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
