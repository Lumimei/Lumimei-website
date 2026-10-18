import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
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
  Copy,
  Layers,
  FileText,
} from 'lucide-react';
import {
  QuizSubmission,
  subscribeToQuizSubmissions,
  deleteQuizSubmission,
  verifySingleQuestionAnswer,
  rejectSingleQuestionAnswer,
  verifyQuizSubmission,
  rejectQuizSubmission,
} from '../../lib/quizSubmissionService';

interface VerifyManagementProps {
  language: 'km' | 'en' | 'zh';
}

export interface GroupedAnswer {
  questionId: string;
  questionNum: number;
  questionText: string;
  answer: string;
  submittedAt?: string;
  submissionId: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  rejectionReason?: string;
  points?: number;
}

export interface GroupedSubmission {
  groupKey: string;
  customerPhone: string;
  customerName: string;
  telegram?: string;
  userId: string;
  submissions: QuizSubmission[];
  allAnswers: GroupedAnswer[];
  screenshots: {
    taskTitle: string;
    taskId?: string;
    screenshot: string;
    pointsAwarded?: number;
    submittedAt?: string;
    submissionId?: string;
    status?: 'pending' | 'verified' | 'rejected';
  }[];
  latestSubmittedAt: string;
  totalPoints: number;
  verifiedCount?: number;
  pendingCount?: number;
  rejectedCount?: number;
}

