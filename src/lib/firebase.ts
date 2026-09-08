import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import {
  getAuth,
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential,
  signInAnonymously,
  updatePhoneNumber,
  deleteUser,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

export const FIRESTORE_DATABASE_ID = "ai-studio-lumimei-7c9bf061-363f-4616-997f-7ddb5ae1f0b3";

const firebaseConfig = {
  apiKey: "AIzaSyAGwPXfVGV7NQ7Q3T-PsURFUB-GIwWiyfk",
  authDomain: "lumimei-production-168.firebaseapp.com",
  projectId: "lumimei-production-168",
  storageBucket: "lumimei-production-168.firebasestorage.app",
  messagingSenderId: "89302057043",
  appId: "1:89302057043:web:5316db58223ffdf9b66f24"
};

// Re-export firebaseConfig so consumers have access to it directly
export { firebaseConfig };

// Log initialization config
console.log("Firebase 正在使用配置初始化:", firebaseConfig);
console.log("%c【项目连接诊断】当前绑定的 Firebase Project ID 为:", "color: red; font-size: 16px; font-weight: bold;", firebaseConfig.projectId);
console.log("%c【项目连接诊断】当前绑定的 Firestore Database ID 为:", "color: green; font-size: 16px; font-weight: bold;", FIRESTORE_DATABASE_ID);

// Mount to global window for runtime inspection
if (typeof window !== "undefined") {
  (window as any).firebaseConfig = firebaseConfig;
  (window as any).firestoreDatabaseId = FIRESTORE_DATABASE_ID;
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 关键：必须显式传入第二个参数 databaseId，同时开启长轮询
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, FIRESTORE_DATABASE_ID);

export const auth = getAuth(app);
try {
  auth.useDeviceLanguage();
} catch {
  // Ignore
}

export { app };
export default app;

// Helper to ensure an authenticated user identity exists (e.g. Anonymous) before Firestore writes
export async function ensureFirebaseAuth() {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
      console.log("【Firebase Auth】匿名身份挂载成功，UID:", auth.currentUser?.uid);
    } catch (err: any) {
      console.warn("【Firebase Auth】匿名登录提示:", err.message);
    }
  }
  return auth.currentUser;
}

// Export Auth and Firestore methods
export {
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential,
  signInAnonymously,
  updatePhoneNumber,
  deleteUser,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp,
  onSnapshot,
};

export interface UserProfile {
  uid: string;
  displayName: string;
  fullName?: string;
  phoneNumber: string;
  telegram?: string;
  gender?: string;
  ageRange?: string;
  passwordHash?: string;
  hasPassword?: boolean;
  preferredLanguage: 'km' | 'zh' | 'en';
  role: 'user' | 'admin' | 'superadmin';
  consentAccepted: boolean;
  consentVersion: string;
  points?: number;
  totalSpent?: number;
  tier?: 'normal' | 'vip' | 'vvip' | 'fb_top_friends' | 'diamond';
  photoURL?: string;
  skinConcerns?: string[];
  acneDetails?: string;
  isVip?: boolean;
  isVvip?: boolean;
  isFacebookTopFriend?: boolean;
  consentAcceptedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

// Simple fast SHA-256 hash helper for password verification
export async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`lumimei_pwd_salt_${password}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Simple fallback string transformation if crypto.subtle unavailable
    let hash = 0;
    const str = `lumimei_pwd_salt_${password}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }
}

