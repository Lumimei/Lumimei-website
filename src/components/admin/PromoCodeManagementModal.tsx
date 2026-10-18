import React, { useState } from 'react';
import {
  X,
  Tag,
  Percent,
  Plus,
  Copy,
  Check,
  Edit2,
  Trash2,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Search,
  Gift,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Language, Product } from '../../types';
import { saveStoredProduct } from '../../utils/productManager';

interface PromoCodeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  products: Product[];
  onNavigateToProductEdit?: (productId: string) => void;
  onNavigateToAddProduct?: () => void;
}

export const PromoCodeManagementModal: React.FC<PromoCodeManagementModalProps> = ({
  isOpen,
  onClose,
  language,
  products,
  onNavigateToProductEdit,
  onNavigateToAddProduct,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [inputDiscountCode, setInputDiscountCode] = useState<string>('');
  const [inputDiscountPercent, setInputDiscountPercent] = useState<number>(10);
  const [savingLoading, setSavingLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Inline editing state for individual product promo card
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [inlineEditCode, setInlineEditCode] = useState<string>('');
  const [inlineEditPercent, setInlineEditPercent] = useState<number>(10);
  const [isSavingInline, setIsSavingInline] = useState(false);

  // Deletion confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const productsWithCodes = products.filter(
    (p) => Boolean(p.discountCode && p.discountCode.trim().length > 0)
  );

  const filteredProductsWithCodes = productsWithCodes.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.discountCode?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q) ||
      p.nameKm?.toLowerCase().includes(q)
    );
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  // Start inline editing from product card
  const handleStartEditProductPromo = (product: Product) => {
    setEditingProductId(product.id);
    setInlineEditCode(product.discountCode || '');
    setInlineEditPercent(product.discountPercent || 10);
    setConfirmDeleteId(null);
  };

  // Save inline editing on product card
  const handleSaveInlinePromo = async (product: Product) => {
    if (!inlineEditCode.trim()) return;
    setIsSavingInline(true);
    try {
      const code = inlineEditCode.trim().toUpperCase();
      const pct = inlineEditPercent > 0 ? inlineEditPercent : 10;
      const updated: Product = {
        ...product,
        discountCode: code,
        discountPercent: pct,
      };

      await saveStoredProduct(updated);
      setSaveSuccessMsg(
        language === 'km'
          ? `បានកែប្រែកូដ #${code} (-${pct}%) លើ "${product.nameKm || product.name}" ដោយជោគជ័យ!`
          : language === 'zh'
          ? `已成功更新商品 “${product.name}” 的优惠码 #${code} (-${pct}%)！`
          : `Updated promo code #${code} (-${pct}%) successfully!`
      );
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      setEditingProductId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingInline(false);
    }
  };

  // Quick save discount code from top drawer (single product OR ALL products)
  const handleQuickSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    const code = inputDiscountCode.trim().toUpperCase();
    const pct = inputDiscountPercent > 0 ? inputDiscountPercent : 10;
    if (!code) return;

    setSavingLoading(true);

    try {
      // Option A: Apply to ALL products
      if (selectedProductId === 'ALL') {
        for (const prod of products) {
          const updated: Product = {
            ...prod,
            discountCode: code,
            discountPercent: pct,
          };
          await saveStoredProduct(updated);
        }

        setSaveSuccessMsg(
          language === 'km'
            ? `បានកំណត់កូដ #${code} (-${pct}%) លើផលិតផលទាំងអស់ (${products.length} មុខ) ដោយជោគជ័យ!`
            : language === 'zh'
            ? `已成功将优惠码 #${code} (-${pct}%) 应用至全部商品 (${products.length} 款)！`
            : `Applied promo code #${code} (-${pct}%) to all ${products.length} products!`
        );
      } else {
        // Option B: Apply to single selected product
        const prod = products.find((p) => p.id === selectedProductId);
        if (!prod) return;

        const updated: Product = {
          ...prod,
          discountCode: code,
          discountPercent: pct,
        };

        await saveStoredProduct(updated);
        setSaveSuccessMsg(
          language === 'km'
            ? `បានរក្សាទុកកូដ #${code} (-${pct}%) លើ "${prod.nameKm || prod.name}" ដោយជោគជ័យ!`
            : language === 'zh'
            ? `已成功为商品 “${prod.name}” 设定优惠码 #${code}！`
            : `Promo code #${code} saved successfully!`
        );
      }

      setTimeout(() => setSaveSuccessMsg(null), 3500);
      setIsQuickAddOpen(false);
      setSelectedProductId('');
      setInputDiscountCode('');
      setInputDiscountPercent(10);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingLoading(false);
    }
  };

  // Quick delete promo code from product
  const handleConfirmRemovePromo = async (product: Product) => {
    setIsDeletingId(product.id);
    try {
      const updated: Product = {
        ...product,
        discountCode: undefined,
        discountPercent: undefined,
      };
      await saveStoredProduct(updated);

      setSaveSuccessMsg(
        language === 'km'
          ? `បានលុបកូដបញ្ចុះតម្លៃលើ "${product.nameKm || product.name}" ដោយជោគជ័យ!`
          : language === 'zh'
          ? `已成功移除商品 “${product.name}” 的优惠码！`
          : `Removed promo code from "${product.name}" successfully!`
      );
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      setConfirmDeleteId(null);
      if (editingProductId === product.id) {
        setEditingProductId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div
      id="promo-code-management-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
    >
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50/60 border-b border-rose-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-extrabold text-slate-900 font-opensans">
                  {language === 'km'
                    ? 'Code Promotion & កូដប្រូម៉ូសិន'
                    : language === 'zh'
                    ? 'Code Promotion 促销优惠码管理'
                    : 'Code Promotion Management'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-rose-600 text-white shadow-2xs">
                  {productsWithCodes.length + 3} CODES
                </span>
              </div>
              <p className="text-xs text-slate-600 font-battambang mt-0.5">
                {language === 'km'
                  ? 'គ្រប់គ្រងកូដបញ្ចុះតម្លៃសម្រាប់ផលិតផល និងប្រព័ន្ធកូដទូទាំងហាង'
                  : language === 'zh'
                  ? '管理商品专属优惠码及全店通用促销代码，客户结算即可享即时折扣'
                  : 'Manage product-specific and store-wide promotion discount codes'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 flex items-center justify-center transition border border-rose-200/60 shadow-2xs cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-bold font-battambang animate-in fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Top Actions & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'km'
                    ? 'ស្វែងរកតាមកូដ ឬឈ្មោះផលិតផល...'
                    : language === 'zh'
                    ? '搜索优惠码或商品名称...'
                    : 'Search by promo code or product name...'
                }
                className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition shadow-2xs font-battambang"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-rose-600/20 cursor-pointer active:scale-95 shrink-0 font-battambang"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {language === 'km'
                    ? '+ កំណត់កូដលើទំនិញ'
                    : language === 'zh'
                    ? '+ 为商品设优惠码'
                    : '+ Assign Code to Product'}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Add Form Drawer/Card */}
          {isQuickAddOpen && (
            <form
              onSubmit={handleQuickSavePromo}
              className="bg-white border-2 border-rose-200 rounded-3xl p-4 sm:p-5 space-y-4 shadow-md animate-in fade-in font-battambang"
            >
              <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  <span>
                    {language === 'km'
                      ? 'កំណត់កូដប្រូម៉ូសិនលើផលិតផល (Quick Assign Promo Code)'
                      : language === 'zh'
                      ? '快速为商品设定优惠码与折扣'
                      : 'Quick Assign Promo Code to Product'}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* 1. Select Product (includes ផលិតផលទាំងអស់) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {language === 'km' ? 'ជ្រើសរើសផលិតផល' : language === 'zh' ? '选择商品' : 'Select Product'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedProductId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedProductId(val);
                      if (val === 'ALL') {
                        if (!inputDiscountCode) setInputDiscountCode('BEAUTY10');
                        if (!inputDiscountPercent) setInputDiscountPercent(10);
                      } else {
                        const chosen = products.find((p) => p.id === val);
                        if (chosen) {
                          if (chosen.discountCode) setInputDiscountCode(chosen.discountCode);
                          if (chosen.discountPercent) setInputDiscountPercent(chosen.discountPercent);
                        }
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-rose-500 focus:bg-white transition"
                  >
                    <option value="">
                      {language === 'km'
                        ? '-- ជ្រើសរើសទំនិញ --'
                        : language === 'zh'
                        ? '-- 请选择商品 --'
                        : '-- Select a Product --'}
                    </option>
                    {/* ALL PRODUCTS OPTION */}
                    <option value="ALL" className="font-bold text-rose-700 bg-rose-50">
                      {language === 'km'
                        ? '⭐ ផលិតផលទាំងអស់ (អនុវត្តលើគ្រប់ទំនិញ)'
                        : language === 'zh'
                        ? '⭐ ផលិតផលទាំងអស់ (全部商品)'
                        : '⭐ ផលិតផលទាំងអស់ (All Products)'}
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nameKm || p.name} (${Number(p.priceUsd).toFixed(2)}){' '}
                        {p.discountCode ? `[#${p.discountCode} -${p.discountPercent || 10}%]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Promo Code Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {language === 'km' ? 'code បញ្ចុះតម្លៃ (Promo Code)' : language === 'zh' ? '优惠代码 (Code)' : 'Promo Code'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono font-bold">
                      #
                    </span>
                    <input
                      type="text"
                      required
                      value={inputDiscountCode}
                      onChange={(e) => setInputDiscountCode(e.target.value.toUpperCase())}
                      placeholder="ឧ. LUMI15"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 font-mono uppercase focus:outline-hidden focus:border-rose-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* 3. Discount Percent */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {language === 'km' ? 'ចំនួនភាគរយ (%)' : language === 'zh' ? '折扣百分比 (%)' : 'Discount Percentage (%)'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      max="99"
                      value={inputDiscountPercent}
                      onChange={(e) => setInputDiscountPercent(parseInt(e.target.value) || 0)}
                      placeholder="10"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 text-xs sm:text-sm text-slate-900 font-mono focus:outline-hidden focus:border-rose-500 focus:bg-white transition"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono font-bold">
                      %
                    </span>
                  </div>
                </div>

                {/* Info badge when All Products is selected */}
                {selectedProductId === 'ALL' && (
                  <div className="sm:col-span-3 bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-900 flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-bold">
                        {language === 'km'
                          ? `កូដប្រូម៉ូសិននេះ នឹងត្រូវបានកំណត់ជូនគ្រប់ផលិតផលទាំងអស់ (${products.length} មុខទំនិញ)!`
                          : language === 'zh'
                          ? `此优惠码将批量赋予全部商品 (${products.length} 款)！`
                          : `This promo code will be applied to all products (${products.length} items)!`}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-600 text-white font-black shrink-0">
                      {products.length} ITEMS
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  {language === 'km' ? 'បោះបង់' : language === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingLoading || !selectedProductId || !inputDiscountCode.trim()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {savingLoading
                      ? language === 'km'
                        ? 'កំពុងរក្សាទុក...'
                        : 'Saving...'
                      : language === 'km'
                      ? 'រក្សាទុកកូដ'
                      : language === 'zh'
                      ? '保存优惠码'
                      : 'Save Promo Code'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* Section 1: Product Specific Codes */}
          <div className="space-y-3 font-battambang">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Gift className="w-4 h-4 text-rose-600" />
                <span>
                  {language === 'km'
                    ? `កូដបញ្ចុះតម្លៃសម្រាប់ផលិតផល (${filteredProductsWithCodes.length})`
                    : language === 'zh'
                    ? `商品专属优惠码 (${filteredProductsWithCodes.length})`
                    : `Product Specific Codes (${filteredProductsWithCodes.length})`}
                </span>
              </h3>
            </div>

            {filteredProductsWithCodes.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {searchQuery
                      ? language === 'km'
                        ? 'រកមិនឃើញកូដដែលត្រូវនឹងការស្វែងរកទេ'
                        : 'No promo codes match your search'
                      : language === 'km'
                      ? 'មិនទាន់មានកូដប្រូម៉ូសិនលើផលិតផលនៅឡើយទេ'
                      : language === 'zh'
                      ? '暂无商品配置专属优惠码'
                      : 'No product promo codes set yet'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    {language === 'km'
                      ? 'អ្នកអាចកំណត់កូដបញ្ចុះតម្លៃ និងភាគរយបញ្ចុះតម្លៃលើផលិតផលនីមួយៗ ឬជ្រើសរើស "ផលិតផលទាំងអស់" ពេលអតិថិជនវាយកូដក្នុងកន្ត្រកទំនិញ នឹងទទួលបានការបញ្ចុះតម្លៃភ្លាមៗ។'
                      : language === 'zh'
                      ? '您可以点击上方的“+ 为商品设优惠码”，可针对单件商品或“全部商品”批量设置促销代码。'
                      : 'You can assign custom discount codes and discount percentages to specific items or all products.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {language === 'km' ? 'កំណត់កូដដំបូងឥឡូវនេះ' : language === 'zh' ? '立即设定第一个优惠码' : 'Assign First Code Now'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {filteredProductsWithCodes.map((prod) => {
                  const discountPct = prod.discountPercent || 10;
                  const discountedPrice = Math.max(0, prod.priceUsd * (1 - discountPct / 100));
                  const isEditingThis = editingProductId === prod.id;
                  const isConfirmingDelete = confirmDeleteId === prod.id;

                  return (
                    <div
                      key={prod.id}
                      className="bg-white border border-slate-200/90 hover:border-rose-300 rounded-3xl p-4 flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-md group"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={prod.image || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200'}
                          alt={prod.name}
                          className="w-16 h-16 rounded-2xl object-cover bg-slate-100 border border-slate-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200">
                              -{discountPct}% OFF
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Stock: {prod.stock ?? 100}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                            {prod.nameKm || prod.name}
                          </h4>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-xs font-extrabold text-emerald-800 font-mono">
                              ${discountedPrice.toFixed(2)}
                            </span>
                            <span className="text-[11px] text-slate-400 line-through font-mono">
                              ${Number(prod.priceUsd).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Inline Edit Form Mode when Edit icon is clicked */}
                      {isEditingThis ? (
                        <div className="mt-3 pt-3 border-t border-rose-200 bg-rose-50/40 -mx-4 -mb-4 p-3.5 rounded-b-3xl space-y-3 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                              <Edit2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>{language === 'km' ? 'កែប្រែកូដប្រូម៉ូសិន' : language === 'zh' ? '编辑优惠码' : 'Edit Promo Code'}</span>
                            </span>
                            {onNavigateToProductEdit && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onNavigateToProductEdit(prod.id);
                                }}
                                className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                              >
                                {language === 'km' ? 'កែប្រែទំនិញពេញលេញ' : 'Full Edit'}
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                {language === 'km' ? 'កូដថ្មី (Code)' : 'Promo Code'}
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono font-bold">
                                  #
                                </span>
                                <input
                                  type="text"
                                  value={inlineEditCode}
                                  onChange={(e) => setInlineEditCode(e.target.value.toUpperCase())}
                                  className="w-full bg-white border border-rose-300 rounded-xl pl-6 pr-2 py-1.5 text-xs font-mono font-bold uppercase focus:outline-hidden focus:ring-2 focus:ring-rose-200"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                {language === 'km' ? 'ភាគរយ (%)' : 'Discount %'}
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="1"
                                  max="99"
                                  value={inlineEditPercent}
                                  onChange={(e) => setInlineEditPercent(Number(e.target.value) || 0)}
                                  className="w-full bg-white border border-rose-300 rounded-xl pl-3 pr-6 py-1.5 text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-rose-200"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono font-bold">
                                  %
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingProductId(null)}
                              className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                            >
                              {language === 'km' ? 'បោះបង់' : language === 'zh' ? '取消' : 'Cancel'}
                            </button>
                            <button
                              type="button"
                              disabled={isSavingInline || !inlineEditCode.trim()}
                              onClick={() => handleSaveInlinePromo(prod)}
                              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>
                                {isSavingInline
                                  ? language === 'km'
                                    ? 'កំពុងរក្សាទុក...'
                                    : 'Saving...'
                                  : language === 'km'
                                  ? 'រក្សាទុក'
                                  : language === 'zh'
                                  ? '保存'
                                  : 'Save'}
                              </span>
                            </button>
                          </div>
                        </div>
                      ) : isConfirmingDelete ? (
                        /* Delete Confirmation Prompt when Trash icon is clicked */
                        <div className="mt-3 pt-3 border-t border-rose-200 bg-rose-50/70 -mx-4 -mb-4 p-3 rounded-b-3xl space-y-2 animate-in fade-in">
                          <div className="flex items-center gap-2 text-xs text-rose-900 font-bold">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>
                              {language === 'km'
                                ? `តើអ្នកចង់លុបកូដ #${prod.discountCode} មែនទេ?`
                                : language === 'zh'
                                ? `确定删除商品优惠码 #${prod.discountCode} 吗？`
                                : `Remove promo code #${prod.discountCode}?`}
                            </span>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-1 text-slate-600 hover:bg-slate-200/60 bg-white border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                            >
                              {language === 'km' ? 'បោះបង់' : language === 'zh' ? '取消' : 'Cancel'}
                            </button>
                            <button
                              type="button"
                              disabled={isDeletingId === prod.id}
                              onClick={() => handleConfirmRemovePromo(prod)}
                              className="px-3.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>
                                {isDeletingId === prod.id
                                  ? language === 'km'
                                    ? 'កំពុងលុប...'
                                    : 'Deleting...'
                                  : language === 'km'
                                  ? 'លុបចេញ'
                                  : language === 'zh'
                                  ? '确定删除'
                                  : 'Delete'}
                              </span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Standard Promo Code Pill Bar & Action Buttons */
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-500 font-mono">CODE:</span>
                            <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-yellow-300 font-mono text-xs font-black tracking-wider flex items-center gap-1.5 shadow-2xs">
                              #{prod.discountCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => prod.discountCode && handleCopy(prod.discountCode)}
                              title="Copy Code"
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            >
                              {copiedCode === prod.discountCode ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* EDIT BUTTON (Button 1) */}
                            <button
                              type="button"
                              onClick={() => handleStartEditProductPromo(prod)}
                              title={language === 'km' ? 'កែប្រែកូដប្រូម៉ូសិន' : language === 'zh' ? '编辑优惠码' : 'Edit Promo Code'}
                              className="px-2.5 py-1 text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border border-transparent hover:border-rose-200"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>{language === 'km' ? 'កែប្រែ' : language === 'zh' ? '编辑' : 'Edit'}</span>
                            </button>

                            {/* DELETE BUTTON (Button 2) */}
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(prod.id)}
                              title={language === 'km' ? 'លុបកូដប្រូម៉ូសិន' : language === 'zh' ? '删除优惠码' : 'Delete Promo Code'}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Store-wide Promotion Codes */}
          <div className="space-y-3 font-battambang pt-3 border-t border-slate-200">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>
                {language === 'km'
                  ? 'កូដទូទាំងប្រព័ន្ធ (Store-wide Promotion Codes)'
                  : language === 'zh'
                  ? '全店通用促销优惠码 (Store-wide Codes)'
                  : 'Store-wide Promotion Codes'}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* BEAUTY10 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between space-y-2 hover:border-emerald-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-black border border-emerald-200">
                    10% OFF
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy('BEAUTY10')}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition cursor-pointer"
                  >
                    {copiedCode === 'BEAUTY10' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div>
                  <div className="font-mono text-sm font-black text-slate-900">#BEAUTY10</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'km' ? 'បញ្ចុះតម្លៃ ១០% លើកន្ត្រកទំនិញ' : language === 'zh' ? '全店订单 10% 折扣' : '10% Off Cart Subtotal'}
                  </p>
                </div>
              </div>

              {/* KHMER20 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between space-y-2 hover:border-blue-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-black border border-blue-200">
                    $2.00 OFF
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy('KHMER20')}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition cursor-pointer"
                  >
                    {copiedCode === 'KHMER20' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div>
                  <div className="font-mono text-sm font-black text-slate-900">#KHMER20</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'km' ? 'បញ្ចុះតម្លៃ $2.00 ដុល្លារ' : language === 'zh' ? '立减 $2.00 优惠' : '$2.00 Off Discount'}
                  </p>
                </div>
              </div>

              {/* FREESHIP */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between space-y-2 hover:border-purple-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 font-black border border-purple-200">
                    FREE SHIP
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy('FREESHIP')}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition cursor-pointer"
                  >
                    {copiedCode === 'FREESHIP' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div>
                  <div className="font-mono text-sm font-black text-slate-900">#FREESHIP</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'km' ? 'ដឹកជញ្ជូនឥតគិតថ្លៃ' : language === 'zh' ? '免运费优惠码' : 'Free Delivery Code'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 font-battambang">
          <div className="text-xs text-slate-500 hidden sm:block">
            {language === 'km'
              ? 'អតិថិជនអាចបញ្ចូលកូដទាំងនេះក្នុងប្រអប់ "កូដបញ្ចុះតម្លៃ" នៅពេល Check out កន្ត្រកទំនិញ'
              : language === 'zh'
              ? '客户可在购物车结算时输入此优惠码享受相应扣减'
              : 'Customers enter these promo codes in cart checkout'}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ml-auto"
          >
            {language === 'km' ? 'រួចរាល់ (Close)' : language === 'zh' ? '关闭' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
