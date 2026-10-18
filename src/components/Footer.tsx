import React from 'react';
import { Sparkles, Phone, Mail, Clock, ShieldCheck, QrCode, BookOpen, Send, Truck } from 'lucide-react';
import { Language } from '../types';

interface FooterProps {
  language: Language;
  onNavigateToAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ language, onNavigateToAdmin }) => {
  return (
    <footer
      className="bg-[#2E8B57] text-[#FFFFFF] border-t-2 border-[#2E8B57] pt-12 pb-8 mt-16 text-xs"
      style={{
        paddingBottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Brand Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <img
              src="https://i.postimg.cc/t7GTTRX8/Logo-20260630-155252-0000.png"
              alt="Lumimei Logo"
              className="w-10 h-10 object-contain rounded-full bg-white p-0.5 shadow-xs shrink-0"
              referrerPolicy="no-referrer"
            />
            <span className="text-xl font-bold text-white font-opensans tracking-tight">
              Lumimei Cambodia
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-white font-medium pt-1">
            <ShieldCheck className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div className="text-white text-xs sm:text-sm leading-relaxed font-noto-sans-khmer">
              {language === 'km' ? (
                <>
                  <p className="font-bold">ផលិតផលខ្មែរ ធម្មជាតិសុទ្ធ ១០០% មិនមានជាតិបក់ជាតិកាត់។</p>
                  <p className="text-white/90 mt-1">អាចប្រើប្រាសបានចាប់ពីក្មេងអាយុ ១២ឆ្នាំឡើង ស្រីមានផ្ទៃពោះ ម្ដាយបំបៅដោះកូន គឺអាចប្រើបានទាំងអស់ ធានាសុវត្ថិភាពខ្ពស់ ១០០%</p>
                </>
              ) : language === 'zh' ? (
                <>
                  <p className="font-bold">100% 柬埔寨纯天然，不含剥皮漂白成分。</p>
                  <p className="text-white/90 mt-1">适合12岁以上儿童、孕妇、哺乳期妈妈使用，100%高安全保障。</p>
                </>
              ) : (
                <>
                  <p className="font-bold">100% Pure Natural Cambodian Product, Peeling-Free.</p>
                  <p className="text-white/90 mt-1">Safe for ages 12+, pregnant and nursing mothers — 100% guaranteed safety.</p>
                </>
              )}
            </div>
          </div>

          {/* Social Media Channels */}
          <div className="pt-2">
            <p className="text-xs font-bold text-white mb-2">
              {language === 'km' ? 'តាមដានពួកយើងតាមរយៈ៖' : language === 'zh' ? '关注我们的社交媒体：' : 'Follow Our Socials:'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://www.facebook.com/LumimeiCambodia"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 flex items-center justify-center transition shadow-xs hover:scale-105"
                title="Facebook: LumimeiCambodia"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a
                href="https://tiktok.com/@lumimeicambodia"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 flex items-center justify-center transition shadow-xs hover:scale-105"
                title="TikTok: @lumimeicambodia"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.3 1.54-1.29 2.54.02 1.07.61 2.07 1.53 2.59.9.52 2.06.55 2.99.07.91-.46 1.51-1.42 1.57-2.44.08-2.14.03-4.28.04-6.42-.01-3.25-.01-6.5 0-9.75z"/></svg>
              </a>
              <a
                href="http://t.me/Lumimeicambodia"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 flex items-center justify-center transition shadow-xs hover:scale-105"
                title="Telegram Channel: Lumimeicambodia"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
              <a
                href="https://t.me/Lumimeiadmin"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 flex items-center justify-center transition shadow-xs hover:scale-105"
                title="Telegram Admin: Lumimeiadmin"
              >
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
              <a
                href="mailto:lumimei.admin@gmail.com"
                className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 flex items-center justify-center transition shadow-xs hover:scale-105"
                title="Email: lumimei.admin@gmail.com"
              >
                <Mail className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Col 2: Skincare Knowledge */}
        <div className="space-y-3">
          <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-white/20 pb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-white" />
            <span>{language === 'km' ? 'ចំណេះដឹងសុខភាពស្បែកមុខ' : language === 'zh' ? '肌肤健康护理知识' : 'Skin Health Knowledge'}</span>
          </h4>
          <ul className="space-y-2 text-white text-xs">
            <li className="flex items-start gap-2">
              <span className="text-white">•</span>
              <span>{language === 'km' ? 'វិធីសម្អាតស្បែកមុខ ២ តង់ (Double Cleansing) ឱ្យស្អាតជ្រៅ' : 'Double Cleansing for deep pore purification'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white">•</span>
              <span>{language === 'km' ? 'វិធីថែទាំមុខមុន និងស្បែកងាយរោលប្រតិកម្ម' : 'Care tips for acne-prone and sensitive skin'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white">•</span>
              <span>{language === 'km' ? 'ជ្រើសរើសផលិតផលធម្មជាតិ ១០០% គ្មានជាតិបក់កាត់' : 'Choosing 100% natural, chemical-free skincare'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white">•</span>
              <span>{language === 'km' ? 'គន្លឹះផ្ដល់សំណើម និងថែបំប៉នស្បែកមុខឱ្យរលោងថ្លា' : 'Hydration secrets for a luminous, healthy glow'}</span>
            </li>
          </ul>
        </div>

        {/* Col 3: Contact Us */}
        <div className="space-y-3">
          <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-white/20 pb-2 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-white" />
            <span>{language === 'km' ? 'ទំនាក់ទំនងពួកយើង' : language === 'zh' ? '联系我们' : 'Contact Us'}</span>
          </h4>
          <ul className="space-y-2.5 text-white">
            <li>
              <a
                href="https://t.me/Lumimeiadmin"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-white hover:underline transition group"
              >
                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white group-hover:bg-white/30">
                  <Send className="w-3.5 h-3.5" />
                </div>
                <span>Telegram: <strong className="text-white">@Lumimeiadmin</strong></span>
              </a>
            </li>
            <li>
              <a
                href="mailto:lumimei.admin@gmail.com"
                className="flex items-center gap-2 text-white hover:underline transition group"
              >
                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white group-hover:bg-white/30">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span>lumimei.admin@gmail.com</span>
              </a>
            </li>
            <li className="pt-1 border-t border-white/20">
              <div className="flex items-center gap-2 text-white font-bold mb-1">
                <Truck className="w-4 h-4 text-white shrink-0" />
                <span>{language === 'km' ? 'មានសេវាដឹកជញ្ជូន២៤ខេត្តក្រុង' : language === 'zh' ? '全柬24省市快递配送' : 'Nationwide 24 Provinces Delivery'}</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Col 4: Easy Payments */}
        <div className="space-y-3">
          <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-white/20 pb-2">
            {language === 'km' ? 'ប្រព័ន្ធទូទាត់ប្រាក់ងាយស្រួល' : language === 'zh' ? '安全便捷支付方式' : 'Easy Payment Methods'}
          </h4>
          <p className="text-white text-xs">
            {language === 'km'
              ? 'ទូទាត់ប្រាក់ភ្លាមៗដោយសុវត្ថិភាពតាមរយៈ'
              : language === 'zh'
              ? '支持多种即时安全支付通道'
              : 'Secure & Instant payments supported by'}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              id="footer-khqr-badge-btn"
              onClick={() => {
                window.location.hash = '#khqr';
              }}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 active:scale-95 text-[#2E8B57] font-black text-xs rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition"
              title="Open ABA KHQR Payment"
            >
              <QrCode className="w-3.5 h-3.5 text-[#2E8B57]" />
              KHQR
            </button>
            <button
              type="button"
              id="footer-aba-badge-btn"
              onClick={() => {
                window.location.hash = '#khqr';
              }}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 active:scale-95 text-[#2E8B57] font-black text-xs rounded-lg shadow-xs cursor-pointer transition"
              title="Open ABA KHQR Payment"
            >
              ABA Pay
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-8 mt-8 border-t border-white/20 flex flex-col sm:flex-row items-center justify-center text-center text-white/90 text-[11px]">
        <p>© 2026 Lumimei Cambodia {language === 'km' ? 'រក្សាសិទ្ធិគ្រប់យ៉ាង.' : 'All Rights Reserved.'}</p>
      </div>
    </footer>
  );
};
