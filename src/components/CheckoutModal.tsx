import React, { useState } from 'react';
import { X, MapPin, CreditCard, QrCode, Phone, Truck, ShieldCheck, ArrowRight, Check } from 'lucide-react';
import { CartItem, PaymentMethod, OrderCustomerInfo, Language } from '../types';
import { KHR_RATE } from '../data/products';

interface CheckoutModalProps {
  isOpen: boolean;
  language: Language;
  items: CartItem[];
  subtotalUsd: number;
  discountUsd: number;
  shippingFeeUsd: number;
  onClose: () => void;
  onSubmitOrder: (customerInfo: OrderCustomerInfo, paymentMethod: PaymentMethod) => void;
}

const CAMBODIA_PROVINCES = [
  'រាជធានីភ្នំពេញ (Phnom Penh)',
  'ខេត្តកណ្តាល (Kandal)',
  'ខេត្តសៀមរាប (Siem Reap)',
  'ខេត្តបាត់ដំបង (Battambang)',
  'ខេត្តព្រះសីហនុ (Preah Sihanouk)',
  'ខេត្តកំពង់ចាម (Kampong Cham)',
  'ខេត្តកំពត (Kampot)',
  'ខេត្តស្វាយរៀង (Svay Rieng)',
  'ខេត្តតាកែវ (Takeo)',
  'ខេត្តកំពង់ស្ពឺ (Kampong Speu)',
  'ខេត្តពោធិ៍សាត់ (Pursat)',
  'ខេត្តបន្ទាយមានជ័យ (Banteay Meanchey)',
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  language,
  items,
  subtotalUsd,
  discountUsd,
  shippingFeeUsd,
  onClose,
  onSubmitOrder,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<1 | 2>(1);
  const [customerInfo, setCustomerInfo] = useState<OrderCustomerInfo>({
    fullName: '',
    phone: '',
    telegramPhone: '',
    cityProvince: 'រាជធានីភ្នំពេញ (Phnom Penh)',
    districtSangkat: '',
    addressDetail: '',
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('khqr');

  const totalUsd = Math.max(0, subtotalUsd - discountUsd + shippingFeeUsd);
  const totalKhr = Math.round(totalUsd * KHR_RATE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.fullName || !customerInfo.phone || !customerInfo.districtSangkat) {
      alert(language === 'km' ? 'សូមបំពេញព័ត៌មានអាសយដ្ឋាន និងលេខទូរស័ព្ទឲ្យបានគ្រប់គ្រាន់' : 'Please fill in required customer details');
      return;
    }
    onSubmitOrder(customerInfo, paymentMethod);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-emerald-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-opensans">
              {language === 'km' ? 'ទូទាត់ប្រាក់ និងដឹកជញ្ជូន' : 'Checkout & Shipping'}
            </h3>
            <p className="text-xs text-emerald-700 font-medium">
              {language === 'km' ? 'ជំហានទី ២៖ បំពេញព័ត៌មាន និងជ្រើសរើសការទូទាត់' : 'Complete shipping & select payment'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Customer & Address Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 border-b border-emerald-100 pb-2">
              <MapPin className="w-4 h-4" />
              <span>{language === 'km' ? '១. អាសយដ្ឋានដឹកជញ្ជូនទំនិញ' : '1. Shipping Address'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === 'km' ? 'ឈ្មោះពេញអ្នកទទួល' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'km' ? 'ឧទាហរណ៍៖ សុខ ជា' : 'e.g. Sok Chea'}
                  value={customerInfo.fullName}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, fullName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === 'km' ? 'លេខទូរស័ព្ទទំនាក់ទំនង' : 'Phone Number'} *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="012 345 678 / 096 123 4567"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === 'km' ? 'រាជធានី / ខេត្ត' : 'City / Province'} *
                </label>
                <select
                  value={customerInfo.cityProvince}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, cityProvince: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CAMBODIA_PROVINCES.map((prov, i) => (
                    <option key={i} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === 'km' ? 'ខណ្ឌ / សង្កាត់ ឬ ស្រុក' : 'District / Sangkat'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'km' ? 'ឧ. ខណ្ឌទួលគោក សង្កាត់បឹងកក់១' : 'e.g. Toul Kork / Boeng Kak 1'}
                  value={customerInfo.districtSangkat}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, districtSangkat: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs">
                {language === 'km' ? 'អាសយដ្ឋានលម្អិត (ផ្ទះលេខ, ផ្លូវ, ឬទីតាំងចំណាំ)' : 'Detailed Address (House No, Street, Landmark)'}
              </label>
              <input
                type="text"
                placeholder={language === 'km' ? 'ឧ. ផ្ទះលេខ ១២E0 ផ្លូវ ២៨៩ ជិតកាលម៉ែត' : 'e.g. House #12, Street 289 near Calmette'}
                value={customerInfo.addressDetail}
                onChange={(e) => setCustomerInfo({ ...customerInfo, addressDetail: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Section 2: Easy Payment Methods */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 border-b border-emerald-100 pb-2">
              <CreditCard className="w-4 h-4" />
              <span>{language === 'km' ? '២. ជ្រើសរើសវិធីសាស្ត្រទូទាត់ប្រាក់' : '2. Select Payment Method'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* KHQR Option */}
              <label
                onClick={() => setPaymentMethod('khqr')}
                className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'khqr'
                    ? 'border-red-500 bg-red-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  KHQR
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800">
                      KHQR / Bakong Scan
                    </span>
                    <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                      {language === 'km' ? 'ពេញនិយម' : 'Popular'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {language === 'km' ? 'ស្កេនបានគ្រប់ធនាគារ (ABA, ACLEDA, Bakong)' : 'Scan with ABA, ACLEDA, Bakong, etc.'}
                  </p>
                </div>
              </label>

              {/* ABA Pay Option */}
              <label
                onClick={() => setPaymentMethod('aba_pay')}
                className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'aba_pay'
                    ? 'border-sky-500 bg-sky-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  ABA
                </div>
                <div className="flex-1">
                  <span className="text-xs font-extrabold text-slate-800">
                    ABA Pay Mobile Direct
                  </span>
                  <p className="text-[10px] text-slate-500">
                    {language === 'km' ? 'ទូទាត់ផ្ទាល់លើ ABA App' : 'Pay instantly inside ABA App'}
                  </p>
                </div>
              </label>

            </div>
          </div>

          {/* Order Total Highlight */}
          <div className="p-4 bg-emerald-950 text-white rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-300">
                {language === 'km' ? 'ទឹកប្រាក់ត្រូវទូទាត់សរុប' : 'Total Payable'}
              </p>
              <p className="text-[11px] text-slate-300">
                {items.length} {language === 'km' ? 'មុខទំនិញ' : 'items'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-emerald-400">${totalUsd.toFixed(2)}</p>
              <p className="text-xs text-slate-300">៛{totalKhr.toLocaleString()}</p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>
              {paymentMethod === 'khqr' || paymentMethod === 'aba_pay'
                ? (language === 'km' ? 'បន្តទៅស្កេនទូទាត់ប្រាក់ KHQR' : 'Proceed to KHQR Scan')
                : (language === 'km' ? 'បញ្ជាក់ការបញ្ជាទិញ' : 'Confirm & Place Order')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
