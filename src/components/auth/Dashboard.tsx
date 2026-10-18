import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { auth, db, maskPhoneNumber, safeSetItem, ensureFirebaseAuth } from '../../lib/firebase';
import { compressImageFile } from '../../utils/imageCompress';
import { runWithLoading } from '../../utils/asyncUtils';
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
  Activity,
  FileText,
  ScanFace,
  CalendarCheck,
  ArrowLeft,
  SlidersHorizontal,
} from 'lucide-react';
import {
  getComedonesBaseline,
} from '../../advisor/closedComedonesAdvisor';
import { getAllStoredProducts } from '../../utils/productManager';
import { SkinFollowUpView } from '../SkinFollowUpView';
import { SkinReportsHistoryView } from '../SkinReportsHistoryView';

interface DashboardProps {
  onOpenAiAdvisor?: () => void;
  onNavigateToAccount: () => void;
  onLogoutSuccess: () => void;
  onOpenPoints?: () => void;
  onNavigateToAdmin?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenAiAdvisor,
  onNavigateToAccount,
  onLogoutSuccess,
  onOpenPoints,
  onNavigateToAdmin,
}) => {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<
    'skincare' | 'orders' | 'benefits' | 'referral' | 'tier' | 'checkin' | null
  >(null);
  const [skinAnalysisSubView, setSkinAnalysisSubView] = useState<'followup' | 'report'>('followup');

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

  const points =
    userProfile?.points !== undefined
      ? userProfile.points > 0
        ? userProfile.points
        : (!userProfile.totalSpent || userProfile.totalSpent === 0)
        ? 15
        : (userProfile.points || 0)
      : guestPoints;
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
      localStorage.getItem('lumimei_user_photo_url') ||
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

  // 登录后直接从 Firestore users/{targetUid} 读取头像和昵称
  useEffect(() => {
    const targetUid = auth.currentUser?.uid || currentUser?.uid;
    if (targetUid) {
      getDoc(doc(db, 'users', targetUid))
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data?.photoURL) {
              setProfilePhoto(data.photoURL);
              safeSetItem('lumimei_user_photo_url', data.photoURL);
            }
          }
        })
        .catch(() => {});
    }
  }, [currentUser]);

  const [photoLoading, setPhotoLoading] = useState(false);

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('សូមជ្រើសរើសរូបភាពដែលមានទំហំតូចជាង 10MB');
      return;
    }

    const targetUid = auth.currentUser?.uid || currentUser?.uid;

    await runWithLoading(
      async () => {
        // 1. 头像上传前压缩到 256x256、JPEG 质量 0.7，控制在 100KB 以内
        const dataUrl = await compressImageFile(file, 256, 256, 0.7);
        if (dataUrl) {
          await ensureFirebaseAuth();
          // 2. 保存到 users/{auth.currentUser.uid}，用 setDoc(..., { merge: true })
          if (targetUid) {
            const userRef = doc(db, 'users', targetUid);
            await setDoc(userRef, { photoURL: dataUrl, updatedAt: serverTimestamp() }, { merge: true });
          }

          setProfilePhoto(dataUrl);
          safeSetItem('lumimei_user_photo_url', dataUrl);
          window.dispatchEvent(new Event('photoUpdated'));

          if (currentUser && userProfile) {
            try {
              await updateUserProfile({ photoURL: dataUrl });
            } catch (err) {
              console.error(err);
            }
          }

          // 3. 保存成功后才显示 "រក្សាទុកបានជោគជ័យ"
          showToast('រក្សាទុកបានជោគជ័យ');
        }
      },
      setPhotoLoading,
      {
        timeoutMs: 30000,
        showErrorAlert: false,
        onError: (err: any) => {
          console.error('Failed to compress or save profile photo:', err);
          showToast(err?.friendlyKm || err?.message || 'មិនអាចរក្សាទុករូបភាពបានទេ។ សូមព្យាយាមម្ដងទៀត។');
        },
      }
    );
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

      {/* ផ្នែកព័ត៌មានអតិថិជន (Customer Information Section - 长方形卡片) */}
      <div className="bg-[#FFFFFF] text-[#2E8B57] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-md relative overflow-hidden border border-[#2E8B57]/20 font-battambang">
        {/* Background subtle decorative accents */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#2E8B57]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#FF7F50]/5 rounded-full blur-2xl pointer-events-none" />

        {/* Customer Identity Stack: Horizontal Rectangle Layout with 2 rows */}
        <div className="relative z-10 space-y-2">
          
          {/* Row 1: Left: Avatar + Name + Badges | Right: Points */}
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {/* 1. រូប Profile */}
              <div
                className="relative cursor-pointer group shrink-0"
                onClick={onNavigateToAccount}
                title="ប្តូររូប Profile"
              >
                <div
                  className="w-[35px] h-[35px] rounded-full bg-[#FFFFFF] border-2 border-[#FF7F50] p-0.5 shadow-xs overflow-hidden relative shrink-0 flex items-center justify-center"
                  style={{ width: '35px', height: '35px' }}
                >
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt={displayName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#FFFFFF] rounded-full flex items-center justify-center text-[#FF7F50] font-black text-sm">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. ឈ្មោះអតិថិជន & កម្រិតសមាជិក */}
              <div className="min-w-0 space-y-0.5">
                <h1 className="text-base sm:text-xl font-extrabold text-[#2E8B57] tracking-wide leading-tight truncate">
                  {displayName}
                </h1>

                {/* កម្រិតសមាជិក នៅខាងក្រោមឈ្មោះអតិថិជន */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isVvip ? (
                    <span className="inline-flex items-center gap-1 bg-[#FFFFFF] text-[#2E8B57] px-2 py-0.5 rounded-lg border border-[#2E8B57]/30 text-[10px] font-bold shadow-2xs" title="កម្រិត VVIP">
                      <span className="inline-flex items-center justify-center gap-0.5" style={{ width: '25px', height: '15px' }}>
                        <GreenDiamondIcon size={12} />
                        <GreenDiamondIcon size={12} />
                      </span>
                      <span className="text-[#2E8B57]">កម្រិត VVIP</span>
                    </span>
                  ) : isVip ? (
                    <span className="inline-flex items-center gap-1 bg-[#FFFFFF] text-[#2E8B57] px-2 py-0.5 rounded-lg border border-[#2E8B57]/30 text-[10px] font-bold shadow-2xs" title="កម្រិត VIP">
                      <GreenDiamondIcon size={13} />
                      <span className="text-[#2E8B57]">កម្រិត VIP</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-[#FFFFFF] text-[#2E8B57] px-2 py-0.5 rounded-lg border border-[#2E8B57]/30 text-[10px] font-bold shadow-2xs" title="សមាជិកធម្មតា">
                      <span className="text-[#2E8B57] text-xs">⭐</span>
                      <span className="text-[#2E8B57]">សមាជិកធម្មតា</span>
                    </span>
                  )}

                  {/* Facebook Top Friends Icon Badge */}
                  {isFacebookTopFriend && (
                    <FacebookIconBadge size={18} title="Facebook Top Friends" />
                  )}
                </div>
              </div>
            </div>

            {/* Right: Points */}
            <div className="flex flex-col items-end justify-center shrink-0 text-right">
              {/* ចំនួនពិន្ទុ */}
              <span
                className="bg-[#FFFFFF] text-[#FF7F50] px-3.5 py-1.5 rounded-xl font-black border border-[#FF7F50]/40 leading-tight inline-block shadow-2xs"
                style={{ fontSize: '14px', color: '#FF7F50' }}
              >
                {points} ពិន្ទុ
              </span>
            </div>
          </div>

          {/* Row 2: នៅខាងក្រោមរូប profile នៅជួរមួយទៀត (ទឹកប្រាក់បានចាយសរុប & កាលបរិច្ឆេទ) */}
          <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap pt-0.5">
            {/* ទឹកប្រាក់បានចាយសរុប */}
            <div style={{ fontSize: '9px' }}>
              <span
                className="inline-flex items-center gap-1.5 bg-[#FFFFFF] text-[#2E8B57] px-2.5 py-0.5 rounded-lg border border-[#2E8B57]/20 shadow-2xs font-semibold"
                style={{ fontSize: '9px' }}
              >
                <span className="text-[#2E8B57]">ទឹកប្រាក់បានចាយសរុប៖</span>
                <span className="text-[#FF7F50] font-extrabold font-mono tracking-wide" style={{ fontSize: '10px', color: '#FF7F50' }}>
                  ${Number(totalSpent).toFixed(2)}
                </span>
              </span>
            </div>

            {/* កាលបរិច្ឆេទ */}
            <div className="text-[#2E8B57] font-medium">
              <span className="font-semibold text-[#2E8B57] leading-none block" style={{ fontSize: '8px', color: '#2E8B57' }}>
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
            6 មុខងារ
          </span>
        </div>

        {/* សម្រាប់ទម្រង់ទូរស័ព្ទដៃ៖ មួយជួរមាន 2 កាត (Mobile: 2 cards per row: grid-cols-2, Desktop: sm:grid-cols-3 lg:grid-cols-3) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: បន្តតាមដានស្បែកមុខ */}
          <button
            id="dashboard-card-skin-analysis"
            onClick={() => {
              setSkinAnalysisSubView('followup');
              setActiveModal('skincare');
            }}
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#2E8B57]/10 via-[#2E8B57]/5 to-emerald-50/40 hover:from-[#2E8B57]/20 hover:to-emerald-100/60 border-2 border-[#2E8B57]/40 text-left transition cursor-pointer group shadow-2xs hover:shadow-md flex flex-col justify-between min-h-[120px] relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-2.5 rounded-xl bg-[#2E8B57] text-white shadow-xs group-hover:scale-105 transition-transform">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] bg-[#2E8B57]/15 text-[#2E8B57] font-black px-1.5 py-0.5 rounded-md border border-[#2E8B57]/30">
                តាមដាន
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                បន្តតាមដានស្បែកមុខ
              </h3>
              <p className="text-[10px] text-slate-600 mt-1 line-clamp-1">
                បន្តតាមដាន & របាយការណ៍
              </p>
            </div>
          </button>

          {/* Card 2: ចូលទៅសន្សំពិន្ទុ */}
          <button
            id="dashboard-card-points"
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
            id="dashboard-card-orders"
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

          {/* Card 3: កម្រិតសមាជិក (Member Tier) */}
          <button
            id="dashboard-card-tier"
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

          {/* Card 5: ចាកចេញ (Logout Card) */}
          <button
            id="dashboard-card-logout"
            onClick={handleLogout}
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 hover:from-rose-100 hover:to-red-100 border border-rose-200 text-left transition cursor-pointer group shadow-2xs hover:shadow-md flex flex-col justify-between min-h-[120px] relative overflow-hidden"
            title="ចាកចេញពីគណនី (Logout)"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-2.5 rounded-xl bg-rose-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-rose-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                ចាកចេញ
              </h3>
              <p className="text-[10px] text-rose-600 font-medium mt-1 line-clamp-1">
                ចាកចេញពីគណនី (Logout)
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* MODALS FOR FEATURE CARDS */}

      {/* 1. Modal: វិភាគស្បែកមុខរបស់ខ្ញុំ (My Skin Analysis) */}
      {activeModal === 'skincare' && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-battambang animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 space-y-5 shadow-2xl relative border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2E8B57] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {skinAnalysisSubView === 'report'
                      ? 'របាយការណ៍តាមដានស្បែកមុខ'
                      : 'បន្តតាមដានការប្រែប្រួលស្បែកមុខ'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    តាមដានវឌ្ឍនភាពស្បែកមុខ និងរបាយការណ៍លម្អិត
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveModal(null);
                  setSkinAnalysisSubView('followup');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 transition cursor-pointer shrink-0"
                title="បិទ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Buttons in the SAME row on mobile & desktop: [បន្តតាមដាន] [របាយការណ៍] */}
            {/* Formatted cleanly without icons */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 p-1 bg-slate-200/80 rounded-2xl border border-slate-300/60">
              {/* Tab 1: បន្តតាមដាន */}
              <button
                type="button"
                onClick={() => setSkinAnalysisSubView('followup')}
                className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm text-center flex items-center justify-center transition cursor-pointer leading-tight ${
                  skinAnalysisSubView === 'followup'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/50'
                }`}
              >
                <span>បន្តតាមដាន</span>
              </button>

              {/* Tab 2: របាយការណ៍ */}
              <button
                type="button"
                onClick={() => setSkinAnalysisSubView('report')}
                className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm text-center flex items-center justify-center transition cursor-pointer leading-tight ${
                  skinAnalysisSubView === 'report'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/50'
                }`}
              >
                <span>របាយការណ៍</span>
              </button>
            </div>

            {/* SubView 1: បន្តតាមដាន (Follow-up Page with Date picker on top and Q&A below) */}
            {skinAnalysisSubView === 'followup' && (
              <SkinFollowUpView
                baseline={getComedonesBaseline()}
                onOpenReportTab={() => setSkinAnalysisSubView('report')}
              />
            )}

            {/* SubView 2: Detailed Report View with Top Date Picker & 3 Cards/row on Desktop, 1 on Mobile */}
            {skinAnalysisSubView === 'report' && (
              <SkinReportsHistoryView
                language="km"
                onOpenFollowUpTab={() => setSkinAnalysisSubView('followup')}
              />
            )}
          </div>
        </div>
      )}

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
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>កាលបរិច្ឆេទ៖</span>
                      <span>{ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('km-KH') : 'ថ្មីៗនេះ'}</span>
                    </div>

                    {/* Products Ordered */}
                    {ord.items && ord.items.length > 0 && (
                      <div className="space-y-1.5 py-1.5 border-t border-slate-200/80">
                        <span className="text-[11px] font-bold text-slate-700 block">
                          ផលិតផលដែលបានទិញ ({ord.items.length})៖
                        </span>
                        <div className="space-y-1.5 pl-0.5">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2 text-slate-700">
                              <div className="flex items-center gap-2 min-w-0">
                                {item.product?.image && (
                                  <img
                                    src={item.product.image}
                                    alt={item.product?.nameKm || item.product?.name || 'Product'}
                                    className="w-7 h-7 object-cover rounded-md border border-slate-200 shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                <span className="truncate font-medium text-[11px] text-slate-800">
                                  {item.product?.nameKm || item.product?.name || 'ផលិតផល'}
                                  <span className="text-slate-500 font-normal ml-1">x{item.quantity}</span>
                                </span>
                              </div>
                              <span className="font-mono font-semibold text-slate-800 shrink-0 text-[11px]">
                                ${((item.product?.priceUsd || 0) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shipping Fee */}
                    <div className="flex justify-between text-slate-600 border-t border-slate-200/80 pt-1.5">
                      <span>ថ្លៃដឹកជញ្ជូន៖</span>
                      <span className="font-mono font-medium">
                        {(ord.shippingFeeUsd === 0 || !ord.shippingFeeUsd)
                          ? 'ឥតគិតថ្លៃ'
                          : `$${ord.shippingFeeUsd.toFixed(2)}`}
                      </span>
                    </div>

                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200/80 pt-1.5">
                      <span>ទឹកប្រាក់សរុប៖</span>
                      <span className="text-emerald-700 font-mono text-sm font-black">${(ord.totalUsd || 0).toFixed(2)}</span>
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
              <span>មើលតារាងកម្រិតសមាជិកទាំងអស់</span>
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
                  កម្រិតសមាជិក
                </h3>
              </div>
            </div>

            {/* តារាងសង្ខេបកម្រិតសមាជិក */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  តារាងសង្ខេបកម្រិតសមាជិក
                </h4>
              </div>
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-slate-700 shadow-2xs">
                <div className="grid grid-cols-3 bg-slate-100 p-3 font-extrabold text-slate-900 border-b border-slate-200 text-xs sm:text-sm">
                  <span>កម្រិតសមាជិក</span>
                  <span className="text-center">លក្ខខណ្ឌកំណត់</span>
                  <span className="text-center">សញ្ញា (Badge)</span>
                </div>

                {/* 1. សមាជិកធម្មតា Row */}
                <div className="grid grid-cols-3 p-3 border-b border-slate-100 items-center">
                  <span className="font-bold flex items-center gap-1" style={{ fontSize: '12px', color: '#2E8B57' }}>
                    <span>សមាជិកធម្មតា</span>
                  </span>
                  <span className="text-center text-slate-600 text-xs">ចុះឈ្មោះស្វ័យប្រវត្តិ</span>
                  <div className="flex justify-center">
                    <span className="text-amber-500 text-base">⭐</span>
                  </div>
                </div>

                {/* 2. Facebook Top Friends Row */}
                <div className="grid grid-cols-3 p-3 border-b border-slate-100 items-center">
                  <span className="font-bold" style={{ fontSize: '12px', color: '#2E8B57' }}>
                    Facebook Top Friends
                  </span>
                  <span className="text-center text-slate-600 text-xs font-semibold">
                    មិត្តភក្តិ & Top Fan លើ FB
                  </span>
                  <div className="flex justify-center">
                    <FacebookIconBadge size={20} title="Facebook Top Friends" />
                  </div>
                </div>

                {/* 3. សមាជិក VIP Row */}
                <div className="grid grid-cols-3 p-3 border-b border-slate-100 items-center">
                  <span className="font-bold" style={{ fontSize: '12px', color: '#2E8B57' }}>
                    សមាជិក VIP
                  </span>
                  <span className="text-center text-emerald-700 text-xs font-bold">ចំណាយចាប់ពី $200 ឡើង</span>
                  <div className="flex justify-center">
                    <GreenDiamondIcon size={20} />
                  </div>
                </div>

                {/* 4. សមាជិក VVIP Row */}
                <div className="grid grid-cols-3 p-3 items-center">
                  <span className="font-bold" style={{ fontSize: '12px', color: '#2E8B57' }}>
                    សមាជិក VVIP
                  </span>
                  <span className="text-center text-emerald-700 text-xs font-bold">ចំណាយចាប់ពី $1000 ឡើង</span>
                  <div className="flex justify-center gap-1">
                    <GreenDiamondIcon size={18} />
                    <GreenDiamondIcon size={18} />
                  </div>
                </div>
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
