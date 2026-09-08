import React from 'react';
import { X, Scan, Sparkles, Clock, Bell, ShieldCheck, ArrowRight } from 'lucide-react';
import { Language } from '../types';

interface ScanComingSoonModalProps {
  isOpen: boolean;
  language: Language;
  onClose: () => void;
  onOpenAiAdvisor?: () => void;
}

export const ScanComingSoonModal: React.FC<ScanComingSoonModalProps> = ({
  isOpen,
  language,
  onClose,
  onOpenAiAdvisor,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6 text-center border border-emerald-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Badge */}
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-100 via-emerald-100 to-teal-100 text-emerald-800 flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-inner">
          <Scan className="w-10 h-10 text-emerald-700 animate-pulse" />
          <span className="absolute -bottom-2 -right-2 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs border-2 border-white flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{language === 'km' ? 'មិនទាន់បើកដំណើរការ' : 'Coming Soon'}</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-extrabold text-slate-900 font-opensans leading-snug">
          {language === 'km'
            ? 'Scan វិភាគស្បែកមុខ'
            : language === 'zh'
            ? 'AI 面部肤质扫描'
            : 'Face Skin Scan'}
        </h3>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-black px-3 py-1 rounded-full mt-2 shadow-xs">
          <Clock className="w-3.5 h-3.5 text-white" />
          <span>{language === 'km' ? 'មិនទាន់បើកដំណើរការ' : language === 'zh' ? '暂未开放' : 'Coming Soon'}</span>
        </div>

        {/* Notice Message */}
        <p className="text-xs text-slate-700 mt-4 leading-relaxed font-semibold bg-amber-50/80 p-4 rounded-2xl border border-amber-200 text-center">
          {language === 'km'
            ? 'មុខងារ Scan វិភាគស្បែកមុខ មិនទាន់បើកដំណើរការនៅឡើយទេ។ ក្រុមការងារ Lumimei កំពុងរៀបចំ និងអភិវឌ្ឍប្រព័ន្ធនេះដើម្បីជូនអតិថិជនប្រើប្រាស់ក្នុងពេលឆាប់ៗខាងមុខនេះ។'
            : language === 'zh'
            ? 'AI 面部肤质扫描功能目前暂未开放。Lumimei 团队正在优化系统中，敬请期待！'
            : 'The Face Skin Scan feature is coming soon. The Lumimei team is currently developing this system.'}
        </p>

        {/* Actions */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-2xl shadow-md transition cursor-pointer"
          >
            {language === 'km' ? 'យល់ព្រម' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
