import { initializeApp, getApps, getApp } from "firebase/app";
import appletConfig from "../../firebase-applet-config.json";
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  getDocFromServer,
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
  initializeAuth,
  browserLocalPersistence,
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential,
  signInAnonymously,
  updatePhoneNumber,
  deleteUser,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

// Safe helper to read client-side environment variables with whitespace trimmed
const getClientEnv = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return String(import.meta.env[key]).trim();
    }
  } catch {}
  return '';
};

// Read from Environment Variables first, fallback to firebase-applet-config.json (all trimmed)
const rawApiKey = (getClientEnv('VITE_FIREBASE_API_KEY') || (appletConfig as any).apiKey || '').trim();
const rawAuthDomain = (getClientEnv('VITE_FIREBASE_AUTH_DOMAIN') || (appletConfig as any).authDomain || 'lumimei-production-168.firebaseapp.com').trim();
const rawProjectId = (getClientEnv('VITE_FIREBASE_PROJECT_ID') || (appletConfig as any).projectId || 'lumimei-production-168').trim();
const rawStorageBucket = (getClientEnv('VITE_FIREBASE_STORAGE_BUCKET') || (appletConfig as any).storageBucket || 'lumimei-production-168.firebasestorage.app').trim();
const rawMessagingSenderId = (getClientEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || (appletConfig as any).messagingSenderId || '89302057043').trim();
const rawAppId = (getClientEnv('VITE_FIREBASE_APP_ID') || (appletConfig as any).appId || '').trim();

import {
  FIRESTORE_DB_ID,
  FIRESTORE_DATABASE_ID,
  FIREBASE_PROJECT_ID,
  assertValidFirestoreDatabaseId,
} from './firebaseConfig';

export {
  FIRESTORE_DB_ID,
  FIRESTORE_DATABASE_ID,
  FIREBASE_PROJECT_ID,
  assertValidFirestoreDatabaseId,
};

// 严禁使用 "default" 或空值，经由 assertValidFirestoreDatabaseId 强校验
export const firestoreDatabaseId = assertValidFirestoreDatabaseId(FIRESTORE_DB_ID);

const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: rawAuthDomain,
  projectId: rawProjectId || FIREBASE_PROJECT_ID,
  storageBucket: rawStorageBucket,
  messagingSenderId: rawMessagingSenderId,
  appId: rawAppId,
};

// Re-export firebaseConfig so consumers have access to it directly
export { firebaseConfig };

// Diagnostic check for API key
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_') || firebaseConfig.apiKey.includes('PLACEHOLDER')) {
  console.error("【Firebase 严重警告】Firebase apiKey 无效或未设置！请在 firebase-applet-config.json 或 VITE_FIREBASE_API_KEY 中填写真实的 Web API Key。当前 apiKey:", firebaseConfig.apiKey);
} else {
  console.log("【Firebase 配置诊断】已成功加载有效 Firebase Web API Key (长度:", firebaseConfig.apiKey.length, ")，前缀:", firebaseConfig.apiKey.slice(0, 8) + '...');
}

// Mount to global window for runtime inspection
if (typeof window !== "undefined") {
  (window as any).firebaseConfig = firebaseConfig;
  (window as any).firestoreDatabaseId = FIRESTORE_DATABASE_ID;
  (window as any).FIRESTORE_DB_ID = FIRESTORE_DB_ID;
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 1. 初始化 Firestore 并绑定命名数据库 (启用 Long-Polling 与 MemoryLocalCache 杜绝 IndexedDB 锁定和 Database is closing 错误)
const validatedDbId = assertValidFirestoreDatabaseId(FIRESTORE_DB_ID);
let firestoreInstance: ReturnType<typeof getFirestore>;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: memoryLocalCache(),
  }, validatedDbId);
} catch {
  firestoreInstance = getFirestore(app, validatedDbId);
}

export const db = firestoreInstance;
const actualDatabaseId = (db as any)._databaseId?.database || validatedDbId;
console.log(
  `%c【Firestore 核心安全校验通过】已锁定命名数据库: ${actualDatabaseId}`,
  'color: #059669; font-weight: bold; font-size: 13px;'
);
if (typeof window !== "undefined") {
  (window as any).db = db;
}