// Helper to get cached users from localStorage('app_users')
export function getMockUsers(): UserProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('app_users') || localStorage.getItem('mock_users');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Helper to save a user to localStorage cache and dispatch sync events
export function saveMockUser(user: UserProfile, showAlert: boolean = false): void {
  if (typeof window === 'undefined') return;
  try {
    const appUsers = getMockUsers();
    const idx = appUsers.findIndex(
      (u) =>
        (user.uid && (u.uid === user.uid || (u as any).id === user.uid)) ||
        (user.phoneNumber && u.phoneNumber === user.phoneNumber)
    );
    const toSave: UserProfile = {
      ...user,
      createdAt: user.createdAt
        ? typeof user.createdAt === 'string'
          ? user.createdAt
          : new Date(user.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      appUsers[idx] = { ...appUsers[idx], ...toSave };
    } else {
      appUsers.unshift(toSave);
    }

    localStorage.setItem('app_users', JSON.stringify(appUsers));
    localStorage.setItem('mock_users', JSON.stringify(appUsers));
    window.dispatchEvent(new CustomEvent('app_users_updated', { detail: toSave }));
    window.dispatchEvent(new CustomEvent('mock_users_updated', { detail: toSave }));

    if (showAlert) {
      setTimeout(() => {
        alert('ចុះឈ្មោះជោគជ័យ!');
      }, 100);
    }
  } catch (e) {
    console.error('Failed to save to app_users in localStorage:', e);
  }
}

// Helper to delete a user from local cache
export function deleteMockUser(uidOrId: string): void {
  if (typeof window === 'undefined' || !uidOrId) return;
  try {
    const appUsers = getMockUsers();
    const filtered = appUsers.filter((u) => u.uid !== uidOrId && (u as any).id !== uidOrId);
    localStorage.setItem('app_users', JSON.stringify(filtered));
    localStorage.setItem('mock_users', JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('app_users_updated'));
    window.dispatchEvent(new CustomEvent('mock_users_updated'));
  } catch (e) {
    console.error('Failed to delete user from app_users in localStorage:', e);
  }
}

// Find user profile by phone number from Firestore with local cache fallback
export async function findUserByPhone(phoneNumber: string): Promise<UserProfile | null> {
  if (!phoneNumber) return null;
  const cleanPhone = phoneNumber.replace(/\s+/g, '');
  
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', cleanPhone), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data() as any;
      const profile: UserProfile = {
        uid: snapshot.docs[0].id,
        displayName: docData.displayName || docData.fullName || 'User',
        fullName: docData.fullName || docData.displayName || 'User',
        phoneNumber: docData.phoneNumber || cleanPhone,
        telegram: docData.telegram,
        gender: docData.gender,
        ageRange: docData.ageRange,
        passwordHash: docData.passwordHash,
        hasPassword: Boolean(docData.hasPassword || docData.passwordHash),
        preferredLanguage: docData.preferredLanguage || 'km',
        role: docData.role || 'user',
        consentAccepted: docData.consentAccepted ?? true,
        consentVersion: docData.consentVersion || '1.0',
        points: docData.points || 0,
        totalSpent: docData.totalSpent || 0,
        tier: docData.tier || 'normal',
        photoURL: docData.photoURL,
        skinConcerns: docData.skinConcerns || [],
        acneDetails: docData.acneDetails || '',
        createdAt: docData.createdAt,
        updatedAt: docData.updatedAt,
      };
      saveMockUser(profile, false);
      return profile;
    }
  } catch (err) {
    console.warn('Firestore findUserByPhone failed, checking local cache:', err);
  }

  const appUsers = getMockUsers();
  const found = appUsers.find((u) => u.phoneNumber === cleanPhone || u.phoneNumber === phoneNumber);
  return found || null;
}

// Find user profile by name or phone
export async function findUserByNameOrPhone(identifier: string): Promise<UserProfile | null> {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', identifier), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data() as any;
      return {
        uid: snapshot.docs[0].id,
        displayName: docData.displayName || docData.fullName || 'User',
        fullName: docData.fullName || docData.displayName || 'User',
        phoneNumber: docData.phoneNumber || identifier,
        telegram: docData.telegram,
        preferredLanguage: docData.preferredLanguage || 'km',
        role: docData.role || 'user',
        consentAccepted: docData.consentAccepted ?? true,
        consentVersion: docData.consentVersion || '1.0',
        points: docData.points || 0,
        totalSpent: docData.totalSpent || 0,
        tier: docData.tier || 'normal',
      };
    }
  } catch {
    // fallback
  }

  const appUsers = getMockUsers();
  const found = appUsers.find(
    (u) =>
      u.phoneNumber?.toLowerCase() === clean ||
      u.displayName?.toLowerCase() === clean ||
      u.fullName?.toLowerCase() === clean ||
      u.uid?.toLowerCase() === clean
  );
  return found || null;
}

// Phone Number formatting helper (E.164)
export function formatToE164(countryCode: string, rawPhone: string): string {
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  const code = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  return `${code}${digits}`;
}

