import React, { useState } from 'react';
import { ProductPromoText } from '../types';
import { Sparkles, CheckCircle2, Copy, Check, Megaphone } from 'lucide-react';

interface ProductPromoCardProps {
  promo?: ProductPromoText;
  className?: string;
  showCopyButton?: boolean;
}

export const FONT_OPTIONS = [
  { id: 'Battambang', nameKm: 'Battambang (ស្តង់ដារទូទៅ)', family: "'Battambang', sans-serif" },
  { id: 'Kantumruy Pro', nameKm: 'Kantumruy Pro (ទាន់សម័យ)', family: "'Kantumruy Pro', sans-serif" },
  { id: 'Moul', nameKm: 'Moul (អក្សរឆ្លាក់បុរាណ)', family: "'Moul', cursive" },
  { id: 'Koulen', nameKm: 'Koulen (ចំណងជើងដិត)', family: "'Koulen', cursive" },
  { id: 'Noto Sans Khmer', nameKm: 'Noto Sans Khmer (ស្រទន់)', family: "'Noto Sans Khmer', sans-serif" },
  { id: 'sans', nameKm: 'System Sans-Serif (អក្សរទំនើប)', family: "system-ui, -apple-system, sans-serif" },
  { id: 'serif', nameKm: 'Classic Serif (អក្សរបុរាណ)', family: "Georgia, Cambria, serif" },
];

export const COLOR_PRESETS = [
  { id: '#2E8B57', nameKm: 'Lumimei Green (បៃតងធម្មជាតិ)', hex: '#2E8B57' },
  { id: '#E11D48', nameKm: 'Rose Red (ក្រហមប្រូម៉ូសិន)', hex: '#E11D48' },
  { id: '#D97706', nameKm: 'Golden Amber (ទឹកក្រូចមាស)', hex: '#D97706' },
  { id: '#7C3AED', nameKm: 'Royal Purple (ស្វាយប្រណិត)', hex: '#7C3AED' },
  { id: '#0284C7', nameKm: 'Ocean Blue (ខៀវស្រស់)', hex: '#0284C7' },
  { id: '#0F172A', nameKm: 'Classic Dark (ខ្មៅថ្លៃថ្នូរ)', hex: '#0F172A' },
  { id: '#DB2777', nameKm: 'Beauty Pink (ផ្កាឈូក)', hex: '#DB2777' },
];

export const TITLE_SIZE_OPTIONS = [
  { id: 'sm', labelKm: 'តូច (14px)', className: 'text-sm font-bold' },
  { id: 'base', labelKm: 'មធ្យម (16px)', className: 'text-base font-bold' },
  { id: 'lg', labelKm: 'ធំល្មម (18px)', className: 'text-lg font-black' },
  { id: 'xl', labelKm: 'ធំ (20px)', className: 'text-xl font-black' },
  { id: '2xl', labelKm: 'ធំពិសេស (24px)', className: 'text-2xl font-black' },
];

export const CONTENT_SIZE_OPTIONS = [
  { id: 'xs', labelKm: 'តូច (12px)', className: 'text-xs' },
  { id: 'sm', labelKm: 'មធ្យម (14px)', className: 'text-sm' },
  { id: 'base', labelKm: 'ធំល្មម (16px)', className: 'text-base' },
  { id: 'lg', labelKm: 'ធំ (18px)', className: 'text-lg' },
];

/**
 * Parses markdown **bold** and basic formatting into React nodes
 */
