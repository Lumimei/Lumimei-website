import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Gift,
  Sparkles,
  CheckCircle2,
  Camera,
  Trash2,
  UserPlus,
  ThumbsUp,
  Star,
  Video,
  Loader2,
  ShoppingBag,
  ShoppingCart,
  Award,
  Clock,
  ShieldCheck,
  CalendarCheck,
  Users,
  Gamepad2,
  HelpCircle,
  Send,
  Check,
  Trophy,
  ArrowLeft,
  ArrowRight,
  UserCheck,
  Phone,
  HeartHandshake,
  Tag,
  Share2,
  XCircle,
  Facebook,
  ExternalLink,
} from 'lucide-react';
import { Language, Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { getStoredMissionTasks, DynamicMissionTask } from './AdminTaskEditor';
import { submitCustomerQuizAnswers, submitPhotoTaskVerification } from '../lib/quizSubmissionService';
import serumImg from '../assets/images/lumimei_serum_1785063150378.jpg';
import coconutOilImg from '../assets/images/lumimei_coconut_oil_1785063164037.jpg';
import soapImg from '../assets/images/lumimei_soap_1785062880444.jpg';
import eyebrowPencilImg from '../assets/images/lumimei_eyebrow_pencil_1785063179712.jpg';

interface MyPointsModalProps {
  isOpen: boolean;
  language: Language;
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
}

interface MissionTask {
  id: string;
  titleKm: string;
  titleEn: string;
  titleZh: string;
  points: number;
  rewardTextKm?: string;
  rewardTextEn?: string;
  rewardTextZh?: string;
  iconType: 'user' | 'facebook' | 'tiktok' | 'review' | 'calendar' | 'users' | 'gift' | 'gamepad' | 'other';
  requiresPhoto: boolean;
}

interface RedeemItem {
  id: string;
  nameKm: string;
  nameEn: string;
  nameZh: string;
  pointsRequired: number;
  image: string;
  category: 'product' | 'voucher';
  descriptionKm: string;
}

interface QuizQuestion {
  id: string;
  num: number;
  questionKm: string;
  questionEn: string;
  questionZh: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'quiz_lumimei_products',
    num: 1,
    questionKm: '១. Lumimei មានផលិតផលអ្វីខ្លះ?',
    questionEn: '1. What products does Lumimei have?',
    questionZh: '1. Lumimei 拥有哪些产品？',
  },
  {
    id: 'quiz_lumimei_clay_mask',
    num: 2,
    questionKm: '២. Lumimei Clay Mask មានអត្ថប្រយោជន៍អ្វីខ្លះ?',
    questionEn: '2. What are the benefits of Lumimei Clay Mask?',
    questionZh: '2. Lumimei 泥膜有哪些功效？',
  },
  {
    id: 'quiz_lumimei_serum',
    num: 3,
    questionKm: '៣. Lumimei សេរ៉ូម មានអត្ថប្រយោជន៍អ្វីខ្លះ?',
    questionEn: '3. What are the benefits of Lumimei Serum?',
    questionZh: '3. Lumimei 精华液有哪些功效？',
  },
  {
    id: 'quiz_lumimei_coconut_oil',
    num: 4,
    questionKm: '៤. Lumimei ប្រេងដូង មានអត្ថប្រយោជន៍អ្វីខ្លះ?',
    questionEn: '4. What are the benefits of Lumimei Virgin Coconut Oil?',
    questionZh: '4. Lumimei 纯天然椰子油有哪些功效？',
  },
  {
    id: 'quiz_lumimei_soap',
    num: 5,
    questionKm: '៥. Lumimei សាប៊ូ មានអត្ថប្រយោជន៍អ្វីខ្លះ?',
    questionEn: '5. What are the benefits of Lumimei Herbal Soap?',
    questionZh: '5. Lumimei 草本天然香皂有哪些功效？',
  },
  {
    id: 'quiz_lumimei_origin_country',
    num: 6,
    questionKm: '៦. Lumimei ជាផលិតផលរបស់ប្រទេសណា?',
    questionEn: '6. Which country is Lumimei from?',
    questionZh: '6. Lumimei 是哪个国家的产品？',
  },
];

const MISSION_TASKS: MissionTask[] = [
  {
    id: 'task-quiz-game',
    titleKm: 'លេង Game ឆ្លើយសំនួរ',
    titleEn: 'Play Quiz Game',
    titleZh: '玩问答游戏',
    points: 60,
    rewardTextKm: '+60 ពិន្ទុ (១០ពិន្ទុ/១សំនួរ)',
    rewardTextEn: '+60 pts (10 pts/question)',
    rewardTextZh: '+60 积分 (每题10分)',
    iconType: 'gamepad',
    requiresPhoto: false,
  },
  {
    id: 'task-refer-friend',
    titleKm: 'ណែនាំមិត្តភក្ត័មកទិញផលិតផល',
    titleEn: 'Refer a Friend to Purchase',
    titleZh: '推荐好友购买产品',
    points: 0,
    rewardTextKm: 'ផលិតផល Lumimei សាប៊ូមួយដុំ',
    rewardTextEn: '1 Free Lumimei Natural Soap Bar',
    rewardTextZh: 'Lumimei 天然手工皂 1 块',
    iconType: 'gift',
    requiresPhoto: false,
  },
];

const REDEEMABLE_ITEMS: RedeemItem[] = [
  {
    id: 'lumimei-clay-mask',
    nameKm: 'Lumimei Clay Mask',
    nameEn: 'Lumimei Clay Mask',
    nameZh: 'Lumimei 泥膜 (Lumimei Clay Mask)',
    pointsRequired: 1500,
    image: 'https://i.postimg.cc/Dz534vg7/IMG-20260708-135255.png',
    category: 'product',
    descriptionKm: 'ម៉ាសភក់រុក្ខជាតិធម្មជាតិសុទ្ធ ជួយបន្សុទ្ធស្បែកមុខ ជម្រុះកោសិកាចាស់ៗ សម្អាតរន្ធញើស និងបំបាត់មុន',
  },
  {
    id: 'lumimei-serum',
    nameKm: 'Lumimei សេរ៉ូម',
    nameEn: 'Lumimei Serum',
    nameZh: 'Lumimei 精华液 (Lumimei Serum)',
    pointsRequired: 1800,
    image: serumImg,
    category: 'product',
    descriptionKm: 'សេរ៉ូមធម្មជាតិជួយព្យាបាលមុន ស្តារស្បែកខូច បំបាត់ស្នាម និងផ្តល់សំណើមយ៉ាងជ្រាលជ្រៅ',
  },
  {
    id: 'lumimei-coconut-oil',
    nameKm: 'Lumimei ប្រេងដូង',
    nameEn: 'Lumimei Virgin Coconut Oil',
    nameZh: 'Lumimei 纯天然椰子油',
    pointsRequired: 1000,
    image: coconutOilImg,
    category: 'product',
    descriptionKm: 'ប្រេងដូងធម្មជាតិសុទ្ធ ១០០% ផ្តល់សំណើមជ្រៅ ជួយលាងសម្អាតគ្រឿងសម្អាង និងបំប៉នស្បែកមុខឱ្យភ្លឺរលោង',
  },
  {
    id: 'lumimei-soap',
    nameKm: 'Lumimei សាប៊ូ',
    nameEn: 'Lumimei Herbal Soap',
    nameZh: 'Lumimei 草本天然香皂',
    pointsRequired: 500,
    image: soapImg,
    category: 'product',
    descriptionKm: 'សាប៊ូរុក្ខជាតិធម្មជាតិសុទ្ធ ជួយសម្អាតស្បែកយ៉ាងជ្រៅ កាត់បន្ថយជាតិខ្លាញ់លើស និងបំបាត់មុន',
  },
  {
    id: 'lumimei-eyebrow-pencil',
    nameKm: 'ខ្មៅដៃគូសចិញ្ចើម',
    nameEn: 'Lumimei Eyebrow Pencil',
    nameZh: 'Lumimei 精细眉笔',
    pointsRequired: 500,
    image: eyebrowPencilImg,
    category: 'product',
    descriptionKm: 'ខ្មៅដៃគូសចិញ្ចើមគុណភាពខ្ពស់ គូសងាយស្រួល ពណ៌ធម្មជាតិជាប់បានយូរ មិនងាយរលុប',
  },
];

