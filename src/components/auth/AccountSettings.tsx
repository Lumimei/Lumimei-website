import React, { useState, useRef, useEffect } from 'react';
import { RecaptchaVerifier, ConfirmationResult, updatePassword } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { auth, formatToE164, maskPhoneNumber } from '../../lib/firebase';
import { GreenDiamondIcon } from '../GreenDiamondIcon';
import { FacebookIconBadge } from '../FacebookIconBadge';
import {
  User,
  Phone,
  Globe,
  Edit3,
  Trash2,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  KeyRound,
  ShieldCheck,
  Camera,
  Lock,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';

interface AccountSettingsProps {
  onNavigateHome: () => void;
  onLogoutSuccess: () => void;
  onLanguageChanged?: (lang: 'km' | 'zh' | 'en') => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({
  onNavigateHome,
  onLogoutSuccess,
  onLanguageChanged,
}) => {
  const {
    currentUser,
    userProfile,
    updateUserProfile,
    updateUserPhoneNumber,
    setUserPassword,
    sendOTP,
    logout,
    deleteAccount,
  } = useAuth();

  // Member Tier calculation
  const points = userProfile?.points || 0;
  const totalSpent = userProfile?.totalSpent || 0;
  const isVvip = totalSpent >= 1000 || points >= 100 || Boolean(userProfile?.isVvip);
  const isVip = !isVvip && (totalSpent >= 200 || points >= 20 || Boolean(userProfile?.isVip));
  const isFacebookTopFriend = Boolean(
    userProfile?.isFacebookTopFriend ||
    (userProfile as any)?.isFbTopFriend ||
    (userProfile as any)?.isFacebookTopFan ||
    localStorage.getItem('lumimei_is_fb_top_friend') === 'true'
  );

  const [isFbBadgeActive, setIsFbBadgeActive] = useState<boolean>(isFacebookTopFriend);

  const handleToggleFbBadge = async () => {
    const nextState = !isFbBadgeActive;
    setIsFbBadgeActive(nextState);
    localStorage.setItem('lumimei_is_fb_top_friend', nextState ? 'true' : 'false');
    if (currentUser && userProfile) {
      await updateUserProfile({ isFacebookTopFriend: nextState }).catch(console.error);
    }
  };

  // Profile Photo state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string>(() => {
    return (
      userProfile?.photoURL ||
      currentUser?.photoURL ||
      ''
    );
  });

  useEffect(() => {
    if (userProfile?.photoURL) {
      setProfilePhoto(userProfile.photoURL);
    } else if (currentUser?.photoURL) {
      setProfilePhoto(currentUser.photoURL);
    }
  }, [userProfile, currentUser]);

  const handlePhotoUpload = (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('សូមជ្រើសរើសរូបភាពដែលមានទំហំតូចជាង 5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setProfilePhoto(dataUrl);
        localStorage.setItem('lumimei_user_photo_url', dataUrl);
        window.dispatchEvent(new Event('photoUpdated'));
        if (currentUser && userProfile) {
          try {
            await updateUserProfile({ photoURL: dataUrl });
          } catch (err) {
            console.error(err);
          }
        }
        showToast('បានផ្លាស់ប្ដូររូប Profile រួចរាល់!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(userProfile?.displayName || '');
  const [nameLoading, setNameLoading] = useState(false);

  // Language editing state
  const [selectedLang, setSelectedLang] = useState<'km' | 'zh' | 'en'>(userProfile?.preferredLanguage || 'km');
  const [langLoading, setLangLoading] = useState(false);

  // Change phone number state & modal
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newCountryCode, setNewCountryCode] = useState('+855');
  const [newRawPhone, setNewRawPhone] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneConfirmation, setPhoneConfirmation] = useState<ConfirmationResult | null>(null);
  const [phoneError, setPhoneError] = useState('');
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  // Change password state & modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!newPassword) {
      setPasswordError('សូមបញ្ចូលពាក្យសម្ងាត់ថ្មី');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('ពាក្យសម្ងាត់ត្រូវតែមានយ៉ាងហោចណាស់ 6 តួអក្សរ');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('ពាក្យសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ');
      return;
    }

    setPasswordLoading(true);
    try {
      if (auth.currentUser) {
        try {
          await updatePassword(auth.currentUser, newPassword);
        } catch {
          // ignore
        }
      }
      await setUserPassword(newPassword);
      localStorage.setItem('lumimei_user_password', newPassword);
      showToast('ពាក្យសម្ងាត់ត្រូវបានផ្លាស់ប្ដូរដោយជោគជ័យ!');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password update error:', err);
      try {
        await setUserPassword(newPassword);
      } catch {
        // ignore
      }
      localStorage.setItem('lumimei_user_password', newPassword);
      showToast('ពាក្យសម្ងាត់ត្រូវបានផ្លាស់ប្ដូរដោយជោគជ័យ!');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Alert message
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Update Display Name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim()) return;

    setNameLoading(true);
    try {
      await updateUserProfile({
        displayName: newDisplayName.trim(),
        fullName: newDisplayName.trim(),
      });
      setIsEditingName(false);
      showToast('បានបច្ចុប្បន្នភាពឈ្មោះដោយជោគជ័យ');
    } catch (err: any) {
      showToast(err.message || 'មិនអាចកែប្រែឈ្មោះបានទេ។', 'error');
    } finally {
      setNameLoading(false);
    }
  };

  // Change Preferred Language
  const handleChangeLanguage = async (lang: 'km' | 'zh' | 'en') => {
    setSelectedLang(lang);
    setLangLoading(true);
    try {
      await updateUserProfile({ preferredLanguage: lang });
      if (onLanguageChanged) {
        onLanguageChanged(lang);
      }
      showToast('បានផ្លាស់ប្ដូរភាសាដោយជោគជ័យ');
    } catch (err: any) {
      showToast(err.message || 'មិនអាចប្ដូរភាសាបានទេ។', 'error');
    } finally {
      setLangLoading(false);
    }
  };

  // Initialize reCAPTCHA for phone change
  const initRecaptchaForChange = (): RecaptchaVerifier => {
    if (recaptchaRef.current) {
      try {
        recaptchaRef.current.clear();
      } catch (e) {
        // ignore
      }
      recaptchaRef.current = null;
    }

    const verifier = new RecaptchaVerifier(auth, 'recaptcha-change-phone-container', {
      size: 'invisible',
      'expired-callback': () => {
        setPhoneError('reCAPTCHA បានផុតកំណត់។ សូមព្យាយាមម្ដងទៀត។');
        setPhoneLoading(false);
      },
    });

    recaptchaRef.current = verifier;
    return verifier;
  };

  // Step 1: Send OTP for New Phone Number
  const handleSendNewPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');

    const cleaned = newRawPhone.replace(/\D/g, '');
    if (!cleaned || cleaned.length < 7) {
      setPhoneError('សូមបញ្ចូលលេខទូរស័ព្ទថ្មីឱ្យបានត្រឹមត្រូវ។');
      return;
    }

    const fullPhone = formatToE164(newCountryCode, newRawPhone);
    setPhoneLoading(true);

    try {
      const verifier = initRecaptchaForChange();
      const confirmation = await sendOTP(fullPhone, verifier);
      setPhoneConfirmation(confirmation);
      setPhoneStep('otp');
    } catch (err: any) {
      setPhoneError(err.message || 'មិនអាចផ្ញើលេខកូដទៅកាន់លេខថ្មីបានទេ។');
    } finally {
      setPhoneLoading(false);
    }
  };

  // Step 2: Verify OTP and update phone number
  const handleVerifyNewPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneConfirmation || otpCode.length !== 6) {
      setPhoneError('សូមបញ្ចូលលេខកូដ 6 ខ្ទង់ឱ្យបានត្រឹមត្រូវ។');
      return;
    }

    setPhoneLoading(true);
    setPhoneError('');

    try {
      await updateUserPhoneNumber(phoneConfirmation, otpCode);
      setShowPhoneModal(false);
      setPhoneStep('input');
      setNewRawPhone('');
      setOtpCode('');
      showToast('បានប្ដូរលេខទូរស័ព្ទដោយជោគជ័យ');
    } catch (err: any) {
      setPhoneError(err.message || 'លេខកូដមិនត្រឹមត្រូវទេ។');
    } finally {
      setPhoneLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logout();
      onLogoutSuccess();
    } catch {
      // ignore
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount();
      setShowDeleteModal(false);
      onNavigateHome();
    } catch (err: any) {
      showToast(err.message || 'មិនអាចលុបគណនីបានទេ។ សូមព្យាយាមម្ដងទៀត។', 'error');
      setDeleteLoading(false);
    }
  };

  const currentDisplayName = userProfile?.fullName || userProfile?.displayName || currentUser?.displayName || 'អ្នកប្រើប្រាស់';
  const currentPhone = userProfile?.phoneNumber || currentUser?.phoneNumber || '';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-top duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border border-emerald-500'
              : 'bg-red-900 text-white border border-red-500'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Back to Home Button */}
      <button
        onClick={onNavigateHome}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-bold transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>ត្រឡប់ទៅទំព័រដើម</span>
      </button>

      {/* Header Title */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-opensans">
            ការកំណត់គណនី
          </h1>
        </div>
      </div>

      {/* Profile Information List */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-6">
        {/* Item 0: Profile Photo & Customer Name */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            {/* Profile Photo */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-400 via-emerald-400 to-teal-300 p-0.5 shadow-md overflow-hidden relative">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={currentDisplayName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-amber-300 font-extrabold text-2xl">
                    {currentDisplayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Name info */}
            <div>
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={nameLoading || !newDisplayName.trim()}
                    className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 cursor-pointer transition"
                  >
                    {nameLoading ? '...' : 'រក្សាទុក'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setNewDisplayName(currentDisplayName);
                    }}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300 cursor-pointer transition"
                  >
                    បោះបង់
                  </button>
                </form>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base sm:text-lg font-extrabold text-slate-900">
                      {currentDisplayName}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setNewDisplayName(currentDisplayName);
                        setIsEditingName(true);
                      }}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition cursor-pointer border border-emerald-200 shadow-2xs"
                      title="កែឈ្មោះអតិថិជន"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                  </div>

                  {/* Customer Tier Badge under Customer Name */}
                  <div className="flex items-center gap-1.5">
                    {isVvip ? (
                      <span className="inline-flex items-center gap-0.5 filter drop-shadow-xs" title="កម្រិត VVIP">
                        <GreenDiamondIcon size={16} />
                        <GreenDiamondIcon size={16} />
                      </span>
                    ) : isVip ? (
                      <span className="inline-flex items-center filter drop-shadow-xs" title="កម្រិត VIP">
                        <GreenDiamondIcon size={18} />
                      </span>
                    ) : (
                      <span className="text-amber-500 text-sm" title="កម្រិត ធម្មតា">
                        ⭐
                      </span>
                    )}
                    <FacebookIconBadge size={17} title="Facebook Top Friends" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-slate-600" />
              <span>ប្តូររូប Profile</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
              }}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        {/* Item 2: Verified Phone Number */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">លេខទូរស័ព្ទដែលបានផ្ទៀងផ្ទាត់</p>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">
                {currentPhone ? maskPhoneNumber(currentPhone) : 'មិនមាន'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setPhoneError('');
              setPhoneStep('input');
              setShowPhoneModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl text-xs font-bold transition cursor-pointer self-start sm:self-auto border border-slate-200"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>ប្ដូរលេខទូរស័ព្ទ</span>
          </button>
        </div>

        {/* Item 3: Password / លេខសម្ងាត់ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-700">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">ពាក្យសម្ងាត់ (Password)</p>
              <p className="text-base font-extrabold text-slate-900 mt-0.5 tracking-wider">
                ••••••••
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setPasswordError('');
              setNewPassword('');
              setConfirmPassword('');
              setShowPasswordModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition cursor-pointer self-start sm:self-auto border border-amber-200"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>ប្តូរ Password</span>
          </button>
        </div>

        {/* Item 4: Facebook Top Friends Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#1877F2]/10 text-[#1877F2]">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-400 font-semibold">ផ្លាកសញ្ញា Facebook Top Friends</p>
                <FacebookIconBadge size={18} title="Facebook Top Friends" />
              </div>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {isFbBadgeActive ? '✅ បានបើកដំណើរការសញ្ញា Facebook' : 'សញ្ញាពិសេសសម្រាប់អ្នកគាំទ្រ Facebook'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://www.facebook.com/LumimeiCambodia"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1877F2] rounded-xl text-xs font-bold transition flex items-center gap-1 border border-blue-200"
            >
              <span>ទំព័រ Facebook</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={handleToggleFbBadge}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                isFbBadgeActive
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              {isFbBadgeActive ? '✓ បានបើក Badge' : 'បើក Badge'}
            </button>
          </div>
        </div>

        {/* Item 5: Preferred Language Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">ភាសាដែលបានជ្រើសរើស</p>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">
                {selectedLang === 'km' ? '🇰🇭 ភាសាខ្មែរ' : selectedLang === 'zh' ? '🇨🇳 中文' : '🇬🇧 English'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleChangeLanguage('km')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                selectedLang === 'km'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🇰🇭 ខ្មែរ
            </button>
            <button
              onClick={() => handleChangeLanguage('zh')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                selectedLang === 'zh'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🇨🇳 中文
            </button>
            <button
              onClick={() => handleChangeLanguage('en')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                selectedLang === 'en'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        {/* Account Actions: Logout & Delete Account */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 border border-slate-300"
          >
            <LogOut className="w-4 h-4 text-slate-600" />
            <span>Logout</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex-1 py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 border border-red-200"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>លុបគណនី</span>
          </button>
        </div>
      </div>

      {/* Change Phone Number Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div id="recaptcha-change-phone-container"></div>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-emerald-100 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowPhoneModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {phoneStep === 'input' ? (
              <form onSubmit={handleSendNewPhoneOTP} className="space-y-4">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                    <Phone className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    ប្ដូរលេខទូរស័ព្ទថ្មី
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    បញ្ចូលលេខទូរស័ព្ទថ្មីរបស់អ្នក ដើម្បីទទួលលេខកូដ OTP
                  </p>
                </div>

                {phoneError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold">
                    {phoneError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    លេខទូរស័ព្ទថ្មី
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={newCountryCode}
                      onChange={(e) => setNewCountryCode(e.target.value)}
                      className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      <option value="+855">🇰🇭 +855</option>
                      <option value="+66">🇹🇭 +66</option>
                      <option value="+84">🇻🇳 +84</option>
                      <option value="+86">🇨🇳 +86</option>
                      <option value="+1">🇺🇸 +1</option>
                    </select>

                    <input
                      type="tel"
                      value={newRawPhone}
                      onChange={(e) => setNewRawPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                      placeholder="12 345 678"
                      className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      disabled={phoneLoading}
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={phoneLoading || !newRawPhone.trim()}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-2xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {phoneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>ផ្ញើលេខកូដ OTP</span>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyNewPhoneOTP} className="space-y-4">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    ផ្ទៀងផ្ទាត់លេខកូដ OTP
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    បញ្ចូលលេខកូដ 6 ខ្ទង់ដែលបានផ្ញើទៅកាន់លេខថ្មី
                  </p>
                </div>

                {phoneError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold">
                    {phoneError}
                  </div>
                )}

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full py-3 text-center tracking-[0.5em] text-xl font-black bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={phoneLoading}
                  autoFocus
                />

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPhoneStep('input')}
                    className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-2xl text-xs font-bold cursor-pointer transition"
                  >
                    ត្រឡប់ក្រោយ
                  </button>
                  <button
                    type="submit"
                    disabled={phoneLoading || otpCode.length !== 6}
                    className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-2xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1"
                  >
                    {phoneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>ផ្ទៀងផ្ទាត់</span>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-100 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">ប្តូរ Password</h3>
                <p className="text-xs text-slate-500 font-semibold">កំណត់ពាក្យសម្ងាត់ថ្មីសម្រាប់គណនីរបស់អ្នក</p>
              </div>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4 pt-1">
              {passwordError && (
                <div className="p-3 rounded-2xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  ពាក្យសម្ងាត់ថ្មី (New Password)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មី (យ៉ាងហោច 6 តួ)"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់ថ្មី (Confirm Password)
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មីម្ដងទៀត"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  លុបចោល
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>រក្សាទុក</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-red-100 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">
              លុបគណនី
            </h3>

            <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
              តើអ្នកពិតជាចង់លុបគណនីមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។ ទិន្នន័យគណនីរបស់អ្នកនឹងត្រូវលុបចោលទាំងស្រុង។
            </p>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold cursor-pointer transition"
              >
                បោះបង់
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                {deleteLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>លុបគណនី</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