// 2. 初始化 Firebase Auth 并使用 browserLocalPersistence (localStorage 替代 IndexedDB，彻底消灭 "Database is closing/hidden" 错误)
let authInstance: ReturnType<typeof getAuth>;
try {
  authInstance = initializeAuth(app, {
    persistence: [browserLocalPersistence],
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;
try {
  auth.useDeviceLanguage();
} catch {
  // Ignore
}

// 3. 全局拦截瞬态的 "Database is closing/hidden" 错误，确保后台切页/休眠时应用不崩溃
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const errorMsg = String(event.reason?.message || event.reason || "");
    if (
      errorMsg.includes("Database is closing") ||
      errorMsg.includes("closing/hidden") ||
      errorMsg.includes("connection is closing")
    ) {
      event.preventDefault();
      event.stopPropagation();
      console.warn("【Firebase 安全拦截】已安全过滤后台页面切换引起的数据库关闭状态:", errorMsg);
    }
  });

  window.addEventListener("error", (event) => {
    const errorMsg = String(event.error?.message || event.message || "");
    if (
      errorMsg.includes("Database is closing") ||
      errorMsg.includes("closing/hidden") ||
      errorMsg.includes("connection is closing")
    ) {
      event.preventDefault();
      event.stopPropagation();
      console.warn("【Firebase 安全拦截】已安全拦截后台窗口数据库关闭异常:", errorMsg);
    }
  });
}

// 4. Validate Connection to Firestore on startup per Firebase integration guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export { app };
export default app;

// Helper to check for existing Firebase Auth session without creating unwanted anonymous accounts
export async function ensureFirebaseAuth() {
  return auth.currentUser;
}

// Export Auth and Firestore methods
export {
  getFirestore,
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
  initialFullName?: string; // 首次创建时保存的姓名，用于登录姓名校验
  phoneNumber: string;
  telegram?: string;
  gender?: string;
  ageRange?: string;
  location?: string;
  passwordHash?: string;
  hasPassword?: boolean;
  preferredLanguage: 'km' | 'zh' | 'en';
  role: 'user' | 'admin' | 'superadmin';
  consentAccepted: boolean;
  consentVersion: string;
  points?: number;
  claimedNewCustomerBonus?: boolean;
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

// Phone Number normalization key helper (e.g. +855 12 345 678 -> 12345678, 012345678 -> 12345678)
export function normalizePhoneKey(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('855')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
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

// Helper to safely set localStorage items with quota error recovery
export function performStorageCleanup(): void {
  if (typeof window === 'undefined') return;
  try {
    // 1. Remove duplicate and obsolete keys
    localStorage.removeItem('mock_users');

    // 2. Clean large base64 photo if it exceeds reasonable size
    const photoUrl = localStorage.getItem('lumimei_user_photo_url');
    if (photoUrl && photoUrl.startsWith('data:image/') && photoUrl.length > 250000) {
      localStorage.removeItem('lumimei_user_photo_url');
    }

    // 3. Trim app_users to max 60 recent items and strip bulky base64 images
    const raw = localStorage.getItem('app_users');
    if (raw) {
      try {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const trimmed = list.slice(0, 60).map((u: any) => sanitizeUserForStorage(u));
          localStorage.setItem('app_users', JSON.stringify(trimmed));
        }
      } catch {}
    }

    // 4. Clean old answered question maps if bloated
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('lumimei_quiz_pending_questions_') || key.startsWith('lumimei_quiz_answered_ids_'))) {
        try {
          const val = localStorage.getItem(key);
          if (val && val.length > 30000) {
            localStorage.removeItem(key);
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn('Storage cleanup warning:', err);
  }
}

export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    // Quota exceeded recovery
    console.warn(`Storage quota reached on key "${key}". Running cleanup...`);
    try {
      performStorageCleanup();
      localStorage.setItem(key, value);
      return true;
    } catch (retryErr) {
      console.warn(`Retry setting key "${key}" failed after cleanup. Applying fallback trimming...`, retryErr);
      if (key === 'app_users') {
        try {
          const list = JSON.parse(value);
          if (Array.isArray(list)) {
            // Aggressive fallback: keep only top 30 most recent users with minimal fields
            const minimalList = list.slice(0, 30).map((u: any) => {
              const { photoURL, acneDetails, ...rest } = sanitizeUserForStorage(u);
              return rest;
            });
            localStorage.setItem('app_users', JSON.stringify(minimalList));
            return true;
          }
        } catch {}
      }
      return false;
    }
  }
}

// Strip huge base64 strings or payloads that would bust the browser localStorage quota
export function sanitizeUserForStorage(user: any): UserProfile {
  if (!user || typeof user !== 'object') return user;
  const sanitized = { ...user };
  if (typeof sanitized.photoURL === 'string' && (sanitized.photoURL.startsWith('data:image/') || sanitized.photoURL.length > 2048)) {
    delete sanitized.photoURL;
  }
  delete sanitized.skinAnalysisFullPayload;
  delete sanitized.faceScanRawData;
  return sanitized;
}

