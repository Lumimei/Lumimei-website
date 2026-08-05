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
  AISkincareAdvisorModal,
  WishlistDrawer,
  BeautyTipsSection,
  Footer,
  ChatBotWidget,
  FaceScanModal,
} from './components';
import { PRODUCTS, CATEGORIES, SKIN_CONCERNS, BRANDS, KHR_RATE } from './data/products';
import { Product, CartItem, Order, SkinType, PaymentMethod, OrderCustomerInfo, Language } from './types';
import { Sparkles, SlidersHorizontal, RefreshCw, CheckCircle2, Filter, ChevronRight } from 'lucide-react';

export default function App() {
  // Application State
  const [language, setLanguage] = useState<Language>('km');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSkinConcern, setSelectedSkinConcern] = useState<string>('all');
  const [selectedSkinType, setSelectedSkinType] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');

  // Page Navigation State
  const [currentPage, setCurrentPage] = useState<'home' | 'products'>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/products' || hash === '#products' || hash === '#/products' || hash.startsWith('#products')) {
      return 'products';
    }
    return 'home';
  });

  // Commerce State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Modals & Drawers State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);
  const [isFaceScanOpen, setIsFaceScanOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Active Order State
  const [appliedDiscountUsd, setAppliedDiscountUsd] = useState(0);
  const [shippingFeeUsd, setShippingFeeUsd] = useState(0);
  const [activeKHQROrder, setActiveKHQROrder] = useState<Order | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // URL route listener on mount & popstate
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      const productId = searchParams.get('product') || (hash.includes('product-') ? hash.split('product-')[1] : null);

      if (path === '/products' || hash === '#products' || hash === '#/products' || hash.startsWith('#products')) {
        setCurrentPage('products');
      } else {
        setCurrentPage('home');
      }

      if (productId) {
        const found = PRODUCTS.find((p) => p.id === productId);
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
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToProducts = () => {
    if (window.location.pathname !== '/products') {
      window.history.pushState({}, '', '/products');
    }
    setCurrentPage('products');
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
    return PRODUCTS.filter((p) => {
      // Category Filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      // Skin Concern Filter
      if (selectedSkinConcern !== 'all' && !p.skinConcerns.includes(selectedSkinConcern)) {
        return false;
      }
      // Skin Type Filter
      if (selectedSkinType !== 'all' && !p.skinTypes.includes('all') && !p.skinTypes.includes(selectedSkinType as SkinType)) {
        return false;
      }
      // Brand Filter
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) {
        return false;
      }
      // Search Query Filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q) || p.nameKm.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q) || p.descriptionKm.toLowerCase().includes(q);
        const matchesIng = p.ingredients.toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesDesc && !matchesIng) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.priceUsd - b.priceUsd;
      if (sortBy === 'price-high') return b.priceUsd - a.priceUsd;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // default featured
    });
  }, [selectedCategory, selectedSkinConcern, selectedSkinType, selectedBrand, searchQuery, sortBy]);

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

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
      );
    }
  };

  const handleRemoveFromCart = (productId: string) => {
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
    } else {
      setCart([]);
      setCompletedOrder({ ...newOrder, paymentStatus: 'pending' });
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
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased flex flex-col selection:bg-emerald-600 selection:text-white">
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
        onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
        onOpenFaceScan={() => setIsFaceScanOpen(true)}
        language={language}
        setLanguage={setLanguage}
        totalUsd={cartSubtotalUsd}
        currentPage={currentPage}
        onNavigateToHome={navigateToHome}
        onNavigateToProducts={navigateToProducts}
      />

      {/* Main App Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pt-1.5 sm:pt-2 pb-6">
        {currentPage === 'products' ? (
          <ProductsPage
            products={filteredProducts}
            totalProductCount={PRODUCTS.length}
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
        ) : (
          <>
            {/* Promotional Hero Banner */}
            <HeroBanner
              language={language}
              onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
              onOpenFaceScan={() => setIsFaceScanOpen(true)}
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

            {/* Featured Product Collection Section */}
            <div id="products-section" className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-emerald-600/20 shadow-sm my-6 scroll-mt-28">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-8 bg-emerald-600 rounded-full" />
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-opensans">
                      {language === 'km' ? 'ផលិតផលពេញនិយម' : language === 'zh' ? '热门推荐商品' : 'Featured Products'}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {language === 'km' ? 'ជ្រើសរើសផលិតផលល្អបំផុតសម្រាប់ស្បែកមុខអ្នក' : 'Best skincare choices for your skin'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={navigateToProducts}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
                >
                  <span>{language === 'km' ? 'មើលផលិតផលទាំងអស់ (' + PRODUCTS.length + ')' : language === 'zh' ? '查看所有商品' : 'View All Products (' + PRODUCTS.length + ')'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.slice(0, 8).map((prod) => (
                  <ProductCard
                    key={prod.id}
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

              <div className="mt-6 text-center pt-4 border-t border-slate-100">
                <button
                  onClick={navigateToProducts}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <span>{language === 'km' ? 'ចូលទៅកាន់ទំព័រផលិតផលទាំងអស់ →' : language === 'zh' ? '进入所有商品页面 →' : 'Go to All Products Page →'}</span>
                </button>
              </div>
            </div>

            {/* Educational Skincare Tips */}
            <BeautyTipsSection language={language} />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer language={language} />

      {/* Overlays, Drawers & Modals */}
      <ProductDetailModal
        product={quickViewProduct}
        language={language}
        isWishlisted={quickViewProduct ? wishlist.some((p) => p.id === quickViewProduct.id) : false}
        onClose={() => handleQuickViewWithUrl(null)}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={(p, qty) => handleAddToCart(p, qty)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        language={language}
        items={cart}
        onClose={() => setIsCartOpen(false)}
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
        onClose={() => setActiveKHQROrder(null)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <OrderSuccessModal
        order={completedOrder}
        language={language}
        onClose={() => setCompletedOrder(null)}
      />

      <AISkincareAdvisorModal
        isOpen={isAiAdvisorOpen}
        language={language}
        onClose={() => setIsAiAdvisorOpen(false)}
        onAddMultipleToCart={handleAddMultipleToCart}
      />

      <FaceScanModal
        isOpen={isFaceScanOpen}
        language={language}
        onClose={() => setIsFaceScanOpen(false)}
        onAddToCart={(p) => handleAddToCart(p, 1)}
      />

      <ChatBotWidget
        language={language}
        onSelectProduct={(product) => handleQuickViewWithUrl(product)}
      />
    </div>
  );
}