// Format phone number with masking (e.g. +855 12 *** 678) to hide full phone number
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.trim();
  if (cleaned.startsWith('+855')) {
    const local = cleaned.slice(4).replace(/\s+/g, '');
    if (local.length >= 8) {
      return `+855 ${local.slice(0, 2)} *** ${local.slice(-3)}`;
    }
    if (local.length >= 4) {
      return `+855 ${local.slice(0, 2)} *** ${local.slice(-2)}`;
    }
    return `+855 ${local.slice(0, 2)}***`;
  }
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length >= 8) {
    return `${digits.slice(0, 3)} *** ${digits.slice(-3)}`;
  }
  return cleaned;
}

// Check if a phone number is already registered directly in Firestore
export async function checkPhoneNumberExists(phoneNumber: string): Promise<boolean> {
  if (!phoneNumber) return false;
  const cleanPhone = phoneNumber.replace(/\s+/g, '');
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', cleanPhone), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return true;
  } catch (err) {
    console.warn('Firestore checkPhoneNumberExists fallback:', err);
  }
  const appUsers = getMockUsers();
  return appUsers.some((u) => u.phoneNumber === cleanPhone || u.phoneNumber === phoneNumber);
}

export function getKhmerErrorMessage(errorCodeOrMessage: string): string {
  if (!errorCodeOrMessage) return 'មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្ដងទៀត។';
  const code = errorCodeOrMessage.toLowerCase();

  if (code.includes('auth/operation-not-allowed') || code.includes('sms unable to be sent')) {
    return 'សេវា SMS មិនទាន់បើកក្នុង Firebase Console ឡើយ (សូមចូលទៅកាន់ Firebase Console -> Authentication -> Settings -> SMS Region Policy ដើម្បីបើកប្រទេសកម្ពុជា +855)។';
  }
  if (code.includes('auth/invalid-phone-number')) {
    return 'លេខទូរស័ព្ទនេះមិនត្រឹមត្រូវទេ។';
  }
  if (code.includes('auth/missing-phone-number')) {
    return 'សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក។';
  }
  if (code.includes('auth/too-many-requests')) {
    return 'អ្នកបានស្នើសុំលេខកូដច្រើនដងពេក។ សូមរង់ចាំបន្តិច រួចព្យាយាមម្ដងទៀត។';
  }
  if (code.includes('auth/invalid-verification-code')) {
    return 'លេខកូដមិនត្រឹមត្រូវទេ។';
  }
  if (code.includes('auth/code-expired')) {
    return 'លេខកូដនេះបានផុតកំណត់។ សូមស្នើសុំលេខកូដថ្មី។';
  }
  if (code.includes('auth/captcha-check-failed')) {
    return 'ការផ្ទៀងផ្ទាត់ reCAPTCHA មិនបានជោគជ័យ។ សូមព្យាយាមម្ដងទៀត។';
  }
  if (code.includes('auth/unauthorized-domain') || code.includes('domain-not-allowed')) {
    return 'Domain នេះមិនទាន់បានបន្ថែមក្នុង Firebase Authorized Domains ឡើយ។';
  }
  if (code.includes('auth/user-disabled')) {
    return 'គណនីនេះត្រូវបានបិទ។';
  }
  if (code.includes('auth/requires-recent-login')) {
    return 'សូមចូលប្រើប្រាស់ម្ដងទៀត មុនពេលធ្វើការផ្លាស់ប្ដូរនេះ។';
  }

  if (code.includes('auth/popup-closed-by-user')) {
    return 'អ្នកបានបិទផ្ទាំង Login មុនពេលដំណើរការបញ្ចប់។';
  }
  if (code.includes('auth/cancelled-popup-request')) {
    return 'ដំណើរការចូលប្រើត្រូវបានលុបចោល។';
  }
  if (code.includes('auth/popup-blocked')) {
    return 'ផ្ទាំង Popup ត្រូវបានទប់ស្កាត់ដោយ Browser។ សូមអនុញ្ញាត Popup ដើម្បីចូលប្រើប្រាស់។';
  }
  if (code.includes('auth/account-exists-with-different-credential')) {
    return 'គណនីនេះមានស្រាប់ជាមួយវិធីសាស្ត្រចូលប្រើផ្សេងទៀត។';
  }

  return 'មានបញ្ហាកើតឡើងក្នុងការផ្ញើ SMS ឬផ្ទៀងផ្ទាត់។ សូមព្យាយាមម្ដងទៀត។';
}