// Helper to get cached users from localStorage('app_users')
export function getMockUsers(): UserProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    let raw = localStorage.getItem('app_users');
    if (!raw) {
      raw = localStorage.getItem('mock_users');
      if (raw) {
        // Migrate mock_users to app_users and remove duplicate mock_users to free quota
        try {
          safeSetItem('app_users', raw);
          localStorage.removeItem('mock_users');
        } catch {}
      }
    } else {
      // Ensure duplicate mock_users key is deleted to save half of user storage
      try {
        localStorage.removeItem('mock_users');
      } catch {}
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Helper to save a user to localStorage cache and dispatch sync events
// 【电话号码去重】以电话号码为唯一键：存在则更新已有行，保持始终只有一行
export function saveMockUser(user: UserProfile, showAlert: boolean = false): void {
  if (typeof window === 'undefined') return;
  try {
    const appUsers = getMockUsers();
    const phoneKey = normalizePhoneKey(user.phoneNumber);
    const nowIso = new Date().toISOString();
    const sanitizedUser = sanitizeUserForStorage(user);

    // 优先通过手机号匹配，其次通过 UID 匹配
    const idx = appUsers.findIndex((u) => {
      if (phoneKey && phoneKey.length >= 6) {
        if (normalizePhoneKey(u.phoneNumber) === phoneKey) return true;
      }
      return Boolean(sanitizedUser.uid && (u.uid === sanitizedUser.uid || (u as any).id === sanitizedUser.uid));
    });

    let savedProfile: UserProfile;

    if (idx >= 0) {
      // 存在已有行：更新已有行，不新建行！保持单行记录
      const existing = appUsers[idx];
      const initialFullName = (
        existing.initialFullName ||
        existing.fullName ||
        existing.displayName ||
        sanitizedUser.initialFullName ||
        sanitizedUser.fullName ||
        sanitizedUser.displayName ||
        ''
      ).trim();

      savedProfile = {
        ...existing,
        ...sanitizedUser,
        // 关键：保留首次创建时的姓名与首次创建时间
        initialFullName,
        uid: existing.uid || sanitizedUser.uid,
        createdAt: existing.createdAt || sanitizedUser.createdAt || nowIso,
        updatedAt: nowIso,
      };

      // 去重：清理历史遗留的任何同手机号重复行，确保该客户始终只有一行记录
      const cleaned = appUsers.filter((u, i) => {
        if (i === idx) return false;
        if (phoneKey && phoneKey.length >= 6 && normalizePhoneKey(u.phoneNumber) === phoneKey) {
          return false;
        }
        return true;
      });

      cleaned.splice(idx, 0, savedProfile);

      const capped = cleaned.slice(0, 100).map(sanitizeUserForStorage);
      safeSetItem('app_users', JSON.stringify(capped));
      try { localStorage.removeItem('mock_users'); } catch {}
    } else {
      // 不存在 → 新建一行记录
      const initialFullName = (
        sanitizedUser.initialFullName ||
        sanitizedUser.fullName ||
        sanitizedUser.displayName ||
        ''
      ).trim();

      savedProfile = {
        ...sanitizedUser,
        initialFullName,
        createdAt: sanitizedUser.createdAt
          ? typeof sanitizedUser.createdAt === 'string'
            ? sanitizedUser.createdAt
            : new Date(sanitizedUser.createdAt).toISOString()
          : nowIso,
        updatedAt: nowIso,
      };

      // 清理任何同手机号残留
      const cleaned = (phoneKey && phoneKey.length >= 6)
        ? appUsers.filter((u) => normalizePhoneKey(u.phoneNumber) !== phoneKey)
        : [...appUsers];

      cleaned.unshift(savedProfile);
      const capped = cleaned.slice(0, 100).map(sanitizeUserForStorage);
      safeSetItem('app_users', JSON.stringify(capped));
      try { localStorage.removeItem('mock_users'); } catch {}
    }

    window.dispatchEvent(new CustomEvent('app_users_updated', { detail: savedProfile }));
    window.dispatchEvent(new CustomEvent('mock_users_updated', { detail: savedProfile }));

    if (showAlert) {
      setTimeout(() => {
        alert('ចុះឈ្មោះជោគជ័យ!');
      }, 100);
    }
  } catch (e) {
    console.warn('Notice: Local caching skipped gracefully:', e);
  }
}

// Batch save users without repeated serialization loops
export function saveMockUsersBatch(users: UserProfile[]): void {
  if (typeof window === 'undefined' || !users || users.length === 0) return;
  try {
    const existing = getMockUsers();
    const userMap = new Map<string, UserProfile>();

    existing.forEach((u) => {
      const key = normalizePhoneKey(u.phoneNumber) || u.uid || (u as any).id;
      if (key) userMap.set(key, sanitizeUserForStorage(u));
    });

    users.forEach((u) => {
      const key = normalizePhoneKey(u.phoneNumber) || u.uid || (u as any).id;
      if (key) {
        const prev = userMap.get(key) || {};
        userMap.set(key, sanitizeUserForStorage({ ...prev, ...u }));
      }
    });

    const merged = Array.from(userMap.values())
      .slice(0, 100)
      .map(sanitizeUserForStorage);

    safeSetItem('app_users', JSON.stringify(merged));
    try { localStorage.removeItem('mock_users'); } catch {}
  } catch (e) {
    console.warn('Notice: Batch cache save skipped:', e);
  }
}

// Helper to delete a user from local cache
export function deleteMockUser(uidOrId: string): void {
  if (typeof window === 'undefined' || !uidOrId) return;
  try {
    const appUsers = getMockUsers();
    const filtered = appUsers.filter((u) => u.uid !== uidOrId && (u as any).id !== uidOrId);
    safeSetItem('app_users', JSON.stringify(filtered));
    try { localStorage.removeItem('mock_users'); } catch {}
    window.dispatchEvent(new CustomEvent('app_users_updated'));
    window.dispatchEvent(new CustomEvent('mock_users_updated'));
  } catch (e) {
    console.warn('Notice: Could not delete user from local cache:', e);
  }
}

// Find user profile by phone number via backend verify-login API with local cache fallback
export async function findUserByPhone(phoneNumber: string): Promise<UserProfile | null> {
  if (!phoneNumber) return null;
  const targetKey = normalizePhoneKey(phoneNumber);
  const cleanPhone = phoneNumber.replace(/\s+/g, '');

  // 1. Check local cache first with phone normalization
  const appUsers = getMockUsers();
  const localFound = appUsers.find((u) => {
    if (u.phoneNumber === cleanPhone || u.phoneNumber === phoneNumber) return true;
    if (targetKey && targetKey.length >= 6 && normalizePhoneKey(u.phoneNumber) === targetKey) return true;
    return false;
  });
  if (localFound) return localFound;

  // 2. Query Backend verify-login API with 3.5s timeout (Never query Firestore users directly on client without auth)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('/api/admin/users/verify-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: cleanPhone }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        saveMockUser(data.user, false);
        return data.user;
      }
    } else if (res.status === 403) {
      const err = new Error('系统错误，请稍后重试');
      (err as any).status = 403;
      (err as any).code = 'permission-denied';
      throw err;
    } else if (res.status === 404) {
      return null;
    } else if (res.status >= 500) {
      const err = new Error('系统错误，请稍后重试');
      (err as any).status = res.status;
      throw err;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.warn('Backend findUserByPhone timeout (3.5s), proceeding with local fallback');
      return null;
    }
    if (err?.status === 403 || err?.code === 'permission-denied') {
      throw err;
    }
    console.warn('Backend findUserByPhone notice:', err?.message || err);
  }

  return null;
}

