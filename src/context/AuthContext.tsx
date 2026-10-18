import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut,
  signInWithPhoneNumber,
  signInWithPopup,
  FacebookAuthProvider,
  ConfirmationResult,
  RecaptchaVerifier,
  PhoneAuthProvider,
  updatePhoneNumber,
  deleteUser,
  linkWithCredential,
} from 'firebase/auth';
import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  UserProfile,
  getKhmerErrorMessage,
  explainAuthError,
  hashPassword,
  findUserByPhone,
  findUserByNameOrPhone,
  verifyCustomerLoginName,
  isLikelyPhoneNumber,
  saveMockUser,
  getMockUsers,
  performStorageCleanup,
  safeSetItem,
  ensureFirebaseAuth,
} from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  sendOTP: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyOTP: (confirmationResult: ConfirmationResult, code: string) => Promise<{ isNewUser: boolean; user: User; profile: UserProfile | null }>;
  loginWithPassword: (nameOrPhone: string, password: string, phoneInput?: string) => Promise<UserProfile>;
  registerWithPassword: (data: {
    displayName: string;
    fullName?: string;
    phoneNumber: string;
    password: string;
    telegram?: string;
    gender?: string;
    ageRange?: string;
    location?: string;
    skinConcerns?: string[];
    acneDetails?: string;
    preferredLanguage?: 'km' | 'zh' | 'en';
  }) => Promise<UserProfile>;
  setUserPassword: (password: string) => Promise<void>;
  loginWithFacebook: () => Promise<{ isNewUser: boolean; user: User; profile: UserProfile }>;
  createUserProfile: (data: {
    displayName: string;
    fullName?: string;
    telegram?: string;
    gender?: string;
    ageRange?: string;
    location?: string;
    preferredLanguage?: 'km' | 'zh' | 'en';
    skinConcerns?: string[];
    acneDetails?: string;
    password?: string;
  }) => Promise<UserProfile>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  reloadUserProfile: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateUserPhoneNumber: (confirmationResult: ConfirmationResult, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch user document directly from Firestore users collection
  const fetchProfileFromFirestore = async (uid: string, timeoutMs: number = 3000): Promise<Partial<UserProfile> | null> => {
    const targetUid = uid || auth.currentUser?.uid;
    if (!targetUid) return null;
    try {
      const userRef = doc(db, 'users', targetUid);
      // Timeout protection so Firestore getDoc never hangs indefinitely
      const snap = await Promise.race([
        getDoc(userRef),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
      ]);
      if (snap && (snap as any).exists && (snap as any).exists()) {
        const data = (snap as any).data();
        const resolvedName = data.displayName || data.fullName || data.name || '';
        console.log(`【AuthContext】已从 Firestore 成功读取用户资料 (UID: ${targetUid})，昵称: ${resolvedName}，头像有效: ${Boolean(data?.photoURL)}`);
        return {
          uid: targetUid,
          photoURL: data.photoURL || '',
          displayName: resolvedName,
          fullName: data.fullName || resolvedName,
          phoneNumber: data.phoneNumber || '',
          preferredLanguage: data.preferredLanguage || 'km',
          telegram: data.telegram || '',
          gender: data.gender || '',
          ageRange: data.ageRange || '',
          role: data.role || 'user',
          points: typeof data.points === 'number' ? data.points : undefined,
          totalSpent: typeof data.totalSpent === 'number' ? data.totalSpent : undefined,
          tier: data.tier || 'normal',
          isVip: Boolean(data.isVip),
          isVvip: Boolean(data.isVvip),
          isFacebookTopFriend: Boolean(data.isFacebookTopFriend),
          skinConcerns: data.skinConcerns || [],
          acneDetails: data.acneDetails || '',
        };
      }
    } catch (err: any) {
      console.warn('【AuthContext】从 Firestore users 读取资料提示:', err?.message || err);
    }
    return null;
  };

  // Fetch profile directly from localStorage('app_users')
  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    const appUsers = getMockUsers();
    const found = appUsers.find((u) => u.uid === uid || (u as any).id === uid);
    if (found && found.role === 'user' && (found.points === 0 || found.points === undefined) && (!found.totalSpent || found.totalSpent === 0)) {
      found.points = 15;
      saveMockUser(found, false);
    }
    return found || null;
  };

  // Auth State Listener
  useEffect(() => {
    // Clean up bloated / duplicate localStorage items immediately on startup
    performStorageCleanup();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // 1. Fast local cache load to prevent UI blocking
        let profile = await fetchProfile(user.uid);
        if (!profile && user.phoneNumber) {
          try {
            profile = await findUserByPhone(user.phoneNumber);
          } catch {}
        }
        if (profile) {
          setUserProfile(profile);
          if (profile.photoURL) {
            safeSetItem('lumimei_user_photo_url', profile.photoURL);
          }
        }

        // 2. 关键：登录后从 Firestore 读取头像及最新资料，而不是只用本地状态
        try {
          // If profile found with matching phone has a canonical uid, prefer that
          const targetDocUid = profile?.uid || user.uid;
          const cloudData = await fetchProfileFromFirestore(targetDocUid);
          if (cloudData) {
            profile = {
              ...(profile || {
                uid: targetDocUid,
                displayName: user.displayName || 'អ្នកប្រើប្រាស់',
                fullName: user.displayName || 'អ្នកប្រើប្រាស់',
                phoneNumber: user.phoneNumber || '',
                preferredLanguage: 'km',
                skinConcerns: [],
                acneDetails: '',
                role: 'user',
                points: 15,
                totalSpent: 0,
                tier: 'normal',
                isVip: false,
                isVvip: false,
                isFacebookTopFriend: false,
                consentAccepted: true,
                consentVersion: '1.0',
                createdAt: new Date(),
              }),
              ...cloudData,
              // 确保 Firestore 中的头像 photoURL 生效
              photoURL: cloudData.photoURL || profile?.photoURL || user.photoURL || '',
            };
            if (cloudData.photoURL) {
              safeSetItem('lumimei_user_photo_url', cloudData.photoURL);
            }
            saveMockUser(profile, false);
            setUserProfile(profile);
          }
        } catch (cloudErr) {
          console.warn('【AuthContext】读取 Firestore 用户资料失败:', cloudErr);
        }

        if (!profile && (user.displayName || user.photoURL)) {
          const exactName = (user.displayName || 'Facebook User').trim();
          const photo = user.photoURL || '';
          if (photo) {
            safeSetItem('lumimei_user_photo_url', photo);
          }
          profile = {
            uid: user.uid,
            displayName: exactName,
            fullName: exactName,
            phoneNumber: user.phoneNumber || '',
            photoURL: photo,
            preferredLanguage: 'km',
            skinConcerns: [],
            acneDetails: '',
            role: 'user',
            points: 15,
            totalSpent: 0,
            tier: 'normal',
            isVip: false,
            isVvip: false,
            isFacebookTopFriend: true,
            consentAccepted: true,
            consentVersion: '1.0',
            createdAt: new Date(),
          };
          saveMockUser(profile, false);
          setUserProfile(profile);
        }
        setLoading(false);
      } else {
        // If not in Firebase Auth, check if user logged in with password stored in session
        try {
          const savedSession = localStorage.getItem('lumimei_auth_session');
          if (savedSession) {
            const parsed = JSON.parse(savedSession);
            if (parsed.uid) {
              let profile = await fetchProfile(parsed.uid);
              try {
                const cloudData = await fetchProfileFromFirestore(parsed.uid);
                if (cloudData) {
                  profile = { ...(profile || { uid: parsed.uid }), ...cloudData } as UserProfile;
                  if (cloudData.photoURL) {
                    safeSetItem('lumimei_user_photo_url', cloudData.photoURL);
                  }
                  saveMockUser(profile, false);
                }
              } catch {}

              if (profile) {
                const syntheticUser: any = {
                  uid: profile.uid,
                  phoneNumber: profile.phoneNumber,
                  displayName: profile.displayName || profile.fullName,
                  photoURL: profile.photoURL || null,
                  email: null,
                };
                setCurrentUser(syntheticUser);
                setUserProfile(profile);
                setLoading(false);
                return;
              }
            }
          }
        } catch {
          // ignore
        }
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen for points updates from quiz verification, missions, or admin updates
  useEffect(() => {
    const handleSyncProfile = () => {
      const activeUid = currentUser?.uid || userProfile?.uid;
      const activePhone = currentUser?.phoneNumber || userProfile?.phoneNumber || (userProfile as any)?.phone;

      if (!activeUid && !activePhone) return;

      const appUsers = getMockUsers();
      const found = appUsers.find(
        (u) =>
          (activeUid && (u.uid === activeUid || (u as any).id === activeUid)) ||
          (activePhone && (u.phoneNumber === activePhone || (u as any).phone === activePhone))
      );

      if (found) {
        setUserProfile((prev) => {
          if (!prev) return found;
          if (
            prev.points !== found.points ||
            prev.tier !== found.tier ||
            prev.totalSpent !== found.totalSpent ||
            prev.displayName !== found.displayName
          ) {
            return { ...prev, ...found };
          }
          return prev;
        });
      }
    };

    window.addEventListener('pointsUpdated', handleSyncProfile);
    window.addEventListener('app_users_updated', handleSyncProfile);
    window.addEventListener('mock_users_updated', handleSyncProfile);

    return () => {
      window.removeEventListener('pointsUpdated', handleSyncProfile);
      window.removeEventListener('app_users_updated', handleSyncProfile);
      window.removeEventListener('mock_users_updated', handleSyncProfile);
    };
  }, [currentUser?.uid, currentUser?.phoneNumber, userProfile?.uid, userProfile?.phoneNumber]);

  // Send OTP
  const sendOTP = async (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
    try {
      console.log('【Firebase Phone Auth】正在发送短信验证码 (signInWithPhoneNumber):', phoneNumber);
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      console.log('【Firebase Phone Auth】短信发送成功，verificationId:', confirmationResult.verificationId);
      return confirmationResult;
    } catch (error: any) {
      const diag = explainAuthError(error);
      console.warn('【Firebase sendOTP 异常】详细信息:', {
        code: diag.code,
        message: diag.rawMessage,
        phoneNumber,
        hint: diag.hint,
        actionRequired: diag.actionRequired,
      });

      // Preserve full error properties on the thrown error
      const enhancedError: any = new Error(diag.friendlyKm);
      enhancedError.code = diag.code;
      enhancedError.rawMessage = diag.rawMessage;
      enhancedError.friendlyKm = diag.friendlyKm;
      enhancedError.friendlyZh = diag.friendlyZh;
      enhancedError.hint = diag.hint;
      enhancedError.phoneNumber = phoneNumber;
      throw enhancedError;
    }
  };

  // Verify OTP
  const verifyOTP = async (confirmationResult: ConfirmationResult, code: string): Promise<{ isNewUser: boolean; user: User; profile: UserProfile | null }> => {
    try {
      console.log('【Firebase Phone Auth】正在验证短信验证码 (confirm OTP)...');
      if (!confirmationResult || typeof confirmationResult.confirm !== 'function') {
        throw new Error('លេខកូដសុពលភាពបានផុតកំណត់ សូមផ្ញើលេខកូដម្តងទៀត / 验证会话已过期，请重新获取验证码');
      }

      // Add a 15-second Promise.race timeout specifically to confirmationResult.confirm
      const result = await Promise.race([
        confirmationResult.confirm(code),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('ការផ្ទៀងផ្ទាត់កូដ OTP លើសពេលកំណត់ (15 វិនាទី) សូមព្យាយាមម្ដងទៀត / 验证码验证超时（15秒），请重试')), 15000)
        ),
      ]);
      const user = result.user;
      setCurrentUser(user);

      // 立即检查本地或已有资料，避免 ProtectedRoute 阻断
      let profile = await fetchProfile(user.uid);
      if (!profile && user.phoneNumber) {
        try {
          profile = await findUserByPhone(user.phoneNumber);
        } catch {}
      }
      if (!profile && user.phoneNumber) {
        const cleanPhone = user.phoneNumber.replace(/\D/g, '');
        const allUsers = getMockUsers();
        profile = allUsers.find((u) => {
          const uClean = (u.phoneNumber || '').replace(/\D/g, '');
          return uClean && cleanPhone && uClean === cleanPhone;
        }) || null;
      }

      const isNew = !profile;

      // 如果尚未有本地 Profile，立即生成默认资料，确保登录后立刻能进页面
      if (!profile) {
        const exactName = user.phoneNumber ? `User ${user.phoneNumber.slice(-4)}` : 'អ្នកប្រើប្រាស់';
        profile = {
          uid: user.uid,
          displayName: exactName,
          fullName: exactName,
          phoneNumber: user.phoneNumber || '',
          preferredLanguage: 'km',
          skinConcerns: [],
          acneDetails: '',
          role: 'user',
          points: 15,
          totalSpent: 0,
          tier: 'normal',
          isVip: false,
          isVvip: false,
          isFacebookTopFriend: false,
          consentAccepted: true,
          consentVersion: '1.0',
          createdAt: new Date(),
        };
        saveMockUser(profile, false);
      }

      // 异步读取 Firestore 资料（设置 2.5s 超时防卡死），如果超时则由 onAuthStateChanged 后台异步补充
      try {
        const targetDocUid = profile?.uid || user.uid;
        const cloudData = await fetchProfileFromFirestore(targetDocUid, 2500);
        if (cloudData) {
          profile = { ...profile, ...cloudData };
          if (cloudData.photoURL) {
            safeSetItem('lumimei_user_photo_url', cloudData.photoURL);
          }
          saveMockUser(profile, false);
        }
      } catch (cloudErr) {
        console.warn('【AuthContext】verifyOTP 从 Firestore 读取头像提示:', cloudErr);
      }

      setUserProfile(profile);

      return {
        isNewUser: isNew,
        user,
        profile,
      };
    } catch (error: any) {
      const diag = explainAuthError(error);
      console.error('【Firebase verifyOTP 失败】详细信息:', {
        code: diag.code,
        message: diag.rawMessage,
        fullError: error,
      });

      const enhancedError: any = new Error(diag.friendlyKm);
      enhancedError.code = diag.code;
      enhancedError.rawMessage = diag.rawMessage;
      enhancedError.friendlyKm = diag.friendlyKm;
      enhancedError.friendlyZh = diag.friendlyZh;
      enhancedError.hint = diag.hint;
      throw enhancedError;
    }
  };

  // Login With Facebook
  const loginWithFacebook = async (): Promise<{ isNewUser: boolean; user: User; profile: UserProfile }> => {
    try {
      const provider = new FacebookAuthProvider();
      provider.addScope('public_profile');
      provider.addScope('email');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setCurrentUser(user);

      let profile = await fetchProfile(user.uid);
      const isNewUser = !profile;

      if (!profile) {
        const exactName = (user.displayName || 'Facebook User').trim();
        const photo = user.photoURL || '';
        if (photo) {
          safeSetItem('lumimei_user_photo_url', photo);
        }

        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: exactName,
          fullName: exactName,
          phoneNumber: user.phoneNumber || '',
          photoURL: photo,
          preferredLanguage: 'km',
          skinConcerns: [],
          acneDetails: '',
          role: 'user',
          points: 0,
          claimedNewCustomerBonus: false,
          totalSpent: 0,
          tier: 'normal',
          isVip: false,
          isVvip: false,
          isFacebookTopFriend: true,
          consentAccepted: true,
          consentVersion: '1.0',
          createdAt: new Date(),
        };

        saveMockUser(newProfile, false);

        // Ensure task-new-customer is ready for the customer to claim by themselves
        try {
          const existingCompleted = JSON.parse(localStorage.getItem('lumimei_completed_mission_tasks') || '[]');
          const nextCompletedTasks = existingCompleted.filter((id: string) => id !== 'task-new-customer');
          localStorage.setItem('lumimei_completed_mission_tasks', JSON.stringify(nextCompletedTasks));
          localStorage.removeItem('lumimei_claimed_new_customer_bonus');
          localStorage.removeItem(`lumimei_claimed_new_customer_bonus_${user.uid}`);
        } catch {}

        // Dual-write to backend server to ensure admin dashboard synchronization
        try {
          fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: user.uid,
              uid: user.uid,
              fullName: exactName,
              displayName: exactName,
              phoneNumber: user.phoneNumber || '',
              photoURL: photo,
              points: 0,
              claimedNewCustomerBonus: false,
              tier: 'normal',
              role: 'user',
            }),
          }).catch(() => {});
        } catch {}

        profile = newProfile;
      } else {
        // If profile exists and user logged in with Facebook, update photoURL or isFacebookTopFriend if needed
        if (user.photoURL && !profile.photoURL) {
          safeSetItem('lumimei_user_photo_url', user.photoURL);
        }
      }

      // 登录后从 Firestore 读取头像及最新资料
      try {
        const cloudData = await fetchProfileFromFirestore(user.uid);
        if (cloudData) {
          profile = { ...(profile || {}), ...cloudData } as UserProfile;
          if (cloudData.photoURL) {
            safeSetItem('lumimei_user_photo_url', cloudData.photoURL);
          }
          saveMockUser(profile, false);
        }
      } catch (cloudErr) {
        console.warn('【AuthContext】loginWithFacebook 读取 Firestore 头像提示:', cloudErr);
      }

      setUserProfile(profile);
      return { isNewUser, user, profile };
    } catch (error: any) {
      const message = getKhmerErrorMessage(error.code || error.message || '');
      throw new Error(message);
    }
  };

  // Create User Profile in Firestore
  const createUserProfile = async (data: {
    displayName: string;
    fullName?: string;
    telegram?: string;
    gender?: string;
    ageRange?: string;
    preferredLanguage?: 'km' | 'zh' | 'en';
    skinConcerns?: string[];
    acneDetails?: string;
    password?: string;
  }): Promise<UserProfile> => {
    if (!currentUser) throw new Error('អ្នកមិនទាន់បានចូលប្រើប្រាស់ទេ។');

    const uid = currentUser.uid;
    const phoneNumber = currentUser.phoneNumber || '';
    const exactName = (data.fullName || data.displayName || '').trim();

    let passwordHash: string | undefined = undefined;
    let hasPassword = false;
    if (data.password && data.password.length >= 6) {
      passwordHash = await hashPassword(data.password);
      hasPassword = true;
      if (phoneNumber) {
        localStorage.setItem(`lumimei_pwd_${phoneNumber}`, data.password);
      }
    }

    // If profile already exists, preserve points, orders, tier, and simply update profile details
    let existing = await fetchProfile(uid);
    if (!existing && phoneNumber) {
      try {
        existing = await findUserByPhone(phoneNumber);
      } catch {}
    }
    const targetUid = existing?.uid || uid;
    if (existing) {
      const updatedProfile: UserProfile = {
        ...existing,
        uid: targetUid,
        displayName: exactName || existing.displayName,
        fullName: exactName || existing.fullName,
        telegram: data.telegram !== undefined ? data.telegram : existing.telegram,
        gender: data.gender !== undefined ? data.gender : existing.gender,
        ageRange: data.ageRange !== undefined ? data.ageRange : existing.ageRange,
        preferredLanguage: data.preferredLanguage || existing.preferredLanguage || 'km',
        skinConcerns: data.skinConcerns && data.skinConcerns.length > 0 ? data.skinConcerns : existing.skinConcerns || [],
        acneDetails: data.acneDetails || existing.acneDetails || '',
        passwordHash: passwordHash || existing.passwordHash,
        hasPassword: hasPassword || existing.hasPassword,
      };
      // Save locally first to prevent UI stalls
      setUserProfile(updatedProfile);
      saveMockUser(updatedProfile, false);

      // Async Firestore write in background without blocking
      const userRef = doc(db, 'users', targetUid);
      const writeData = {
        ...updatedProfile,
        updatedAt: serverTimestamp(),
      };
      setDoc(userRef, writeData, { merge: true })
        .then(() => console.log("【Firestore】更新已有用户资料成功 (UID: " + targetUid + ")"))
        .catch((err: any) => console.warn('【Firestore】更新用户资料提示 (非阻塞):', err?.message || err));

      return updatedProfile;
    }

    // Initial points for new account is 0 (customer can claim the 15 bonus points in missions)
    const startingPoints = 0;
    localStorage.setItem('lumimei_guest_points', '0');

    // Ensure task-new-customer is ready for the customer to claim by themselves
    let existingCompleted: string[] = [];
    try {
      existingCompleted = JSON.parse(localStorage.getItem('lumimei_completed_mission_tasks') || '[]');
    } catch {}
    const nextCompletedTasks = existingCompleted.filter((id) => id !== 'task-new-customer');
    localStorage.setItem('lumimei_completed_mission_tasks', JSON.stringify(nextCompletedTasks));
    localStorage.removeItem('lumimei_claimed_new_customer_bonus');
    localStorage.removeItem(`lumimei_claimed_new_customer_bonus_${uid}`);

    // Clear old browser storage caches but keep clean state
    localStorage.removeItem('lumimei_user_photo_url');
    localStorage.removeItem('lumimei_user_orders');
    localStorage.removeItem('lumimei_is_fb_top_friend');
    localStorage.removeItem('lumimei_quiz_saved_answers');
    localStorage.removeItem('lumimei_quiz_pending_questions');
    localStorage.removeItem('lumimei_quiz_answered_ids');
    localStorage.removeItem('lumimei_quiz_answered_once_ids');

    const newProfile: UserProfile = {
      uid,
      displayName: exactName,
      fullName: exactName,
      phoneNumber,
      telegram: data.telegram || '',
      gender: data.gender || '',
      ageRange: data.ageRange || '',
      passwordHash,
      hasPassword,
      preferredLanguage: data.preferredLanguage || 'km',
      skinConcerns: data.skinConcerns || [],
      acneDetails: data.acneDetails || '',
      role: 'user',
      points: 0, // Starting points are 0; user claims 15 points on the points page
      claimedNewCustomerBonus: false,
      totalSpent: 0,
      tier: 'normal',
      isVip: false,
      isVvip: false,
      isFacebookTopFriend: false,
      consentAccepted: true,
      consentVersion: '1.0',
      createdAt: new Date(),
    };

    // Save customer profile directly to local state and localStorage immediately
    saveMockUser(newProfile, false);
    setUserProfile(newProfile);

    // Save to Firestore asynchronously without blocking navigation or UI
    const userRef = doc(db, 'users', uid);
    setDoc(userRef, {
      uid,
      name: exactName || "新用户",
      displayName: exactName,
      fullName: exactName,
      phoneNumber,
      telegram: data.telegram || '',
      gender: data.gender || '',
      ageRange: data.ageRange || '',
      passwordHash,
      hasPassword,
      preferredLanguage: data.preferredLanguage || 'km',
      skinConcerns: data.skinConcerns || [],
      acneDetails: data.acneDetails || '',
      role: 'user',
      points: 0,
      claimedNewCustomerBonus: false,
      totalSpent: 0,
      tier: 'normal',
      createdAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    }, { merge: true })
      .then(() => console.log("【Firestore】新用户资料异步写入成功！UID:", uid))
      .catch((dbErr: any) => console.warn("【Firestore】新用户资料写入提示 (非阻塞):", dbErr?.message || dbErr));

    // Dual-write to backend server to ensure admin dashboard synchronization
    try {
      fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uid,
          uid,
          fullName: exactName,
          displayName: exactName,
          phoneNumber,
          telegram: data.telegram || '',
          gender: data.gender || '',
          ageRange: data.ageRange || '',
          skinConcerns: data.skinConcerns || [],
          points: 0,
          claimedNewCustomerBonus: false,
          tier: 'normal',
          role: 'user',
        }),
      }).catch(() => {});
    } catch {}

    setUserProfile(newProfile);
    return newProfile;
  };

  // Update User Profile
  const updateUserProfile = async (data: Partial<UserProfile>): Promise<void> => {
    const uid = auth.currentUser?.uid || currentUser?.uid || userProfile?.uid;
    if (!uid && !userProfile) throw new Error('អ្នកមិនទាន់បានចូលប្រើប្រាស់ទេ។');

    const { uid: _u, role: _r, phoneNumber: _p, ...allowedUpdates } = data as any;

    const updatedProfile = userProfile ? { ...userProfile, ...allowedUpdates } : null;
    if (updatedProfile) {
      saveMockUser(updatedProfile, false);
      setUserProfile(updatedProfile);

      // Direct write to Firestore users collection: doc(db, 'users', auth.currentUser.uid)
      const targetUid = auth.currentUser?.uid || uid;
      if (targetUid) {
        const userRef = doc(db, 'users', targetUid);
        setDoc(userRef, { ...allowedUpdates, updatedAt: serverTimestamp() }, { merge: true })
          .catch((dbErr: any) => console.warn('Firestore user update error (non-blocking):', dbErr?.message || dbErr));
      }

      // Dispatch global event so all components update immediately
      window.dispatchEvent(new Event('pointsUpdated'));
    }
  };

  // Update Phone Number after new OTP verification
  const updateUserPhoneNumber = async (confirmationResult: ConfirmationResult, code: string): Promise<void> => {
    if (!currentUser) throw new Error('អ្នកមិនទាន់បានចូលប្រើប្រាស់ទេ។');

    try {
      // Build credential from confirmationResult & code
      const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, code);
      await updatePhoneNumber(currentUser, credential);

      const newPhone = currentUser.phoneNumber || '';

      // Update Firestore user profile
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(
          userRef,
          {
            phoneNumber: newPhone,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (dbErr: any) {
        console.error('Firestore update phone error in users collection:', dbErr?.message || dbErr);
      }

      setUserProfile((prev) => (prev ? { ...prev, phoneNumber: newPhone } : null));
    } catch (error: any) {
      const message = getKhmerErrorMessage(error.code || '');
      throw new Error(message);
    }
  };

  // Login with Name / Phone Number + Password / PIN
  // 【登录姓名校验】客户登录时需要输入电话号码和姓名。系统比对首次创建时保存的姓名与这次登录输入的姓名是否完全一致
  const loginWithPassword = async (
    identifier: string,
    password: string,
    phoneInput?: string
  ): Promise<UserProfile> => {
    if (!identifier || !password) {
      throw new Error('សូមបញ្ចូលឈ្មោះ និងពាក្យសម្ងាត់ ឬលេខ PIN របស់អ្នក។ (请输入姓名与密码)');
    }

    const cleanId = identifier.trim();

    // Check for Admin Credentials (Username: admin | Password: Lumimei@2026 or 888888)
    if (cleanId.toLowerCase() === 'admin' && (password === 'Lumimei@2026' || password === '888888')) {
      const adminProfile: UserProfile = {
        uid: 'admin_1',
        displayName: 'Administrator (Lumimei)',
        fullName: 'Admin Lumimei',
        phoneNumber: '+85511223355',
        preferredLanguage: 'km',
        skinConcerns: [],
        acneDetails: '',
        role: 'superadmin',
        points: 9999,
        totalSpent: 0,
        tier: 'diamond',
        isVip: true,
        isVvip: true,
        isFacebookTopFriend: false,
        consentAccepted: true,
        consentVersion: '1.0',
        hasPassword: true,
        createdAt: new Date(),
      };

      // Set admin token and profile for AdminDashboard access
      localStorage.setItem('lumimei_admin_jwt_token', 'admin_token_' + Date.now());
      localStorage.setItem('lumimei_admin_profile', JSON.stringify({
        id: 'admin_1',
        username: 'admin',
        role: 'superadmin',
      }));

      const syntheticAdminUser: any = {
        uid: 'admin_1',
        phoneNumber: '+85511223355',
        displayName: 'Administrator',
        photoURL: null,
        email: 'admin@lumimei.com',
      };

      setCurrentUser(syntheticAdminUser);
      setUserProfile(adminProfile);
      localStorage.setItem(
        'lumimei_auth_session',
        JSON.stringify({ uid: 'admin_1', phoneNumber: '+85511223355' })
      );
      return adminProfile;
    }

    // Determine target Phone and Input Name
    const isIdPhone = isLikelyPhoneNumber(cleanId);
    let targetPhone = '';
    let inputName = '';

    if (phoneInput && isLikelyPhoneNumber(phoneInput)) {
      targetPhone = phoneInput.trim();
      if (!isIdPhone) {
        inputName = cleanId;
      }
    } else if (isIdPhone) {
      targetPhone = cleanId;
      inputName = '';
    } else {
      inputName = cleanId;
      targetPhone = '';
    }

    let profile: UserProfile | null = null;
    let verifyPassed = false;

    // 【登录姓名校验】比对首次登记姓名与本次登录姓名（仅在同时提供了电话和姓名且姓名非纯手机号时比对）
    if (targetPhone && inputName && !isLikelyPhoneNumber(inputName)) {
      const verifyRes = await verifyCustomerLoginName(targetPhone, inputName);
      if (!verifyRes.allowed) {
        if (verifyRes.reason === 'forbidden' || verifyRes.reason === 'server_error') {
          throw new Error('系统错误，请稍后重试');
        }
        if (verifyRes.reason === 'name_mismatch') {
          throw new Error('姓名与注册信息不符,请核实后重试');
        }
        if (verifyRes.reason === 'not_found') {
          throw new Error('未找到该手机号码的客户账户，请核实后重试或前往注册');
        }
        throw new Error(verifyRes.errorZh || verifyRes.error || '系统错误，请稍后重试');
      }
      profile = verifyRes.user || null;
      verifyPassed = true;
    }

    if (!profile) {
      try {
        if (targetPhone) {
          profile = await findUserByPhone(targetPhone);
        } else {
          profile = await findUserByNameOrPhone(cleanId);
        }
      } catch (findErr: any) {
        if (findErr?.status === 403 || findErr?.code === 'permission-denied' || String(findErr?.message || '').includes('系统')) {
          throw new Error('系统错误，请稍后重试');
        }
        throw findErr;
      }
    }

    if (!profile) {
      throw new Error(targetPhone ? '未找到该手机号码的客户账户，请核实后重试或前往注册' : '未找到该客户账户，请核实姓名后重试或前往注册');
    }

    // 若此前尚未做过校验，再次核验数据库登记姓名与登录姓名
    if (inputName && targetPhone && !verifyPassed && !isLikelyPhoneNumber(inputName)) {
      const candidates = [
        profile.initialFullName,
        profile.fullName,
        profile.displayName,
        (profile as any).name,
        (profile as any).telegram,
      ]
        .filter(Boolean)
        .map((n: string) => String(n).trim().toLowerCase());

      const normalizeClean = (str: string) => str.toLowerCase().replace(/[\s\-_.,#@]+/g, '');
      const inLower = inputName.trim().toLowerCase();
      const inNorm = normalizeClean(inputName);

      const isNameMatch = candidates.length === 0 || candidates.some((cand) => {
        const cLower = cand.trim().toLowerCase();
        const cNorm = normalizeClean(cand);
        return (
          cLower === inLower ||
          cLower.includes(inLower) ||
          inLower.includes(cLower) ||
          (inNorm.length >= 2 && (cNorm.includes(inNorm) || inNorm.includes(cNorm)))
        );
      });

      if (!isNameMatch) {
        throw new Error('姓名与注册信息不符,请核实后重试');
      }
    }

    // Check if user has set a password/PIN
    const plainPwd = (profile as any).loginPassword || (profile as any).password || (profile as any).pin;
    if (!profile.passwordHash) {
      if (plainPwd && String(plainPwd) === String(password)) {
        const hashed = await hashPassword(password);
        try {
          const userRef = doc(db, 'users', profile.uid);
          await updateDoc(userRef, { passwordHash: hashed, hasPassword: true, updatedAt: serverTimestamp() });
        } catch (err: any) {
          console.warn('Firestore passwordHash upgrade notice:', err?.message || err);
        }
        profile.passwordHash = hashed;
        profile.hasPassword = true;
      } else {
        // Check if local password matches (fallback)
        const localPwd = localStorage.getItem(`lumimei_pwd_${cleanId}`) || (profile.phoneNumber ? localStorage.getItem(`lumimei_pwd_${profile.phoneNumber}`) : null);
        if (localPwd && localPwd === password) {
          // Upgrade with hash
          const hashed = await hashPassword(password);
          try {
            const userRef = doc(db, 'users', profile.uid);
            await updateDoc(userRef, { passwordHash: hashed, hasPassword: true, updatedAt: serverTimestamp() });
          } catch (err: any) {
            console.warn('Firestore passwordHash update notice in users collection:', err?.message || err);
          }
          profile.passwordHash = hashed;
          profile.hasPassword = true;
        } else {
          throw new Error('គណនីនេះមិនទាន់បានកំណត់ពាក្យសម្ងាត់ទេ។ សូមជ្រើសរើសផ្ទាំង «លេខកូដ OTP» ដើម្បីចូលប្រើប្រាស់។');
        }
      }
    } else {
      const hashed = await hashPassword(password);
      if (profile.passwordHash !== hashed && (!plainPwd || String(plainPwd) !== String(password))) {
        throw new Error('ពាក្យសម្ងាត់ ឬលេខ PIN មិនត្រឹមត្រូវទេ។ សូមព្យាយាមម្ដងទៀត។ (密码或PIN不正确)');
      }
    }

    // 登录后从 Firestore 读取头像及云端资料
    try {
      const cloudData = await fetchProfileFromFirestore(profile.uid);
      if (cloudData) {
        profile = { ...profile, ...cloudData };
        if (cloudData.photoURL) {
          safeSetItem('lumimei_user_photo_url', cloudData.photoURL);
        }
        saveMockUser(profile, false);
      }
    } catch (cloudErr) {
      console.warn('【AuthContext】loginWithPassword 读取 Firestore 头像提示:', cloudErr);
    }

    const syntheticUser: any = {
      uid: profile.uid,
      phoneNumber: profile.phoneNumber,
      displayName: profile.displayName || profile.fullName,
      photoURL: profile.photoURL || null,
      email: null,
    };

    setCurrentUser(syntheticUser);
    setUserProfile(profile);
    localStorage.setItem(
      'lumimei_auth_session',
      JSON.stringify({ uid: profile.uid, phoneNumber: profile.phoneNumber })
    );
    return profile;
  };

  // Register with Password Directly
  const registerWithPassword = async (data: {
    displayName: string;
    fullName?: string;
    phoneNumber: string;
    password: string;
    telegram?: string;
    gender?: string;
    ageRange?: string;
    location?: string;
    skinConcerns?: string[];
    acneDetails?: string;
    preferredLanguage?: 'km' | 'zh' | 'en';
  }): Promise<UserProfile> => {
    const { phoneNumber, password, displayName, fullName, telegram, gender, ageRange, location, skinConcerns, acneDetails, preferredLanguage } = data;
    
    if (!phoneNumber) throw new Error('សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក។');
    if (!password || password.length < 6) throw new Error('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ 6 តួអក្សរ។');

    const cleanName = (fullName || displayName || '').trim() || 'អ្នកប្រើប្រាស់';
    const digits = phoneNumber.replace(/\D/g, '');
    const uid = `user_${Date.now()}_${digits.slice(-6)}`;
    const hashedPassword = await hashPassword(password);

    // Initial points for new account is 0 (customer can claim the 15 bonus points in missions)
    const existing = await findUserByPhone(phoneNumber);
    const targetUid = existing?.uid || uid;
    const isAlreadyClaimed = existing?.claimedNewCustomerBonus === true;
    const currentPoints = typeof existing?.points === 'number' ? existing.points : 0;
    localStorage.setItem('lumimei_guest_points', currentPoints.toString());

    // Clean up task-new-customer so new user sees "ទទួលយក" and can claim it by themselves
    let existingCompleted: string[] = [];
    try {
      existingCompleted = JSON.parse(localStorage.getItem('lumimei_completed_mission_tasks') || '[]');
    } catch {}
    const nextCompletedTasks = isAlreadyClaimed
      ? Array.from(new Set([...existingCompleted, 'task-new-customer']))
      : existingCompleted.filter((id) => id !== 'task-new-customer');
    localStorage.setItem('lumimei_completed_mission_tasks', JSON.stringify(nextCompletedTasks));
    if (!isAlreadyClaimed) {
      localStorage.removeItem('lumimei_claimed_new_customer_bonus');
      localStorage.removeItem(`lumimei_claimed_new_customer_bonus_${targetUid}`);
    }

    // Clear old browser storage caches but keep clean state
    localStorage.removeItem('lumimei_user_photo_url');
    localStorage.removeItem('lumimei_user_orders');
    localStorage.removeItem('lumimei_is_fb_top_friend');
    localStorage.removeItem('lumimei_quiz_saved_answers');
    localStorage.removeItem('lumimei_quiz_pending_questions');
    localStorage.removeItem('lumimei_quiz_answered_ids');
    localStorage.removeItem('lumimei_quiz_answered_once_ids');

    const initialFullName = (
      existing?.initialFullName ||
      existing?.fullName ||
      existing?.displayName ||
      cleanName
    ).trim();
    const existingCreatedAt = existing?.createdAt || new Date();

    const newProfile: UserProfile = {
      ...(existing || {}),
      uid: targetUid,
      displayName: cleanName,
      fullName: cleanName,
      initialFullName, // 严格保留首次登记姓名
      phoneNumber,
      telegram: telegram || (existing ? existing.telegram : ''),
      gender: gender || (existing ? existing.gender : ''),
      ageRange: ageRange || (existing ? existing.ageRange : ''),
      location: location || (existing ? existing.location : ''),
      passwordHash: hashedPassword,
      hasPassword: true,
      preferredLanguage: preferredLanguage || (existing ? existing.preferredLanguage : 'km'),
      skinConcerns: skinConcerns || (existing ? existing.skinConcerns : []),
      acneDetails: acneDetails || (existing ? existing.acneDetails : ''),
      role: (existing ? existing.role : 'user'),
      points: currentPoints,
      claimedNewCustomerBonus: isAlreadyClaimed,
      totalSpent: existing ? (existing.totalSpent || 0) : 0,
      tier: existing ? (existing.tier || 'normal') : 'normal',
      isVip: existing ? Boolean(existing.isVip) : false,
      isVvip: existing ? Boolean(existing.isVvip) : false,
      isFacebookTopFriend: existing ? Boolean(existing.isFacebookTopFriend) : false,
      consentAccepted: true,
      consentVersion: '1.0',
      createdAt: existingCreatedAt,
      updatedAt: new Date().toISOString(),
    };

    // 1. Save customer profile directly to Firestore using UID as document ID
    try {
      await ensureFirebaseAuth();
      const userRef = doc(db, 'users', targetUid);
      await setDoc(userRef, {
        uid: targetUid,
        name: cleanName || "新用户",
        displayName: cleanName,
        fullName: cleanName,
        initialFullName,
        phoneNumber,
        telegram: telegram || (existing ? existing.telegram : ''),
        gender: gender || (existing ? existing.gender : ''),
        ageRange: ageRange || (existing ? existing.ageRange : ''),
        passwordHash: hashedPassword,
        hasPassword: true,
        preferredLanguage: preferredLanguage || (existing ? existing.preferredLanguage : 'km'),
        skinConcerns: skinConcerns || (existing ? existing.skinConcerns : []),
        acneDetails: acneDetails || (existing ? existing.acneDetails : ''),
        role: existing ? existing.role : 'user',
        points: currentPoints,
        claimedNewCustomerBonus: isAlreadyClaimed,
        totalSpent: existing ? (existing.totalSpent || 0) : 0,
        tier: existing ? (existing.tier || 'normal') : 'normal',
        createdAt: typeof existingCreatedAt === 'string' ? existingCreatedAt : new Date(existingCreatedAt).toISOString(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (dbErr: any) {
      console.warn("Firestore 写入提示:", dbErr?.message || dbErr);
    }

    // 2. Save customer profile directly to localStorage('app_users') (deduplicated by phone)
    saveMockUser(newProfile, false);

    // 3. Dual-write to backend server to ensure admin dashboard synchronization
    try {
      fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetUid,
          uid: targetUid,
          fullName: cleanName,
          displayName: cleanName,
          initialFullName,
          phoneNumber,
          telegram: telegram || '',
          gender: gender || '',
          ageRange: ageRange || '',
          location: location || '',
          skinConcerns: skinConcerns || [],
          acneDetails: acneDetails || '',
          points: currentPoints,
          claimedNewCustomerBonus: isAlreadyClaimed,
          tier: newProfile.tier || 'normal',
          role: 'user',
        }),
      }).catch(() => {});
    } catch {}

    const syntheticUser: any = {
      uid: targetUid,
      phoneNumber,
      displayName: cleanName,
      photoURL: null,
      email: null,
    };

    setCurrentUser(syntheticUser);
    setUserProfile(newProfile);

    localStorage.setItem(
      'lumimei_auth_session',
      JSON.stringify({ uid: targetUid, phoneNumber })
    );

    return newProfile;
  };

  // Set / Update Password for Logged-in User
  const setUserPassword = async (password: string): Promise<void> => {
    if (!currentUser && !userProfile) throw new Error('អ្នកមិនទាន់បានចូលប្រើប្រាស់ទេ។');
    if (!password || password.length < 6) throw new Error('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ 6 តួអក្សរ។');

    const uid = userProfile?.uid || currentUser?.uid;
    if (!uid) throw new Error('រកមិនឃើញព័ត៌មានគណនី។');

    const hashedPassword = await hashPassword(password);
    try {
      await ensureFirebaseAuth();
      const userRef = doc(db, 'users', uid);
      const updateData = {
        passwordHash: hashedPassword,
        hasPassword: true,
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, updateData, { merge: true });
    } catch (err: any) {
      console.error('Firestore update password failed in users collection:', err?.message || err);
    }

    setUserProfile((prev) => (prev ? { ...prev, passwordHash: hashedPassword, hasPassword: true } : null));
    if (userProfile?.phoneNumber) {
      localStorage.setItem(`lumimei_pwd_${userProfile.phoneNumber}`, password);
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    localStorage.removeItem('lumimei_user_photo_url');
    localStorage.removeItem('lumimei_pending_registration');
    localStorage.removeItem('lumimei_auth_session');
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setUserProfile(null);
  };

  // Reload Profile
  const reloadUserProfile = async (): Promise<void> => {
    const uid = currentUser?.uid || auth.currentUser?.uid;
    if (uid) {
      try {
        const cloudData = await fetchProfileFromFirestore(uid);
        if (cloudData) {
          if (cloudData.photoURL) {
            safeSetItem('lumimei_user_photo_url', cloudData.photoURL);
          }
          setUserProfile((prev) => {
            const merged = { ...(prev || { uid }), ...cloudData } as UserProfile;
            saveMockUser(merged, false);
            return merged;
          });
          return;
        }
      } catch (err) {
        console.warn('【AuthContext】reloadUserProfile 读取 Firestore 失败:', err);
      }
      const profile = await fetchProfile(uid);
      setUserProfile(profile);
    }
  };

  // Delete Account
  const deleteAccount = async (): Promise<void> => {
    if (!currentUser) throw new Error('អ្នកមិនទាន់បានចូលប្រើប្រាស់ទេ។');

    const uid = currentUser.uid;

    try {
      // Delete Firestore doc first
      try {
        const userRef = doc(db, 'users', uid);
        await deleteDoc(userRef);
      } catch (docErr: any) {
        console.error('Firestore doc delete failed in users collection:', docErr?.message || docErr);
      }

      // Delete Firebase Auth User if possible
      try {
        if (currentUser.delete) {
          await deleteUser(currentUser);
        }
      } catch {
        // ignore
      }

      setCurrentUser(null);
      setUserProfile(null);
    } catch (error: any) {
      const message = getKhmerErrorMessage(error.code || '');
      throw new Error(message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        sendOTP,
        verifyOTP,
        loginWithPassword,
        registerWithPassword,
        setUserPassword,
        loginWithFacebook,
        createUserProfile,
        updateUserProfile,
        logout,
        reloadUserProfile,
        deleteAccount,
        updateUserPhoneNumber,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