export const VerifyManagement: React.FC<VerifyManagementProps> = ({ language }) => {
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Delete Confirmation Modal State for Grouped Card
  const [deletingGroup, setDeletingGroup] = useState<GroupedSubmission | null>(null);

  // Expanded card state to view answers
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToQuizSubmissions((list) => {
      setSubmissions(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Group all submissions by customer phone number (fallback to userId or name)
  const groupedSubmissions = useMemo(() => {
    const map = new Map<string, GroupedSubmission>();

    // Sort chronologically (oldest to newest, so latest updates properties)
    const sorted = [...submissions].sort(
      (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );

    for (const sub of sorted) {
      const rawPhone = sub.customerPhone?.trim() || '';
      const normPhone = rawPhone.replace(/[^\d+]/g, '');
      const groupKey =
        normPhone ||
        (sub.userId && sub.userId !== 'guest' ? sub.userId : '') ||
        sub.customerName ||
        sub.id;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          groupKey,
          customerPhone: sub.customerPhone || '',
          customerName: sub.customerName || 'អតិថិជន Lumimei',
          telegram: sub.telegram || '',
          userId: sub.userId || 'guest',
          submissions: [],
          allAnswers: [],
          screenshots: [],
          latestSubmittedAt: sub.submittedAt || new Date().toISOString(),
          totalPoints: 0,
        });
      }

      const grp = map.get(groupKey)!;
      if (!grp.submissions.some((s) => s.id === sub.id)) {
        grp.submissions.push(sub);
      }
      if (sub.customerName && sub.customerName !== 'អតិថិជន Lumimei') {
        grp.customerName = sub.customerName;
      }
      if (sub.customerPhone && !grp.customerPhone) {
        grp.customerPhone = sub.customerPhone;
      }
      if (sub.telegram && !grp.telegram) {
        grp.telegram = sub.telegram;
      }
      if (new Date(sub.submittedAt).getTime() > new Date(grp.latestSubmittedAt).getTime()) {
        grp.latestSubmittedAt = sub.submittedAt;
      }

      // Collect screenshots (photo tasks)
      if (sub.screenshot) {
        if (!grp.screenshots.some((s) => s.screenshot === sub.screenshot)) {
          grp.screenshots.push({
            taskTitle: sub.taskTitle || 'Facebook Follow',
            taskId: sub.taskId,
            screenshot: sub.screenshot,
            pointsAwarded: sub.pointsAwarded || 10,
            submittedAt: sub.submittedAt,
            submissionId: sub.id,
            status: sub.status || 'pending',
          });
        }
      }

      // Collect answers (deduplicate by questionId or questionNum, keeping latest)
      if (Array.isArray(sub.answers)) {
        for (const ans of sub.answers) {
          if (!ans || !ans.answer) continue;
          const status = ans.status || sub.status || 'pending';
          const qId = ans.questionId || `q_${ans.questionNum || ''}`;
          const existingIdx = grp.allAnswers.findIndex(
            (a) =>
              (a.questionId && ans.questionId && a.questionId === ans.questionId) ||
              (a.questionNum && ans.questionNum && a.questionNum === ans.questionNum)
          );
          const answerItem: GroupedAnswer = {
            questionId: qId,
            questionNum: ans.questionNum,
            questionText: ans.questionText,
            answer: ans.answer,
            submittedAt: sub.submittedAt,
            submissionId: sub.id,
            status: status as 'pending' | 'verified' | 'rejected',
            verifiedAt: ans.verifiedAt || sub.verifiedAt,
            rejectionReason: ans.rejectionReason || sub.rejectionReason,
            points: 10,
          };
          if (existingIdx >= 0) {
            grp.allAnswers[existingIdx] = answerItem;
          } else {
            grp.allAnswers.push(answerItem);
          }
        }
      }
    }

    const list = Array.from(map.values());
    for (const g of list) {
      g.allAnswers.sort((a, b) => (a.questionNum || 0) - (b.questionNum || 0));
      const answerPts = g.allAnswers.length * 10;
      const scrPts = g.screenshots.reduce((acc, s) => acc + (s.pointsAwarded || 10), 0);
      g.totalPoints = answerPts + scrPts;
      g.verifiedCount = g.allAnswers.filter((a) => a.status === 'verified').length;
      g.pendingCount = g.allAnswers.filter((a) => a.status !== 'verified' && a.status !== 'rejected').length;
      g.rejectedCount = g.allAnswers.filter((a) => a.status === 'rejected').length;
    }

    // Sort newest submission first
    list.sort(
      (a, b) => new Date(b.latestSubmittedAt).getTime() - new Date(a.latestSubmittedAt).getTime()
    );

    return list;
  }, [submissions]);

  // Auto-expand all grouped cards by default
  useEffect(() => {
    const expands: { [key: string]: boolean } = {};
    groupedSubmissions.forEach((g) => {
      expands[g.groupKey] = true;
    });
    setExpandedGroupKeys(expands);
  }, [groupedSubmissions.length]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    showToast(
      language === 'km' ? `បានចម្លងលេខទូរសព្ទ៖ ${phone}` : `Copied phone: ${phone}`,
      'success'
    );
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Verify an individual question answer (+10 pts)
  const handleVerifyQuestion = async (ans: GroupedAnswer, group: GroupedSubmission) => {
    const actionKey = `verify_${group.groupKey}_${ans.questionId}`;
    setActionLoadingId(actionKey);
    try {
      const ok = await verifySingleQuestionAnswer(
        ans.submissionId,
        ans.questionId,
        'Admin Lumimei',
        10
      );
      if (ok) {
        showToast(
          language === 'km'
            ? `បានកំណត់ថាត្រឹមត្រូវ និងផ្ដល់ +10 ពិន្ទុសម្រាប់សំនួរទី ${ans.questionNum || ''} ជោគជ័យ!`
            : language === 'zh'
            ? `第 ${ans.questionNum || ''} 题已判定正确并奖励 +10 积分！`
            : `Question ${ans.questionNum || ''} verified as correct and awarded +10 points!`,
          'success'
        );
      } else {
        showToast(language === 'km' ? 'មិនអាចកំណត់ថាត្រឹមត្រូវទេ' : 'Could not verify', 'error');
      }
    } catch {
      showToast('Error verifying question', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject an individual question answer
  const handleRejectQuestion = async (ans: GroupedAnswer, group: GroupedSubmission) => {
    const actionKey = `reject_${group.groupKey}_${ans.questionId}`;
    setActionLoadingId(actionKey);
    try {
      const reason = language === 'km' ? 'ចម្លើយមិនទាន់ត្រឹមត្រូវ' : 'Answer is incorrect';
      const ok = await rejectSingleQuestionAnswer(
        ans.submissionId,
        ans.questionId,
        reason,
        'Admin Lumimei'
      );
      if (ok) {
        showToast(
          language === 'km'
            ? `បានបដិសេធចម្លើយសំនួរទី ${ans.questionNum || ''}`
            : language === 'zh'
            ? `已拒绝第 ${ans.questionNum || ''} 题回答`
            : `Question ${ans.questionNum || ''} rejected`,
          'success'
        );
      } else {
        showToast(language === 'km' ? 'មិនអាចបដិសេធបានទេ' : 'Could not reject', 'error');
      }
    } catch {
      showToast('Error rejecting question', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Verify all pending questions in a customer group at once
  const handleVerifyAllGroupQuestions = async (group: GroupedSubmission) => {
    const actionKey = `verify_all_${group.groupKey}`;
    setActionLoadingId(actionKey);
    try {
      const pendingAnswers = group.allAnswers.filter((a) => a.status !== 'verified');
      if (pendingAnswers.length === 0) {
        showToast(
          language === 'km' ? 'សំនួរទាំងអស់ត្រូវបានកំណត់ថាត្រឹមត្រូវរួចហើយ!' : 'All questions already verified!',
          'success'
        );
        return;
      }
      for (const a of pendingAnswers) {
        await verifySingleQuestionAnswer(a.submissionId, a.questionId, 'Admin Lumimei', 10);
      }
      // Also verify any photo task screenshots if pending
      for (const scr of group.screenshots) {
        if (scr.submissionId && scr.status !== 'verified') {
          await verifyQuizSubmission(scr.submissionId, 'Admin Lumimei');
        }
      }
      showToast(
        language === 'km'
          ? `បានកំណត់ថាត្រឹមត្រូវសំនួរទាំងអស់ និងផ្ដល់ +${pendingAnswers.length * 10} ពិន្ទុជោគជ័យ!`
          : language === 'zh'
          ? `已批量判定该用户全部 ${pendingAnswers.length} 题正确并赠送 +${pendingAnswers.length * 10} 积分！`
          : `Verified all questions as correct and awarded +${pendingAnswers.length * 10} points!`,
        'success'
      );
    } catch {
      showToast('Error verifying questions', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Verify a screenshot mission
  const handleVerifyScreenshot = async (scr: GroupedSubmission['screenshots'][0], group: GroupedSubmission) => {
    if (!scr.submissionId) return;
    const actionKey = `verify_scr_${scr.submissionId}`;
    setActionLoadingId(actionKey);
    try {
      await verifyQuizSubmission(scr.submissionId, 'Admin Lumimei');
      showToast(
        language === 'km' ? 'បានកំណត់ថាត្រឹមត្រូវភារកិច្ច Screenshot ជោគជ័យ!' : 'Screenshot task verified!',
        'success'
      );
    } catch {
      showToast('Error verifying screenshot', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject a screenshot mission
  const handleRejectScreenshot = async (scr: GroupedSubmission['screenshots'][0], group: GroupedSubmission) => {
    if (!scr.submissionId) return;
    const actionKey = `reject_scr_${scr.submissionId}`;
    setActionLoadingId(actionKey);
    try {
      await rejectQuizSubmission(scr.submissionId, 'រូបភាព Screenshot មិនត្រឹមត្រូវ', 'Admin Lumimei');
      showToast(
        language === 'km' ? 'បានបដិសេធភារកិច្ច Screenshot' : 'Screenshot task rejected',
        'success'
      );
    } catch {
      showToast('Error rejecting screenshot', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDeleteGroup = async () => {
    if (!deletingGroup) return;
    const idsToDelete = deletingGroup.submissions.map((s) => s.id);
    setActionLoadingId(deletingGroup.groupKey);
    try {
      await Promise.all(idsToDelete.map((id) => deleteQuizSubmission(id)));
      setSubmissions((prev) => prev.filter((s) => !idsToDelete.includes(s.id)));
      showToast(
        language === 'km'
          ? `បានលុបទិន្នន័យឆ្លើយទាំងអស់របស់ ${deletingGroup.customerName || deletingGroup.customerPhone} ជោគជ័យ`
          : language === 'zh'
          ? '已成功删除该用户的全部问答记录'
          : 'Submission records deleted successfully',
        'success'
      );
      setDeletingGroup(null);
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

  const toggleExpand = (groupKey: string) => {
    setExpandedGroupKeys((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Stats calculation
  const totalCustomers = groupedSubmissions.length;
  const totalAnswers = groupedSubmissions.reduce((acc, g) => acc + g.allAnswers.length, 0);
  const totalScreenshots = groupedSubmissions.reduce((acc, g) => acc + g.screenshots.length, 0);
  const totalPoints = groupedSubmissions.reduce((acc, g) => acc + g.totalPoints, 0);

  // Filter by search query
  const filteredGroups = useMemo(() => {
    return groupedSubmissions.filter((grp) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = grp.customerName?.toLowerCase().includes(q);
      const matchPhone = grp.customerPhone?.toLowerCase().includes(q);
      const matchTelegram = grp.telegram?.toLowerCase().includes(q);
      const matchAnswers = grp.allAnswers.some(
        (a) => a.answer?.toLowerCase().includes(q) || a.questionText?.toLowerCase().includes(q)
      );
      const matchScreenTask = grp.screenshots.some((s) => s.taskTitle?.toLowerCase().includes(q));
      return matchName || matchPhone || matchTelegram || matchAnswers || matchScreenTask;
    });
  }, [groupedSubmissions, searchQuery]);

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
                ? 'បញ្ជីចម្លើយសំនួរតាមអតិថិជន (Quiz Submissions)'
                : language === 'zh'
                ? '客户问答记录 (按电话合并展示)'
                : 'Customer Quiz Answers (Grouped by Phone)'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-battambang mt-1">
            {language === 'km'
              ? 'ចម្លើយទាំងអស់របស់លេខទូរស័ព្ទនីមួយៗ ត្រូវបានច្របាច់បញ្ចូលគ្នាបង្ហាញក្នុងកាតតែមួយ ដើម្បីងាយស្រួលពិនិត្យមើលគ្រប់សំនួរដែលបានឆ្លើយ។'
              : language === 'zh'
              ? '同一个电话号码的所有问答已自动合并在同一张卡片中，集中展示所有题目与回答。'
              : 'All answers from each phone number are grouped together into a single card for easy review.'}
          </p>
        </div>

        {/* Customer Counter Badge */}
        {totalCustomers > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-purple-50 border border-purple-200 text-purple-900 rounded-2xl text-xs font-extrabold">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
            <span>
              {language === 'km'
                ? `សរុប ${totalCustomers} អតិថិជន (${totalAnswers} សំនួរបានឆ្លើយ)`
                : `${totalCustomers} Customers (${totalAnswers} Questions Answered)`}
            </span>
          </div>
        )}
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Customer Groups */}
        <div className="p-4 rounded-2xl border bg-white border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 font-battambang">
              {language === 'km' ? 'អតិថិជនឆ្លើយសរុប' : language === 'zh' ? '答题用户总数' : 'Total Customers'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-opensans">{totalCustomers}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-battambang">
            {language === 'km' ? 'កាតអតិថិជនតាមលេខទូរស័ព្ទ' : 'Grouped by phone'}
          </p>
        </div>

        {/* Card 2: Total Questions Answered */}
        <div className="p-4 rounded-2xl border bg-white border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-indigo-700 font-battambang">
              {language === 'km' ? 'សំនួរបានឆ្លើយសរុប' : language === 'zh' ? '回答题目总数' : 'Questions Answered'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-indigo-900 font-opensans">{totalAnswers}</p>
          <p className="text-[10px] text-indigo-600 font-medium mt-0.5 font-battambang">
            {language === 'km' ? 'គ្រប់សំណួរដែលបានឆ្លើយ' : 'All answered questions'}
          </p>
        </div>

        {/* Card 3: Photo Tasks / Screenshots */}
        <div className="p-4 rounded-2xl border bg-white border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-blue-700 font-battambang">
              {language === 'km' ? 'ភារកិច្ច Screenshot' : language === 'zh' ? '截图任务' : 'Photo Proofs'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-900 font-opensans">{totalScreenshots}</p>
          <p className="text-[10px] text-blue-600 font-medium mt-0.5 font-battambang">
            {language === 'km' ? 'ភារកិច្ចរូបភាព Screenshot' : 'Uploaded proof images'}
          </p>
        </div>

        {/* Card 4: Total Points */}
        <div className="p-4 rounded-2xl border bg-white border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-700 font-battambang">
              {language === 'km' ? 'ពិន្ទុទទួលបានសរុប' : language === 'zh' ? '累计获得积分' : 'Total Points'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-900 font-opensans">+{totalPoints}</p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5 font-battambang">
            {language === 'km' ? '១០ពិន្ទុ / ១សំនួរ' : '10 pts per question'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 font-battambang">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>
            {language === 'km'
              ? `បង្ហាញ ${filteredGroups.length} / ${totalCustomers} ក្រុមអតិថិជន`
              : language === 'zh'
              ? `显示 ${filteredGroups.length} / ${totalCustomers} 位用户卡片`
              : `Showing ${filteredGroups.length} / ${totalCustomers} customer cards`}
          </span>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              language === 'km'
                ? 'ស្វែងរកតាមលេខទូរស័ព្ទ, ឈ្មោះ, ឬចម្លើយ...'
                : language === 'zh'
                ? '搜索电话号码、姓名或答案...'
                : 'Search by phone, name, or answer...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 outline-none transition font-battambang"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grouped Submissions List: 1 Card per Phone Number */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800 font-battambang">
              {language === 'km' ? 'មិនមានទិន្នន័យឆ្លើយសំនួរទេ' : 'No quiz submissions found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto font-battambang">
              {language === 'km'
                ? 'មិនមានកំណត់ត្រាចម្លើយដែលត្រូវនឹងការស្វែងរករបស់អ្នកឡើយ។'
                : 'No submission records matching your search.'}
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isExpanded = expandedGroupKeys[group.groupKey] ?? true;
            const isDeletingThis = actionLoadingId === group.groupKey;

            return (
              <div
                key={group.groupKey}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-purple-300 transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md"
              >
                {/* Header Card Bar */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-b border-slate-100 bg-slate-50/60">
                  {/* Customer Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-black shrink-0 shadow-2xs bg-purple-100 text-purple-900 border border-purple-200">
                      {group.customerName ? group.customerName.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                          {group.customerName}
                        </h3>

                        {/* Questions count pill */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 text-[11px] font-extrabold shrink-0">
                          <Award className="w-3 h-3 text-purple-600" />
                          <span>
                            {language === 'km'
                              ? `ឆ្លើយបាន ${group.allAnswers.length} សំនួរ`
                              : `${group.allAnswers.length} Questions`}
                          </span>
                        </span>

                        {/* Status badge: All verified or pending */}
                        {group.allAnswers.length > 0 && group.verifiedCount === group.allAnswers.length ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-extrabold shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{language === 'km' ? 'ត្រឹមត្រូវទាំងអស់' : 'All Verified'}</span>
                          </span>
                        ) : group.pendingCount !== undefined && group.pendingCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-extrabold shrink-0">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>
                              {language === 'km'
                                ? `${group.pendingCount} រង់ចាំ Verify`
                                : `${group.pendingCount} Pending`}
                            </span>
                          </span>
                        ) : null}

                        {/* Total Points Awarded Badge */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-extrabold shrink-0">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>+{group.totalPoints} {language === 'km' ? 'ពិន្ទុ' : 'pts'}</span>
                        </span>

                        {/* Screenshot proof tag if any */}
                        {group.screenshots.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-extrabold shrink-0">
                            <Facebook className="w-3 h-3 text-blue-600 fill-blue-600" />
                            <span>{group.screenshots.length} Screenshot Proof</span>
                          </span>
                        )}
                      </div>

                      {/* Contact & Date Details */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        {group.customerPhone ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${group.customerPhone}`}
                              className="inline-flex items-center gap-1 font-bold text-slate-800 hover:text-purple-700 transition"
                            >
                              <Phone className="w-3.5 h-3.5 text-purple-600" />
                              <span className="font-mono text-xs">{group.customerPhone}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(group.customerPhone)}
                              className="p-1 rounded-md text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition cursor-pointer"
                              title="ចម្លងលេខទូរស័ព្ទ"
                            >
                              {copiedPhone === group.customerPhone ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">ពុំមានលេខទូរស័ព្ទ</span>
                        )}

                        {group.telegram && (
                          <span className="flex items-center gap-1 text-sky-700 font-medium">
                            <Send className="w-3 h-3 text-sky-500" />
                            <span>{group.telegram}</span>
                          </span>
                        )}

                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400 text-[11px] font-battambang">
                          {formatDate(group.latestSubmittedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions on Card Header: Eye Toggle & Delete (Trash) */}
                  <div className="flex items-center gap-1.5 shrink-0 sm:ml-auto self-end sm:self-center">
                    {/* Quick Verify All Button if has pending */}
                    {group.pendingCount !== undefined && group.pendingCount > 0 && (
                        <button
                        type="button"
                        disabled={actionLoadingId !== null}
                        onClick={() => handleVerifyAllGroupQuestions(group)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer font-battambang shadow-2xs active:scale-95 disabled:opacity-50"
                        title="កំណត់ថាត្រឹមត្រូវទាំងអស់ក្នុងកាតនេះ"
                      >
                        {actionLoadingId === `verify_all_${group.groupKey}` ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        <span>{language === 'km' ? 'ត្រឹមត្រូវទាំងអស់' : language === 'zh' ? '全部正确' : 'Verify All'}</span>
                      </button>
                    )}

                    {/* Toggle Expand View */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(group.groupKey)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-800 text-xs font-bold transition cursor-pointer font-battambang"
                      title="ពង្រីក/បង្រួមចម្លើយ"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isExpanded ? (language === 'km' ? 'បង្រួម' : 'Collapse') : (language === 'km' ? 'មើលចម្លើយ' : 'View')}</span>
                    </button>

                    {/* Delete customer group button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingGroup(group);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition cursor-pointer"
                      title={
                        language === 'km'
                          ? 'លុបចោលកំណត់ត្រាទាំងអស់របស់លេខទូរស័ព្ទនេះ'
                          : language === 'zh'
                          ? '删除该用户的全部问答记录'
                          : 'Delete customer records'
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Body: All Questions and Answers from this Customer */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-4 bg-white">
                    {/* Questions & Answers Section */}
                    {group.allAnswers.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-battambang flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-purple-600" />
                            <span>
                              {language === 'km'
                                ? `ចម្លើយសរុប ${group.allAnswers.length} សំនួរ៖`
                                : language === 'zh'
                                ? `该用户已提交回答（共 ${group.allAnswers.length} 题）：`
                                : `All Customer Answers (${group.allAnswers.length} Questions):`}
                            </span>
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-lg font-battambang">
                              {group.allAnswers.length} x 10 = +{group.allAnswers.length * 10} {language === 'km' ? 'ពិន្ទុ' : 'Points'}
                            </span>
                            {group.pendingCount !== undefined && group.pendingCount > 0 && (
                              <button
                                type="button"
                                disabled={actionLoadingId !== null}
                                onClick={() => handleVerifyAllGroupQuestions(group)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer font-battambang shadow-2xs active:scale-95 disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{language === 'km' ? 'ត្រឹមត្រូវទាំងអស់' : 'Verify All'}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* List of all questions and answers */}
                        <div className="grid grid-cols-1 gap-2.5">
                          {group.allAnswers.map((ans, idx) => (
                            <div
                              key={ans.questionId || idx}
                              className={`p-3.5 rounded-xl border transition space-y-2.5 ${
                                ans.status === 'verified'
                                  ? 'bg-emerald-50/40 border-emerald-200/80'
                                  : ans.status === 'rejected'
                                  ? 'bg-rose-50/40 border-rose-200/80'
                                  : 'bg-slate-50/80 border-slate-200/80 hover:border-purple-200'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                                {/* Question num & title */}
                                <div className="text-xs font-bold text-purple-950 flex items-start gap-2 font-battambang flex-1 min-w-0">
                                  <span className="w-5 h-5 rounded-md bg-purple-200 text-purple-900 text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 font-mono shadow-2xs">
                                    {ans.questionNum || idx + 1}
                                  </span>
                                  <span className="leading-relaxed">{ans.questionText}</span>
                                </div>

                                {/* Points Badge & Actions directly below points */}
                                <div className="flex flex-col sm:items-end items-start gap-1.5 shrink-0">
                                  {/* Points tag */}
                                  <span className="text-[11px] bg-purple-100 text-purple-900 font-extrabold px-2.5 py-0.5 rounded-md shrink-0 font-mono border border-purple-200 shadow-2xs">
                                    +10 pts
                                  </span>

                                  {/* Actions directly below points: Correct (ត្រឹមត្រូវ) and Reject (បដិសេធ) */}
                                  <div className="flex items-center gap-1.5">
                                    {ans.status === 'verified' ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-extrabold font-battambang shadow-2xs">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>{language === 'km' ? 'ត្រឹមត្រូវ' : language === 'zh' ? '正确' : 'Correct'}</span>
                                        </span>
                                        <button
                                          type="button"
                                          disabled={actionLoadingId !== null}
                                          onClick={() => handleRejectQuestion(ans, group)}
                                          className="text-[10px] text-slate-400 hover:text-rose-600 hover:underline px-1 py-0.5 transition font-battambang cursor-pointer"
                                          title="ប្តូរទៅបដិសេធ"
                                        >
                                          {language === 'km' ? 'បដិសេធ' : 'Reject'}
                                        </button>
                                      </div>
                                    ) : ans.status === 'rejected' ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 text-[11px] font-extrabold font-battambang shadow-2xs">
                                          <X className="w-3.5 h-3.5 text-rose-600" />
                                          <span>{language === 'km' ? 'បានបដិសេធ' : language === 'zh' ? '已拒绝' : 'Rejected'}</span>
                                        </span>
                                        <button
                                          type="button"
                                          disabled={actionLoadingId !== null}
                                          onClick={() => handleVerifyQuestion(ans, group)}
                                          className="text-[10px] text-slate-400 hover:text-emerald-700 hover:underline px-1 py-0.5 transition font-battambang cursor-pointer"
                                          title="ប្តូរទៅត្រឹមត្រូវ"
                                        >
                                          {language === 'km' ? 'ត្រឹមត្រូវ' : 'Correct'}
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        {/* ត្រឹមត្រូវ Button */}
                                        <button
                                          type="button"
                                          disabled={actionLoadingId !== null}
                                          onClick={() => handleVerifyQuestion(ans, group)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-extrabold transition shadow-2xs cursor-pointer font-battambang disabled:opacity-50"
                                          title="ត្រឹមត្រូវ & ផ្ដល់ +10 ពិន្ទុ"
                                        >
                                          {actionLoadingId === `verify_${group.groupKey}_${ans.questionId}` ? (
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <Check className="w-3 h-3" />
                                          )}
                                          <span>{language === 'km' ? 'ត្រឹមត្រូវ' : language === 'zh' ? '正确' : 'Correct'}</span>
                                        </button>

                                        {/* បដិសេធ Button */}
                                        <button
                                          type="button"
                                          disabled={actionLoadingId !== null}
                                          onClick={() => handleRejectQuestion(ans, group)}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 hover:text-rose-800 border border-rose-200 text-[11px] font-extrabold transition cursor-pointer font-battambang disabled:opacity-50"
                                          title="បដិសេធចម្លើយនេះ"
                                        >
                                          {actionLoadingId === `reject_${group.groupKey}_${ans.questionId}` ? (
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <X className="w-3 h-3" />
                                          )}
                                          <span>{language === 'km' ? 'បដិសេធ' : language === 'zh' ? '拒绝' : 'Reject'}</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white p-3 rounded-xl border border-purple-100/80 text-xs text-slate-900 shadow-2xs">
                                <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider mb-1 font-battambang">
                                  {language === 'km' ? 'ចម្លើយអតិថិជន៖' : 'Customer Answer:'}
                                </span>
                                <p className="font-semibold text-slate-800 break-words italic font-battambang leading-relaxed">
                                  "{ans.answer}"
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Screenshots / Photo Tasks Section */}
                    {group.screenshots.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-battambang flex items-center gap-2">
                            <Camera className="w-3.5 h-3.5 text-blue-600" />
                            <span>
                              {language === 'km' ? 'ភារកិច្ចរូបភាព Screenshot ផ្ទៀងផ្ទាត់៖' : 'Screenshot Mission Proofs:'}
                            </span>
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {group.screenshots.map((scr, sIdx) => (
                            <div
                              key={scr.taskId || sIdx}
                              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                    <Facebook className="w-3.5 h-3.5 fill-white" />
                                  </span>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-slate-900 truncate">
                                      {scr.taskTitle}
                                    </h4>
                                    <p className="text-[10px] text-blue-700 font-extrabold">
                                      +{scr.pointsAwarded || 10} {language === 'km' ? 'ពិន្ទុ' : 'Points'}
                                    </p>
                                  </div>
                                </div>

                                {/* Directly below the screenshot points: Verify & Reject */}
                                {scr.submissionId && (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {scr.status === 'verified' ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-extrabold font-battambang">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>{language === 'km' ? 'ត្រឹមត្រូវ' : 'Verified'}</span>
                                      </span>
                                    ) : scr.status === 'rejected' ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 text-[11px] font-extrabold font-battambang">
                                        <X className="w-3.5 h-3.5 text-rose-600" />
                                        <span>{language === 'km' ? 'បានបដិសេធ' : 'Rejected'}</span>
                                      </span>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          disabled={actionLoadingId !== null}
                                          onClick={() => handleVerifyScreenshot(scr, group)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-extrabold transition shadow-2xs cursor-pointer font-battambang disabled:opacity-50"
                                        >
                                          {actionLoadingId === `verify_scr_${scr.submissionId}` ? (
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <Check className="w-3 h-3" />
                                          )}
                                          <span>{language === 'km' ? 'ត្រឹមត្រូវ' : 'Correct'}</span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={actionLoadingId !== null}
                                          onClick={() => handleRejectScreenshot(scr, group)}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 hover:text-rose-800 border border-rose-200 text-[11px] font-extrabold transition cursor-pointer font-battambang disabled:opacity-50"
                                        >
                                          {actionLoadingId === `reject_scr_${scr.submissionId}` ? (
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <X className="w-3 h-3" />
                                          )}
                                          <span>{language === 'km' ? 'បដិសេធ' : 'Reject'}</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="border-2 border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-black/5 p-1">
                                <img
                                  src={scr.screenshot}
                                  alt="Screenshot proof"
                                  className="max-h-72 w-auto object-contain rounded-lg hover:scale-[1.01] transition duration-200 cursor-pointer mx-auto"
                                  onClick={() => window.open(scr.screenshot, '_blank')}
                                  title="ចុចដើម្បីបើកមើលរូបភាពពេញ"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal for Customer Group */}
      {deletingGroup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-battambang">
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
                    ? '删除客户问答记录'
                    : 'Delete Customer Submissions'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setDeletingGroup(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200/70 rounded-2xl p-3.5 space-y-1">
              <p className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                <span>{deletingGroup.customerName}</span>
                {deletingGroup.customerPhone && (
                  <span className="font-semibold text-rose-700">({deletingGroup.customerPhone})</span>
                )}
              </p>
              <p className="text-[11px] text-rose-700">
                {language === 'km'
                  ? `សរុប ${deletingGroup.allAnswers.length} សំនួរ • កំណត់ត្រា ${deletingGroup.submissions.length} ច្បាប់`
                  : `${deletingGroup.allAnswers.length} Questions • ${deletingGroup.submissions.length} submission records`}
                {' • '}
                {formatDate(deletingGroup.latestSubmittedAt)}
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'km'
                ? `តើអ្នកប្រាកដជាចង់លុបទិន្នន័យចម្លើយទាំងអស់របស់លេខទូរស័ព្ទ ${deletingGroup.customerPhone || deletingGroup.customerName} នេះមែនទេ? រាល់ចម្លើយទាំងអស់របស់អតិថិជននេះនឹងត្រូវលុបចេញពីប្រព័ន្ធរហូត។`
                : language === 'zh'
                ? `确定要永久删除用户 (${deletingGroup.customerPhone || deletingGroup.customerName}) 的全部问答记录吗？删除后无法恢复。`
                : `Are you sure you want to permanently delete all submissions from ${deletingGroup.customerPhone || deletingGroup.customerName}? This action cannot be undone.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingGroup(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {language === 'km' ? 'លុបចោល' : language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={actionLoadingId !== null}
                onClick={handleConfirmDeleteGroup}
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
                    : (language === 'km' ? 'លុបចេញទាំងអស់' : language === 'zh' ? '确认全部删除' : 'Delete All')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
