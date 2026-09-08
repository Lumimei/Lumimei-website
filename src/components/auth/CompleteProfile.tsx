import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, collection, addDoc, doc, setDoc } from '../../lib/firebase';
import { UserCheck, ShieldCheck, Loader2, Globe, User as UserIcon, Sparkles, CheckCircle2, Users, Calendar, Send, ChevronDown } from 'lucide-react';
import { GENDER_OPTIONS, AGE_RANGE_OPTIONS } from './PhoneLogin';

interface CompleteProfileProps {
  onCompleted: () => void;
  onOpenPrivacyPolicy?: () => void;
}

const SKIN_CONCERN_OPTIONS = [
  { id: 'acne', nameKm: 'មុខមុន', descKm: 'មុនក្បាលខ្មៅ មុនរលាក មុនសាច់', icon: '🔴' },
  { id: 'dullness', nameKm: 'មុខខ្មៅស្រអាប់', descKm: 'ស្បែកគ្មានពន្លឺ ស្លេកស្លាំង', icon: '🟤' },
  { id: 'pores', nameKm: 'មុខមានរន្ធញើសរីកធំ', descKm: 'រន្ធញើសចំហ ស្បែកខ្លាញ់', icon: '🔵' },
  { id: 'rashes', nameKm: 'មុខរោល', descKm: 'ប្រតិកម្ម អាឡែកស៊ី ងាយក្រហម', icon: '🟠' },
  { id: 'inflammation', nameKm: 'មុខរលាក', descKm: 'រលាកក្រហាយ ស្បែកខូចខាត', icon: '🔥' },
];

const ACNE_QUICK_TAGS = ['មុនក្បាលខ្មៅ', 'មុនរលាកក្រហម', 'មុនសាច់', 'មុនអ័រម៉ូន', 'មុនក្បាលស'];