// Find user profile by name or phone via backend verify-login API
export async function findUserByNameOrPhone(identifier: string): Promise<UserProfile | null> {
  if (!identifier) return null;
  const rawId = identifier.trim();
  const clean = rawId.toLowerCase();
  
  // 1. Check local mock users first (fastest)
  const appUsers = getMockUsers();
  const foundLocal = appUsers.find(
    (u) =>
      u.phoneNumber?.toLowerCase() === clean ||
      u.displayName?.toLowerCase() === clean ||
      u.fullName?.toLowerCase() === clean ||
      u.initialFullName?.toLowerCase() === clean ||
      u.uid?.toLowerCase() === clean
  );
  if (foundLocal) {
    return foundLocal;
  }

  // 2. Query backend verify-login API with 3.5s timeout
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('/api/admin/users/verify-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: rawId, phoneNumber: rawId, fullName: rawId }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        saveMockUser(data.user, false);
        return data.user;
      }
    } else if (res.status === 403) {
      const err = new Error('系统错误，请稍后重试');
      (err as any).status = 403;
      (err as any).code = 'permission-denied';
      throw err;
    } else if (res.status === 404) {
      return null;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.warn('Backend findUserByNameOrPhone timeout (3.5s)');
      return null;
    }
    if (err?.status === 403 || err?.code === 'permission-denied') {
      throw err;
    }
    console.warn('Backend findUserByNameOrPhone notice:', err?.message || err);
  }

  return null;
}

