import React, { useState, useEffect, useRef } from 'react';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, formatToE164, checkPhoneNumberExists, maskPhoneNumber, db, collection, addDoc, UserProfile, saveMockUser, verifyCustomerLoginName, isLikelyPhoneNumber, findUserByPhone, explainAuthError, AuthErrorInfo } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { runWithLoading } from '../../utils/asyncUtils';
import {
  Phone,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Loader2,
  Info,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Edit3,
  Flame,
  Droplets,
  Zap,
  Sparkle,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Users,
  Send,
  ChevronDown,
  MapPin,
} from 'lucide-react';

interface PhoneLoginProps {
  onOTPSent: (confirmationResult: ConfirmationResult, phoneE164: string) => void;
  onNavigateHome: () => void;
  onOpenPrivacyPolicy?: () => void;
  noticeMessage?: string;
  initialMode?: 'register' | 'login';
  onFacebookSuccess?: () => void;
  onNavigateToAdmin?: () => void;
}

const COUNTRY_CODES = [
  { code: '+855', country: 'កម្ពុជា (Cambodia)', flag: '🇰🇭', defaultLength: 8 },
  { code: '+66', country: 'ថៃ (Thailand)', flag: '🇹🇭', defaultLength: 9 },
  { code: '+84', country: 'វៀតណាម (Vietnam)', flag: '🇻🇳', defaultLength: 9 },
  { code: '+86', country: 'ចិន (China)', flag: '🇨🇳', defaultLength: 11 },
  { code: '+856', country: 'ឡាវ (Laos)', flag: '🇱🇦', defaultLength: 9 },
  { code: '+1', country: 'អាមេរិក (USA)', flag: '🇺🇸', defaultLength: 10 },
];

export const GENDER_OPTIONS = [
  { value: 'ស្រី', label: 'ស្រី (Female)' },
  { value: 'ប្រុស', label: 'ប្រុស (Male)' },
  { value: 'ផ្សេងៗ', label: 'ផ្សេងៗ (Other)' },
];

export const AGE_RANGE_OPTIONS = [
  'ក្រោម 18',
  '18ឆ្នាំ - 24ឆ្នាំ',
  '25ឆ្នាំ - 34ឆ្នាំ',
  '35ឆ្នាំ - 44ឆ្នាំ',
  '44ឆ្នាំឡើង',
];

export const LOCATION_OPTIONS = [
  'រាជធានីភ្នំពេញ (Phnom Penh)',
  'ខេត្តកណ្តាល (Kandal)',
  'ខេត្តសៀមរាប (Siem Reap)',
  'ខេត្តបាត់ដំបង (Battambang)',
  'ខេត្តព្រះសីហនុ (Preah Sihanouk)',
  'ខេត្តកំពង់ចាម (Kampong Cham)',
  'ខេត្តកំពង់ស្ពឺ (Kampong Speu)',
  'ខេត្តកំពង់ធំ (Kampong Thom)',
  'ខេត្តកំពង់ឆ្នាំង (Kampong Chhnang)',
  'ខេត្តកំពត (Kampot)',
  'ខេត្តតាកែវ (Takeo)',
  'ខេត្តស្វាយរៀង (Svay Rieng)',
  'ខេត្តព្រៃវែង (Prey Veng)',
  'ខេត្តបន្ទាយមានជ័យ (Banteay Meanchey)',
  'ខេត្តពោធិ៍សាត់ (Pursat)',
  'ខេត្តកោះកុង (Koh Kong)',
  'ខេត្តក្រចេះ (Kratie)',
  'ខេត្តស្ទឹងត្រែង (Stung Treng)',
  'ខេត្តរតនគិរី (Ratanakiri)',
  'ខេត្តមណ្ឌលគិរី (Mondulkiri)',
  'ខេត្តព្រះវិហារ (Preah Vihear)',
  'ខេត្តឧត្តរមានជ័យ (Oddar Meanchey)',
  'ខេត្តប៉ៃលិន (Pailin)',
  'ខេត្តកែប (Kep)',
  'ខេត្តត្បូងឃ្មុំ (Tboung Khmum)',
];

export interface SkinConcernOption {
  id: string;
  nameKm: string;
  descKm: string;
  icon: string;
}

const SKIN_CONCERN_OPTIONS: SkinConcernOption[] = [
  { id: 'acne', nameKm: 'មុខមុន', descKm: 'មុនក្បាលខ្មៅ មុនរលាក មុនកប់សាច់', icon: '🔴' },
  { id: 'dullness', nameKm: 'មុខខ្មៅស្រអាប់', descKm: 'ស្បែកគ្មានពន្លឺ ស្លេកស្លាំង', icon: '🟤' },
  { id: 'pores', nameKm: 'មុខមានរន្ធញើសរីកធំ', descKm: 'រន្ធញើសចំហ ស្បែកខ្លាញ់', icon: '🔵' },
  { id: 'rashes', nameKm: 'មុខរោល', descKm: 'ប្រតិកម្ម អាឡែកស៊ី ងាយក្រហម', icon: '🟠' },
  { id: 'inflammation', nameKm: 'មុខរលាក', descKm: 'រលាកក្រហាយ ស្បែកខូចខាត', icon: '🔥' },
];

const ACNE_QUICK_TAGS = ['មុនក្បាលខ្មៅ', 'មុនរលាកក្រហម', 'មុនកប់សាច់', 'មុខអង្កាម', 'មុនអ័រម៉ូន', 'មុនក្បាលស', 'មុនខ្ទុះ'];

