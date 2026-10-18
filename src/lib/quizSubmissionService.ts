import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, saveMockUser, getMockUsers, UserProfile } from './firebase';

export interface QuizSubmissionAnswer {
  questionId: string;
  questionNum: number;
  questionText: string;
  answer: string;
  status?: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export interface QuizSubmission {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  telegram?: string;
  answers: QuizSubmissionAnswer[];
  totalQuestions: number;
  status: 'pending' | 'verified' | 'rejected';
  pointsAwarded: number;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  taskType?: 'quiz' | 'photo_task';
  taskId?: string;
  taskTitle?: string;
  screenshot?: string;
}

const STORAGE_KEY = 'lumimei_quiz_submissions';

// Initial sample submissions so Admin dashboard has realistic demonstration data immediately
const INITIAL_SAMPLE_SUBMISSIONS: QuizSubmission[] = [
  {
    id: 'quiz_sub_sample_001',
    userId: 'user_sokha_01',
    customerName: 'សុខា រតនា (Sokha Ratana)',
    customerPhone: '012 889 977',
    telegram: '@sokharatana',
    answers: [
      {
        questionId: 'quiz_lumimei_products',
        questionNum: 1,
        questionText: '១. Lumimei មានផលិតផលអ្វីខ្លះ?',
        answer: 'Lumimei Clay Mask, សេរ៉ូមបន្តឹងស្បែក, ប្រេងដូងធម្មជាតិ, សាប៊ូរុក្ខជាតិ, ខ្មៅដៃគូសចិញ្ចើម',
      },
      {
        questionId: 'quiz_lumimei_clay_mask',
        questionNum: 2,
        questionText: '២. Lumimei Clay Mask មានអត្ថប្រយោជន៍អ្វីខ្លះ?',
        answer: 'ជួយសម្អាតជាតិពុលក្នុងស្បែក បង្រួមរន្ធញើស និងកាត់បន្ថយមុនក្បាលខ្មៅ',
      },
      {
        questionId: 'quiz_lumimei_serum',
        questionNum: 3,
        questionText: '៣. Lumimei សេរ៉ូម មានអត្ថប្រយោជន៍អ្វីខ្លះ?',
        answer: 'ជួយបំប៉នស្បែកមុខឱ្យភ្លឺថ្លា បំបាត់ស្នាមអុចខ្មៅ និងផ្តល់សំណើមជ្រៅ',
      },
    ],
    totalQuestions: 3,
    status: 'pending',
    pointsAwarded: 30,
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'quiz_sub_sample_002',
    userId: 'user_bopha_02',
    customerName: 'ចាន់ បុប្ផា (Chan Bopha)',
    customerPhone: '096 778 8123',
    telegram: '@bophachan',
    answers: [
      {
        questionId: 'quiz_lumimei_origin_country',
        questionNum: 6,
        questionText: '៦. Lumimei ជាផលិតផលរបស់ប្រទេសណា?',
        answer: 'ប្រទេសកម្ពុជា (Cambodia) ផលិតចេញពីរុក្ខជាតិធម្មជាតិក្នុងស្រុក ១០០%',
      },
      {
        questionId: 'quiz_lumimei_soap',
        questionNum: 5,
        questionText: '៥. Lumimei សាប៊ូ មានអត្ថប្រយោជន៍អ្វីខ្លះ?',
        answer: 'ជម្រុះកោសិកាចាស់ៗ កម្ចាត់បាក់តេរីបង្កមុន និងជួយឱ្យស្បែកទន់ម៉ត់',
      },
    ],
    totalQuestions: 2,
    status: 'pending',
    pointsAwarded: 20,
    submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'quiz_sub_sample_003',
    userId: 'user_dara_03',
    customerName: 'ម៉េង ដារ៉ា (Meng Dara)',
    customerPhone: '088 665 5443',
    telegram: '@mengdara',
    answers: [
      {
        questionId: 'quiz_lumimei_coconut_oil',
        questionNum: 4,
        questionText: '៤. Lumimei ប្រេងដូង មានអត្ថប្រយោជន៍អ្វីខ្លះ?',
        answer: 'ផ្តល់សំណើមដល់ស្បែកមុខស្ងួត និងប្រើសម្រាប់លាងសម្អាតគ្រឿងសម្អាង makeup remover',
      },
    ],
    totalQuestions: 1,
    status: 'verified',
    pointsAwarded: 10,
    submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    verifiedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    verifiedBy: 'Admin Lumimei',
  },
];

// Helper to get local stored submissions
export function getLocalQuizSubmissions(): QuizSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const deletedIds: string[] = JSON.parse(localStorage.getItem('lumimei_deleted_quiz_ids') || '[]');

