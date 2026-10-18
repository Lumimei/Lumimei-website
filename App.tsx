import React, { useState, useMemo, useEffect } from 'react';
import {
  Header,
  HeroBanner,
  ProductCard,
  ProductsPage,
  ProductDetailModal,
  CartDrawer,
  CheckoutModal,
  KHQRModal,
  OrderSuccessModal,
  WishlistDrawer,
  BeautyTipsSection,
  AcneEmpathyJourneySection,
  BrandCommitmentSection,
  Footer,
  ChatBotWidget,
  PhoneLogin,
  VerifyPhone,
  CompleteProfile,
  Dashboard,
  AccountSettings,
  ProtectedRoute,
  MyPointsModal,
  MobileBottomNav,
  AISkincareAdvisorModal,
  AdminDashboard,
} from './components';
import { ConfirmationResult } from 'firebase/auth';
import { db, doc, setDoc } from './lib/firebase';
import { useAuth } from './context/AuthContext';
import { CATEGORIES, SKIN_CONCERNS, BRANDS, KHR_RATE } from './data/products';
import { getAllStoredProducts, subscribeToProducts } from './utils/productManager';
import { Product, CartItem, Order, SkinType, PaymentMethod, OrderCustomerInfo, Language } from './types';
import { Sparkles, SlidersHorizontal, RefreshCw, CheckCircle2, ChevronRight } from 'lucide-react';

