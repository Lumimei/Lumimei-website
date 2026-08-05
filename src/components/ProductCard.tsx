import React from 'react';
import { Star, Heart, ShoppingBag, Eye, Check } from 'lucide-react';
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
  return (
    <div className="group bg-white rounded-2xl border border-emerald-100 hover:border-emerald-300 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Product Image & Badges */}
      <div className="relative aspect-square overflow-hidden bg-emerald-50/30 cursor-pointer" onClick={() => onQuickView(product)}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition shadow-xs cursor-pointer ${
            isWishlisted
              ? 'bg-emerald-600 text-white'
              : 'bg-white/80 text-slate-600 hover:text-emerald-700 hover:bg-white'
          }`}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          {product.isBestSeller && (
            <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-md uppercase tracking-wider shadow-xs">
              {language === 'km' ? 'លក់ដាច់បំផុត' : language === 'zh' ? '热销爆款' : 'Best Seller'}
            </span>
          )}
          {product.isNew && (
            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider shadow-xs">
              {language === 'km' ? 'ថ្មី' : language === 'zh' ? '新品' : 'NEW'}
            </span>
          )}
        </div>

        {/* Quick View Hover Button */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-900 text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'km' ? 'មើលលម្អិត' : language === 'zh' ? '快速预览' : 'Quick View'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Product Title */}
          <h3
            onClick={() => onQuickView(product)}
            className="text-sm font-bold text-slate-800 line-clamp-2 hover:text-emerald-700 transition cursor-pointer leading-snug"
            title={language === 'km' ? product.nameKm : language === 'zh' ? (product.nameZh || product.name) : product.name}
          >
            {language === 'km' ? product.nameKm : language === 'zh' ? (product.nameZh || product.name) : product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="font-bold text-slate-700 ml-1">{product.rating}</span>
            </div>
            {product.reviewCount && <span>({product.reviewCount})</span>}
          </div>
        </div>

        {/* Price & Add to Cart */}
        <div className="pt-2 border-t border-emerald-50 flex items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-extrabold text-slate-900">
                ${product.priceUsd.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              ៛{product.priceKhr.toLocaleString()}
            </p>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => onAddToCart(product)}
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center transition cursor-pointer shadow-xs ${
              isInCart
                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
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