function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-black text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export const ProductPromoCard: React.FC<ProductPromoCardProps> = ({
  promo,
  className = '',
  showCopyButton = true,
}) => {
  const [copied, setCopied] = useState(false);

  if (!promo || (!promo.title && !promo.content && (!promo.bulletItems || promo.bulletItems.length === 0))) {
    return null;
  }

  // Active styles
  const primaryColor = promo.primaryColor || '#2E8B57';
  const selectedFont = FONT_OPTIONS.find((f) => f.id === promo.fontFamily) || FONT_OPTIONS[0];
  const fontFamilyStyle = selectedFont.family;

  const titleSizeClass =
    TITLE_SIZE_OPTIONS.find((s) => s.id === promo.titleFontSize)?.className || 'text-base sm:text-lg font-black';

  const contentSizeClass =
    CONTENT_SIZE_OPTIONS.find((s) => s.id === promo.contentFontSize)?.className || 'text-xs sm:text-sm';

  const bgStyle = promo.backgroundColor || 'tint';

  // Handle content line-by-line parsing for numbered and bulleted lists
  const lines = (promo.content || '').split('\n');

  const handleCopy = () => {
    const fullText = [
      promo.badge ? `[${promo.badge}]` : '',
      promo.title || '',
      promo.content || '',
      ...(promo.bulletItems || []).map((item, i) => `${i + 1}. ${item}`),
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard?.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        fontFamily: fontFamilyStyle,
        borderColor: `${primaryColor}40`,
        backgroundColor:
          bgStyle === 'white'
            ? '#FFFFFF'
            : bgStyle === 'bordered'
            ? '#FAFAFA'
            : `${primaryColor}0D`, // ~5% opacity tint
      }}
      className={`rounded-2xl sm:rounded-3xl border-2 p-4 sm:p-5 shadow-xs relative transition-all duration-200 overflow-hidden ${className}`}
    >
      {/* Decorative top accent glow bar */}
      <div
        style={{ backgroundColor: primaryColor }}
        className="absolute top-0 left-0 right-0 h-1.5 opacity-90"
      />

      {/* Header Row: Badge, Title & Copy Action */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex-1 min-w-0 space-y-1.5">
          {promo.badge && (
            <div className="inline-flex items-center gap-1.5">
              <span
                style={{
                  backgroundColor: `${primaryColor}18`,
                  color: primaryColor,
                  borderColor: `${primaryColor}35`,
                }}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-black border flex items-center gap-1 shadow-2xs tracking-wide"
              >
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>{promo.badge}</span>
              </span>
            </div>
          )}

          {promo.title && (
            <h3
              style={{ color: primaryColor }}
              className={`${titleSizeClass} tracking-tight leading-snug flex items-center gap-2`}
            >
              <Megaphone className="w-4 h-4 shrink-0 opacity-80" />
              <span>{promo.title}</span>
            </h3>
          )}
        </div>

        {showCopyButton && (
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
            title="ចម្លងអត្ថបទផ្សព្វផ្សាយ (Copy Promo Text)"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Main Content Body */}
      {lines.length > 0 && lines.some((l) => l.trim().length > 0) && (
        <div className={`space-y-1.5 text-slate-800 ${contentSizeClass} leading-relaxed`}>
          {lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) {
              return <div key={idx} className="h-1.5" />;
            }

            // Detect Numbered list line: e.g. "1. ", "1- ", "១. "
            const numberedMatch = trimmed.match(/^([0-9០-៩]+)[\.\-\)]\s*(.*)$/);
            if (numberedMatch) {
              const num = numberedMatch[1];
              const text = numberedMatch[2];
              return (
                <div key={idx} className="flex items-start gap-2.5 py-0.5">
                  <span
                    style={{ backgroundColor: primaryColor }}
                    className="w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-2xs"
                  >
                    {num}
                  </span>
                  <div className="flex-1 min-w-0 font-medium">
                    {renderFormattedText(text)}
                  </div>
                </div>
              );
            }

            // Detect Bulleted list line: e.g. "• ", "- ", "* "
            const bulletMatch = trimmed.match(/^[\•\-\*]\s*(.*)$/);
            if (bulletMatch) {
              const text = bulletMatch[1];
              return (
                <div key={idx} className="flex items-start gap-2.5 py-0.5">
                  <span
                    style={{ backgroundColor: primaryColor }}
                    className="w-2 h-2 rounded-full shrink-0 mt-2 shadow-2xs"
                  />
                  <div className="flex-1 min-w-0 font-medium">
                    {renderFormattedText(text)}
                  </div>
                </div>
              );
            }

            // Normal text paragraph
            return (
              <p key={idx} className="font-medium">
                {renderFormattedText(trimmed)}
              </p>
            );
          })}
        </div>
      )}

      {/* Additional Structured Bullet/Numbered List Items (if configured) */}
      {promo.bulletItems && promo.bulletItems.filter(Boolean).length > 0 && (
        <div
          style={{ borderColor: `${primaryColor}25` }}
          className="mt-3 pt-3 border-t space-y-1.5"
        >
          {promo.bulletItems.filter(Boolean).map((item, idx) => (
            <div key={idx} className={`flex items-start gap-2.5 ${contentSizeClass}`}>
              {promo.listType === 'numbered' ? (
                <span
                  style={{ backgroundColor: primaryColor }}
                  className="w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-2xs"
                >
                  {idx + 1}
                </span>
              ) : (
                <span
                  style={{ color: primaryColor }}
                  className="shrink-0 mt-0.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              )}
              <span className="text-slate-800 font-medium">
                {renderFormattedText(item)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
