import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle,
  QrCode,
  Loader2,
  Upload,
  Image,
  Send,
  Check,
  FileText,
  MapPin,
  User,
  Phone,
  Package,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { Order, Language } from '../types';
import { PRODUCTS } from '../data/products';
import { openTelegramAdmin } from '../utils/telegram';

interface KHQRModalProps {
  order: Order | null;
  language: Language;
  onClose: () => void;
  onPaymentSuccess: (orderId: string) => void;
}

export const KHQRModal: React.FC<KHQRModalProps> = ({
  order,
  language,
  onClose,
  onPaymentSuccess,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [receiptFileSize, setReceiptFileSize] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const qrImageUrl = 'https://i.postimg.cc/bYmZQmB9/IMG-20260729-100318.png';
  const merchantAccountNumber = '004 806 561';
  const merchantName = 'MUOYKIM KOUCH';

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && order) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [order, onClose]);

  if (!order) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = (file: File) => {
    setReceiptFileName(file.name);
    setReceiptFileSize(formatFileSize(file.size));
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSimulatePayment = async () => {
    setIsSimulating(true);

    try {
      await openTelegramAdmin(order, true, receiptImage, receiptFileName);
    } catch (err) {
      console.error('Failed sending receipt to Telegram:', err);
    } finally {
      setIsSimulating(false);
      onPaymentSuccess(order.id);
    }
  };

  // Products to display (use order items, or fallback to first 2 products for preview)
  const displayItems =
    Array.isArray(order.items) && order.items.length > 0
      ? order.items.filter((it) => it && it.product)
      : PRODUCTS.slice(0, 2).map((prod) => ({
          product: prod,
          quantity: 1,
        }));

  return (
    <div
      id="khqr-modal-overlay"
      className="fixed inset-0 z-[120] flex items-center justify-center p-2.5 sm:p-4 lg:p-6 bg-slate-950/75 backdrop-blur-xs animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="khqr-modal-container"
        className="relative w-full max-w-md md:max-w-3xl lg:max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto border border-rose-100/90 flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0 shadow-2xs">
              <QrCode className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight tracking-wide flex items-center gap-1.5 font-battambang">
                <span>ABA KHQR PAYMENT</span>
                <span className="text-[10px] bg-white/20 text-white font-mono px-1.5 py-0.5 rounded font-bold hidden xs:inline">
                  BAKONG
                </span>
              </h3>
              <p className="text-[11px] text-white/85 font-battambang">
                {language === 'km'
                  ? 'ស្កេនទូទាត់ប្រាក់ភ្លាមៗ ឬផ្ទេរចូលគណនី ABA'
                  : language === 'zh'
                  ? '扫码或转账至 ABA 银行账户完成支付'
                  : 'Instant KHQR Scan or ABA Bank Transfer'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Close Button */}
            <button
              type="button"
              id="khqr-close-btn"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/15 active:scale-95 transition cursor-pointer"
              aria-label="Close"
              title={language === 'km' ? 'បិទ' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Responsive Layout (1 column on mobile, 2 columns on desktop) */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-6 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-start">
            
            {/* ========================================================= */}
            {/* LEFT COLUMN: Authentic ABA KHQR Stand                     */}
            {/* ========================================================= */}
            <div className="md:col-span-6 flex flex-col items-center">
              {/* Official KHQR Stand Card */}
              <div
                id="khqr-card-stand"
                className="w-full max-w-[340px] bg-white rounded-3xl p-4 sm:p-5 shadow-sm border-2 border-red-500/90 flex flex-col items-center text-center relative transition hover:shadow-md"
              >
                {/* Merchant Name & Account */}
                <div className="w-full bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-2.5 sm:p-3 mb-3 text-center space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
                    {language === 'km' ? 'ឈ្មោះគណនីទទួលប្រាក់' : language === 'zh' ? '收款账户名称' : 'Merchant Name'}
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-[#2E8B57] tracking-wide font-sans">
                    {merchantName}
                  </h4>
                  <div className="pt-0.5">
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {merchantAccountNumber}
                    </span>
                  </div>
                </div>

                {/* Payable Amount Highlight */}
                <div className="w-full bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border border-red-200 rounded-2xl p-2.5 mb-3.5 flex items-center justify-between px-3.5">
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-red-700 block uppercase tracking-wider">
                      {language === 'km' ? 'ទឹកប្រាក់ត្រូវទូទាត់' : language === 'zh' ? '应付金额' : 'Amount to Pay'}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-black text-red-600 font-mono">
                        ${order.totalUsd.toFixed(2)}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 font-mono">
                        (៛{order.totalKhr.toLocaleString()})
                      </span>
                    </div>
                  </div>
                </div>

                {/* ABA Mobile KHQR Image */}
                <div className="w-48 h-48 sm:w-56 sm:h-56 bg-white p-1.5 border-2 border-slate-200 rounded-2xl relative flex items-center justify-center overflow-hidden shadow-xs">
                  <img
                    src={qrImageUrl}
                    alt="ABA KHQR Code"
                    className="w-full h-full object-contain rounded-xl select-none"
                    loading="eager"
                  />
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* RIGHT COLUMN: Order Summary (Products, Shipping) & Receipt */}
            {/* ========================================================= */}
            <div className="md:col-span-6 flex flex-col space-y-3.5">
              
              {/* 1. Order Summary Card */}
              <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs sm:text-sm font-bold text-slate-900 font-battambang">
                      {language === 'km' ? 'ព័ត៌មានការកុម្ម៉ង់' : language === 'zh' ? '订单信息' : 'Order Information'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    #{order.orderNumber || order.id.slice(0, 8)}
                  </span>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{order.customerInfo.fullName || 'អតិថិជន'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{order.customerInfo.phone}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5 text-slate-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {order.customerInfo.addressDetail ? `${order.customerInfo.addressDetail}, ` : ''}
                      {order.customerInfo.districtSangkat ? `${order.customerInfo.districtSangkat}, ` : ''}
                      {order.customerInfo.cityProvince}
                    </span>
                  </div>
                </div>

                {/* 购买的产品 (Purchased Products) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 font-battambang">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                      {language === 'km' ? 'ផលិតផលបានបញ្ជាទិញ' : language === 'zh' ? '购买的产品' : 'Purchased Products'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      {displayItems.length} {language === 'km' ? 'មុខទំនិញ' : language === 'zh' ? '件商品' : 'items'}
                    </span>
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                    {displayItems.map((item, idx) => {
                      if (!item || !item.product) return null;
                      const p = item.product;
                      const itemTitle =
                        language === 'km'
                          ? (p.nameKm || p.name)
                          : language === 'zh'
                          ? (p.nameZh || p.name)
                          : (p.name || p.nameKm || 'Product');
                      const itemPrice = typeof p.priceUsd === 'number' ? p.priceUsd : 0;
                      const itemQuantity = typeof item.quantity === 'number' ? item.quantity : 1;
                      const itemTotal = (itemPrice * itemQuantity).toFixed(2);
                      const itemImage =
                        p.image ||
                        'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&auto=format&fit=crop&q=80';
                      return (
                        <div key={p.id || idx} className="pt-2 first:pt-0 flex items-center gap-2.5">
                          <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                            <img
                              src={itemImage}
                              alt={itemTitle}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&auto=format&fit=crop&q=80';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5
                              className="text-xs font-semibold text-slate-800 truncate font-battambang"
                              title={itemTitle}
                            >
                              {itemTitle}
                            </h5>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                              <span>${itemPrice.toFixed(2)}</span>
                              <span>×</span>
                              <span className="font-bold text-slate-700">{itemQuantity}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold font-mono text-slate-900">
                              ${itemTotal}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Price Breakdown: Subtotal, Discount, 运费 (Shipping Fee), Total */}
                <div className="border-t border-slate-200/90 pt-2.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>
                      {language === 'km' ? 'តម្លៃទំនិញសរុប' : language === 'zh' ? '商品小计' : 'Subtotal'}
                    </span>
                    <span className="font-mono text-slate-700">
                      ${order.subtotalUsd ? order.subtotalUsd.toFixed(2) : order.totalUsd.toFixed(2)}
                    </span>
                  </div>

                  {order.discountUsd > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 font-medium">
                      <span>
                        {language === 'km' ? 'បញ្ចុះតម្លៃ' : language === 'zh' ? '优惠折扣' : 'Discount'}
                      </span>
                      <span className="font-mono">-${order.discountUsd.toFixed(2)}</span>
                    </div>
                  )}

                  {/* 运费 (Shipping Fee) */}
                  <div className="flex items-center justify-between text-slate-700 font-medium">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {language === 'km' ? 'ថ្លៃដឹកជញ្ជូន' : language === 'zh' ? '运费' : 'Shipping Fee'}
                      </span>
                    </span>
                    <span className="font-mono">
                      {order.shippingFeeUsd > 0 ? (
                        `$${order.shippingFeeUsd.toFixed(2)}`
                      ) : (
                        <span className="text-emerald-600 font-bold">
                          {language === 'km' ? 'ឥតគិតថ្លៃ (Free)' : language === 'zh' ? '免运费' : 'Free'}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Total Amount to Pay */}
                  <div className="border-t border-dashed border-slate-200 pt-2 flex items-baseline justify-between">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm font-battambang">
                      {language === 'km' ? 'សរុបត្រូវបង់' : language === 'zh' ? '实付总额' : 'Total Amount'}
                    </span>
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-black font-mono text-emerald-700">
                        ${order.totalUsd.toFixed(2)}
                      </span>
                      <span className="block text-[11px] font-mono text-slate-500">
                        (៛{order.totalKhr.toLocaleString()})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Drag-and-Drop / Click Receipt Upload Area */}
              <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-battambang">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'km' ? 'Upload វិក័យបត្រទូទាត់ (Receipt Slip)' : 'Upload Payment Slip / Receipt'}</span>
                  </span>
                  {receiptImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptImage(null);
                        setReceiptFileName(null);
                        setReceiptFileSize(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-bold transition cursor-pointer font-battambang"
                    >
                      {language === 'km' ? 'លុបចេញ' : 'Remove'}
                    </button>
                  )}
                </div>

                {receiptImage ? (
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-300 flex items-center gap-3">
                    {receiptImage.startsWith('data:image/') ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-emerald-300 shadow-xs shrink-0 bg-white">
                        <img
                          src={receiptImage}
                          alt="Receipt Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-emerald-900 flex items-center gap-1 font-battambang">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{language === 'km' ? 'បានបញ្ចូលវិក័យបត្រជោគជ័យ' : 'Receipt File Attached'}</span>
                      </p>
                      <p className="text-[11px] text-slate-600 truncate font-mono">{receiptFileName}</p>
                      {receiptFileSize && (
                        <p className="text-[10px] text-slate-400 font-mono">{receiptFileSize}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full py-4 px-3 rounded-2xl border-2 border-dashed transition cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center ${
                      isDragOver
                        ? 'border-emerald-500 bg-emerald-50/80 scale-[0.99]'
                        : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf,image/*,.pdf"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                      <Image className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 font-battambang">
                        {language === 'km' ? 'ចុចទីនេះដើម្បីជ្រើសរើសរូបភាពវិក័យបត្រ' : 'Click or Drag & Drop Receipt'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">JPG, PNG, WEBP, PDF (Max 10MB)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Primary Confirmation Action Button */}
              <div className="pt-1">
                <button
                  type="button"
                  id="khqr-confirm-payment-btn"
                  onClick={handleSimulatePayment}
                  disabled={isSimulating}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed font-battambang"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{language === 'km' ? 'កំពុងផ្ទៀងផ្ទាត់ និងផ្ញើ...' : 'Verifying & Submitting...'}</span>
                    </>
                  ) : (
                    <>
                      {receiptImage ? (
                        <Send className="w-4 h-4 text-emerald-200" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-emerald-200" />
                      )}
                      <span>
                        {language === 'km'
                          ? (receiptImage ? 'ផ្ញើវិក័យបត្រ និងបញ្ចប់ការបញ្ជាទិញ' : 'ខ្ញុំបានទូទាត់រួចរាល់')
                          : (receiptImage ? 'Submit Receipt & Complete Order' : 'I Have Paid')}
                      </span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
