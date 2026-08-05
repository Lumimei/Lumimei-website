import React, { useState } from 'react';
import { BookOpen, Clock, ArrowRight, X, Sparkles } from 'lucide-react';
import { BEAUTY_TIPS } from '../data/products';
import { BeautyTip, Language } from '../types';

interface BeautyTipsSectionProps {
  language: Language;
}

export const BeautyTipsSection: React.FC<BeautyTipsSectionProps> = ({ language }) => {
  const [selectedTip, setSelectedTip] = useState<BeautyTip | null>(null);

  return (
    <section className="my-10 bg-gradient-to-br from-rose-50/50 to-pink-50/30 rounded-3xl p-6 sm:p-8 border border-rose-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>{language === 'km' ? 'ចំណេះដឹងថែរក្សាស្បែក' : 'Beauty Journal & Tips'}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-opensans">
            {language === 'km' ? 'គន្លឹះថែរក្សាស្បែកមុខពីអ្នកជំនាញ' : 'Skincare Guides & Secrets'}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {BEAUTY_TIPS.map((tip) => (
          <div
            key={tip.id}
            onClick={() => setSelectedTip(tip)}
            className="group bg-white rounded-2xl overflow-hidden border border-rose-100 hover:border-rose-300 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row"
          >
            <div className="sm:w-2/5 aspect-4/3 sm:aspect-auto overflow-hidden">
              <img
                src={tip.image}
                alt={tip.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-4 sm:w-3/5 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between text-[11px] text-rose-600 font-semibold mb-1">
                  <span>{language === 'km' ? tip.categoryKm : tip.category}</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    {tip.readTime}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-rose-600 transition leading-snug">
                  {language === 'km' ? tip.titleKm : tip.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                  {language === 'km' ? tip.summaryKm : tip.summary}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-rose-600 group-hover:underline pt-2">
                <span>{language === 'km' ? 'អានបន្ថែម' : 'Read Article'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tip Detail Modal */}
      {selectedTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-rose-100">
            <button
              onClick={() => setSelectedTip(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white text-slate-700 rounded-full shadow-md transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="h-48 overflow-hidden relative">
              <img src={selectedTip.image} alt={selectedTip.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-5 text-white">
                <div>
                  <span className="text-xs font-bold text-rose-300 bg-rose-900/60 px-2.5 py-0.5 rounded-full">
                    {language === 'km' ? selectedTip.categoryKm : selectedTip.category}
                  </span>
                  <h3 className="text-lg font-bold mt-1 font-opensans">
                    {language === 'km' ? selectedTip.titleKm : selectedTip.title}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 text-xs leading-relaxed text-slate-700">
              {selectedTip.contentKm.map((para, i) => (
                <p key={i} className="p-2.5 bg-rose-50/40 rounded-xl border border-rose-100">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
