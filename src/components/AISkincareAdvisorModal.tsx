import React, { useState } from 'react';
import { X, Sparkles, Loader2, Check, ArrowRight, Bot, RefreshCw } from 'lucide-react';
import { Product, SkinType, Language } from '../types';
import { PRODUCTS } from '../data/products';

interface AISkincareAdvisorModalProps {
  isOpen: boolean;
  language: Language;
  onClose: () => void;
  onAddMultipleToCart: (products: Product[]) => void;
}

export const AISkincareAdvisorModal: React.FC<AISkincareAdvisorModalProps> = ({
  isOpen,
  language,
  onClose,
  onAddMultipleToCart,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<1 | 2>(1);
  const [skinType, setSkinType] = useState<SkinType>('oily');
  const [concerns, setConcerns] = useState<string[]>(['acne']);
  const [budget, setBudget] = useState<string>('budget-friendly');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ routine: string; advice: string } | null>(null);

  const skinTypeOptions = [
    { id: 'oily', labelKm: 'ស្បែកមុខខ្លាញ់ (Oily)', labelEn: 'Oily Skin' },
    { id: 'dry', labelKm: 'ស្បែកមុខស្ងួត (Dry)', labelEn: 'Dry Skin' },
    { id: 'sensitive', labelKm: 'ស្បែកស្តើង / ងាយរមាស់ (Sensitive)', labelEn: 'Sensitive' },
    { id: 'combination', labelKm: 'ស្បែកចម្រុះ (Combination)', labelEn: 'Combination' },
    { id: 'normal', labelKm: 'ស្បែកធម្មតា (Normal)', labelEn: 'Normal' },
  ];

  const concernOptions = [
    { id: 'acne', labelKm: 'ស្បែកមានមុន / ស្នាម', labelEn: 'Acne & Blemishes' },
    { id: 'hydration', labelKm: 'ខ្វះទឹក / ស្ងួតប្រេះ', labelEn: 'Dehydration & Dryness' },
    { id: 'brightening', labelKm: 'ស្បែកស្រអាប់ / ស្នាមជាំ', labelEn: 'Dark Spots & Dullness' },
    { id: 'antiaging', labelKm: 'ស្នាមជ្រួញ / ធ្លាក់ស្បែក', labelEn: 'Fine lines & Anti-aging' },
    { id: 'sensitive', labelKm: 'ស្បែកក្រហម / អាលែកហ្ស៊ី', labelEn: 'Redness & Irritation' },
  ];

  const toggleConcern = (id: string) => {
    if (concerns.includes(id)) {
      setConcerns(concerns.filter((c) => c !== id));
    } else {
      setConcerns([...concerns, id]);
    }
  };

  const handleConsult = async () => {
    setLoading(true);
    setStep(2);
    try {
      const response = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skinType,
          skinConcerns: concerns,
          budget,
          language,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({
        routine: language === 'km'
          ? '១. លាងមុខជាមួយ CeraVe Gentle Cleanser\n២. ប្រើតូណឺ Anua Heartleaf 77%\n៣. លាបឡេការពារកំដៅថ្ងៃ Beauty of Joseon'
          : '1. Cleanse with CeraVe Gentle Cleanser\n2. Tone with Anua Heartleaf 77%\n3. Protect with Beauty of Joseon Sunscreen',
        advice: language === 'km'
          ? 'ការថែរក្សាស្បែកទៀងទាត់រៀងរាល់ព្រឹក និងយប់ គឺជាកូនសោសំខាន់សម្រាប់ស្បែកភ្លឺថ្លា។'
          : 'Consistent skincare every morning and night is key to healthy skin.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Find matching products from store catalog
  const recommendedProducts = PRODUCTS.filter(
    (p) => p.skinTypes.includes('all') || p.skinTypes.includes(skinType) || concerns.some((c) => p.skinConcerns.includes(c))
  ).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-emerald-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight font-opensans">
                {language === 'km' ? 'អ្នកពិគ្រោះស្បែកមុខ AI' : 'AI Skincare Advisor'}
              </h3>
              <p className="text-xs text-emerald-100">
                {language === 'km' ? 'វិភាគស្បែក និងណែនាំឈុតថែរក្សាស្បែកផ្ទាល់ខ្លួន' : 'Personalized skin analysis & routine generator'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {step === 1 ? (
            <div className="space-y-6">
              {/* Question 1: Skin Type */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 block">
                  {language === 'km' ? '១. តើស្បែកមុខរបស់អ្នកស្ថិតក្នុងប្រភេទណា?' : '1. What is your skin type?'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {skinTypeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSkinType(opt.id as SkinType)}
                      className={`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer text-left ${
                        skinType === opt.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                          : 'border-slate-200 bg-slate-50/50 hover:border-emerald-300 text-slate-700'
                      }`}
                    >
                      {language === 'km' ? opt.labelKm : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Skin Concerns */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 block">
                  {language === 'km' ? '២. តើអ្នកមានបញ្ហាស្បែកមុខអ្វីខ្លះ?' : '2. What skin concerns do you have?'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {concernOptions.map((c) => {
                    const isSelected = concerns.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleConcern(c.id)}
                        className={`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                            : 'border-slate-200 bg-slate-50/50 hover:border-emerald-300 text-slate-700'
                        }`}
                      >
                        <span>{language === 'km' ? c.labelKm : c.labelEn}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Consultation Submit CTA */}
              <button
                onClick={handleConsult}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-yellow-200" />
                <span>
                  {language === 'km' ? 'វិភាគស្បែក និងបង្កើតឈុតសម្រាប់ខ្ញុំ' : 'Analyze Skin & Recommend Routine'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <h4 className="font-bold text-slate-800">
                    {language === 'km' ? 'AI កំពុងវិភាគស្បែកមុខរបស់អ្នក...' : 'AI is analyzing your skin profile...'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs">
                    {language === 'km'
                      ? 'កំពុងជ្រើសរើសរូបមន្ត និងផលិតផលដែលសមស្របបំផុតពី Beauty Bloom'
                      : 'Searching ingredients tailored to your specific skin needs'}
                  </p>
                </div>
              ) : (
                <div className="space-y-5 animate-fade-in">
                  {/* AI Output Card */}
                  <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/50 rounded-2xl border border-emerald-200 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                      <Bot className="w-4 h-4 text-emerald-600" />
                      <span>{language === 'km' ? 'ការណែនាំពី AI Skincare Specialist' : 'AI Specialist Recommendation'}</span>
                    </div>

                    <div className="text-xs sm:text-sm leading-relaxed text-slate-800 whitespace-pre-line font-opensans">
                      {result?.routine}
                    </div>

                    {result?.advice && (
                      <div className="text-xs p-3 bg-white/80 rounded-xl border border-emerald-100 text-slate-700 font-sans italic">
                        💡 {result.advice}
                      </div>
                    )}
                  </div>

                  {/* Matching Catalog Products */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {language === 'km' ? 'ផលិតផលសមស្របដែលមានក្នុងហាង Beauty Bloom' : 'Recommended Store Products'}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {recommendedProducts.map((prod) => (
                        <div key={prod.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                          <img src={prod.image} alt={prod.name} className="w-full aspect-square object-cover rounded-xl mb-2" referrerPolicy="no-referrer" />
                          <div>
                            <p className="text-[10px] font-bold text-emerald-700">{prod.brand}</p>
                            <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{language === 'km' ? prod.nameKm : prod.name}</h5>
                            <p className="text-xs font-extrabold text-slate-900 mt-1">${prod.priceUsd.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        onAddMultipleToCart(recommendedProducts);
                        onClose();
                      }}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>
                        {language === 'km' ? 'បន្ថែមឈុតទាំងនេះចូលក្នុងកន្ត្រក' : 'Add Entire Routine to Cart'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Reset Advisor */}
                  <div className="text-center">
                    <button
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 font-medium"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{language === 'km' ? 'ធ្វើការវិភាគស្បែកឡើងវិញ' : 'Start Over'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
