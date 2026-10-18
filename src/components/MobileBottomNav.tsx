import React, { useEffect, useState } from 'react';
import { Home, Package, Sparkles, Star, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentPage: string;
  onNavigateToHome: () => void;
  onNavigateToProducts: () => void;
  onOpenFreeAnalysis?: () => void;
  onOpenAiAdvisor?: () => void;
  onOpenReviews: () => void;
  onNavigateToAccount: () => void;
  onNavigateToPhoneLogin: (mode?: 'login' | 'register') => void;
  isReviewsOpen?: boolean;
  isFreeAnalysisOpen?: boolean;
  isAiAdvisorOpen?: boolean;
  language?: 'km' | 'en' | 'zh';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPage,
  onNavigateToHome,
  onNavigateToProducts,
  onOpenFreeAnalysis,
  onOpenAiAdvisor,
  onOpenReviews,
  onNavigateToAccount,
  onNavigateToPhoneLogin,
  isReviewsOpen = false,
  isFreeAnalysisOpen = false,
  isAiAdvisorOpen = false,
  language = 'km',
}) => {
  const { currentUser, userProfile } = useAuth();
  const [internalReviewsOpen, setInternalReviewsOpen] = useState(false);

  useEffect(() => {
    const handleOpenReviews = () => setInternalReviewsOpen(true);
    const handleCloseReviews = () => setInternalReviewsOpen(false);

    window.addEventListener('lumimei_open_reviews', handleOpenReviews);
    window.addEventListener('lumimei_reviews_closed', handleCloseReviews);

    return () => {
      window.removeEventListener('lumimei_open_reviews', handleOpenReviews);
      window.removeEventListener('lumimei_reviews_closed', handleCloseReviews);
    };
  }, []);

  const effectiveReviewsOpen = isReviewsOpen || internalReviewsOpen;
  const effectiveAdvisorOpen = isAiAdvisorOpen || isFreeAnalysisOpen;
  const handleOpenAdvisorClick = onOpenAiAdvisor || onOpenFreeAnalysis;

  const isHomeActive =
    (currentPage === 'home' || !currentPage) && !effectiveReviewsOpen && !effectiveAdvisorOpen;
  const isProductsActive =
    currentPage === 'products' && !effectiveReviewsOpen && !effectiveAdvisorOpen;
  const isReviewsActive = effectiveReviewsOpen && !effectiveAdvisorOpen;
  const isAccountActive =
    ['dashboard', 'account', 'phone-login', 'verify-phone', 'complete-profile'].includes(currentPage) &&
    !effectiveReviewsOpen &&
    !effectiveAdvisorOpen;

  const handleHomeClick = () => {
    setInternalReviewsOpen(false);
    window.dispatchEvent(new CustomEvent('lumimei_reviews_closed'));
    if (window.location.hash) {
      window.history.pushState("", document.title, window.location.pathname + window.location.search);
    }
    onNavigateToHome();
  };

  const handleProductsClick = () => {
    setInternalReviewsOpen(false);
    window.dispatchEvent(new CustomEvent('lumimei_reviews_closed'));
    if (window.location.hash) {
      window.history.pushState("", document.title, window.location.pathname + window.location.search);
    }
    onNavigateToProducts();
  };

  const handleAccountClick = () => {
    if (currentUser || userProfile) {
      onNavigateToAccount();
    } else {
      onNavigateToPhoneLogin('login');
    }
  };

  return (
    <nav
      id="lumimei-mobile-bottom-nav"
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 w-full z-40 bg-white border-t border-[#2E8B57]/20 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] select-none"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-stretch justify-between w-full h-[64px] sm:h-[68px] px-1">
        {/* 1: ទំព័រដើម (Home) */}
        <button
          id="mobile-nav-home"
          type="button"
          onClick={handleHomeClick}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 transition-colors duration-150 cursor-pointer active:opacity-80 ${
            isHomeActive
              ? 'text-[#2E8B57]'
              : 'text-[#2E8B57] opacity-60 hover:opacity-100'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Home
              className={`w-5 h-5 transition-transform duration-150 text-[#2E8B57] ${
                isHomeActive ? 'stroke-[2.5]' : 'stroke-[1.8]'
              }`}
            />
          </div>
          <span
            className={`text-[11px] leading-tight mt-1 truncate ${
              isHomeActive
                ? 'font-bold'
                : 'font-normal'
            }`}
          >
            {language === 'km' ? 'ទំព័រដើម' : language === 'zh' ? '首页' : 'Home'}
          </span>
        </button>

        {/* 2: ផលិតផល (Products) */}
        <button
          id="mobile-nav-products"
          type="button"
          onClick={handleProductsClick}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 transition-colors duration-150 cursor-pointer active:opacity-80 ${
            isProductsActive
              ? 'text-[#2E8B57]'
              : 'text-[#2E8B57] opacity-60 hover:opacity-100'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Package
              className={`w-5 h-5 transition-transform duration-150 text-[#2E8B57] ${
                isProductsActive ? 'stroke-[2.5]' : 'stroke-[1.8]'
              }`}
            />
          </div>
          <span
            className={`text-[11px] leading-tight mt-1 truncate ${
              isProductsActive
                ? 'font-bold'
                : 'font-normal'
            }`}
          >
            {language === 'km' ? 'ផលិតផល' : language === 'zh' ? '商品' : 'Products'}
          </span>
        </button>

        {/* 3: វិភាគស្បែកមុខដោយឥតគិតថ្លៃ (Free Skin Analysis - Middle Button) */}
        <button
          id="mobile-nav-advisor"
          type="button"
          onClick={handleOpenAdvisorClick}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 transition-all duration-150 cursor-pointer active:scale-98 ${
            effectiveAdvisorOpen
              ? 'bg-[#2E8B57] text-[#FFFFFF] rounded-xl my-1'
              : 'text-[#2E8B57] opacity-85 hover:opacity-100'
          }`}
          title="វិភាគស្បែកមុខដោយឥតគិតថ្លៃ"
          aria-label="វិភាគស្បែកមុខដោយឥតគិតថ្លៃ"
        >
          <div className="relative flex items-center justify-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                effectiveAdvisorOpen
                  ? 'bg-white/20 text-white'
                  : 'bg-[#2E8B57]/15 text-[#2E8B57]'
              }`}
            >
              <Sparkles className="w-4 h-4 stroke-[2.2] animate-pulse" />
            </div>
          </div>
          <span
            className={`text-[9.5px] sm:text-[10.5px] leading-tight mt-1 text-center truncate max-w-full px-0.5 ${
              effectiveAdvisorOpen
                ? 'font-bold text-[#FFFFFF]'
                : 'font-semibold text-[#2E8B57]'
            }`}
          >
            {language === 'km' ? 'វិភាគស្បែកមុខ' : language === 'zh' ? '免费测肤' : 'Skin Analysis'}
          </span>
        </button>

        {/* 4: Review */}
        <button
          id="mobile-nav-review"
          type="button"
          onClick={onOpenReviews}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 transition-colors duration-150 cursor-pointer active:opacity-80 ${
            isReviewsActive
              ? 'text-[#2E8B57]'
              : 'text-[#2E8B57] opacity-60 hover:opacity-100'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Star
              className={`w-5 h-5 transition-transform duration-150 text-[#2E8B57] ${
                isReviewsActive
                  ? 'fill-[#2E8B57] stroke-[2]'
                  : 'stroke-[1.8]'
              }`}
            />
          </div>
          <span
            className={`text-[11px] leading-tight mt-1 truncate ${
              isReviewsActive
                ? 'font-bold'
                : 'font-normal'
            }`}
          >
            Review
          </span>
        </button>

        {/* 5: គណនីខ្ញុំ (My Account) */}
        <button
          id="mobile-nav-account"
          type="button"
          onClick={handleAccountClick}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 transition-colors duration-150 cursor-pointer active:opacity-80 ${
            isAccountActive
              ? 'text-[#2E8B57]'
              : 'text-[#2E8B57] opacity-60 hover:opacity-100'
          }`}
        >
          <div className="relative flex items-center justify-center">
            {currentUser && userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt="Avatar"
                className={`w-5 h-5 rounded-full object-cover border ${
                  isAccountActive ? 'border-[#2E8B57] ring-1 ring-[#2E8B57]' : 'border-[#2E8B57]/30'
                }`}
              />
            ) : (
              <User
                className={`w-5 h-5 transition-transform duration-150 text-[#2E8B57] ${
                  isAccountActive ? 'stroke-[2.5]' : 'stroke-[1.8]'
                }`}
              />
            )}
            {currentUser && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#2E8B57] rounded-full ring-1 ring-white" />
            )}
          </div>
          <span
            className={`text-[11px] leading-tight mt-1 truncate ${
              isAccountActive
                ? 'font-bold'
                : 'font-normal'
            }`}
          >
            គណនីខ្ញុំ
          </span>
        </button>
      </div>
    </nav>
  );
};
