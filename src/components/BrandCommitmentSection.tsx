import React from 'react';
import { Heart, Sparkles, ShieldCheck } from 'lucide-react';
import { Language } from '../types';

interface BrandCommitmentSectionProps {
  language: Language;
}

const LUMIMEI_LOGO_URL = 'https://i.postimg.cc/t7GTTRX8/Logo-20260630-155252-0000.png';

export const BrandCommitmentSection: React.FC<BrandCommitmentSectionProps> = ({ language }) => {
  return (
    <section
      id="brand-commitment-section"
      className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-[#2E8B57]/20 shadow-xs my-6 scroll-mt-28 font-noto-sans-khmer"
    >
      {/* Top Logo */}
      <div className="flex flex-col items-center text-center">
        <img
          src={LUMIMEI_LOGO_URL}
          alt="Lumimei Skincare Logo"
          className="h-16 sm:h-20 w-auto object-contain drop-shadow-xs"
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Title */}
        <h2
          className="text-[#2E8B57] font-bold text-[21px] mt-3.5 mb-1 tracking-tight font-noto-sans-khmer"
        >
          {language === 'km' ? (
            'ហេតុអ្វីត្រូវជ្រើសរើស Lumimei?'
          ) : language === 'zh' ? (
            '为什么选择 Lumimei？'
          ) : (
            'Why Choose Lumimei?'
          )}
        </h2>

        {/* Subtitle / Lead-in: ពីព្រោះ */}
        <p
          className="text-[#2E8B57] font-semibold text-[16px] mb-5 sm:mb-6 font-noto-sans-khmer"
        >
          {language === 'km' ? (
            'ពីព្រោះ'
          ) : language === 'zh' ? (
            '因为：'
          ) : (
            'Because:'
          )}
        </p>
      </div>

      {/* 3 Cards Grid:
          - Mobile (< md): 2 columns. Card 1 & Card 2 in same row, Card 3 spans full row (col-span-2)
          - Desktop (>= md): 3 columns side by side (each col-span-1)
      */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-5">
        {/* Card 1: យើងថែដោយក្តីស្រលាញ់ */}
        <div className="col-span-1 bg-[#F7FBF9] hover:bg-[#EFF8F3] border border-[#2E8B57]/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center text-center shadow-xs transition-colors duration-200">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#2E8B57]/10 flex items-center justify-center mb-3 shrink-0">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-[#2E8B57] fill-[#2E8B57]/20" />
          </div>
          <p className="text-[#2E8B57] font-bold text-[14px] sm:text-[16px] leading-[1.5] font-noto-sans-khmer">
            {language === 'km' ? (
              'យើងថែដោយក្តីស្រលាញ់'
            ) : language === 'zh' ? (
              '我们用心呵护'
            ) : (
              'Caring with Love'
            )}
          </p>
        </div>

        {/* Card 2: យកចិត្តឬទុកដាក់ចំពោះស្បែកមុខបងប្អូនជាធំ */}
        <div className="col-span-1 bg-[#F7FBF9] hover:bg-[#EFF8F3] border border-[#2E8B57]/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center text-center shadow-xs transition-colors duration-200">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#2E8B57]/10 flex items-center justify-center mb-3 shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#2E8B57]" />
          </div>
          <p className="text-[#2E8B57] font-bold text-[14px] sm:text-[16px] leading-[1.5] font-noto-sans-khmer">
            {language === 'km' ? (
              'យកចិត្តឬទុកដាក់ចំពោះស្បែកមុខបងប្អូនជាធំ'
            ) : language === 'zh' ? (
              '以您的肌肤健康为重'
            ) : (
              'Prioritizing Your Skin Health'
            )}
          </p>
        </div>

        {/* Card 3: គ្រៀងផ្សំធម្មជាតិសុទ្ធ ១០០% មិនមានជាតិបក់ជាតិកាត់ ធានាសុវត្ថិភាពខ្ពស់ */}
        <div className="col-span-2 md:col-span-1 bg-[#F7FBF9] hover:bg-[#EFF8F3] border border-[#2E8B57]/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center text-center shadow-xs transition-colors duration-200">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#2E8B57]/10 flex items-center justify-center mb-3 shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#2E8B57]" />
          </div>
          <p className="text-[#2E8B57] font-bold text-[14px] sm:text-[16px] leading-[1.5] font-noto-sans-khmer max-w-sm">
            {language === 'km' ? (
              'គ្រៀងផ្សំធម្មជាតិសុទ្ធ ១០០% មិនមានជាតិបក់ជាតិកាត់ ធានាសុវត្ថិភាពខ្ពស់'
            ) : language === 'zh' ? (
              '100% 纯天然配方，不含任何脱皮刺激成分，安全放心'
            ) : (
              '100% Pure Natural Ingredients, Chemical-Peel Free & High Safety'
            )}
          </p>
        </div>
      </div>
    </section>
  );
};
