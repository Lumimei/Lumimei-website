import React from 'react';
import { Product, Language } from '../types';
import { ProductCard } from './ProductCard';
import { CATEGORIES, SKIN_CONCERNS, BRANDS } from '../data/products';
import {
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  Search,
  Filter,
  ArrowLeft,
  Home,
  ChevronRight,
  Package,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag
} from 'lucide-react';

interface ProductsPageProps {
  products: Product[];
  totalProductCount: number;
  language: Language;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedSkinConcern: string;
  setSelectedSkinConcern: (concern: string) => void;
  selectedSkinType: string;
  setSelectedSkinType: (type: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'featured' | 'price-low' | 'price-high' | 'rating';
  setSortBy: (sort: 'featured' | 'price-low' | 'price-high' | 'rating') => void;
  wishlist: Product[];
  cart: { product: Product; quantity: number }[];
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onQuickView: (product: Product) => void;
  onBackToHome: () => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products,
  totalProductCount,
  language,
  selectedCategory,
  setSelectedCategory,
  selectedSkinConcern,
  setSelectedSkinConcern,
  selectedSkinType,
  setSelectedSkinType,
  selectedBrand,
  setSelectedBrand,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  wishlist,
  cart,
  onToggleWishlist,
  onAddToCart,
  onQuickView,
  onBackToHome,
}) => {
  const isFilterActive =
    selectedCategory !== 'all' ||
    selectedSkinConcern !== 'all' ||
    selectedSkinType !== 'all' ||
    selectedBrand !== 'all' ||
    searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedSkinConcern('all');
    setSelectedSkinType('all');
    setSelectedBrand('all');
    setSearchQuery('');
    setSortBy('featured');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Navigation & Breadcrumb Header */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-emerald-100 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 overflow-x-auto scrollbar-none">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-emerald-800 hover:text-emerald-600 font-bold hover:underline transition cursor-pointer"
          >
            <Home className="w-4 h-4 text-emerald-700" />
            <span>{language === 'km' ? 'ទំព័រដើម' : language === 'zh' ? '首页' : 'Home'}</span>
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          <span className="text-slate-900 font-bold flex items-center gap-1">
            <Package className="w-4 h-4 text-emerald-600" />
            <span>
              {language === 'km'
                ? 'ផលិតផលទាំងអស់'
                : language === 'zh'
                ? '所有商品'
                : 'All Products'}
            </span>
          </span>
        </div>

        <button
          onClick={onBackToHome}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold transition border border-slate-200 cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
          <span>
            {language === 'km'
              ? 'ត្រឡប់ទៅទំព័រដើម'
              : language === 'zh'
              ? '返回首页'
              : 'Back to Home'}
          </span>
        </button>
      </div>

      <div>
        {products.length === 0 ? (
          <div className="bg-emerald-50/50 rounded-2xl p-12 text-center border border-emerald-100 shadow-2xs my-6 space-y-3">
            <div className="w-16 h-16 rounded-full bg-white text-emerald-600 flex items-center justify-center mx-auto shadow-2xs border border-emerald-100">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">
              {language === 'km' ? 'មិនរកឃើញផលិតផលដែលសមស្រប' : 'No matching products found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {language === 'km'
                ? 'សូមព្យាយាមផ្លាស់ប្តូរពាក្យស្វែងរក ឬសម្អាតតម្រងដើម្បីមើលផលិតផលផ្សេងទៀត'
                : 'Try clearing your search query or reset filters to see all available products.'}
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
            >
              {language === 'km' ? 'មើលផលិតផលទាំងអស់ឡើងវិញ' : 'Reset & Show All Products'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pt-2">
            {products.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                language={language}
                isWishlisted={wishlist.some((p) => p.id === prod.id)}
                isInCart={cart.some((item) => item.product.id === prod.id)}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={(p) => onAddToCart(p, 1)}
                onQuickView={(p) => onQuickView(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reassurance Footer Bar */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              {language === 'km' ? 'ការធានាគុណភាពពី Lumimei' : 'Lumimei Quality Promise'}
            </h4>
            <p className="text-[11px] text-slate-500">
              {language === 'km'
                ? 'ផលិតផលគ្រប់មុខត្រូវបានត្រួតពិនិត្យ និងធានាគុណភាពជូនអតិថិជន ១០០%'
                : 'Every product is 100% verified for quality, efficacy and skin safety.'}
            </p>
          </div>
        </div>

        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition shadow-md cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'km' ? 'ត្រឡប់ទៅទំព័រដើម' : 'Return to Home Page'}</span>
        </button>
      </div>
    </div>
  );
};