export const MyPointsModal: React.FC<MyPointsModalProps> = ({
  isOpen,
  language,
  onClose,
  onAddToCart,
}) => {
  const { userProfile, updateUserProfile } = useAuth();

  // Navigation SubViews: 'main' | 'quiz' | 'referral'
  const [activeSubView, setActiveSubView] = useState<'main' | 'quiz' | 'referral'>('main');
  const [activeTab, setActiveTab] = useState<'earn' | 'redeem'>('earn');

  const [guestPoints, setGuestPoints] = useState<number>(() => {
    const saved = localStorage.getItem('lumimei_guest_points');
    return saved !== null ? Number(saved) : 0;
  });

  const [completedTasks, setCompletedTasks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lumimei_completed_mission_tasks');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Track dismissed/hidden tasks (such as completed 'task-new-user')
  const [dismissedTaskIds, setDismissedTaskIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lumimei_completed_mission_tasks');
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.includes('task-new-user')) {
          return ['task-new-user'];
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Track tasks under review
  const [pendingReviewTasks, setPendingReviewTasks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lumimei_pending_review_tasks');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [missionTasksList, setMissionTasksList] = useState<DynamicMissionTask[]>(() => getStoredMissionTasks());
  const [uploadedPhotos, setUploadedPhotos] = useState<{ [taskId: string]: string }>({});
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [justEarnedAnim, setJustEarnedAnim] = useState(false);
  const fileInputRefs = useRef<{ [taskId: string]: HTMLInputElement | null }>({});

  // Game ឆ្លើយសំនួរ (Quiz Game) State
  const [quizAnswers, setQuizAnswers] = useState<{ [qId: string]: string }>({});
  const [answeredQuizIds, setAnsweredQuizIds] = useState<string[]>([]);
  const [savedQuizAnswers, setSavedQuizAnswers] = useState<{ [qId: string]: string }>({});
  const [answeringQuizId, setAnsweringQuizId] = useState<string | null>(null);
  const [pendingQuizQuestions, setPendingQuizQuestions] = useState<{
    [qId: string]: { subId?: string; answer: string; status: 'pending' | 'verified' | 'rejected'; reason?: string };
  }>({});

  // Scoped quiz state per user: brand new users always see pristine, empty answer inputs
  useEffect(() => {
    setQuizAnswers({});
    const uid = userProfile?.uid || (userProfile as any)?.id || 'guest';
    try {
      const userSaved = localStorage.getItem(`lumimei_quiz_saved_answers_${uid}`);
      setSavedQuizAnswers(userSaved ? JSON.parse(userSaved) : {});
      const userPending = localStorage.getItem(`lumimei_quiz_pending_questions_${uid}`);
      setPendingQuizQuestions(userPending ? JSON.parse(userPending) : {});
      const userAns = localStorage.getItem(`lumimei_quiz_answered_ids_${uid}`);
      setAnsweredQuizIds(userAns ? JSON.parse(userAns) : []);
    } catch {
      setSavedQuizAnswers({});
      setPendingQuizQuestions({});
      setAnsweredQuizIds([]);
    }
  }, [userProfile?.uid, (userProfile as any)?.id]);

  // Referral Form State
  const [referralForm, setReferralForm] = useState({
    friendName: '',
    friendPhone: '',
    interestedProduct: 'Lumimei Clay Mask (ម៉ាសភក់បន្សុទ្ធស្បែក)',
    referrerName: userProfile?.name || 'អតិថិជន Lumimei',
    referralNote: '',
  });
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);
  const [referralSuccessModal, setReferralSuccessModal] = useState(false);

  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [lastCheckinDate, setLastCheckinDate] = useState<string>(() => {
    return localStorage.getItem('lumimei_last_checkin_date') || '';
  });

  useEffect(() => {
    const handlePointsUpdated = () => {
      const saved = localStorage.getItem('lumimei_guest_points');
      setGuestPoints(saved !== null ? Number(saved) : 0);
      setLastCheckinDate(localStorage.getItem('lumimei_last_checkin_date') || '');
    };
    const handleTasksUpdated = () => {
      setMissionTasksList(getStoredMissionTasks());
    };
    const handleQuizPendingUpdated = () => {
      const uid = userProfile?.uid || (userProfile as any)?.id || 'guest';
      try {
        const savedPending =
          localStorage.getItem(`lumimei_quiz_pending_questions_${uid}`) ||
          localStorage.getItem('lumimei_quiz_pending_questions');
        if (savedPending) setPendingQuizQuestions(JSON.parse(savedPending));
        const savedAnswered =
          localStorage.getItem(`lumimei_quiz_answered_ids_${uid}`) ||
          localStorage.getItem('lumimei_quiz_answered_ids');
        if (savedAnswered) setAnsweredQuizIds(JSON.parse(savedAnswered));
      } catch (err) {
        console.warn(err);
      }
    };
    window.addEventListener('pointsUpdated', handlePointsUpdated);
    window.addEventListener('checkinUpdated', handlePointsUpdated);
    window.addEventListener('lumimei_tasks_updated', handleTasksUpdated);
    window.addEventListener('quiz_pending_questions_updated', handleQuizPendingUpdated);
    return () => {
      window.removeEventListener('pointsUpdated', handlePointsUpdated);
      window.removeEventListener('checkinUpdated', handlePointsUpdated);
      window.removeEventListener('lumimei_tasks_updated', handleTasksUpdated);
      window.removeEventListener('quiz_pending_questions_updated', handleQuizPendingUpdated);
    };
  }, []);

  const currentPoints = userProfile ? userProfile.points : guestPoints;
  const displayName = userProfile?.name || (language === 'km' ? 'ភ្ញៀវ' : 'Guest');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  const handlePhotoSelect = (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(
        language === 'km'
          ? 'សូមជ្រើសរើសឯកសារជារូបភាព (JPG, PNG, WebP)!'
          : 'Please select an image file!',
        'error'
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast(
        language === 'km'
          ? 'ទំហំរូបភាពធំពេក! សូមជ្រើសរូបភាពក្រោម 10MB'
          : 'Image size too large! Please choose image under 10MB',
        'error'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedPhotos((prev) => ({
          ...prev,
          [taskId]: reader.result as string,
        }));
        showToast(
          language === 'km'
            ? 'បានជ្រើសរូបភាពរួចរាល់! សូមចុចប៊ូតុង "ផ្ទៀងផ្ទាត់"'
            : 'Photo selected! Please click "Verify"',
          'success'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (taskId: string) => {
    setUploadedPhotos((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
    if (fileInputRefs.current[taskId]) {
      fileInputRefs.current[taskId]!.value = '';
    }
  };

  const handleAnswerQuizQuestion = async (q: QuizQuestion) => {
    // Only use the user's manual typed response in the input field
    const rawAnswer = (quizAnswers[q.id] || '').trim();
    if (!rawAnswer) {
      showToast(
        language === 'km'
          ? 'សូមបញ្ចូលចម្លើយរបស់អ្នកជាមុនសិន!'
          : language === 'zh'
          ? '请先输入您的回答！'
          : 'Please enter your answer first!',
        'error'
      );
      return;
    }

    if (answeredQuizIds.includes(q.id)) {
      showToast(
        language === 'km'
          ? 'សំនួរនេះត្រូវបាន Admin ផ្ទៀងផ្ទាត់ និងផ្ដល់ពិន្ទុរួចហើយ!'
          : 'This question is already verified and awarded points!',
        'success'
      );
      return;
    }

    if (pendingQuizQuestions[q.id]?.status === 'pending') {
      showToast(
        language === 'km'
          ? 'ចម្លើយរបស់អ្នកកំពុងរង់ចាំ Admin ផ្ទៀងផ្ទាត់ (Pending Verify)!'
          : 'Your answer is already awaiting Admin verification!',
        'success'
      );
      return;
    }

    setAnsweringQuizId(q.id);
    try {
      const uid = userProfile?.uid || (userProfile as any)?.id || 'guest';
      const custPhone =
        userProfile?.phone ||
        userProfile?.phoneNumber ||
        localStorage.getItem('lumimei_guest_phone') ||
        '';
      const custName =
        userProfile?.name ||
        userProfile?.displayName ||
        (language === 'km' ? 'អតិថិជន Lumimei' : 'Lumimei Customer');

      const submission = await submitCustomerQuizAnswers({
        userId: uid,
        customerName: custName,
        customerPhone: custPhone,
        telegram: (userProfile as any)?.telegram || '',
        answers: [
          {
            questionId: q.id,
            questionNum: q.num,
            questionText: language === 'km' ? q.questionKm : q.questionEn,
            answer: rawAnswer,
          },
        ],
      });

      const nextSaved = { ...savedQuizAnswers, [q.id]: rawAnswer };
      setSavedQuizAnswers(nextSaved);
      localStorage.setItem(`lumimei_quiz_saved_answers_${uid}`, JSON.stringify(nextSaved));
      localStorage.setItem('lumimei_quiz_saved_answers', JSON.stringify(nextSaved));

      const nextPending = {
        ...pendingQuizQuestions,
        [q.id]: { subId: submission.id, answer: rawAnswer, status: 'pending' as const },
      };
      setPendingQuizQuestions(nextPending);
      localStorage.setItem(`lumimei_quiz_pending_questions_${uid}`, JSON.stringify(nextPending));
      localStorage.setItem('lumimei_quiz_pending_questions', JSON.stringify(nextPending));

      showToast(
        language === 'km'
          ? `🎉 បានបញ្ជូនចម្លើយសំនួរទី ${q.num} ជោគជ័យ! ចម្លើយបានលោតចូលទំព័រ Admin ដើម្បីអោយ Admin Verify ផ្ដល់ពិន្ទុ (+10) ជូន។`
          : language === 'zh'
          ? `🎉 第 ${q.num} 题已成功提交！答案已发送至管理员后台等待审核 (Verify) 赠送 10 积分。`
          : `🎉 Answer for Q${q.num} submitted! Sent to Admin for verification to award 10 points.`,
        'success'
      );
    } catch {
      showToast('មានបញ្ហាក្នុងការរក្សាទុកចម្លើយ។ សូមព្យាយាមម្តងទៀត។', 'error');
    } finally {
      setAnsweringQuizId(null);
    }
  };

  const handleBulkAnswerQuiz = async () => {
    const unansweredQuestions = QUIZ_QUESTIONS.filter(
      (q) =>
        !answeredQuizIds.includes(q.id) &&
        pendingQuizQuestions[q.id]?.status !== 'pending' &&
        (quizAnswers[q.id] || '').trim() !== ''
    );

    if (unansweredQuestions.length === 0) {
      showToast(
        language === 'km'
          ? 'សូមបំពេញចម្លើយយ៉ាងហោចណាស់មួយសំនួរដើម្បីបញ្ជូន!'
          : 'Please enter an answer for at least one question to submit!',
        'error'
      );
      return;
    }

    setAnsweringQuizId('bulk_submit');
    try {
      const uid = userProfile?.uid || (userProfile as any)?.id || 'guest';
      const custPhone =
        userProfile?.phone ||
        userProfile?.phoneNumber ||
        localStorage.getItem('lumimei_guest_phone') ||
        '';
      const custName =
        userProfile?.name ||
        userProfile?.displayName ||
        (language === 'km' ? 'អតិថិជន Lumimei' : 'Lumimei Customer');

      const answersToSubmit = unansweredQuestions.map((q) => ({
        questionId: q.id,
        questionNum: q.num,
        questionText: language === 'km' ? q.questionKm : q.questionEn,
        answer: (quizAnswers[q.id] || '').trim(),
      }));

      const submission = await submitCustomerQuizAnswers({
        userId: uid,
        customerName: custName,
        customerPhone: custPhone,
        telegram: (userProfile as any)?.telegram || '',
        answers: answersToSubmit,
      });

      const nextSaved = { ...savedQuizAnswers };
      const nextPending = { ...pendingQuizQuestions };
      unansweredQuestions.forEach((q) => {
        const val = (quizAnswers[q.id] || '').trim();
        nextSaved[q.id] = val;
        nextPending[q.id] = { subId: submission.id, answer: val, status: 'pending' };
      });

      setSavedQuizAnswers(nextSaved);
      setPendingQuizQuestions(nextPending);
      localStorage.setItem(`lumimei_quiz_saved_answers_${uid}`, JSON.stringify(nextSaved));
      localStorage.setItem('lumimei_quiz_saved_answers', JSON.stringify(nextSaved));
      localStorage.setItem(`lumimei_quiz_pending_questions_${uid}`, JSON.stringify(nextPending));
      localStorage.setItem('lumimei_quiz_pending_questions', JSON.stringify(nextPending));

      showToast(
        language === 'km'
          ? `🎉 បានបញ្ជូនចម្លើយ ${unansweredQuestions.length} សំនួរជោគជ័យ! ចម្លើយបានលោតចូលទំព័រ Admin ដើម្បីអោយ Admin Verify ផ្ដល់ពិន្ទុ (+10/សំនួរ) ជូន។`
          : language === 'zh'
          ? `🎉 已成功提交 ${unansweredQuestions.length} 道题！答案已发送至管理员后台等待审核 (每题 10 积分)。`
          : `🎉 Submitted ${unansweredQuestions.length} answers! Sent to Admin for verification (10 pts each).`,
        'success'
      );
    } catch {
      showToast('មានបញ្ហាក្នុងការរក្សាទុកចម្លើយ។ សូមព្យាយាមម្តងទៀត។', 'error');
    } finally {
      setAnsweringQuizId(null);
    }
  };

  // Submit Referral Form & Add Free Lumimei Soap into Cart
  const handleSubmitReferral = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!referralForm.friendName.trim()) {
      showToast(
        language === 'km'
          ? 'សូមបញ្ចូលឈ្មោះមិត្តភក្តិរបស់អ្នក!'
          : 'Please enter your friend\'s full name!',
        'error'
      );
      return;
    }

    if (!referralForm.friendPhone.trim()) {
      showToast(
        language === 'km'
          ? 'សូមបញ្ចូលលេខទូរស័ព្ទ ឬ Telegram របស់មិត្តភក្តិ!'
          : 'Please enter your friend\'s phone number or Telegram!',
        'error'
      );
      return;
    }

    setIsSubmittingReferral(true);
    try {
      // 1. Add Lumimei Soap ($0.00 Free Gift) into shopping cart
      if (onAddToCart) {
        const soapGiftProduct: Product = {
          id: `gift-soap-${Date.now()}`,
          name: 'Lumimei Herbal Soap (Free Gift)',
          nameKm: 'Lumimei សាប៊ូ (រង្វាន់ណែនាំមិត្តភក្តិ)',
          nameZh: 'Lumimei 草本香皂 (推荐好友赠品)',
          brand: 'Lumimei',
          category: 'ថែរក្សាស្បែក',
          priceUsd: 0,
          priceKhr: 0,
          pointsCost: 0,
          rating: 5,
          reviewCount: 1,
          image: soapImg,
          skinTypes: ['all'],
          skinConcerns: [],
          description: 'រង្វាន់ឥតគិតថ្លៃ (FREE): ផលិតផល Lumimei សាប៊ូមួយដុំ ផ្សំពីរុក្ខជាតិធម្មជាតិសុទ្ធ',
          descriptionKm: 'រង្វាន់ឥតគិតថ្លៃ (FREE): ផលិតផល Lumimei សាប៊ូមួយដុំ ផ្សំពីរុក្ខជាតិធម្មជាតិសុទ្ធ',
          howToUse: 'ប្រើប្រាស់តាមការណែនាំ',
          howToUseKm: 'ដុសសាប៊ូជាមួយទឹកឲ្យកើតពពុះ រួចម៉ាសាលើផ្ទៃមុខ ឬដងខ្លួន រួចលាងទឹកចេញឲ្យស្អាត។',
          ingredients: 'Lumimei Pure Coconut & Natural Herbal Formula',
          stock: 100,
          volume: '1 Bar (ដុំ)',
        };
        onAddToCart(soapGiftProduct);
      }

      // 2. Save referral record to localStorage
      const newReferralRecord = {
        id: `ref-${Date.now()}`,
        ...referralForm,
        submittedAt: new Date().toISOString(),
      };
      try {
        const existing = JSON.parse(localStorage.getItem('lumimei_referral_submissions') || '[]');
        localStorage.setItem('lumimei_referral_submissions', JSON.stringify([...existing, newReferralRecord]));
      } catch {
        // ignore
      }

      // 3. Mark task completed
      const nextCompleted = Array.from(new Set([...completedTasks, 'task-refer-friend']));
      setCompletedTasks(nextCompleted);
      localStorage.setItem('lumimei_completed_mission_tasks', JSON.stringify(nextCompleted));

      setJustEarnedAnim(true);
      setTimeout(() => setJustEarnedAnim(false), 2500);

      showToast(
        language === 'km'
          ? '🎉 បានបញ្ជូនការណែនាំជោគជ័យ! «ផលិតផល Lumimei សាប៊ូមួយដុំ» ត្រូវបានដាក់ចូលកន្ត្រកទំនិញរួចរាល់ហើយ!'
          : '🎉 Referral submitted! Free Lumimei Herbal Soap added to your cart!',
        'success'
      );

      setReferralSuccessModal(true);
    } catch {
      showToast('មានបញ្ហាក្នុងការបញ្ជូន។ សូមព្យាយាមម្តងទៀត។', 'error');
    } finally {
      setIsSubmittingReferral(false);
    }
  };

  const handleClaimTask = async (task: MissionTask) => {
    // If it is the quiz game task, transition to dedicated Quiz Page view
    if (task.id === 'task-quiz-game' || task.titleKm?.includes('ឆ្លើយសំនួរ')) {
      setActiveSubView('quiz');
      return;
    }

    // If it is the referral task, transition to dedicated Referral Form view
    if (task.id === 'task-refer-friend' || task.titleKm?.includes('ណែនាំមិត្តភក្ត')) {
      setActiveSubView('referral');
      return;
    }

    const isDaily = task.id === 'task-daily-checkin' || task.id === 'task-fb-cambodia' || task.iconType === 'calendar';
    const todayStr = getTodayDateStr();

    if (isDaily) {
      if (lastCheckinDate === todayStr || (userProfile as any)?.lastCheckInDate === todayStr) {
        showToast(
          language === 'km'
            ? 'អ្នកបានចុះវត្តមានថ្ងៃនេះរួចរាល់ហើយ! សូមត្រលប់មកវិញនៅថ្ងៃស្អែក។'
            : 'You have already checked in today! Please come back tomorrow.',
          'success'
        );
        return;
      }

      setSubmittingTaskId(task.id);
      try {
        const bonusPoints = task.points || 2;
        const newPoints = currentPoints + bonusPoints;

        localStorage.setItem('lumimei_last_checkin_date', todayStr);
        setLastCheckinDate(todayStr);

        if (userProfile) {
          await updateUserProfile({
            points: newPoints,
            lastCheckInDate: todayStr,
          });
        }
        localStorage.setItem('lumimei_guest_points', newPoints.toString());
        setGuestPoints(newPoints);
        window.dispatchEvent(new Event('pointsUpdated'));
        window.dispatchEvent(new Event('checkinUpdated'));

        setJustEarnedAnim(true);
        setTimeout(() => setJustEarnedAnim(false), 2000);

        showToast(
          language === 'km'
            ? `🎉 បានចុះវត្តមានប្រចាំថ្ងៃជោគជ័យ! ទទួលបាន +${bonusPoints} ពិន្ទុ។`
            : `🎉 Daily check-in successful! Earned +${bonusPoints} points.`,
          'success'
        );
      } catch {
        showToast('មានបញ្ហាក្នុងការចុះវត្តមាន។ សូមព្យាយាមម្តងទៀត។', 'error');
      } finally {
        setSubmittingTaskId(null);
      }
      return;
    }

    if (completedTasks.includes(task.id)) {
      showToast(
        language === 'km'
          ? 'អ្នកបានទទួលយកភារកិច្ចនេះរួចរាល់ហើយ!'
          : 'You have already completed this task!',
        'success'
      );
      return;
    }

    if (task.requiresPhoto && !uploadedPhotos[task.id]) {
      if (fileInputRefs.current[task.id]) {
        fileInputRefs.current[task.id]!.click();
      }
      showToast(
        language === 'km'
          ? 'សូម Upload រូបភាព Screenshot បញ្ជាក់ជាមុនសិន រួចចុច Submit!'
          : 'Please upload screenshot photo first, then click Submit!',
        'error'
      );
      return;
    }

    setSubmittingTaskId(task.id);
    try {
      if (task.requiresPhoto) {
        const nextPending = Array.from(new Set([...pendingReviewTasks, task.id]));
        setPendingReviewTasks(nextPending);
        localStorage.setItem('lumimei_pending_review_tasks', JSON.stringify(nextPending));

        try {
          await submitPhotoTaskVerification({
            userId: userProfile?.uid || 'guest',
            customerName: userProfile?.name || (language === 'km' ? 'អតិថិជន Lumimei' : 'Lumimei Customer'),
            customerPhone: userProfile?.phone || '',
            telegram: (userProfile as any)?.telegram || '',
            taskId: task.id,
            taskTitle: task.titleKm || 'Follow Facebook Page: Lumimei Cambodia',
            points: task.points || 10,
            screenshot: uploadedPhotos[task.id] || '',
          });
        } catch (err) {
          console.warn('Failed to submit photo task verification:', err);
        }

        showToast(
          language === 'km'
            ? '🎉 បានបញ្ជូនរូបភាពជោគជ័យ! ក្រុមការងារនឹងផ្ទៀងផ្ទាត់ និងផ្តល់ពិន្ទុជូនក្នុងពេលឆាប់ៗ។'
            : '🎉 Submitted photo successfully! Under review.',
          'success'
        );
        return;
      }

      const bonusPoints = task.points || 0;
      const newPoints = currentPoints + bonusPoints;
      const nextCompleted = Array.from(new Set([...completedTasks, task.id]));

      setCompletedTasks(nextCompleted);
      localStorage.setItem('lumimei_completed_mission_tasks', JSON.stringify(nextCompleted));

      if (userProfile) {
        await updateUserProfile({ points: newPoints });
      }
      localStorage.setItem('lumimei_guest_points', newPoints.toString());
      setGuestPoints(newPoints);
      window.dispatchEvent(new Event('pointsUpdated'));

      setJustEarnedAnim(true);
      setTimeout(() => setJustEarnedAnim(false), 2000);

      showToast(
        language === 'km'
          ? `🎉 ទទួលបាន +${task.points} ពិន្ទុដោយជោគជ័យ! ពិន្ទុបានចូលក្នុងគណនីរបស់អ្នករួចរាល់។`
          : `🎉 Received +${task.points} points into your account!`,
        'success'
      );

      if (task.id === 'task-new-user') {
        setTimeout(() => {
          setDismissedTaskIds((prev) => Array.from(new Set([...prev, 'task-new-user'])));
        }, 1200);
      }
    } catch {
      showToast('មានបញ្ហាក្នុងការទទួលពិន្ទុ។ សូមព្យាយាមម្តងទៀត។', 'error');
    } finally {
      setSubmittingTaskId(null);
    }
  };

  const handleRedeemItem = async (item: RedeemItem) => {
    if (currentPoints < item.pointsRequired) {
      showToast(
        language === 'km'
          ? `ពិន្ទុរបស់អ្នកមិនគ្រប់គ្រាន់ទេ! អ្នកត្រូវការ ${item.pointsRequired} ពិន្ទុ`
          : `Insufficient points! You need ${item.pointsRequired} points.`,
        'error'
      );
      return;
    }

    try {
      const newPoints = currentPoints - item.pointsRequired;
      if (userProfile) {
        await updateUserProfile({ points: newPoints });
      } else {
        localStorage.setItem('lumimei_guest_points', newPoints.toString());
        setGuestPoints(newPoints);
        window.dispatchEvent(new Event('pointsUpdated'));
      }

      if (onAddToCart) {
        const productToAdd: Product = {
          id: `redeem-${item.id}-${Date.now()}`,
          name: item.nameEn,
          nameKm: item.nameKm,
          nameZh: item.nameZh,
          brand: 'Lumimei',
          category: 'ថែរក្សាស្បែក',
          priceUsd: 0,
          priceKhr: 0,
          pointsCost: item.pointsRequired,
          rating: 5,
          reviewCount: 1,
          image: item.image,
          skinTypes: ['all'],
          skinConcerns: [],
          description: item.descriptionKm,
          descriptionKm: item.descriptionKm,
          howToUse: 'ប្រើប្រាស់តាមការណែនាំ',
          howToUseKm: 'ប្រើប្រាស់តាមការណែនាំ',
          ingredients: 'Lumimei Active Formula',
          stock: 100,
          volume: '1 item',
        };
        onAddToCart(productToAdd);
      }

      showToast(
        language === 'km'
          ? `បានប្តូរ "${item.nameKm}" និងបន្ថែមទៅក្នុងកន្ត្រកទំនិញដោយឥតគិតថ្លៃ (FREE)!`
          : `Redeemed "${item.nameEn}" to your shopping cart for FREE!`,
        'success'
      );
    } catch {
      showToast('មានបញ្ហាក្នុងការប្តូរយករង្វាន់។ សូមព្យាយាមម្តងទៀត។', 'error');
    }
  };

  const renderIcon = (type: any) => {
    switch (type) {
      case 'gamepad':
        return <Gamepad2 className="w-5 h-5 text-purple-600" />;
      case 'calendar':
      case 'daily':
        return <CalendarCheck className="w-5 h-5 text-emerald-600" />;
      case 'users':
      case 'referral':
      case 'friends':
        return <Users className="w-5 h-5 text-emerald-600" />;
      case 'user':
        return <UserPlus className="w-5 h-5 text-emerald-600" />;
      case 'gift':
      case 'soap':
        return <Gift className="w-5 h-5 text-amber-600" />;
      case 'facebook':
        return <Facebook className="w-5 h-5 text-blue-600 fill-blue-600" />;
      case 'tiktok':
        return <Video className="w-5 h-5 text-rose-600" />;
      case 'review':
        return <Star className="w-5 h-5 text-amber-500 fill-amber-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto font-battambang">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-emerald-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            {activeSubView !== 'main' ? (
              <button
                type="button"
                onClick={() => setActiveSubView('main')}
                className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-xs transition cursor-pointer"
                title={language === 'km' ? 'ត្រឡប់ក្រោយ' : 'Back'}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-xs">
                <Gift className="w-6 h-6 animate-bounce" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <span>
                  {activeSubView === 'quiz'
                    ? language === 'km' ? 'លេង Game ឆ្លើយសំនួរ' : 'Quiz Q&A Game'
                    : activeSubView === 'referral'
                    ? language === 'km' ? 'ណែនាំមិត្តភក្ត័មកទិញផលិតផល' : 'Refer a Friend'
                    : language === 'km' ? 'ចូលទៅសន្សំពិន្ទុ' : 'Earn Points & Rewards'}
                </span>
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                {activeSubView === 'quiz'
                  ? language === 'km' ? 'ឆ្លើយត្រូវមួយសំនួរទទួលបាន +១ ពិន្ទុភ្លាមៗ' : 'Earn +1 point per correct answer'
                  : activeSubView === 'referral'
                  ? language === 'km' ? 'ទទួលបាន ផលិតផល Lumimei សាប៊ូមួយដុំ (FREE)' : 'Get 1 Free Lumimei Soap Bar added to cart'
                  : language === 'km' ? 'សន្សំពិន្ទុ & ប្តូរយករង្វាន់ជាមួយ Lumimei' : 'Earn points & redeem rewards'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
          {/* Toast Message */}
          {toastMessage && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top duration-200 shadow-xs ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                  : 'bg-red-100 text-red-950 border border-red-300'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage.text}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW 1: DEDICATED QUIZ GAME PAGE (ទំព័រឆ្លើយសំនួរ) */}
          {/* ========================================================================= */}
          {activeSubView === 'quiz' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Back to Points Header Bar */}
              <div className="flex items-center justify-between gap-2 pb-1">
                <button
                  type="button"
                  onClick={() => setActiveSubView('main')}
                  className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl transition cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{language === 'km' ? 'ត្រឡប់ទៅផ្ទាំងសន្សំពិន្ទុ' : 'Back to Points'}</span>
                </button>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 border border-purple-300 text-xs font-extrabold text-purple-900 shadow-2xs">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>
                    {language === 'km' ? 'ឆ្លើយបាន៖ ' : 'Answered: '}
                    <strong className="text-emerald-700">{answeredQuizIds.length}</strong>/{QUIZ_QUESTIONS.length}
                  </span>
                </div>
              </div>

              {/* Quiz Banner Card */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white rounded-3xl p-4 sm:p-5 border border-purple-500/40 shadow-xl overflow-hidden relative">
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-md shrink-0">
                      <Gamepad2 className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base sm:text-lg font-extrabold text-white">
                          {language === 'km' ? 'ទំព័រឆ្លើយសំនួរ Lumimei' : language === 'zh' ? 'Lumimei 问答挑战' : 'Lumimei Quiz Q&A Page'}
                        </h4>
                        <span className="text-[10px] bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                          +10 {language === 'km' ? 'ពិន្ទុក្នុង ១សំនួរ' : language === 'zh' ? '积分/题' : 'pts / question'}
                        </span>
                      </div>
                      <p className="text-xs text-purple-200 mt-0.5">
                        {language === 'km'
                          ? 'ឆ្លើយត្រូវមួយសំនួរទទួលបាន +១០ ពិន្ទុ (សរុប ៦០ ពិន្ទុ)! ចូលបំពេញចម្លើយដោយផ្ទាល់ដៃ។'
                          : language === 'zh'
                          ? '每答对一题获得 +10 积分（共 60 积分）！请手动输入您的答案。'
                          : 'Earn +10 points per question (total 60 pts)! Please type your answers.'}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="pt-2 space-y-1.5 border-t border-purple-400/20">
                    <div className="flex items-center justify-between text-xs text-purple-200">
                      <span className="font-semibold">{language === 'km' ? 'វឌ្ឍនភាពចម្លើយ' : language === 'zh' ? '答题进度' : 'Quiz Progress'}</span>
                      <span className="font-extrabold text-amber-300">
                        {answeredQuizIds.length === QUIZ_QUESTIONS.length
                          ? language === 'km' ? '🎉 ឆ្លើយចប់គ្រប់សំនួរ (+60 ពិន្ទុ)' : language === 'zh' ? '🎉 全部完成 (+60 积分)' : 'Completed (+60 pts)'
                          : `${answeredQuizIds.length}/${QUIZ_QUESTIONS.length} (${Math.round((answeredQuizIds.length / QUIZ_QUESTIONS.length) * 100)}%)`}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-purple-950/80 rounded-full overflow-hidden border border-purple-700/40">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 rounded-full transition-all duration-500"
                        style={{ width: `${(answeredQuizIds.length / QUIZ_QUESTIONS.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 6 Questions List */}
              <div className="space-y-3">
                {QUIZ_QUESTIONS.map((q) => {
                  const isVerified =
                    answeredQuizIds.includes(q.id) || pendingQuizQuestions[q.id]?.status === 'verified';
                  const isPending = !isVerified && pendingQuizQuestions[q.id]?.status === 'pending';
                  const isRejected = !isVerified && pendingQuizQuestions[q.id]?.status === 'rejected';

                  const currentVal = isVerified || isPending
                    ? pendingQuizQuestions[q.id]?.answer || savedQuizAnswers[q.id] || quizAnswers[q.id] || ''
                    : quizAnswers[q.id] || '';

                  const isSubmittingThis = answeringQuizId === q.id;
                  const questionText =
                    language === 'km' ? q.questionKm : language === 'zh' ? q.questionZh : q.questionEn;

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-2xl border transition-all shadow-2xs ${
                        isVerified
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : isPending
                          ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-100'
                          : isRejected
                          ? 'bg-rose-50/60 border-rose-300'
                          : 'bg-white border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-900 text-xs font-black flex items-center justify-center shrink-0">
                            {q.num}
                          </span>
                          <span>{questionText.replace(/^[០-៩0-9]\.\s*/, '')}</span>
                        </h5>

                        {/* Status Badges */}
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{language === 'km' ? 'Admin ផ្ទៀងផ្ទាត់រួច (+10)' : language === 'zh' ? '审核通过 (+10 积分)' : 'Verified (+10 pts)'}</span>
                          </span>
                        )}

                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 shrink-0 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>{language === 'km' ? 'រង់ចាំ Admin ផ្ទៀងផ្ទាត់' : language === 'zh' ? '等待管理员审核' : 'Pending Verify'}</span>
                          </span>
                        )}

                        {isRejected && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>{language === 'km' ? 'ឆ្លើយម្តងទៀត' : language === 'zh' ? '重新作答' : 'Revise'}</span>
                          </span>
                        )}

                        {!isVerified && !isPending && !isRejected && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-200 shrink-0">
                            +10 {language === 'km' ? 'ពិន្ទុ' : language === 'zh' ? '积分' : 'pts'}
                          </span>
                        )}
                      </div>

                      {/* Verified Answer Display */}
                      {isVerified && (
                        <div className="bg-emerald-100/60 border border-emerald-300 rounded-xl p-3 text-xs text-emerald-950 flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-emerald-800 font-bold mb-0.5">
                              {language === 'km' ? 'ចម្លើយរបស់អ្នក (បានទទួល +10 ពិន្ទុ)៖' : language === 'zh' ? '您的回答（已获得 +10 积分）：' : 'Your Answer (Awarded +10 pts):'}
                            </p>
                            <p className="text-xs text-slate-900 font-semibold break-words italic">
                              "{currentVal}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Pending Verification Display */}
                      {isPending && (
                        <div className="bg-amber-100/70 border border-amber-300 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2.5">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-[11px] text-amber-900 font-extrabold">
                                {language === 'km' ? 'ចម្លើយរបស់អ្នកកំពុងរង់ចាំ Admin Verify ៖' : 'Submitted & Awaiting Admin Verify:'}
                              </p>
                              <span className="text-[10px] text-amber-700 font-bold">លោតចូលទំព័រ Admin រួចរាល់</span>
                            </div>
                            <p className="text-xs text-slate-900 font-semibold break-words italic bg-white/70 p-2 rounded-lg border border-amber-200 mb-1.5">
                              "{currentVal}"
                            </p>
                            <p className="text-[10px] text-amber-800">
                              {language === 'km'
                                ? 'Admin នឹងពិនិត្យផ្ទៀងផ្ទាត់ក្នុងពេលឆាប់ៗ ដើម្បីផ្ដល់ពិន្ទុជូនអ្នក!'
                                : 'Admin will review and approve points shortly!'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Rejected Notice Display */}
                      {isRejected && (
                        <div className="mb-2 bg-rose-100 border border-rose-300 rounded-xl p-2.5 text-xs text-rose-900 flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="flex-1 text-[11px]">
                            <span className="font-bold">Admin បានបដិសេធ៖ </span>
                            <span>{pendingQuizQuestions[q.id]?.reason || 'សូមឆ្លើយឱ្យបានត្រឹមត្រូវឡើងវិញ'}</span>
                          </div>
                        </div>
                      )}

                      {/* Answer Input when Not Verified & Not Pending: Strictly blank for user manual entry */}
                      {!isVerified && !isPending && (
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <textarea
                              rows={2}
                              placeholder={
                                language === 'km'
                                  ? 'សូមបញ្ចូលចម្លើយរបស់អ្នកនៅទីនេះ...'
                                  : language === 'zh'
                                  ? '请输入您的回答...'
                                  : 'Type your answer here...'
                              }
                              value={quizAnswers[q.id] || ''}
                              onChange={(e) =>
                                setQuizAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                              }
                              className="flex-1 bg-slate-50 border border-slate-300 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition resize-none"
                            />
                            <button
                              type="button"
                              disabled={isSubmittingThis || !(quizAnswers[q.id] || '').trim()}
                              onClick={() => handleAnswerQuizQuestion(q)}
                              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50 sm:self-stretch"
                            >
                              {isSubmittingThis ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5 text-amber-300" />
                              )}
                              <span>{language === 'km' ? 'បញ្ជូន' : language === 'zh' ? '提交' : 'Submit'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bulk Submit & Back Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                {answeredQuizIds.length < QUIZ_QUESTIONS.length && (
                  <button
                    type="button"
                    disabled={answeringQuizId === 'bulk_submit'}
                    onClick={handleBulkAnswerQuiz}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer"
                  >
                    {answeringQuizId === 'bulk_submit' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{language === 'km' ? 'កំពុងបញ្ជូន...' : 'Submitting...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>
                          {language === 'km'
                            ? 'បញ្ជូនចម្លើយទាំងអស់ (+10 ពិន្ទុក្នុង ១ សំនួរ)'
                            : language === 'zh'
                            ? '一键提交所有已填答案 (每题 +10 积分)'
                            : 'Submit All Answers (+10 pts each)'}
                        </span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveSubView('main')}
                  className="py-3 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm transition cursor-pointer"
                >
                  {language === 'km' ? 'ត្រឡប់ទៅផ្ទាំងដើម' : 'Back to Main'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW 2: DEDICATED REFER A FRIEND FORM (ទម្រង់ណែនាំមិត្តភក្ត័មកទិញផលិតផល) */}
          {/* ========================================================================= */}
          {activeSubView === 'referral' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Back button header */}
              <div className="flex items-center justify-between gap-2 pb-1">
                <button
                  type="button"
                  onClick={() => setActiveSubView('main')}
                  className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl transition cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{language === 'km' ? 'ត្រឡប់ទៅផ្ទាំងសន្សំពិន្ទុ' : 'Back to Points'}</span>
                </button>

                {completedTasks.includes('task-refer-friend') && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-xs font-extrabold text-emerald-900 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'km' ? 'បានដាក់ចូលកន្ត្រក' : 'Added to Cart'}</span>
                  </div>
                )}
              </div>

              {/* Free Reward Showcase Banner */}
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-amber-300 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full blur-xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
                  <div className="relative shrink-0">
                    <img
                      src={soapImg}
                      alt="Lumimei Herbal Soap"
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border-2 border-white/80 shadow-md"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md border border-white">
                      FREE $0.00
                    </div>
                  </div>

                  <div className="space-y-1 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-amber-100 border border-white/30">
                      <Gift className="w-3.5 h-3.5 text-amber-200" />
                      <span>{language === 'km' ? 'រង្វាន់ឥតគិតថ្លៃ ១០០%' : '100% Free Reward'}</span>
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-white leading-tight">
                      {language === 'km'
                        ? 'ណែនាំមិត្តភក្តិ ទទួលបាន ផលិតផល Lumimei សាប៊ូមួយដុំ'
                        : 'Refer a Friend & Get Free Lumimei Herbal Soap Bar'}
                    </h4>
                    <p className="text-xs text-amber-100 font-medium">
                      {language === 'km'
                        ? 'គ្រាន់តែបំពេញព័ត៌មានមិត្តភក្តិខាងក្រោម សាប៊ូរុក្ខជាតិនឹងត្រូវដាក់ចូលកន្ត្រកភ្លាមៗ!'
                        : 'Fill in your friend\'s details below and free soap will be added to your cart instantly!'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Referral Form */}
              <form
                onSubmit={handleSubmitReferral}
                className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3.5"
              >
                <h5 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'km' ? 'ទម្រង់ណែនាំមិត្តភក្ត័មកទិញផលិតផល' : 'Referral Information Form'}</span>
                </h5>

                {/* Field 1: Friend's Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ឈ្មោះមិត្តភក្តិដែលអ្នកណែនាំ *' : 'Friend\'s Full Name *'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder={language === 'km' ? 'ឧ. សុខ ស្រីនាង / Chea Vanna...' : 'e.g. John Doe...'}
                      value={referralForm.friendName}
                      onChange={(e) => setReferralForm({ ...referralForm, friendName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                    />
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Field 2: Friend's Phone Number / Telegram */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'លេខទូរស័ព្ទ ឬ Telegram របស់មិត្តភក្តិ *' : 'Friend\'s Phone / Telegram *'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder={language === 'km' ? 'ឧ. 012 345 678...' : 'e.g. 012 345 678...'}
                      value={referralForm.friendPhone}
                      onChange={(e) => setReferralForm({ ...referralForm, friendPhone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Field 3: Product Interested In */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ផលិតផលដែលមិត្តភក្តិចាប់អារម្មណ៍ចង់ទិញ' : 'Product Interested In'}
                  </label>
                  <select
                    value={referralForm.interestedProduct}
                    onChange={(e) => setReferralForm({ ...referralForm, interestedProduct: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition cursor-pointer"
                  >
                    <option value="Lumimei Clay Mask (ម៉ាសភក់បន្សុទ្ធស្បែក)">Lumimei Clay Mask (ម៉ាសភក់បន្សុទ្ធស្បែកមុខ)</option>
                    <option value="Lumimei សេរ៉ូម (Serum ព្យាបាលមុន)">Lumimei សេរ៉ូម (Serum ព្យាបាលមុន ស្តារស្បែក)</option>
                    <option value="Lumimei ប្រេងដូង (Virgin Coconut Oil)">Lumimei ប្រេងដូង (Virgin Coconut Oil ផ្តល់សំណើម)</option>
                    <option value="Lumimei សាប៊ូ (Herbal Soap)">Lumimei សាប៊ូរុក្ខជាតិ (Herbal Soap)</option>
                    <option value="ខ្មៅដៃគូសចិញ្ចើម (Eyebrow Pencil)">ខ្មៅដៃគូសចិញ្ចើម (Eyebrow Pencil)</option>
                    <option value="ឈុតថែរក្សាស្បែកពេញលេញ (Full Skincare Set)">ឈុតថែរក្សាស្បែកពេញលេញ (Full Skincare Set)</option>
                  </select>
                </div>

                {/* Field 4: Your Name / Referrer Contact */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ឈ្មោះ ឬលេខទូរស័ព្ទរបស់អ្នកណែនាំ' : 'Your Name / Referrer Contact'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ឈ្មោះអ្នកណែនាំ..."
                      value={referralForm.referrerName}
                      onChange={(e) => setReferralForm({ ...referralForm, referrerName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                    />
                    <HeartHandshake className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Field 5: Optional Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'កំណត់ចំណាំបន្ថែម (ស្រេចចិត្ត)' : 'Additional Note (Optional)'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={language === 'km' ? 'បញ្ចូលកំណត់ចំណាំ ឬអាសយដ្ឋានដឹកជញ្ជូន...' : 'Any additional note...'}
                    value={referralForm.referralNote}
                    onChange={(e) => setReferralForm({ ...referralForm, referralNote: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition resize-none"
                  />
                </div>

                {/* Submit Action Button */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmittingReferral}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-98 transition cursor-pointer"
                  >
                    {isSubmittingReferral ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{language === 'km' ? 'កំពុងបញ្ជូន & ដាក់ចូលកន្ត្រក...' : 'Submitting...'}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 text-amber-300" />
                        <span>
                          {language === 'km'
                            ? 'បញ្ជូន និងទទួលយកសាប៊ូដាក់ចូលកន្ត្រក (FREE)'
                            : 'Submit & Add Free Soap to Cart'}
                        </span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-slate-500">
                    {language === 'km'
                      ? '✨ ផលិតផល Lumimei សាប៊ូមួយដុំ នឹងត្រូវដាក់ចូលក្នុងកន្ត្រកទំនិញរបស់អ្នកភ្លាមៗ ដោយឥតគិតថ្លៃ $0.00'
                      : '✨ 1 Free Lumimei Soap bar will be automatically added to your cart with $0.00 cost'}
                  </p>
                </div>
              </form>



              {/* Referral Success Confirmation Alert */}
              {referralSuccessModal && (
                <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-950 space-y-2 text-center animate-in zoom-in-95">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h5 className="text-sm font-black">
                    {language === 'km'
                      ? '🎉 បានដាក់ចូលកន្ត្រកទំនិញជោគជ័យ!'
                      : '🎉 Added to Cart Successfully!'}
                  </h5>
                  <p className="text-xs text-emerald-800">
                    {language === 'km'
                      ? 'ផលិតផល «Lumimei សាប៊ូមួយដុំ (FREE)» បានដាក់ចូលក្នុងកន្ត្រកទំនិញរបស់អ្នករួចរាល់ហើយ។ អ្នកអាចចូលទៅមើលកន្ត្រកទំនិញ ឬបន្តទិញទំនិញបាន។'
                      : 'Lumimei Free Herbal Soap is now in your shopping cart.'}
                  </p>
                  <div className="pt-1 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      {language === 'km' ? 'ចូលទៅមើលកន្ត្រកទំនិញ' : 'View Cart'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSubView('main')}
                      className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-emerald-300 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      {language === 'km' ? 'ត្រឡប់ទៅផ្ទាំងពិន្ទុ' : 'Back to Points'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW 3: MAIN VIEW (ផ្ទាំងពិន្ទុ & បេសកកម្ម & ប្តូរយករង្វាន់) */}
          {/* ========================================================================= */}
          {activeSubView === 'main' && (
            <>
              {/* User Points Card */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-tr from-emerald-900 via-teal-900 to-emerald-950 text-white shadow-lg border border-emerald-700/50 relative overflow-hidden flex items-center justify-between">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

                <div className="space-y-1 z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-emerald-300">
                      {language === 'km' ? 'ពិន្ទុខ្ញុំ' : 'My Points'}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-800/80 text-emerald-200 border border-emerald-600/50 font-bold">
                      {displayName}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-amber-300 flex items-center gap-2 pt-1 font-opensans">
                    <Gift className="w-7 h-7 text-amber-400 shrink-0" />
                    <span>
                      {language === 'km'
                        ? `${currentPoints} ពិន្ទុ`
                        : language === 'zh'
                        ? `${currentPoints} 积分`
                        : `${currentPoints} pts`}
                    </span>
                  </h2>
                </div>

                {justEarnedAnim && (
                  <div className="z-10 bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-2xl shadow-lg animate-bounce text-xs">
                    +Points!
                  </div>
                )}
              </div>

              {/* Tab Buttons in the SAME row: [Button សន្សំពិន្ទុ] [Button ប្តូរយករង្វាន់] */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/80 rounded-2xl border border-slate-300/60">
                <button
                  onClick={() => setActiveTab('earn')}
                  className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                    activeTab === 'earn'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/50'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${activeTab === 'earn' ? 'text-amber-300' : 'text-slate-500'}`} />
                  <span>{language === 'km' ? 'សន្សំពិន្ទុ' : 'Earn Points'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('redeem')}
                  className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                    activeTab === 'redeem'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/50'
                  }`}
                >
                  <Gift className={`w-4 h-4 ${activeTab === 'redeem' ? 'text-amber-300' : 'text-slate-500'}`} />
                  <span>{language === 'km' ? 'ប្តូរយករង្វាន់' : 'Redeem Rewards'}</span>
                </button>
              </div>

              {/* TAB 1: សន្សំពិន្ទុ (Earn Points Missions) */}
              {activeTab === 'earn' && (
                <div className="space-y-3 pt-1">
                  {/* Mission Tasks List */}
                  {(missionTasksList || MISSION_TASKS)
                    .filter((task) => task.id !== 'task-new-user' && !(task.id === 'task-new-user' && (dismissedTaskIds || []).includes(task.id)))
                    .map((task) => {
                      const isDaily = task.id === 'task-daily-checkin' || task.id === 'task-fb-cambodia' || task.iconType === 'calendar';
                      const todayStr = getTodayDateStr();
                      const isCheckedInToday = isDaily && (lastCheckinDate === todayStr || (userProfile as any)?.lastCheckInDate === todayStr);
                      const isCompleted = isDaily ? isCheckedInToday : (completedTasks || []).includes(task.id);
                      const isPendingReview = !isDaily && (pendingReviewTasks || []).includes(task.id);
                      const isSubmitting = submittingTaskId === task.id;
                      const photoPreview = uploadedPhotos[task.id];
                      const title =
                        language === 'km' ? task.titleKm : language === 'zh' ? task.titleZh : task.titleEn;
                      const isQuizTask = task.id === 'task-quiz-game' || task.titleKm?.includes('ឆ្លើយសំនួរ');
                      const isReferralTask = task.id === 'task-refer-friend' || task.titleKm?.includes('ណែនាំមិត្តភក្ត');

                      return (
                        <div
                          key={task.id}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all bg-white shadow-2xs ${
                            isCompleted
                              ? 'border-emerald-200 bg-emerald-50/30'
                              : isPendingReview
                              ? 'border-amber-200 bg-amber-50/20'
                              : isQuizTask
                              ? 'border-purple-200 hover:border-purple-400 bg-gradient-to-r from-purple-50/40 via-white to-white'
                              : isReferralTask
                              ? 'border-amber-200 hover:border-amber-400 bg-gradient-to-r from-amber-50/40 via-white to-white'
                              : 'border-slate-200 hover:border-emerald-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Left: Icon, Title & Points */}
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`p-2.5 rounded-xl shrink-0 ${
                                  isCompleted
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : isPendingReview
                                    ? 'bg-amber-100 text-amber-700'
                                    : isQuizTask
                                    ? 'bg-purple-100 text-purple-700'
                                    : isReferralTask
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {renderIcon(task.iconType)}
                              </div>

                              <div className="min-w-0">
                                <h5 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                                  {title}
                                </h5>
                                {task.rewardTextKm ? (
                                  <div className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300/80 px-2 py-0.5 rounded-lg shadow-2xs">
                                    {isQuizTask ? (
                                      <Trophy className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                    ) : (
                                      <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    )}
                                    <span>
                                      {language === 'km'
                                        ? `ទទួលបាន ${task.rewardTextKm}`
                                        : language === 'zh'
                                        ? `赠送 ${task.rewardTextZh || task.rewardTextKm}`
                                        : `Get ${task.rewardTextEn || task.rewardTextKm}`}
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-xs font-bold text-emerald-700 mt-0.5">
                                    {language === 'km'
                                      ? `ទទួលបាន ${task.points} ពិន្ទុ`
                                      : `Earn ${task.points} points`}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right: Upload Photo & Action */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              {task.requiresPhoto && !isCompleted && !isPendingReview && (
                                <>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    ref={(el) => {
                                      fileInputRefs.current[task.id] = el;
                                    }}
                                    className="hidden"
                                    onChange={(e) => handlePhotoSelect(task.id, e)}
                                  />

                                  {photoPreview ? (
                                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 p-1 rounded-xl">
                                      <img
                                        src={photoPreview}
                                        alt="Screenshot"
                                        className="w-8 h-8 object-cover rounded-lg border border-emerald-300"
                                      />
                                      <button
                                        onClick={() => handleRemovePhoto(task.id)}
                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                        title="Remove photo"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => fileInputRefs.current[task.id]?.click()}
                                      className="inline-flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
                                    >
                                      <Camera className="w-3.5 h-3.5 text-slate-600" />
                                      <span>Upload Photo</span>
                                    </button>
                                  )}
                                </>
                              )}

                              {/* Submit / Status Badges & Buttons */}
                              {isCompleted && !isQuizTask && !isReferralTask ? (
                                <div className="inline-flex items-center gap-1 text-xs text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl font-bold shadow-2xs font-battambang">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>
                                    {isDaily
                                      ? language === 'km' ? 'បានចុះវត្តមានថ្ងៃនេះ' : language === 'zh' ? '今日已签到' : 'Checked In'
                                      : language === 'km' ? 'បានទទួលយក' : 'Claimed'}
                                  </span>
                                </div>
                              ) : isCompleted && isReferralTask ? (
                                <div className="inline-flex items-center gap-1 text-xs text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl font-bold shadow-2xs font-battambang">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>{language === 'km' ? 'បានដាក់ចូលកន្ត្រក' : 'Added to Cart'}</span>
                                </div>
                              ) : isPendingReview ? (
                                <div className="inline-flex items-center gap-1.5 text-xs text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl font-bold shadow-2xs font-battambang">
                                  <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                                  <span>
                                    {language === 'km' ? 'កំពុងត្រួតពិនិត្យ' : language === 'zh' ? '正在审核' : 'Under Review'}
                                  </span>
                                </div>
                              ) : isQuizTask ? (
                                <button
                                  id={`claim-btn-${task.id}`}
                                  onClick={() => setActiveSubView('quiz')}
                                  className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-xs shadow-purple-200 active:scale-95 transition-all cursor-pointer font-battambang"
                                >
                                  <Gamepad2 className="w-3.5 h-3.5 text-amber-300" />
                                  <span>{language === 'km' ? 'ចូលទៅឆ្លើយសំនួរ' : 'Go to Answer Quiz'}</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              ) : isReferralTask ? (
                                <button
                                  id={`claim-btn-${task.id}`}
                                  onClick={() => setActiveSubView('referral')}
                                  className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl font-extrabold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-xs shadow-amber-200 active:scale-95 transition-all cursor-pointer font-battambang"
                                >
                                  <Gift className="w-3.5 h-3.5 text-amber-200" />
                                  <span>{language === 'km' ? 'បំពេញទម្រង់ណែនាំ' : 'Fill Referral Form'}</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  id={`claim-btn-${task.id}`}
                                  onClick={() => handleClaimTask(task)}
                                  disabled={isSubmitting}
                                  className={`inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl font-extrabold text-white active:scale-95 shadow-xs transition-all cursor-pointer font-battambang ${
                                    task.requiresPhoto
                                      ? 'bg-blue-600 hover:bg-blue-700'
                                      : 'bg-emerald-600 hover:bg-emerald-700'
                                  }`}
                                >
                                  {isSubmitting ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>{language === 'km' ? 'កំពុងបញ្ជូន...' : 'Submitting...'}</span>
                                    </>
                                  ) : isDaily ? (
                                    <>
                                      <CalendarCheck className="w-3.5 h-3.5 text-amber-300" />
                                      <span>{language === 'km' ? 'ចុះវត្តមាន (+2)' : 'Check In (+2)'}</span>
                                    </>
                                  ) : task.requiresPhoto ? (
                                    <>
                                      <Send className="w-3.5 h-3.5" />
                                      <span>Submit</span>
                                    </>
                                  ) : (
                                    <>
                                      <Gift className="w-3.5 h-3.5 text-amber-300" />
                                      <span>{language === 'km' ? 'ទទួលយក' : 'Claim'}</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* TAB 2: ប្តូរយករង្វាន់ (Redeem Rewards List) */}
              {activeTab === 'redeem' && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 gap-3">
                    {REDEEMABLE_ITEMS.map((item) => {
                      const canAfford = currentPoints >= item.pointsRequired;
                      const name =
                        language === 'km'
                          ? item.nameKm
                          : language === 'zh'
                          ? item.nameZh
                          : item.nameEn;

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-2xl border transition-all flex gap-3.5 bg-white shadow-2xs ${
                            canAfford
                              ? 'border-emerald-200 hover:border-emerald-500'
                              : 'border-slate-200 opacity-85'
                          }`}
                        >
                          <img
                            src={item.image}
                            alt={name}
                            className="w-18 h-18 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-100 shadow-2xs shrink-0"
                          />

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                                  {item.pointsRequired} {language === 'km' ? 'ពិន្ទុ' : 'Points'}
                                </span>
                              </div>
                              <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {name}
                              </h5>
                              <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                                {item.descriptionKm}
                              </p>
                            </div>

                            <button
                              onClick={() => handleRedeemItem(item)}
                              disabled={!canAfford}
                              className={`mt-2 w-full py-1.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                canAfford
                                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              }`}
                            >
                              {canAfford ? (
                                <>
                                  <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                                  <span>
                                    {language === 'km'
                                      ? 'ប្តូរយករង្វាន់ (FREE)'
                                      : 'Redeem Item (FREE)'}
                                  </span>
                                </>
                              ) : (
                                <span>
                                  {language === 'km'
                                    ? `ត្រូវការ ${item.pointsRequired} ពិន្ទុ`
                                    : `Requires ${item.pointsRequired} pts`}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-white border-t border-emerald-100 flex items-center justify-between">
          <div className="text-xs text-slate-600 font-medium flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] sm:text-xs">
              {activeSubView === 'quiz'
                ? language === 'km' ? 'ឆ្លើយសំនួរដើម្បីទទួលបាន +១ ពិន្ទុក្នុងមួយសំនួរ' : 'Answer quiz questions for points'
                : activeSubView === 'referral'
                ? language === 'km' ? 'ណែនាំមិត្តភក្តិដើម្បីទទួលបានផលិតផល Lumimei សាប៊ូមួយដុំ FREE' : 'Refer a friend to get free soap'
                : activeTab === 'earn'
                ? language === 'km' ? 'បំពេញភារកិច្ចដើម្បីទទួលបានពិន្ទុបន្ថែម!' : 'Complete tasks to earn points!'
                : language === 'km' ? 'ប្រើប្រាស់ពិន្ទុដើម្បីប្តូរយកផលិតផល Lumimei ដោយឥតគិតថ្លៃ!' : 'Redeem points for free Lumimei products!'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            {language === 'km' ? 'បិទ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
