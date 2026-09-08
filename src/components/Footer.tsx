import React from 'react';
import { Sparkles, Phone, Mail, Clock, ShieldCheck, QrCode, BookOpen, Send, Truck } from 'lucide-react';
import { Language } from '../types';

interface FooterProps {
  language: Language;
  onNavigateToAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ language, onNavigateToAdmin }) => {
  return (
    <footer className="bg-emerald-950 text-emerald-100 border-t-2 border-emerald-700 pt-12 pb-8 mt-16 text-xs">
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
          <p className="text-emerald-200/90 text-xs leading-relaxed font-opensans">
            {language === 'km'
              ? 'Lumimei ជាផលិតផលថែរក្សាស្បែកមុខ យើងថែដោយក្តីស្រលាញ់និងយកចិត្តឬទុកដាក់ចំពោះស្បែកមុខបងប្អូនជាធំ គ្រៀងផ្សំដែលយើងយកមកផលិតគឺជាផលិតផលក្នុងស្រុក ធម្មជាតិសុទ្ធ ១០០% មិនមានជាតិបក់ជាតិកាត់ ធានាសុវត្ថិភាពខ្ពស់'
              : language === 'zh'
              ? 'Lumimei 专注于天然面部护肤，以关爱与呵护为本，选用100%本地纯天然成分，不含漂白剥皮化学物，安全有保障。'
              : 'Lumimei skincare products are crafted with love and deep care for your skin, using 100% local natural ingredients with zero harsh chemicals or peeling agents.'}
          </p>
          <div className="flex items-center gap-2 text-white font-semibold pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="text-emerald-100 text-xs">
              {language === 'km' 
                ? 'ផលិតផលខ្មែរសុទ្ធ ១០០% មិនមានជាតិបក់ជាតិកាត់' 
                : language === 'zh'
                ? '100% 正品保证 & 纯天然无化学添加'
                : '100% Authentic & Chemical-Free'}
            </span>
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
                className="w-8 h-8 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600/50 flex items-center justify-center transition shadow-xs hover:scale-105"
                title="Facebook: LumimeiCambodia"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a
                href="https://tiktok.com/@lumimeicambodia"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600/50 flex items-center justify-center transition shadow-xs hover:scale-105"
                title="TikTok: @lumimeicambodia"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.3 1.54-1.29 2.54.02 1.07.61 2.07 1.53 2.59.9.52 2.06.55 2.99.07.91-.46 1.51-1.42 1.57-2.44.08-2.14.03-4.28.04-6.42-.01-3.25-.01-6.5 0-9.75z"/></svg>
              </a>
              <a
                href="http://t.me/Lumimeicambodia"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600/50 flex items-center justify-center transition shadow-xs hover:scale-105"
                title="Telegram Channel: Lumimeicambodia"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
              <a
                href="https://t.me/Lumimeiadmin"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600/50 flex items-center justify-center transition shadow-xs hover:scale-105"
                title="Telegram Admin: Lumimeiadmin"
              >
                <svg className="w-4 h-4 fill-current text-teal-300" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
              <a
                href="mailto:lumimei.admin@gmail.com"
                className="w-8 h-8 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600/50 flex items-center justify-center transition shadow-xs hover:scale-105"
                title="Email: lumimei.admin@gmail.com"
              >
                <Mail className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Col 2: Skincare Knowledge */}
        <div className="space-y-3">
          <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-emerald-800 pb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
            <span>{language === 'km' ? 'ចំណេះដឹងសុខភាពស្បែកមុខ' : language === 'zh' ? '肌肤健康护理知识' : 'Skin Health Knowledge'}</span>
          </h4>
          <ul className="space-y-2 text-emerald-200/90 text-xs">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>{language === 'km' ? 'វិធីសម្អាតស្បែកមុខ ២ តង់ (Double Cleansing) ឱ្យស្អាតជ្រៅ' : 'Double Cleansing for deep pore purification'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>{language === 'km' ? 'វិធីថែទាំមុខមុន និងស្បែកងាយរោលប្រតិកម្ម' : 'Care tips for acne-prone and sensitive skin'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>{language === 'km' ? 'ជ្រើសរើសផលិតផលធម្មជាតិ ១០០% គ្មានជាតិបក់កាត់' : 'Choosing 100% natural, chemical-free skincare'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>{language === 'km' ? 'គន្លឹះផ្ដល់សំណើម និងថែបំប៉នស្បែកមុខឱ្យរលោងថ្លា' : 'Hydration secrets for a luminous, healthy glow'}</span>
            </li>
          </ul>
        </div>

        {/* Col 3: Contact Us */}
        <div className="space-y-3">
          <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-emerald-800 pb-2 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-emerald-300" />
            <span>{language === 'km' ? 'ទំនាក់ទំនងពួកយើង' : language === 'zh' ? '联系我们' : 'Contact Us'}</span>
          </h4>
          <ul className="space-y-2.5 text-emerald-200">
            <li>
              <a
                href="https://t.me/Lumimeiadmin"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-emerald-100 hover:text-white transition group"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-800 flex items-center justify-center text-teal-300 group-hover:bg-emerald-700">
                  <Send className="w-3.5 h-3.5" />
                </div>
                <span>Telegram: <strong className="text-white">@Lumimeiadmin</strong></span>
              </a>
            </li>
            <li>
              <a
                href="mailto:lumimei.admin@gmail.com"
                className="flex items-center gap-2 text-emerald-100 hover:text-white transition group"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-800 flex items-center justify-center text-emerald-300 group-hover:bg-emerald-700">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span>lumimei.admin@gmail.com</span>
              </a>
            </li>
            <li className="pt-1 border-t border-emerald-800/60">
              <div className="flex items-center gap-2 text-white font-bold mb-1">
                <Truck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>{language === 'km' ? 'មានសេវាដឹកជញ្ជូន២៤ខេត្តក្រុង' : language === 'zh' ? '全柬24省市快递配送' : 'Nationwide 24 Provinces Delivery'}</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Col 4: Easy Payments */}
        <div className="space-y-3">
          <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-emerald-800 pb-2">
            {language === 'km' ? 'ប្រព័ន្ធទូទាត់ប្រាក់ងាយស្រួល' : language === 'zh' ? '安全便捷支付方式' : 'Easy Payment Methods'}
          </h4>
          <p className="text-emerald-200 text-xs">
            {language === 'km'
              ? 'ទូទាត់ប្រាក់ភ្លាមៗដោយសុវត្ថិភាពតាមរយៈ'
              : language === 'zh'
              ? '支持多种即时安全支付通道'
              : 'Secure & Instant payments supported by'}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-2.5 py-1 bg-white text-emerald-900 font-black text-xs rounded-lg shadow-xs flex items-center gap-1 border border-emerald-200">
              <QrCode className="w-3.5 h-3.5 text-emerald-700" />
              KHQR
            </span>
            <span className="px-2.5 py-1 bg-white text-emerald-900 font-black text-xs rounded-lg shadow-xs border border-emerald-200">
              ABA Pay
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-8 mt-8 border-t border-emerald-800/80 flex flex-col sm:flex-row items-center justify-center text-center text-emerald-300/80 text-[11px]">
        <p>© 2026 Lumimei Cambodia {language === 'km' ? 'រក្សាសិទ្ធិគ្រប់យ៉ាង.' : 'All Rights Reserved.'}</p>
      </div>
    </footer>
  );
};
