import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

export interface ExpenseRecord {
  id: string;
  title: string;
  category: 'raw_materials' | 'packaging' | 'delivery' | 'marketing' | 'operations' | 'other';
  amountUsd: number;
  date: string;
  note?: string;
  recordedBy: string;
  createdAt: string;
}

export type BusinessExpense = ExpenseRecord;

const EXPENSES_STORAGE_KEY = 'lumimei_business_expenses';

const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp_001',
    title: 'ទិញប្រេងដូងធម្មជាតិក្នុងស្រុក ៥០ លីត្រ',
    category: 'raw_materials',
    amountUsd: 125.0,
    date: '2026-08-25',
    note: 'ទិញពីកសិករខេត្តបាត់ដំបង សម្រាប់ផលិតប្រេងដូងសុទ្ធ',
    recordedBy: 'Admin',
    createdAt: new Date(Date.now() - 3600000 * 200).toISOString(),
  },
  {
    id: 'exp_002',
    title: 'កុម្ម៉ង់ដប និងប្រអប់វេចខ្ចប់ Lumimei Clay Mask',
    category: 'packaging',
    amountUsd: 88.5,
    date: '2026-08-28',
    note: 'ដបកែវ និងស្ទីគ័រប្រេនចំនួន ៣០០ ដប',
    recordedBy: 'Admin',
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
  },
  {
    id: 'exp_003',
    title: 'ថ្លៃសេវាដឹកជញ្ជូនរហ័សប្រចាំសប្តាហ៍ (J&T / Virak Buntham)',
    category: 'delivery',
    amountUsd: 45.0,
    date: '2026-09-01',
    note: 'ទូទាត់សេវាដឹកកញ្ចប់ទំនិញទៅតាមបណ្តាខេត្ត',
    recordedBy: 'Admin',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'exp_004',
    title: 'ការផ្សព្វផ្សាយ Facebook & TikTok Video Reviews',
    category: 'marketing',
    amountUsd: 60.0,
    date: '2026-09-02',
    note: 'វីដេអូបង្ហាញពីរបៀបប្រើប្រាស់ Clay Mask បំបាត់មុន',
    recordedBy: 'Admin',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

export function getLocalExpenses(): ExpenseRecord[] {
  try {
    const raw = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : INITIAL_EXPENSES;
  } catch {
    return INITIAL_EXPENSES;
  }
}

export function saveLocalExpenses(expenses: ExpenseRecord[]) {
  try {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
    window.dispatchEvent(new CustomEvent('expenses_updated', { detail: expenses }));
  } catch (err) {
    console.warn('Error saving local expenses:', err);
  }
}

export async function addExpense(expense: Omit<ExpenseRecord, 'id' | 'createdAt'>): Promise<ExpenseRecord> {
  const newId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record: ExpenseRecord = {
    ...expense,
    id: newId,
    createdAt: new Date().toISOString(),
  };

  const existing = getLocalExpenses();
  const updated = [record, ...existing];
  saveLocalExpenses(updated);

  try {
    const docRef = doc(db, 'expenses', newId);
    await setDoc(docRef, {
      ...record,
      createdAtServer: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firestore add expense fallback:', err);
  }

  return record;
}

export async function deleteExpense(expenseId: string): Promise<boolean> {
  const existing = getLocalExpenses();
  const updated = existing.filter((e) => e.id !== expenseId);
  saveLocalExpenses(updated);

  try {
    const docRef = doc(db, 'expenses', expenseId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete expense error:', err);
  }

  return true;
}

export function subscribeToExpenses(callback: (expenses: ExpenseRecord[]) => void): () => void {
  callback(getLocalExpenses());

  let unsubscribeFirestore: (() => void) | null = null;
  try {
    const colRef = collection(db, 'expenses');
    unsubscribeFirestore = onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const fsExpenses: ExpenseRecord[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as any;
          fsExpenses.push({
            id: d.id,
            title: data.title || '',
            category: data.category || 'other',
            amountUsd: Number(data.amountUsd) || 0,
            date: data.date || '',
            note: data.note,
            recordedBy: data.recordedBy || 'Admin',
            createdAt: data.createdAt || new Date().toISOString(),
          });
        });

        const localList = getLocalExpenses();
        const map = new Map<string, ExpenseRecord>();
        localList.forEach((e) => map.set(e.id, e));
        fsExpenses.forEach((e) => map.set(e.id, e));

        const sorted = Array.from(map.values()).sort(
          (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
        );
        saveLocalExpenses(sorted);
        callback(sorted);
      }
    });
  } catch (err) {
    console.warn('Firestore expenses onSnapshot error:', err);
  }

  const handleUpdate = () => callback(getLocalExpenses());
  window.addEventListener('expenses_updated', handleUpdate);

  return () => {
    if (unsubscribeFirestore) unsubscribeFirestore();
    window.removeEventListener('expenses_updated', handleUpdate);
  };
}
