import React from 'react';
import { Sparkles, ShieldCheck, Truck, QrCode, ArrowRight, Camera } from 'lucide-react';
import { Language } from '../types';
import riceMaskImg from '../assets/images/lumimei_rice_mask_1785063133244.jpg';

interface HeroBannerProps {
  language: Language;
  onOpenAiAdvisor: () => void;
  onOpenFaceScan: () => void;
  onSelectTag: (tag: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  language,
  onOpenAiAdvisor,
  onOpenFaceScan,
  onSelectTag,
}) => {
  const popularTags = [
    { labelKm: 'Lumimei Clay Mask', labelEn: 'Lumimei Clay Mask', labelZh: 'Lumimei 泥膜', tag: 'Lumimei' },
    { labelKm: 'Lumimei ប្រេងដូង', labelEn: 'Lumimei Coconut Oil', labelZh: 'Lumimei 椰子油', tag: 'sunscreen' },
    { labelKm: 'Lumimei សេរ៉ូម', labelEn: 'Lumimei Serum', labelZh: 'Lumimei 精华液', tag: 'serum' },
    { labelKm: 'Lumimei សាប៊ូ', labelEn: 'Lumimei Soap', labelZh: 'Lumimei 香皂', tag: 'mask' },
    { labelKm: 'ខ្មៅដៃគូសចិញ្ចើម', labelEn: 'Eyebrow Pencil', labelZh: '眉笔', tag: 'makeup' },
  ];

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-emerald-600/30 p-5 sm:p-7 mt-1.5 mb-6 shadow-md">
      {/* Decorative top-right green accent wave */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-100/40 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Text Content */}
        <div className="md:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-700 text-white text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
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
                <span className="font-opensans font-bold" style={{ fontFamily: "'Open Sans', sans-serif" }}>Lumimei</span> <span className="text-emerald-700 font-battambang">អ្នកឯកទេសថែរក្សាមុខមុនគ្រប់ប្រភេទ</span>
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
              <div className="space-y-1.5">
                <p className="font-semibold text-slate-800" style={{ fontSize: '23px' }}>មិនថាបងប្អូនកំពុងជួបបញ្ហា៖</p>
                <ul className="space-y-0.5 text-slate-700 pl-1">
                  <li style={{ fontSize: '17px' }}>• ស្បែកមុខខ្មៅស្រអាប់ មិនភ្លឺថ្លា និងរន្ធញើសធំ</li>
                  <li style={{ fontSize: '17px' }}>• ស្បែកមុខរោល ងាយប្រតិកម្ម ឬរលាក</li>
                  <li style={{ fontSize: '17px' }}>• សរសៃក្រហមលើផ្ទៃមុខ</li>
                </ul>
                <p className="pt-1 text-slate-600" style={{ fontSize: '17px' }}>
                  យើងក៏មានចំណេះដឹង និងបទពិសោធន៍ក្នុងការថែទាំបញ្ហាស្បែកទាំងនេះផងដែរ។ យើងនឹងជួយណែនាំវិធីថែទាំឱ្យសមស្របទៅតាមស្ថានភាពស្បែករបស់បងប្អូនម្នាក់ៗ។
                </p>
              </div>
            ) : language === 'zh' ? (
              <p>
                无论您面临暗沉、毛孔粗大、过敏红肿或红血丝等肌肤问题，我们拥有专业经验与知识，为您提供量身定制的针对性护肤指导。
              </p>
            ) : (
              <p>
                Whether you struggle with dullness, enlarged pores, sensitive breakouts, inflammation, or redness—our skin care experts provide personalized consultation and guidance tailored to your unique skin condition.
              </p>
            )}
          </div>

          {/* CTA Buttons - Square Buttons */}
          <div className="flex items-center gap-3 sm:gap-4 pt-2">
            <button
              onClick={onOpenFaceScan}
              className="w-28 sm:w-32 h-28 sm:h-32 aspect-square bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition flex flex-col items-center justify-center gap-2 p-3 text-center cursor-pointer transform hover:-translate-y-1 shrink-0"
            >
              <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-pulse" />
              <span className="text-xs sm:text-sm leading-tight">
                {language === 'km' ? 'Scan មុខ វិភាគស្បែក' : language === 'zh' ? 'AI 面部扫描' : 'AI Face Scan'}
              </span>
            </button>

            <button
              onClick={onOpenAiAdvisor}
              className="w-28 sm:w-32 h-28 sm:h-32 aspect-square bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-600 font-bold rounded-2xl shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2 p-3 text-center cursor-pointer transform hover:-translate-y-1 shrink-0"
            >
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-700" />
              <span className="text-xs sm:text-sm leading-tight text-emerald-900">
                {language === 'km' ? 'ពិគ្រោះស្បែកមុខ' : language === 'zh' ? 'AI 美肤测验' : 'AI Skincare Quiz'}
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
                // If postimg link fails, fallback to local image asset
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

          {/* Floating Badges */}
          <div className="absolute -bottom-2 sm:-bottom-3 left-1 sm:-left-2 bg-white/95 backdrop-blur-xs p-2 sm:p-2.5 rounded-xl shadow-md border border-emerald-100 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
            <div className="p-1 sm:p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800">
                {language === 'km' ? 'ទូទាត់ប្រាក់ KHQR' : language === 'zh' ? 'KHQR 扫码支付' : 'Instant KHQR'}
              </p>
              <p className="text-[9px] sm:text-[10px] text-slate-500">
                {language === 'km' ? 'ស្កេនបានគ្រប់ធនាគារ' : language === 'zh' ? '支持全柬各大银行' : 'Works with all banks'}
              </p>
            </div>
          </div>

          <div className="absolute -top-2 right-1 sm:-right-2 bg-white/95 backdrop-blur-xs p-2 sm:p-2.5 rounded-xl shadow-md border border-emerald-100 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
            <div className="p-1 sm:p-1.5 bg-teal-100 text-teal-700 rounded-lg">
              <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800">
                {language === 'km' ? 'ដឹកលឿន ២៤ខេត្តក្រុង' : language === 'zh' ? '全柬快运' : 'Express Delivery'}
              </p>
              <p className="text-[9px] sm:text-[10px] text-slate-500">
                {language === 'km' ? 'ភ្នំពេញ ដឹកក្នុងថ្ងៃ' : language === 'zh' ? '金边当日送达' : 'Phnom Penh Same-day'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
