import React from 'react';
import { Send, ShoppingBag } from 'lucide-react';
import { Language } from '../types';
import riceMaskImg from '../assets/images/lumimei_rice_mask_1785063133244.jpg';

interface HeroBannerProps {
  language: Language;
  onOpenAiAdvisor?: () => void;
  onSelectTag?: (tag: string) => void;
  onNavigateToProducts?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  language,
  onNavigateToProducts,
}) => {
  const handleChatConsultation = () => {
    window.open('https://t.me/Lumimeiadmin', '_blank');
  };

  const handleOrderNow = () => {
    if (onNavigateToProducts) {
      onNavigateToProducts();
    } else {
      window.location.hash = '#products';
    }
  };

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-emerald-600/30 p-4 sm:p-7 mt-1.5 mb-6 shadow-md">
      {/* Decorative top-right green accent wave */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-100/40 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Text Content */}
        <div className="md:col-span-7 space-y-3.5 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-700 text-white text-xs font-semibold shadow-xs">
            <span className="font-opensans" style={{ fontFamily: "'Open Sans', 'Battambang', sans-serif" }}>
              {language === 'km'
                ? 'ប្រូម៉ូសិនពិសេសប្រចាំខែ បញ្ចុះតម្លៃរហូតដល់ 30%'
                : language === 'zh'
                ? '本月特别优惠：高达 30% 折扣'
                : 'Special Monthly Promo: Up to 30% Off'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {language === 'km' ? (
              <span className="tracking-normal">
                <span className="font-opensans font-bold" style={{ fontFamily: "'Open Sans', sans-serif", color: '#009966' }}>Lumimei</span> <span className="text-emerald-700 font-battambang">អ្នកឯកទេសថែរក្សាមុខមុនគ្រប់ប្រភេទ</span>
              </span>
            ) : language === 'zh' ? (
              <span className="font-opensans">
                告别化学烂脸隐患：<span className="text-emerald-700">100% 纯天然温和护肤，根治敏感暗沉与痘痘！</span>
              </span>
            ) : (
              <span className="font-opensans font-bold">
                Say Goodbye to Harsh Chemicals & Damage: <span className="text-emerald-700">100% Safe Organic Skincare!</span>
              </span>
            )}
          </h2>

          <div className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl font-opensans">
            {language === 'km' ? (
              <div className="space-y-2 text-slate-700">
                <p className="font-semibold text-slate-900 leading-snug" style={{ fontSize: '18px' }}>
                  តើបងប្អូនកំពុងជួបបញ្ហាស្បែកមុខ ដែលធ្វើឱ្យបាត់បង់ទំនុកចិត្តមែនទេ? មិនថាបងប្អូនកំពុងជួបបញ្ហា៖
                </p>
                <ul className="space-y-1 text-slate-800 pl-1 font-medium" style={{ fontSize: '16px' }}>
                  <li>* មុនគ្រប់ប្រភេទ (មុនក្បាលខ្មៅ, មុនរលាក, មុនសាច់...)</li>
                  <li>* ស្បែកមុខខ្មៅស្រអាប់ មិនភ្លឺថ្លា និងរន្ធញើសធំ</li>
                  <li>* ស្បែកមុខរោល ងាយប្រតិកម្ម ឬរលាក</li>
                  <li>* សរសៃក្រហមលើផ្ទៃមុខ</li>
                </ul>
                <p className="pt-1.5 text-emerald-900 font-semibold leading-relaxed" style={{ fontSize: '16px' }}>
                  Lumimei នៅទីនេះដើម្បីជួយបងប្អូនដើម្បទទួលបានលទ្ធផលប្រសិទ្ធខ្ពស់ សន្សំលុយនិងសន្សំពេល Lumimei ថែស្បែកមុខបងប្អូនដោយក្តីស្រលាញ់បំផុត!
                </p>
              </div>
            ) : language === 'zh' ? (
              <div className="space-y-2">
                <p className="font-bold text-slate-900">
                  您是否正面临让您失去信心的面部肌肤困扰？无论您正经历：
                </p>
                <ul className="space-y-1 text-slate-800 pl-1">
                  <li>* 各类痘痘（黑头、炎性痘痘、脂肪粒等）</li>
                  <li>* 皮肤暗沉无光泽、毛孔粗大</li>
                  <li>* 皮肤发红、易过敏或发炎</li>
                  <li>* 面部红血丝明显</li>
                </ul>
                <p className="pt-1 text-emerald-800 font-semibold">
                  Lumimei 陪伴在您身边，助您获得高效成果，省钱省时，Lumimei 倾注全心守护您的美丽肌肤！
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-bold text-slate-900">
                  Are you struggling with skin issues affecting your confidence? Whether dealing with:
                </p>
                <ul className="space-y-1 text-slate-800 pl-1">
                  <li>* All types of acne (blackheads, inflammatory acne, textured bumps...)</li>
                  <li>* Dull skin tone, lack of radiance, and enlarged pores</li>
                  <li>* Sensitive, reactive, or irritated skin</li>
                  <li>* Facial redness & visible broken capillaries</li>
                </ul>
                <p className="pt-1 text-emerald-800 font-semibold">
                  Lumimei is here to deliver visible, highly effective results while saving your time and money—caring for your skin with the utmost love!
                </p>
              </div>
            )}
          </div>

          {/* CTA Buttons - 2 side-by-side buttons in 1 row on mobile & desktop */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 max-w-md">
            <button
              id="hero-btn-chat-consult"
              onClick={handleChatConsultation}
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 sm:gap-2 text-center cursor-pointer transform hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4 text-emerald-100 shrink-0" />
              <span className="text-[12px] sm:text-sm font-extrabold whitespace-nowrap">
                {language === 'km' ? 'ឆាត់មកពិភាក្សាស្បែកមុខ' : language === 'zh' ? '联系在线咨询' : 'Chat Consultation'}
              </span>
            </button>

            <button
              id="hero-btn-order-now"
              onClick={handleOrderNow}
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 sm:gap-2 text-center cursor-pointer transform hover:-translate-y-0.5"
            >
              <ShoppingBag className="w-4 h-4 text-amber-100 shrink-0" />
              <span className="text-[12px] sm:text-sm font-extrabold whitespace-nowrap">
                {language === 'km' ? 'បញ្ជាទិញឥឡូវនេះ' : language === 'zh' ? '立即订购' : 'Order Now'}
              </span>
            </button>
          </div>
        </div>

        {/* Highlight Image & Badges */}
        <div className="md:col-span-5 relative flex justify-center">
          <div className="relative w-full max-w-xs min-h-[220px] aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden shadow-lg border-2 border-white bg-slate-100">
            <img
              src="https://i.postimg.cc/Dz534vg7/IMG-20260708-135255.png"
              alt="Lumimei Product"
              className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== riceMaskImg) {
                  target.src = riceMaskImg;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Lumimei Star Product
              </span>
              <p className="text-sm font-bold leading-tight">
                {language === 'km'
                  ? 'ម៉ាសភក់ Lumimei Deep Purifying Clay Mask'
                  : language === 'zh'
                  ? 'Lumimei 深层净肤矿物泥膜'
                  : 'Lumimei Deep Purifying Clay Mask'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
