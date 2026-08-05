import React from 'react';
import { Sparkles, MapPin, Phone, Mail, Clock, ShieldCheck, QrCode } from 'lucide-react';
import { Language } from '../types';

interface FooterProps {
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  return (
    <footer className="bg-emerald-950 text-emerald-100 border-t-2 border-emerald-700 pt-12 pb-8 mt-16 text-xs">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Brand Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white text-emerald-800 flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-700" />
            </div>
            <span className="text-xl font-bold text-white font-opensans tracking-tight">
              Lumimei Cambodia
            </span>
          </div>
          <p className="text-emerald-200/90 text-xs leading-relaxed">
            {language === 'km'
              ? 'ហាងលក់ផលិតផលថែរក្សាស្បែក និងគ្រឿងសម្អាតខ្មែរសុទ្ធ ១០០% មិនមានជាតិបក់ជាតិកាត់ ធានាសុវត្ថិភាពខ្ពស់ ជាមួយសេវាកម្មដឹកជញ្ជូនលឿន និងទូទាត់ KHQR ងាយស្រួល។'
              : language === 'zh'
              ? '100% 柬埔寨正品纯天然护肤品与美妆，无化学添加漂白，支持 KHQR 快捷支付与全柬配送。'
              : '100% pure authentic Khmer skincare & cosmetics, free from chemical bleaching agents. Fast shipping across Cambodia with instant KHQR payment.'}
          </p>
          <div className="flex items-center gap-2 text-white font-semibold pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span className="text-emerald-100">
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
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600/50 flex items-center justify-center transition shadow-xs hover:scale-105"
                title="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600/50 flex items-center justify-center transition shadow-xs hover:scale-105"
                title="TikTok"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.3 1.54-1.29 2.54.02 1.07.61 2.07 1.53 2.59.9.52 2.06.55 2.99.07.91-.46 1.51-1.42 1.57-2.44.08-2.14.03-4.28.04-6.42-.01-3.25-.01-6.5 0-9.75z"/></svg>
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600/50 flex items-center justify-center transition shadow-xs hover:scale-105"
                title="Telegram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600/50 flex items-center justify-center transition shadow-xs hover:scale-105"
                title="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600/50 flex items-center justify-center transition shadow-xs hover:scale-105"
                title="YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Col 2: Store Branches in Phnom Penh */}
        <div className="space-y-3">
          <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-emerald-800 pb-2">
            {language === 'km' ? 'សាខាហាងនៅភ្នំពេញ' : language === 'zh' ? '金边线下门店' : 'Phnom Penh Branches'}
          </h4>
          <ul className="space-y-2 text-emerald-200">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">{language === 'zh' ? '万景岗1分店 (BKK1):' : 'សាខាបឹងកេងកង ១ (BKK1):'}</strong> {language === 'km' ? 'ផ្លូវ ៥៧ កែង ផ្លូវ ២៨៨ ភ្នំពេញ' : language === 'zh' ? '金边 57路与 288路交叉口' : 'St. 57, BKK1, Phnom Penh'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">{language === 'zh' ? '堆谷分店 (Toul Kork):' : 'សាខាទួលគោក (Toul Kork):'}</strong> {language === 'km' ? 'ផ្លូវ ២៨៩ ជិតរង្វង់មូលទួលគោក' : language === 'zh' ? '金边 289路 堆谷转盘附近' : 'St. 289, Toul Kork, Phnom Penh'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <span>{language === 'km' ? 'បើកបម្រើសេវាកម្ម៖ 8:00 AM - 9:00 PM (រៀងរាល់ថ្ងៃ)' : language === 'zh' ? '营业时间：每天 8:00 AM - 9:00 PM' : 'Open Daily: 8:00 AM - 9:00 PM'}</span>
            </li>
          </ul>
        </div>

        {/* Col 3: Customer Care & Delivery */}
        <div className="space-y-3">
          <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-emerald-800 pb-2">
            {language === 'km' ? 'សេវាកម្មអតិថិជន & ដឹកជញ្ជូន' : language === 'zh' ? '客户服务与配送' : 'Customer Support & Delivery'}
          </h4>
          <ul className="space-y-2 text-emerald-200">
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-300" />
              <span className="text-white font-medium">096 123 4567 / 012 987 654</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-300" />
              <span>support@lumimeicambodia.kh</span>
            </li>
            <li className="pt-1">
              <p className="text-white font-bold mb-1">
                {language === 'km' ? 'ដៃគូដឹកជញ្ជូន២៤ខេត្តក្រុង៖' : language === 'zh' ? '合作快递物流公司：' : 'Delivery Partners:'}
              </p>
              <p className="text-[11px] text-emerald-200/80">
                J&T Express, VET Express, Virak Buntham, Cambodia Post
              </p>
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
            <span className="px-2.5 py-1 bg-white text-emerald-900 font-black text-xs rounded-lg shadow-xs border border-emerald-200">
              ACLEDA
            </span>
            <span className="px-2.5 py-1 bg-white text-emerald-900 font-black text-xs rounded-lg shadow-xs border border-emerald-200">
              VISA / Mastercard
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-8 mt-8 border-t border-emerald-800/80 text-center text-emerald-300/80 text-[11px]">
        <p>© 2026 Beauty Bloom Cambodia Co., Ltd. {language === 'km' ? 'រក្សាសិទ្ធិគ្រប់យ៉ាង' : 'All Rights Reserved'}.</p>
      </div>
    </footer>
  );
};
