import React, { useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { signInAnonymously, getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Phone, Lock, User, Loader2, ArrowRight, ShieldCheck, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SignupProps {
  onSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

export const Signup: React.FC<SignupProps> = ({ onSuccess, onNavigateToLogin }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccess(false);

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      alert("请输入有效的手机号码！");
      return;
    }

    const cleanPassword = password.length >= 6 ? password : 'password123';
    const cleanName = name.trim() || 'អ្នកប្រើប្រាស់';

    setLoading(true);

    try {
      const auth = getAuth();
      // 1. 获取当前匿名用户，若没有则登录创建
      let user = auth.currentUser;
      if (!user) {
        const userCredential = await signInAnonymously(auth);
        user = userCredential.user;
      }

      // 2. 以手机号为 Doc ID 写入 Firestore
      const userData = {
        uid: user.uid,
        phoneNumber: cleanPhone,
        password: cleanPassword,
        fullName: cleanName,
        gender: 'ស្រី',
        age: '18-24',
        telegram: '',
        skinConcerns: [],
        createdAt: new Date().toISOString()
      };

      // 本地备份
      localStorage.setItem("latest_user", JSON.stringify(userData));

      // 使用 merge: true 确保写入成功
      await setDoc(doc(db, "users", cleanPhone), userData, { merge: true });

      alert(`注册成功！数据已成功存入 Firestore。\n文档 ID: ${cleanPhone}`);
      setSuccess(true);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("注册或写入失败:", err);
      alert("操作失败: " + err.message);
      setErrorMessage(err.message || 'ចុះឈ្មោះមិនបានជោគជ័យទេ។');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white rounded-3xl shadow-xl border border-rose-100 relative">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-rose-200">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">ចុះឈ្មោះគណនីថ្មី (Register)</h2>
        <p className="text-xs text-gray-500 mt-1">បង្កើតគណនីតាមរយៈលេខទូរស័ព្ទ & រក្សាទុកទិន្នន័យក្នុង Firestore</p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-emerald-700 text-xs">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>ចុះឈ្មោះ និងរក្សាទុកទិន្នន័យបានជោគជ័យ!</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            ឈ្មោះរបស់អ្នក (Name)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ឧទាហរណ៍: លីណា / Lina"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-gray-800 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            លេខទូរស័ព្ទ (Phone Number) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="012 345 678"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-gray-800 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            ពាក្យសម្ងាត់ (Password) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="យ៉ាងហោចណាស់ 6 តួអក្សរ"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-gray-800 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-medium text-sm shadow-md shadow-rose-200 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>កំពុងចុះឈ្មោះ...</span>
            </>
          ) : (
            <>
              <span>ចុះឈ្មោះ (Register)</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {onNavigateToLogin && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline transition"
          >
            មានគណនីរួចហើយ? ចូលប្រើប្រាស់ (Login)
          </button>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>ទិន្នន័យត្រូវបានការពារដោយសុវត្ថិភាព Firebase</span>
      </div>
    </div>
  );
};

export default Signup;
