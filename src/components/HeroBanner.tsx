import React from 'react';
import { Language } from '../types';

interface HeroBannerProps {
  language: Language;
  onOpenAiAdvisor?: () => void;
  onOpenFreeAnalysis?: () => void;
  onSelectTag?: (tag: string) => void;
  onNavigateToProducts?: () => void;
}

const MUOYKIM_PHOTO_URL = 'https://i.postimg.cc/6Q7C9zJ3/IMG-20260916-113308.png';

export const HeroBanner: React.FC<HeroBannerProps> = ({
  language,
  onOpenAiAdvisor,
  onOpenFreeAnalysis,
  onNavigateToProducts,
}) => {
  const handleCtaClick = () => {
    if (onOpenAiAdvisor) {
      onOpenAiAdvisor();
    } else if (onOpenFreeAnalysis) {
      onOpenFreeAnalysis();
    } else if (onNavigateToProducts) {
      onNavigateToProducts();
    } else {
      const el = document.getElementById('products-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="lumimei-hero-section" className="w-full mt-1.5 mb-6">
      {/* =========================================================================
          1. 手机端 (< 768px):
             - Muoykim 真人大图 + 文字覆盖在图片上
             - 不要使用左右双栏
             - 比例 9:16，width: 100%，object-fit: cover, object-position: center top
             - border-radius: 18–22px (rounded-[20px])
             - 底部深绿色渐变 Overlay (保持人脸明亮，底部加深保障文字清晰)
             - 文字层：position: absolute, left: 20px, right: 20px, bottom: 24–32px, 全部 left aligned
         ========================================================================= */}
      <div className="block md:hidden w-full relative">
        <div className="relative w-full aspect-[9/16] min-h-[560px] max-h-[82vh] rounded-[20px] overflow-hidden shadow-lg border border-[#2E8B57]/30 bg-[#062017]">
          {/* Muoykim 真人高清图片 - 保持高清原图比例，object-fit: cover */}
          <img
            src={MUOYKIM_PHOTO_URL}
            alt="Muoykim ស្ថាបនិក Lumimei"
            className="w-full h-full object-cover object-top"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
          />

          {/* 摄影级多向渐变遮罩 (保持人脸明亮清透，文字所在左下区域加深)
              - 顶部 0%–35%: 完全透明，人脸与发丝清晰自然
              - 中部 35%–65%: 柔和过渡
              - 底部 65%–100%: 加深至 0.88–0.96，确保白色与薄荷绿 Khmer 文字达到 4.5:1+ 极佳对比度
              - 左侧增加水平微暗角，让左侧文字区域更加深邃
          */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(3, 20, 14, 0.96) 0%, rgba(3, 20, 14, 0.88) 34%, rgba(3, 20, 14, 0.52) 58%, rgba(3, 20, 14, 0.14) 75%, rgba(0, 0, 0, 0) 90%), linear-gradient(to right, rgba(3, 20, 14, 0.72) 0%, rgba(3, 20, 14, 0.32) 55%, rgba(0, 0, 0, 0) 100%)',
            }}
          />

          {/* 文字内容覆盖层: 位于图片左下方较暗位置，不遮挡人脸，左右保留至少 20px padding，容器宽度约 85% */}
          <div className="absolute left-[20px] bottom-[24px] sm:bottom-[30px] z-10 w-[88%] max-w-[85%] flex flex-col items-start text-left space-y-2.5 sm:space-y-3.5">
            {/* 1. 主标题: មុខឡើងមុនញឹកញាប់មែនទេ?
                - 白色、Noto Sans Khmer 粗体 (font-weight: 700)
                - 手机端字号: 22px
                - 舒展行高 (1.35)，添加轻微 text-shadow 避免融入背景
            */}
            <h1 className="text-white text-[22px] sm:text-[24px] font-bold font-noto-sans-khmer leading-[1.35] tracking-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
              {language === 'km'
                ? 'មុខឡើងមុនញឹកញាប់មែនទេ?'
                : language === 'zh'
                ? '面部经常反复长痘吗？'
                : 'Frequent Acne Breakouts?'}
            </h1>

            {/* 2. 重点副标题: កុំប្រញាប់ទិញផលិតផល
                - 高亮薄荷绿 #A2F1C5 (对比度极高)
                - 15px, font-weight: 600
                - text-shadow 加强边缘辨识度
            */}
            <div className="text-[15px] font-semibold font-noto-sans-khmer leading-[1.5] text-[#A2F1C5] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {language === 'km'
                ? 'កុំប្រញាប់ទិញផលិតផល'
                : language === 'zh'
                ? '先别急着盲目购买产品'
                : "Don't Rush into Buying Products"}
            </div>

            {/* 3. 身份标题: ខ្ញុំ Muoykim ស្ថាបនិក Lumimei
                - 白色、font-weight: 700
                - 18px, text-shadow 强化
            */}
            <div className="text-white text-[18px] font-bold font-noto-sans-khmer leading-[1.4] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {language === 'km'
                ? 'ខ្ញុំ Muoykim ស្ថាបនិក Lumimei'
                : language === 'zh'
                ? '我是 Muoykim，Lumimei 创始人'
                : 'I am Muoykim, Founder of Lumimei'}
            </div>

            {/* 4. 说明文字: ចង់ជួយបងប្អូនយល់ពីបញ្ហាស្បែកមុខខ្លួនឯង អោយបានច្បាស់មុននឹងប្រើប្រាស់ផលិតផល
                - 薄荷绿 #A2F1C5
                - 正文字号: 15px, font-weight: 500
                - line-height 舒适 (1.65)，不拥挤
            */}
            <p className="text-[15px] font-medium font-noto-sans-khmer leading-[1.65] text-[#A2F1C5] drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
              {language === 'km' ? (
                <>
                  ចង់ជួយបងប្អូនយល់ពីបញ្ហាស្បែកមុខខ្លួនឯង<br />
                  អោយបានច្បាស់មុននឹងប្រើប្រាស់ផលិតផល
                </>
              ) : language === 'zh' ? (
                '希望能帮助大家在挑选或使用产品前，先深入清晰地了解自己面部的真正皮肤问题'
              ) : (
                'Helping you clearly understand your skin concerns before choosing and using products'
              )}
            </p>

            {/* 5. CTA 按钮: វិភាគស្បែកមុខដោយឥតគិតថ្លៃ
                - 高度 48–52px (h-[48px] sm:h-[52px])
                - 高对比度背景色 #2E8B57 + 白色粗体文字 (font-weight: 700, 16px)
                - 充足 padding，按钮文字单行不挤压
            */}
            <div className="pt-1 w-full sm:w-auto">
              <button
                id="hero-mobile-cta-btn"
                onClick={handleCtaClick}
                className="h-[48px] sm:h-[50px] min-h-[48px] px-5 sm:px-6 bg-[#2E8B57] hover:bg-[#257347] active:scale-[0.98] border border-[#42b672]/30 text-white font-bold rounded-2xl shadow-lg transition-all inline-flex items-center justify-center gap-2.5 cursor-pointer font-noto-sans-khmer whitespace-nowrap"
              >
                <span className="text-[16px]">
                  {language === 'km'
                    ? 'វិភាគស្បែកមុខដោយឥតគិតថ្លៃ'
                    : language === 'zh'
                    ? '免费测肤'
                    : 'Free Skin Analysis'}
                </span>
                <span className="text-base font-bold translate-y-[-1px]">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. 电脑端 (>= 768px):
             - width: 100%, min-height: 620px 或 70–80vh
             - 左侧人物：46%
             - 右侧内容：54%
             - Hero 在一个 Desktop 屏幕内基本完整看到
             - 左侧：Muoykim 真人图片, object-fit: cover, object-position: center top, 高度填满 Hero
             - 右侧：文字全部 left aligned, 垂直居中或偏上
             - 顺序：1. 主标题, 2. 核心副标题, 3. 身份标题, 4. 简短说明, 5. CTA
         ========================================================================= */}
      <div className="hidden md:flex w-full min-h-[620px] lg:h-[72vh] max-h-[760px] rounded-[24px] overflow-hidden border-2 border-[#2E8B57]/30 bg-[#052219] relative shadow-lg">
        {/* 左侧人物：46% */}
        <div className="relative w-[46%] h-full shrink-0 overflow-hidden bg-[#041d15]">
          <img
            src={MUOYKIM_PHOTO_URL}
            alt="Muoykim ស្ថាបនិក Lumimei"
            className="w-full h-full object-cover object-top"
            referrerPolicy="no-referrer"
          />
          {/* 自然延伸的渐变过渡遮罩，让图片边缘与右侧背景无缝融合 */}
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-r from-transparent to-[#052219] pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#052219]/70 to-transparent pointer-events-none" />
        </div>

        {/* 右侧内容：54% */}
        <div className="w-[54%] h-full flex flex-col justify-center items-start text-left px-8 lg:px-12 xl:px-16 py-8 relative z-10">
          {/* 背景柔和光晕 */}
          <div className="absolute top-1/2 right-8 -translate-y-1/2 w-96 h-96 bg-[#2E8B57]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-start space-y-4 lg:space-y-5 max-w-xl">
            {/* 1. 主标题: មុខឡើងមុនញឹកញាប់មែនទេ?
                - 原色: 白色
                - 电脑端: 44–56px
                - font-weight: 700–800
            */}
            <h1 className="text-white text-[42px] lg:text-[48px] xl:text-[54px] font-bold font-noto-sans-khmer leading-[1.25] tracking-tight drop-shadow-sm">
              {language === 'km'
                ? 'មុខឡើងមុនញឹកញាប់មែនទេ?'
                : language === 'zh'
                ? '面部经常反复长痘吗？'
                : 'Frequent Acne Breakouts?'}
            </h1>

            {/* 2. 重点副标题: កុំប្រញាប់ទិញផលិតផល
                - 浅薄荷绿 #a2f1c5 (高对比度)
                - 电脑端: 30–40px
                - Bold
            */}
            <div
              className="text-[28px] lg:text-[34px] xl:text-[38px] font-semibold font-noto-sans-khmer leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
              style={{ color: '#a2f1c5' }}
            >
              {language === 'km'
                ? 'កុំប្រញាប់ទិញផលិតផល'
                : language === 'zh'
                ? '先别急着盲目购买产品'
                : "Don't Rush into Buying Products"}
            </div>

            {/* 3. 身份标题: ខ្ញុំ Muoykim ស្ថាបនិក Lumimei
                - 白色
                - 电脑端: 24–30px
                - Semi-bold
            */}
            <div className="text-white text-[24px] lg:text-[27px] xl:text-[29px] font-bold font-noto-sans-khmer leading-tight drop-shadow-sm">
              {language === 'km'
                ? 'ខ្ញុំ Muoykim ស្ថាបនិក Lumimei'
                : language === 'zh'
                ? '我是 Muoykim，Lumimei 创始人'
                : 'I am Muoykim, Founder of Lumimei'}
            </div>

            {/* 4. 说明文字: ចង់ជួយបងប្អូនយល់ពីបញ្ហាស្បែកមុខខ្លួនឯង អោយបានច្បាស់មុននឹងប្រើប្រាស់ផលិតផល
                - 浅薄荷绿 #a2f1c5 (高对比度)
                - 电脑端: 18–22px
                - line-height 1.6
            */}
            <p
              className="text-[18px] lg:text-[20px] xl:text-[21px] font-medium font-noto-sans-khmer leading-[1.65] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] max-w-lg"
              style={{ color: '#a2f1c5' }}
            >
              {language === 'km' ? (
                <>
                  ចង់ជួយបងប្អូនយល់ពីបញ្ហាស្បែកមុខខ្លួនឯង<br />
                  អោយបានច្បាស់មុននឹងប្រើប្រាស់ផលិតផល
                </>
              ) : language === 'zh' ? (
                '希望能帮助大家在挑选与使用护肤产品前，先清晰、全面地了解自己的面部肌肤问题'
              ) : (
                'Helping you clearly understand your skin concerns before choosing routines and using products'
              )}
            </p>

            {/* 5. CTA: វិភាគស្បែកមុខដោយឥតគិតថ្លៃ →
                - 样式: 背景 #2E8B57, 白色文字
                - 电脑端: 18–20px, 高度 52–58px
                - font-weight: 700 (粗体)
            */}
            <div className="pt-2">
              <button
                id="hero-desktop-cta-btn"
                onClick={handleCtaClick}
                className="h-[54px] px-8 bg-[#2E8B57] hover:bg-[#257347] active:scale-98 border border-[#42b672]/30 text-white text-[18px] lg:text-[19px] font-bold rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-3 cursor-pointer font-noto-sans-khmer"
              >
                <span>
                  {language === 'km'
                    ? 'វិភាគស្បែកមុខដោយឥតគិតថ្លៃ'
                    : language === 'zh'
                    ? '免费测肤'
                    : 'Free Skin Analysis'}
                </span>
                <span className="text-xl font-bold">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

