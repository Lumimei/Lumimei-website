import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  Heart,
  Search,
  Sparkles,
  ShieldCheck,
  MapPin,
  Globe,
  Share2,
  Check,
  Copy,
  X,
  Menu,
  Home,
  Bell,
  UserCheck,
  BellRing,
  Info,
  Package,
  Tag,
  Gift,
  PhoneCall,
  Mail,
  BookOpen,
  Camera,
  Scan,
  Award,
  Star,
  Target,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Ticket,
  MessageSquare,
  LogIn,
  UserPlus,
  User,
  LogOut,
  LayoutDashboard,
  Settings,
  Trash2,
  Plus
} from 'lucide-react';
import { CATEGORIES } from '../data/products';
import { Language } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAiAdvisor: () => void;
  onOpenSkinScan?: () => void;
  onOpenPoints?: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  totalUsd: number;
  currentPage?: 'home' | 'products' | 'phone-login' | 'verify-phone' | 'complete-profile' | 'dashboard' | 'account' | 'admin';
  onNavigateToHome?: () => void;
  onNavigateToProducts?: () => void;
  onNavigateToPhoneLogin?: (mode?: 'login' | 'register') => void;
  onNavigateToDashboard?: () => void;
  onNavigateToAccount?: () => void;
  onNavigateToAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenAiAdvisor,
  onOpenSkinScan,
  onOpenPoints,
  language,
  setLanguage,
  totalUsd,
  currentPage = 'home',
  onNavigateToHome,
  onNavigateToProducts,
  onNavigateToPhoneLogin,
  onNavigateToDashboard,
  onNavigateToAccount,
  onNavigateToAdmin,
}) => {
  const { currentUser, userProfile, logout } = useAuth();
  const userPhoneNumber = String(userProfile?.phoneNumber || currentUser?.phoneNumber || '');
  const isAdmin =
    userProfile?.role === 'super_admin' ||
    userProfile?.role === 'admin' ||
    userProfile?.role === 'superadmin' ||
    Boolean(userPhoneNumber && userPhoneNumber.includes('11223355')) ||
    userPhoneNumber === '+85511223355';

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

  const currentPoints = userProfile?.points !== undefined ? userProfile.points : guestPoints;
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [bellActive, setBellActive] = useState(true);
  const [showBellNoticeModal, setShowBellNoticeModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showWriteReviewForm, setShowWriteReviewForm] = useState(false);
  const [reviewsList, setReviewsList] = useState<
    Array<{
      id: string;
      name: string;
      rating: number;
      date: string;
      product: string;
      comment: string;
      verified: boolean;
      photos?: string[];
      userAvatar?: string;
    }>
  >([]);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [selectedReviewPhoto, setSelectedReviewPhoto] = useState<string | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Top Menu Bar Modals State
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showAboutDropdown, setShowAboutDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeAboutTab, setActiveAboutTab] = useState<'all' | 'lumimei-mission' | 'lumimei-vision' | 'lumimei-values' | 'lumimei-why-created' | 'lumimei-why-choose'>('all');
  const [activeSubmenuPage, setActiveSubmenuPage] = useState<string | null>(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const headerNavRef = useRef<HTMLElement>(null);
  const mobileAccountDropdownRef = useRef<HTMLDivElement>(null);
  const desktopAccountDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside or Esc key closes main menu panel & dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (headerNavRef.current && !headerNavRef.current.contains(event.target as Node)) {
        setShowAboutDropdown(false);
        setIsMobileMenuOpen(false);
      }
      const target = event.target as Node;
      const isInsideMobile = mobileAccountDropdownRef.current && mobileAccountDropdownRef.current.contains(target);
      const isInsideDesktop = desktopAccountDropdownRef.current && desktopAccountDropdownRef.current.contains(target);
      if (!isInsideMobile && !isInsideDesktop) {
        setShowAccountDropdown(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAboutDropdown(false);
        setIsMobileMenuOpen(false);
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Hash-based routing for independent submenu pages
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validSubmenuIds = ['lumimei-mission', 'lumimei-vision', 'lumimei-values', 'lumimei-why-created', 'lumimei-why-choose'];
      if (validSubmenuIds.includes(hash)) {
        setActiveSubmenuPage(hash);
      } else {
        setActiveSubmenuPage(null);
      }
      setShowAboutDropdown(false);
      setIsMobileMenuOpen(false);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const aboutSubmenuItems = [
    {
      id: 'lumimei-mission',
      labelKm: 'បេសកកម្មរបស់ Lumimei',
      labelZh: 'Lumimei 使命',
      labelEn: 'Lumimei Mission',
      icon: Sparkles,
    },
    {
      id: 'lumimei-vision',
      labelKm: 'ចក្ខុវិស័យរបស់ Lumimei',
      labelZh: 'Lumimei 愿景',
      labelEn: 'Lumimei Vision',
      icon: Target,
    },
    {
      id: 'lumimei-values',
      labelKm: 'គុណតម្លៃរបស់ Lumimei',
      labelZh: 'Lumimei 核心价值观',
      labelEn: 'Lumimei Values',
      icon: Award,
    },
    {
      id: 'lumimei-why-created',
      labelKm: 'ហេតុអ្វីបានជាខ្ញុំបង្កើត Lumimei?',
      labelZh: '为什么创立 Lumimei？',
      labelEn: 'Why I Created Lumimei?',
      icon: Heart,
    },
    {
      id: 'lumimei-why-choose',
      labelKm: 'ហេតុអ្វីបានជាជ្រើសរើស Lumimei?',
      labelZh: '为什么选择 Lumimei？',
      labelEn: 'Why Choose Lumimei?',
      icon: ShieldCheck,
    },
  ];

  const handleSubmenuClick = (sectionId: string) => {
    window.location.hash = sectionId;
    setActiveSubmenuPage(sectionId);
    setShowAboutDropdown(false);
    setIsMobileMenuOpen(false);
  };

  const handleCloseSubmenuPage = () => {
    window.history.pushState("", document.title, window.location.pathname + window.location.search);
    setActiveSubmenuPage(null);
  };

  const toggleBellNotification = () => {
    const nextState = !bellActive;
    setBellActive(nextState);
    setShowBellNoticeModal(true);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentPage !== 'products' && onNavigateToProducts) {
      onNavigateToProducts();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHomeClick = () => {
    setIsMobileMenuOpen(false);
    setShowAboutDropdown(false);
    handleCloseSubmenuPage();
    if (onNavigateToHome) {
      onNavigateToHome();
    } else {
      window.history.pushState({}, '', '/');
      setSelectedCategory('all');
      setSearchQuery('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const topMenuItems = [
    {
      id: 'home',
      labelKm: 'ទំព័រដើម',
      labelZh: '首页',
      labelEn: 'Home',
      icon: Home,
      onClick: handleHomeClick,
    },
    {
      id: 'product',
      labelKm: 'ផលិតផល',
      labelZh: '商品',
      labelEn: 'Products',
      icon: Package,
      onClick: () => {
        setIsMobileMenuOpen(false);
        setShowAboutDropdown(false);
        handleCloseSubmenuPage();
        if (onNavigateToProducts) {
          onNavigateToProducts();
        } else {
          window.history.pushState({}, '', '/products');
          setSelectedCategory('all');
          setSearchQuery('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },
    },
    {
      id: 'contact',
      labelKm: 'ទំនាក់ទំនង',
      labelZh: '联系我们',
      labelEn: 'Contact Us',
      icon: PhoneCall,
      onClick: () => {
        setIsMobileMenuOpen(false);
        setShowAboutDropdown(false);
        setShowContactModal(true);
      },
    },
  ];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lumimei - អ្នកឯកទេសថែរក្សាមុខមុនគ្រប់ប្រភេទ',
          text: 'ទិញផលិតផលថែរក្សាស្បែកមុខធម្មជាតិ និងគ្រឿងសម្អាងនៅ Lumimei!',
          url: window.location.href,
        });
      } catch {
        setShowShareModal(true);
      }
    } else {
      setShowShareModal(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const renderAccountDropdown = (ref: React.RefObject<HTMLDivElement | null>, visibilityClass: string = '') => {
    const avatarUrl = userProfile?.photoURL || (userProfile as any)?.profilePhotoURL || currentUser?.photoURL;
    const userDisplayName = userProfile?.fullName || userProfile?.displayName || currentUser?.displayName || '';
    const formattedName = userDisplayName || 'អ្នកប្រើប្រាស់';

    // First letter of user's display name or fallback
    const firstLetter = userDisplayName
      ? userDisplayName.trim().charAt(0).toUpperCase()
      : 'U';

    const userPhoneNumber = String(userProfile?.phoneNumber || currentUser?.phoneNumber || '');
    const isAdmin =
      userProfile?.role === 'super_admin' ||
      userProfile?.role === 'admin' ||
      userProfile?.role === 'superadmin' ||
      Boolean(userPhoneNumber && userPhoneNumber.includes('11223355')) ||
      userPhoneNumber === '+85511223355';

    return (
      <div className={`relative shrink-0 z-50 overflow-visible ${visibilityClass}`} ref={ref}>
        {currentUser ? (
          /* LOGGED IN: Render Profile Avatar + User Name Badge */
          <div className="relative inline-block">
            <button
              onClick={() => setShowAccountDropdown((prev) => !prev)}
              className="flex items-center gap-1.5 p-1 pr-2 bg-emerald-50 hover:bg-emerald-100/90 text-emerald-950 rounded-full border border-emerald-300 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition cursor-pointer group"
              title={formattedName}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm border border-emerald-300 overflow-hidden shrink-0 ring-1 ring-emerald-500/30 shadow-2xs">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={formattedName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target && target.style) {
                        target.style.display = 'none';
                      }
                    }}
                  />
                ) : (
                  <span className="font-extrabold text-white text-sm font-opensans">{firstLetter}</span>
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-emerald-700 shrink-0 transition-transform duration-200 ${showAccountDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>
        ) : (
          /* NOT LOGGED IN: Render "គណនីខ្ញុំ" Button */
          <button
            onClick={() => setShowAccountDropdown((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-full border border-emerald-300 shadow-2xs transition cursor-pointer"
            title="គណនីខ្ញុំ"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-bold font-battambang text-emerald-900">
              គណនីខ្ញុំ
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-emerald-700 transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`} />
          </button>
        )}

        {/* Account Dropdown Menu */}
        {showAccountDropdown && (
          <div
            className="absolute right-0 w-52 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-emerald-100 py-2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-150"
            style={{ top: 'calc(100% + 8px)' }}
          >
            {currentUser ? (
              <>
                {/* Account User Header Info */}
                <div className="px-4 py-2 border-b border-slate-100 bg-emerald-50/50 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{firstLetter}</span>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-emerald-900 truncate font-battambang">
                      {formattedName}
                    </p>
                    {isAdmin && (
                      <span className="text-[10px] font-extrabold text-amber-700 block">
                        👑 Super Admin
                      </span>
                    )}
                  </div>
                </div>

                {/* 0. ផ្ទាំងគ្រប់គ្រង Admin (Admin Portal - Shown if Admin) */}
                {isAdmin && onNavigateToAdmin && (
                  <button
                    onClick={() => {
                      setShowAccountDropdown(false);
                      onNavigateToAdmin();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border-b border-amber-200 flex items-center justify-between transition cursor-pointer font-battambang"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>👑 ផ្ទាំងគ្រប់គ្រង Admin</span>
                    </div>
                    <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-black">
                      PORTAL
                    </span>
                  </button>
                )}

                {/* 1. គណនីរបស់ខ្ញុំ (/dashboard) */}
                <button
                  onClick={() => {
                    setShowAccountDropdown(false);
                    if (onNavigateToDashboard) {
                      onNavigateToDashboard();
                    }
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition cursor-pointer font-battambang"
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                  <span>គណនីរបស់ខ្ញុំ</span>
                </button>

                {/* Reward & Points */}
                <button
                  onClick={() => {
                    setShowAccountDropdown(false);
                    if (onOpenPoints) {
                      onOpenPoints();
                    }
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 flex items-center justify-between transition cursor-pointer font-battambang"
                >
                  <div className="flex items-center gap-2.5">
                    <Gift className="w-4 h-4 text-amber-600" />
                    <span>Reward & ពិន្ទុ</span>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                    {currentPoints} pts
                  </span>
                </button>

                {/* 2. ការកំណត់ (/account) */}
                <button
                  onClick={() => {
                    setShowAccountDropdown(false);
                    if (onNavigateToAccount) {
                      onNavigateToAccount();
                    }
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition cursor-pointer font-battambang"
                >
                  <Settings className="w-4 h-4 text-emerald-600" />
                  <span>ការកំណត់</span>
                </button>

                {/* 3. Logout (ចាកចេញ / Firebase signOut) */}
                <button
                  onClick={async () => {
                    setShowAccountDropdown(false);
                    try {
                      await logout();
                    } catch {
                      // ignore
                    }
                    if (onNavigateToHome) {
                      onNavigateToHome();
                    } else {
                      handleHomeClick();
                    }
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition cursor-pointer font-battambang border-t border-slate-100 mt-1"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="py-1">
                {/* 1. ចូលប្រើប្រាស់ (Login) - Directly navigates to Account Login Page */}
                <button
                  onClick={() => {
                    setShowAccountDropdown(false);
                    if (onNavigateToPhoneLogin) {
                      onNavigateToPhoneLogin('login');
                    }
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 flex items-center gap-2.5 transition cursor-pointer font-battambang"
                >
                  <LogIn className="w-4 h-4 text-emerald-700" />
                  <span>ចូលប្រើប្រាស់</span>
                </button>

                {/* 2. បង្កើតគណនីថ្មី (Register) */}
                <button
                  onClick={() => {
                    setShowAccountDropdown(false);
                    if (onNavigateToPhoneLogin) {
                      onNavigateToPhoneLogin('register');
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2.5 transition cursor-pointer font-battambang"
                >
                  <UserPlus className="w-4 h-4 text-slate-500" />
                  <span>បង្កើតគណនីថ្មី</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Sticky Top Header Container */}
      <header className="sticky top-0 z-50 bg-white shadow-md border-b border-emerald-100 overflow-visible" ref={headerNavRef}>
        {/* Top Announcement & Quick Tools Bar */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white text-xs py-1.5 px-3 sm:px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            
            {/* Left: Info Announcement */}
            <div className="hidden lg:flex items-center gap-2 text-[11px] text-emerald-100 font-medium">
              <span>
                {language === 'km' 
                  ? 'Lumimei - ផលិតផលថែរក្សាស្បែកមុខធម្មជាតិ' 
                  : language === 'zh'
                  ? 'Lumimei - 纯天然护肤品'
                  : 'Lumimei - Natural Skincare'}
              </span>
            </div>

            {/* Right: Social Media, Share Button & Language Switcher */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
              {/* Share Tool Button */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1 bg-white/15 hover:bg-white/25 active:scale-95 px-2 py-0.5 rounded-full text-[11px] font-medium text-white transition cursor-pointer border border-white/20 shadow-2xs"
                title={language === 'km' ? 'ចែករំលែក' : language === 'zh' ? '分享' : 'Share'}
              >
                <Share2 className="w-3.5 h-3.5 text-yellow-300" />
                <span className="hidden xs:inline">
                  {language === 'km' ? 'ចែករំលែក' : language === 'zh' ? '分享' : 'Share'}
                </span>
              </button>

              {/* Language Switcher */}
              <div className="flex items-center gap-0.5 bg-black/25 p-0.5 rounded-full text-[10px] sm:text-[11px] font-medium border border-white/20">
                <Globe className="w-3 h-3 ml-1 text-emerald-200 shrink-0" />
                <button
                  onClick={() => setLanguage('km')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition cursor-pointer ${
                    language === 'km' 
                      ? 'bg-white text-emerald-900 font-bold shadow-xs' 
                      : 'text-white/90 hover:text-white'
                  }`}
                  title="ភាសាខ្មែរ"
                >
                  <span className="text-xs">🇰🇭</span>
                  <span>ខ្មែរ</span>
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition cursor-pointer ${
                    language === 'en' 
                      ? 'bg-white text-emerald-900 font-bold shadow-xs' 
                      : 'text-white/90 hover:text-white'
                  }`}
                  title="English"
                >
                  <span className="text-xs">🇬🇧</span>
                  <span>English</span>
                </button>
                <button
                  onClick={() => setLanguage('zh')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition cursor-pointer ${
                    language === 'zh' 
                      ? 'bg-white text-emerald-900 font-bold shadow-xs' 
                      : 'text-white/90 hover:text-white'
                  }`}
                  title="中文"
                >
                  <span className="text-xs">🇨🇳</span>
                  <span>中文</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 relative z-40 overflow-visible">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 overflow-visible">
            {/* Row 1: Brand Logo & Profile Avatar ("គណនីខ្ញុំ") on the same row */}
            <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2 cursor-pointer" onClick={handleHomeClick}>
                <img
                  src="https://i.postimg.cc/t7GTTRX8/Logo-20260630-155252-0000.png"
                  alt="Lumimei Logo"
                  className="w-11 h-11 object-contain rounded-full shadow-md shrink-0 border border-emerald-100 bg-white"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h1 className="text-[27px] font-bold tracking-tight text-emerald-700 font-opensans leading-tight" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                    Lumimei
                  </h1>
                  <p className="text-[12px] text-emerald-700 font-semibold tracking-wide font-battambang mt-0.5" style={{ fontFamily: "'Battambang', 'Open Sans', sans-serif" }}>
                    {language === 'km' ? 'អ្នកឯកទេសថែរក្សាមុខមុនគ្រប់ប្រភេទ' : language === 'zh' ? '美妆与护肤专营店' : 'Cosmetics & Skincare'}
                  </p>
                </div>
              </div>

              {/* Profile Avatar / Account Dropdown Menu ("គណនីខ្ញុំ") beside Lumimei on Mobile */}
              {renderAccountDropdown(mobileAccountDropdownRef, 'md:hidden')}
            </div>

            {/* Row 2: Action Buttons in Order: 1. Bell -> 2. Review -> 3. Wishlist -> 4. Cart -> 5. Account Dropdown (Desktop) */}
            <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap shrink-0 w-full md:w-auto">
              {/* 1. បើកការជូនដំណឹង (Bell Button) */}
              <button
                onClick={toggleBellNotification}
                className={`relative p-2 rounded-full border transition cursor-pointer shrink-0 ${
                  bellActive
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-300 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-300'
                }`}
                title={
                  language === 'km'
                    ? 'បើកការជូនដំណឹង'
                    : language === 'zh'
                    ? '小铃铛通知'
                    : 'Offer & Sale Notifications'
                }
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {bellActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* 2. ការវាយតម្លៃ (Review / Customer Reviews Button) */}
              <button
                onClick={() => setShowReviewsModal(true)}
                className="relative p-2 text-amber-600 hover:text-amber-700 bg-amber-50/80 hover:bg-amber-100 rounded-full border border-amber-200/80 transition cursor-pointer shrink-0 shadow-2xs"
                title={
                  language === 'km'
                    ? 'ការវាយតម្លៃអតិថិជន (Reviews)'
                    : language === 'zh'
                    ? '客户评价 (Reviews)'
                    : 'Customer Reviews'
                }
              >
                <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-500" />
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 sm:min-w-5 sm:h-5 bg-emerald-600 text-white text-[9px] sm:text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-2xs">
                  {reviewsList.length > 0 ? `${reviewsList.length}` : '0'}
                </span>
              </button>

              {/* 3. បញ្ជីផលិតផលពេញចិត្ត (Wishlist Button) */}
              <button
                onClick={onOpenWishlist}
                className="relative p-2 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-full border border-slate-200 transition cursor-pointer shrink-0"
                title="បញ្ជីផលិតផលពេញចិត្ត"
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-600 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* 3. កន្ត្រកទំនិញរបស់អ្នក (Cart Button) */}
              <button
                onClick={onOpenCart}
                className="relative flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-emerald-950 text-white text-xs sm:text-sm font-medium rounded-full hover:bg-emerald-900 transition cursor-pointer shadow-xs shrink-0"
                title="កន្ត្រកទំនិញរបស់អ្នក"
              >
                <div className="relative">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline text-emerald-200 font-semibold">
                  ${totalUsd.toFixed(2)}
                </span>
              </button>

              {/* 4. រង្វាន់ Reward (Reward Icon Button) */}
              <button
                onClick={onOpenPoints}
                className="relative flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white text-xs sm:text-sm font-bold rounded-full transition cursor-pointer shadow-xs shrink-0 active:scale-95 group"
                title={
                  language === 'km'
                    ? 'រង្វាន់ និងពិន្ទុសន្សំ (Reward)'
                    : language === 'zh'
                    ? '积分与奖励 (Reward)'
                    : 'Reward & Points'
                }
              >
                <div className="relative">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-amber-100 group-hover:scale-110 transition-transform" />
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-amber-950 text-amber-200 text-[9px] font-black rounded-full flex items-center justify-center border border-amber-300/40">
                    {currentPoints}
                  </span>
                </div>
                <span className="hidden sm:inline text-white font-bold text-xs tracking-wide font-opensans">
                  Reward
                </span>
              </button>

              {/* 4.1 Admin Portal Quick Button (Shown for Admins) */}
              {isAdmin && onNavigateToAdmin && (
                <button
                  onClick={onNavigateToAdmin}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gradient-to-r from-slate-900 to-emerald-950 hover:from-slate-800 hover:to-emerald-900 text-amber-300 text-xs sm:text-sm font-extrabold rounded-full border border-amber-400/80 shadow-md transition cursor-pointer shrink-0 active:scale-95 group"
                  title="ចូលផ្ទាំង Admin (Admin Portal)"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span className="font-bold tracking-wide">
                    Admin
                  </span>
                </button>
              )}

              {/* 5. គណនីខ្ញុំ (Account Dropdown Menu on Desktop) */}
              {renderAccountDropdown(desktopAccountDropdownRef, 'hidden md:block')}
            </div>
          </div>
        </div>

        {/* Navigation Menu Bar */}
        <nav className="bg-emerald-900 text-white border-t border-emerald-800 shadow-inner relative z-20 overflow-visible">
          {/* Desktop / Responsive Top Navigation Bar */}
          <div className="max-w-7xl mx-auto px-2 sm:px-4 hidden sm:flex flex-wrap items-center justify-start gap-2 sm:gap-3 py-2.5 overflow-visible">
            {topMenuItems.map((item) => {
              const Icon = item.icon;
              const label =
                language === 'km'
                  ? item.labelKm
                  : language === 'zh'
                  ? item.labelZh
                  : item.labelEn;

              if (item.id === 'about') {
                return (
                  <div key={item.id} className="relative shrink-0">
                    <button
                      onClick={item.onClick}
                      className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 hover:text-white border border-emerald-600/60 shadow-xs group"
                    >
                      <Icon className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
                      <span>{label}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-emerald-300 transition-transform duration-200 ml-0.5 ${showAboutDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Submenu */}
                    {showAboutDropdown && (
                      <div className="absolute top-full left-0 mt-1.5 w-72 bg-slate-900/98 backdrop-blur-xl text-white border border-emerald-500/40 rounded-2xl shadow-2xl p-2 z-[100] animate-in fade-in zoom-in-95 duration-150 origin-top-left">
                        <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider px-3 py-1.5 border-b border-slate-800/80 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            {language === 'km' ? 'អំពី Lumimei' : language === 'zh' ? '关于 Lumimei' : 'About Lumimei'}
                          </span>
                          <button
                            onClick={() => setShowAboutDropdown(false)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full cursor-pointer transition"
                            title="Close"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="space-y-1">
                          {aboutSubmenuItems.map((sub) => {
                            const SubIcon = sub.icon;
                            const subLabel =
                              language === 'km'
                                ? sub.labelKm
                                : language === 'zh'
                                ? sub.labelZh
                                : sub.labelEn;
                            return (
                              <button
                                key={sub.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSubmenuClick(sub.id);
                                }}
                                className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-100 hover:text-white bg-slate-800/80 hover:bg-emerald-700/90 border border-slate-700/60 hover:border-emerald-500/80 shadow-xs transition group text-left cursor-pointer active:scale-[0.98]"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="p-1.5 rounded-lg bg-emerald-900/80 text-emerald-300 group-hover:bg-emerald-500 group-hover:text-white transition shrink-0">
                                    <SubIcon className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="line-clamp-1 text-xs">{subLabel}</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-200 transition-transform group-hover:translate-x-0.5 shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              const isActive =
                (item.id === 'home' && currentPage === 'home') ||
                (item.id === 'product' && currentPage === 'products');

              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap cursor-pointer shrink-0 border ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold border-emerald-400 shadow-md ring-1 ring-emerald-300'
                      : 'bg-emerald-800/60 hover:bg-emerald-700 text-emerald-100 hover:text-white border-emerald-700/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-emerald-300'}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Navigation Bar & Collapsible Drawer (sm:hidden) */}
          <div className="sm:hidden px-3 py-2">
            {/* Quick bar with horizontal menu buttons */}
            <div className="flex items-center justify-around gap-1">
              {topMenuItems.map((item) => {
                const Icon = item.icon;
                const label =
                  language === 'km'
                    ? item.labelKm
                    : language === 'zh'
                    ? item.labelZh
                    : item.labelEn;

                if (item.id === 'about') {
                  return (
                    <button
                      key={item.id}
                      onClick={() => setShowAboutDropdown((prev) => !prev)}
                      className="flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-emerald-100 bg-emerald-800/90 hover:bg-emerald-700 border border-emerald-600/60"
                    >
                      <Icon className="w-4 h-4 text-emerald-300" />
                      <span className="flex items-center gap-0.5">
                        {label}
                        <ChevronDown className={`w-3 h-3 text-emerald-300 transition-transform ${showAboutDropdown ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                  );
                }

                const isActive =
                  (item.id === 'home' && currentPage === 'home') ||
                  (item.id === 'product' && currentPage === 'products');

                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition border ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold border-emerald-400 shadow-sm'
                        : 'text-emerald-100 hover:text-white bg-emerald-800/50 hover:bg-emerald-700 border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-emerald-300'}`} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Collapsible Drawer when isMobileMenuOpen OR showAboutDropdown */}
            {(isMobileMenuOpen || showAboutDropdown) && (
              <div className="mt-2.5 p-3 bg-slate-900/95 border border-emerald-500/40 rounded-2xl shadow-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider px-1 pb-1 border-b border-slate-800 flex items-center justify-between">
                  <span>{language === 'km' ? 'អំពី Lumimei (ទំព័ររង)' : language === 'zh' ? '关于 Lumimei (子菜单)' : 'About Lumimei Pages'}</span>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowAboutDropdown(false);
                    }}
                    className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {aboutSubmenuItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const subLabel =
                      language === 'km'
                        ? sub.labelKm
                        : language === 'zh'
                        ? sub.labelZh
                        : sub.labelEn;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSubmenuClick(sub.id)}
                        className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-100 hover:text-white bg-slate-800/90 hover:bg-emerald-700 border border-slate-700/80 active:scale-[0.98] transition text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1 rounded-lg bg-emerald-900 text-emerald-300">
                            <SubIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">{subLabel}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Bell Notification Settings / Alert Modal */}
      {showBellNoticeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl relative animate-in fade-in zoom-in duration-200 border border-emerald-100">
            <button
              onClick={() => setShowBellNoticeModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-3">
              <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                bellActive ? 'bg-amber-100 text-amber-600 ring-4 ring-amber-50' : 'bg-slate-100 text-slate-400'
              }`}>
                <BellRing className="w-6 h-6 animate-bounce" />
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {bellActive
                    ? (language === 'km' ? 'បានបើកការជូនដំណឹង! 🔔' : language === 'zh' ? '已开启小铃铛提醒 🔔' : 'Notifications Turned ON 🔔')
                    : (language === 'km' ? 'បានបិទការជូនដំណឹង' : language === 'zh' ? '已关闭小铃铛提醒' : 'Notifications Turned OFF')}
                </h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  {bellActive ? (
                    language === 'km'
                      ? 'នៅពេលមានការផ្សព្វផ្សាយពាណិជ្ជកម្ម ការបញ្ចុះតម្លៃពិសេស ឬព័ត៌មានសំខាន់ៗពី Lumimei លោកអ្នកនឹងទទួលបានការជូនដំណឹងភ្លាមៗ!'
                      : language === 'zh'
                      ? '当 Lumimei 有促销折扣优惠活动或其他重要信息发布时，您将第一时间收到通知！'
                      : 'When there are special promotional offers or important updates, you will instantly receive notifications!'
                  ) : (
                    language === 'km'
                      ? 'លោកអ្នកបានបិទការជូនដំណឹង។ ចុចម្ដងទៀតដើម្បីបើកទទួលព័ត៌មានប្រូម៉ូសិនពិសេស។'
                      : language === 'zh'
                      ? '您已关闭通知提醒。重新点击小铃铛可恢复接收优惠通知。'
                      : 'You have disabled notifications. Click again to enable promotional updates.'
                  )}
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setShowBellNoticeModal(false)}
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  {language === 'km' ? 'យល់ព្រម' : language === 'zh' ? '确定' : 'Got it'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal Dialog */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  {language === 'km' ? 'ចែករំលែក Lumimei' : language === 'zh' ? '分享 Lumimei' : 'Share Lumimei'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'km' ? 'ផ្ញើតំណភ្ជាប់ទៅកាន់មិត្តភក្តិ ឬបណ្តាញសង្គម' : language === 'zh' ? '将链接分享给亲朋好友' : 'Send this link to your friends'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 mb-4">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="text-xs text-slate-600 bg-transparent flex-1 outline-none px-1 overflow-x-auto"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{language === 'km' ? 'បានចម្លង' : language === 'zh' ? '已复制' : 'Copied'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{language === 'km' ? 'ចម្លងតំណ' : language === 'zh' ? '复制链接' : 'Copy Link'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition flex flex-col items-center gap-1"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                <span>Facebook</span>
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('Lumimei - អ្នកឯកទេសថែរក្សាមុខមុនគ្រប់ប្រភេទ')}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-sky-50 text-sky-700 font-medium hover:bg-sky-100 transition flex flex-col items-center gap-1"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                <span>Telegram</span>
              </a>
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-xl bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition flex flex-col items-center gap-1 cursor-pointer"
              >
                <Copy className="w-5 h-5 text-emerald-600" />
                <span>{language === 'km' ? 'ចម្លង' : language === 'zh' ? '复制' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Submenu Item Page View (1 Page 1 Content) */}
      {activeSubmenuPage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative border border-emerald-100 max-h-[92vh] overflow-y-auto flex flex-col justify-between">
            {/* Top Close & Breadcrumb Bar */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium overflow-x-auto scrollbar-none">
                  <button onClick={handleCloseSubmenuPage} className="hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer">
                    <Home className="w-3.5 h-3.5" />
                    <span>{language === 'km' ? 'ទំព័រដើម' : 'Home'}</span>
                  </button>
                  <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                  <span>{language === 'km' ? 'អំពី Lumimei' : 'About Lumimei'}</span>
                  <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                  <span className="text-emerald-700 font-bold truncate">
                    {aboutSubmenuItems.find(i => i.id === activeSubmenuPage)?.[
                      language === 'km' ? 'labelKm' : language === 'zh' ? 'labelZh' : 'labelEn'
                    ]}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-[11px] font-semibold px-2.5 py-1 rounded-xl transition cursor-pointer border border-slate-200"
                    title="Copy direct link to this page"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? (language === 'km' ? 'បានចម្លង' : 'Copied') : (language === 'km' ? 'តំណភ្ជាប់' : 'Share Link')}</span>
                  </button>
                  <button
                    onClick={handleCloseSubmenuPage}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Single Page Banner Header */}
              {activeSubmenuPage === 'lumimei-mission' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-teal-50/80 p-4 rounded-2xl border border-teal-100">
                    <div className="p-3 bg-teal-600 text-white rounded-2xl shadow-sm">
                      <Sparkles className="w-7 h-7 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-teal-950 font-opensans">
                        {language === 'km' ? 'បេសកកម្មរបស់ Lumimei' : language === 'zh' ? 'Lumimei 使命' : 'Lumimei Mission'}
                      </h2>
                      <p className="text-xs text-teal-700 font-semibold mt-0.5">
                        {language === 'km' ? '១០០% ធម្មជាតិសុទ្ធ និងសុវត្ថិភាពខ្ពស់បំផុត' : '100% Pure Natural & High Safety'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-white rounded-2xl border border-teal-100 shadow-xs space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <p className="font-medium text-slate-900 text-sm leading-relaxed bg-teal-50/50 p-3.5 rounded-xl border border-teal-100/80">
                      {language === 'km'
                        ? 'ស្រាវជ្រាវ និងផលិតផលថែរក្សាស្បែកមុខផ្សំពីធាតុធម្មជាតិសុទ្ធ ១០០% ដើម្បីព្យាបាលបញ្ហាស្បែកមុខ និងមុខមុនគ្រប់ប្រភេទ ដោយគ្មានសារធាតុគីមីបក់កាត់។'
                        : language === 'zh'
                        ? '研发并精制 100% 纯天然护肤产品，高效解决各类痘痘及肌肤问题，坚决远离有害化学成分。'
                        : 'Craft 100% natural and effective skincare solutions designed to heal acne and skin problems without harsh chemical additives.'}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">
                            {language === 'km' ? 'គ្មានសារធាតុគីមីបក់កាត់' : 'Zero Harsh Chemicals'}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {language === 'km' ? 'គ្មានស្តេរ៉ូអ៊ីត គ្មានបារ៉ត ឬជាតិកាត់ដែលធ្វើឲ្យស្បែកស្តើង' : 'No steroids, mercury, or skin-thinning bleaches'}
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                        <Award className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">
                            {language === 'km' ? 'ផ្សំពីថ្នាំបុរាណ និងរុក្ខជាតិ' : 'Organic Botanical Formulations'}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {language === 'km' ? 'ប្រេងដូងសុទ្ធ, 泥膜 Clay Mask និងឱសថបុរាណ' : 'Pure virgin coconut oil, herbal clay mask & rice extracts'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSubmenuPage === 'lumimei-vision' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100">
                    <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm">
                      <Target className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-emerald-950 font-opensans">
                        {language === 'km' ? 'ចក្ខុវិស័យរបស់ Lumimei' : language === 'zh' ? 'Lumimei 愿景' : 'Lumimei Vision'}
                      </h2>
                      <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                        {language === 'km' ? 'ម៉ាកសញ្ញាផលិតផលថែរក្សាស្បែកមុខធម្មជាតិឈានមុខគេ' : 'Leading Natural Skincare Brand'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-white rounded-2xl border border-emerald-100 shadow-xs space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <p className="font-medium text-slate-900 text-sm leading-relaxed bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100/80">
                      {language === 'km'
                        ? 'ក្លាយជាម៉ាកសញ្ញាផលិតផលថែរក្សាស្បែកមុខធម្មជាតិឈានមុខគេ ដែលផ្តល់ទំនុកចិត្ត និងដំណោះស្រាយសុវត្ថិភាពខ្ពស់បំផុតជូនអតិថិជនគ្រប់រូប។'
                        : language === 'zh'
                        ? '成为最受信赖的天然护肤领军品牌，为每位客户提供高效、安全、无负担的专业护肤方案。'
                        : 'To become the most trusted natural skincare leader, empowering everyone with safe, healthy, and radiant skin solutions.'}
                    </p>

                    <div className="space-y-2 pt-2">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                        <p className="text-xs font-semibold text-slate-800">
                          {language === 'km' ? 'បង្កើតស្តង់ដារថែរក្សាស្បែកមុខតាមបែបធម្មជាតិពិតប្រាកដនៅកម្ពុជា' : 'Establish authentic natural skincare standards in Cambodia'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                        <p className="text-xs font-semibold text-slate-800">
                          {language === 'km' ? 'ផ្តល់ការពិគ្រោះយោបល់ និងថែទាំអតិថិជនដោយក្តីស្រឡាញ់ ២៤/៧' : 'Provide 24/7 personalized, loving skincare guidance'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                        <p className="text-xs font-semibold text-slate-800">
                          {language === 'km' ? 'ពង្រីកទីផ្សារផលិតផលធម្មជាតិកម្ពុជាទៅកាន់ពិភពលោក' : 'Expand Cambodian natural beauty craftsmanship globally'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSubmenuPage === 'lumimei-values' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-amber-50/80 p-4 rounded-2xl border border-amber-100">
                    <div className="p-3 bg-amber-600 text-white rounded-2xl shadow-sm">
                      <Award className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-amber-950 font-opensans">
                        {language === 'km' ? 'គុណតម្លៃរបស់ Lumimei' : language === 'zh' ? 'Lumimei 核心价值观' : 'Lumimei Values'}
                      </h2>
                      <p className="text-xs text-amber-700 font-semibold mt-0.5">
                        {language === 'km' ? 'ភាពស្មោះត្រង់ និងសុវត្ថិភាពអតិថិជនជាចម្បង' : 'Purity, Safety & Integrity'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-white rounded-2xl border border-amber-100 shadow-xs space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <p className="font-medium text-slate-900 text-sm leading-relaxed bg-amber-50/50 p-3.5 rounded-xl border border-amber-100/80">
                      {language === 'km'
                        ? 'ភាពស្មោះត្រង់លើគុណភាព, ធម្មជាតិសុទ្ធសាធ, សុវត្ថិភាពអតិថិជនជាចម្បង និងការយកចិត្តទុកដាក់បម្រើដោយបេះដូង។'
                        : language === 'zh'
                        ? '坚守品质与真诚、纯天然零添加、以客户健康与安全为首要、真心贴心服务。'
                        : 'Uncompromised purity, 100% natural ingredients, customer safety first, and heartfelt, dedicated care.'}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold text-amber-900 text-xs block mb-0.5">🛡️ {language === 'km' ? 'ភាពស្មោះត្រង់' : 'Integrity'}</span>
                        <p className="text-[11px] text-slate-600">
                          {language === 'km' ? 'មិនប្រើសារធាតុគីមីក្លែងបន្លំ ឬប៉ះពាល់ដល់ស្បែកអតិថិជនឡើយ' : 'Honest formulation without deceptive chemicals'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold text-emerald-900 text-xs block mb-0.5">🌿 {language === 'km' ? 'ធម្មជាតិសុទ្ធ' : 'Pure Organic'}</span>
                        <p className="text-[11px] text-slate-600">
                          {language === 'km' ? 'រៀបចំឡើងយ៉ាងសម្រិតសម្រាំងពីធម្មជាតិ ១០០%' : '100% natural organic extracts'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold text-teal-900 text-xs block mb-0.5">💚 {language === 'km' ? 'សុវត្ថិភាពជាចម្បង' : 'Safety First'}</span>
                        <p className="text-[11px] text-slate-600">
                          {language === 'km' ? 'ឆ្លងកាត់ការពិនិត្យត្រឹមត្រូវមុនដាក់ជូនអតិថិជនប្រើប្រាស់' : 'Rigorous safety testing for sensitive skin'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold text-rose-900 text-xs block mb-0.5">💖 {language === 'km' ? 'បម្រើដោយបេះដូង' : 'Heartfelt Care'}</span>
                        <p className="text-[11px] text-slate-600">
                          {language === 'km' ? 'ផ្តល់ការប្រឹក្សាផ្ទាល់ខ្លួន២៤/៧ ដោយក្តីស្រឡាញ់' : '24/7 dedicated personal customer care'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSubmenuPage === 'lumimei-why-created' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-rose-50/80 p-4 rounded-2xl border border-rose-100">
                    <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-sm">
                      <Heart className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-rose-950 font-opensans">
                        {language === 'km' ? 'ហេតុអ្វីបានជាខ្ញុំបង្កើត Lumimei?' : language === 'zh' ? '为什么创立 Lumimei？' : 'Why I Created Lumimei?'}
                      </h2>
                      <p className="text-xs text-rose-700 font-semibold mt-0.5">
                        {language === 'km' ? 'រឿងរ៉ាវ និងបេះដូងរបស់អ្នកបង្កើត' : 'The Founder’s Heartfelt Story'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-white rounded-2xl border border-rose-100 shadow-xs space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-battambang">
                    {language === 'km' ? (
                      <>
                        <p className="font-bold text-rose-900 text-sm">
                          មូលហេតុដែលខ្ញុំបង្កើត Lumimei
                        </p>
                        <p>
                          ព្រោះខ្ញុំបានឃើញស្ត្រីជាច្រើន ក្រោយពេលរៀបការរួច ពួកគាត់បានលះបង់ពេលវេលាស្ទើរតែទាំងអស់សម្រាប់ប្ដី កូន គ្រួសារ និងការងារផ្ទះ រហូតភ្លេចទុកពេលវេលាខ្លះសម្រាប់ថែរក្សាខ្លួនឯង។
                        </p>
                        <p>
                          ពីមនុស្សស្រីម្នាក់ដែលធ្លាប់ស្រស់ស្អាត មានទំនុកចិត្ត និងមានក្ដីស្រមៃជាច្រើន បែរជាមើលទៅចាស់ជាងវ័យ អស់ភាពស្រស់ស្រាយ និងលែងមានទំនុកចិត្តលើខ្លួនឯង។
                        </p>
                        <p>
                          មិនមែនព្រោះពួកគាត់លែងស្អាតនោះទេ ប៉ុន្តែព្រោះពួកគាត់បានដាក់ខ្លួនឯងនៅជាជម្រើសចុងក្រោយជានិច្ច។
                        </p>
                        <p>
                          ខ្ញុំយល់ថា ស្ត្រីគ្រប់រូបសមនឹងទទួលបានការស្រឡាញ់ ការយកចិត្តទុកដាក់ និងពេលវេលាសម្រាប់ខ្លួនឯង ទោះបីជាពួកគាត់ជាភរិយា ជាម្ដាយ ឬមានភារកិច្ចច្រើនប៉ុណ្ណាក៏ដោយ។
                        </p>

                        <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-rose-900 font-bold text-center italic text-xs sm:text-sm my-2">
                          «មិនថាអ្នករវល់ប៉ុណ្ណា ក៏កុំភ្លេចស្រឡាញ់ និងថែរក្សាខ្លួនឯង។»
                        </div>

                        <p>
                          យើងចង់ជួយឲ្យស្ត្រីគ្រប់រូបអាចរកឃើញភាពស្រស់ស្អាត ទំនុកចិត្ត និងក្ដីស្រឡាញ់ចំពោះខ្លួនឯងម្ដងទៀត។ ព្រោះមនុស្សស្រីមិនគួរបាត់បង់ខ្លួនឯង ដោយសារតែការលះបង់ដើម្បីមនុស្សដែលខ្លួនស្រឡាញ់នោះទេ។
                        </p>
                        <p className="font-bold text-rose-700">
                          Lumimei — ស្រឡាញ់ខ្លួនឯង ថែរក្សាខ្លួនឯង និងបញ្ចេញពន្លឺតាមរបៀបរបស់អ្នក។ ✨
                        </p>
                      </>
                    ) : language === 'zh' ? (
                      <>
                        <p className="font-bold text-rose-900 text-sm">
                          创立 Lumimei 的初衷
                        </p>
                        <p>
                          我看到许多女性在结婚后，将几乎所有的光阴与精力献给了丈夫、孩子、家庭和家务，却唯独忘记了留一点时间爱护自己。
                        </p>
                        <p>
                          她们曾是那样美丽自信、怀揣梦想，却渐渐变得疲惫憔悴、失去光彩。这不是因为她们不再美丽，而是因为她们总是习惯把自己的需求排在最后。
                        </p>
                        <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-rose-900 font-bold text-center italic text-xs my-2">
                          “无论多忙，都请不要忘记好好爱自己、照顾自己。”
                        </div>
                        <p className="font-bold text-rose-700">
                          Lumimei — 爱自己，关怀自己，以专属于你的方式绽放光彩。✨
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-rose-900 text-sm">
                          Why I Created Lumimei
                        </p>
                        <p>
                          I noticed so many women after marriage dedicating almost all their time and energy to their family—completely forgetting to leave time to care for themselves.
                        </p>
                        <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-rose-900 font-bold text-center italic text-xs my-2">
                          "No matter how busy you are, never forget to love and cherish yourself."
                        </div>
                        <p className="font-bold text-rose-700">
                          Lumimei — Love yourself, care for yourself, and shine in your own unique way. ✨
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeSubmenuPage === 'lumimei-why-choose' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100">
                    <div className="p-3 bg-emerald-700 text-white rounded-2xl shadow-sm">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-emerald-950 font-opensans">
                        {language === 'km' ? 'ហេតុអ្វីបានជាជ្រើសរើស Lumimei?' : language === 'zh' ? '为什么选择 Lumimei？' : 'Why Choose Lumimei?'}
                      </h2>
                      <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                        {language === 'km' ? 'ជម្រើសដ៏ល្អបំផុតសម្រាប់ស្បែកមុខ' : 'The Best Choice For Your Skin'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-white rounded-2xl border border-emerald-100 shadow-xs space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <p className="font-medium text-slate-900 text-sm leading-relaxed bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100/80">
                      {language === 'km'
                        ? 'ផ្សំពីធម្មជាតិសុទ្ធ ១០០%, គ្មានស្តេរ៉ូអ៊ីត ឬគីមីកាត់, សសមស្របសម្រាប់ស្បែកប្រតិកម្មងាយ និងទទួលបានការពិគ្រោះយោបល់ផ្ទាល់ខ្លួនដោយឥតគិតថ្លៃ។'
                        : language === 'zh'
                        ? '100% 纯天然萃取、无激素无重金属、温和专为敏感痘痘肌研发、提供 24/7 一对一免费肌肤咨询。'
                        : '100% natural formulas, zero steroids/harsh chemicals, tailor-made for sensitive acne-prone skin, and free 24/7 skincare consultation.'}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-emerald-950 text-xs">100% Organic Ingredients</h4>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {language === 'km' ? 'ផ្សំពីធម្មជាតិសុទ្ធ ១០០% គ្មានលាយគីមី' : '100% organic natural formulas'}
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-emerald-950 text-xs">For Sensitive & Acne Skin</h4>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {language === 'km' ? 'សមស្របសម្រាប់ស្បែកស្តើង និងស្បែកមុខមុនគ្រប់ប្រភេទ' : 'Tailored for sensitive acne skin'}
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-emerald-950 text-xs">Zero Steroids / Bleach</h4>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {language === 'km' ? 'គ្មានស្តេរ៉ូអ៊ីត ឬគីមីកាត់ឱ្យស្តើងស្បែក' : 'Zero harsh steroids or bleaches'}
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-emerald-950 text-xs">Free Skincare Advice</h4>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {language === 'km' ? 'ពិគ្រោះយោបល់ស្បែកមុខដោយឥតគិតថ្លៃ' : 'Free 24/7 expert skin advice'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Quick Page Switcher & Return to Home Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>{language === 'km' ? 'ទំព័ររងផ្សេងទៀត' : 'Other Submenu Pages'}</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {language === 'km' ? '៥ ទំព័រឯករាជ្យ' : '5 Separate Pages'}
                </span>
              </div>

              {/* Submenu Pills */}
              <div className="flex flex-wrap gap-1.5">
                {aboutSubmenuItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isCurrent = sub.id === activeSubmenuPage;
                  const subLabel = language === 'km' ? sub.labelKm : language === 'zh' ? sub.labelZh : sub.labelEn;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => handleSubmenuClick(sub.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border ${
                        isCurrent
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800'
                      }`}
                    >
                      <SubIcon className="w-3.5 h-3.5" />
                      <span>{subLabel}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleCloseSubmenuPage}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-slate-500" />
                  <span>{language === 'km' ? 'ត្រឡប់ទៅទំព័រដើម' : 'Return to Home'}</span>
                </button>

                <button
                  onClick={handleCloseSubmenuPage}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition"
                >
                  {language === 'km' ? 'បិទ' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Lumimei Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 border border-emerald-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-opensans">
                  {language === 'km' ? 'អំពី Lumimei Cambodia' : language === 'zh' ? '关于 Lumimei 柬埔寨' : 'About Lumimei Cambodia'}
                </h3>
                <p className="text-xs text-emerald-700 font-medium">
                  {language === 'km' ? 'ផលិតផលថែរក្សាស្បែកមុខធម្មជាតិ ១០០%' : language === 'zh' ? '100% 纯天然天然护肤' : '100% Pure Organic Skincare'}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
              <p className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-100 font-medium text-emerald-950">
                {language === 'km'
                  ? 'Lumimei គឺជាម៉ាកផលិតផលថែរក្សាស្បែកមុខឈានមុខគេនៅកម្ពុជា ដែលផ្តោតលើការផ្សំឡើងពីធម្មជាតិសុទ្ធ ១០០% ដូចជា 泥膜 Clay Mask, ប្រេងដូងសុទ្ធ និងសាប៊ូរុក្ខជាតិ។ គ្មានសារធាតុគីមីបក់កាត់ គ្មានជាតិស្តេរ៉ូអ៊ីត!'
                  : language === 'zh'
                  ? 'Lumimei 是柬埔寨天然纯植物护肤知名品牌，专为亚洲肤质研发。旗下拥有天然大米泥膜、冷压纯椰子油、高浓度精华液及手工草本香皂，无重金属无漂白添加剂！'
                  : 'Lumimei is Cambodia’s premier 100% authentic natural skincare brand. Crafted with organic rice clay, pure virgin coconut oil, and traditional herbal extracts safe for sensitive skin.'}
              </p>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <span className="font-bold block text-slate-900">100% Safe</span>
                  <span className="text-[10px] text-slate-500">
                    {language === 'km' ? 'សុវត្ថិភាពខ្ពស់' : language === 'zh' ? '安全测试' : 'Dermatologist Safe'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Award className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <span className="font-bold block text-slate-900">Organic</span>
                  <span className="text-[10px] text-slate-500">
                    {language === 'km' ? 'ធម្មជាតិសុទ្ធ' : language === 'zh' ? '有机原料' : 'Natural Ingredients'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                  <span className="font-bold block text-slate-900">Cruelty-Free</span>
                  <span className="text-[10px] text-slate-500">
                    {language === 'km' ? 'មិនប៉ះពាល់ស្បែក' : language === 'zh' ? '温和亲肤' : 'Zero Harsh Chemicals'}
                  </span>
                </div>
              </div>

              {/* 5 Submenu Pillars Quick Navigation Tabs */}
              <div className="flex flex-wrap gap-1.5 pt-1 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveAboutTab('all')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                    activeAboutTab === 'all'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <Info className="w-3 h-3" />
                  <span>{language === 'km' ? 'ទាំងអស់' : language === 'zh' ? '全部' : 'All'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmenuClick('lumimei-mission')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                    activeAboutTab === 'lumimei-mission'
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'bg-teal-50 text-teal-800 border-teal-200/60 hover:bg-teal-100'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{language === 'km' ? 'បេសកកម្ម Lumimei' : language === 'zh' ? 'Lumimei 使命' : 'Lumimei Mission'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmenuClick('lumimei-vision')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                    activeAboutTab === 'lumimei-vision'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200/60 hover:bg-emerald-100'
                  }`}
                >
                  <Target className="w-3 h-3" />
                  <span>{language === 'km' ? 'ចក្ខុវិស័យ Lumimei' : language === 'zh' ? 'Lumimei 愿景' : 'Lumimei Vision'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmenuClick('lumimei-values')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                    activeAboutTab === 'lumimei-values'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-amber-50 text-amber-800 border-amber-200/60 hover:bg-amber-100'
                  }`}
                >
                  <Award className="w-3 h-3" />
                  <span>{language === 'km' ? 'គុណតម្លៃ Lumimei' : language === 'zh' ? 'Lumimei 核心价值观' : 'Lumimei Values'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmenuClick('lumimei-why-created')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                    activeAboutTab === 'lumimei-why-created'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-rose-50 text-rose-800 border-rose-200/60 hover:bg-rose-100'
                  }`}
                >
                  <Heart className="w-3 h-3" />
                  <span>{language === 'km' ? 'ហេតុអ្វីខ្ញុំបង្កើត Lumimei?' : language === 'zh' ? '为什么创立 Lumimei？' : 'Why I Created Lumimei?'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmenuClick('lumimei-why-choose')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                    activeAboutTab === 'lumimei-why-choose'
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-300/60 hover:bg-emerald-100'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>{language === 'km' ? 'ហេតុអ្វីជ្រើសរើស Lumimei?' : language === 'zh' ? '为什么选择 Lumimei？' : 'Why Choose Lumimei?'}</span>
                </button>
              </div>

              {/* 5 Core Pillars in Exact Order */}
              <div className="space-y-2.5 pt-1">
                {/* 1. បេសកកម្ម Lumimei */}
                <div id="lumimei-mission" className="bg-teal-50/50 p-3 rounded-2xl border border-teal-100/80 scroll-mt-20">
                  <div className="flex items-center gap-2 mb-1 text-teal-900 font-bold text-xs sm:text-sm">
                    <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{language === 'km' ? 'បេសកកម្ម Lumimei' : language === 'zh' ? 'Lumimei 使命' : 'Lumimei Mission'}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-normal pl-6">
                    {language === 'km'
                      ? 'ស្រាវជ្រាវ និងផលិតផលថែរក្សាស្បែកមុខផ្សំពីធាតុធម្មជាតិសុទ្ធ ១០០% ដើម្បីព្យាបាលបញ្ហាស្បែកមុខ និងមុខមុនគ្រប់ប្រភេទ ដោយគ្មានសារធាតុគីមីបក់កាត់។'
                      : language === 'zh'
                      ? '研发并精制 100% 纯天然护肤产品，高效解决各类痘痘及肌肤问题，坚决远离有害化学成分。'
                      : 'Craft 100% natural and effective skincare solutions designed to heal acne and skin problems without harsh chemical additives.'}
                  </p>
                </div>

                {/* 2. ចក្ខុវិស័យ Lumimei */}
                <div id="lumimei-vision" className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/80 scroll-mt-20">
                  <div className="flex items-center gap-2 mb-1 text-emerald-900 font-bold text-xs sm:text-sm">
                    <Target className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{language === 'km' ? 'ចក្ខុវិស័យ Lumimei' : language === 'zh' ? 'Lumimei 愿景' : 'Lumimei Vision'}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-normal pl-6">
                    {language === 'km'
                      ? 'ក្លាយជាម៉ាកសញ្ញាផលិតផលថែរក្សាស្បែកមុខធម្មជាតិឈានមុខគេ ដែលផ្តល់ទំនុកចិត្ត និងដំណោះស្រាយសុវត្ថិភាពខ្ពស់បំផុតជូនអតិថិជនគ្រប់រូប។'
                      : language === 'zh'
                      ? '成为最受信赖的天然护肤领军品牌，为每位客户提供高效、安全、无负担的专业护肤方案。'
                      : 'To become the most trusted natural skincare leader, empowering everyone with safe, healthy, and radiant skin solutions.'}
                  </p>
                </div>

                {/* 3. គុណតម្លៃ Lumimei */}
                <div id="lumimei-values" className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100/80 scroll-mt-20">
                  <div className="flex items-center gap-2 mb-1 text-amber-900 font-bold text-xs sm:text-sm">
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{language === 'km' ? 'គុណតម្លៃ Lumimei' : language === 'zh' ? 'Lumimei 核心价值观' : 'Lumimei Values'}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-normal pl-6">
                    {language === 'km'
                      ? 'ភាពស្មោះត្រង់លើគុណភាព, ធម្មជាតិសុទ្ធសាធ, សុវត្ថិភាពអតិថិជនជាចម្បង និងការយកចិត្តទុកដាក់បម្រើដោយបេះដូង។'
                      : language === 'zh'
                      ? '坚守品质与真诚、纯天然零添加、以客户健康与安全为首要、真心贴心服务。'
                      : 'Uncompromised purity, 100% natural ingredients, customer safety first, and heartfelt, dedicated care.'}
                  </p>
                </div>

                {/* 4. ហេតុអ្វីខ្ញុំបង្កើត Lumimei? */}
                <div id="lumimei-why-created" className="bg-rose-50/50 p-3 sm:p-4 rounded-2xl border border-rose-100/90 scroll-mt-20">
                  <div className="flex items-center gap-2 mb-2 text-rose-950 font-bold text-xs sm:text-sm border-b border-rose-100/80 pb-1.5">
                    <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{language === 'km' ? 'ហេតុអ្វីខ្ញុំបង្កើត Lumimei?' : language === 'zh' ? '为什么创立 Lumimei？' : 'Why I Created Lumimei?'}</span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-700 leading-relaxed pl-1 sm:pl-2 space-y-2 font-battambang">
                    {language === 'km' ? (
                      <>
                        <p className="font-semibold text-rose-900">
                          មូលហេតុដែលខ្ញុំបង្កើត Lumimei
                        </p>
                        <p>
                          ព្រោះខ្ញុំបានឃើញស្ត្រីជាច្រើន ក្រោយពេលរៀបការរួច ពួកគាត់បានលះបង់ពេលវេលាស្ទើរតែទាំងអស់សម្រាប់ប្ដី កូន គ្រួសារ និងការងារផ្ទះ រហូតភ្លេចទុកពេលវេលាខ្លះសម្រាប់ថែរក្សាខ្លួនឯង។
                        </p>
                        <p>
                          ពីមនុស្សស្រីម្នាក់ដែលធ្លាប់ស្រស់ស្អាត មានទំនុកចិត្ត និងមានក្ដីស្រមៃជាច្រើន បែរជាមើលទៅចាស់ជាងវ័យ អស់ភាពស្រស់ស្រាយ និងលែងមានទំនុកចិត្តលើខ្លួនឯង។
                        </p>
                        <p>
                          មិនមែនព្រោះពួកគាត់លែងស្អាតនោះទេ ប៉ុន្តែព្រោះពួកគាត់បានដាក់ខ្លួនឯងនៅជាជម្រើសចុងក្រោយជានិច្ច។
                        </p>
                        <p>
                          ខ្ញុំយល់ថា ស្ត្រីគ្រប់រូបសមនឹងទទួលបានការស្រឡាញ់ ការយកចិត្តទុកដាក់ និងពេលវេលាសម្រាប់ខ្លួនឯង ទោះបីជាពួកគាត់ជាភរិយា ជាម្ដាយ ឬមានភារកិច្ចច្រើនប៉ុណ្ណាក៏ដោយ។
                        </p>
                        <p>
                          ការថែរក្សាខ្លួនឯង មិនមែនជាភាពអាត្មានិយមទេ។ វាគឺជាការផ្ដល់តម្លៃដល់ខ្លួនឯង និងជាវិធីមួយដែលជួយឲ្យយើងមានថាមពល មានភាពរីករាយ និងអាចផ្ដល់ក្ដីស្រឡាញ់ទៅកាន់មនុស្សជុំវិញខ្លួនបានកាន់តែច្រើន។
                        </p>
                        <p className="font-medium text-slate-900">
                          នេះហើយជាមូលហេតុដែលខ្ញុំបង្កើត Lumimei។
                        </p>
                        <p>
                          Lumimei មិនមែនគ្រាន់តែជាម៉ាកមួយប៉ុណ្ណោះទេ ប៉ុន្តែជាការរំឭកដល់ស្ត្រីគ្រប់រូបថា៖
                        </p>
                        <p className="p-2 bg-white/80 rounded-xl border border-rose-200/60 text-rose-800 font-bold text-center italic">
                          «មិនថាអ្នករវល់ប៉ុណ្ណា ក៏កុំភ្លេចស្រឡាញ់ និងថែរក្សាខ្លួនឯង។»
                        </p>
                        <p>
                          យើងចង់ជួយឲ្យស្ត្រីគ្រប់រូបអាចរកឃើញភាពស្រស់ស្អាត ទំនុកចិត្ត និងក្ដីស្រឡាញ់ចំពោះខ្លួនឯងម្ដងទៀត។ ព្រោះមនុស្សស្រីមិនគួរបាត់បង់ខ្លួនឯង ដោយសារតែការលះបង់ដើម្បីមនុស្សដែលខ្លួនស្រឡាញ់នោះទេ។
                        </p>
                        <p>
                          អ្នកអាចជាម្ដាយដ៏ល្អ ជាភរិយាដ៏ល្អ និងនៅតែជាស្ត្រីម្នាក់ដែលស្រស់ស្អាត មានទំនុកចិត្ត និងមានសុភមង្គលក្នុងជីវិតរបស់ខ្លួន។
                        </p>
                        <p className="pt-1 font-bold text-rose-700 text-center sm:text-left">
                          Lumimei — ស្រឡាញ់ខ្លួនឯង ថែរក្សាខ្លួនឯង និងបញ្ចេញពន្លឺតាមរបៀបរបស់អ្នក។ ✨
                        </p>
                      </>
                    ) : language === 'zh' ? (
                      <>
                        <p className="font-semibold text-rose-900">
                          创立 Lumimei 的初衷
                        </p>
                        <p>
                          我看到许多女性在结婚后，将几乎所有的光阴与精力献给了丈夫、孩子、家庭和家务，却唯独忘记了留一点时间爱护自己。
                        </p>
                        <p>
                          她们曾是那样美丽自信、怀揣梦想，却渐渐变得疲惫憔悴、失去光彩。这不是因为她们不再美丽，而是因为她们总是习惯把自己的需求排在最后。
                        </p>
                        <p>
                          我认为，每一位女性都值得被爱、被关怀，也值得拥有专属于自己的美好时光。关爱自己绝不是自私，而是对自己价值的珍视。
                        </p>
                        <p className="p-2 bg-white/80 rounded-xl border border-rose-200/60 text-rose-800 font-bold text-center italic">
                          “无论多忙，都请不要忘记好好爱自己、照顾自己。”
                        </p>
                        <p>
                          你依然可以做一位出色的妻子、伟大的母亲，同时也保持自己的美丽、自信与幸福。
                        </p>
                        <p className="pt-1 font-bold text-rose-700">
                          Lumimei — 爱自己，关怀自己，以专属于你的方式绽放光彩。✨
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-rose-900">
                          The Story Behind Lumimei
                        </p>
                        <p>
                          I noticed so many women after marriage dedicating almost all their time and energy to their husbands, children, family, and household duties—completely forgetting to leave time to care for themselves.
                        </p>
                        <p>
                          From bright, confident women with big dreams, they gradually felt exhausted and lost their self-confidence—not because they stopped being beautiful, but because they always put themselves last.
                        </p>
                        <p className="p-2 bg-white/80 rounded-xl border border-rose-200/60 text-rose-800 font-bold text-center italic">
                          "No matter how busy you are, never forget to love and cherish yourself."
                        </p>
                        <p>
                          Taking care of yourself is not selfishness; it is honoring your self-worth. You can be a wonderful mother, a loving wife, and still remain a confident, vibrant woman in your own right.
                        </p>
                        <p className="pt-1 font-bold text-rose-700">
                          Lumimei — Love yourself, care for yourself, and shine in your own unique way. ✨
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* 5. ហេតុអ្វីជ្រើសរើស Lumimei? */}
                <div id="lumimei-why-choose" className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200/60 scroll-mt-20">
                  <div className="flex items-center gap-2 mb-1 text-emerald-950 font-bold text-xs sm:text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{language === 'km' ? 'ហេតុអ្វីជ្រើសរើស Lumimei?' : language === 'zh' ? '为什么选择 Lumimei？' : 'Why Choose Lumimei?'}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-normal pl-6">
                    {language === 'km'
                      ? 'ផ្សំពីធម្មជាតិសុទ្ធ ១០០%, គ្មានស្តេរ៉ូអ៊ីត ឬគីមីកាត់, សសមស្របសម្រាប់ស្បែកប្រតិកម្មងាយ និងទទួលបានការពិគ្រោះយោបល់ផ្ទាល់ខ្លួនដោយឥតគិតថ្លៃ។'
                      : language === 'zh'
                      ? '100% 纯天然萃取、无激素无重金属、温和专为敏感痘痘肌研发、提供 24/7 一对一免费肌肤咨询。'
                      : '100% natural formulas, zero steroids/harsh chemicals, tailor-made for sensitive acne-prone skin, and free 24/7 skincare consultation.'}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-end">
                <button
                  onClick={() => setShowAboutModal(false)}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {language === 'km' ? 'យល់ព្រម' : language === 'zh' ? '关闭' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Promotion Deals Modal */}
      {showPromotionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 border border-emerald-100">
            <button
              onClick={() => setShowPromotionModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Tag className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-opensans">
                  {language === 'km' ? 'ការបញ្ចុះតម្លៃ & កម្មវិធីពិសេស' : language === 'zh' ? '限时促销与特惠折扣' : 'Special Promotions & Offers'}
                </h3>
                <p className="text-xs text-amber-600 font-semibold">
                  {language === 'km' ? 'ប្រូម៉ូសិនពិសេសប្រចាំខែ Lumimei' : language === 'zh' ? 'Lumimei 独家全场优惠' : 'Exclusive Monthly Sales Deals'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 flex items-start gap-3">
                <Gift className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 text-xs">
                    {language === 'km' ? 'ទិញ 泥膜 Clay Mask ២ កំប៉ុង ថែមសាប៊ូ Lumimei ១!' : language === 'zh' ? '买 2 盒 Clay Mask 泥膜，送 Lumimei 香皂 1 块！' : 'Buy 2 Clay Masks, Get 1 Herbal Soap FREE!'}
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    {language === 'km' ? 'ថែមជូនដោយស្វ័យប្រវត្តិសម្រាប់ការបញ្ជាទិញគ្រប់ប្រភេទ' : language === 'zh' ? '下单自动赠送，无需另外领券' : 'Auto-added to orders at checkout'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
                <Ticket className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-900 text-xs">
                    {language === 'km' ? 'ប័ណ្ណបញ្ចុះតម្លៃ $2.00 ភ្លាមៗ (កូដ៖ LUMIMEI2026)' : language === 'zh' ? '优惠码 LUMIMEI2026 结账立减 $2.00！' : 'Get $2.00 OFF with code: LUMIMEI2026'}
                  </h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {language === 'km' ? 'ប្រើប្រាស់បានគ្រប់ការទិញចាប់ពី $10 ឡើងទៅ' : language === 'zh' ? '满 $10 即可在购物车输入使用' : 'Valid on all orders over $10.00'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-teal-50 rounded-2xl border border-teal-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-teal-900 text-xs">
                    {language === 'km' ? 'ដឹកជញ្ជូនឥតគិតថ្លៃក្នុងរាជធានីភ្នំពេញ ($15+)' : language === 'zh' ? '金边市内满 $15 免运费包邮到家' : 'Free Phnom Penh Express Shipping on $15+'}
                  </h4>
                  <p className="text-[11px] text-teal-700 mt-0.5">
                    {language === 'km' ? 'ទទួលបានទំនិញក្នុងរយៈពេល ២ ម៉ោង' : language === 'zh' ? '金边同城 2 小时极速送达' : 'Same-day 2-hour courier delivery'}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowPromotionModal(false)}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {language === 'km' ? 'ទៅទិញឥឡូវនេះ' : language === 'zh' ? '去挑选商品' : 'Shop Deals Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rewards & VIP Points Modal */}
      {showRewardsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 border border-emerald-100">
            <button
              onClick={() => setShowRewardsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Gift className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-opensans">
                  {language === 'km' ? 'រង្វាន់ & ពិន្ទុសមាជិក Lumimei' : language === 'zh' ? 'Lumimei 会员积分与尊享奖励' : 'Lumimei Member Rewards & Loyalty'}
                </h3>
                <p className="text-xs text-amber-600 font-semibold">
                  {language === 'km' ? 'សន្សំពិន្ទុដូរយករង្វាន់ និងប័ណ្ណបញ្ចុះតម្លៃ' : language === 'zh' ? '消费累积积分，兑换独家优惠礼包' : 'Earn points on every purchase & redeem vouchers'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Member Points Card */}
              <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-4 rounded-2xl shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <span className="text-[10px] text-emerald-200 uppercase tracking-widest font-bold">VIP Silver Member</span>
                    <h4 className="text-2xl font-black text-amber-300 mt-1">180 <span className="text-xs text-white font-normal">Points</span></h4>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
                  </div>
                </div>
                <p className="text-[10px] text-emerald-200 mt-3 relative z-10">
                  {language === 'km' ? 'ទិញ $1.00 = ទទួលបាន 1 ពិន្ទុ' : language === 'zh' ? '每消费 $1.00 即可得 1 积分' : '$1.00 spent = 1 Loyalty Point'}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800">
                  {language === 'km' ? 'រង្វាន់ដែលអាចដូរបាន' : language === 'zh' ? '可兑换礼券' : 'Available Reward Vouchers'}
                </h4>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">$2.00 Discount Voucher</span>
                    <span className="text-[10px] text-slate-500">Cost: 100 Points</span>
                  </div>
                  <button className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] cursor-pointer">
                    {language === 'km' ? 'ដូរយក' : language === 'zh' ? '兑换' : 'Redeem'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">Free Express Delivery Voucher</span>
                    <span className="text-[10px] text-slate-500">Cost: 150 Points</span>
                  </div>
                  <button className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] cursor-pointer">
                    {language === 'km' ? 'ដូរយក' : language === 'zh' ? '兑换' : 'Redeem'}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowRewardsModal(false)}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {language === 'km' ? 'បិទ' : language === 'zh' ? '关闭' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Us Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 border border-emerald-100">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <PhoneCall className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-opensans">
                  {language === 'km' ? 'ទាក់ទងមកកាន់ Lumimei' : language === 'zh' ? '联系 Lumimei 官方客服' : 'Contact Lumimei Team'}
                </h3>
                <p className="text-xs text-emerald-700 font-semibold">
                  {language === 'km' ? 'សេវាបំរើអតិថិជន ២៤ ម៉ោង' : language === 'zh' ? '24/7 专业在线客服解答' : '24/7 Customer Care & Support'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href="https://t.me/Lumimeiadmin"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-teal-50 hover:bg-teal-100 rounded-2xl border border-teal-200 transition text-xs font-bold text-teal-950"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </div>
                <div>
                  <span>Lumimei Admin</span>
                </div>
              </a>

              <a
                href="mailto:lumimei.admin@gmail.com"
                className="flex items-center gap-3 p-3 bg-rose-50 hover:bg-rose-100 rounded-2xl border border-rose-200 transition text-xs font-bold text-rose-950"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span>lumimei.admin@gmail.com</span>
                </div>
              </a>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-700 block mb-2">
                  {language === 'km' ? 'បណ្តាញសង្គមផ្លូវការ' : language === 'zh' ? '官方社交媒体' : 'Official Social Media'}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href="http://t.me/Lumimeicambodia"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-sky-900 font-bold text-xs transition shadow-xs"
                    title="Telegram Channel"
                  >
                    <svg className="w-4 h-4 fill-sky-500 shrink-0" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    <span>Telegram</span>
                  </a>

                  <a
                    href="https://www.facebook.com/LumimeiCambodia"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-blue-900 font-bold text-xs transition shadow-xs"
                    title="Facebook Page"
                  >
                    <svg className="w-4 h-4 fill-blue-600 shrink-0" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    <span>Facebook</span>
                  </a>

                  <a
                    href="https://tiktok.com/@lumimeicambodia"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold text-xs transition shadow-xs"
                    title="TikTok Account"
                  >
                    <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.3 1.54-1.29 2.54.02 1.07.61 2.07 1.53 2.59.9.52 2.06.55 2.99.07.91-.46 1.51-1.42 1.57-2.44.08-2.14.03-4.28.04-6.42-.01-3.25-.01-6.5 0-9.75z"/></svg>
                    <span>TikTok</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
              >
                {language === 'km' ? 'បិទ' : language === 'zh' ? '关闭' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Reviews Modal */}
      {showReviewsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto animate-in fade-in zoom-in duration-200 border border-amber-100 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-opensans flex items-center gap-2">
                    <span>{language === 'km' ? 'ការវាយតម្លៃអតិថិជន' : language === 'zh' ? '客户真实评价' : 'Customer Reviews'}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">5.0 ★</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {language === 'km' ? 'មតិសរសើរ និងការជឿជាក់ពីអតិថិជន Lumimei' : language === 'zh' ? 'Lumimei 专营店来自真实的客户好评' : 'Real customer feedback & verified reviews'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowReviewsModal(false);
                  setShowWriteReviewForm(false);
                  setReviewSubmitted(false);
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
              {/* Overall Satisfaction Banner */}
              <div className="bg-gradient-to-r from-amber-50 via-emerald-50 to-teal-50 p-3 rounded-2xl border border-amber-200/70 flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <button
                  onClick={() => {
                    setShowWriteReviewForm(!showWriteReviewForm);
                    setReviewSubmitted(false);
                  }}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer shrink-0"
                >
                  {language === 'km' ? '+ សរសេរការវាយតម្លៃ' : '+ Write Review'}
                </button>
              </div>

              {/* Write Review Form */}
              {showWriteReviewForm && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
                  <h4 className="text-xs font-bold text-slate-900">
                    {language === 'km' ? 'ចែករំលែកបទពិសោធន៍របស់អ្នក' : 'Share Your Experience'}
                  </h4>

                  {reviewSubmitted ? (
                    <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold text-center">
                      ✓ {language === 'km' ? 'អរគុណសម្រាប់ការវាយតម្លៃ! មតិរបស់អ្នកត្រូវបានរក្សាទុក។' : 'Thank you for your feedback! Review saved.'}
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newReviewComment.trim()) return;
                        const currentReviewerName =
                          userProfile?.fullName ||
                          userProfile?.displayName ||
                          currentUser?.displayName ||
                          currentUser?.phoneNumber ||
                          currentUser?.email ||
                          (language === 'km' ? 'អតិថិជន Lumimei' : 'Lumimei Customer');

                        const createdReview = {
                          id: Date.now().toString(),
                          name: currentReviewerName,
                          rating: newReviewRating || 5,
                          date: 'ទើបតែបន្ថែម',
                          product: 'Lumimei Product',
                          comment: newReviewComment.trim(),
                          verified: true,
                          photos: [...reviewPhotos],
                          userAvatar: userProfile?.photoURL || currentUser?.photoURL || undefined,
                        };
                        setReviewsList([createdReview, ...reviewsList]);
                        setReviewSubmitted(true);
                        setNewReviewComment('');
                        setNewReviewRating(0);
                        setReviewPhotos([]);
                        setTimeout(() => {
                          setShowWriteReviewForm(false);
                          setReviewSubmitted(false);
                        }, 1800);
                      }}
                      className="space-y-3"
                    >
                      {/* Customer Account Profile Card */}
                      <div className="flex items-center gap-3 p-2.5 bg-emerald-50/90 rounded-2xl border border-emerald-200/80">
                        {userProfile?.photoURL || currentUser?.photoURL ? (
                          <img
                            src={userProfile?.photoURL || currentUser?.photoURL}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-emerald-300 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                            {(
                              userProfile?.fullName ||
                              userProfile?.displayName ||
                              currentUser?.displayName ||
                              currentUser?.phoneNumber ||
                              currentUser?.email ||
                              'L'
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider block">
                              {language === 'km' ? 'គណនីវាយតម្លៃ' : 'Reviewing as Account'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {userProfile?.fullName ||
                              userProfile?.displayName ||
                              currentUser?.displayName ||
                              currentUser?.phoneNumber ||
                              currentUser?.email ||
                              (language === 'km' ? 'អតិថិជន Lumimei' : 'Lumimei Customer')}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                          {language === 'km' ? 'ពិន្ទុផ្កាយ' : 'Star Rating'}
                        </label>
                        <div
                          className="flex items-center gap-1.5 p-2 bg-slate-50/90 rounded-xl border border-slate-200/80 w-fit"
                          onMouseLeave={() => setHoveredRating(0)}
                        >
                          {[1, 2, 3, 4, 5].map((star) => {
                            const activeRating = hoveredRating || newReviewRating;
                            const isFilled = activeRating > 0 && star <= activeRating;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setNewReviewRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                className="p-1 cursor-pointer hover:scale-125 focus:scale-125 transition-transform duration-150 active:scale-95 group"
                                title={`${star} ${language === 'km' ? 'ផ្កាយ' : 'Stars'}`}
                              >
                                <Star
                                  className={`w-6 h-6 transition-colors duration-150 ${
                                    isFilled
                                      ? 'fill-amber-400 text-amber-500 drop-shadow-2xs'
                                      : 'text-slate-300 hover:text-amber-300'
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          {language === 'km' ? 'មតិយោបល់របស់អ្នក' : 'Your Review'}
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={newReviewComment}
                          onChange={(e) => setNewReviewComment(e.target.value)}
                          placeholder={language === 'km' ? 'សរសេរការវាយតម្លៃរបស់អ្នកនៅទីនេះ...' : 'Write your review here...'}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 resize-none"
                        />
                      </div>

                      {/* Photo Upload Section (Up to 5 Photos) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            {language === 'km' ? 'រូបភាពផលិតផល (អតិបរមា 5 រូប)' : 'Upload Photos (Max 5)'}
                          </label>
                          <span className="text-[10px] text-emerald-700 font-bold">
                            {reviewPhotos.length}/5 {language === 'km' ? 'រូបភាព' : 'Photos'}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                          {reviewPhotos.map((imgSrc, idx) => (
                            <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 group shrink-0 bg-white shadow-2xs">
                              <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setReviewPhotos(reviewPhotos.filter((_, i) => i !== idx))}
                                className="absolute top-0.5 right-0.5 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 transition shadow-xs cursor-pointer"
                                title={language === 'km' ? 'លុបរូបភាព' : 'Remove Photo'}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}

                          {reviewPhotos.length < 5 && (
                            <label className="w-14 h-14 rounded-xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-100/50 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition shrink-0">
                              <Camera className="w-4 h-4 text-emerald-600" />
                              <span className="text-[9px] font-bold text-emerald-800">
                                + {language === 'km' ? 'ថែមរូប' : 'Add'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (!files || files.length === 0) return;
                                  const remaining = 5 - reviewPhotos.length;
                                  if (remaining <= 0) return;
                                  const fileArray: File[] = (Array.from(files) as File[]).slice(0, remaining);
                                  fileArray.forEach((file: File) => {
                                    const reader = new FileReader();
                                    reader.onload = (uploadEvt) => {
                                      if (uploadEvt.target?.result) {
                                        setReviewPhotos((prev) => [...prev, uploadEvt.target!.result as string].slice(0, 5));
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  });
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                        <span>{language === 'km' ? 'បញ្ជូនការវាយតម្លៃ' : 'Submit Review'}</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-3">
                {reviewsList.length === 0 ? (
                  <div className="py-10 px-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-amber-100/80 text-amber-500 flex items-center justify-center mb-1">
                      <Star className="w-6 h-6 text-amber-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">
                      {language === 'km'
                        ? 'មិនទាន់មានអតិថិជន Review នៅឡើយ'
                        : language === 'zh'
                        ? '暂无客户评价'
                        : 'No customer reviews yet'}
                    </p>
                    <p className="text-xs text-slate-500 max-w-xs">
                      {language === 'km'
                        ? 'សូមធ្វើជាអតិថិជនដំបូងគេដែលចែករំលែកបទពិសោធន៍ជាមួយផលិតផល Lumimei!'
                        : 'Be the first customer to share your experience with Lumimei products!'}
                    </p>
                  </div>
                ) : (
                  reviewsList.map((rev) => (
                    <div key={rev.id} className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {rev.userAvatar ? (
                            <img src={rev.userAvatar} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                              {rev.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-bold text-xs text-slate-900">{rev.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{rev.date}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        "{rev.comment}"
                      </p>

                      {/* Display Uploaded Review Photos */}
                      {rev.photos && rev.photos.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {rev.photos.map((pUrl, pIdx) => (
                            <img
                              key={pIdx}
                              src={pUrl}
                              alt=""
                              onClick={() => setSelectedReviewPhoto(pUrl)}
                              className="w-16 h-16 rounded-xl object-cover border border-slate-200 cursor-pointer hover:opacity-90 hover:scale-105 transition shrink-0 shadow-2xs"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-gray-100 flex justify-end shrink-0">
              <button
                onClick={() => setShowReviewsModal(false)}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
              >
                {language === 'km' ? 'បិទ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Photo Zoom Lightbox Modal */}
      {selectedReviewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedReviewPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img src={selectedReviewPhoto} alt="" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
            <button
              onClick={() => setSelectedReviewPhoto(null)}
              className="absolute -top-3 -right-3 p-2 bg-white text-slate-800 rounded-full shadow-lg font-bold cursor-pointer hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

