import React, { useState } from 'react';
import { CheckCircle2, MapPin, Printer, ShoppingBag, Truck, Send, Upload, Check, Image as ImageIcon } from 'lucide-react';
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
  if (!order) return null;

  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendTelegram = async () => {
    const isPaid = order.paymentStatus === 'paid' || order.paymentMethod === 'khqr';
    await openTelegramAdmin(order, isPaid, receiptImage);
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
            <p className="text-slate-500">{order.customerInfo.districtSangkat}, {order.customerInfo.cityProvince}</p>
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

          {/* Upload Payment Receipt Image Box */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                {language === 'km' ? 'upload វិក័យបត្ររូបភាព' : 'Upload Receipt Image'}
              </span>
              {receiptImage && (
                <button
                  type="button"
                  onClick={() => { setReceiptImage(null); setReceiptFileName(null); }}
                  className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  {language === 'km' ? 'លុប' : 'Remove'}
                </button>
              )}
            </div>

            {receiptImage ? (
              <div className="flex items-center gap-2.5 p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                <img src={receiptImage} alt="Receipt" className="w-12 h-12 object-cover rounded-lg border border-emerald-300" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    {language === 'km' ? 'បាន Upload រូបភាពរួចរាល់' : 'Receipt Attached'}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{receiptFileName}</p>
                </div>
              </div>
            ) : (
              <label className="block w-full">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <div className="w-full py-2 px-3 bg-white hover:bg-emerald-50 border border-dashed border-slate-300 hover:border-emerald-400 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition text-slate-600 text-xs font-bold">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'km' ? 'ជ្រើសរើសរូបភាពវិក័យបត្រទូទាត់' : 'Select Receipt Image'}</span>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleSendTelegram}
            className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span>{language === 'km' ? 'ផ្ញើទៅ Telegram' : 'Send to Telegram'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>{language === 'km' ? 'បោះពុម្ព' : 'Print'}</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{language === 'km' ? 'បន្តទិញទំនិញ' : 'Continue'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
