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
  hashPassword,
  findUserByPhone,
  findUserByNameOrPhone,
  saveMockUser,
  getMockUsers,
} from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  sendOTP: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyOTP: (confirmationResult: ConfirmationResult, code: string) => Promise<{ isNewUser: boolean; user: User }>;
  loginWithPassword: (phoneNumber: string, password: string) => Promise<UserProfile>;
  registerWithPassword: (data: {
    displayName: string;
    fullName?: string;
    phoneNumber: string;
    password: string;
    telegram?: string;
    gender?: string;
    ageRange?: string;
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

  // Fetch profile directly from localStorage('app_users')
  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    const appUsers = getMockUsers();
    const found = appUsers.find((u) => u.uid === uid || (u as any).id === uid);
    return found || null;
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        let profile = await fetchProfile(user.uid);
        if (!profile && (user.displayName || user.photoURL)) {
          const exactName = (user.displayName || 'Facebook User').trim();
          const photo = user.photoURL || '';
          if (photo) {
            localStorage.setItem('lumimei_user_photo_url', photo);
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
            points: 0,
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
        } else if (profile && user.photoURL && !profile.photoURL) {
          profile = { ...profile, photoURL: user.photoURL };
          saveMockUser(profile, false);
        }
        setUserProfile(profile);
        setLoading(false);
      } else {
        // If not in Firebase Auth, check if user logged in with password stored in session
        try {
          const savedSession = localStorage.getItem('lumimei_auth_session');
          if (savedSession) {
            const parsed = JSON.parse(savedSession);
            if (parsed.uid) {
              const profile = await fetchProfile(parsed.uid);
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

  // Send OTP
  const sendOTP = async (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      return confirmationResult;
    } catch (error: any) {
      const message = getKhmerErrorMessage(error.code || error.message || '');
      throw new Error(message);
    }
  };

  // Verify OTP
  const verifyOTP = async (confirmationResult: ConfirmationResult, code: string): Promise<{ isNewUser: boolean; user: User }> => {
    try {
      const result = await confirmationResult.confirm(code);
      const user = result.user;
      setCurrentUser(user);

      // Check if user document exists in Firestore
      const profile = await fetchProfile(user.uid);
      setUserProfile(profile);

      return {
        isNewUser: !profile,
        user,
      };
    } catch (error: any) {
      const message = getKhmerErrorMessage(error.code || error.message || '');
      throw new Error(message);
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
          localStorage.setItem('lumimei_user_photo_url', photo);
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
              tier: 'normal',
              role: 'user',
            }),
          }).catch(() => {});
        } catch {}

        profile = newProfile;
      } else {
        // If profile exists and user logged in with Facebook, update photoURL or isFacebookTopFriend if needed
        if (user.photoURL && !profile.photoURL) {
          localStorage.setItem('lumimei_user_photo_url', user.photoURL);
        }
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
    const existing = await fetchProfile(uid);
    if (existing) {
      const updatedProfile: UserProfile = {
        ...existing,
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
      try {
        const userRef = doc(db, 'users', uid);
        const writeData = {
          ...updatedProfile,
          updatedAt: serverTimestamp(),
        };
        await setDoc(userRef, writeData, { merge: true });
      } catch (err: any) {
        console.error('Firestore update existing user profile failed in users collection:', err?.message || err);
      }
      setUserProfile(updatedProfile);
      return updatedProfile;
    }

    // Ensure new user starts with no photo, fresh 0 total spent, 0 points and fresh missions
    localStorage.removeItem('lumimei_user_photo_url');
    localStorage.removeItem('lumimei_user_orders');
    localStorage.removeItem('lumimei_is_fb_top_friend');
    localStorage.removeItem('lumimei_completed_mission_tasks');
    localStorage.removeItem('lumimei_guest_points');
    localStorage.removeItem('lumimei_quiz_saved_answers');
    localStorage.removeItem('lumimei_quiz_pending_questions');
    localStorage.removeItem('lumimei_quiz_answered_ids');

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
      points: 0,
      totalSpent: 0,
      tier: 'normal',
      isVip: false,
      isVvip: false,
      isFacebookTopFriend: false,
      consentAccepted: true,
      consentVersion: '1.0',
      createdAt: new Date(),
    };

    // Save to Firestore using UID as document ID
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
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
        totalSpent: 0,
        tier: 'normal',
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      console.log("【调试】Firestore 数据写入成功！UID:", uid);
    } catch (dbErr: any) {
      console.warn("Firestore 写入提示:", dbErr?.message || dbErr);
    }

    // Save customer profile directly to localStorage('app_users')
    saveMockUser(newProfile, false);

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
    if (!currentUser) throw new Error('អ្នកមិនទាន់បានចូលប្រើប្រាស់ទេ។');

    const uid = currentUser.uid;
    const { uid: _u, role: _r, phoneNumber: _p, ...allowedUpdates } = data as any;

    const updatedProfile = userProfile ? { ...userProfile, ...allowedUpdates } : null;
    if (updatedProfile) {
      saveMockUser(updatedProfile, false);
      setUserProfile(updatedProfile);
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
  const loginWithPassword = async (identifier: string, password: string): Promise<UserProfile> => {
    if (!identifier || !password) {
      throw new Error('សូមបញ្ចូលឈ្មោះ និងពាក្យសម្ងាត់ ឬលេខ PIN របស់អ្នក។');
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

    let profile = await findUserByNameOrPhone(cleanId);
    
    if (!profile) {
      // Check local storage fallback by identifier
      const localSession = localStorage.getItem(`lumimei_user_profile_${cleanId}`);
      if (localSession) {
        try {
          profile = JSON.parse(localSession);
        } catch {
          // ignore
        }
      }
    }

    if (!profile) {
      // If profile does not exist yet, auto-create account with name and password/PIN
      const hashed = await hashPassword(password);
      const uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newProfile: UserProfile = {
        uid,
        displayName: cleanId,
        fullName: cleanId,
        phoneNumber: cleanId.startsWith('+') || /^\d+$/.test(cleanId) ? cleanId : '',
        preferredLanguage: 'km',
        skinConcerns: [],
        acneDetails: '',
        role: 'user',
        points: 0,
        totalSpent: 0,
        tier: 'normal',
        isVip: false,
        isVvip: false,
        isFacebookTopFriend: false,
        consentAccepted: true,
        consentVersion: '1.0',
        hasPassword: true,
        passwordHash: hashed,
        createdAt: new Date(),
      };

      // Save directly to localStorage('app_users')
      saveMockUser(newProfile, false);

      // Dual-write to backend server to ensure admin dashboard synchronization
      try {
        fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: uid,
            uid,
            fullName: cleanId,
            displayName: cleanId,
            phoneNumber: cleanId.startsWith('+') || /^\d+$/.test(cleanId) ? cleanId : '',
            points: 0,
            tier: 'normal',
            role: 'user',
          }),
        }).catch(() => {});
      } catch {}

      localStorage.setItem(`lumimei_user_profile_${cleanId}`, JSON.stringify(newProfile));
      localStorage.setItem(`lumimei_pwd_${cleanId}`, password);

      const syntheticUser: any = {
        uid: newProfile.uid,
        phoneNumber: newProfile.phoneNumber,
        displayName: newProfile.displayName,
        photoURL: null,
        email: null,
      };

      setCurrentUser(syntheticUser);
      setUserProfile(newProfile);
      localStorage.setItem(
        'lumimei_auth_session',
        JSON.stringify({ uid: newProfile.uid, phoneNumber: newProfile.phoneNumber })
      );
      return newProfile;
    }

    // Check if user has set a password/PIN
    if (!profile.passwordHash) {
      // Check if local password matches (fallback)
      const localPwd = localStorage.getItem(`lumimei_pwd_${cleanId}`) || (profile.phoneNumber ? localStorage.getItem(`lumimei_pwd_${profile.phoneNumber}`) : null);
      if (localPwd && localPwd === password) {
        // Upgrade with hash
        const hashed = await hashPassword(password);
        try {
          const userRef = doc(db, 'users', profile.uid);
          await updateDoc(userRef, { passwordHash: hashed, hasPassword: true, updatedAt: serverTimestamp() });
        } catch (err: any) {
          console.error('Firestore passwordHash update failed in users collection:', err?.message || err);
        }
        profile.passwordHash = hashed;
        profile.hasPassword = true;
      } else {
        throw new Error('គណនីនេះមិនទាន់បានកំណត់ពាក្យសម្ងាត់ទេ។ សូមជ្រើសរើសផ្ទាំង «លេខកូដ OTP» ដើម្បីចូលប្រើប្រាស់។');
      }
    } else {
      const hashed = await hashPassword(password);
      if (profile.passwordHash !== hashed) {
        throw new Error('ពាក្យសម្ងាត់ ឬលេខ PIN មិនត្រឹមត្រូវទេ។ សូមព្យាយាមម្ដងទៀត។');
      }
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

    // Save session in local storage
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
    skinConcerns?: string[];
    acneDetails?: string;
    preferredLanguage?: 'km' | 'zh' | 'en';
  }): Promise<UserProfile> => {
    const { phoneNumber, password, displayName, fullName, telegram, gender, ageRange, skinConcerns, acneDetails, preferredLanguage } = data;
    
    if (!phoneNumber) throw new Error('សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក។');
    if (!password || password.length < 6) throw new Error('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ 6 តួអក្សរ។');

    const cleanName = (fullName || displayName || '').trim() || 'អ្នកប្រើប្រាស់';
    const digits = phoneNumber.replace(/\D/g, '');
    const uid = `user_${Date.now()}_${digits.slice(-6)}`;
    const hashedPassword = await hashPassword(password);

    // Clear old browser storage caches
    localStorage.removeItem('lumimei_user_photo_url');
    localStorage.removeItem('lumimei_user_orders');
    localStorage.removeItem('lumimei_is_fb_top_friend');
    localStorage.removeItem('lumimei_completed_mission_tasks');
    localStorage.removeItem('lumimei_guest_points');
    localStorage.removeItem('lumimei_quiz_saved_answers');
    localStorage.removeItem('lumimei_quiz_pending_questions');
    localStorage.removeItem('lumimei_quiz_answered_ids');

    const newProfile: UserProfile = {
      uid,
      displayName: cleanName,
      fullName: cleanName,
      phoneNumber,
      telegram: telegram || '',
      gender: gender || '',
      ageRange: ageRange || '',
      passwordHash: hashedPassword,
      hasPassword: true,
      preferredLanguage: preferredLanguage || 'km',
      skinConcerns: skinConcerns || [],
      acneDetails: acneDetails || '',
      role: 'user',
      points: 0, // Initial welcome points (0 pts)
      totalSpent: 0,
      tier: 'normal',
      isVip: false,
      isVvip: false,
      isFacebookTopFriend: false,
      consentAccepted: true,
      consentVersion: '1.0',
      createdAt: new Date(),
    };

    // 1. Save customer profile directly to Firestore using UID as document ID
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        uid,
        name: cleanName || "新用户",
        displayName: cleanName,
        fullName: cleanName,
        phoneNumber,
        telegram: telegram || '',
        gender: gender || '',
        ageRange: ageRange || '',
        passwordHash: hashedPassword,
        hasPassword: true,
        preferredLanguage: preferredLanguage || 'km',
        skinConcerns: skinConcerns || [],
        acneDetails: acneDetails || '',
        role: 'user',
        points: 0,
        totalSpent: 0,
        tier: 'normal',
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      console.log("【调试】Firestore 数据写入成功！UID:", uid);
    } catch (dbErr: any) {
      console.warn("Firestore 写入提示:", dbErr?.message || dbErr);
    }

    // 2. Save customer profile directly to localStorage('app_users')
    saveMockUser(newProfile, false);

    // 2. Dual-write to backend server to ensure admin dashboard synchronization
    try {
      fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uid,
          uid,
          fullName: cleanName,
          displayName: cleanName,
          phoneNumber,
          telegram: telegram || '',
          gender: gender || '',
          ageRange: ageRange || '',
          skinConcerns: skinConcerns || [],
          acneDetails: acneDetails || '',
          points: 0,
          tier: 'normal',
          role: 'user',
        }),
      }).catch(() => {});
    } catch {}

    const syntheticUser: any = {
      uid,
      phoneNumber,
      displayName: cleanName,
      photoURL: null,
      email: null,
    };

    setCurrentUser(syntheticUser);
    setUserProfile(newProfile);

    localStorage.setItem(
      'lumimei_auth_session',
      JSON.stringify({ uid, phoneNumber })
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
    if (currentUser) {
      const profile = await fetchProfile(currentUser.uid);
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
