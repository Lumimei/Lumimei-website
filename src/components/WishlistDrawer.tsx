import React from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Product, Language } from '../types';

interface WishlistDrawerProps {
  isOpen: boolean;
  language: Language;
  wishlist: Product[];
  onClose: () => void;
  onRemoveFromWishlist: (p: Product) => void;
  onAddToCart: (p: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  language,
  wishlist,
  onClose,
  onRemoveFromWishlist,
  onAddToCart,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-emerald-600 fill-current" />
              <h3 className="text-lg font-bold text-slate-900 font-opensans">
                {language === 'km' ? 'បញ្ជីផលិតផលពេញចិត្ត' : language === 'zh' ? '收藏夹 / 愿望单' : 'Saved Wishlist'}
              </h3>
              <span className="text-xs bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                {wishlist.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {wishlist.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <Heart className="w-8 h-8" />
                </div>
                <p className="font-bold text-slate-700">
                  {language === 'km' ? 'មិនទាន់មានផលិតផលក្នុងបញ្ជីពេញចិត្ត' : language === 'zh' ? '暂无收藏的商品' : 'Your wishlist is empty'}
                </p>
                <p className="text-xs text-slate-500 max-w-xs">
                  {language === 'km'
                    ? 'ចុចលើរូបបេះដូងលើផលិតផលដើម្បី រក្សាទុកមើលពេលក្រោយ'
                    : language === 'zh'
                    ? '点击商品上的爱心图标，即可保存至收藏夹！'
                    : 'Tap the heart icon on any product to save it for later'}
                </p>
              </div>
            ) : (
              wishlist.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition"
                >
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-16 h-16 object-cover rounded-xl border border-white"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">{prod.brand}</span>
                    <h4 className="text-xs font-bold text-slate-800 truncate">
                      {language === 'km' ? prod.nameKm : language === 'zh' ? (prod.nameZh || prod.name) : prod.name}
                    </h4>
                    <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                      ${prod.priceUsd.toFixed(2)}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => {
                          onAddToCart(prod);
                          onRemoveFromWishlist(prod);
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>{language === 'km' ? 'បន្ថែមក្នុងកន្ត្រក' : language === 'zh' ? '加入购物车' : 'Add to Cart'}</span>
                      </button>

                      <button
                        onClick={() => onRemoveFromWishlist(prod)}
                        className="p-1 text-slate-400 hover:text-emerald-700 transition"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
