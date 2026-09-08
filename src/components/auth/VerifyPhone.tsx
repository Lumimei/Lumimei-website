import React, { useState, useEffect } from 'react';
import { ConfirmationResult } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { maskPhoneNumber, db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, Edit2, RotateCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface VerifyPhoneProps {
  confirmationResult: ConfirmationResult;
  phoneE164: string;
  onVerified: (isNewUser: boolean) => void;
  onChangePhoneNumber: () => void;
  onResendOTP: () => Promise<ConfirmationResult>;
}

export const VerifyPhone: React.FC<VerifyPhoneProps> = ({
  confirmationResult,
  phoneE164,
  onVerified,
  onChangePhoneNumber,
  onResendOTP,
}) => {
  const { verifyOTP, createUserProfile } = useAuth();
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [activeConfirmation, setActiveConfirmation] = useState<ConfirmationResult>(confirmationResult);

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(val);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setErrorMessage('សូមបញ្ចូលលេខកូដ OTP ចំនួន 6 ខ្ទង់។');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await verifyOTP(activeConfirmation, otpCode);
      
      const rawUserPhone = res.user.phoneNumber || phoneE164;
      const cleanPhone = rawUserPhone.replace(/[^0-9]/g, '');

      // Retrieve any pending user data filled in Step 1
      const pendingDataStr = localStorage.getItem('lumimei_pending_registration') || localStorage.getItem('latest_user');
      let pendingData: any = {};
      if (pendingDataStr) {
        try {
          pendingData = JSON.parse(pendingDataStr);
        } catch {
          // ignore
        }
      }

      // Always write/sync to Firestore users collection by clean phone doc ID
      try {
        const firestoreUserData = {
          uid: res.user.uid,
          phoneNumber: rawUserPhone,
          fullName: pendingData.fullName || pendingData.displayName || pendingData.name || 'អ្នកប្រើប្រាស់',
          gender: pendingData.gender || '',
          age: pendingData.ageRange || pendingData.age || '',
          telegram: pendingData.telegram || '',
          skinConcerns: pendingData.skinConcerns || [],
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", cleanPhone), firestoreUserData, { merge: true });
        console.log("【VerifyPhone】Firestore 写入成功 (Doc ID: " + cleanPhone + "):", firestoreUserData);
      } catch (fsErr: any) {
        console.warn("VerifyPhone Firestore write notice:", fsErr);
      }

      // 1. If user already has an account in Firestore, log them in IMMEDIATELY!
      if (!res.isNewUser) {
        localStorage.removeItem('lumimei_pending_registration');
        onVerified(false);
        return;
      }

      // 2. If user is NEW:
      // Check if registration details were provided beforehand in Step 1
      if (pendingDataStr) {
        try {
          const cleanName = (pendingData.fullName || pendingData.displayName || '').trim() || 'អ្នកប្រើប្រាស់';
          
          // Clear any previously saved photo, orders, points, or tier status in browser storage
          localStorage.removeItem('lumimei_user_photo_url');
          localStorage.removeItem('lumimei_user_orders');
          localStorage.removeItem('lumimei_is_fb_top_friend');
          localStorage.removeItem('lumimei_completed_mission_tasks');
          localStorage.removeItem('lumimei_guest_points');

          await createUserProfile({
            displayName: cleanName,
            fullName: cleanName,
            telegram: pendingData.telegram || '',
            gender: pendingData.gender || '',
            ageRange: pendingData.ageRange || '',
            skinConcerns: pendingData.skinConcerns || [],
            acneDetails: pendingData.acneDetails || '',
            password: pendingData.password,
            preferredLanguage: 'km',
          });
          localStorage.removeItem('lumimei_pending_registration');
          
          // Enter account immediately
          onVerified(false);
          return;
        } catch {
          // ignore and fallback to complete profile
        }
      }

      // If user is new and has not filled profile details yet, show "បង្កើតគណនីរបស់អ្នក"
      onVerified(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'លេខកូដមិនត្រឹមត្រូវទេ។');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resendLoading) return;

    setResendLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const newConfirmation = await onResendOTP();
      setActiveConfirmation(newConfirmation);
      setCountdown(60);
      setOtpCode('');
      setSuccessMessage('លេខកូដ OTP ថ្មីត្រូវបានផ្ញើទៅកាន់លេខទូរស័ព្ទរបស់អ្នករួចរាល់ហើយ។');
    } catch (err: any) {
      setErrorMessage(err.message || 'មិនអាចផ្ញើលេខកូដបានទេ។ សូមព្យាយាមម្ដងទៀត។');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-emerald-100 relative">
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-200">
          <KeyRound className="w-7 h-7 animate-pulse" />
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 font-opensans">
            ផ្ទៀងផ្ទាត់លេខទូរស័ព្ទ
          </h1>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            លេខកូដ 6 ខ្ទង់ត្រូវបានផ្ញើទៅកាន់
          </p>

          {/* Masked Phone Display */}
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
            <span>{maskPhoneNumber(phoneE164)}</span>
            <button
              onClick={onChangePhoneNumber}
              type="button"
              className="text-slate-500 hover:text-emerald-700 p-0.5 rounded cursor-pointer transition"
              title="កែប្រែលេខទូរស័ព្ទ"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
              បញ្ចូលលេខកូដ OTP (6 ខ្ទង់)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={handleOTPChange}
              placeholder="• • • • • •"
              className="w-full py-3.5 text-center tracking-[0.5em] text-2xl font-black bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>កំពុងផ្ទៀងផ្ទាត់...</span>
              </>
            ) : (
              <span>ផ្ទៀងផ្ទាត់ និងចូលប្រើប្រាស់</span>
            )}
          </button>
        </form>

        {/* Resend & Change Phone Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
          <button
            onClick={handleResend}
            disabled={countdown > 0 || resendLoading}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 disabled:text-slate-400 flex items-center gap-1.5 cursor-pointer transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
            {countdown > 0 ? (
              <span>ផ្ញើលេខកូដម្ដងទៀត ({countdown} វិនាទី)</span>
            ) : (
              <span>ផ្ញើលេខកូដម្ដងទៀត</span>
            )}
          </button>

          <button
            onClick={onChangePhoneNumber}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer transition"
          >
            កែប្រែលេខទូរស័ព្ទ
          </button>
        </div>
      </div>
    </div>
  );
};
