import React from 'react';
import { Heart, ShoppingBag, Eye, Check } from 'lucide-react';
import { Product, Language } from '../types';

interface ProductCardProps {
  product: Product;
  language: Language;
  isWishlisted: boolean;
  onToggleWishlist: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  onQuickView: (p: Product) => void;
  isInCart: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  language,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onQuickView,
  isInCart,
}) => {
  const displayImage =
    language === 'zh' && product.imageZh
      ? product.imageZh
      : language === 'en' && product.imageEn
      ? product.imageEn
      : language === 'km' && product.imageKm
      ? product.imageKm
      : product.image;

  return (
    <div className="group bg-white rounded-2xl border border-[#2E8B57]/20 hover:border-[#2E8B57] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Product Image & Badges */}
      <div className="relative aspect-square overflow-hidden bg-white cursor-pointer" onClick={() => onQuickView(product)}>
        <img
          src={displayImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800';
          }}
        />

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full border transition shadow-xs cursor-pointer ${
            isWishlisted
              ? 'bg-[#2E8B57] text-[#FFFFFF] border-[#2E8B57]'
              : 'bg-[#E5E5E5] text-[#FFFFFF] border-[#E5E5E5] hover:opacity-90'
          }`}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          {product.isPromotion && (
            <span className="px-2 py-0.5 bg-[#E11D48] text-[#FFFFFF] text-[10px] font-black rounded-md uppercase tracking-wider shadow-xs flex items-center gap-1">
              <span>🎁 {language === 'km' ? 'Promotion ពិសេស' : language === 'zh' ? '特惠活动' : 'Promotion'}</span>
            </span>
          )}
          {product.originalPriceUsd && product.originalPriceUsd > product.priceUsd && (
            <span className="px-2 py-0.5 bg-[#FF7F50] text-[#FFFFFF] text-[10px] font-black rounded-md uppercase tracking-wider shadow-xs">
              {language === 'km' ? `ចុះ ${Math.round(((product.originalPriceUsd - product.priceUsd) / product.originalPriceUsd) * 100)}%` : `-${Math.round(((product.originalPriceUsd - product.priceUsd) / product.originalPriceUsd) * 100)}%`}
            </span>
          )}
          {product.isFreeShipping && (
            <span className="px-2 py-0.5 bg-[#2E8B57] text-[#FFFFFF] text-[10px] font-bold rounded-md uppercase tracking-wider shadow-xs flex items-center gap-1">
              <span>🚚 {language === 'km' ? 'Free ដឹក' : language === 'zh' ? '包邮' : 'Free Ship'}</span>
            </span>
          )}
          {product.isBestSeller && !product.isFreeShipping && (
            <span className="px-2 py-0.5 bg-[#2E8B57] text-[#FFFFFF] text-[10px] font-bold rounded-md uppercase tracking-wider shadow-xs">
              {language === 'km' ? 'លក់ដាច់បំផុត' : language === 'zh' ? '热销爆款' : 'Best Seller'}
            </span>
          )}
          {product.isNew && !product.isBestSeller && (
            <span className="px-2 py-0.5 bg-[#2E8B57] text-[#FFFFFF] text-[10px] font-bold rounded-md uppercase tracking-wider shadow-xs">
              {language === 'km' ? 'ថ្មី' : language === 'zh' ? '新品' : 'NEW'}
            </span>
          )}
        </div>

        {/* Quick View Hover Button */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="px-3 py-1.5 bg-white hover:bg-[#2E8B57] text-[#2E8B57] hover:text-white border border-[#2E8B57]/30 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'មើលលម្អិត' : language === 'zh' ? '快速预览' : 'Quick View'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Product Title - On white background: #2E8B57 */}
          <h3
            onClick={() => onQuickView(product)}
            className="text-sm font-bold text-[#2E8B57] line-clamp-2 hover:opacity-80 transition cursor-pointer leading-snug"
            title={language === 'km' ? product.nameKm : language === 'zh' ? (product.nameZh || product.name) : product.name}
          >
            {language === 'km' ? product.nameKm : language === 'zh' ? (product.nameZh || product.name) : product.name}
          </h3>
        </div>

        {/* Price & Add to Cart - All text on white: #2E8B57 */}
        <div className="pt-2 border-t border-[#2E8B57]/15 flex items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-extrabold text-[#2E8B57]">
                ${product.priceUsd.toFixed(2)}
              </span>
              {product.originalPriceUsd && product.originalPriceUsd > product.priceUsd && (
                <span className="text-xs text-[#2E8B57]/60 line-through font-normal">
                  ${product.originalPriceUsd.toFixed(2)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#2E8B57] font-medium">
              ៛{product.priceKhr.toLocaleString()}
            </p>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => onAddToCart(product)}
            className="p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center transition cursor-pointer shadow-xs bg-[#2E8B57] text-[#FFFFFF] hover:bg-[#257347]"
            title={language === 'km' ? 'បន្ថែមក្នុងកន្ត្រក' : 'Add to Cart'}
          >
            {isInCart ? (
              <Check className="w-4 h-4" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
