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
  Camera,
  Award,
  Star,
  Target,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Ticket,
  MessageSquare
} from 'lucide-react';
import { CATEGORIES } from '../data/products';
import { Language } from '../types';

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
  onOpenFaceScan: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  totalUsd: number;
  currentPage?: 'home' | 'products';
  onNavigateToHome?: () => void;
  onNavigateToProducts?: () => void;
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
  onOpenFaceScan,
  language,
  setLanguage,
  totalUsd,
  currentPage = 'home',
  onNavigateToHome,
  onNavigateToProducts,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [bellActive, setBellActive] = useState(true);
  const [showBellNoticeModal, setShowBellNoticeModal] = useState(false);

  // Top Menu Bar Modals State
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showAboutDropdown, setShowAboutDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeAboutTab, setActiveAboutTab] = useState<'all' | 'lumimei-mission' | 'lumimei-vision' | 'lumimei-values' | 'lumimei-why-created' | 'lumimei-why-choose'>('all');
  const [activeSubmenuPage, setActiveSubmenuPage] = useState<string | null>(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const headerNavRef = useRef<HTMLElement>(null);

  // Click outside or Esc key closes main menu panel & dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (headerNavRef.current && !headerNavRef.current.contains(event.target as Node)) {
        setShowAboutDropdown(false);
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAboutDropdown(false);
        setIsMobileMenuOpen(false);
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
      id: 'about',
      labelKm: 'អំពី Lumimei',
      labelZh: '关于 Lumimei',
      labelEn: 'About Lumimei',
      icon: Info,
      onClick: () => {
        setShowAboutDropdown((prev) => !prev);
      },
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
      labelEn: 'Contact',
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

  return (
    <>
      {/* Sticky Top Header Container */}
      <header className="sticky top-0 z-50 bg-white shadow-md border-b border-emerald-100" ref={headerNavRef}>
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
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            {/* Brand Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleHomeClick}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-700 font-opensans leading-none" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                  Lumimei
                </h1>
                <p className="text-[10px] sm:text-xs text-emerald-700 font-semibold tracking-wide font-battambang" style={{ fontFamily: "'Battambang', 'Open Sans', sans-serif" }}>
                  {language === 'km' ? 'អ្នកឯកទេសថែរក្សាមុខមុនគ្រប់ប្រភេទ' : language === 'zh' ? '美妆与护肤专营店' : 'Cosmetics & Skincare'}
                </p>
              </div>
            </div>

            {/* Search Tool & Scan Face Analysis Button */}
            <div className="flex-1 max-w-xl hidden md:flex items-center gap-2 mx-2 xl:mx-4">
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim() && currentPage !== 'products' && onNavigateToProducts) {
                      onNavigateToProducts();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit(e);
                    }
                  }}
                  placeholder={
                    language === 'km'
                      ? 'ស្វែងរក Lumimei Clay Mask, ប្រេងដូង, សាប៊ូ...'
                      : language === 'zh'
                      ? '搜索 Lumimei 泥膜、椰子油、香皂...'
                      : 'Search Lumimei Clay Mask, Coconut Oil, Soap...'
                  }
                  className="w-full pl-9 pr-14 py-2 text-xs xl:text-sm bg-emerald-50/70 border border-emerald-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
                <button
                  type="submit"
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100/60 rounded-full transition cursor-pointer"
                  title={language === 'km' ? 'ចុចស្វែងរក' : language === 'zh' ? '点击搜索' : 'Search'}
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
              </form>

              {/* Scan Face Skin Analysis Button ("scan វិភាគស្បែកមុខ") */}
              <button
                onClick={onOpenFaceScan}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs xl:text-sm font-semibold rounded-full shadow-xs hover:shadow-md transition cursor-pointer shrink-0 border border-emerald-500/40"
                title="scan វិភាគស្បែកមុខ"
              >
                <Camera className="w-4 h-4 text-emerald-200 animate-pulse" />
                <span className="whitespace-nowrap font-battambang" style={{ fontFamily: "'Battambang', sans-serif" }}>
                  scan វិភាគស្បែកមុខ
                </span>
              </button>
            </div>

            {/* Action Buttons & Tools */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Bell Button */}
              <button
                onClick={toggleBellNotification}
                className={`relative p-1.5 sm:p-2 rounded-full border transition cursor-pointer shrink-0 ${
                  bellActive
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-300 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-400 border-slate-300'
                }`}
                title={
                  language === 'km'
                    ? 'បើកការជូនដំណឹងការបញ្ចុះតម្លៃ និងព័ត៌មានពិសេស'
                    : language === 'zh'
                    ? '小铃铛：开启促销优惠与重要通知'
                    : 'Offer & Sale Notifications'
                }
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                {bellActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* Wishlist Button */}
              <button
                onClick={onOpenWishlist}
                className="relative p-1.5 sm:p-2 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition cursor-pointer"
                title="Wishlist"
              >
                <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-600 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart Button */}
              <button
                onClick={onOpenCart}
                className="relative flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-emerald-950 text-white text-xs sm:text-sm font-medium rounded-full hover:bg-emerald-900 transition cursor-pointer shadow-xs"
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
            </div>
          </div>

          {/* Mobile Search Tool & Scan Face Analysis Button */}
          <div className="mt-2.5 md:hidden flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim() && currentPage !== 'products' && onNavigateToProducts) {
                    onNavigateToProducts();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit(e);
                  }
                }}
                placeholder={
                  language === 'km'
                    ? 'ស្វែងរក Lumimei, Clay Mask, សាប៊ូ...'
                    : language === 'zh'
                    ? '搜索 Lumimei 商品...'
                    : 'Search products or brands...'
                }
                className="w-full pl-8 pr-12 py-1.5 text-xs bg-emerald-50/70 border border-emerald-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="absolute left-1 top-1/2 -translate-y-1/2 p-1 text-emerald-600 hover:text-emerald-800 rounded-full transition cursor-pointer"
                title={language === 'km' ? 'ចុចស្វែងរក' : language === 'zh' ? '点击搜索' : 'Search'}
                aria-label="Search"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </form>

            {/* Mobile Scan Face Skin Analysis Button */}
            <button
              onClick={onOpenFaceScan}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-semibold rounded-full shadow-xs transition cursor-pointer shrink-0 border border-emerald-500/40"
              title="scan វិភាគស្បែកមុខ"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-200" />
              <span className="whitespace-nowrap font-battambang" style={{ fontFamily: "'Battambang', sans-serif" }}>
                scan វិភាគស្បែកមុខ
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Menu Bar */}
        <nav className="bg-emerald-900 text-white border-t border-emerald-800 shadow-inner relative z-50 overflow-visible">
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
                href="tel:+85512345678"
                className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 rounded-2xl border border-emerald-200 transition text-xs font-bold text-emerald-950"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <span>+855 12 345 678 / +855 98 765 432</span>
                  <span className="block text-[10px] text-emerald-700 font-normal">
                    {language === 'km' ? 'ទូរស័ព្ទពិគ្រោះយោបល់ផ្ទាល់' : language === 'zh' ? '客服热线 (金边)' : 'Direct Phone Line'}
                  </span>
                </div>
              </a>

              <a
                href="https://t.me/LumimeiCambodia"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-sky-50 hover:bg-sky-100 rounded-2xl border border-sky-200 transition text-xs font-bold text-sky-950"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span>Telegram: @LumimeiCambodia</span>
                  <span className="block text-[10px] text-sky-700 font-normal">
                    {language === 'km' ? 'ឆាតផ្ទាល់តាម Telegram ឆ្លើយតបឆាប់រហ័ស' : language === 'zh' ? 'Telegram 极速咨询' : 'Fast Telegram Messaging'}
                  </span>
                </div>
              </a>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3 text-xs">
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Phnom Penh Flagship Store</span>
                  <span className="text-[11px] text-slate-600 leading-relaxed block mt-0.5">
                    #128, Street 271, Khan Sen Sok, Phnom Penh, Cambodia
                  </span>
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
        </div>
      )}
    </>
  );
};

