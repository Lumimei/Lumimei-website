import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { maskPhoneNumber } from '../../lib/firebase';
import { Order } from '../../types';
import { GreenDiamondIcon } from '../GreenDiamondIcon';
import { FacebookIconBadge } from '../FacebookIconBadge';
import {
  User,
  Phone,
  Calendar,
  Sparkles,
  LogOut,
  Info,
  Gift,
  Award,
  Package,
  ShieldCheck,
  Users,
  CheckCircle2,
  Crown,
  ChevronRight,
  X,
  Share2,
  Copy,
  Check,
  Clock,
  TrendingUp,
  Tag,
  ShoppingBag,
  ExternalLink,
  Coins,
  Camera,
  Truck,
  Heart,
  PartyPopper,
} from 'lucide-react';

interface DashboardProps {
  onOpenAiAdvisor: () => void;
  onNavigateToAccount: () => void;
  onLogoutSuccess: () => void;
  onOpenPoints?: () => void;
  onOpenSkinScan?: () => void;
  onNavigateToAdmin?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenAiAdvisor,
  onNavigateToAccount,
  onLogoutSuccess,
  onOpenPoints,
  onOpenSkinScan,
  onNavigateToAdmin,
}) => {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<
    'skincare' | 'orders' | 'benefits' | 'referral' | 'tier' | 'checkin' | null
  >(null);

  // Referral code state
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Daily checkin state
  const [lastCheckinDate, setLastCheckinDate] = useState<string>(() => {
    return localStorage.getItem('lumimei_last_checkin_date') || '';
  });
  const [checkinStreak, setCheckinStreak] = useState<number>(() => {
    return Number(localStorage.getItem('lumimei_checkin_streak') || '1');
  });

  // Orders state
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const isCheckedInToday = lastCheckinDate === todayStr;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogout = async () => {
    try {
      await logout();
      onLogoutSuccess();
    } catch {
      // ignore
    }
  };

  const displayName = userProfile?.fullName || userProfile?.displayName || currentUser?.displayName || 'អតិថិជន Lumimei';
  const phone = userProfile?.phoneNumber || currentUser?.phoneNumber || '';

  const [guestPoints, setGuestPoints] = useState<number>(() => {
    return Number(localStorage.getItem('lumimei_guest_points') || '0');
  });

  useEffect(() => {
    const handlePointsUpdated = () => {
      setGuestPoints(Number(localStorage.getItem('lumimei_guest_points') || '0'));
    };
    window.addEventListener('pointsUpdated', handlePointsUpdated);
    return () => window.removeEventListener('pointsUpdated', handlePointsUpdated);
  }, []);

  useEffect(() => {
    const loadOrders = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('lumimei_user_orders') || '[]');
        setUserOrders(saved);
      } catch (e) {
        setUserOrders([]);
      }
    };
    loadOrders();
    window.addEventListener('ordersUpdated', loadOrders);
    return () => window.removeEventListener('ordersUpdated', loadOrders);
  }, []);

  const points = userProfile?.points !== undefined ? userProfile.points : guestPoints;
  const totalSpentFromOrders = userOrders.reduce((sum, order) => sum + (order.totalUsd || 0), 0);
  const totalSpent = userProfile?.totalSpent !== undefined ? userProfile.totalSpent : totalSpentFromOrders;

  // 1. Registered = Normal member automatically ($0 spent)
  // 2. VIP = Spent $200+
  // 3. VVIP = Spent $1000+
  // 4. Facebook Top Friends = Active Supporter on Facebook Page
  const isVvip = Boolean(userProfile?.isVvip) || (userProfile?.tier === 'vvip') || totalSpent >= 1000;
  const isVip = !isVvip && (Boolean(userProfile?.isVip) || (userProfile?.tier === 'vip') || totalSpent >= 200);
  const isNormal = !isVvip && !isVip;
  const isFacebookTopFriend = Boolean(
    userProfile?.isFacebookTopFriend ||
    (userProfile as any)?.isFbTopFriend ||
    (userProfile as any)?.isFacebookTopFan
  );

  const [selectedTierTab, setSelectedTierTab] = useState<'normal' | 'vip' | 'vvip' | 'fb_top_friends'>(() => {
    if (isVvip) return 'vvip';
    if (isVip) return 'vip';
    if (isFacebookTopFriend) return 'fb_top_friends';
    return 'normal';
  });

  // Sync selected tier tab with user current status
  useEffect(() => {
    if (isVvip) setSelectedTierTab('vvip');
    else if (isVip) setSelectedTierTab('vip');
    else if (isFacebookTopFriend) setSelectedTierTab('fb_top_friends');
    else setSelectedTierTab('normal');
  }, [isVvip, isVip, isFacebookTopFriend]);

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
      showToast('សូមជ្រើសរើសរូបភាពដែលមានទំហំតូចជាង 5MB');
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

  // Format customer's registration date in Khmer
  const getKhmerFormattedDate = () => {
    let regDate: Date = new Date();

    if (userProfile?.createdAt) {
      if (typeof userProfile.createdAt.toDate === 'function') {
        regDate = userProfile.createdAt.toDate();
      } else if (userProfile.createdAt instanceof Date) {
        regDate = userProfile.createdAt;
      } else if (typeof userProfile.createdAt === 'string' || typeof userProfile.createdAt === 'number') {
        const parsed = new Date(userProfile.createdAt);
        if (!isNaN(parsed.getTime())) regDate = parsed;
      }
    } else if (currentUser?.metadata?.creationTime) {
      const parsed = new Date(currentUser.metadata.creationTime);
      if (!isNaN(parsed.getTime())) regDate = parsed;
    } else {
      const storedReg = localStorage.getItem('lumimei_user_registered_at');
      if (storedReg) {
        const parsed = new Date(storedReg);
        if (!isNaN(parsed.getTime())) regDate = parsed;
      } else {
        const now = new Date().toISOString();
        localStorage.setItem('lumimei_user_registered_at', now);
      }
    }

    const day = regDate.getDate();
    const monthsKm = [
      'មករា',
      'កុម្ភៈ',
      'មីនា',
      'មេសា',
      'ឧសភា',
      'មិថុនា',
      'កក្កដា',
      'សីហា',
      'កញ្ញា',
      'តុលា',
      'វិច្ឆិកា',
      'ធ្នូ',
    ];
    const month = monthsKm[regDate.getMonth()];
    const year = regDate.getFullYear();

    const toKmDigits = (num: number | string) => {
      const kmDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
      return num.toString().replace(/\d/g, (digit) => kmDigits[parseInt(digit)]);
    };

    return `ថ្ងៃទី ${toKmDigits(day)} ខែ ${month} ឆ្នាំ ${toKmDigits(year)}`;
  };

  // Perform daily checkin
  const handleDailyCheckin = () => {
    if (isCheckedInToday) return;

    const bonusPoints = 2;
    const newStreak = checkinStreak + 1;

    setLastCheckinDate(todayStr);
    setCheckinStreak(newStreak);
    localStorage.setItem('lumimei_last_checkin_date', todayStr);
    localStorage.setItem('lumimei_checkin_streak', newStreak.toString());

    if (currentUser && userProfile) {
      updateUserProfile({ points: points + bonusPoints }).catch(console.error);
    } else {
      const newPts = guestPoints + bonusPoints;
      localStorage.setItem('lumimei_guest_points', newPts.toString());
      setGuestPoints(newPts);
      window.dispatchEvent(new Event('pointsUpdated'));
    }

    showToast(`🎉 ចុះវត្តមានជោគជ័យ! អ្នកទទួលបាន +${bonusPoints} ពិន្ទុបន្ថែម!`);
  };

  // Referrals
  const referralCode = `LUMI-${phone ? phone.slice(-4) : 'VIP88'}`;
  const referralLink = `https://lumimei.com/invite?code=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showToast('បានចម្លងតំណភ្ជាប់ណែនាំមិត្តភក្តិ!');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast('បានចម្លងកូដណែនាំ!');
  };

  const phoneStr = String(phone || '');
  const isAdmin =
    userProfile?.role === 'super_admin' ||
    userProfile?.role === 'admin' ||
    userProfile?.role === 'superadmin' ||
    Boolean(phoneStr && phoneStr.includes('11223355')) ||
    phoneStr === '+85511223355';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-top duration-200 border border-emerald-500/30">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 👑 Admin Access Banner (Shown if user is Super Admin / Admin Phone) */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-500/20 via-emerald-600/20 to-teal-700/20 border-2 border-amber-400 rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 font-battambang animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center text-2xl font-black shadow-md shrink-0 ring-2 ring-amber-300">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md">
                  Super Admin
                </span>
                <span className="text-xs font-bold text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                  {phone || '+85511223355'}
                </span>
              </div>
              <p className="text-xs font-bold text-emerald-950 mt-1">
                ស្វាគមន៍មកកាន់ប្រព័ន្ធ! លេខទូរស័ព្ទរបស់អ្នកមានសិទ្ធិគ្រប់គ្រង Admin ជាន់ខ្ពស់។
              </p>
              <p className="text-[11px] text-slate-600">
                （您已作为超级管理员登录，点击右侧按钮可直接进入管理员控制台审核任务与管理积分）
              </p>
            </div>
          </div>
          {onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-700 hover:to-teal-800 text-amber-300 font-extrabold text-xs rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer shrink-0 border border-amber-400/50 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>ចូលផ្ទាំង Admin (Admin Portal)</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>
          )}
        </div>
      )}

      {/* ផ្នែកព័ត៌មានអតិថិជន (Customer Information Section) */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden border border-emerald-500/30 font-battambang">
        {/* Background decorative glows */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />



        {/* Customer Identity Stack: Profile Picture ABOVE Name */}
        <div className="flex flex-col items-center text-center space-y-3 relative z-10">
          
          {/* 1. រូប Profile នៅលើឈ្មោះអតិថិជន */}
          <div className="flex flex-col items-center">
            <div
              className="relative cursor-pointer group"
              onClick={onNavigateToAccount}
              title="ចូលទៅកាន់ការកំណត់ដើម្បីប្តូររូប Profile"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-400 via-emerald-400 to-teal-300 p-1 shadow-xl overflow-hidden relative">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={displayName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-amber-300 font-black text-3xl sm:text-4xl shadow-inner">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. ឈ្មោះអតិថិជន ( Customer Name below profile photo ) */}
          <div className="space-y-1.5 pt-0.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
              {displayName}
            </h1>

            {/* រូបសញ្ញាសំគាល់កម្រិតត្បូងពេជ្រ នៅក្រោមឈ្មោះរបស់អតិថិជន */}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-0.5">
              {isVvip ? (
                <span className="inline-flex items-center gap-1 filter drop-shadow-md" title="កម្រិត VVIP">
                  <GreenDiamondIcon size={20} />
                  <GreenDiamondIcon size={20} />
                </span>
              ) : isVip ? (
                <span className="inline-flex items-center filter drop-shadow-md" title="កម្រិត VIP">
                  <GreenDiamondIcon size={22} />
                </span>
              ) : (
                <span className="text-amber-300 text-base" title="សមាជិកធម្មតា">
                  ⭐
                </span>
              )}

              {/* Facebook Top Friends Icon Badge (Shown if user is Facebook Top Fan / Supporter) */}
              {isFacebookTopFriend && (
                <FacebookIconBadge size={22} title="Facebook Top Friends" />
              )}
            </div>

            {/* 3. ចំនួនពិន្ទុ (នៅក្រោមឈ្មោះ និងកម្រិតត្បូងពេជ្រ) */}
            <div className="my-1">
              <span
                className="bg-amber-400/20 text-amber-300 px-3.5 py-1 rounded-xl font-black border border-amber-400/30 leading-tight inline-block shadow-sm"
                style={{ fontSize: '29px' }}
              >
                {points} ពិន្ទុ
              </span>
            </div>

            {/* 4. ចំនួនទឹកលុយដែលបានចាយសរុប នៅក្រោមពិន្ទុរបស់ខ្ញុំ */}
            <div className="pt-0.5 pb-1">
              <span className="inline-flex items-center gap-1.5 bg-emerald-950/70 text-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-400/30 shadow-xs text-xs font-semibold">
                <span>ទឹកប្រាក់បានចាយសរុប៖</span>
                <span className="text-amber-300 font-extrabold text-sm font-mono tracking-wide">
                  ${Number(totalSpent).toFixed(2)}
                </span>
              </span>
            </div>

            {/* 5. កាលបរិច្ឆេទ (នៅខាងក្រោមចំនួនទឹកលុយបានចាយសរុប) */}
            <div className="text-emerald-200/90 font-medium pt-0.5">
              <span className="font-semibold text-white/90" style={{ fontSize: '8px' }}>
                {getKhmerFormattedDate()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ផ្នែកកាតមុខងារចំនួន 7កាត (7 Feature Cards Section) */}
      <div className="space-y-3 font-battambang">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span>កាតមុខងារ និងសេវាកម្ម</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-full">
            5 មុខងារ
          </span>
        </div>

        {/* សម្រាប់ទម្រង់ទូរស័ព្ទដៃ៖ មួយជួរមាន 2 កាត (Mobile: 2 cards per row: grid-cols-2, Desktop: 4 cards: lg:grid-cols-4) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: ចូលទៅសន្សំពិន្ទុ */}
          <button
            onClick={() => {
              if (onOpenPoints) onOpenPoints();
              else showToast(`ពិន្ទុបច្ចុប្បន្នរបស់អ្នកគឺ ${points} ពិន្ទុ`);
            }}
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 text-left transition cursor-pointer group shadow-2xs hover:shadow-md flex flex-col justify-between min-h-[120px] relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                ចូលទៅសន្សំពិន្ទុ
              </h3>
              <p className="text-[10px] text-slate-600 mt-1 line-clamp-1">
                សន្សំពិន្ទុ & បេសកកម្ម
              </p>
            </div>
          </button>

          {/* Card 2: ការបញ្ជាទិញរបស់ខ្ញុំ */}
          <button
            onClick={() => setActiveModal('orders')}
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 text-left transition cursor-pointer group shadow-2xs hover:shadow-md flex flex-col justify-between min-h-[120px] relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-2.5 rounded-xl bg-blue-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] bg-blue-200 text-blue-900 font-bold px-1.5 py-0.5 rounded-md">
                {userOrders.length} Order
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                ការបញ្ជាទិញរបស់ខ្ញុំ
              </h3>
              <p className="text-[10px] text-slate-600 mt-1 line-clamp-1">
                ពិនិត្យប្រវត្តិ & ស្ថានភាព
              </p>
            </div>
          </button>

          {/* Card 3: រង្វាន់របស់ខ្ញុំ */}
          <button
            onClick={() => {
              if (onOpenPoints) onOpenPoints();
              else setActiveModal('benefits');
            }}
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 border border-purple-200 text-left transition cursor-pointer group shadow-2xs hover:shadow-md flex flex-col justify-between min-h-[120px] relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-2.5 rounded-xl bg-purple-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-purple-700 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                រង្វាន់របស់ខ្ញុំ
              </h3>
              <p className="text-[10px] text-slate-600 mt-1 line-clamp-1">
                ប្តូរយករង្វាន់ & ប័ណ្ណបញ្ចុះតម្លៃ
              </p>
            </div>
          </button>

          {/* Card 4: កម្រិតសមាជិក */}
          <button
            onClick={() => setActiveModal('tier')}
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border border-amber-200 text-left transition cursor-pointer group shadow-2xs hover:shadow-md flex flex-col justify-between min-h-[120px] relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-2.5 rounded-xl bg-amber-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                កម្រិតសមាជិក
              </h3>
              <p className="text-[10px] text-slate-600 mt-1 line-clamp-1">
                {isVvip
                  ? 'សមាជិក VVIP ($1000+)'
                  : isVip
                  ? 'សមាជិក VIP ($200+)'
                  : 'សមាជិកធម្មតា & Facebook Top Friends'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* MODALS FOR FEATURE CARDS */}

      {/* 2. Modal: ការបញ្ជាទិញរបស់ខ្ញុំ (My Orders) */}
      {activeModal === 'orders' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 font-battambang animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative border border-blue-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  ការបញ្ជាទិញរបស់ខ្ញុំ ({userOrders.length})
                </h3>
                <p className="text-xs text-slate-500">
                  ប្រវត្តិ និងស្ថានភាពនៃការបញ្ជាទិញទំនិញ
                </p>
              </div>
            </div>

            {userOrders.length === 0 ? (
              <div className="text-center py-8 space-y-3 bg-slate-50 rounded-2xl border border-slate-100">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-600 font-semibold">
                  លោកអ្នកមិនទាន់មានប្រវត្តិបញ្ជាទិញនៅឡើយទេ។
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {userOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-extrabold text-slate-900">
                        កូដបញ្ជាទិញ៖ {ord.orderNumber}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        {ord.orderStatus === 'packing' ? 'កំពុងរៀបចំ' : ord.orderStatus || 'បានបញ្ជាក់'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>កាលបរិច្ឆេទ៖</span>
                      <span>{ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('km-KH') : 'ថ្មីៗនេះ'}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>ទឹកប្រាក់សរុប៖</span>
                      <span className="text-emerald-700 font-mono">${(ord.totalUsd || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Modal: អត្ថប្រយោជន៍របស់ខ្ញុំ (My Benefits) */}
      {activeModal === 'benefits' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 font-battambang animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative border border-purple-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  អត្ថប្រយោជន៍របស់ខ្ញុំ
                </h3>
                <p className="text-xs text-slate-500">
                  សិទ្ធិពិសេស និងការបញ្ចុះតម្លៃសម្រាប់គណនីរបស់អ្នក
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl flex items-center gap-3">
                <Gift className="w-5 h-5 text-purple-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">កាដូខួបកំណើតពិសេស</div>
                  <div className="text-slate-600 text-[11px]">
                    ថែមជូនកាដូ និងការខ្ចប់កាដូឥតគិតថ្លៃពេលខួបកំណើត
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <Truck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">សេវាដឹកជញ្ជូនឥតគិតថ្លៃ</div>
                  <div className="text-slate-600 text-[11px]">
                    {isVvip
                      ? 'Free ដឹកគ្រប់ការកុម្ម៉ង់ទាំងអស់'
                      : isVip
                      ? 'Free ដឹកពេលចំណាយចាប់ពី $20 ឡើង'
                      : isFacebookTopFriend
                      ? 'Free ដឹកពេលចំណាយចាប់ពី $10 ឡើង'
                      : 'Free ដឹកតាមលក្ខខណ្ឌប្រូម៉ូសិន'}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                <Coins className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">សន្សំពិន្ទុប្តូរយករង្វាន់</div>
                  <div className="text-slate-600 text-[11px]">
                    ទទួលបានពិន្ទុរាល់ការទិញ និងឆែកវត្តមានប្រចាំថ្ងៃ
                  </div>
                </div>
              </div>
            </div>

            {/* Button to view all member tiers */}
            <button
              onClick={() => {
                setActiveModal('tier');
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm mt-2"
            >
              <Award className="w-4 h-4" />
              <span>មើលលក្ខខណ្ឌ & អត្ថប្រយោជន៍កម្រិតសមាជិកទាំងអស់</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Modal: ណែនាំមិត្តភក្តិ (Refer Friends) */}
      {activeModal === 'referral' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 font-battambang animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative border border-sky-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  ណែនាំមិត្តភក្តិ ទទួលបាន +5 ពិន្ទុ
                </h3>
                <p className="text-xs text-slate-500">
                  ចែករំលែក Lumimei ទៅកាន់មិត្តភក្តិរបស់អ្នក
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-3">
                <div className="font-bold text-sky-900">
                  កូដណែនាំរបស់អ្នក (Your Referral Code)
                </div>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-sky-200 font-mono font-extrabold text-sm text-sky-950">
                  <span>{referralCode}</span>
                  <button
                    onClick={handleCopyCode}
                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-sans transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'បានចម្លង' : 'ចម្លងកូដ'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="font-extrabold text-slate-900">
                  លក្ខខណ្ឌនៃការទទួលបានពិន្ទុ៖
                </div>
                <p className="text-slate-600 leading-relaxed">
                  នៅពេលមិត្តភក្តិរបស់អ្នកចុះឈ្មោះប្រើប្រាស់ Lumimei ដោយប្រើប្រាស់កូដ ឬតំណភ្ជាប់របស់អ្នក លោកអ្នកទាំងពីរនឹងទទួលបាន <strong>+5 ពិន្ទុបន្ថែម</strong> ដោយស្វ័យប្រវត្តិ!
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'បានចម្លងតំណភ្ជាប់' : 'ចម្លងតំណភ្ជាប់ផ្ញើទៅកាន់មិត្តភក្តិ'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Modal: កម្រិតសមាជិក (Member Tier Status & Benefits) */}
      {activeModal === 'tier' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 font-battambang animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl relative border border-amber-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  កម្រិតសមាជិក & អត្ថប្រយោជន៍
                </h3>
              </div>
            </div>

            {/* Status & Progress Bar */}
            <div className="p-4 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 rounded-2xl space-y-2.5 shadow-sm">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="flex items-center gap-1.5 flex-wrap">
                  {isVvip ? (
                    <span className="inline-flex items-center gap-1 bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full font-black text-xs">
                      <GreenDiamondIcon size={13} />
                      <GreenDiamondIcon size={13} />
                      <span>សមាជិក VVIP</span>
                    </span>
                  ) : isVip ? (
                    <span className="inline-flex items-center gap-1 bg-slate-950 text-emerald-300 px-2.5 py-0.5 rounded-full font-black text-xs">
                      <GreenDiamondIcon size={14} />
                      <span>សមាជិក VIP</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-slate-950 text-white px-2.5 py-0.5 rounded-full font-black text-xs">
                      <span>⭐ សមាជិកធម្មតា</span>
                    </span>
                  )}
                </span>
                <span className="font-mono bg-white/20 px-2 py-0.5 rounded-md font-extrabold">
                  ទិញសរុប៖ ${Number(totalSpent).toFixed(2)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-900/20 rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className="bg-slate-950 h-full rounded-full transition-all duration-500"
                  style={{
                    width: isVvip
                      ? '100%'
                      : isVip
                      ? `${Math.min(100, (Number(totalSpent) / 1000) * 100)}%`
                      : `${Math.min(100, (Number(totalSpent) / 200) * 100)}%`,
                  }}
                />
              </div>

              <p className="text-[11px] font-bold text-slate-900 pt-0.5">
                {isVvip
                  ? '🎉 អបអរសាទរ! លោកអ្នកជាសមាជិក VVIP ទទួលបានអត្ថប្រយោជន៍ខ្ពស់បំផុត!'
                  : isVip
                  ? `ត្រូវការចំណាយ $${Math.max(0, 1000 - Number(totalSpent)).toFixed(2)} ទៀត ដើម្បីឡើងជាសមាជិក VVIP (ចំណាយ $1000+)!`
                  : `ត្រូវការចំណាយ $${Math.max(0, 200 - Number(totalSpent)).toFixed(2)} ទៀត ដើម្បីឡើងជាសមាជិក VIP (ចំណាយ $200+)!`}
              </p>
            </div>

            {/* Interactive Tier Selection Tabs */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Tab 1: សមាជិកធម្មតា */}
                <button
                  onClick={() => setSelectedTierTab('normal')}
                  className={`p-2.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 shadow-2xs ${
                    selectedTierTab === 'normal'
                      ? 'bg-amber-100 border-amber-400 text-amber-950 ring-2 ring-amber-400/40 font-extrabold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <span className="text-base leading-none">⭐</span>
                  <span className="text-xs">សមាជិកធម្មតា</span>
                  {isNormal && (
                    <span className="text-[9px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded-full font-bold">
                      កម្រិតអ្នក
                    </span>
                  )}
                </button>

                {/* Tab 2: សមាជិក VIP */}
                <button
                  onClick={() => setSelectedTierTab('vip')}
                  className={`p-2.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 shadow-2xs ${
                    selectedTierTab === 'vip'
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400/40 font-extrabold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <GreenDiamondIcon size={18} />
                  <span className="text-xs">សមាជិក VIP</span>
                  {isVip && (
                    <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full font-bold">
                      កម្រិតអ្នក
                    </span>
                  )}
                </button>

                {/* Tab 3: សមាជិក VVIP */}
                <button
                  onClick={() => setSelectedTierTab('vvip')}
                  className={`p-2.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 shadow-2xs ${
                    selectedTierTab === 'vvip'
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400/40 font-extrabold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-0.5">
                    <GreenDiamondIcon size={16} />
                    <GreenDiamondIcon size={16} />
                  </div>
                  <span className="text-xs">សមាជិក VVIP</span>
                  {isVvip && (
                    <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full font-bold">
                      កម្រិតអ្នក
                    </span>
                  )}
                </button>

                {/* Tab 4: Facebook Top Friends */}
                <button
                  onClick={() => setSelectedTierTab('fb_top_friends')}
                  className={`p-2.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 shadow-2xs ${
                    selectedTierTab === 'fb_top_friends'
                      ? 'bg-blue-100 border-blue-500 text-blue-950 ring-2 ring-blue-400/40 font-extrabold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <FacebookIconBadge size={18} title="Facebook Top Friends" />
                  <span className="text-xs">FB Top Friends</span>
                  {isFacebookTopFriend && (
                    <span className="text-[9px] bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded-full font-bold">
                      កម្រិតអ្នក
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* DYNAMIC PERKS CARD FOR SELECTED TIER */}
            <div className="animate-in fade-in duration-300">
              {/* 1. សមាជិកធម្មតា */}
              {selectedTierTab === 'normal' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-amber-100/50 border-2 border-amber-300 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⭐</span>
                      <div>
                        <h4 className="font-extrabold text-amber-950 text-sm">
                          អត្ថប្រយោជន៍សមាជិកធម្មតា (Normal Member)
                        </h4>
                        <p className="text-[11px] text-amber-800 font-medium">
                          លក្ខខណ្ឌ៖ ចុះឈ្មោះគណនីលើវេបសាយ Lumimei ដោយឥតគិតថ្លៃ
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-amber-200/80 text-amber-900 text-[11px] font-extrabold shrink-0">
                      សមាជិកទូទៅ
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-800">
                    <div className="p-3 bg-white/90 rounded-xl border border-amber-200 flex items-start gap-2.5 shadow-2xs">
                      <Gift className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="leading-relaxed font-semibold">
                        ពេលប្ដីឬប្រពន្ធ ឬក៏សង្សារ ទិញកាដូឲ្យម្ចាស់ខួប ថែមជូនកាដូខួបកំណើតតូចមួយ និង free ការខ្ចប់កាដូដ៏ស្រស់ស្អាតជូន
                      </p>
                    </div>

                    <div className="p-3 bg-white/90 rounded-xl border border-amber-200 flex items-start gap-2.5 shadow-2xs">
                      <Coins className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="leading-relaxed font-semibold">
                        សន្សំពិន្ទុរាល់ការបញ្ជាទិញ និងចុះវត្តមានប្រចាំថ្ងៃ ដើម្បីប្តូរយករង្វាន់ និងប័ណ្ណបញ្ចុះតម្លៃ
                      </p>
                    </div>

                    <div className="p-3 bg-white/90 rounded-xl border border-amber-200 flex items-start gap-2.5 shadow-2xs">
                      <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="leading-relaxed font-semibold">
                        ពិគ្រោះបញ្ហាស្បែកមុខជាមួយ AI Skincare Advisor ដោយឥតគិតថ្លៃ 24/7
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. សមាជិក VIP */}
              {selectedTierTab === 'vip' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-emerald-100/50 border-2 border-emerald-400 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 rounded-xl shadow-2xs">
                        <GreenDiamondIcon size={20} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-emerald-950 text-sm">
                          អត្ថប្រយោជន៍សមាជិក VIP (ចំណាយ $200+)
                        </h4>
                        <p className="text-[11px] text-emerald-800 font-medium">
                          លក្ខខណ្ឌ៖ ចំណាយចាប់ពី $200 ឡើងទៅ ឬសន្សំបាន 20 ពិន្ទុ
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-200 text-emerald-900 text-[11px] font-extrabold shrink-0">
                      VIP Member
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-800">
                    <div className="p-3 bg-white/95 rounded-xl border border-emerald-200 flex items-start gap-2.5 shadow-2xs">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0 text-xs mt-0.5">
                        ១
                      </span>
                      <p className="leading-relaxed font-bold text-slate-900">
                        ថែមជូនកាដូខួបកំណើតតូចមួយ
                      </p>
                    </div>

                    <div className="p-3 bg-white/95 rounded-xl border border-emerald-200 flex items-start gap-2.5 shadow-2xs">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0 text-xs mt-0.5">
                        ២
                      </span>
                      <p className="leading-relaxed font-bold text-slate-900">
                        ពេលប្ដីឬប្រពន្ធ ឬក៏សង្សារ ទិញកាដូឲ្យម្ចាស់ខួប ថែមជូនកាដូខួបកំណើតតូចមួយ និង free ការខ្ចប់កាដូដ៏ស្រស់ស្អាតជូន
                      </p>
                    </div>

                    <div className="p-3 bg-white/95 rounded-xl border border-emerald-200 flex items-start gap-2.5 shadow-2xs">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0 text-xs mt-0.5">
                        ៣
                      </span>
                      <p className="leading-relaxed font-bold text-emerald-900">
                        រាល់ការចំណាយអស់ 20 ដុល្លារ បញ្ចុះតម្លៃជូន 10% free ដឹក
                      </p>
                    </div>

                    <div className="p-3 bg-white/95 rounded-xl border border-emerald-200 flex items-start gap-2.5 shadow-2xs">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0 text-xs mt-0.5">
                        ៤
                      </span>
                      <p className="leading-relaxed font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                        <span>ទទួលបានផ្លាកសញ្ញាត្បូងពេជ្របៃតង</span>
                        <GreenDiamondIcon size={16} />
                        <span>លើ Profile គណនីរបស់អ្នក</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. សមាជិក VVIP */}
              {selectedTierTab === 'vvip' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-100/80 via-teal-100/50 to-emerald-200/50 border-2 border-emerald-500 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-emerald-300 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-200 rounded-xl shadow-2xs flex items-center gap-0.5">
                        <GreenDiamondIcon size={18} />
                        <GreenDiamondIcon size={18} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-emerald-950 text-sm">
                          អត្ថប្រយោជន៍សមាជិក VVIP (ចំណាយ $1000+)
                        </h4>
                        <p className="text-[11px] text-emerald-800 font-medium">
                          លក្ខខណ្ឌ៖ ចំណាយចាប់ពី $1000 ឡើងទៅ ឬសន្សំបាន 100 ពិន្ទុ
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-extrabold shrink-0 shadow-2xs">
                      VVIP Member
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-800">
                    <div className="p-3 bg-white/95 rounded-xl border border-emerald-300 flex items-start gap-2.5 shadow-2xs">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs mt-0.5">
                        ១
                      </span>
                      <p className="leading-relaxed font-bold text-slate-900">
                        ថែមជូនកាដូខួបកំណើតពិសេស (Special Birthday Gift)
                      </p>
                    </div>

                    <div className="p-3 bg-white/95 rounded-xl border border-emerald-300 flex items-start gap-2.5 shadow-2xs">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs mt-0.5">
                        ២
                      </span>
                      <p className="leading-relaxed font-bold text-slate-900">
                        ពេលប្ដីឬប្រពន្ធ ឬក៏សង្សារ ទិញកាដូឲ្យម្ចាស់ខួប ថែមជូនកាដូខួបកំណើតតូចមួយ និង free ការខ្ចប់កាដូដ៏ស្រស់ស្អាតជូន
                      </p>
                    </div>

                    <div className="p-3 bg-white/95 rounded-xl border border-emerald-300 flex items-start gap-2.5 shadow-2xs">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs mt-0.5">
                        ៣
                      </span>
                      <p className="leading-relaxed font-bold text-emerald-900">
                        រាល់ការចំណាយអស់ 20 ដុល្លារ បញ្ចុះតម្លៃជូន 15% ទៅ 20% free ដឹកគ្រប់ការកុម្ម៉ង់
                      </p>
                    </div>

                    <div className="p-3 bg-white/95 rounded-xl border border-emerald-300 flex items-start gap-2.5 shadow-2xs">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs mt-0.5">
                        ៤
                      </span>
                      <p className="leading-relaxed font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                        <span>ទទួលបានផ្លាកសញ្ញាត្បូងពេជ្របៃតងទ្វេ</span>
                        <span className="inline-flex items-center gap-0.5">
                          <GreenDiamondIcon size={16} />
                          <GreenDiamondIcon size={16} />
                        </span>
                        <span>លើ Profile គណនីរបស់អ្នក</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Facebook Top Friends */}
              {selectedTierTab === 'fb_top_friends' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-sky-50/60 to-indigo-100/50 border-2 border-blue-400 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-blue-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-[#1877F2] rounded-xl text-white shadow-2xs">
                        <FacebookIconBadge size={22} title="Facebook Top Friends" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-blue-950 text-sm">
                          អត្ថប្រយោជន៍ Facebook Top Friends
                        </h4>
                        <p className="text-[11px] text-blue-800 font-medium">
                          លក្ខខណ្ឌ៖ មិត្តភក្តិ & អ្នកគាំទ្រឆ្នើម (Top Fan) លើទំព័រ Facebook Lumimei
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-blue-200 text-blue-900 text-[11px] font-extrabold shrink-0">
                      FB Top Friend
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-800">
                    <div className="p-3 bg-white/95 rounded-xl border border-blue-200 flex items-start gap-2.5 shadow-2xs">
                      <span className="w-6 h-6 rounded-full bg-[#1877F2] text-white font-black flex items-center justify-center shrink-0 text-xs mt-0.5">
                        ១
                      </span>
                      <p className="leading-relaxed font-bold text-slate-900">
                        ថែមជូនកាដូខួបកំណើតតូចមួយ
                      </p>
                    </div>

                    <div className="p-3 bg-white/95 rounded-xl border border-blue-200 flex items-start gap-2.5 shadow-2xs">
                      <span className="w-6 h-6 rounded-full bg-[#1877F2] text-white font-black flex items-center justify-center shrink-0 text-xs mt-0.5">
                        ២
                      </span>
                      <p className="leading-relaxed font-bold text-slate-900">
                        ពេលប្ដីឬប្រពន្ធ ឬក៏សង្សារ ទិញកាដូឲ្យម្ចាស់ខួប ថែមជូនកាដូខួបកំណើតតូចមួយ និង free ការខ្ចប់កាដូដ៏ស្រស់ស្អាតជូន
                      </p>
                    </div>

                    <div className="p-3 bg-white/95 rounded-xl border border-blue-200 flex items-start gap-2.5 shadow-2xs">
                      <span className="w-6 h-6 rounded-full bg-[#1877F2] text-white font-black flex items-center justify-center shrink-0 text-xs mt-0.5">
                        ៣
                      </span>
                      <p className="leading-relaxed font-bold text-blue-900">
                        រាល់ការចំណាយអស់ 10 ដុល្លារ បញ្ចុះតម្លៃជូន 10% free ដឹក
                      </p>
                    </div>

                    <div className="p-3 bg-white/95 rounded-xl border border-blue-200 flex items-start gap-2.5 shadow-2xs">
                      <span className="w-6 h-6 rounded-full bg-[#1877F2] text-white font-black flex items-center justify-center shrink-0 text-xs mt-0.5">
                        ៤
                      </span>
                      <p className="leading-relaxed font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                        <span>ទទួលបានផ្លាកសញ្ញា Facebook Top Friends</span>
                        <FacebookIconBadge size={16} title="Facebook Top Friends" />
                        <span>លើ Profile គណនីរបស់អ្នក</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Clickable Comparison Table */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900">
                  តារាងសង្ខេបកម្រិតសមាជិក (ចុចលើជួរនីមួយៗដើម្បីជ្រើសរើស)៖
                </h4>
              </div>
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-slate-700">
                <div className="grid grid-cols-3 bg-slate-100 p-2.5 font-extrabold text-slate-900 border-b border-slate-200">
                  <span>កម្រិតសមាជិក</span>
                  <span className="text-center">លក្ខខណ្ឌកំណត់</span>
                  <span className="text-center">សញ្ញា (Badge)</span>
                </div>

                {/* 1. សមាជិកធម្មតា Row */}
                <div
                  onClick={() => setSelectedTierTab('normal')}
                  className={`grid grid-cols-3 p-2.5 border-b border-slate-100 items-center cursor-pointer transition ${
                    selectedTierTab === 'normal'
                      ? 'bg-amber-100/80 font-bold border-l-4 border-l-amber-500'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <span>សមាជិកធម្មតា</span>
                  </span>
                  <span className="text-center text-slate-600 text-xs">ចុះឈ្មោះស្វ័យប្រវត្តិ</span>
                  <div className="flex justify-center">
                    <span className="text-amber-500 text-sm">⭐</span>
                  </div>
                </div>

                {/* 2. សមាជិក VIP Row */}
                <div
                  onClick={() => setSelectedTierTab('vip')}
                  className={`grid grid-cols-3 p-2.5 border-b border-slate-100 items-center cursor-pointer transition ${
                    selectedTierTab === 'vip'
                      ? 'bg-emerald-100/80 font-bold border-l-4 border-l-emerald-500'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-emerald-800">សមាជិក VIP</span>
                  <span className="text-center text-emerald-700 text-xs font-bold">ចំណាយចាប់ពី $200 ឡើង</span>
                  <div className="flex justify-center">
                    <GreenDiamondIcon size={20} />
                  </div>
                </div>

                {/* 3. សមាជិក VVIP Row */}
                <div
                  onClick={() => setSelectedTierTab('vvip')}
                  className={`grid grid-cols-3 p-2.5 border-b border-slate-100 items-center cursor-pointer transition ${
                    selectedTierTab === 'vvip'
                      ? 'bg-emerald-100/80 font-bold border-l-4 border-l-emerald-500'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-emerald-800">សមាជិក VVIP</span>
                  <span className="text-center text-emerald-700 text-xs font-bold">ចំណាយចាប់ពី $1000 ឡើង</span>
                  <div className="flex justify-center gap-1">
                    <GreenDiamondIcon size={18} />
                    <GreenDiamondIcon size={18} />
                  </div>
                </div>

                {/* 4. Facebook Top Friends Row */}
                <div
                  onClick={() => setSelectedTierTab('fb_top_friends')}
                  className={`grid grid-cols-3 p-2.5 border-t border-blue-100 items-center cursor-pointer transition ${
                    selectedTierTab === 'fb_top_friends'
                      ? 'bg-blue-100/80 font-bold border-l-4 border-l-blue-500'
                      : 'bg-blue-50/40 hover:bg-blue-50'
                  }`}
                >
                  <span className="font-bold text-blue-900">Facebook Top Friends</span>
                  <span className="text-center text-blue-800 text-[11px] font-semibold">
                    មិត្តភក្តិ & Top Fan លើ FB
                  </span>
                  <div className="flex justify-center">
                    <FacebookIconBadge size={20} title="Facebook Top Friends" />
                  </div>
                </div>
              </div>

              {/* Facebook Top Friends Official Page Link */}
              <div className="p-3 bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#1877F2] text-white flex items-center justify-center shadow-xs shrink-0">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-blue-950 text-xs">
                      Facebook Top Friends
                    </h5>
                    <p className="text-[10px] text-blue-800">
                      ទទួលបានផ្លាកសញ្ញាពិសេស និងការបញ្ចុះតម្លៃចំណាយត្រឹម $10 បាន 10% free ដឹក!
                    </p>
                  </div>
                </div>
                <a
                  href="https://www.facebook.com/LumimeiCambodia"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-[#1877F2] hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold transition shrink-0 shadow-xs flex items-center gap-1"
                >
                  <span>ទំព័រ Facebook</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: ចុះវត្តមានប្រចាំថ្ងៃ (Daily Check-in) */}
      {activeModal === 'checkin' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 font-battambang animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative border border-emerald-100">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  ចុះវត្តមានប្រចាំថ្ងៃ (+2 ពិន្ទុ)
                </h3>
                <p className="text-xs text-slate-500">
                  ចុះវត្តមានដើម្បីទទួលបានពិន្ទុបន្ថែមជារៀងរាល់ថ្ងៃ
                </p>
              </div>
            </div>

            {/* Streak Counter */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
              <span className="text-xs text-emerald-800 font-bold">
                ចំនួនថ្ងៃចុះវត្តមានជាប់ៗគ្នា
              </span>
              <div className="text-2xl font-black text-emerald-900">
                🔥 {checkinStreak} ថ្ងៃ
              </div>
            </div>

            {/* Daily checkin status button */}
            <button
              onClick={handleDailyCheckin}
              disabled={isCheckedInToday}
              className={`w-full py-3.5 rounded-2xl font-extrabold text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                isCheckedInToday
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {isCheckedInToday
                  ? 'អ្នកបានចុះវត្តមានថ្ងៃនេះរួចរាល់'
                  : 'ចុះវត្តមានថ្ងៃនេះ (+2 ពិន្ទុ)'}
              </span>
            </button>

            <p className="text-[11px] text-slate-500 text-center">
              ចុះវត្តមានរៀងរាល់ថ្ងៃដើម្បីសន្សំពិន្ទុដូរយកប័ណ្ណបញ្ចុះតម្លៃពី Lumimei!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