// Phone Number formatting helper (Strict E.164 format: e.g. +85512345678)
export function formatToE164(countryCode: string = '+855', rawPhone: string = ''): string {
  if (!rawPhone) return '';
  const trimmed = rawPhone.trim();

  // Normalize selected country code (defaults to +855 for Cambodia)
  let code = (countryCode || '+855').trim();
  if (!code.startsWith('+')) {
    code = `+${code}`;
  }
  const codeDigits = code.replace(/\D/g, ''); // e.g. "855"

  // Case A: User typed international format with '+' (e.g. +855 012 345 678, +85512345678, +86...)
  if (trimmed.startsWith('+')) {
    const allDigits = trimmed.replace(/\D/g, '');
    if (codeDigits && allDigits.startsWith(codeDigits)) {
      let subscriber = allDigits.slice(codeDigits.length);
      // Strip any accidental leading zero after country code (e.g. +855 012... -> 12...)
      while (subscriber.startsWith('0')) {
        subscriber = subscriber.substring(1);
      }
      return `+${codeDigits}${subscriber}`;
    }
    return `+${allDigits}`;
  }

  // Case B: User typed without '+'
  let digits = trimmed.replace(/\D/g, '');

  // If user typed country code digits without plus prefix (e.g. 85512345678 or 855012345678)
  if (codeDigits && digits.startsWith(codeDigits) && digits.length > codeDigits.length + 5) {
    let subscriber = digits.slice(codeDigits.length);
    while (subscriber.startsWith('0')) {
      subscriber = subscriber.substring(1);
    }
    return `+${codeDigits}${subscriber}`;
  }

  // Strip national trunk prefix leading zero (e.g. 012 345 678 -> 12345678)
  while (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  return `${code}${digits}`;
}

// Check if a string is likely a phone number (rather than a person's name)
export function isLikelyPhoneNumber(val: string): boolean {
  if (!val) return false;
  const clean = val.trim();
  if (clean.startsWith('+') && /^[\d\s\-()]+$/.test(clean.slice(1))) {
    return true;
  }
  const digits = clean.replace(/[\s\-\(\)\.]/g, '');
  if (/^\d{6,15}$/.test(digits)) {
    return true;
  }
  return false;
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

// Check if a phone number is already registered via backend verify-login API or local cache
export async function checkPhoneNumberExists(phoneNumber: string): Promise<boolean> {
  if (!phoneNumber) return false;
  const cleanPhone = phoneNumber.replace(/\s+/g, '');
  const pKey = normalizePhoneKey(phoneNumber);

  // 1. Check local cache first
  const appUsers = getMockUsers();
  const existsLocal = appUsers.some((u) => {
    if (u.phoneNumber === cleanPhone || u.phoneNumber === phoneNumber) return true;
    if (pKey && pKey.length >= 6 && normalizePhoneKey(u.phoneNumber) === pKey) return true;
    return false;
  });
  if (existsLocal) return true;

  // 2. Query Backend verify-login API (Do NOT query Firestore users directly on client)
  try {
    const res = await fetch('/api/admin/users/verify-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: cleanPhone }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        saveMockUser(data.user, false);
      }
      return true;
    }
    if (res.status === 404) {
      return false;
    }
    if (res.status === 403) {
      const err = new Error('系统错误，请稍后重试');
      (err as any).status = 403;
      (err as any).code = 'permission-denied';
      throw err;
    }
  } catch (err: any) {
    if (err?.status === 403 || err?.code === 'permission-denied') {
      throw err;
    }
    console.warn('Backend checkPhoneNumberExists notice:', err);
  }

  return false;
}

export interface VerifyLoginResult {
  allowed: boolean;
  user?: UserProfile;
  error?: string;
  errorKm?: string;
  errorZh?: string;
  reason?: 'not_found' | 'name_mismatch' | 'invalid_input' | 'forbidden' | 'server_error' | 'success';
}

/**
 * 【登录姓名校验】客户登录时通过后端接口验证手机号与姓名。
 * 绝不在前端直接读取 users 集合(安全考虑)。
 * 区分错误类型:
 * - 403 / 500: 系统错误, 请稍后重试
 * - 401: 姓名与注册信息不符, 请核实后重试
 * - 404: 确实查不到才显示未找到账户
 */
export async function verifyCustomerLoginName(
  phoneNumber: string,
  inputName: string
): Promise<VerifyLoginResult> {
  const cleanPhone = (phoneNumber || '').trim();
  const cleanInputName = (inputName || '').trim();

  if (!cleanPhone) {
    return {
      allowed: false,
      reason: 'invalid_input',
      error: 'Phone number is required',
      errorKm: 'សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក',
      errorZh: '请输入手机号码',
    };
  }

  // If inputName is empty or is itself a phone number, do not pass as fullName to verify
  const isInputPhone = isLikelyPhoneNumber(cleanInputName);
  const sendFullName = (!isInputPhone && cleanInputName) ? cleanInputName : undefined;

  // 1. 调用后端统一校验 API
  try {
    const res = await fetch('/api/admin/users/verify-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: cleanPhone, fullName: sendFullName }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.allowed) {
        if (data.user) saveMockUser(data.user, false);
        return {
          allowed: true,
          reason: 'success',
          user: data.user,
        };
      }
    } else if (res.status === 401) {
      const data = await res.json().catch(() => ({}));
      return {
        allowed: false,
        reason: 'name_mismatch',
        error: data.error || '姓名与注册信息不符,请核实后重试',
        errorZh: data.msg_zh || data.error || '姓名与注册信息不符,请核实后重试',
        errorKm: data.msg_km || 'ឈ្មោះមិនត្រូវនឹងព័ត៌មានចុះឈ្មោះទេ សូមផ្ទៀងផ្ទាត់រួចព្យាយាមម្តងទៀត',
      };
    } else if (res.status === 403) {
      return {
        allowed: false,
        reason: 'forbidden',
        error: '系统错误，请稍后重试',
        errorZh: '系统错误，请稍后重试',
        errorKm: 'បញ្ហាប្រព័ន្ធ សូមព្យាយាមម្តងទៀតនៅពេលក្រោយ',
      };
    } else if (res.status === 404) {
      const data = await res.json().catch(() => ({}));
      return {
        allowed: false,
        reason: 'not_found',
        error: data.error || '未找到该手机号码的客户账户，请核实后重试或前往注册',
        errorZh: data.msg_zh || data.error || '未找到该手机号码的客户账户，请核实后重试或前往注册',
        errorKm: data.msg_km || 'រកមិនឃើញគណនីដែលមានលេខទូរស័ព្ទនេះទេ។ សូមពិនិត្យឡើងវិញ ឬចុះឈ្មោះគណនីថ្មី',
      };
    } else if (res.status >= 500) {
      return {
        allowed: false,
        reason: 'server_error',
        error: '系统错误，请稍后重试',
        errorZh: '系统错误，请稍后重试',
        errorKm: 'បញ្ហាប្រព័ន្ធ សូមព្យាយាមម្តងទៀតនៅពេលក្រោយ',
      };
    }
  } catch (apiErr) {
    console.warn('Backend verify-login API connection issue:', apiErr);
  }

  // 2. 本地缓存降级校验（仅查本地已缓存的用户，切勿在前端直查 Firestore users 集合）
  const appUsers = getMockUsers();
  const targetKey = normalizePhoneKey(cleanPhone);
  const localUser = appUsers.find((u) => {
    if (u.phoneNumber === cleanPhone) return true;
    if (targetKey && targetKey.length >= 6 && normalizePhoneKey(u.phoneNumber) === targetKey) return true;
    return false;
  });

  if (localUser) {
    if (!cleanInputName || isInputPhone) {
      return { allowed: true, reason: 'success', user: localUser };
    }
    const candidates = [
      localUser.initialFullName,
      localUser.fullName,
      localUser.displayName,
      (localUser as any).name,
      (localUser as any).telegram,
    ]
      .filter(Boolean)
      .map((n: string) => String(n).trim().toLowerCase());

    const inName = cleanInputName.toLowerCase();
    const isNameMatch = candidates.length === 0 || candidates.some(
      (cand) => cand === inName || cand.includes(inName) || inName.includes(cand)
    );

    if (!isNameMatch) {
      return {
        allowed: false,
        reason: 'name_mismatch',
        error: '姓名与注册信息不符,请核实后重试',
        errorZh: '姓名与注册信息不符,请核实后重试',
        errorKm: 'ឈ្មោះមិនត្រូវនឹងព័ត៌មានចុះឈ្មោះទេ សូមផ្ទៀងផ្ទាត់រួចព្យាយាមម្តងទៀត',
      };
    }
    return {
      allowed: true,
      reason: 'success',
      user: localUser,
    };
  }

  // 若后端不可达且本地无记录，按系统错误提示，切勿误判为未找到账户
  return {
    allowed: false,
    reason: 'server_error',
    error: '系统错误，请稍后重试',
    errorZh: '系统错误，请稍后重试',
    errorKm: 'បញ្ហាប្រព័ន្ធ សូមព្យាយាមម្តងទៀតនៅពេលក្រោយ',
  };
}

