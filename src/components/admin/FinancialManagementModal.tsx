import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  X,
  Calendar,
  Tag,
  FileText,
  PieChart,
  CheckCircle2,
  Receipt,
  Truck,
  Package,
  Layers,
} from 'lucide-react';
import {
  ExpenseRecord,
  subscribeToExpenses,
  addExpense,
  deleteExpense,
} from '../../lib/expenseService';

interface FinancialManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'km' | 'en' | 'zh';
  totalRevenueUsd: number;
  pendingRevenueUsd?: number;
}

export const FinancialManagementModal: React.FC<FinancialManagementModalProps> = ({
  isOpen,
  onClose,
  language,
  totalRevenueUsd,
  pendingRevenueUsd = 0,
}) => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseRecord['category']>('raw_materials');
  const [amountUsd, setAmountUsd] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToExpenses(setExpenses);
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const totalExpensesUsd = expenses.reduce((sum, e) => sum + (Number(e.amountUsd) || 0), 0);
  const netProfitUsd = totalRevenueUsd - totalExpensesUsd;

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amountUsd || isNaN(Number(amountUsd))) return;

    setSubmitting(true);
    try {
      await addExpense({
        title: title.trim(),
        category,
        amountUsd: parseFloat(amountUsd),
        date,
        note: note.trim(),
        recordedBy: 'Admin Lumimei',
      });
      setTitle('');
      setAmountUsd('');
      setNote('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('តើអ្នកពិតជាចង់លុបកំណត់ត្រាចំណាយនេះមែនទេ?')) return;
    await deleteExpense(id);
  };

  const getCategoryLabel = (cat: ExpenseRecord['category']) => {
    switch (cat) {
      case 'raw_materials':
        return language === 'km' ? 'គ្រឿងផ្សំធម្មជាតិ' : 'Raw Materials';
      case 'packaging':
        return language === 'km' ? 'ដប និងប្រអប់វេចខ្ចប់' : 'Packaging';
      case 'delivery':
        return language === 'km' ? 'សេវាដឹកជញ្ជូន' : 'Logistics/Delivery';
      case 'marketing':
        return language === 'km' ? 'ទីផ្សារ & Ads' : 'Marketing';
      case 'operations':
        return language === 'km' ? 'ប្រតិបត្តិការទូទៅ' : 'Operations';
      default:
        return language === 'km' ? 'ផ្សេងៗ' : 'Other';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-50 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 font-opensans">
                {language === 'km'
                  ? 'របាយការណ៍ ចំណូល និង ចំណាយ (Income & Expenses)'
                  : 'Revenue & Expense Financials'}
              </h2>
              <p className="text-xs text-slate-500 font-battambang">
                {language === 'km'
                  ? 'ពិនិត្យចំណូលពីការលក់ផលិតផល និងគ្រប់គ្រងការចំណាយប្រតិបត្តិការរបស់ Lumimei'
                  : 'Track sales income and business expenses for Lumimei Skincare'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Top 3 Financial Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Revenue */}
            <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">
                  {language === 'km' ? 'ចំណូលសរុប (Revenue)' : 'Total Revenue'}
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-950 font-opensans">
                ${totalRevenueUsd.toFixed(2)}
              </p>
              <p className="text-[11px] text-emerald-700">
                {language === 'km' ? 'បានទូទាត់រួចពីការកុម្ម៉ង់' : 'From completed orders'}
              </p>
            </div>

            {/* Card 2: Expenses */}
            <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800">
                  {language === 'km' ? 'ចំណាយសរុប (Expenses)' : 'Total Expenses'}
                </span>
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-950 font-opensans">
                ${totalExpensesUsd.toFixed(2)}
              </p>
              <p className="text-[11px] text-rose-700">
                {language === 'km' ? `មាន ${expenses.length} កំណត់ត្រាចំណាយ` : `${expenses.length} expense logs`}
              </p>
            </div>

            {/* Card 3: Net Profit */}
            <div
              className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
                netProfitUsd >= 0
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-teal-300'
                  : 'bg-rose-50 border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-900">
                  {language === 'km' ? 'ប្រាក់ចំណេញសុទ្ធ (Net Profit)' : 'Net Profit'}
                </span>
                <div className="w-7 h-7 rounded-lg bg-teal-200 text-teal-900 flex items-center justify-center">
                  <PieChart className="w-4 h-4" />
                </div>
              </div>
              <p
                className={`text-2xl font-black font-opensans ${
                  netProfitUsd >= 0 ? 'text-teal-950' : 'text-rose-950'
                }`}
              >
                ${netProfitUsd.toFixed(2)}
              </p>
              <p className="text-[11px] text-teal-800 font-medium">
                {language === 'km'
                  ? netProfitUsd >= 0
                    ? '✓ អាជីវកម្មមានចំណេញល្អ'
                    : '⚠ ចំណាយលើសចំណូល'
                  : 'Revenue minus expenses'}
              </p>
            </div>
          </div>

          {/* Add Expense Button / Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <span>{language === 'km' ? 'បញ្ជីចំណាយអាជីវកម្ម' : 'Expense Records'}</span>
              </h3>

              {!isAdding && (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'km' ? '+ កត់ត្រាចំណាយថ្មី' : '+ Add Expense'}</span>
                </button>
              )}
            </div>

            {/* Form to Add New Expense */}
            {isAdding && (
              <form onSubmit={handleAddExpense} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {language === 'km' ? 'ឈ្មោះចំណាយ / ពិពណ៌នា *' : 'Expense Title *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ឧ. ទិញប្រេងដូង ឬដបកែវ..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {language === 'km' ? 'ចំនួនទឹកប្រាក់ (USD) *' : 'Amount ($) *'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={amountUsd}
                      onChange={(e) => setAmountUsd(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {language === 'km' ? 'ប្រភេទចំណាយ' : 'Category'}
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600"
                    >
                      <option value="raw_materials">គ្រឿងផ្សំធម្មជាតិ (Raw Materials)</option>
                      <option value="packaging">ដប និងសម្ភារៈវេចខ្ចប់ (Packaging)</option>
                      <option value="delivery">សេវាដឹកជញ្ជូន (Delivery/Logistics)</option>
                      <option value="marketing">ទីផ្សារ & Ads (Marketing)</option>
                      <option value="operations">ប្រតិបត្តិការទូទៅ (Operations)</option>
                      <option value="other">ផ្សេងៗ (Other)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {language === 'km' ? 'កាលបរិច្ឆេទ' : 'Date'}
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    {language === 'km' ? 'កំណត់សម្គាល់បន្ថែម (Note)' : 'Additional Note'}
                  </label>
                  <input
                    type="text"
                    placeholder="ឧ. ទិញពីកសិករខេត្តបាត់ដំបង..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    {language === 'km' ? 'បោះបង់' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                  >
                    {submitting ? 'កំពុងរក្សាទុក...' : language === 'km' ? 'រក្សាទុកចំណាយ' : 'Save Expense'}
                  </button>
                </div>
              </form>
            )}

            {/* Expenses Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                    <th className="p-2.5 rounded-l-lg">{language === 'km' ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                    <th className="p-2.5">{language === 'km' ? 'ចំណងជើងចំណាយ' : 'Description'}</th>
                    <th className="p-2.5">{language === 'km' ? 'ប្រភេទ' : 'Category'}</th>
                    <th className="p-2.5 text-right">{language === 'km' ? 'ចំនួនទឹកប្រាក់' : 'Amount'}</th>
                    <th className="p-2.5 text-center rounded-r-lg">{language === 'km' ? 'សកម្មភាព' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        {language === 'km' ? 'មិនទាន់មានកំណត់ត្រាចំណាយនៅឡើយទេ' : 'No expenses recorded yet'}
                      </td>
                    </tr>
                  ) : (
                    expenses.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 font-medium text-slate-600 whitespace-nowrap">{item.date}</td>
                        <td className="p-2.5">
                          <p className="font-bold text-slate-900">{item.title}</p>
                          {item.note && <p className="text-[10px] text-slate-400 mt-0.5">{item.note}</p>}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {getCategoryLabel(item.category)}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-black text-rose-700 whitespace-nowrap">
                          -${Number(item.amountUsd).toFixed(2)}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(item.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="លុប"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            {language === 'km' ? 'បិទផ្ទាំង' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