export const CompleteProfile: React.FC<CompleteProfileProps> = ({
  onCompleted,
  onOpenPrivacyPolicy,
}) => {
  const { currentUser, createUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('ស្រី');
  const [ageRange, setAgeRange] = useState('');
  const [telegram, setTelegram] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<'km' | 'zh' | 'en'>('km');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [acneDetails, setAcneDetails] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const toggleSkinConcern = (concernId: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("【调试】表单提交按钮已被成功触发！");
    setErrorMessage('');

    const cleanName = displayName.trim();
    if (!cleanName) {
      setErrorMessage('សូមបញ្ចូលឈ្មោះ ឬឈ្មោះហៅក្រៅរបស់អ្នក។');
      return;
    }

    if (!consentAccepted) {
      setErrorMessage('សូមយល់ព្រមលើគោលការណ៍ឯកជនភាព និងលក្ខខណ្ឌប្រើប្រាស់។');
      return;
    }

    const formData = {
      displayName: cleanName,
      fullName: cleanName,
      gender,
      ageRange,
      telegram: telegram.trim(),
      preferredLanguage,
      skinConcerns: selectedConcerns,
      acneDetails: acneDetails.trim(),
      phoneNumber: currentUser?.phoneNumber || '',
      role: 'customer',
    };

    setLoading(true);

    try {
      if (currentUser?.uid) {
        try {
          const rawPhone = currentUser.phoneNumber || '';
          const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

          const userDocData = {
            uid: currentUser.uid,
            email: currentUser.email || null,
            name: cleanName || "新用户",
            ...formData,
            createdAt: new Date().toISOString()
          };

          await setDoc(doc(db, "users", currentUser.uid), userDocData, { merge: true });
          
          if (cleanPhone) {
            await setDoc(doc(db, "users", cleanPhone), userDocData, { merge: true });
          }
          console.log("【调试】Firestore 数据写入成功！UID:", currentUser.uid, "CleanPhone:", cleanPhone);
        } catch (firestoreErr: any) {
          console.warn("【Firestore 写入提示】云端规则暂未放行或网络受限:", firestoreErr);
        }
      }

      await createUserProfile({
        displayName: cleanName,
        fullName: cleanName,
        gender,
        ageRange,
        telegram,
        preferredLanguage,
        skinConcerns: selectedConcerns,
        acneDetails: acneDetails.trim(),
      });
      onCompleted();
    } catch (err: any) {
      console.error("【详细错误对象】:", err);
      console.error("【错误 Code】:", err.code);
      console.error("【错误 Message】:", err.message);
      setErrorMessage(err.message || 'មិនអាចបង្កើតគណនីបានទេ។ សូមព្យាយាមម្ដងទៀត។');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 py-8">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-emerald-100 relative">
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-200">
          <UserCheck className="w-7 h-7 animate-pulse" />
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 font-opensans">
            បង្កើតគណនីរបស់អ្នក
          </h1>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            សូមបំពេញព័ត៌មានខាងក្រោម ដើម្បីបញ្ចប់ការចុះឈ្មោះ
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Display Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>ឈ្មោះ ឬឈ្មោះហៅក្រៅ <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ឧទាហរណ៍៖ សុខា"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Gender & Age Dropdown (same row) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>ភេទ</span>
              </label>
              <div className="relative">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none pr-8"
                >
                  <option value="">-- ជ្រើសរើស --</option>
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

            {/* Age Range */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>អាយុ</span>
              </label>
              <div className="relative">
                <select
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none pr-8"
                >
                  <option value="">-- ជ្រើសរើស --</option>
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

          {/* Telegram */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-sky-600" />
                <span>លេខ Telegram</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">(ស្រេចចិត្ត)</span>
            </label>
            <input
              type="text"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="ឧ. @username ឬ 012 345 678"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
            />
          </div>

          {/* Skin Concerns */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>បញ្ហាស្បែកមុខ (ជ្រើសរើសបានច្រើន)</span>
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {SKIN_CONCERN_OPTIONS.map((concern) => {
                const isSelected = selectedConcerns.includes(concern.id);
                return (
                  <button
                    key={concern.id}
                    type="button"
                    onClick={() => toggleSkinConcern(concern.id)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{concern.icon}</span>
                      <span className="text-xs font-bold text-slate-800">{concern.nameKm}</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedConcerns.includes('acne') && (
              <div className="mt-2 p-2.5 bg-rose-50/80 border border-rose-200 rounded-xl">
                <label className="block text-[11px] font-bold text-rose-900 mb-1">
                  ពិពណ៌នាអំពីបញ្ហាមុនរបស់អ្នក៖
                </label>
                <textarea
                  value={acneDetails}
                  onChange={(e) => setAcneDetails(e.target.value)}
                  placeholder="ឧទាហរណ៍៖ មុនក្បាលខ្មៅ, មុនរលាកក្រហម..."
                  rows={2}
                  className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {ACNE_QUICK_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddAcneTag(tag)}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-rose-200 bg-white text-rose-800"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preferred Language Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>ភាសាដែលចូលចិត្ត</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPreferredLanguage('km')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  preferredLanguage === 'km'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>🇰🇭</span>
                <span>ភាសាខ្មែរ</span>
              </button>

              <button
                type="button"
                onClick={() => setPreferredLanguage('zh')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  preferredLanguage === 'zh'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>🇨🇳</span>
                <span>中文</span>
              </button>

              <button
                type="button"
                onClick={() => setPreferredLanguage('en')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  preferredLanguage === 'en'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>🇬🇧</span>
                <span>English</span>
              </button>
            </div>
          </div>

          {/* Privacy Consent Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
              />
              <span className="text-xs text-slate-600 font-medium leading-relaxed">
                ខ្ញុំបានអាន និងយល់ព្រមលើ{' '}
                {onOpenPrivacyPolicy ? (
                  <button
                    type="button"
                    onClick={onOpenPrivacyPolicy}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    គោលការណ៍ឯកជនភាព និងលក្ខខណ្ឌប្រើប្រាស់
                  </button>
                ) : (
                  <span className="text-emerald-700 font-bold">គោលការណ៍ឯកជនភាព</span>
                )}
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !displayName.trim() || !consentAccepted}
            className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>កំពុងដំណើរការ...</span>
              </>
            ) : (
              <span>បង្កើតគណនី និងចូលប្រើប្រាស់</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