export interface AuthErrorInfo {
  code: string;
  rawMessage: string;
  friendlyKm: string;
  friendlyZh: string;
  hint: string;
  actionRequired?: string;
}

export function explainAuthError(error: any): AuthErrorInfo {
  const code: string = error?.code || (typeof error === 'string' ? error : '') || 'auth/unknown-error';
  const rawMsg: string = error?.message || (typeof error === 'string' ? error : '') || '';
  const lower = `${code} ${rawMsg}`.toLowerCase();

  console.group('【Firebase Phone Auth Diagnostic】');
  console.log('Error Code:', code);
  console.log('Error Message:', rawMsg);
  console.log('Custom Data:', error?.customData);
  console.log('Full Error:', error);
  console.groupEnd();

  if (lower.includes('already been rendered') || lower.includes('already-rendered') || lower.includes('has already been rendered')) {
    return {
      code: 'auth/captcha-already-rendered',
      rawMessage: rawMsg || 'reCAPTCHA has already been rendered in this element',
      friendlyKm: 'reCAPTCHA បានកំណត់ឡើងវិញដោយស្វ័យប្រវត្តិ។ សូមចុចផ្ញើម្ដងទៀត។',
      friendlyZh: 'reCAPTCHA 人机验证已自动重置，请再次点击“发送验证码”。',
      hint: '由于安全验证组件已自动重置，请再次点击“发送验证码”按钮即可完成发送。',
    };
  }

  if (lower.includes('auth/operation-not-allowed') || lower.includes('sms unable to be sent')) {
    return {
      code: 'auth/operation-not-allowed',
      rawMessage: rawMsg || 'Phone authentication provider is not enabled in Firebase Console',
      friendlyKm: 'សេវា Phone Auth មិនទាន់បើកក្នុង Firebase Console ឡើយ។',
      friendlyZh: 'Firebase 控制台未启用手机号身份验证 (Phone Provider)。',
      hint: '请前往 Firebase 控制台 -> Build -> Authentication -> Sign-in method，将【Phone (电话号码)】提供方切换为【启用 (Enabled)】并保存。',
      actionRequired: 'ENABLE_PHONE_PROVIDER',
    };
  }

  if (lower.includes('auth/unauthorized-domain') || lower.includes('domain-not-allowed') || lower.includes('auth/captcha-check-failed') && lower.includes('domain')) {
    return {
      code: 'auth/unauthorized-domain',
      rawMessage: rawMsg || 'Domain is not authorized for OAuth/reCAPTCHA operations in Firebase',
      friendlyKm: 'Domain គេហទំព័រនេះមិនទាន់បានបន្ថែមក្នុង Firebase Authorized Domains ឡើយ។',
      friendlyZh: '当前域名未列入 Firebase 授权网域 (Authorized Domains) 白名单。',
      hint: '请前往 Firebase 控制台 -> Build -> Authentication -> Settings -> Authorized domains，点击【添加网域 (Add domain)】，将当前预览网域 (如 asia-southeast1.run.app) 添加进去。',
      actionRequired: 'ADD_AUTHORIZED_DOMAIN',
    };
  }

  if (lower.includes('auth/billing-not-enabled') || lower.includes('billing') || lower.includes('quota-exceeded') || lower.includes('auth/too-many-requests') && lower.includes('quota')) {
    return {
      code: 'auth/billing-not-enabled',
      rawMessage: rawMsg || 'SMS billing is not enabled or quota has been exceeded',
      friendlyKm: 'កូតាផ្ញើសារ SMS ប្រចាំថ្ងៃបានអស់ ឬមិនទាន់បានបើកគម្រោង Blaze ក្នុង Firebase ឡើយ។',
      friendlyZh: 'SMS 发送配额已用尽，或项目未升级至 Blaze 计费方案。',
      hint: 'Firebase Spark (免费计划) 每天限制发送 10 条短信。请在 Firebase 控制台将项目升级为 Blaze 计划，或在 Phone 提供方设置中配置白名单测试手机号。',
      actionRequired: 'ENABLE_BLAZE_OR_TEST_PHONE',
    };
  }

  if (lower.includes('auth/invalid-app-credential') || lower.includes('invalid-app-credential')) {
    return {
      code: 'auth/invalid-app-credential',
      rawMessage: rawMsg || 'Firebase phone auth app credential is invalid (reCAPTCHA/App Check issue)',
      friendlyKm: 'ការផ្ទៀងផ្ទាត់សុវត្ថិភាព reCAPTCHA មិនជោគជ័យ ឬ App Credential មិនត្រឹមត្រូវ។',
      friendlyZh: 'Firebase Phone Auth 应用凭证无效或 reCAPTCHA 验证失败。',
      hint: '请确认：1. Authorized Domains 是否包含当前域名；2. Google Cloud Console 中 Identity Toolkit API 与 Cloud reCAPTCHA API 是否已启用；3. 如启用了 App Check，请确认未拦截 Phone Auth。',
      actionRequired: 'CHECK_CREDENTIALS',
    };
  }

  if (lower.includes('auth/captcha-check-failed')) {
    return {
      code: 'auth/captcha-check-failed',
      rawMessage: rawMsg || 'reCAPTCHA verification failed or token expired',
      friendlyKm: 'ការផ្ទៀងផ្ទាត់ reCAPTCHA មិនបានជោគជ័យ ឬផុតកំណត់។ សូមព្យាយាមម្ដងទៀត។',
      friendlyZh: 'reCAPTCHA 人机验证失败或 Token 已过期，请重新点击发送。',
      hint: 'reCAPTCHA 验证未能成功通过，请刷新或再次点击重试。',
    };
  }

  if (lower.includes('auth/invalid-phone-number')) {
    return {
      code: 'auth/invalid-phone-number',
      rawMessage: rawMsg || 'The phone number format is invalid (requires E.164)',
      friendlyKm: 'លេខទូរស័ព្ទនេះមិនត្រឹមត្រូវតាមទម្រង់ E.164 ឡើយ។',
      friendlyZh: '手机号码格式无效 (必须符合 E.164 规范，例如 +85512345678)。',
      hint: '请确保输入的号码属于柬埔寨有效手机号，系统会自动转为 +855 开头去掉首位 0。',
    };
  }

  if (lower.includes('auth/too-many-requests')) {
    return {
      code: 'auth/too-many-requests',
      rawMessage: rawMsg || 'Too many requests. Please wait a few moments.',
      friendlyKm: 'អ្នកបានស្នើសុំលេខកូដច្រើនដងពេក។ សូមរង់ចាំបន្តិច រួចព្យាយាមម្ដងទៀត។',
      friendlyZh: '请求过于频繁已被 Firebase 防刷限制拦截，请稍等片刻再试。',
      hint: '操作过于频繁，请等待 1-2 分钟后再试，或在控制台添加免验证测试号。',
    };
  }

  if (lower.includes('auth/invalid-verification-code')) {
    return {
      code: 'auth/invalid-verification-code',
      rawMessage: rawMsg || 'Invalid verification code (OTP)',
      friendlyKm: 'លេខកូដផ្ទៀងផ្ទាត់ 6 ខ្ទង់មិនត្រឹមត្រូវទេ។',
      friendlyZh: '验证码输入错误，请核对短信中的 6 位数字。',
      hint: '请核对最新一条短信中的 6 位验证码。',
    };
  }

  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('30') || lower.includes('លើសពី') || lower.includes('超时')) {
    return {
      code: 'auth/timeout',
      rawMessage: rawMsg || 'Verification operation timed out',
      friendlyKm: 'ប្រតិបត្តិការចំណាយពេលយូរពេក សូមពិនិត្យមើលបណ្ដាញ ឬស្នើសុំលេខកូដថ្មី។',
      friendlyZh: '验证操作超时，请检查网络后重试或重新发送验证码。',
      hint: '网络连接较慢或服务响应超时，请重新获取验证码后再试。',
    };
  }

  if (lower.includes('auth/code-expired')) {
    return {
      code: 'auth/code-expired',
      rawMessage: rawMsg || 'The verification code has expired',
      friendlyKm: 'លេខកូដនេះបានផុតកំណត់។ សូមស្នើសុំលេខកូដថ្មី។',
      friendlyZh: '短信验证码已失效过期，请重新发送获取新验证码。',
      hint: '验证码通常在 5-10 分钟内有效，超时请重新点击发送。',
    };
  }

  return {
    code: code,
    rawMessage: rawMsg || 'Unknown error occurred during phone auth',
    friendlyKm: 'មានបញ្ហាកើតឡើងក្នុងការផ្ញើ SMS ឬផ្ទៀងផ្ទាត់។ សូមព្យាយាមម្ដងទៀត។',
    friendlyZh: '发送短信或验证时出现问题，请检查控制台错误详情。',
    hint: '如果报错 400，通常是 Firebase Console 中未开启 Phone 登录或 SMS 区域被限制，请在控制台检查配置。',
  };
}

export function getKhmerErrorMessage(errorCodeOrMessage: string): string {
  if (!errorCodeOrMessage) return 'មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្ដងទៀត។';
  return explainAuthError(errorCodeOrMessage).friendlyKm;
}