    if (!raw) {
      const initial = INITIAL_SAMPLE_SUBMISSIONS.filter((s) => !deletedIds.includes(s.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    let list = JSON.parse(raw);
    if (!Array.isArray(list)) list = INITIAL_SAMPLE_SUBMISSIONS;

    // Filter out deleted IDs and temporary pending submissions
    const cleaned = list.filter(
      (s: QuizSubmission) =>
        !deletedIds.includes(s.id) &&
        !(s.customerName === 'អតិថិជន Lumimei' && s.status === 'pending')
    );
    if (cleaned.length !== list.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      list = cleaned;
    }

    return list;
  } catch (err) {
    console.warn('Error reading local quiz submissions:', err);
    return INITIAL_SAMPLE_SUBMISSIONS;
  }
}

// Helper to save local stored submissions
export function saveLocalQuizSubmissions(submissions: QuizSubmission[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
    window.dispatchEvent(new CustomEvent('quiz_submissions_updated', { detail: submissions }));
  } catch (err) {
    console.warn('Error saving local quiz submissions:', err);
  }
}

/**
 * Check if customer's answer to a quiz question is correct
 */
export function isQuizAnswerCorrect(questionId: string, rawAnswer: string): boolean {
  if (!rawAnswer || rawAnswer.trim().length < 2) return false;
  const ans = rawAnswer.toLowerCase().trim();

  switch (questionId) {
    case 'quiz_lumimei_products':
      // Q1: Lumimei មានផលិតផលអ្វីខ្លះ?
      const productKeywords = [
        'clay mask', 'claymask', 'mask', 'ម៉ាស', 'ភក់', 'សេរ៉ូម', 'serum',
        'ប្រេងដូង', 'coconut', 'សាប៊ូ', 'soap', 'ខ្មៅដៃ', 'eyebrow',
        'ផលិតផល', 'ធម្មជាតិ', 'skincare', 'ថែរក្សាស្បែក'
      ];
      return productKeywords.some((kw) => ans.includes(kw));

    case 'quiz_lumimei_clay_mask':
      // Q2: Lumimei Clay Mask មានអត្ថប្រយោជន៍អ្វីខ្លះ?
      const clayKeywords = [
        'មុន', 'acne', 'pimple', 'រន្ធញើស', 'pore', 'សម្អាត', 'clean',
        'បន្សុទ្ធ', 'detox', 'ខ្លាញ់', 'oil', 'កោសិកា', 'ក្បាលខ្មៅ', 'blackhead',
        'ស្បែក', 'បឺតជាតិពុល', 'ជាតិពុល', 'ទន់', 'ភ្លឺ', 'រលោង'
      ];
      return clayKeywords.some((kw) => ans.includes(kw));

    case 'quiz_lumimei_serum':
      // Q3: Lumimei សេរ៉ូម មានអត្ថប្រយោជន៍អ្វីខ្លះ?
      const serumKeywords = [
        'ភ្លឺ', 'ថ្លា', 'bright', 'glow', 'សំណើម', 'moistur', 'hydrat',
        'ស្នាម', 'spot', 'បំប៉ន', 'nourish', 'បន្តឹង', 'ជ្រួញ', 'wrinkle',
        'ស ស្បែក', 'សស្បែក', 'ស្រស់ថ្លា', 'ស្បែកមុខ', 'ទន់'
      ];
      return serumKeywords.some((kw) => ans.includes(kw));

    case 'quiz_lumimei_coconut_oil':
      // Q4: Lumimei ប្រេងដូង មានអត្ថប្រយោជន៍អ្វីខ្លះ?
      const coconutKeywords = [
        'សំណើម', 'moistur', 'ស្ងួត', 'dry', 'គ្រឿងសម្អាង', 'makeup',
        'លាង', 'clean', 'remove', 'សក់', 'hair', 'រលោង', 'ធម្មជាតិ',
        'natural', 'ទន់', 'បំប៉ន', 'ស្បែក', 'ភ្នែក', 'មាត់'
      ];
      return coconutKeywords.some((kw) => ans.includes(kw));

    case 'quiz_lumimei_soap':
      // Q5: Lumimei សាប៊ូ មានអត្ថប្រយោជន៍អ្វីខ្លះ?
      const soapKeywords = [
        'សម្អាត', 'clean', 'បាក់តេរី', 'bacteria', 'មុន', 'acne',
        'កោសិកា', 'ទន់', 'soft', 'ម៉ត់', 'រលោង', 'smooth', 'ក្លិន',
        'រុក្ខជាតិ', 'herb', 'ធម្មជាតិ', 'លាងមុខ', 'ជាតិពុល'
      ];
      return soapKeywords.some((kw) => ans.includes(kw));

    case 'quiz_lumimei_origin_country':
      // Q6: Lumimei ជាផលិតផលរបស់ប្រទេសណា?
      const countryKeywords = [
        'កម្ពុជា', 'ខ្មែរ', 'cambodia', 'khmer', 'ស្រុកខ្មែរ', 'ប្រទេសកម្ពុជា', 'kh', 'cambodian'
      ];
      return countryKeywords.some((kw) => ans.includes(kw));

    default:
      return ans.length >= 3;
  }
}

/**
 * Universal helper: Award points to customer user account across all storage layers
 */
export async function awardPointsToCustomer(
  userId: string,
  customerPhone: string,
  pointsToAdd: number,
  _reason: string = 'Quiz Points'
): Promise<number> {
  if (pointsToAdd <= 0) return 0;

  // 1. Update guest points cache
  const currentGuest = Number(localStorage.getItem('lumimei_guest_points') || '15');
  const nextGuest = currentGuest + pointsToAdd;
  localStorage.setItem('lumimei_guest_points', nextGuest.toString());

  // 2. Update user profile in app_users and mock_users
  const appUsers = getMockUsers();
  let updatedPoints = nextGuest;

  const userIndex = appUsers.findIndex(
    (u) =>
      (userId && (u.uid === userId || (u as any).id === userId)) ||
      (customerPhone && (u.phoneNumber === customerPhone || (u as any).phone === customerPhone))
  );

  if (userIndex !== -1) {
    const cur = Number(appUsers[userIndex].points);
    const basePts = isNaN(cur) || cur === 0 ? 15 : cur;
    appUsers[userIndex].points = basePts + pointsToAdd;
    updatedPoints = appUsers[userIndex].points;
    saveMockUser(appUsers[userIndex], false);

    // 3. Dual-write to Firestore user document
    const targetUid = appUsers[userIndex].uid || userId;
    if (targetUid && targetUid !== 'guest') {
      try {
        const userRef = doc(db, 'users', targetUid);
        setDoc(userRef, { points: updatedPoints, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
      } catch (err) {
        console.warn('Failed to sync points to Firestore user:', err);
      }
    }
  }

  // 4. Dispatch global events so UI re-renders immediately
  window.dispatchEvent(new Event('pointsUpdated'));
  window.dispatchEvent(
    new CustomEvent('app_users_updated', {
      detail: userIndex !== -1 ? appUsers[userIndex] : null,
    })
  );

  return updatedPoints;
}

/**
 * Submit Quiz Answers from customer
 * Automatically evaluates answers and adds points to customer account for correct answers!
 */
export async function submitCustomerQuizAnswers(params: {
  userId: string;
  customerName: string;
  customerPhone: string;
  telegram?: string;
  answers: QuizSubmissionAnswer[];
}): Promise<QuizSubmission> {
  const subId = `quiz_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // Evaluate each answer for correctness
  const answersWithCheck: QuizSubmissionAnswer[] = params.answers.map((ans) => {
    const isCorrect = isQuizAnswerCorrect(ans.questionId, ans.answer);
    if (isCorrect) {
      return {
        ...ans,
        status: 'verified' as const,
        verifiedAt: now,
        verifiedBy: 'Auto System (ចម្លើយត្រឹមត្រូវ)',
      };
    }
    return {
      ...ans,
      status: 'pending' as const,
    };
  });

  const verifiedCount = answersWithCheck.filter((a) => a.status === 'verified').length;
  const allVerified = verifiedCount === answersWithCheck.length && answersWithCheck.length > 0;

  const submission: QuizSubmission = {
    id: subId,
    userId: params.userId || 'guest',
    customerName: params.customerName || 'អតិថិជន Lumimei',
    customerPhone: params.customerPhone || 'មិនបានបញ្ជាក់',
    telegram: params.telegram || '',
    answers: answersWithCheck,
    totalQuestions: answersWithCheck.length,
    status: allVerified ? 'verified' : 'pending',
    pointsAwarded: answersWithCheck.length * 10, // 10 pts per question
    submittedAt: now,
    verifiedAt: allVerified ? now : undefined,
    verifiedBy: allVerified ? 'Auto System (ចម្លើយត្រឹមត្រូវ)' : undefined,
  };

  // 1. Save to localStorage immediately for instant feedback
  const existing = getLocalQuizSubmissions();
  const updated = [submission, ...existing.filter((s) => s.id !== subId)];
  saveLocalQuizSubmissions(updated);

  // 2. Try saving to Firestore collection 'quiz_submissions'
  try {
    const docRef = doc(db, 'quiz_submissions', subId);
    await setDoc(docRef, {
      ...submission,
      createdAtServer: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firestore quiz_submissions setDoc fallback (using local):', err);
  }

  // 3. If any answer was correct, immediately add points to the customer's account!
  if (verifiedCount > 0) {
    const pointsToCredit = verifiedCount * 10;
    await awardPointsToCustomer(
      params.userId,
      params.customerPhone,
      pointsToCredit,
      'ឆ្លើយសំនួរត្រឹមត្រូវ (+10/សំនួរ)'
    );
  }

  // 4. Update customer's answered records, pending questions map, and answered IDs
  try {
    const uid = params.userId || 'guest';
    const pendingQuestionsMap = JSON.parse(
      localStorage.getItem(`lumimei_quiz_pending_questions_${uid}`) ||
      localStorage.getItem('lumimei_quiz_pending_questions') ||
      '{}'
    );
    const onceList: string[] = JSON.parse(
      localStorage.getItem(`lumimei_quiz_answered_once_ids_${uid}`) ||
      localStorage.getItem('lumimei_quiz_answered_once_ids') ||
      '[]'
    );
    const answeredList: string[] = JSON.parse(
      localStorage.getItem(`lumimei_quiz_answered_ids_${uid}`) ||
      localStorage.getItem('lumimei_quiz_answered_ids') ||
      '[]'
    );

    const newAnsweredIds = params.answers.map((a) => a.questionId);
    const nextOnceList = Array.from(new Set([...onceList, ...newAnsweredIds]));
    const newlyVerifiedIds = answersWithCheck
      .filter((a) => a.status === 'verified')
      .map((a) => a.questionId);
    const nextAnsweredList = Array.from(new Set([...answeredList, ...newlyVerifiedIds]));

    answersWithCheck.forEach((ans) => {
      pendingQuestionsMap[ans.questionId] = {
        subId,
        answer: ans.answer,
        status: ans.status || 'pending',
        submittedAt: now,
        verifiedAt: ans.verifiedAt,
        verifiedBy: ans.verifiedBy,
      };
    });

    localStorage.setItem(`lumimei_quiz_pending_questions_${uid}`, JSON.stringify(pendingQuestionsMap));
    localStorage.setItem('lumimei_quiz_pending_questions', JSON.stringify(pendingQuestionsMap));
    localStorage.setItem(`lumimei_quiz_answered_once_ids_${uid}`, JSON.stringify(nextOnceList));
    localStorage.setItem('lumimei_quiz_answered_once_ids', JSON.stringify(nextOnceList));
    localStorage.setItem(`lumimei_quiz_answered_ids_${uid}`, JSON.stringify(nextAnsweredList));
    localStorage.setItem('lumimei_quiz_answered_ids', JSON.stringify(nextAnsweredList));

    // If all 6 questions are now answered and verified, mark task-quiz-game completed
    if (nextAnsweredList.length >= 6) {
      try {
        const completedMissions = JSON.parse(localStorage.getItem('lumimei_completed_mission_tasks') || '[]');
        const nextCompletedMissions = Array.from(new Set([...completedMissions, 'task-quiz-game']));
        localStorage.setItem('lumimei_completed_mission_tasks', JSON.stringify(nextCompletedMissions));
      } catch {}
    }

    window.dispatchEvent(new CustomEvent('quiz_pending_questions_updated'));
    window.dispatchEvent(new Event('pointsUpdated'));
  } catch (e) {
    // Ignore
  }

  return submission;
}

/**
 * Customer Action: Submit Screenshot Proof for Photo Missions (e.g. Follow Facebook Page)
 */
export async function submitPhotoTaskVerification(params: {
  userId: string;
  customerName: string;
  customerPhone?: string;
  telegram?: string;
  taskId: string;
  taskTitle: string;
  points: number;
  screenshot: string;
}): Promise<QuizSubmission> {
  const subId = `photo_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const submission: QuizSubmission = {
    id: subId,
    userId: params.userId || 'guest',
    customerName: params.customerName || 'អតិថិជន Lumimei',
    customerPhone: params.customerPhone || 'មិនបានបញ្ជាក់',
    telegram: params.telegram || '',
    taskType: 'photo_task',
    taskId: params.taskId,
    taskTitle: params.taskTitle,
    screenshot: params.screenshot,
    answers: [
      {
        questionId: params.taskId,
        questionNum: 1,
        questionText: params.taskTitle,
        answer: 'រូបភាព Screenshot Upload បញ្ជាក់ការ Follow Facebook Page',
      },
    ],
    totalQuestions: 1,
    status: 'pending',
    pointsAwarded: params.points || 10,
    submittedAt: new Date().toISOString(),
  };

  const existing = getLocalQuizSubmissions();
  const updated = [submission, ...existing.filter((s) => s.id !== subId)];
  saveLocalQuizSubmissions(updated);

  try {
    const docRef = doc(db, 'quiz_submissions', subId);
    await setDoc(docRef, {
      ...submission,
      createdAtServer: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firestore photo task setDoc fallback (using local):', err);
  }

  return submission;
}

/**
 * Real-time Subscription to all Quiz Submissions
 */
export function subscribeToQuizSubmissions(
  callback: (submissions: QuizSubmission[]) => void
): () => void {
  let unsubscribeFirestore: (() => void) | null = null;

  // 1. Initial load from local
  callback(getLocalQuizSubmissions());

  // 2. Subscribe to Firestore if available
  try {
    const colRef = collection(db, 'quiz_submissions');
    unsubscribeFirestore = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const fsSubmissions: QuizSubmission[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as any;
            fsSubmissions.push({
              id: docSnap.id,
              userId: data.userId || 'guest',
              customerName: data.customerName || 'អតិថិជន',
              customerPhone: data.customerPhone || '',
              telegram: data.telegram || '',
              answers: Array.isArray(data.answers) ? data.answers : [],
              totalQuestions: data.totalQuestions || (data.answers ? data.answers.length : 0),
              status: data.status || 'pending',
              pointsAwarded: data.pointsAwarded ?? 1,
              submittedAt: data.submittedAt || new Date().toISOString(),
              verifiedAt: data.verifiedAt,
              verifiedBy: data.verifiedBy,
              rejectionReason: data.rejectionReason,
            });
          });

          // Merge with local sample data to guarantee no loss
          const localList = getLocalQuizSubmissions();
          const deletedIds: string[] = JSON.parse(localStorage.getItem('lumimei_deleted_quiz_ids') || '[]');
          const mergedMap = new Map<string, QuizSubmission>();
          localList.forEach((s) => {
            if (!deletedIds.includes(s.id)) mergedMap.set(s.id, s);
          });
          fsSubmissions.forEach((s) => {
            if (!deletedIds.includes(s.id)) mergedMap.set(s.id, s);
          });

          const sorted = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          );

          saveLocalQuizSubmissions(sorted);
          callback(sorted);
        }
      },
      (error) => {
        console.warn('Firestore quiz_submissions onSnapshot warning:', error);
      }
    );
  } catch (err) {
    console.warn('Firestore setup error in quiz submissions:', err);
  }

  // 3. Listen to local custom event
  const handleLocalUpdate = (e: any) => {
    if (e.detail && Array.isArray(e.detail)) {
      callback(e.detail);
    } else {
      callback(getLocalQuizSubmissions());
    }
  };
  window.addEventListener('quiz_submissions_updated', handleLocalUpdate);

  return () => {
    if (unsubscribeFirestore) unsubscribeFirestore();
    window.removeEventListener('quiz_submissions_updated', handleLocalUpdate);
  };
}

/**
 * Admin Action: Verify & Award Points
 */
export async function verifyQuizSubmission(
  submissionId: string,
  adminName: string = 'Admin Lumimei'
): Promise<boolean> {
  const all = getLocalQuizSubmissions();
  const sub = all.find((s) => s.id === submissionId);
  if (!sub) return false;

  const pointsToAdd = sub.pointsAwarded !== undefined ? sub.pointsAwarded : (sub.answers?.length ? sub.answers.length * 10 : 10);
  const verifiedDate = new Date().toISOString();

  // 1. Update submission record
  sub.status = 'verified';
  sub.verifiedAt = verifiedDate;
  sub.verifiedBy = adminName;

  saveLocalQuizSubmissions([...all]);

  // 2. Try Firestore update
  try {
    const docRef = doc(db, 'quiz_submissions', submissionId);
    await updateDoc(docRef, {
      status: 'verified',
      verifiedAt: verifiedDate,
      verifiedBy: adminName,
    });
  } catch (err) {
    console.warn('Firestore updateDoc verify error:', err);
  }

  // 3. Award Points to customer user account (Firestore + localStorage)
  try {
    await awardPointsToCustomer(
      sub.userId,
      sub.customerPhone,
      pointsToAdd,
      'Admin Verified Quiz Submission'
    );

    // C. Update answered ids so customer sees verified state
    const uid = sub.userId || 'guest';
    const answered = JSON.parse(
      localStorage.getItem(`lumimei_quiz_answered_ids_${uid}`) ||
      localStorage.getItem('lumimei_quiz_answered_ids') ||
      '[]'
    );
    const qIds = sub.answers.map((a) => a.questionId);
    const newAnswered = Array.from(new Set([...answered, ...qIds]));
    localStorage.setItem(`lumimei_quiz_answered_ids_${uid}`, JSON.stringify(newAnswered));
    localStorage.setItem('lumimei_quiz_answered_ids', JSON.stringify(newAnswered));

    // Update pending questions map
    const pendingQuestionsMap = JSON.parse(
      localStorage.getItem(`lumimei_quiz_pending_questions_${uid}`) ||
      localStorage.getItem('lumimei_quiz_pending_questions') ||
      '{}'
    );
    sub.answers.forEach((ans) => {
      pendingQuestionsMap[ans.questionId] = {
        subId: sub.id,
        answer: ans.answer,
        status: 'verified',
        verifiedAt: verifiedDate,
      };
    });
    localStorage.setItem(`lumimei_quiz_pending_questions_${uid}`, JSON.stringify(pendingQuestionsMap));
    localStorage.setItem('lumimei_quiz_pending_questions', JSON.stringify(pendingQuestionsMap));

    // D. If this is a photo mission task, mark mission task completed
    if (sub.taskId) {
      try {
        const completed = JSON.parse(localStorage.getItem('lumimei_completed_mission_tasks') || '[]');
        const nextCompleted = Array.from(new Set([...completed, sub.taskId]));
        localStorage.setItem('lumimei_completed_mission_tasks', JSON.stringify(nextCompleted));

        const pendingTasks = JSON.parse(localStorage.getItem('lumimei_pending_review_tasks') || '[]');
        const nextPending = pendingTasks.filter((id: string) => id !== sub.taskId);
        localStorage.setItem('lumimei_pending_review_tasks', JSON.stringify(nextPending));
      } catch {
        // ignore
      }
    }

    // Dispatch global events
    window.dispatchEvent(new Event('pointsUpdated'));
    window.dispatchEvent(new CustomEvent('quiz_pending_questions_updated'));
  } catch (err) {
    console.warn('Award points error during verify:', err);
  }

  return true;
}

/**
 * Admin Action: Reject submission
 */
export async function rejectQuizSubmission(
  submissionId: string,
  reason: string = 'ចម្លើយមិនទាន់ត្រឹមត្រូវ',
  adminName: string = 'Admin Lumimei'
): Promise<boolean> {
  const all = getLocalQuizSubmissions();
  const sub = all.find((s) => s.id === submissionId);
  if (!sub) return false;

  sub.status = 'rejected';
  sub.rejectionReason = reason;
  sub.verifiedAt = new Date().toISOString();
  sub.verifiedBy = adminName;

  saveLocalQuizSubmissions([...all]);

  try {
    const docRef = doc(db, 'quiz_submissions', submissionId);
    await updateDoc(docRef, {
      status: 'rejected',
      rejectionReason: reason,
      verifiedAt: new Date().toISOString(),
      verifiedBy: adminName,
    });
  } catch (err) {
    console.warn('Firestore updateDoc reject error:', err);
  }

  // Update pending questions map so customer can re-submit
  try {
    const uid = sub.userId || 'guest';
    const pendingQuestionsMap = JSON.parse(
      localStorage.getItem(`lumimei_quiz_pending_questions_${uid}`) ||
      localStorage.getItem('lumimei_quiz_pending_questions') ||
      '{}'
    );
    sub.answers.forEach((ans) => {
      pendingQuestionsMap[ans.questionId] = {
        subId: sub.id,
        answer: ans.answer,
        status: 'rejected',
        reason,
      };
    });
    localStorage.setItem(`lumimei_quiz_pending_questions_${uid}`, JSON.stringify(pendingQuestionsMap));
    localStorage.setItem('lumimei_quiz_pending_questions', JSON.stringify(pendingQuestionsMap));
    window.dispatchEvent(new CustomEvent('quiz_pending_questions_updated'));
  } catch (e) {
    // Ignore
  }

  return true;
}

/**
 * Admin Action: Delete submission
 */
export async function deleteQuizSubmission(submissionId: string): Promise<boolean> {
  try {
    const deletedIds: string[] = JSON.parse(localStorage.getItem('lumimei_deleted_quiz_ids') || '[]');
    if (!deletedIds.includes(submissionId)) {
      deletedIds.push(submissionId);
      localStorage.setItem('lumimei_deleted_quiz_ids', JSON.stringify(deletedIds));
    }
  } catch {
    // ignore
  }

  const all = getLocalQuizSubmissions();
  const filtered = all.filter((s) => s.id !== submissionId);
  saveLocalQuizSubmissions(filtered);

  try {
    const docRef = doc(db, 'quiz_submissions', submissionId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore deleteDoc error:', err);
  }

  return true;
}

/**
 * Admin Action: Verify an individual Question Answer and award its points (+10)
 */
export async function verifySingleQuestionAnswer(
  submissionId: string,
  questionId: string,
  adminName: string = 'Admin Lumimei',
  pointsToAward: number = 10
): Promise<boolean> {
  const all = getLocalQuizSubmissions();
  const sub = all.find((s) => s.id === submissionId);
  if (!sub) return false;

  const verifiedDate = new Date().toISOString();

  if (Array.isArray(sub.answers)) {
    const targetAns = sub.answers.find(
      (a) => a.questionId === questionId || String(a.questionNum) === questionId
    );
    if (targetAns) {
      targetAns.status = 'verified';
      targetAns.verifiedAt = verifiedDate;
      targetAns.verifiedBy = adminName;
    }
    const allVerified = sub.answers.every((a) => a.status === 'verified');
    if (allVerified) {
      sub.status = 'verified';
      sub.verifiedAt = verifiedDate;
      sub.verifiedBy = adminName;
    }
  } else {
    sub.status = 'verified';
    sub.verifiedAt = verifiedDate;
    sub.verifiedBy = adminName;
  }

  saveLocalQuizSubmissions([...all]);

  try {
    const docRef = doc(db, 'quiz_submissions', submissionId);
    await updateDoc(docRef, {
      answers: sub.answers,
      status: sub.status,
      verifiedAt: verifiedDate,
      verifiedBy: adminName,
    });
  } catch (err) {
    console.warn('Firestore updateDoc verifySingleQuestionAnswer error:', err);
  }

  try {
    await awardPointsToCustomer(
      sub.userId,
      sub.customerPhone,
      pointsToAward,
      'Admin Verified Question Answer (+10)'
    );

    const uid = sub.userId || 'guest';
    const answered = JSON.parse(
      localStorage.getItem(`lumimei_quiz_answered_ids_${uid}`) ||
      localStorage.getItem('lumimei_quiz_answered_ids') ||
      '[]'
    );
    const newAnswered = Array.from(new Set([...answered, questionId]));
    localStorage.setItem(`lumimei_quiz_answered_ids_${uid}`, JSON.stringify(newAnswered));
    localStorage.setItem('lumimei_quiz_answered_ids', JSON.stringify(newAnswered));

    const pendingQuestionsMap = JSON.parse(
      localStorage.getItem(`lumimei_quiz_pending_questions_${uid}`) ||
      localStorage.getItem('lumimei_quiz_pending_questions') ||
      '{}'
    );
    const ansObj = sub.answers?.find(
      (a) => a.questionId === questionId || String(a.questionNum) === questionId
    );
    pendingQuestionsMap[questionId] = {
      subId: sub.id,
      answer: ansObj?.answer || '',
      status: 'verified',
      verifiedAt: verifiedDate,
    };
    localStorage.setItem(`lumimei_quiz_pending_questions_${uid}`, JSON.stringify(pendingQuestionsMap));
    localStorage.setItem('lumimei_quiz_pending_questions', JSON.stringify(pendingQuestionsMap));

    window.dispatchEvent(new Event('pointsUpdated'));
    window.dispatchEvent(new CustomEvent('quiz_pending_questions_updated'));
    window.dispatchEvent(new CustomEvent('quiz_submissions_updated', { detail: [...all] }));
  } catch (err) {
    console.warn('Award points error during question verify:', err);
  }

  return true;
}

/**
 * Admin Action: Reject an individual Question Answer
 */
export async function rejectSingleQuestionAnswer(
  submissionId: string,
  questionId: string,
  reason: string = 'ចម្លើយមិនទាន់ត្រឹមត្រូវ',
  adminName: string = 'Admin Lumimei'
): Promise<boolean> {
  const all = getLocalQuizSubmissions();
  const sub = all.find((s) => s.id === submissionId);
  if (!sub) return false;

  const verifiedDate = new Date().toISOString();

  if (Array.isArray(sub.answers)) {
    const targetAns = sub.answers.find(
      (a) => a.questionId === questionId || String(a.questionNum) === questionId
    );
    if (targetAns) {
      targetAns.status = 'rejected';
      targetAns.rejectionReason = reason;
      targetAns.verifiedAt = verifiedDate;
      targetAns.verifiedBy = adminName;
    }
  }

  saveLocalQuizSubmissions([...all]);

  try {
    const docRef = doc(db, 'quiz_submissions', submissionId);
    await updateDoc(docRef, {
      answers: sub.answers,
    });
  } catch (err) {
    console.warn('Firestore updateDoc rejectSingleQuestionAnswer error:', err);
  }

  try {
    const uid = sub.userId || 'guest';
    const pendingQuestionsMap = JSON.parse(
      localStorage.getItem(`lumimei_quiz_pending_questions_${uid}`) ||
      localStorage.getItem('lumimei_quiz_pending_questions') ||
      '{}'
    );
    const ansObj = sub.answers?.find(
      (a) => a.questionId === questionId || String(a.questionNum) === questionId
    );
    pendingQuestionsMap[questionId] = {
      subId: sub.id,
      answer: ansObj?.answer || '',
      status: 'rejected',
      reason,
    };
    localStorage.setItem(`lumimei_quiz_pending_questions_${uid}`, JSON.stringify(pendingQuestionsMap));
    localStorage.setItem('lumimei_quiz_pending_questions', JSON.stringify(pendingQuestionsMap));
    window.dispatchEvent(new CustomEvent('quiz_pending_questions_updated'));
    window.dispatchEvent(new CustomEvent('quiz_submissions_updated', { detail: [...all] }));
  } catch (err) {
    console.warn('Reject error during question reject:', err);
  }

  return true;
}
