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
import { db } from './firebase';

export interface QuizSubmissionAnswer {
  questionId: string;
  questionNum: number;
  questionText: string;
  answer: string;
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
 * Submit Quiz Answers from customer
 */
export async function submitCustomerQuizAnswers(params: {
  userId: string;
  customerName: string;
  customerPhone: string;
  telegram?: string;
  answers: QuizSubmissionAnswer[];
}): Promise<QuizSubmission> {
  const subId = `quiz_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const submission: QuizSubmission = {
    id: subId,
    userId: params.userId || 'guest',
    customerName: params.customerName || 'អតិថិជន Lumimei',
    customerPhone: params.customerPhone || 'មិនបានបញ្ជាក់',
    telegram: params.telegram || '',
    answers: params.answers,
    totalQuestions: params.answers.length,
    status: 'pending',
    pointsAwarded: params.answers.length * 10, // 10 pts per question (每答对一题获得 10分)
    submittedAt: new Date().toISOString(),
  };

  // 1. Save to localStorage immediately for instant feedback
  const existing = getLocalQuizSubmissions();
  // Filter out older pending submissions from same user with same questions to update smoothly
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

  // 3. Mark customer answered questions in localStorage as submitted
  try {
    const pendingQuestionsMap = JSON.parse(localStorage.getItem('lumimei_quiz_pending_questions') || '{}');
    params.answers.forEach((ans) => {
      pendingQuestionsMap[ans.questionId] = {
        subId,
        answer: ans.answer,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };
    });
    localStorage.setItem('lumimei_quiz_pending_questions', JSON.stringify(pendingQuestionsMap));
    window.dispatchEvent(new CustomEvent('quiz_pending_questions_updated'));
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
    // A. Update local app_users
    const rawUsers = localStorage.getItem('app_users') || localStorage.getItem('mock_users');
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      const userIndex = users.findIndex(
        (u: any) =>
          u.id === sub.userId ||
          u.uid === sub.userId ||
          (sub.customerPhone && (u.phone === sub.customerPhone || u.phoneNumber === sub.customerPhone))
      );
      if (userIndex !== -1) {
        const prevPoints = Number(users[userIndex].points) || 0;
        users[userIndex].points = prevPoints + pointsToAdd;
        localStorage.setItem('app_users', JSON.stringify(users));
        window.dispatchEvent(new CustomEvent('app_users_updated'));
      }
    }

    // B. Also update current logged-in guest / active user points
    const currentGuest = Number(localStorage.getItem('lumimei_guest_points') || '0');
    localStorage.setItem('lumimei_guest_points', (currentGuest + pointsToAdd).toString());

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
