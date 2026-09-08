import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Heart,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Check,
  Sparkles,
  Video,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Info,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Store,
  Zap,
  Clock,
  Camera,
  MessageSquare,
  Plus
} from 'lucide-react';
import { Product, Language } from '../types';
import { useAuth } from '../context/AuthContext';

interface ProductReview {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
  photos?: string[];
  userAvatar?: string;
}

interface ProductDetailModalProps {
  product: Product | null;
  language: Language;
  isWishlisted: boolean;
  onClose: () => void;
  onToggleWishlist: (p: Product) => void;
  onAddToCart: (p: Product, quantity: number) => void;
  onBuyNow?: (p: Product, quantity: number) => void;
  onOpenChat?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  language,
  isWishlisted,
  onClose,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onOpenChat,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  // Product reviews state
  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    if (!product?.id) return [];
    try {
      const saved = localStorage.getItem(`lumimei_product_reviews_${product.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showWriteForm, setShowWriteForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);

  useEffect(() => {
    setActiveImageIndex(0);
    setQuantity(1);
    if (product?.id) {
      try {
        const saved = localStorage.getItem(`lumimei_product_reviews_${product.id}`);
        setReviews(saved ? JSON.parse(saved) : []);
      } catch {
        setReviews([]);
      }
    }
    setShowWriteForm(false);
    setSubmittedSuccess(false);
    setNewComment('');
    setNewRating(0);
    setNewPhotos([]);
  }, [product?.id]);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !product?.id) return;

    const reviewerName =
      userProfile?.fullName ||
      userProfile?.displayName ||
      currentUser?.displayName ||
      currentUser?.phoneNumber ||
      currentUser?.email ||
      (language === 'km' ? 'អតិថិជន Lumimei' : 'Lumimei Customer');

    const newReviewItem: ProductReview = {
      id: Date.now().toString(),
      name: reviewerName,
      rating: newRating || 5,
      date: language === 'km' ? 'ទើបតែបន្ថែម' : 'Just now',
      comment: newComment.trim(),
      photos: [...newPhotos],
      userAvatar: userProfile?.photoURL || currentUser?.photoURL || undefined,
    };

    const updatedReviews = [newReviewItem, ...reviews];
    setReviews(updatedReviews);
    try {
      localStorage.setItem(`lumimei_product_reviews_${product.id}`, JSON.stringify(updatedReviews));
    } catch (err) {
      console.error('Failed to save review to localStorage', err);
    }

    setSubmittedSuccess(true);
    setNewComment('');
    setNewRating(0);
    setNewPhotos([]);
    setTimeout(() => {
      setShowWriteForm(false);
      setSubmittedSuccess(false);
    }, 1800);
  };

  if (!product) return null;

  // Build complete media gallery (strictly preserving custom image order)
  const galleryImages: string[] = [];
  if (product.gallery && product.gallery.length > 0) {
    product.gallery.forEach((img) => {
      if (img && !galleryImages.includes(img)) {
        galleryImages.push(img);
      }
    });
  } else if (product.image) {
    galleryImages.push(product.image);
  }

  const totalMediaCount = galleryImages.length;
  const currentMedia = galleryImages[activeImageIndex] || product.image;

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : totalMediaCount - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev < totalMediaCount - 1 ? prev + 1 : 0));
  };

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNowAction = () => {
    if (onBuyNow) {
      onBuyNow(product, quantity);
    } else {
      onAddToCart(product, quantity);
    }
  };

  const handleCustomerService = () => {
    if (onOpenChat) {
      onOpenChat();
    } else {
      window.open('https://t.me/lumimei_cambodia', '_blank');
    }
  };

  // Discount percentage calculation
  const discountPercent = product.originalPriceUsd
    ? Math.round((1 - product.priceUsd / product.originalPriceUsd) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-fade-in overflow-hidden">
      {/* Container - Pinduoduo E-Commerce Full-Screen / Modal Card */}
      <div className="relative w-full max-w-lg md:max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden h-[94vh] sm:h-[90vh] flex flex-col my-0 sm:my-auto">
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-24">
          
          {/* 1. Hero Product Image Gallery Header (Strict 1:1 Square Aspect Ratio) */}
          <div className="relative w-full aspect-square bg-slate-100 flex items-center justify-center overflow-hidden group">
            
            {/* Top Floating Overlay Controls */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
              <button
                onClick={onClose}
                className="pointer-events-auto p-2 bg-black/40 hover:bg-black/60 text-white rounded-full shadow-lg backdrop-blur-md transition cursor-pointer"
                title={language === 'km' ? 'បិទ' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => onToggleWishlist(product)}
                className="pointer-events-auto p-2 bg-black/40 hover:bg-black/60 text-white rounded-full shadow-lg backdrop-blur-md transition cursor-pointer"
                title={language === 'km' ? 'ចូលចិត្ត' : 'Favorite'}
              >
                <Heart
                  className={`w-5 h-5 transition ${
                    isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-white'
                  }`}
                />
              </button>
            </div>

            {/* Main Image */}
            {currentMedia ? (
              <img
                src={currentMedia}
                alt={product.name}
                className="w-full h-full object-contain select-none p-2"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800';
                }}
              />
            ) : (
              <div className="text-slate-400 text-sm">{product.name}</div>
            )}

            {/* Next / Prev Navigation Arrows (if multiple images) */}
            {totalMediaCount > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-xs transition opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-xs transition opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Image Counter Badge e.g. "1/3" */}
            <div className="absolute bottom-3 right-3 z-10 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md tracking-wider">
              {activeImageIndex + 1} / {totalMediaCount}
            </div>

            {/* Best Seller or Special Badge overlay */}
            {product.isBestSeller && (
              <div className="absolute bottom-3 left-3 z-10 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
                <Zap className="w-3 h-3 fill-white" />
                <span>{language === 'km' ? 'លក់ដាច់ខ្លាំង' : 'Best Seller'}</span>
              </div>
            )}
          </div>



          {/* 2. High-Impact Price & Flash Sale Banner (Green Theme) */}
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white p-3.5 sm:p-4 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  ${product.priceUsd.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-emerald-100">
                  ៛{product.priceKhr.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Main Info Padding Wrapper */}
          <div className="p-4 space-y-4">
            
            {/* 3. Product Title & Specifications */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 font-opensans leading-snug">
                  {language === 'km'
                    ? product.nameKm
                    : language === 'zh'
                    ? product.nameZh || product.name
                    : product.name}
                </h1>
              </div>

              {/* Specs Pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                  {language === 'km' ? 'ទម្ងន់/ទំហំ' : 'Volume'}: {product.volume}
                </span>
              </div>
            </div>

            {/* 4. Promotion & Service Guarantee Cards (Green Theme) */}
            <div className="bg-emerald-50/80 rounded-2xl border border-emerald-200/80 p-3 space-y-2 text-xs">
              <div className="flex flex-col gap-2 text-slate-700">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold text-emerald-800">
                    {product.isFreeShipping
                      ? language === 'km'
                        ? '🎉 ទំនិញនេះ Free ដឹកជញ្ជូន (Free Shipping)'
                        : language === 'zh'
                        ? '🎉 本商品包邮免运费'
                        : '🎉 Free Shipping on this item'
                      : language === 'km'
                      ? 'ទិញអស់ 25$ Free ដឹក'
                      : language === 'zh'
                      ? '满 $25 免运费'
                      : 'Free Shipping on $25+'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{language === 'km' ? 'ផលិតផលខ្មែរ ធម្មជាតិសុទ្ធ ១០០% មិនមានជាតិបក់ជាតិកាត់' : '100% Cambodian Natural Authentic'}</span>
                </div>
              </div>
            </div>

            {/* 5. Tabs Navigation */}
            <div className="border-b border-slate-200 pt-2 flex items-center gap-4 text-xs font-bold">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-2.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'details'
                    ? 'border-emerald-600 text-emerald-700 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {language === 'km'
                  ? 'ព័ត៌មានលម្អិតទាំងអស់'
                  : language === 'zh'
                  ? '全部详细信息'
                  : 'All Details'}
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-2.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'reviews'
                    ? 'border-emerald-600 text-emerald-700 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{language === 'km' ? 'ការវាយតម្លៃ' : language === 'zh' ? '评价' : 'Reviews'}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full font-black">
                  {reviews.length}
                </span>
              </button>
            </div>

            {/* 6. Tab Content */}
            {activeTab === 'details' && (
              <div className="space-y-4 text-xs leading-relaxed text-slate-700 pt-1">
                {/* Description Cards (if available) */}
                {product.descriptionCards && product.descriptionCards.filter((c) => c.image || c.caption).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs sm:text-sm">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>{language === 'km' ? 'ការពិពណ៌នាផលិតផល' : 'Product Details & Gallery'}</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {product.descriptionCards
                        .filter((c) => c.image || c.caption)
                        .map((card, idx) => (
                          <div
                            key={card.id || idx}
                            className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:border-emerald-500/50 transition duration-200"
                          >
                            {card.image && (
                              <div className="w-full bg-slate-50 flex items-center justify-center p-2 rounded-t-2xl">
                                <img
                                  src={card.image}
                                  alt={card.caption || `Card ${idx + 1}`}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800';
                                  }}
                                  className="w-full h-auto max-h-[500px] object-contain rounded-xl hover:scale-[1.01] transition duration-300"
                                />
                              </div>
                            )}
                            {card.caption && (
                              <div className="p-3 bg-white border-t border-slate-100">
                                <p className="text-xs text-slate-800 font-battambang leading-relaxed">
                                  {card.caption}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Main Text Description if no cards or cards text is empty */}
                {(!product.descriptionCards || product.descriptionCards.length === 0) && (
                  <p className="text-slate-800 text-xs sm:text-sm leading-relaxed">
                    {language === 'km'
                      ? product.descriptionKm
                      : language === 'zh'
                      ? product.descriptionZh || product.description
                      : product.description}
                  </p>
                )}

                {/* Benefits List */}
                {product.benefitsKm && product.benefitsKm.length > 0 && (
                  <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100 space-y-2">
                    <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      {language === 'km' ? 'អត្ថប្រយោជន៍ពិសេស' : 'Key Benefits'}
                    </h4>
                    <ul className="space-y-1.5 pl-1">
                      {product.benefitsKm.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}



                {/* How to Use Section */}
                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                  <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {language === 'km' ? 'របៀបប្រើប្រាស់' : 'How to Use'}
                  </h4>
                  <div className="whitespace-pre-line text-slate-700 leading-relaxed font-medium">
                    {language === 'km' ? product.howToUseKm : product.howToUse}
                  </div>
                </div>

                {/* Video Link if available */}
                {product.videoUrl && (
                  <a
                    href={product.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 bg-red-50 hover:bg-red-100/80 border border-red-200 rounded-xl text-red-700 font-medium transition group"
                  >
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
                      <span>
                        {language === 'km'
                          ? 'ទស្សនាវីដេអូរបៀបប្រើប្រាស់ (YouTube Shorts)'
                          : 'Watch Video Tutorial'}
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-red-500" />
                  </a>
                )}

                {/* Suitable For */}
                {product.suitableForKm && (
                  <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/60 space-y-1.5">
                    <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {language === 'km' ? 'សាកសមសម្រាប់' : 'Suitable For'}
                    </h4>
                    <ul className="space-y-1 pl-1 text-slate-700">
                      {product.suitableForKm.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Who Can Use */}
                {product.whoCanUseKm && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-teal-600" />
                      {language === 'km' ? 'អ្នកណាអាចប្រើប្រាស់បាន' : 'Who Can Use'}
                    </h4>
                    <ul className="space-y-1 pl-1 text-slate-700">
                      {product.whoCanUseKm.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Not Suitable For */}
                {(product.notSuitableForKm || product.whoCannotUseKm) && (
                  <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-1.5">
                    <h4 className="font-bold text-rose-800 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      {language === 'km' ? 'មិនសាកសម / មិនអាចប្រើបាន' : 'Not Suitable For'}
                    </h4>
                    <ul className="space-y-1 pl-1 text-slate-700">
                      {product.notSuitableForKm?.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                      {product.whoCannotUseKm?.map((item, i) => (
                        <li key={`cannot_${i}`} className="flex items-start gap-1.5 font-semibold text-rose-700">
                          <XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Safety & Storage */}
                {product.newUserGuideKm && (
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-1.5">
                    <h4 className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      {language === 'km'
                        ? 'ចំណាំសំខាន់សម្រាប់អ្នកប្រើប្រាស់ដំបូង'
                        : 'Notice for New Users'}
                    </h4>
                    <p className="text-amber-900 whitespace-pre-line leading-relaxed font-medium">
                      {product.newUserGuideKm}
                    </p>
                  </div>
                )}

                {/* Storage */}
                {product.storageKm && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      {language === 'km' ? 'ការរក្សាទុក' : 'Storage Instructions'}
                    </h4>
                    <ul className="space-y-1 pl-1 text-slate-700">
                      {product.storageKm.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Precautions */}
                {product.precautionsKm && (
                  <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-1.5">
                    <h4 className="font-bold text-rose-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      {language === 'km' ? 'ប្រុងប្រយ័ត្នការប្រើប្រាស់' : 'Precautions'}
                    </h4>
                    <ul className="space-y-1 pl-1 text-slate-700">
                      {product.precautionsKm.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Reviews */}
            {activeTab === 'reviews' && (
              <div className="space-y-4 pt-1 pb-16">
                {/* Overall Rating & Write Review Action Banner */}
                <div className="bg-gradient-to-r from-amber-50 via-emerald-50 to-teal-50 p-3.5 rounded-2xl border border-amber-200/70 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-black text-slate-800">
                      5.0 <span className="text-[10px] font-normal text-slate-500">({reviews.length})</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWriteForm(!showWriteForm);
                      setSubmittedSuccess(false);
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'km' ? 'សរសេរការវាយតម្លៃ' : '+ Write Review'}</span>
                  </button>
                </div>

                {/* Write Review Form */}
                {showWriteForm && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        <span>{language === 'km' ? 'ចែករំលែកបទពិសោធន៍របស់អ្នក' : 'Share Your Experience'}</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowWriteForm(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {submittedSuccess ? (
                      <div className="p-3.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>
                          {language === 'km'
                            ? 'អរគុណសម្រាប់ការវាយតម្លៃ! មតិរបស់អ្នកត្រូវបានរក្សាទុក។'
                            : 'Thank you for your feedback! Review saved.'}
                        </span>
                      </div>
                    ) : (
                      <form onSubmit={handleReviewSubmit} className="space-y-3">
                        {/* Customer Account Profile Card */}
                        <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200">
                          {userProfile?.photoURL || currentUser?.photoURL ? (
                            <img
                              src={userProfile?.photoURL || currentUser?.photoURL}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-emerald-300 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
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

                        {/* Star Rating Picker */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            {language === 'km' ? 'ពិន្ទុផ្កាយ' : 'Star Rating'}
                          </label>
                          <div
                            className="flex items-center gap-1 p-1.5 bg-white rounded-xl border border-slate-200 w-fit"
                            onMouseLeave={() => setHoveredRating(0)}
                          >
                            {[1, 2, 3, 4, 5].map((star) => {
                              const active = hoveredRating || newRating;
                              const isFilled = active > 0 && star <= active;
                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setNewRating(star)}
                                  onMouseEnter={() => setHoveredRating(star)}
                                  className="p-1 cursor-pointer hover:scale-125 focus:scale-125 transition-transform duration-150 active:scale-95"
                                  title={`${star} ${language === 'km' ? 'ផ្កាយ' : 'Stars'}`}
                                >
                                  <Star
                                    className={`w-5 h-5 transition-colors duration-150 ${
                                      isFilled
                                        ? 'fill-amber-400 text-amber-500'
                                        : 'text-slate-300 hover:text-amber-300'
                                    }`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Review Comment Textarea */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            {language === 'km' ? 'មតិយោបល់របស់អ្នក' : 'Your Review'}
                          </label>
                          <textarea
                            rows={3}
                            required
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={
                              language === 'km'
                                ? 'សរសេរការវាយតម្លៃរបស់អ្នកអំពីផលិតផលនេះ...'
                                : 'Write your review about this product...'
                            }
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 resize-none font-medium text-slate-800"
                          />
                        </div>

                        {/* Photo Upload Section (Up to 5 Photos) */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              {language === 'km' ? 'រូបភាពផលិតផល (អតិបរមា 5 រូប)' : 'Upload Photos (Max 5)'}
                            </label>
                            <span className="text-[10px] text-emerald-700 font-bold">
                              {newPhotos.length}/5 {language === 'km' ? 'រូបភាព' : 'Photos'}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 items-center">
                            {newPhotos.map((imgSrc, idx) => (
                              <div
                                key={idx}
                                className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 group shrink-0 bg-white shadow-2xs"
                              >
                                <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setNewPhotos(newPhotos.filter((_, i) => i !== idx))}
                                  className="absolute top-0.5 right-0.5 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 transition shadow-xs cursor-pointer"
                                  title={language === 'km' ? 'លុបរូបភាព' : 'Remove Photo'}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}

                            {newPhotos.length < 5 && (
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
                                    const remaining = 5 - newPhotos.length;
                                    if (remaining <= 0) return;
                                    const fileArray: File[] = (Array.from(files) as File[]).slice(0, remaining);
                                    fileArray.forEach((file: File) => {
                                      const reader = new FileReader();
                                      reader.onload = (uploadEvt) => {
                                        if (uploadEvt.target?.result) {
                                          setNewPhotos((prev) =>
                                            [...prev, uploadEvt.target!.result as string].slice(0, 5)
                                          );
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

                        {/* Submit Button */}
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowWriteForm(false)}
                            className="px-3 py-2 border border-slate-300 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100 transition cursor-pointer"
                          >
                            {language === 'km' ? 'បោះបង់' : 'Cancel'}
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{language === 'km' ? 'បញ្ជូនការវាយតម្លៃ' : 'Submit Review'}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Reviews List */}
                {reviews.length > 0 ? (
                  <div className="space-y-3">
                    {reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {rev.userAvatar ? (
                              <img
                                src={rev.userAvatar}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover border border-emerald-200 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                                {rev.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900">{rev.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400">{rev.date}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[...Array(5)].map((_, idx) => (
                              <Star
                                key={idx}
                                className={`w-3.5 h-3.5 ${
                                  idx < rev.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-slate-200 text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Comment text */}
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {rev.comment}
                        </p>

                        {/* Attached Photos Grid */}
                        {rev.photos && rev.photos.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {rev.photos.map((photo, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => setZoomPhoto(photo)}
                                className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 transition cursor-pointer shadow-2xs group"
                              >
                                <img
                                  src={photo}
                                  alt="Review attachment"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  !showWriteForm && (
                    <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs">
                          {language === 'km'
                            ? 'មិនទាន់មានការវាយតម្លៃទេ សម្រាប់ផលិតផលនេះ'
                            : 'No reviews yet for this product'}
                        </p>
                        <p className="font-medium text-slate-500 text-[11px] mt-1">
                          {language === 'km'
                            ? 'សូមចែករំលែកបទពិសោធន៍របស់អ្នក និងរូបភាពផលិតផល ដើម្បីជួយដល់អតិថិជនដទៃទៀត!'
                            : 'Share your feedback and photos to help other customers!'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowWriteForm(true)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>
                          {language === 'km'
                            ? 'សរសេរការវាយតម្លៃ & ដាក់រូបភាព'
                            : 'Write Review & Upload Photos'}
                        </span>
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Photo Zoom Lightbox Modal */}
        {zoomPhoto && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setZoomPhoto(null)}
          >
            <div className="relative max-w-lg w-full max-h-[85vh] flex flex-col items-center">
              <button
                type="button"
                onClick={() => setZoomPhoto(null)}
                className="absolute -top-10 right-0 text-white p-2 hover:opacity-80 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={zoomPhoto}
                alt="Enlarged review photo"
                className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

        {/* 7. FIXED BOTTOM BUYING BAR (E-Commerce Sticky CTA Bar) */}
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200/90 p-2 sm:p-3 shadow-[0_-4px_25px_rgba(0,0,0,0.12)] flex items-center justify-between gap-2">
          
          {/* Quick Action Icons Left */}
          <div className="flex items-center gap-2 sm:gap-3 px-1">
            {/* Store Button */}
            <button
              onClick={onClose}
              className="flex flex-col items-center justify-center text-slate-600 hover:text-emerald-600 cursor-pointer transition"
              title={language === 'km' ? 'ហាង' : 'Store'}
            >
              <Store className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] font-bold mt-0.5">
                {language === 'km' ? 'ហាង' : 'Store'}
              </span>
            </button>

            {/* Wishlist Button */}
            <button
              onClick={() => onToggleWishlist(product)}
              className="flex flex-col items-center justify-center text-slate-600 hover:text-rose-500 cursor-pointer transition"
              title={language === 'km' ? 'ចូលចិត្ត' : 'Favorite'}
            >
              <Heart
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  isWishlisted ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
              <span className="text-[10px] font-bold mt-0.5">
                {language === 'km' ? 'ចូលចិត្ត' : 'Favorite'}
              </span>
            </button>

            {/* Customer Service / Chat */}
            <button
              onClick={handleCustomerService}
              className="flex flex-col items-center justify-center text-slate-600 hover:text-teal-600 cursor-pointer transition"
              title={language === 'km' ? 'សេវាអតិថិជន' : 'CS Chat'}
            >
              <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
              <span className="text-[10px] font-bold mt-0.5">
                {language === 'km' ? 'សេវាកម្ម' : 'CS'}
              </span>
            </button>
          </div>

          {/* Quantity Counter */}
          <div className="hidden min-[380px]:flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex-shrink-0">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-black text-xs transition cursor-pointer"
            >
              -
            </button>
            <span className="px-2 py-1 text-xs font-bold text-slate-800">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-black text-xs transition cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Dual Main CTA Buttons Right */}
          <div className="flex items-center gap-1.5 flex-1 max-w-[280px]">
            {/* Add to Cart Button */}
            <button
              onClick={handleAdd}
              className={`flex-1 py-2.5 px-2 sm:px-3 rounded-xl font-bold text-xs text-white shadow-xs transition flex flex-col items-center justify-center cursor-pointer ${
                added
                  ? 'bg-emerald-600'
                  : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 active:scale-98'
              }`}
            >
              {added ? (
                <div className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'km' ? 'បានបន្ថែម!' : 'Added!'}</span>
                </div>
              ) : (
                <>
                  <span className="leading-none text-[11px] sm:text-xs font-black">
                    {language === 'km' ? 'ដាក់ចូលកន្ត្រក' : 'Add to Cart'}
                  </span>
                  <span className="text-[9px] opacity-95 font-semibold mt-0.5">
                    ${(product.priceUsd * quantity).toFixed(2)}
                  </span>
                </>
              )}
            </button>

            {/* Buy Now Button */}
            <button
              onClick={handleBuyNowAction}
              className="flex-1 py-2.5 px-2 sm:px-3 rounded-xl font-extrabold text-xs text-white bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 shadow-md transition flex flex-col items-center justify-center active:scale-98 cursor-pointer"
            >
              <span className="leading-none text-[11px] sm:text-xs font-black">
                {language === 'km' ? 'ទិញឥឡូវនេះ' : 'Buy Now'}
              </span>
              <span className="text-[9px] opacity-95 font-semibold mt-0.5">
                {language === 'km' ? 'ទូទាត់ភ្លាមៗ' : 'Instant Checkout'}
              </span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};


