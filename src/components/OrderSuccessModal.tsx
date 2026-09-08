import React, { useState } from 'react';
import { CheckCircle2, MapPin, Printer, ShoppingBag, Truck, Send, Gift, Sparkles, X, Home } from 'lucide-react';
import { Order, Language } from '../types';
import { openTelegramAdmin } from '../utils/telegram';

interface OrderSuccessModalProps {
  order: Order | null;
  language: Language;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  language,
  onClose,
}) => {
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [telegramSentStatus, setTelegramSentStatus] = useState<string | null>(null);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendTelegram = async () => {
    setIsSendingTelegram(true);
    setTelegramSentStatus(null);
    try {
      const isPaid = order.paymentStatus === 'paid' || order.paymentMethod === 'khqr';
      const result = await openTelegramAdmin(order, isPaid, null, null);
      if (result.success) {
        setTelegramSentStatus(language === 'km' ? 'បានផ្ញើទៅ Telegram Bot រួចរាល់!' : 'Sent to Telegram Bot!');
      } else if (result.warning) {
        setTelegramSentStatus(language === 'km' ? 'បានបើក Telegram Admin' : 'Opened Telegram Admin');
      }
    } catch (err) {
      console.error('Error sending telegram:', err);
    } finally {
      setIsSendingTelegram(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-emerald-100 flex flex-col max-h-[90vh]">
        {/* Header Ribbon */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-center space-y-2">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold font-opensans">
            {language === 'km' ? 'ការបញ្ជាទិញជោគជ័យ!' : 'Order Placed Successfully!'}
          </h3>
          <p className="text-xs text-emerald-100">
            {language === 'km'
              ? 'អរគុណសម្រាប់ការគាំទ្រផលិតផល Lumimei យើងនឹងដឹកជញ្ជូនជូនអ្នកក្នុងពេលឆាប់ៗ។'
              : 'Thank you for supporting Lumimei products! We are preparing your order.'}
          </p>
        </div>

        {/* Invoice Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          {/* Order Meta Bar */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
            <span className="text-xs text-slate-600 font-bold">
              {language === 'km' ? 'ស្ថានភាពទូទាត់' : 'Payment Status'}:
            </span>
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
              order.paymentStatus === 'paid'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {order.paymentStatus === 'paid'
                ? (language === 'km' ? 'បានទូទាត់រួច' : 'Paid (KHQR)')
                : (language === 'km' ? 'ទូទាត់ពេលទទួលបានទំនិញ' : 'Pay on Delivery')}
            </span>
          </div>

          {/* Delivery Tracker Bar */}
          <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
            <div className="flex justify-between items-center font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-700" />
                {language === 'km' ? 'កាលបរិច្ឆេទដឹកជញ្ជូនរំពឹងទុក' : 'Estimated Delivery'}
              </span>
              <span className="text-emerald-700 font-bold">{order.estimatedDelivery}</span>
            </div>
          </div>

          {/* Points Earned Banner */}
          {Math.floor(order.subtotalUsd / 10) > 0 && (
            <div className="p-3.5 bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200/80 rounded-2xl flex items-center justify-between text-amber-900 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-amber-950 text-xs flex items-center gap-1">
                    <span>{language === 'km' ? `អ្នកទទួលបាន +${Math.floor(order.subtotalUsd / 10)} ពិន្ទុ!` : `You Earned +${Math.floor(order.subtotalUsd / 10)} Points!`}</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  </p>
                  <p className="text-[10px] text-amber-800 font-medium">
                    {language === 'km' ? 'ពិន្ទុត្រូវបានបន្ថែមទៅក្នុង "ពិន្ទុខ្ញុំ" រួចរាល់' : 'Points added to "My Points" automatically'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-2xs shrink-0">
                +{Math.floor(order.subtotalUsd / 10)} pts
              </span>
            </div>
          )}

          {/* Ordered Items Summary */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1">
              {language === 'km' ? 'មុខទំនិញដែលបានទិញ' : 'Items Ordered'} ({order.items.length})
            </h4>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {order.items.map((it) => (
                <div key={it.product.id} className="flex items-center justify-between py-1 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <img src={it.product.image} alt="product" className="w-9 h-9 object-cover rounded-lg border border-slate-100" referrerPolicy="no-referrer" />
                    <div>
                      <p className="font-bold text-slate-800 line-clamp-1">{language === 'km' ? it.product.nameKm : it.product.name}</p>
                      <p className="text-[10px] text-slate-400">Qty: {it.quantity} × ${it.product.priceUsd.toFixed(2)}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">${(it.product.priceUsd * it.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Customer Details */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
            <p className="font-bold text-slate-800 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              {language === 'km' ? 'ព័ត៌មានអ្នកទទួល' : 'Customer & Delivery Info'}
            </p>
            <p className="text-slate-700 font-semibold">{order.customerInfo.fullName} • {order.customerInfo.phone}</p>
            <p className="text-slate-500">
              {[order.customerInfo.sangkatCommune, order.customerInfo.districtSangkat, order.customerInfo.cityProvince].filter(Boolean).join(', ')}
            </p>
            {order.customerInfo.addressDetail && (
              <p className="text-slate-500 italic">{order.customerInfo.addressDetail}</p>
            )}
          </div>

          {/* Total Breakdown */}
          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-1 font-semibold text-slate-700">
            <div className="flex justify-between">
              <span>{language === 'km' ? 'តម្លៃទំនិញសរុប' : 'Subtotal'}:</span>
              <span>${order.subtotalUsd.toFixed(2)}</span>
            </div>
            {order.discountUsd > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>{language === 'km' ? 'បញ្ចុះតម្លៃ' : 'Discount'}:</span>
                <span>-${order.discountUsd.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{language === 'km' ? 'ថ្លៃដឹកជញ្ជូន' : 'Shipping'}:</span>
              <span>${order.shippingFeeUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-emerald-200 font-extrabold text-sm text-slate-900">
              <span>{language === 'km' ? 'ទឹកប្រាក់សរុប' : 'Total Paid'}:</span>
              <div className="text-right">
                <span className="text-emerald-700 text-base font-black">${order.totalUsd.toFixed(2)}</span>
                <p className="text-[10px] text-slate-500 font-normal">៛{order.totalKhr.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {telegramSentStatus && (
            <div className="p-2.5 bg-sky-50 text-sky-800 text-xs font-bold rounded-xl border border-sky-200 text-center animate-fade-in">
              {telegramSentStatus}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-row gap-2.5 items-center">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-600" />
            <span>{language === 'km' ? 'លុបចោល' : 'Cancel'}</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>{language === 'km' ? 'ត្រលប់ទៅទំព័រដើមវិញ' : 'Back to Home'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
