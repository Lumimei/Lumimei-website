import React, { useState } from 'react';
import { X, Star, Heart, ShoppingBag, ShieldCheck, Truck, Check, Sparkles, Video, AlertTriangle, CheckCircle2, XCircle, ShieldAlert, Info, ExternalLink } from 'lucide-react';
import { Product, Language } from '../types';
import { SAMPLE_REVIEWS } from '../data/products';

interface ProductDetailModalProps {
  product: Product | null;
  language: Language;
  isWishlisted: boolean;
  onClose: () => void;
  onToggleWishlist: (p: Product) => void;
  onAddToCart: (p: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  language,
  isWishlisted,
  onClose,
  onToggleWishlist,
  onAddToCart,
}) => {
  if (!product) return null;

  const [selectedImg, setSelectedImg] = useState<string>(product.image);
  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  const galleryImages = product.gallery && product.gallery.length > 0
    ? [product.image, ...product.gallery]
    : [product.image];

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white text-slate-700 rounded-full shadow-md transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Images */}
        <div className="w-full md:w-1/2 p-6 bg-emerald-50/40 flex flex-col items-center justify-between">
          <div className="w-full aspect-square rounded-2xl overflow-hidden border border-emerald-100 shadow-xs bg-white mb-4">
            <img
              src={selectedImg}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto p-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(img)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                    selectedImg === img ? 'border-emerald-600 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="w-full grid grid-cols-2 gap-2 mt-4 text-xs text-slate-600 border-t border-emerald-100 pt-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{product.madeInKm || (language === 'km' ? 'ផលិតផលសុទ្ធ 100%' : '100% Authentic')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-teal-600" />
              <span>{language === 'km' ? 'ដឹកជញ្ជូនលឿន ២៤ ខេត្ត/ក្រុង' : 'Fast Delivery'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Info & Actions */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto max-h-[78vh] md:max-h-none">
          <div className="space-y-4">
            {/* Title & Badges in same row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-opensans leading-tight">
                {language === 'km' ? product.nameKm : language === 'zh' ? (product.nameZh || product.name) : product.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
                  {product.brand}
                </span>
                {product.madeInKm && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {product.madeInKm}
                  </span>
                )}
                <span className="text-xs text-slate-500 font-medium">
                  {language === 'km' ? 'ទំហំ' : 'Volume'}: {product.volume}
                </span>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating) ? 'fill-current' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-slate-800">{product.rating}</span>
              <span className="text-slate-400">({product.reviewCount} {language === 'km' ? 'ការវាយតម្លៃ' : 'reviews'})</span>
            </div>

            {/* Price Box */}
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-700">
                    ${product.priceUsd.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  ៛{product.priceKhr.toLocaleString()}
                </p>
              </div>


            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-emerald-100 gap-3 text-xs font-semibold overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-2 whitespace-nowrap border-b-2 transition cursor-pointer ${
                  activeTab === 'details'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {language === 'km' ? 'ព័ត៌មានលម្អិតទាំងអស់' : language === 'zh' ? '全部详细信息' : 'All Details'}
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-2 whitespace-nowrap border-b-2 transition cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {language === 'km' ? 'ការវាយតម្លៃ' : 'Reviews'} ({SAMPLE_REVIEWS.length})
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
              <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                {/* Description */}
                <p>{language === 'km' ? product.descriptionKm : language === 'zh' ? (product.descriptionZh || product.description) : product.description}</p>

                {/* Benefits List */}
                {product.benefitsKm && product.benefitsKm.length > 0 && (
                  <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100 space-y-2">
                    <h4 className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      {language === 'km' ? 'អត្ថប្រយោជន៍ពិសេស Lumimei Clay Mask' : 'Key Benefits'}
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

                {/* Key Ingredients */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    {language === 'km' ? 'គ្រឿងផ្សំធម្មជាតិ' : 'Natural Ingredients'}:
                  </h4>
                  <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium text-[11px] text-slate-700">
                    {product.ingredients}
                  </p>
                </div>

                {/* How to Use Section */}
                <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
                  <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {language === 'km' ? 'របៀបប្រើប្រាស់' : 'How to Use'}
                  </h4>
                  <div className="whitespace-pre-line text-slate-700 leading-relaxed font-medium">
                    {language === 'km' ? product.howToUseKm : product.howToUse}
                  </div>
                </div>

                {/* Video Link */}
                {product.videoUrl && (
                  <a
                    href={product.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 bg-red-50 hover:bg-red-100/80 border border-red-200 rounded-xl text-red-700 font-medium transition group"
                  >
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
                      <span>{language === 'km' ? 'ទស្សនាវីដេអូរបៀបប្រើប្រាស់ (YouTube Shorts)' : 'Watch Video Tutorial'}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-red-500" />
                  </a>
                )}

                {/* Suitable For / Target Section */}
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

                {/* Not Suitable For / Who Cannot Use */}
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

                {/* Safety & Storage Section */}
                {product.newUserGuideKm && (
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-1.5">
                    <h4 className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      {language === 'km' ? 'ចំណាំសំខាន់សម្រាប់អ្នកប្រើប្រាស់ដំបូង' : 'Notice for New Users'}
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

            {activeTab === 'reviews' && (
              <div className="space-y-3 text-xs">
                {SAMPLE_REVIEWS.map((rev) => (
                  <div key={rev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{rev.userName}</span>
                      <span className="text-[10px] text-slate-400">{rev.date}</span>
                    </div>
                    <div className="flex text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                    <p className="text-slate-600">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Controls: Quantity & Add to Cart */}
          <div className="pt-4 border-t border-emerald-100 mt-6 space-y-3">
            <div className="flex items-center justify-between gap-4">
              {/* Quantity Counter */}
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-200 font-bold transition"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-bold text-slate-800">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-200 font-bold transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart CTA */}
            <button
              onClick={handleAdd}
              className={`w-full py-3 rounded-2xl font-bold text-sm text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                added ? 'bg-teal-600' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>{language === 'km' ? 'បានបន្ថែមក្នុងកន្ត្រក!' : language === 'zh' ? '已加入购物车！' : 'Added to Cart!'}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  <span>
                    {language === 'km'
                      ? `បន្ថែមក្នុងកន្ត្រក • $${(product.priceUsd * quantity).toFixed(2)}`
                      : language === 'zh'
                      ? `加入购物车 • $${(product.priceUsd * quantity).toFixed(2)}`
                      : `Add to Cart • $${(product.priceUsd * quantity).toFixed(2)}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

