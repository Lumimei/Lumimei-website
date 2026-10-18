import React, { useRef } from 'react';
import { ProductPromoText } from '../../types';
import {
  ProductPromoCard,
  FONT_OPTIONS,
  COLOR_PRESETS,
  TITLE_SIZE_OPTIONS,
  CONTENT_SIZE_OPTIONS,
} from '../ProductPromoCard';
import {
  Megaphone,
  Sparkles,
  Type,
  Palette,
  ListOrdered,
  List,
  Bold,
  Eye,
  Plus,
  Trash2,
  HelpCircle,
} from 'lucide-react';

interface ProductPromoEditorProps {
  value?: ProductPromoText;
  onChange: (next: ProductPromoText) => void;
}

export const ProductPromoEditor: React.FC<ProductPromoEditorProps> = ({
  value,
  onChange,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const current: ProductPromoText = value || {
    enabled: false,
    badge: '🔥 ប្រូម៉ូសិនពិសេស',
    title: '',
    content: '',
    fontFamily: 'Battambang',
    primaryColor: '#2E8B57',
    backgroundColor: 'tint',
    titleFontSize: 'lg',
    contentFontSize: 'sm',
    listType: 'bullet',
    bulletItems: [],
    textAlignment: 'left',
  };

  const updateField = <K extends keyof ProductPromoText>(field: K, val: ProductPromoText[K]) => {
    onChange({
      ...current,
      [field]: val,
    });
  };

  // Helper to insert markdown or text into textarea at cursor position
  const insertTextAtCursor = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let replacement = '';
    if (selected) {
      replacement = `${prefix}${selected}${suffix}`;
    } else {
      replacement = `${prefix}${suffix}`;
    }

    const nextContent = text.substring(0, start) + replacement + text.substring(end);
    updateField('content', nextContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  // Insert Numbered List
  const handleInsertNumberedList = () => {
    const template = '\n1. ចំណុចទី១\n2. ចំណុចទី២\n3. ចំណុចទី៣\n';
    insertTextAtCursor(template);
  };

  // Insert Bulleted List
  const handleInsertBulletedList = () => {
    const template = '\n• ចំណុចពិសេសទី១\n• ចំណុចពិសេសទី២\n• ចំណុចពិសេសទី៣\n';
    insertTextAtCursor(template);
  };

  // Insert Bold
  const handleInsertBold = () => {
    insertTextAtCursor('**', '**');
  };

  // Quick preset templates
  const applyPromoTemplate = () => {
    onChange({
      ...current,
      enabled: true,
      badge: '🔥 ឱកាសពិសេស សម្រាប់ថ្ងៃនេះ',
      title: 'កម្មវិធីប្រូម៉ូសិនពិសេស ទិញភ្លាម ថែមជូនកាដូភ្លាមៗ!',
      content:
        '✨ ផលិតផលធម្មជាតិសុទ្ធ ១០០% ជួយថែរក្សា និងស្ដារស្បែកមុខឱ្យភ្លឺថ្លាម៉ត់រលោង\n\n' +
        'អត្ថប្រយោជន៍ និងការថែមជូនពិសេស៖\n' +
        '1. Free ដឹកជញ្ជូនទូទាំងប្រទេសកម្ពុជា\n' +
        '2. ទទួលបានពិន្ទុ Lumimei Points ទ្វេដង\n' +
        '3. ពិគ្រោះយោបល់ស្បែកមុខផ្ទាល់ជាមួយអ្នកជំនាញឥតគិតថ្លៃ',
      fontFamily: 'Battambang',
      primaryColor: '#E11D48',
      backgroundColor: 'tint',
      titleFontSize: 'lg',
      contentFontSize: 'sm',
      listType: 'bullet',
      bulletItems: current.bulletItems || [],
    });
  };

  const applyCareTemplate = () => {
    onChange({
      ...current,
      enabled: true,
      badge: '🌿 ព័ត៌មានលម្អិត & អត្ថប្រយោជន៍',
      title: 'រូបមន្តធម្មជាតិពិសេស គ្មានជាតិកាត់ សុវត្ថិភាពខ្ពស់',
      content:
        'ជួយព្យាបាលមុនកប់ មុនរលាក និងពង្រឹងរបាំងការពារស្បែកឱ្យរឹងមាំចេញពីខាងក្នុង៖\n' +
        '• ផ្សំពីរុក្ខជាតិធម្មជាតិសុទ្ធ មិនបង្កឱ្យក្រហាយ ឬរលាកស្បែក\n' +
        '• សម្អាតរន្ធញើសយ៉ាងជ្រៅ និងកាត់បន្ថយជាតិខ្លាញ់លើស\n' +
        '• សាកសមបំផុតសម្រាប់ស្បែកស្ដើង ស្បែកប្រតិកម្ម និងងាយកើតមុន',
      fontFamily: 'Kantumruy Pro',
      primaryColor: '#2E8B57',
      backgroundColor: 'tint',
      titleFontSize: 'lg',
      contentFontSize: 'sm',
      listType: 'bullet',
      bulletItems: current.bulletItems || [],
    });
  };

  // Structured bullet items handlers
  const handleAddBulletItem = () => {
    const list = [...(current.bulletItems || []), ''];
    updateField('bulletItems', list);
  };

  const handleUpdateBulletItem = (idx: number, text: string) => {
    const list = [...(current.bulletItems || [])];
    list[idx] = text;
    updateField('bulletItems', list);
  };

  const handleRemoveBulletItem = (idx: number) => {
    const list = (current.bulletItems || []).filter((_, i) => i !== idx);
    updateField('bulletItems', list);
  };

  return (
    <div className="space-y-4 pt-3 border-t-2 border-emerald-100/80 bg-gradient-to-b from-emerald-50/20 via-white to-white p-4 sm:p-5 rounded-3xl border">
      {/* Header with Enable Switch & Templates */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span>អត្ថបទផ្សព្វផ្សាយ / 推广文 (Promotional Copy)</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              កំណត់អត្ថបទផ្សព្វផ្សាយពិសេស ជ្រើសរើសពុម្ពអក្សរ ពណ៌ ទំហំ និងបញ្ជីរាយនានា
            </p>
          </div>
        </div>

        {/* Enable / Disable Checkbox Switch */}
        <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-2xs transition">
          <input
            type="checkbox"
            checked={!!current.enabled}
            onChange={(e) => updateField('enabled', e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-800">
            {current.enabled ? '✅ បើកបង្ហាញ (Enabled)' : '⚪ បិទ (Disabled)'}
          </span>
        </label>
      </div>

      {/* Quick Template Fill Buttons */}
      <div className="flex items-center flex-wrap gap-2 text-xs">
        <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>គំរូរហ័ស (Quick Templates)៖</span>
        </span>
        <button
          type="button"
          onClick={applyPromoTemplate}
          className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition cursor-pointer"
        >
          🔥 គំរូ Promotion ពិសេស
        </button>
        <button
          type="button"
          onClick={applyCareTemplate}
          className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition cursor-pointer"
        >
          🌿 គំរូ អត្ថប្រយោជន៍ផលិតផល
        </button>
        {(current.title || current.content) && (
          <button
            type="button"
            onClick={() => {
              onChange({
                ...current,
                badge: '',
                title: '',
                content: '',
                bulletItems: [],
              });
            }}
            className="px-2 py-1 rounded-xl text-slate-400 hover:text-rose-600 text-[11px] font-medium transition cursor-pointer ml-auto"
          >
            សម្អាតទិន្នន័យ (Clear)
          </button>
        )}
      </div>

      {/* Editor Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT COLUMN: Controls & Inputs */}
        <div className="space-y-3.5">
          {/* Badge & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-1 space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <span>ផ្លាកសញ្ញា (Badge)</span>
              </label>
              <input
                type="text"
                value={current.badge || ''}
                onChange={(e) => updateField('badge', e.target.value)}
                placeholder="ឧ. 🔥 ប្រូម៉ូសិនពិសេស"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <span>ចំណងជើងផ្សព្វផ្សាយ (Title / 标题) *</span>
              </label>
              <input
                type="text"
                value={current.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="បញ្ចូលចំណងជើងទាក់ទាញអារម្មណ៍..."
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-bold"
              />
            </div>
          </div>

          {/* 1. 选字体 (Font Selection) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-emerald-600" />
                <span>ពុម្ពអក្សរ (Font Family / 选字体)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {current.fontFamily || 'Battambang'}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => updateField('fontFamily', f.id)}
                  style={{ fontFamily: f.family }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition text-left truncate cursor-pointer ${
                    (current.fontFamily || 'Battambang') === f.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                  title={f.nameKm}
                >
                  {f.nameKm}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 原色 (Primary Color Palette) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-emerald-600" />
                <span>ពណ៌ចម្បង (Primary Color / 原色)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {current.primaryColor || '#2E8B57'}
              </span>
            </label>
            <div className="flex items-center flex-wrap gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => updateField('primaryColor', color.hex)}
                  className={`w-7 h-7 rounded-full border-2 transition cursor-pointer flex items-center justify-center shrink-0 shadow-2xs ${
                    (current.primaryColor || '#2E8B57') === color.hex
                      ? 'border-slate-900 scale-110 ring-2 ring-emerald-400'
                      : 'border-white hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.nameKm}
                />
              ))}

              {/* Custom Color Picker */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-0.5">
                <input
                  type="color"
                  value={current.primaryColor || '#2E8B57'}
                  onChange={(e) => updateField('primaryColor', e.target.value)}
                  className="w-5 h-5 rounded border-0 cursor-pointer p-0 bg-transparent"
                  title="ជ្រើសរើសពណ៌ផ្ទាល់ខ្លួន (Custom Hex)"
                />
                <input
                  type="text"
                  value={current.primaryColor || '#2E8B57'}
                  onChange={(e) => updateField('primaryColor', e.target.value)}
                  className="w-16 text-[10px] font-mono text-slate-700 uppercase focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Font Sizes (Title & Content) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">
                <span>ទំហំអក្សរចំណងជើង (Title Size)</span>
              </label>
              <select
                value={current.titleFontSize || 'lg'}
                onChange={(e) => updateField('titleFontSize', e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
              >
                {TITLE_SIZE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.labelKm}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">
                <span>ទំហំអក្សរខ្លឹមសារ (Content Size)</span>
              </label>
              <select
                value={current.contentFontSize || 'sm'}
                onChange={(e) => updateField('contentFontSize', e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
              >
                {CONTENT_SIZE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.labelKm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Background Style */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">
              <span>ម៉ូតផ្ទៃខាងក្រោយកាត (Card Background Style)</span>
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'tint', label: 'ពណ៌ស្រាល (Tint)' },
                { id: 'white', label: 'ពណ៌ស (White)' },
                { id: 'bordered', label: 'គែមបន្ទាត់ (Bordered)' },
              ].map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => updateField('backgroundColor', bg.id)}
                  className={`py-1.5 px-2 rounded-xl font-semibold border transition text-center cursor-pointer ${
                    (current.backgroundColor || 'tint') === bg.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Content Textarea with Toolbar for Lists */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="text-[11px] font-bold text-slate-700">
                <span>ខ្លឹមសារផ្សព្វផ្សាយ (Content / 内容) *</span>
              </label>

              {/* Toolbar for Numbered & Bulleted list */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={handleInsertNumberedList}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-slate-700 hover:text-emerald-700 shadow-2xs transition flex items-center gap-1 cursor-pointer"
                  title="បញ្ចូលបញ្ជីរាយលេខរៀង (Numbered List 1. 2. 3.)"
                >
                  <ListOrdered className="w-3 h-3 text-emerald-600" />
                  <span>1. 2. 3.</span>
                </button>

                <button
                  type="button"
                  onClick={handleInsertBulletedList}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-slate-700 hover:text-emerald-700 shadow-2xs transition flex items-center gap-1 cursor-pointer"
                  title="បញ្ចូលបញ្ជីរាយចំណុច (Bulleted List • • •)"
                >
                  <List className="w-3 h-3 text-emerald-600" />
                  <span>• Bullet</span>
                </button>

                <button
                  type="button"
                  onClick={handleInsertBold}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-slate-700 hover:text-emerald-700 shadow-2xs transition flex items-center gap-0.5 cursor-pointer"
                  title="អក្សរដិត (**Bold**)"
                >
                  <Bold className="w-3 h-3 text-slate-600" />
                  <span>Bold</span>
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              rows={6}
              value={current.content || ''}
              onChange={(e) => updateField('content', e.target.value)}
              placeholder="សរសេរខ្លឹមសារផ្សព្វផ្សាយនៅទីនេះ... 
អាចប្រើ 1. 2. 3. សម្រាប់លេខរៀង
ឬ • សម្រាប់សញ្ញាចុច
ឬ **អក្សរដិត** សម្រាប់ highlight"
              className="w-full text-xs p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium leading-relaxed"
            />
          </div>

          {/* Additional Structured List Items Builder */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <List className="w-3.5 h-3.5 text-emerald-600" />
                <span>ចំណុចរាយបន្ថែម (Structured List Items)</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateField('listType', current.listType === 'numbered' ? 'bullet' : 'numbered')}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                >
                  {current.listType === 'numbered' ? 'ម៉ូត៖ លេខរៀង (1, 2, 3)' : 'ម៉ូត៖ សញ្ញាធីក (•)'}
                </button>
                <button
                  type="button"
                  onClick={handleAddBulletItem}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>បន្ថែម</span>
                </button>
              </div>
            </div>

            {current.bulletItems && current.bulletItems.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {current.bulletItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 w-4 text-center shrink-0">
                      {current.listType === 'numbered' ? `${idx + 1}.` : '•'}
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleUpdateBulletItem(idx, e.target.value)}
                      placeholder={`ចំណុចទី ${idx + 1}...`}
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveBulletItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic">
                មិនទាន់មានចំណុចរាយបន្ថែមនៅឡើយទេ (អាចប្រើឧបករណ៍បញ្ជីខាងលើ ឬចុច «បន្ថែម»)
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Real-Time Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>មើលសាកល្បងផ្ទាល់ (Live Preview)</span>
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              បង្ហាញដូចអ្វីដែលអតិថិជននឹងបានឃើញ
            </span>
          </div>

          <div className="p-3 sm:p-4 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200">
            {current.title || current.content || (current.bulletItems && current.bulletItems.length > 0) ? (
              <ProductPromoCard
                promo={{
                  ...current,
                  enabled: true, // Always show preview in editor
                }}
                showCopyButton={true}
              />
            ) : (
              <div className="text-center py-10 space-y-2 text-slate-400">
                <Megaphone className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
                <p className="text-xs font-semibold">
                  សូមបញ្ចូលចំណងជើង ឬខ្លឹមសារផ្សព្វផ្សាយ ដើម្បីមើលសាកល្បងផ្ទាល់
                </p>
                <button
                  type="button"
                  onClick={applyPromoTemplate}
                  className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  + សាកល្បងជាមួយគំរូ Promotion ពិសេស
                </button>
              </div>
            )}
          </div>

          {/* Quick Guidance Tip */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 text-[11px] space-y-1">
            <div className="font-bold flex items-center gap-1 text-amber-900">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>គន្លឹះសរសេរអត្ថបទផ្សព្វផ្សាយ (Pro Tip)៖</span>
            </div>
            <p className="leading-relaxed">
              អត្ថបទផ្សព្វផ្សាយនេះនឹងបង្ហាញនៅពីលើ «ការពិពណ៌នាផលិតផល (Product Description Cards)» នៅក្នុងផ្ទាំងព័ត៌មានលម្អិតរបស់ផលិតផល។
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
