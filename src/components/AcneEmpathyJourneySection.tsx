import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Search,
  Frown,
  Users,
  ArrowRight,
} from 'lucide-react';
import { Language } from '../types';

import browsingSkincareImg from '../assets/images/browsing_skincare_recommend_1789145935502.jpg';
import disheartenedSkincareImg from '../assets/images/disheartened_skincare_1789145438989.jpg';

interface AcneEmpathyJourneySectionProps {
  language: Language;
  onOpenAiAdvisor?: () => void;
  onOpenFreeAnalysis?: () => void;
  onNavigateToProducts?: () => void;
}

export const AcneEmpathyJourneySection: React.FC<AcneEmpathyJourneySectionProps> = ({
  language,
  onOpenAiAdvisor,
  onOpenFreeAnalysis,
  onNavigateToProducts,
}) => {
  const handleOpenAction = () => {
    if (onOpenAiAdvisor) {
      onOpenAiAdvisor();
    } else if (onOpenFreeAnalysis) {
      onOpenFreeAnalysis();
    } else if (onNavigateToProducts) {
      onNavigateToProducts();
    } else {
      const el = document.getElementById('products-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  return (
    <section
      id="acne-empathy-journey-section"
      className="bg-[#F5DEB3]/20 rounded-3xl p-4 sm:p-7 border-2 border-[#2E8B57]/20 shadow-xs my-6 scroll-mt-28 font-battambang space-y-7 sm:space-y-9"
    >
      {/* ========================================================================= */}
      {/* 1. Title + Subtitle + Empathy List (Same format as ផលិតផលដែលមិនសាកសម?) + Banner */}
      {/* ========================================================================= */}
      <div className="space-y-4 sm:space-y-5">
        {/* Title: បងប្អូនដឹងអត់ - Font size: 26px, Centered - Color: #2E8B57 */}
        <div className="text-center">
          <h2
            className="font-extrabold text-[#2E8B57] tracking-tight leading-tight font-battambang"
            style={{ fontSize: '26px' }}
          >
            {language === 'km'
              ? 'បងប្អូនដឹងអត់'
              : language === 'zh'
              ? '大家知道吗？'
              : 'Did you know?'}
          </h2>
        </div>

        {/* Subtitle: Centered, Font size: 16px - Color: #2E8B57 */}
        <div
          className="text-center max-w-xl mx-auto text-[#2E8B57] font-medium leading-relaxed font-battambang py-1"
          style={{ fontSize: '16px' }}
        >
          {language === 'km' ? (
            <div className="space-y-0.5">
              <p>បញ្ហាស្បែកមុនមិនមែនរំខានតែស្បែកមុខ</p>
              <p>បងប្អូនប៉ុណ្ណោះទេ</p>
              <p className="font-extrabold text-[#2E8B57]">តែអាចធ្វើអោយបងប្អូន</p>
            </div>
          ) : language === 'zh' ? (
            <div className="space-y-0.5">
              <p>痘痘问题绝不仅仅困扰着您的面部皮肤，</p>
              <p className="font-extrabold text-[#2E8B57]">更可能会让您：</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <p>Acne problems do not just trouble your facial skin,</p>
              <p className="font-extrabold text-[#2E8B57]">they can also cause you to:</p>
            </div>
          )}
        </div>

        {/* Empathy Points List - Formatted like ផលិតផលដែលមិនសាកសម? */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#2E8B57]/20 shadow-2xs max-w-2xl mx-auto space-y-2.5 sm:space-y-3 font-battambang">
          {/* Item 1 */}
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-[#2E8B57]/20 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#2E8B57] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Frown className="w-3.5 h-3.5" />
            </div>
            <p className="text-[#2E8B57] font-bold text-sm sm:text-base leading-snug">
              {language === 'km'
                ? 'បាត់បង់ទំនុកចិត្តលើខ្លួនឯង'
                : language === 'zh'
                ? '失去对自己的自信'
                : 'Loss of self-confidence'}
            </p>
          </div>

          {/* Item 2 */}
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-[#2E8B57]/20 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#2E8B57] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Users className="w-3.5 h-3.5" />
            </div>
            <p className="text-[#2E8B57] font-bold text-sm sm:text-base leading-snug">
              {language === 'km'
                ? 'មិនសូវហ៊ានថតរូប ឬចេញទៅជួបអ្នកដទៃ'
                : language === 'zh'
                ? '不敢拍照或害怕与人社交聚会'
                : 'Hesitant to take photos or meet people'}
            </p>
          </div>

          {/* Item 3 */}
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-[#2E8B57]/20 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#2E8B57] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <p className="text-[#2E8B57] font-bold text-sm sm:text-base leading-snug">
              {language === 'km'
                ? 'តែងតែគិតពីរបៀបបិទបាំងមុន និងស្នាមមុន'
                : language === 'zh'
                ? '总是费尽心思琢磨如何遮掩痘痘与痘印'
                : 'Constantly worrying about concealing acne and marks'}
            </p>
          </div>
        </div>

        {/* Lumimei Insight Image */}
        <div className="w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs border border-[#2E8B57]/20 bg-white">
          <img
            src="https://i.postimg.cc/vHwY6Tn7/IMG-20260913-141015.png"
            alt="Lumimei Insight"
            className="w-full h-auto object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Format: Left Image, Right Text                                         */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-[#2E8B57]/20 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-center">
        {/* Left Image */}
        <div className="sm:col-span-5 aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden shadow-xs bg-white">
          <img
            src={browsingSkincareImg}
            alt="Browsing skincare recommendations"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Text */}
        <div className="sm:col-span-7 space-y-3 font-battambang">
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#2E8B57]/20 space-y-2">
            <p className="text-[#2E8B57] text-sm sm:text-base md:text-[17px] font-medium leading-relaxed">
              {language === 'km' ? (
                <span>
                  ពេលឃើញអ្នកដទៃណែនាំផលិតផលថ្មីៗ<br className="hidden sm:inline" />
                  បងប្អូនក៏ចង់សាកមួយហើយមួយទៀត
                </span>
              ) : language === 'zh' ? (
                <span>
                  每次看到别人推荐新产品，您总是忍不住想尝试了一款又一款
                </span>
              ) : (
                <span>
                  Seeing others recommend new products, you keep wanting to try one after another
                </span>
              )}
            </p>
            <p className="text-[#2E8B57] font-extrabold text-sm sm:text-base md:text-[17px] leading-relaxed">
              {language === 'km' ? (
                'ដោយសង្ឃឹមថា ផលិតផលបន្ទាប់នេះអាចជួយបាន'
              ) : language === 'zh' ? (
                '内心总怀着一丝希望：或许下一个产品就能真正帮到我？'
              ) : (
                'Hoping that the next product might finally be the one that helps.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Image Card with Green Brand Tone                                      */}
      {/* ========================================================================= */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs border border-[#2E8B57]/20 min-h-[170px] sm:min-h-[220px] flex items-center justify-center">
        <img
          src={disheartenedSkincareImg}
          alt="Disheartened with trials"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#2E8B57]/85 backdrop-blur-[1px]" />
        <div className="relative z-10 text-center px-4 py-6 sm:py-8 max-w-xl mx-auto space-y-1.5 text-white">
          <p className="text-white text-xs sm:text-sm font-semibold tracking-wider uppercase mb-1">
            The Reality
          </p>
          <div className="text-base sm:text-xl md:text-2xl font-bold leading-relaxed drop-shadow-sm font-battambang text-white">
            {language === 'km' ? (
              <span>
                ប៉ុន្តែពេលសាកច្រើនទៅ<br />
                <span className="font-extrabold text-white">បងប្អូនកាន់តែបាក់ទឹកចិត្ត</span><br />
                ហើយកាន់តែមិនដឹងថា គួរធ្វើម៉េចបន្ត។
              </span>
            ) : language === 'zh' ? (
              <span>
                可尝试得越多，<br />
                <span className="font-extrabold text-white">内心却越来越沮丧无助，</span><br />
                越来越不知接下来该如何是好。
              </span>
            ) : (
              <span>
                Yet the more you try,<br />
                <span className="font-extrabold text-white">the more disheartened you feel,</span><br />
                and increasingly lost on what to do next.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. Title + Question Boxes                                                 */}
      {/* ========================================================================= */}
      <div className="space-y-4 sm:space-y-5 pt-2">
        <h2
          className="font-extrabold text-[#2E8B57] leading-snug text-center tracking-tight"
          style={{ fontSize: '21px' }}
        >
          {language === 'km'
            ? 'តើបញ្ហាមកពី...'
            : language === 'zh'
            ? '那么，真正的问题究竟出在哪里？'
            : 'Could the real problem be...'}
        </h2>

        {/* Question Boxes */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#2E8B57]/20 shadow-2xs max-w-2xl mx-auto space-y-2.5 sm:space-y-3 font-battambang">
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-[#2E8B57]/20 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#2E8B57] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <p className="text-[#2E8B57] font-bold text-sm sm:text-base leading-snug">
              {language === 'km'
                ? 'ផលិតផលដែលមិនសាកសម?'
                : language === 'zh'
                ? '产品成分并不适合您的肤质？'
                : 'Unsuitable skincare products?'}
            </p>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-[#2E8B57]/20 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#2E8B57] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
            <p className="text-[#2E8B57] font-bold text-sm sm:text-base leading-snug">
              {language === 'km'
                ? 'វិធីថែស្បែកមិនទាន់ត្រឹមត្រូវ?'
                : language === 'zh'
                ? '护理步骤和使用手法并不正确？'
                : 'Incorrect skincare routine & technique?'}
            </p>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-[#2E8B57]/20 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#2E8B57] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Search className="w-3.5 h-3.5" />
            </div>
            <p className="text-[#2E8B57] font-bold text-sm sm:text-base leading-snug">
              {language === 'km'
                ? 'ឬមានកត្តាផ្សេងទៀតដែលមិនទាន់បានសង្កេត?'
                : language === 'zh'
                ? '或者还有其他未被察觉的生活与环境因素？'
                : 'Or other overlooked environmental / lifestyle triggers?'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. Pure Text + 3 Cards (Mobile 3 cards in 1 row, icon above text)         */}
      {/* ========================================================================= */}
      <div className="space-y-4 sm:space-y-5 pt-2">
        {/* Title above text block - Color: #2E8B57, font size: 21px */}
        <div className="text-center max-w-2xl mx-auto">
          <h2
            className="font-extrabold tracking-tight leading-snug font-battambang text-[#2E8B57]"
            style={{ fontSize: '21px' }}
          >
            {language === 'km' ? (
              <span className="block space-y-0.5">
                <span className="block">បងប្អូនមិនចាំបាច់បន្តសាកល្បង</span>
                <span className="block">ដោយគ្មានទិសដៅទៀតទេ</span>
              </span>
            ) : language === 'zh' ? (
              <span className="block space-y-0.5 font-opensans">
                <span className="block">您再也无需毫无方向地</span>
                <span className="block">盲目胡乱尝试了</span>
              </span>
            ) : (
              <span className="block space-y-0.5 font-opensans">
                <span className="block">You don't have to keep trying blindly</span>
                <span className="block">without clear direction anymore</span>
              </span>
            )}
          </h2>
        </div>

        {/* Text block before cards */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-[#2E8B57]/20 text-center max-w-2xl mx-auto shadow-2xs font-medium leading-relaxed text-[#2E8B57] font-battambang">
          {language === 'km' ? (
            <p className="text-base sm:text-lg font-bold text-[#2E8B57] leading-snug">
              ចាប់ផ្តើមពីការស្វែងយល់ពីស្បែកខ្លួនឯង<br />
              ជាមុនសិន ទើបយើងអាចដឹងថា
            </p>
          ) : language === 'zh' ? (
            <p className="text-base sm:text-lg font-bold text-[#2E8B57] leading-snug">
              从真正了解自己的皮肤现状开始，<br />
              我们才能清晰明了：
            </p>
          ) : (
            <p className="text-base sm:text-lg font-bold text-[#2E8B57] leading-snug">
              Start by understanding your skin first,<br />
              so we can clearly know:
            </p>
          )}
        </div>

        {/* 3 Cards: Mobile 1 row with 3 cards (grid-cols-3), Icon above text */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto pt-1">
          {/* Card 1: អ្វីគួរបន្ត */}
          <div className="bg-white border-2 border-[#2E8B57] rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 text-center shadow-2xs hover:shadow-md transition flex flex-col items-center justify-center">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-[#2E8B57] text-white flex items-center justify-center mb-1.5 sm:mb-2.5 shadow-xs">
              <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <p className="text-[#2E8B57] font-extrabold text-xs sm:text-base leading-tight">
              {language === 'km'
                ? 'អ្វីគួរបន្ត'
                : language === 'zh'
                ? '什么应继续'
                : 'What to keep'}
            </p>
          </div>

          {/* Card 2 (Middle): អ្វីគួរបញ្ឃប់ */}
          <div className="bg-white border-2 border-[#FF7F50] rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 text-center shadow-2xs hover:shadow-md transition flex flex-col items-center justify-center">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-[#FF7F50] text-white flex items-center justify-center mb-1.5 sm:mb-2.5 shadow-xs">
              <XCircle className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <p className="text-[#2E8B57] font-extrabold text-xs sm:text-base leading-tight">
              {language === 'km'
                ? 'អ្វីគួរបញ្ឃប់'
                : language === 'zh'
                ? '什么应停止'
                : 'What to stop'}
            </p>
          </div>

          {/* Card 3: អ្វីគួរធ្វើបន្ទាប់ទៀត */}
          <div className="bg-white border-2 border-[#2E8B57] rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 text-center shadow-2xs hover:shadow-md transition flex flex-col items-center justify-center">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-[#2E8B57] text-white flex items-center justify-center mb-1.5 sm:mb-2.5 shadow-xs">
              <Sparkles className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <p className="text-[#2E8B57] font-extrabold text-xs sm:text-base leading-tight">
              {language === 'km'
                ? 'អ្វីគួរធ្វើបន្ទាប់ទៀត'
                : language === 'zh'
                ? '下一步应做什么'
                : 'What to do next'}
            </p>
          </div>
        </div>

        {/* Below the 3 cards */}
        <div className="text-center pt-2 max-w-2xl mx-auto space-y-3.5">
          <p className="text-[#2E8B57] font-bold text-base sm:text-lg font-battambang leading-relaxed">
            {language === 'km'
              ? 'ដើម្បីឲ្យបងប្អូនសន្សំពេលសន្សំលុយតែទទួលបានប្រសិទ្ធភាពខ្ពស់'
              : language === 'zh'
              ? '为了让大家省时省钱，又能获得高效护肤效果'
              : 'To help you save time and money while achieving maximum effectiveness'}
          </p>

          {/* ចាប់ផ្តើម */}
          <p className="text-[#2E8B57] font-extrabold text-base sm:text-lg font-battambang">
            {language === 'km'
              ? 'ចាប់ផ្តើម'
              : language === 'zh'
              ? '立即开始'
              : 'Start Now'}
          </p>

          {/* CTA Button: វិភាគស្បែកមុខដោយឥតគិតថ្លៃ */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={handleOpenAction}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-[#2E8B57] hover:bg-[#257347] active:scale-[0.98] text-white font-extrabold text-base sm:text-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group"
            >
              <span>
                {language === 'km'
                  ? 'វិភាគស្បែកមុខដោយឥតគិតថ្លៃ'
                  : language === 'zh'
                  ? '免费进行皮肤分析'
                  : 'Free Skin Analysis'}
              </span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