export const PhoneLogin: React.FC<PhoneLoginProps> = ({
  onOTPSent,
  onNavigateHome,
  onOpenPrivacyPolicy,
  noticeMessage,
  initialMode = 'register',
  onFacebookSuccess,
  onNavigateToAdmin,
}) => {
  const { currentUser, userProfile, sendOTP, loginWithFacebook, loginWithPassword, registerWithPassword, updateUserProfile } = useAuth();
  
  // Tabs: 'register' (បង្កើតគណនីថ្មី) or 'login' (ចូលប្រើប្រាស់)
  const [authMode, setAuthMode] = useState<'register' | 'login'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      if (hash === '#login' || hash.includes('login')) return 'login';
      if (hash === '#register' || hash.includes('register')) return 'register';
    }
    return initialMode;
  });

  // Login method in Login Tab: 'otp' | 'password'
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('otp');

  useEffect(() => {
    if (initialMode) {
      setAuthMode(initialMode);
    }
  }, [initialMode]);
  
  // Registration steps: 1 = បំពេញព័ត៌មាន, 2 = បង្កើតគណនី
  const [regStep, setRegStep] = useState<1 | 2>(1);

  // Form Fields for Step 1
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('ស្រី');
  const [ageRange, setAgeRange] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+855');
  const [rawPhone, setRawPhone] = useState('');
  const [location, setLocation] = useState('');
  const [telegram, setTelegram] = useState('');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [acneDetails, setAcneDetails] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Password Login Fields
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [fbLoading, setFbLoading] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authErrorInfo, setAuthErrorInfo] = useState<(AuthErrorInfo & { phone?: string }) | null>(null);
  const [existingAccountAlert, setExistingAccountAlert] = useState<{ phone: string; rawPhone: string } | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const isRecaptchaInitializingRef = useRef<boolean>(false);

  const handleFacebookLogin = async () => {
    setErrorMessage('');
    setAuthErrorInfo(null);
    setFbLoading(true);
    try {
      await loginWithFacebook();
      if (onFacebookSuccess) {
        onFacebookSuccess();
      } else {
        window.location.hash = '#dashboard';
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'មិនអាចចូលប្រើតាម Facebook បានទេ។ សូមព្យាយាមម្ដងទៀត។');
    } finally {
      setFbLoading(false);
    }
  };

  // Clear reCAPTCHA instance safely
  const resetRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
        console.log('【reCAPTCHA】已清理已有 reCAPTCHA 实例');
      } catch (err) {
        // Safe ignore
      }
      recaptchaVerifierRef.current = null;
    }
    const container = document.getElementById('recaptcha-container');
    if (container) {
      container.innerHTML = '';
    }
  };

  // Initialize RecaptchaVerifier on-demand and reuse it safely
  const getOrCreateRecaptchaVerifier = (): RecaptchaVerifier => {
    if (recaptchaVerifierRef.current) {
      console.log('【reCAPTCHA】复用现有 RecaptchaVerifier 实例');
      return recaptchaVerifierRef.current;
    }

    let rootContainer = document.getElementById('recaptcha-container');
    if (!rootContainer) {
      rootContainer = document.createElement('div');
      rootContainer.id = 'recaptcha-container';
      rootContainer.style.display = 'none';
      document.body.appendChild(rootContainer);
    }
    // Clean out any stale child nodes so grecaptcha never encounters previous renders
    rootContainer.innerHTML = '';

    // Create a fresh child target element for this verifier instance
    const targetElement = document.createElement('div');
    rootContainer.appendChild(targetElement);

    console.log('【reCAPTCHA】初始化全新 RecaptchaVerifier 实例...');

    const verifier = new RecaptchaVerifier(auth, targetElement, {
      size: 'invisible',
      callback: (token: any) => {
        console.log('【reCAPTCHA】验证成功 (Solved):', token ? 'Token received' : 'OK');
      },
      'expired-callback': () => {
        console.warn('【reCAPTCHA】验证已过期 (Expired)');
        resetRecaptcha();
        setErrorMessage('reCAPTCHA បានផុតកំណត់។ សូមព្យាយាមម្ដងទៀត។');
        setAuthErrorInfo({
          code: 'auth/captcha-check-failed',
          rawMessage: 'reCAPTCHA token expired',
          friendlyKm: 'reCAPTCHA បានផុតកំណត់។ សូមព្យាយាមម្ដងទៀត។',
          friendlyZh: 'reCAPTCHA 验证已过期，请重新点击发送。',
          hint: 'reCAPTCHA 验证已过期，请重新点击发送验证码。',
        });
        setLoading(false);
      },
    });

    recaptchaVerifierRef.current = verifier;
    return verifier;
  };

  useEffect(() => {
    return () => {
      resetRecaptcha();
    };
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d\s-]/g, '');
    setRawPhone(val);
    setErrorMessage('');
    setAuthErrorInfo(null);
    if (existingAccountAlert) {
      setExistingAccountAlert(null);
    }
  };

  // Check phone existence when user finishes typing or clicks away
  const handlePhoneBlur = async () => {
    if (authMode !== 'register') return;
    const cleanedDigits = rawPhone.replace(/\D/g, '');
    if (cleanedDigits.length >= 7) {
      const fullPhoneE164 = formatToE164(selectedCountryCode, rawPhone);
      try {
        setCheckingPhone(true);
        const existing = await findUserByPhone(fullPhoneE164);
        if (existing) {
          console.log("【提示】该手机号客户已存在，系统将更新该客户记录保持单行:", fullPhoneE164);
        }
      } catch {
        // ignore
      } finally {
        setCheckingPhone(false);
      }
    }
  };

  const toggleSkinConcern = (concernId: string) => {
    setErrorMessage('');
    if (selectedConcerns.includes(concernId)) {
      setSelectedConcerns(selectedConcerns.filter((id) => id !== concernId));
      if (concernId === 'acne') {
        setAcneDetails('');
      }
    } else {
      setSelectedConcerns([...selectedConcerns, concernId]);
    }
  };

  const handleAddAcneTag = (tag: string) => {
    if (!acneDetails.includes(tag)) {
      setAcneDetails(acneDetails ? `${acneDetails}, ${tag}` : tag);
    }
  };

  // Handle form submit with unblocked Firestore write and local storage guarantee
  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setErrorMessage('');
    setExistingAccountAlert(null);

    // 提取纯数字手机号
    const cleanPhone = (formatToE164(selectedCountryCode, rawPhone) || rawPhone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      alert("Please enter a valid phone number / សូមបញ្ចូលលេខទូរស័ព្ទ");
      setErrorMessage("សូមបញ្ចូលលេខទូរស័ព្ទឱ្យបានត្រឹមត្រូវ");
      return;
    }

    if (!location) {
      alert("សូមជ្រើសរើសទីតាំង (ខេត្ត/ក្រុង) របស់អ្នក");
      setErrorMessage("សូមជ្រើសរើសទីតាំង (ខេត្ត/ក្រុង) របស់អ្នក");
      return;
    }

    if (!telegram.trim()) {
      alert("សូមបំពេញលេខ Telegram ឬឈ្មោះ Telegram របស់អ្នក (តម្រូវឱ្យបំពេញ *)");
      setErrorMessage("សូមបំពេញលេខ Telegram ឬឈ្មោះ Telegram របស់អ្នក (តម្រូវឱ្យបំពេញ *)");
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      alert("សូមកំណត់ពាក្យសម្ងាត់ (Password) យ៉ាងហោចណាស់ 6 ខ្ទង់");
      setErrorMessage("សូមកំណត់ពាក្យសម្ងាត់ (Password) យ៉ាងហោចណាស់ 6 ខ្ទង់");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      alert("ពាក្យសម្ងាត់ផ្ទៀងផ្ទាត់មិនត្រូវគ្នាទេ សូមពិនិត្យមើលម្តងទៀត");
      setErrorMessage("ពាក្យសម្ងាត់ផ្ទៀងផ្ទាត់មិនត្រូវគ្នាទេ សូមពិនិត្យមើលម្តងទៀត");
      return;
    }

    const userData = {
      phoneNumber: cleanPhone,
      fullName: (fullName || "").trim() || 'អ្នកប្រើប្រាស់',
      gender: gender || "",
      age: ageRange || "",
      location: location || "",
      telegram: telegram.trim() || "",
      skinConcerns: selectedConcerns || [],
      acneDetails: selectedConcerns.includes('acne') ? acneDetails.trim() : '',
      createdAt: new Date().toISOString()
    };

    // 1. 强制先存本地，确保数据绝对不丢失
    localStorage.setItem(`user_${cleanPhone}`, JSON.stringify(userData));
    localStorage.setItem("latest_user", JSON.stringify(userData));
    localStorage.setItem("lumimei_pending_registration", JSON.stringify(userData));

    setLoading(true);

    // 2. 直接使用 Firestore SDK 注册并保存至 users/{auth.currentUser.uid}
    try {
      const regProfile = await registerWithPassword({
        displayName: userData.fullName,
        fullName: userData.fullName,
        phoneNumber: cleanPhone,
        password: regPassword,
        telegram: userData.telegram,
        gender: userData.gender || 'ស្រី',
        ageRange: userData.age || '18-24',
        location: userData.location,
        skinConcerns: userData.skinConcerns,
        acneDetails: userData.acneDetails,
        preferredLanguage: 'km',
      });

      const targetUid = auth.currentUser?.uid || regProfile?.uid;
      if (targetUid) {
        const userDocRef = doc(db, 'users', targetUid);
        await setDoc(userDocRef, {
          ...userData,
          uid: targetUid,
        }, { merge: true });
        console.log("【Firestore Success】用户资料直接存入 users/" + targetUid);
      }

      alert("Success! Data saved / ជោគជ័យ! ទិន្នន័យត្រូវបានរក្សាទុក");
    } catch (error: any) {
      console.warn("Registration notice:", error);
      alert(error?.message || "Notice: Data saved / ព័ត៌មានត្រូវបានកត់ត្រាទុក");
    } finally {
      setLoading(false);

      if (onFacebookSuccess) {
        onFacebookSuccess();
      } else {
        onNavigateHome();
      }
    }
  };

  // Aliases ensuring all submit triggers run handleFormSubmit
  const handleRegister = handleFormSubmit;
  const handleSubmit = handleFormSubmit;
  const handleDirectSubmit = handleFormSubmit;
  const handleRegisterWithPasswordDirect = handleFormSubmit;

  // Step 1 Validation & Proceed to Step 2
  const handleProceedToStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    return handleSubmit(e);
  };

  // Step 2: Create Account using Phone Number (or Direct Login)
  const handleCreateAccountOrLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setAuthErrorInfo(null);
    setExistingAccountAlert(null);

    const cleanedDigits = rawPhone.replace(/\D/g, '');

    if (!cleanedDigits) {
      setErrorMessage('សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក។');
      return;
    }

    if (cleanedDigits.length < 7 || cleanedDigits.length > 12) {
      setErrorMessage('លេខទូរស័ព្ទនេះមិនត្រឹមត្រូវទេ។');
      return;
    }

    // 格式化为严格的标准 E.164 格式 (+855 加去掉开头 0 的手机号码)
    const fullPhoneE164 = formatToE164(selectedCountryCode, rawPhone);
    console.log('【PhoneLogin】准备向 Firebase 发送 SMS 验证码，目标 E.164 号码:', fullPhoneE164);

    // 【登录姓名校验】如果是登录模式且输入了姓名，先核验姓名与电话号码首次注册信息是否一致
    const cleanInputName = fullName.trim();
    if (authMode === 'login' && cleanInputName && !isLikelyPhoneNumber(cleanInputName)) {
      setLoading(true);
      try {
        const verifyRes = await verifyCustomerLoginName(fullPhoneE164, cleanInputName);
        if (!verifyRes.allowed) {
          if (verifyRes.reason === 'forbidden' || verifyRes.reason === 'server_error') {
            setErrorMessage('系统错误，请稍后重试');
          } else if (verifyRes.reason === 'name_mismatch') {
            setErrorMessage('姓名与注册信息不符,请核实后重试');
          } else if (verifyRes.reason === 'not_found') {
            setErrorMessage('未找到该手机号码的客户账户，请核实后重试或前往注册');
          } else {
            setErrorMessage(verifyRes.errorZh || '系统错误，请稍后重试');
          }
          setLoading(false);
          return;
        }
      } catch (err: any) {
        if (err?.status === 403 || err?.code === 'permission-denied') {
          setErrorMessage('系统错误，请稍后重试');
          setLoading(false);
          return;
        }
      }
    }

    await runWithLoading(
      async () => {
        // If in registration mode, save the pending profile data in localStorage so VerifyPhone can complete the profile automatically
        if (authMode === 'register') {
          const pendingData = {
            displayName: fullName.trim(),
            fullName: fullName.trim(),
            phoneNumber: fullPhoneE164,
            telegram: telegram.trim(),
            gender: gender || 'ស្រី',
            ageRange: ageRange || '',
            location: location || '',
            skinConcerns: selectedConcerns,
            acneDetails: acneDetails.trim(),
            password: regPassword || undefined,
            preferredLanguage: 'km',
          };
          localStorage.setItem('lumimei_pending_registration', JSON.stringify(pendingData));
        } else {
          localStorage.removeItem('lumimei_pending_registration');
        }

        // 仅初始化一次，复用已有 RecaptchaVerifier 实例
        const appVerifier = await getOrCreateRecaptchaVerifier();
        console.log('【PhoneLogin】正在执行 sendOTP (signInWithPhoneNumber)...');
        const confirmation = await sendOTP(fullPhoneE164, appVerifier);
        console.log('【PhoneLogin】sendOTP 成功，准备跳转至 OTP 验证页面');
        onOTPSent(confirmation, fullPhoneE164);
      },
      setLoading,
      {
        timeoutMs: 30000,
        showErrorAlert: false,
        onError: (err: any) => {
          console.warn('【PhoneLogin 发送短信提示】:', {
            code: err?.code,
            message: err?.message,
            rawMessage: err?.rawMessage,
            hint: err?.hint,
            phone: fullPhoneE164,
          });

          // 发送失败时重置 reCAPTCHA，以便下次点击获得全新有效 token，避免死锁
          resetRecaptcha();

          const diag = explainAuthError(err);
          setErrorMessage(diag.friendlyKm);
          setAuthErrorInfo({
            ...diag,
            phone: fullPhoneE164,
          });
        },
      }
    );
  };

  // Direct Login with Password / PIN
  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setExistingAccountAlert(null);

    const cleanName = fullName.trim();
    if (!cleanName) {
      setErrorMessage('សូមបញ្ចូលឈ្មោះ ឬ លេខទូរស័ព្ទរបស់អ្នក (请输入姓名或手机号码)');
      return;
    }

    if (!loginPassword) {
      setErrorMessage('សូមបញ្ចូលពាក្យសម្ងាត់ ឬ លេខ PIN របស់អ្នក (请输入密码或PIN)');
      return;
    }

    await runWithLoading(
      async () => {
        let targetPhone: string | undefined = undefined;
        if (isLikelyPhoneNumber(cleanName)) {
          targetPhone = cleanName.startsWith('+') ? cleanName : formatToE164(selectedCountryCode, cleanName);
        } else if (rawPhone.trim()) {
          targetPhone = formatToE164(selectedCountryCode, rawPhone);
        }

        const loggedProfile = await loginWithPassword(cleanName, loginPassword, targetPhone);
        if (cleanName.toLowerCase() === 'admin' || loggedProfile?.role === 'admin' || loggedProfile?.role === 'superadmin') {
          if (onNavigateToAdmin) {
            onNavigateToAdmin();
          } else {
            window.location.hash = '#admin';
          }
          return;
        }
        if (onFacebookSuccess) {
          onFacebookSuccess();
        } else {
          onNavigateHome();
        }
      },
      setLoading,
      {
        timeoutMs: 30000,
        showErrorAlert: false,
        onError: (err: any) => {
          const errMsg = String(err?.message || '');
          if (err?.status === 403 || err?.code === 'permission-denied' || errMsg.includes('403') || errMsg.includes('系统错误')) {
            setErrorMessage('系统错误，请稍后重试');
          } else if (errMsg.includes('姓名与注册信息不符')) {
            setErrorMessage('姓名与注册信息不符,请核实后重试');
          } else if (errMsg.includes('未找到')) {
            setErrorMessage(errMsg);
          } else {
            setErrorMessage(errMsg || 'ឈ្មោះ ឬពាក្យសម្ងាត់/PIN មិនត្រឹមត្រូវទេ។');
          }
        },
      }
    );
  };

  // If user is already logged in with an account, show friendly status and prevent recreating account
  if (currentUser && userProfile) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 py-8">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 font-opensans">
              លោកអ្នកមានគណនីរួចរាល់ហើយ!
            </h2>
            <p className="text-sm text-slate-700 mt-2 font-medium">
              គណនីបច្ចុប្បន្ន៖ <span className="font-bold text-emerald-800 font-mono">{userProfile.displayName || userProfile.fullName || userProfile.phoneNumber}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              លោកអ្នកកំពុងស្ថិតក្នុងគណនីរួចរាល់ មិនចាំបាច់បង្កើតគណនីថ្មីទៀតទេ។
            </p>
          </div>
          <div className="space-y-2.5">
            <button
              onClick={() => {
                window.location.hash = '#dashboard';
              }}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-sm font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>ទៅកាន់ផ្ទាំងគ្រប់គ្រងគណនី (Dashboard)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateHome}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              « ត្រឡប់ទៅទំព័រដើម
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 py-8">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 relative">
        {/* Back Button */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-semibold mb-5 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ត្រឡប់ទៅទំព័រដើម</span>
        </button>

        {/* Notice Alert (e.g. Skin scan redirect notice) */}
        {noticeMessage && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200/90 rounded-2xl text-emerald-900 text-xs font-bold flex items-start gap-2.5 shadow-2xs animate-in fade-in">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span className="leading-relaxed font-battambang">{noticeMessage}</span>
          </div>
        )}

        {/* Error Alert with Firebase Diagnostic Details */}
        {(errorMessage || authErrorInfo) && (
          <div className="mb-5 p-4 bg-rose-50 border border-rose-200/90 rounded-2xl text-rose-900 text-xs shadow-sm animate-in fade-in space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-rose-100 text-rose-600 rounded-xl shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-rose-950 font-battambang leading-relaxed text-sm">
                  {errorMessage || authErrorInfo?.friendlyKm || 'មានបញ្ហាក្នុងការផ្ញើ SMS ឬផ្ទៀងផ្ទាត់'}
                </p>
                {authErrorInfo?.friendlyZh && (
                  <p className="text-rose-800 text-xs font-medium">
                    {authErrorInfo.friendlyZh}
                  </p>
                )}
                {authErrorInfo?.hint && (
                  <p className="text-slate-600 text-[11px] leading-relaxed pt-0.5">
                    👉 <strong>排查建议：</strong>{authErrorInfo.hint}
                  </p>
                )}
                {errorMessage.includes('មិនទាន់បានកំណត់ពាក្យសម្ងាត់') && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setLoginMethod('otp');
                      const cleanInput = fullName.trim();
                      if (isLikelyPhoneNumber(cleanInput)) {
                        setRawPhone(cleanInput);
                      }
                      setErrorMessage('');
                    }}
                    className="mt-2 w-full py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>« ប្ដូរទៅផ្ទាំង «លេខកូដ OTP» ដើម្បីចូលប្រើប្រាស់</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Technical Diagnostic Details requested by user for Firebase troubleshooting */}
            {authErrorInfo && (
              <div className="pt-2 border-t border-rose-200/70 font-mono text-[11px] bg-white/70 p-2.5 rounded-xl border border-rose-100 text-slate-700 space-y-1.5">
                <div className="flex items-center justify-between font-sans text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span>Firebase Debug Information</span>
                  <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-mono text-[10px]">
                    {authErrorInfo.code}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Error Code: </span>
                  <span className="font-bold text-rose-700 select-all">{authErrorInfo.code}</span>
                </div>
                {authErrorInfo.phone && (
                  <div>
                    <span className="text-slate-400">Target Phone (E.164): </span>
                    <span className="font-bold text-slate-900 select-all">{authErrorInfo.phone}</span>
                  </div>
                )}
                {authErrorInfo.rawMessage && (
                  <div className="break-all text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200/60 select-all">
                    <span className="text-slate-400 font-sans">Raw: </span>
                    {authErrorInfo.rawMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Existing Account Alert */}
        {existingAccountAlert && (
          <div className="mb-5 p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl text-amber-950 shadow-sm animate-in fade-in slide-in-from-top-2 space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-amber-200/90 text-amber-900 rounded-xl shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-amber-950">
                  លេខទូរស័ព្ទនេះមានគណនីរួចហើយ!
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  លេខទូរស័ព្ទ <span className="font-mono font-extrabold text-emerald-950 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-200">{maskPhoneNumber(existingAccountAlert.phone)}</span> បានចុះឈ្មោះក្នុងប្រព័ន្ធរួចរាល់ហើយ។ ប្រព័ន្ធបានប្តូរមកកាន់ផ្ទាំង <strong className="text-emerald-950 font-extrabold">«ចូលប្រើប្រាស់» (Login)</strong> ដោយស្វ័យប្រវត្តិ។
                </p>
                <p className="text-xs text-emerald-800 font-bold pt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>សូមចុចប៊ូតុង «ផ្ញើលេខកូដ OTP» ខាងក្រោមដើម្បីចូលប្រើប្រាស់។</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* MODE 1: CREATE ACCOUNT (2 STEPS)                      */}
        {/* ---------------------------------------------------- */}
        {authMode === 'register' ? (
          <div>
            {/* Header: បង្កើតគណនីរបស់អ្នក */}
            <div className="text-center mb-4">
              <h2 className="text-xl font-extrabold text-slate-900 font-opensans">
                បង្កើតគណនីរបស់អ្នក
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {regStep === 1
                  ? 'សូមបំពេញព័ត៌មានខាងក្រោម ដើម្បីទទួលបានការណែនាំផលិតផលស្បែកមុខត្រឹមត្រូវ'
                  : 'សូមពិនិត្យព័ត៌មានរបស់អ្នក មុនពេលបញ្ចប់ការចុះឈ្មោះ'}
              </p>
            </div>

            {/* Step Indicators placed below បង្កើតគណនីរបស់អ្នក */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                <span className={regStep === 1 ? 'text-emerald-700 font-extrabold' : 'text-slate-500'}>
                  ផ្ទាំងទី១៖ បំពេញព័ត៌មាន
                </span>
                <span className={regStep === 2 ? 'text-emerald-700 font-extrabold' : 'text-slate-500'}>
                  ផ្ទាំងទី២៖ បង្កើតគណនី
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    regStep >= 1 ? 'bg-emerald-600' : 'bg-slate-200'
                  }`}
                />
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    regStep === 2 ? 'bg-emerald-600' : 'bg-slate-200'
                  }`}
                />
              </div>
            </div>

            {/* ----------------- STEP 1: បំពេញព័ត៌មាន ----------------- */}
            {regStep === 1 ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. ឈ្មោះ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ឈ្មោះ ឬឈ្មោះហៅក្រៅ <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="ឧទាហរណ៍៖ សុខា / ចាន់នី"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>

                {/* 1.1 ភេទ និង អាយុ (នៅខាងក្រោម ឈ្មោះ ឬឈ្មោះហៅក្រៅ - ត្រូវនៅជួរជាមួយគ្នា ជា dropdown menu) */}
                <div className="grid grid-cols-2 gap-3">
                  {/* ភេទ */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ភេទ <span className="text-red-500">*</span></span>
                    </label>
                    <div className="relative">
                      <select
                        value={gender}
                        onChange={(e) => {
                          setGender(e.target.value);
                          setErrorMessage('');
                        }}
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none pr-8"
                      >
                        <option value="">-- ជ្រើសរើសភេទ --</option>
                        {GENDER_OPTIONS.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* អាយុ */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>អាយុ <span className="text-red-500">*</span></span>
                    </label>
                    <div className="relative">
                      <select
                        value={ageRange}
                        onChange={(e) => {
                          setAgeRange(e.target.value);
                          setErrorMessage('');
                        }}
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none pr-8"
                      >
                        <option value="">-- ជ្រើសរើសអាយុ --</option>
                        {AGE_RANGE_OPTIONS.map((age) => (
                          <option key={age} value={age}>
                            {age}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. លេខទូរស័ព្ទ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>លេខទូរស័ព្ទ <span className="text-red-500">*</span></span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedCountryCode}
                      onChange={(e) => setSelectedCountryCode(e.target.value)}
                      className="px-3 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>

                    <div className="relative flex-1 min-w-0">
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={rawPhone}
                        onChange={handlePhoneChange}
                        onBlur={handlePhoneBlur}
                        placeholder="12 345 678"
                        className={`w-full px-3.5 sm:px-4 py-3 bg-slate-50 border rounded-2xl text-base sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 placeholder:font-normal placeholder:text-slate-400 touch-manipulation min-h-[44px] transition-all ${
                          existingAccountAlert
                            ? 'border-red-400 focus:ring-red-400 bg-red-50/40 text-red-950'
                            : 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white'
                        }`}
                      />
                      {checkingPhone && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-slate-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        </div>
                      )}
                    </div>
                  </div>
                  {existingAccountAlert ? (
                    <p className="text-[11px] text-red-600 font-bold mt-1 pl-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>លេខនេះមានគណនីរួចហើយ — មិនអនុញ្ញាតឱ្យចុះឈ្មោះម្តងទៀតទេ</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1 pl-1">
                      ឧទាហរណ៍៖ 12 345 678 (មិនបាច់ដាក់លេខ 0 ខាងមុខ)
                    </p>
                  )}
                </div>

                {/* ទីតាំង (នៅខាងក្រោម លេខទូរស័ព្ទ * - មានទម្រង់ដូច ភេទ) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ទីតាំង <span className="text-red-500">*</span></span>
                  </label>
                  <div className="relative">
                    <select
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setErrorMessage('');
                      }}
                      required
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none pr-8"
                    >
                      <option value="">-- ជ្រើសរើសទីតាំង (ខេត្ត/ក្រុង) --</option>
                      {LOCATION_OPTIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* លេខ Telegram */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-sky-600" />
                      <span>លេខ Telegram ឬ ឈ្មោះតេឡេក្រាម <span className="text-red-500">*</span></span>
                    </span>
                    <span className="text-[10px] text-red-500 font-semibold">(តម្រូវឱ្យបំពេញ *)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={telegram}
                    onChange={(e) => {
                      setTelegram(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="ឧ. @username ឬ 012 345 678"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 pl-1">
                    សម្រាប់ទទួលការប្រឹក្សា និងព័ត៌មានកុម្ម៉ង់ទំនិញ
                  </p>
                </div>

                {/* ពាក្យសម្ងាត់ (Password) សម្រាប់ចូលប្រើប្រាស់ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ពាក្យសម្ងាត់ (Password) សម្រាប់ចូលប្រើប្រាស់ <span className="text-red-500">*</span></span>
                    </span>
                    <span className="text-[10px] text-red-500 font-semibold">(យ៉ាងហោច 6 ខ្ទង់ *)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="បញ្ចូលពាក្យសម្ងាត់យ៉ាងតិច 6 ខ្ទង់"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 pr-11 font-mono"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 pl-1">
                    កំណត់ពាក្យសម្ងាត់ដើម្បីអាចចូលប្រើបានភ្លាមៗ ជៀសវាងការរង់ចាំ SMS OTP នៅពេលក្រោយ
                  </p>
                </div>

                {/* បញ្ចូលពាក្យសម្ងាត់ម្តងទៀត (Confirm Password) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      <span>បញ្ជាក់ពាក្យសម្ងាត់ម្តងទៀត <span className="text-red-500">*</span></span>
                    </span>
                    {regConfirmPassword && (
                      <span className={`text-[11px] font-bold ${
                        regPassword === regConfirmPassword ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {regPassword === regConfirmPassword ? '✓ ត្រូវគ្នា' : '✗ មិនទាន់ត្រូវគ្នា'}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => {
                        setRegConfirmPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="បញ្ចូលពាក្យសម្ងាត់ផ្ទៀងផ្ទាត់ម្តងទៀត"
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 placeholder:text-slate-400 pr-11 font-mono ${
                        regConfirmPassword && regPassword !== regConfirmPassword
                          ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                          : 'border-slate-300 focus:ring-emerald-500'
                      }`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 4. បញ្ហាស្បែកមុខ (Multi-select) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>បញ្ហាស្បែកមុខ <span className="text-red-500">*</span></span>
                    </label>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                      ជ្រើសរើសបានច្រើន
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SKIN_CONCERN_OPTIONS.map((concern) => {
                      const isSelected = selectedConcerns.includes(concern.id);
                      return (
                        <button
                          key={concern.id}
                          type="button"
                          onClick={() => toggleSkinConcern(concern.id)}
                          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start justify-between ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{concern.icon}</span>
                            <div>
                              <div className={`text-xs font-bold ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                                {concern.nameKm}
                              </div>
                              <div className="text-[10px] text-slate-500 leading-tight">
                                {concern.descKm}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* SPECIAL REQUIREMENT: ពេលដែលអ្នកប្រើប្រាស់ជ្រើសរើស មុខមុន ត្រូវតែមានកន្លែងអោយអ្នកប្រើប្រាស់បំពេញ */}
                  {selectedConcerns.includes('acne') && (
                    <div className="mt-3 p-3.5 bg-rose-50/80 border border-rose-200 rounded-2xl animate-in fade-in slide-in-from-top-2">
                      <label className="block text-xs font-bold text-rose-900 mb-1.5 flex items-center gap-1.5">
                        <span>🔴</span>
                        <span>ពិពណ៌នាអំពីបញ្ហាមុនរបស់អ្នក <span className="text-red-500">*</span></span>
                      </label>
                      <textarea
                        value={acneDetails}
                        onChange={(e) => {
                          setAcneDetails(e.target.value);
                          setErrorMessage('');
                        }}
                        placeholder="ឧទាហរណ៍៖ ខ្ញុំមានមុនក្បាលខ្មៅនៅច្រមុះ និងមុនរលាកក្រហមនៅថ្ពាល់..."
                        rows={2}
                        className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder:text-slate-400 resize-none"
                      />

                      {/* Quick helper tags */}
                      <div className="mt-2">
                        <div className="text-[10px] text-rose-700 font-bold mb-1">
                          ចុចជ្រើសរើសប្រភេទមុនរហ័ស៖
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {ACNE_QUICK_TAGS.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleAddAcneTag(tag)}
                              className={`text-[10px] px-2 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                                acneDetails.includes(tag)
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Continue to Step 2 Button or Direct Login if Account Exists */}
                {existingAccountAlert ? (
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setExistingAccountAlert(null);
                        setErrorMessage('');
                      }}
                      className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      <span>ចូលប្រើប្រាស់គណនីរបស់អ្នក (Login)</span>
                    </button>
                    <p className="text-center text-[11px] text-red-600 font-semibold">
                      លេខទូរស័ព្ទនេះមានគណនីរួចហើយ មិនអាចបង្កើតគណនីថ្មីឡើងវិញបានទេ។
                    </p>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>កំពុងដំណើរការ...</span>
                      </>
                    ) : (
                      <>
                        <span>ចុះឈ្មោះបង្កើតគណនី (ចុះឈ្មោះភ្លាមៗ)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMessage('');
                    }}
                    className="text-xs text-slate-600 hover:text-emerald-800 font-medium hover:underline cursor-pointer"
                  >
                    មានគណនីរួចហើយមែនទេ? <span className="text-emerald-700 font-bold">ចូលប្រើប្រាស់ »</span>
                  </button>
                </div>
              </form>
            ) : (
              /* ----------------- STEP 2: បង្កើតគណនី ----------------- */
              <div className="space-y-5 animate-in fade-in">
                {/* Information Summary Review Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>ព័ត៌មានដែលបានបំពេញ</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>កែប្រែ</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">ឈ្មោះ៖</span>
                      <span className="font-bold text-slate-800">{fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">ភេទ និង អាយុ៖</span>
                      <span className="font-bold text-slate-800">
                        {gender || 'មិនបានបញ្ជាក់'} {ageRange ? `(${ageRange})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">លេខទូរស័ព្ទ៖</span>
                      <span className="font-bold text-emerald-800 font-mono">
                        {selectedCountryCode} {rawPhone}
                      </span>
                    </div>
                    {telegram && (
                      <div>
                        <span className="text-slate-500 block text-[11px]">Telegram៖</span>
                        <span className="font-bold text-sky-700 font-mono">{telegram}</span>
                      </div>
                    )}
                  </div>

                  {regPassword && (
                    <div className="text-xs">
                      <span className="text-slate-500 block text-[11px]">ពាក្យសម្ងាត់៖</span>
                      <span className="font-bold text-slate-800 font-mono">•••••••• (បានកំណត់)</span>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-500 block text-[11px] mb-1">បញ្ហាស្បែកមុខ៖</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedConcerns.map((cId) => {
                        const concern = SKIN_CONCERN_OPTIONS.find((c) => c.id === cId);
                        return (
                          <span
                            key={cId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100/70 border border-emerald-200 text-emerald-900 rounded-lg text-[10px] font-bold"
                          >
                            <span>{concern?.icon}</span>
                            <span>{concern?.nameKm}</span>
                          </span>
                        );
                      })}
                    </div>
                    {acneDetails && (
                      <div className="mt-1 text-[11px] text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200">
                        <span className="font-bold">ព័ត៌មានមុខមុន៖</span> {acneDetails}
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Password Registration Button if password was set */}
                {regPassword && regPassword.length >= 6 ? (
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={handleRegisterWithPasswordDirect}
                      disabled={loading}
                      className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>កំពុងបង្កើតគណនី...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4 text-emerald-200" />
                          <span>បង្កើតគណនី និងចូលប្រើភ្លាមៗ</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCreateAccountOrLogin()}
                      disabled={loading}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>ឬផ្ទៀងផ្ទាត់តាមលេខកូដ OTP (SMS)</span>
                    </button>
                  </div>
                ) : (
                  /* Confirm & Send SMS Button */
                  <button
                    type="button"
                    onClick={() => handleCreateAccountOrLogin()}
                    disabled={loading}
                    className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>កំពុងផ្ញើលេខកូដ SMS...</span>
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4" />
                        <span>បង្កើតគណនី និងផ្ញើលេខកូដ SMS</span>
                      </>
                    )}
                  </button>
                )}

                {/* Back to Step 1 button */}
                <button
                  type="button"
                  onClick={() => setRegStep(1)}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer text-center"
                >
                  « ត្រឡប់ទៅកែសម្រួលព័ត៌មាន
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ---------------------------------------------------- */
          /* MODE 2: DIRECT LOGIN (FOR EXISTING MEMBERS)           */
          /* ---------------------------------------------------- */
          <div className="space-y-4 animate-in fade-in">
            {/* Header: ចូលប្រើគណនីរបស់អ្នក */}
            <div className="text-center mb-1">
              <h2 className="text-xl font-extrabold text-slate-900 font-opensans">
                ចូលប្រើគណនីរបស់អ្នក
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {loginMethod === 'otp'
                  ? 'បញ្ចូលឈ្មោះ និងលេខទូរស័ព្ទរបស់អ្នកដើម្បីទទួលលេខកូដ OTP តាមរយៈ SMS'
                  : 'បញ្ចូលឈ្មោះ និងពាក្យសម្ងាត់ ឬ PIN របស់អ្នកដើម្បីចូលប្រើប្រាស់'}
              </p>
            </div>

            {/* Dual Login Method Switcher placed directly below ចូលប្រើគណនីរបស់អ្នក */}
            <div className="grid grid-cols-2 gap-2 bg-emerald-50/70 p-1.5 rounded-2xl border border-emerald-200/60 font-battambang">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('otp');
                  setErrorMessage('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginMethod === 'otp'
                    ? 'bg-white text-emerald-950 shadow-sm border border-emerald-200'
                    : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>លេខកូដ OTP (SMS)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  setErrorMessage('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginMethod === 'password'
                    ? 'bg-white text-emerald-950 shadow-sm border border-emerald-200'
                    : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span>ពាក្យសម្ងាត់ (Password) / PIN</span>
              </button>
            </div>

            {loginMethod === 'otp' ? (
              /* OTP Login Form */
              <form onSubmit={handleCreateAccountOrLogin} className="space-y-4 animate-in fade-in">
                {/* Name Input (ឈ្មោះ) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ឈ្មោះ</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="បញ្ចូលឈ្មោះរបស់អ្នក"
                    className="w-full px-3.5 sm:px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-base sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white placeholder:font-normal placeholder:text-slate-400 touch-manipulation min-h-[44px] transition-all"
                    disabled={loading}
                  />
                </div>

                {/* Phone Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    លេខទូរស័ព្ទ
                  </label>
                  <div className="flex gap-2 w-full">
                    <select
                      value={selectedCountryCode}
                      onChange={(e) => setSelectedCountryCode(e.target.value)}
                      className="shrink-0 px-2.5 sm:px-3 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer min-h-[44px] transition-all"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>

                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={rawPhone}
                      onChange={handlePhoneChange}
                      placeholder="12 345 678"
                      className="flex-1 min-w-0 px-3.5 sm:px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-base sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white placeholder:font-normal placeholder:text-slate-400 touch-manipulation min-h-[44px] transition-all"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 pl-1">
                    ឧទាហរណ៍៖ 12 345 678
                  </p>
                </div>

                {/* Submit OTP Button */}
                <button
                  type="submit"
                  disabled={loading || !rawPhone.trim()}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>កំពុងផ្ញើលេខកូដ...</span>
                    </>
                  ) : (
                    <span>ផ្ញើលេខកូដ OTP</span>
                  )}
                </button>
              </form>
            ) : (
              /* Password / PIN Login Form */
              <form onSubmit={handlePasswordLoginSubmit} className="space-y-4 animate-in fade-in">
                {/* Name or Phone Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ឈ្មោះ ឬ លេខទូរស័ព្ទ (姓名或手机号码)</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="បញ្ចូលឈ្មោះ ឬ លេខទូរស័ព្ទ (如: Kol ឬ 012345678)"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:font-normal placeholder:text-slate-400"
                    disabled={loading}
                    autoFocus
                    required
                  />
                </div>

                {/* Password / PIN Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ពាក្យសម្ងាត់ (Password) / PIN</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('otp');
                        setErrorMessage('');
                      }}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                    >
                      ភ្លេចពាក្យសម្ងាត់/PIN?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="បញ្ចូលពាក្យសម្ងាត់ ឬ លេខ PIN 6 ខ្ទង់"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 pr-11 font-mono"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Password Login Button */}
                <button
                  type="submit"
                  disabled={loading || !fullName.trim() || !loginPassword}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>កំពុងចូលប្រើ...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>ចូលប្រើប្រាស់</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="text-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setRegStep(1);
                  setErrorMessage('');
                }}
                className="text-xs text-slate-600 hover:text-emerald-800 font-medium hover:underline cursor-pointer"
              >
                មិនទាន់មានគណនីមែនទេ? <span className="text-emerald-700 font-bold">បង្កើតគណនីថ្មី »</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer info & privacy policy */}
        <div className="mt-8 text-center pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ព័ត៌មានរបស់អ្នកត្រូវបានពង្រឹងសុវត្ថិភាពខ្ពស់</span>
          </div>

          <div className="flex items-center justify-center gap-3 text-xs">
            {onOpenPrivacyPolicy && (
              <button
                onClick={onOpenPrivacyPolicy}
                className="text-slate-600 hover:text-emerald-700 underline font-semibold cursor-pointer"
              >
                គោលការណ៍ឯកជនភាព
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