export default function App() {
  const { currentUser, userProfile, updateUserProfile, loading: authLoading } = useAuth();

  // Dynamic Product State (Synchronized with Firestore Cloud Catalog & Real-Time updates)
  const [allProducts, setAllProducts] = useState<Product[]>(() => getAllStoredProducts());

  useEffect(() => {
    // 1. Subscribe to real-time Firestore product updates across all devices
    const unsubscribe = subscribeToProducts((products) => {
      if (products && products.length > 0) {
        setAllProducts(products);
      }
    });

    // 2. Listen to local custom event updates
    const handleProductsUpdated = (e: any) => {
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setAllProducts(e.detail);
      } else {
        setAllProducts(getAllStoredProducts());
      }
    };
    window.addEventListener('lumimei_products_updated', handleProductsUpdated);

    return () => {
      unsubscribe();
      window.removeEventListener('lumimei_products_updated', handleProductsUpdated);
    };
  }, []);

  // Application State
  const [language, setLanguage] = useState<Language>('km');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSkinConcern, setSelectedSkinConcern] = useState<string>('all');
  const [selectedSkinType, setSelectedSkinType] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');

  // Page Navigation State
  type PageType = 'home' | 'products' | 'phone-login' | 'verify-phone' | 'complete-profile' | 'dashboard' | 'account' | 'admin';

  // Auth return destination state
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [authNoticeMessage, setAuthNoticeMessage] = useState<string | null>(null);
  const [authInitialMode, setAuthInitialMode] = useState<'register' | 'login'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const path = window.location.pathname || '';
      if (path === '/login' || hash === '#login' || hash.includes('login')) return 'login';
      if (path === '/register' || hash === '#register' || hash.includes('register')) return 'register';
    }
    return 'login';
  });

  const [currentPage, setCurrentPage] = useState<PageType>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/admin' || hash === '#admin' || hash === '#/admin' || hash.startsWith('#admin')) {
      return 'admin';
    }
    if (path === '/products' || hash === '#products' || hash === '#/products' || hash.startsWith('#products')) {
      return 'products';
    }
    if (path === '/phone-login' || path === '/login' || path === '/register' || hash === '#phone-login' || hash === '#login' || hash === '#register') return 'phone-login';
    if (path === '/verify-phone' || hash === '#verify-phone') return 'verify-phone';
    if (path === '/complete-profile' || hash === '#complete-profile') return 'complete-profile';
    if (path === '/dashboard' || hash === '#dashboard') return 'dashboard';
    if (path === '/account' || hash === '#account') return 'account';
    return 'home';
  });

  // Phone Auth state
  const [otpConfirmation, setOtpConfirmation] = useState<ConfirmationResult | null>(null);
  const [pendingPhoneE164, setPendingPhoneE164] = useState<string>('');
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);

  // Commerce State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Modals & Drawers State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPointsOpen, setIsPointsOpen] = useState(false);
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Active Order State
  const [appliedDiscountUsd, setAppliedDiscountUsd] = useState(0);
  const [shippingFeeUsd, setShippingFeeUsd] = useState(0);
  const [activeKHQROrder, setActiveKHQROrder] = useState<Order | null>(() => {
    try {
      const saved = sessionStorage.getItem('lumimei_active_khqr_order');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Sync activeKHQROrder with sessionStorage
  useEffect(() => {
    try {
      if (activeKHQROrder) {
        sessionStorage.setItem('lumimei_active_khqr_order', JSON.stringify(activeKHQROrder));
      } else {
        sessionStorage.removeItem('lumimei_active_khqr_order');
      }
    } catch {}
  }, [activeKHQROrder]);

  // URL route listener on mount & popstate
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      const productId = searchParams.get('product') || (hash.includes('product-') ? hash.split('product-')[1] : null);

      if (path === '/payment' || path === '/khqr' || hash === '#payment' || hash === '#khqr' || searchParams.get('modal') === 'khqr') {
        try {
          const savedActive = sessionStorage.getItem('lumimei_active_khqr_order');
          if (savedActive) {
            setActiveKHQROrder(JSON.parse(savedActive));
          } else {
            const userOrders = JSON.parse(localStorage.getItem('lumimei_user_orders') || '[]');
            const pendingKhqr = userOrders.find((o: Order) => (o.paymentMethod === 'khqr' || o.paymentMethod === 'aba_pay') && o.paymentStatus !== 'paid');
            if (pendingKhqr) {
              setActiveKHQROrder(pendingKhqr);
            } else if (userOrders.length > 0) {
              setActiveKHQROrder(userOrders[0]);
            } else {
              // Default preview order so ABA KHQR page responds directly on mobile & desktop
              const catalogProducts = getAllStoredProducts();
              const sampleItems = (catalogProducts.length > 0 ? catalogProducts.slice(0, 2) : []).map((p) => ({
                product: p,
                quantity: 1,
              }));
              const sampleSubtotal = sampleItems.reduce((sum, it) => sum + it.product.priceUsd * it.quantity, 0) || 28.00;
              const sampleShipping = 1.50;
              const sampleTotalUsd = sampleSubtotal + sampleShipping;
              const sampleTotalKhr = Math.round(sampleTotalUsd * KHR_RATE);

              setActiveKHQROrder({
                id: `ORD-${Date.now().toString().slice(-6)}`,
                orderNumber: `LM-${Date.now().toString().slice(-6)}`,
                items: sampleItems,
                subtotalUsd: sampleSubtotal,
                discountUsd: 0,
                shippingFeeUsd: sampleShipping,
                totalUsd: sampleTotalUsd,
                totalKhr: sampleTotalKhr,
                customerInfo: {
                  fullName: 'អតិថិជន (Customer)',
                  phone: '012 345 678',
                  cityProvince: 'Phnom Penh',
                  districtSangkat: 'Chamkarmon',
                  addressDetail: 'Street 271, Phnom Penh',
                },
                paymentMethod: 'khqr',
                paymentStatus: 'pending',
                orderStatus: 'confirmed',
                createdAt: new Date().toLocaleDateString('km-KH'),
                estimatedDelivery: 'ក្នុងថ្ងៃនេះ (Same Day 2 Hours)',
                trackingCode: `JT${Math.floor(8000000 + Math.random() * 1000000)}KH`,
              });
            }
          }
        } catch {}
      }

      if (path === '/admin' || hash === '#admin' || hash === '#/admin' || hash.startsWith('#admin')) {
        setCurrentPage('admin');
      } else if (path === '/products' || hash === '#products' || hash === '#/products' || hash.startsWith('#products')) {
        setCurrentPage('products');
      } else if (path === '/login' || hash === '#login' || hash === '#/login' || (path === '/phone-login' && searchParams.get('mode') === 'login')) {
        setAuthInitialMode('login');
        setCurrentPage('phone-login');
      } else if (path === '/register' || hash === '#register' || hash === '#/register' || (path === '/phone-login' && searchParams.get('mode') === 'register')) {
        setAuthInitialMode('register');
        setCurrentPage('phone-login');
      } else if (path === '/phone-login' || hash === '#phone-login') {
        setCurrentPage('phone-login');
      } else if (path === '/verify-phone' || hash === '#verify-phone') {
        setCurrentPage('verify-phone');
      } else if (path === '/complete-profile' || hash === '#complete-profile') {
        setCurrentPage('complete-profile');
      } else if (path === '/dashboard' || hash === '#dashboard') {
        setCurrentPage('dashboard');
      } else if (path === '/account' || hash === '#account') {
        setCurrentPage('account');
      } else {
        setCurrentPage('home');
      }

      if (productId) {
        const currentProducts = getAllStoredProducts();
        const found = currentProducts.find((p) => p.id === productId);
        if (found) {
          setQuickViewProduct(found);
        }
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    window.addEventListener('hashchange', handleUrlRoute);

    return () => {
      window.removeEventListener('popstate', handleUrlRoute);
      window.removeEventListener('hashchange', handleUrlRoute);
    };
  }, []);

  const navigateToHome = () => {
    if (window.location.pathname !== '/' || window.location.hash) {
      window.history.pushState({}, '', '/');
    }
    setSelectedCategory('all');
    setSelectedSkinConcern('all');
    setSelectedBrand('all');
    setSearchQuery('');
    setCurrentPage('home');
    setIsPointsOpen(false);
    setIsCartOpen(false);
    setIsWishlistOpen(false);
    setQuickViewProduct(null);
    window.dispatchEvent(new CustomEvent('lumimei_reviews_closed'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToProducts = (category?: unknown) => {
    const validCategory = typeof category === 'string' && category.trim() ? category.trim() : 'all';
    if (window.location.pathname !== '/products' || window.location.hash) {
      window.history.pushState({}, '', validCategory !== 'all' ? `/products?cat=${validCategory}` : '/products');
    }
    setSelectedCategory(validCategory);
    setSelectedSkinConcern('all');
    setSelectedBrand('all');
    setSearchQuery('');
    setCurrentPage('products');
    setIsPointsOpen(false);
    setIsCartOpen(false);
    setIsWishlistOpen(false);
    setQuickViewProduct(null);
    window.dispatchEvent(new CustomEvent('lumimei_reviews_closed'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPromotions = () => {
    if (window.location.pathname !== '/products') {
      window.history.pushState({}, '', '/products?cat=promotion');
    }
    setSelectedCategory('promotion');
    setSearchQuery('');
    setCurrentPage('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPhoneLogin = (mode: 'login' | 'register' = 'login', notice?: string) => {
    setAuthInitialMode(mode);
    if (notice) {
      setAuthNoticeMessage(notice);
    } else {
      setAuthNoticeMessage(null);
    }
    const targetHash = mode === 'login' ? '#login' : '#register';
    if (window.location.hash !== targetHash) {
      window.history.pushState({}, '', targetHash);
    }
    setCurrentPage('phone-login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToVerifyPhone = (confirmation: ConfirmationResult, phone: string) => {
    setOtpConfirmation(confirmation);
    setPendingPhoneE164(phone);
    if (window.location.pathname !== '/verify-phone') {
      window.history.pushState({}, '', '/verify-phone');
    }
    setCurrentPage('verify-phone');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCompleteProfile = () => {
    if (window.location.pathname !== '/complete-profile') {
      window.history.pushState({}, '', '/complete-profile');
    }
    setCurrentPage('complete-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToDashboard = () => {
    if (window.location.pathname !== '/dashboard') {
      window.history.pushState({}, '', '/dashboard');
    }
    setCurrentPage('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToAccount = () => {
    if (window.location.pathname !== '/account') {
      window.history.pushState({}, '', '/account');
    }
    setCurrentPage('account');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToAdmin = () => {
    if (window.location.pathname !== '/admin' && window.location.hash !== '#admin') {
      window.history.pushState({}, '', '/admin');
    }
    setCurrentPage('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickViewWithUrl = (product: Product | null) => {
    setQuickViewProduct(product);
    if (product) {
      const basePath = currentPage === 'products' ? '/products' : '/';
      window.history.pushState({}, '', `${basePath}?product=${product.id}`);
    } else {
      const basePath = currentPage === 'products' ? '/products' : '/';
      window.history.pushState({}, '', basePath);
    }
  };

  // Filtered Products Computation
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      if (!p) return false;
      const skinConcerns = Array.isArray(p.skinConcerns) ? p.skinConcerns : [];
      const skinTypes = Array.isArray(p.skinTypes) ? p.skinTypes : [];

      // Category Filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'promotion') {
          const isPromo =
            p.category === 'promotion' ||
            (p.originalPriceUsd && p.originalPriceUsd > p.priceUsd) ||
            p.isBestSeller ||
            p.isFreeShipping;
          if (!isPromo) return false;
        } else if (selectedCategory === 'best-seller' || selectedCategory === 'bestseller') {
          const isBest =
            p.category === 'best-seller' ||
            p.category === 'bestseller' ||
            Boolean(p.isBestSeller);
          if (!isBest) return false;
        } else if (p.category !== selectedCategory) {
          return false;
        }
      }
      // Skin Concern Filter
      if (selectedSkinConcern !== 'all' && !skinConcerns.includes(selectedSkinConcern)) {
        return false;
      }
      // Skin Type Filter
      if (selectedSkinType !== 'all' && !skinTypes.includes('all') && !skinTypes.includes(selectedSkinType as SkinType)) {
        return false;
      }
      // Brand Filter
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) {
        return false;
      }
      // Search Query Filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = (p.name || '').toLowerCase().includes(q) || (p.nameKm || '').toLowerCase().includes(q);
        const matchesBrand = (p.brand || '').toLowerCase().includes(q);
        const matchesDesc = (p.description || '').toLowerCase().includes(q) || (p.descriptionKm || '').toLowerCase().includes(q);
        const matchesIng = (p.ingredients || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesDesc && !matchesIng) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return (a.priceUsd || 0) - (b.priceUsd || 0);
      if (sortBy === 'price-high') return (b.priceUsd || 0) - (a.priceUsd || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0; // default featured
    });
  }, [allProducts, selectedCategory, selectedSkinConcern, selectedSkinType, selectedBrand, searchQuery, sortBy]);

  // Promotional Products for Home Page
  const promotionalProducts = useMemo(() => {
    const promos = allProducts.filter(
      (p) =>
        p.category === 'promotion' ||
        (p.originalPriceUsd && p.originalPriceUsd > p.priceUsd) ||
        p.isBestSeller ||
        p.isFreeShipping
    );
    return promos.length > 0 ? promos : allProducts;
  }, [allProducts]);

  // Cart Handlers
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { product, quantity }];
    });
  };

  const handleAddMultipleToCart = (products: Product[]) => {
    products.forEach((p) => handleAddToCart(p, 1));
    setIsCartOpen(true);
  };

  const handleRestorePoints = (pointsToRestore: number) => {
    if (pointsToRestore <= 0) return;
    if (currentUser && userProfile) {
      const currentPts = userProfile.points !== undefined ? userProfile.points : 15;
      updateUserProfile({ points: currentPts + pointsToRestore }).catch(console.error);
    } else {
      const currentGuestPts = Number(localStorage.getItem('lumimei_guest_points') || '15');
      const newGuestPts = currentGuestPts + pointsToRestore;
      localStorage.setItem('lumimei_guest_points', newGuestPts.toString());
      window.dispatchEvent(new Event('pointsUpdated'));
    }
    window.dispatchEvent(new CustomEvent('pointsRestored', { detail: { points: pointsToRestore } }));
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    const existingItem = cart.find((item) => item.product.id === productId);
    if (existingItem && existingItem.product.pointsCost) {
      const pointsCost = existingItem.product.pointsCost;
      if (quantity < existingItem.quantity) {
        const qtyDiff = existingItem.quantity - Math.max(0, quantity);
        const pointsToReturn = qtyDiff * pointsCost;
        handleRestorePoints(pointsToReturn);
      } else if (quantity > existingItem.quantity) {
        const qtyDiff = quantity - existingItem.quantity;
        const requiredPts = qtyDiff * pointsCost;
        const currentPts = userProfile?.points !== undefined
          ? userProfile.points
          : Number(localStorage.getItem('lumimei_guest_points') || '15');

        if (currentPts < requiredPts) {
          return;
        }

        if (currentUser && userProfile) {
          updateUserProfile({ points: currentPts - requiredPts }).catch(console.error);
        } else {
          localStorage.setItem('lumimei_guest_points', (currentPts - requiredPts).toString());
          window.dispatchEvent(new Event('pointsUpdated'));
        }
      }
    }

    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
      );
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    const existingItem = cart.find((item) => item.product.id === productId);
    if (existingItem && existingItem.product.pointsCost) {
      const pointsToReturn = existingItem.quantity * existingItem.product.pointsCost;
      handleRestorePoints(pointsToReturn);
    }
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Wishlist Handlers
  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  // Cart Totals
  const cartSubtotalUsd = cart.reduce(
    (sum, item) => sum + item.product.priceUsd * item.quantity,
    0
  );

  // Checkout Trigger
  const handleProceedToCheckout = (discount: number, shipping: number) => {
    setAppliedDiscountUsd(discount);
    setShippingFeeUsd(shipping);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Helper to award points on purchase ($10 spent = 1 point)
  const saveOrderToHistory = (order: Order) => {
    try {
      const existing = JSON.parse(localStorage.getItem('lumimei_user_orders') || '[]');
      const filtered = existing.filter((o: Order) => o.id !== order.id);
      const updated = [order, ...filtered];
      localStorage.setItem('lumimei_user_orders', JSON.stringify(updated));
      window.dispatchEvent(new Event('ordersUpdated'));

      // 1. Direct Firestore write to orders collection
      try {
        const orderDocRef = doc(db, 'orders', order.id);
        setDoc(orderDocRef, {
          ...order,
          updatedAt: new Date().toISOString(),
        }, { merge: true }).catch((fsErr) => console.warn('Direct Firestore order save warning:', fsErr));
      } catch (fsErr) {
        console.warn('Firestore doc creation error:', fsErr);
      }

      // 2. Also sync order to backend Admin database
      fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      }).catch((err) => console.warn('Could not sync order to backend:', err));
    } catch (e) {
      console.error(e);
    }
  };

  const awardPointsForPurchase = (subtotalAmount: number) => {
    const earnedPoints = Math.floor(subtotalAmount / 10);
    if (earnedPoints <= 0) return;

    if (currentUser && userProfile) {
      const currentPts = userProfile.points !== undefined ? userProfile.points : 15;
      const newPts = currentPts + earnedPoints;
      updateUserProfile({ points: newPts }).catch(console.error);
    } else {
      const currentGuestPts = Number(localStorage.getItem('lumimei_guest_points') || '15');
      const newGuestPts = currentGuestPts + earnedPoints;
      localStorage.setItem('lumimei_guest_points', newGuestPts.toString());
      window.dispatchEvent(new Event('pointsUpdated'));
    }
  };

  // Order Submission Handler
  const handleSubmitOrder = (customerInfo: OrderCustomerInfo, paymentMethod: PaymentMethod) => {
    const orderNumber = `BB-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalTotalUsd = Math.max(0, cartSubtotalUsd - appliedDiscountUsd + shippingFeeUsd);
    const finalTotalKhr = Math.round(finalTotalUsd * KHR_RATE);

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber,
      items: [...cart],
      subtotalUsd: cartSubtotalUsd,
      discountUsd: appliedDiscountUsd,
      shippingFeeUsd,
      totalUsd: finalTotalUsd,
      totalKhr: finalTotalKhr,
      customerInfo,
      paymentMethod,
      paymentStatus: paymentMethod === 'khqr' || paymentMethod === 'aba_pay' ? 'pending' : 'pending',
      orderStatus: 'confirmed',
      createdAt: new Date().toLocaleDateString('km-KH'),
      estimatedDelivery: customerInfo.cityProvince.includes('Phnom Penh') ? 'ក្នុងថ្ងៃនេះ (Same Day 2 Hours)' : '១ - ២ ថ្ងៃ (1-2 Days)',
      trackingCode: `JT${Math.floor(8000000 + Math.random() * 1000000)}KH`,
    };

    setIsCheckoutOpen(false);

    if (paymentMethod === 'khqr' || paymentMethod === 'aba_pay') {
      setActiveKHQROrder(newOrder);
      saveOrderToHistory(newOrder);
    } else {
      setCart([]);
      setCompletedOrder({ ...newOrder, paymentStatus: 'pending' });
      saveOrderToHistory({ ...newOrder, paymentStatus: 'pending' });
      awardPointsForPurchase(cartSubtotalUsd);
    }
  };

  // KHQR Payment Success Callback
  const handlePaymentSuccess = (orderId: string) => {
    if (activeKHQROrder && activeKHQROrder.id === orderId) {
      const paidOrder: Order = {
        ...activeKHQROrder,
        paymentStatus: 'paid',
        orderStatus: 'packing',
      };
      setActiveKHQROrder(null);
      setCart([]);
      setCompletedOrder(paidOrder);
      saveOrderToHistory(paidOrder);
      awardPointsForPurchase(paidOrder.subtotalUsd);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#2E8B57] antialiased flex flex-col selection:bg-[#2E8B57] selection:text-white lg:pl-[260px] xl:pl-[280px]">
      {/* Navbar Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        wishlistCount={wishlist.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenPoints={() => {
          if (!currentUser && !userProfile) {
            navigateToPhoneLogin(
              'register',
              language === 'km'
                ? '🎉 សូមបង្កើតគណនីថ្មីជាមុនសិន ដើម្បីទទួលបានរង្វាន់ សន្សំពិន្ទុ និងប្តូរយកផលិតផល Lumimei ដោយឥតគិតថ្លៃ!'
                : language === 'zh'
                ? '🎉 请先注册创建账号，即可参与赢取积分与兑换 Lumimei 专属奖励！'
                : '🎉 Please create an account first to unlock rewards, earn points, and redeem free Lumimei products!'
            );
            return;
          }
          setIsPointsOpen(true);
        }}
        language={language}
        setLanguage={setLanguage}
        totalUsd={cartSubtotalUsd}
        currentPage={currentPage}
        onNavigateToHome={navigateToHome}
        onNavigateToProducts={navigateToProducts}
        onNavigateToPhoneLogin={(mode) => navigateToPhoneLogin(mode || 'login')}
        onNavigateToDashboard={navigateToDashboard}
        onNavigateToAccount={navigateToAccount}
        onNavigateToAdmin={navigateToAdmin}
        onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
      />

      {/* Main App Canvas */}
      <main
        className="flex-1 max-w-7xl w-full mx-auto px-4 pt-1.5 sm:pt-2"
        style={{
          paddingBottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {currentPage === 'products' ? (
          <ProductsPage
            products={filteredProducts}
            totalProductCount={allProducts.length}
            language={language}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedSkinConcern={selectedSkinConcern}
            setSelectedSkinConcern={setSelectedSkinConcern}
            selectedSkinType={selectedSkinType}
            setSelectedSkinType={setSelectedSkinType}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            wishlist={wishlist}
            cart={cart}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={(p, qty) => handleAddToCart(p, qty)}
            onQuickView={(p) => handleQuickViewWithUrl(p)}
            onBackToHome={navigateToHome}
          />
        ) : currentPage === 'phone-login' ? (
          <PhoneLogin
            initialMode={authInitialMode}
            noticeMessage={authNoticeMessage || undefined}
            onOTPSent={(confirmation, phone) => navigateToVerifyPhone(confirmation, phone)}
            onNavigateHome={() => {
              setAuthNoticeMessage(null);
              navigateToHome();
            }}
            onFacebookSuccess={() => {
              setAuthNoticeMessage(null);
              navigateToDashboard();
            }}
            onOpenPrivacyPolicy={() => setShowPrivacyPolicyModal(true)}
            onNavigateToAdmin={navigateToAdmin}
          />
        ) : currentPage === 'verify-phone' ? (
          otpConfirmation ? (
            <VerifyPhone
              confirmationResult={otpConfirmation}
              phoneE164={pendingPhoneE164}
              onVerified={(isNewUser) => {
                if (isNewUser) {
                  navigateToCompleteProfile();
                } else {
                  setReturnTo(null);
                  setAuthNoticeMessage(null);
                  navigateToDashboard();
                }
              }}
              onChangePhoneNumber={() => navigateToPhoneLogin('login')}
              onResendOTP={async () => {
                return otpConfirmation;
              }}
            />
          ) : (
            <PhoneLogin
              initialMode={authInitialMode}
              noticeMessage={authNoticeMessage || undefined}
              onOTPSent={(confirmation, phone) => navigateToVerifyPhone(confirmation, phone)}
              onNavigateHome={() => {
                setAuthNoticeMessage(null);
                navigateToHome();
              }}
              onFacebookSuccess={() => {
                setAuthNoticeMessage(null);
                navigateToDashboard();
              }}
              onOpenPrivacyPolicy={() => setShowPrivacyPolicyModal(true)}
            />
          )
        ) : currentPage === 'complete-profile' ? (
          <ProtectedRoute onUnauthenticated={() => navigateToPhoneLogin()}>
            <CompleteProfile
              onCompleted={() => {
                setReturnTo(null);
                setAuthNoticeMessage(null);
                navigateToDashboard();
              }}
              onOpenPrivacyPolicy={() => setShowPrivacyPolicyModal(true)}
            />
          </ProtectedRoute>
        ) : currentPage === 'dashboard' ? (
          <ProtectedRoute
            onUnauthenticated={() => navigateToPhoneLogin()}
            onProfileIncomplete={navigateToCompleteProfile}
          >
            <Dashboard
              onNavigateToAccount={navigateToAccount}
              onLogoutSuccess={navigateToHome}
              onOpenPoints={() => setIsPointsOpen(true)}
              onNavigateToAdmin={navigateToAdmin}
            />
          </ProtectedRoute>
        ) : currentPage === 'admin' ? (
          <AdminDashboard
            language={language}
            onNavigateHome={navigateToHome}
          />
        ) : currentPage === 'account' ? (
          <ProtectedRoute
            onUnauthenticated={() => navigateToPhoneLogin()}
            onProfileIncomplete={navigateToCompleteProfile}
          >
            <AccountSettings
              onNavigateHome={navigateToHome}
              onNavigateToDashboard={navigateToDashboard}
              onLogoutSuccess={navigateToHome}
              onLanguageChanged={(lang) => setLanguage(lang)}
            />
          </ProtectedRoute>
        ) : (
          <>
            {/* Promotional Hero Banner */}
            <HeroBanner
              language={language}
              onNavigateToProducts={navigateToProducts}
              onOpenFreeAnalysis={() => setIsAiAdvisorOpen(true)}
              onSelectTag={(tag) => {
                if (['sunscreen', 'cleanser', 'serum', 'moisturizer'].includes(tag)) {
                  setSelectedCategory(tag);
                } else if (['acne', 'hydration'].includes(tag)) {
                  setSelectedSkinConcern(tag);
                } else {
                  setSelectedBrand(tag);
                }
                navigateToProducts();
              }}
            />

            {/* Acne Emotional Empathy & Mindset Journey Section */}
            <AcneEmpathyJourneySection
              language={language}
              onNavigateToProducts={navigateToProducts}
              onOpenFreeAnalysis={() => setIsAiAdvisorOpen(true)}
            />

            {/* Lumimei Set Section */}
            <div id="products-section" className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-[#2E8B57]/20 shadow-sm my-6 scroll-mt-28">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#2E8B57]/15">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-8 bg-[#2E8B57] rounded-full" />
                  <div>
                    <h2 className="font-extrabold font-opensans text-[#2E8B57]" style={{ fontSize: '27px' }}>
                      {language === 'km' ? 'ផលិតផល Lumimei' : language === 'zh' ? 'Lumimei 护肤品' : 'Lumimei Products'}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={navigateToProducts}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2E8B57] hover:bg-[#257347] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
                >
                  <span>{language === 'km' ? 'មើលផលិតផលទាំងអស់ (' + allProducts.length + ')' : language === 'zh' ? '查看所有商品 (' + allProducts.length + ')' : 'View All Products (' + allProducts.length + ')'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Product Cards Grid (Only 2 products) */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {filteredProducts.slice(0, 2).map((prod) => (
                  <ProductCard
                    key={'set-' + prod.id}
                    product={prod}
                    language={language}
                    isWishlisted={wishlist.some((p) => p.id === prod.id)}
                    isInCart={cart.some((item) => item.product.id === prod.id)}
                    onToggleWishlist={handleToggleWishlist}
                    onAddToCart={(p) => handleAddToCart(p, 1)}
                    onQuickView={(p) => handleQuickViewWithUrl(p)}
                  />
                ))}
              </div>

              <div className="mt-6 text-center pt-4 border-t border-[#2E8B57]/10">
                <button
                  onClick={navigateToProducts}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#2E8B57] hover:bg-[#257347] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <span>{language === 'km' ? 'ចូលទៅកាន់ទំព័រផលិតផលទាំងអស់ →' : language === 'zh' ? '进入所有商品页面 →' : 'Go to All Products Page →'}</span>
                </button>
              </div>
            </div>

            {/* Brand Commitment Section (Below Products Section) */}
            <BrandCommitmentSection language={language} />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer language={language} onNavigateToAdmin={navigateToAdmin} />

      {/* Mobile Bottom Navigation (< 768px visible, >= 768px hidden) */}
      <MobileBottomNav
        currentPage={currentPage}
        language={language}
        onNavigateToHome={navigateToHome}
        onNavigateToProducts={() => navigateToProducts('all')}
        onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
        onOpenFreeAnalysis={() => setIsAiAdvisorOpen(true)}
        onOpenReviews={() => {
          window.dispatchEvent(new CustomEvent('lumimei_open_reviews'));
        }}
        onNavigateToAccount={() => {
          if (currentUser || userProfile) {
            navigateToDashboard();
          } else {
            navigateToPhoneLogin('login');
          }
        }}
        onNavigateToPhoneLogin={(mode) => navigateToPhoneLogin(mode || 'login')}
        isAiAdvisorOpen={isAiAdvisorOpen}
        isFreeAnalysisOpen={isAiAdvisorOpen}
      />

      {/* Overlays, Drawers & Modals */}
      {quickViewProduct && (
        <ProductDetailModal
          product={quickViewProduct}
          language={language}
          isWishlisted={wishlist.some((p) => p.id === quickViewProduct.id)}
          onClose={() => handleQuickViewWithUrl(null)}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={(p, qty) => handleAddToCart(p, qty)}
          onBuyNow={(p, qty) => {
            handleAddToCart(p, qty);
            handleQuickViewWithUrl(null);
            setIsCartOpen(true);
          }}
          onOpenChat={() => {
            window.open('https://t.me/lumimei_cambodia', '_blank');
          }}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        language={language}
        items={cart}
        onClose={() => setIsCartOpen(false)}
        onNavigateToProducts={() => navigateToProducts('all')}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={handleProceedToCheckout}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        language={language}
        wishlist={wishlist}
        onClose={() => setIsWishlistOpen(false)}
        onRemoveFromWishlist={handleToggleWishlist}
        onAddToCart={(p) => handleAddToCart(p, 1)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        language={language}
        items={cart}
        subtotalUsd={cartSubtotalUsd}
        discountUsd={appliedDiscountUsd}
        shippingFeeUsd={shippingFeeUsd}
        onClose={() => setIsCheckoutOpen(false)}
        onSubmitOrder={handleSubmitOrder}
      />

      <KHQRModal
        order={activeKHQROrder}
        language={language}
        onClose={() => {
          setActiveKHQROrder(null);
          if (window.location.hash === '#payment' || window.location.hash === '#khqr') {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <OrderSuccessModal
        order={completedOrder}
        language={language}
        onClose={() => setCompletedOrder(null)}
      />

      <MyPointsModal
        isOpen={isPointsOpen}
        language={language}
        onClose={() => setIsPointsOpen(false)}
        onAddToCart={(p) => handleAddToCart(p, 1)}
        onNavigateToPhoneLogin={(mode, notice) => navigateToPhoneLogin(mode, notice)}
        products={allProducts}
        onSelectProduct={(p) => {
          setIsPointsOpen(false);
          handleQuickViewWithUrl(p);
        }}
      />

      <AISkincareAdvisorModal
        isOpen={isAiAdvisorOpen}
        onClose={() => setIsAiAdvisorOpen(false)}
        language={language}
        onNavigateToAccount={() => {
          setIsAiAdvisorOpen(false);
          navigateToDashboard();
        }}
        onNavigateToFollowUp={() => {
          setIsAiAdvisorOpen(false);
          navigateToDashboard();
        }}
        onAddToCart={(p, qty) => handleAddToCart(p, qty)}
        onSelectProduct={(p) => {
          setIsAiAdvisorOpen(false);
          handleQuickViewWithUrl(p);
        }}
      />

      <ChatBotWidget
        language={language}
        onSelectProduct={(product) => handleQuickViewWithUrl(product)}
        products={allProducts}
      />

      {/* Privacy Policy Modal */}
      {showPrivacyPolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-emerald-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900 font-opensans">
                គោលការណ៍ឯកជនភាព និងលក្ខខណ្ឌប្រើប្រាស់ Lumimei
              </h3>
              <button
                onClick={() => setShowPrivacyPolicyModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto">
              <p className="font-bold text-slate-800">១. ការប្រមូលទិន្នន័យផ្ទាល់ខ្លួន</p>
              <p>
                យើងខ្ញុំប្រមូលទិន្នន័យលេខទូរស័ព្ទ និងឈ្មោះរបស់អ្នក សម្រាប់តែការផ្ទៀងផ្ទាត់អត្តសញ្ញាណ គ្រប់គ្រងគណនី និងផ្តល់សេវាកម្មថែរក្សាស្បែកមុខផ្ទាល់ខ្លួនតែប៉ុណ្ណោះ។
              </p>

              <p className="font-bold text-slate-800 mt-3">២. សុវត្ថិភាព និងការរក្សាទុក</p>
              <p>
                លេខទូរស័ព្ទត្រូវបានផ្ទៀងផ្ទាត់តាមប្រព័ន្ធ Firebase Phone Authentication និងរក្សាទុកក្នុងទម្រង់អន្តរជាតិ E.164។ លេខកូដ OTP មិនត្រូវបានរក្សាទុកក្នុង Firestore ឬប្រព័ន្ធ Local Storage ឡើយ។
              </p>

              <p className="font-bold text-slate-800 mt-3">៣. សិទ្ធិរបស់អ្នកប្រើប្រាស់</p>
              <p>
                អ្នកមានសិទ្ធិកែប្រែឈ្មោះ ភាសា ផ្លាស់ប្ដូរលេខទូរស័ព្ទ ឬលុបគណនីរបស់អ្នកចេញពីប្រព័ន្ធ Lumimei បានគ្រប់ពេលវេលាតាមរយៈទំព័រ "ការកំណត់គណនី"។
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowPrivacyPolicyModal(false)}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl text-xs cursor-pointer shadow-xs"
              >
                ខ្ញុំយល់ព្រម
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}