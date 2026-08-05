import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, Truck, ShieldCheck } from 'lucide-react';
import { CartItem, Language } from '../types';
import { KHR_RATE } from '../data/products';

interface CartDrawerProps {
  isOpen: boolean;
  language: Language;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: (appliedDiscountUsd: number, shippingFeeUsd: number) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  language,
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscountRate, setPromoDiscountRate] = useState<number>(0); // 0.10 for 10%

  const subtotalUsd = items.reduce(
    (sum, item) => sum + item.product.priceUsd * item.quantity,
    0
  );

  const discountUsd = subtotalUsd * promoDiscountRate;
  const freeShippingThreshold = 30; // $30 USD
  const isFreeShipping = subtotalUsd >= freeShippingThreshold;
  const shippingFeeUsd = items.length > 0 ? (isFreeShipping ? 0 : 1.5) : 0;
  const finalTotalUsd = Math.max(0, subtotalUsd - discountUsd + shippingFeeUsd);
  const finalTotalKhr = Math.round(finalTotalUsd * KHR_RATE);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'BEAUTY10') {
      setAppliedPromo('BEAUTY10 (10% Off)');
      setPromoDiscountRate(0.1);
    } else if (code === 'KHMER20') {
      setAppliedPromo('KHMER20 ($2.00 Off)');
      setPromoDiscountRate(0.08);
    } else if (code === 'FREESHIP') {
      setAppliedPromo('FREESHIP (Free Shipping)');
      setPromoDiscountRate(0);
    } else {
      alert(language === 'km' ? 'កូដបញ្ចុះតម្លៃមិនត្រឹមត្រូវ' : language === 'zh' ? '优惠码无效' : 'Invalid Promo Code');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-700" />
              <h3 className="text-lg font-bold text-slate-900 font-opensans">
                {language === 'km' ? 'កន្ត្រកទំនិញរបស់អ្នក' : language === 'zh' ? '您的购物车' : 'Your Shopping Cart'}
              </h3>
              <span className="text-xs bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          <div className="px-5 py-3 bg-teal-50/70 border-b border-teal-100 text-xs">
            {isFreeShipping ? (
              <div className="flex items-center gap-2 text-emerald-800 font-medium">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>
                  {language === 'km'
                    ? 'អបអរសាទរ! អ្នកទទួលបានការដឹកជញ្ជូនឥតគិតថ្លៃ'
                    : language === 'zh'
                    ? '恭喜！您已获得全柬免费包邮服务！'
                    : 'Congrats! You unlocked FREE Delivery across Cambodia!'}
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>
                    {language === 'km'
                      ? `ទិញបន្ថែម $${(freeShippingThreshold - subtotalUsd).toFixed(2)} ដើម្បីទទួលបានការដឹកឥតគិតថ្លៃ`
                      : language === 'zh'
                      ? `再购 $${(freeShippingThreshold - subtotalUsd).toFixed(2)} 即可享有免运费包邮`
                      : `Add $${(freeShippingThreshold - subtotalUsd).toFixed(2)} more for FREE Delivery`}
                  </span>
                  <span className="font-bold">{Math.round((subtotalUsd / freeShippingThreshold) * 100)}%</span>
                </div>
                <div className="w-full bg-teal-200/60 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotalUsd / freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="font-bold text-slate-700">
                  {language === 'km' ? 'កន្ត្រកទំនិញទទេស្អាត' : language === 'zh' ? '购物车是空的' : 'Your cart is empty'}
                </p>
                <p className="text-xs text-slate-500 max-w-xs">
                  {language === 'km'
                    ? 'សូមជ្រើសរើសផលិតផលថែសម្រស់ដែលអ្នកពេញចិត្តដើម្បីបន្ថែមក្នុងកន្ត្រក'
                    : language === 'zh'
                    ? '快去选购您心仪的纯天然护肤美妆产品吧！'
                    : 'Explore our skincare collection and find your new holy grails!'}
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition cursor-pointer"
                >
                  {language === 'km' ? 'ចូលទៅកាន់ហាងលក់' : language === 'zh' ? '立即选购' : 'Shop Now'}
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-emerald-200 transition"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-xl border border-white shadow-2xs"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">
                      {item.product.brand}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 truncate">
                      {language === 'km' ? item.product.nameKm : language === 'zh' ? (item.product.nameZh || item.product.name) : item.product.name}
                    </h4>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      ${item.product.priceUsd.toFixed(2)}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        (៛{(item.product.priceUsd * KHR_RATE).toLocaleString()})
                      </span>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white text-xs">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-slate-400 hover:text-emerald-700 transition p-1"
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

          {/* Footer & Summary */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 bg-white border-t border-emerald-100 space-y-3 shadow-lg">
              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder={language === 'km' ? 'កូដបញ្ចុះតម្លៃ (BEAUTY10)' : language === 'zh' ? '优惠码 (BEAUTY10)' : 'Promo Code (BEAUTY10)'}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-emerald-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase"
                  />
                  <Tag className="w-3.5 h-3.5 text-emerald-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {language === 'km' ? 'ប្រើប្រាស់' : language === 'zh' ? '使用' : 'Apply'}
                </button>
              </form>

              {appliedPromo && (
                <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-lg flex items-center justify-between border border-emerald-100">
                  <span>{appliedPromo}</span>
                  <button onClick={() => { setAppliedPromo(null); setPromoDiscountRate(0); }} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600 border-t border-emerald-50 pt-2">
                <div className="flex justify-between">
                  <span>{language === 'km' ? 'តម្លៃទំនិញសរុប' : language === 'zh' ? '商品小计' : 'Subtotal'}:</span>
                  <span className="font-semibold text-slate-800">${subtotalUsd.toFixed(2)}</span>
                </div>
                {discountUsd > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>{language === 'km' ? 'បញ្ចុះតម្លៃ' : language === 'zh' ? '折扣优惠' : 'Discount'}:</span>
                    <span>-${discountUsd.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{language === 'km' ? 'ថ្លៃដឹកជញ្ជូន' : language === 'zh' ? '运费' : 'Shipping Fee'}:</span>
                  <span className="font-semibold text-slate-800">
                    {shippingFeeUsd === 0 ? (
                      <span className="text-emerald-600 font-bold">{language === 'km' ? 'ឥតគិតថ្លៃ' : language === 'zh' ? '免运费' : 'FREE'}</span>
                    ) : (
                      `$${shippingFeeUsd.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-baseline font-bold text-sm text-slate-900 border-t border-emerald-100 pt-2">
                  <span>{language === 'km' ? 'ទឹកប្រាក់ត្រូវទូទាត់' : language === 'zh' ? '应付总计' : 'Total Amount'}:</span>
                  <div className="text-right">
                    <div className="text-base font-black text-emerald-700">${finalTotalUsd.toFixed(2)}</div>
                    <div className="text-[11px] text-slate-500 font-normal">៛{finalTotalKhr.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => onProceedToCheckout(discountUsd, shippingFeeUsd)}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{language === 'km' ? 'ទូទាត់ប្រាក់ឥឡូវនេះ' : language === 'zh' ? '立即结算' : 'Proceed to Checkout'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
