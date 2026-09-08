import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  db,
  doc,
  setDoc,
  collection,
  onSnapshot,
  getDocs,
  serverTimestamp,
  getMockUsers,
  saveMockUser,
} from '../../lib/firebase';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Award,
  Crown,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Edit,
  Trash2,
  Filter,
  ShoppingBag,
  DollarSign,
  PlusCircle,
  MinusCircle,
  Eye,
  Info,
  ShieldCheck,
  Tag,
  Volume2,
  VolumeX,
  Radio,
  Zap,
  Bell,
} from 'lucide-react';
import { Language } from '../../types';

export interface CustomerUser {
  id: string;
  uid?: string;
  phoneNumber: string;
  telegram?: string;
  fullName: string;
  displayName?: string;
  email?: string;
  skinConcern?: string;
  skinConcerns?: string[];
  acneDetails?: string;
  gender?: string;
  ageRange?: string;
  cityProvince?: string;
  points: number;
  tier: string;
  role?: string;
  status?: string;
  totalOrders?: number;
  totalSpentUsd?: number;
  totalSpent?: number;
  note?: string;
  preferredLanguage?: string;
  createdAt: any;
  updatedAt?: any;
}

interface CustomerManagementProps {
  language: Language;
}

// Synthesize pleasant double-tone audio chime using Web Audio API (Zero asset dependencies, 100% reliable)
const playChimeSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // Tone 1: High crisp pleasant note (659.25 Hz - E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: Harmonious resolution note (1046.50 Hz - C6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.3);
    gain2.gain.setValueAtTime(0.2, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.log('Audio playback info:', e);
  }
};

export const CustomerManagement: React.FC<CustomerManagementProps> = ({ language }) => {
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Real-time synchronization state & settings
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('lumimei_admin_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [newCustomerAlert, setNewCustomerAlert] = useState<CustomerUser | null>(null);
  const isInitialLoadRef = useRef(true);
  const prevCustomerIdsRef = useRef<Set<string>>(new Set());

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // View Customer Details Modal State
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<CustomerUser | null>(null);

  // Create Customer Modal Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createFormError, setCreateFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    telegram: '',
    fullName: '',
    email: '',
    skinConcern: '',
    gender: 'ស្រី (Female)',
    ageRange: '18 - 24 ឆ្នាំ',
    cityProvince: 'ភ្នំពេញ (Phnom Penh)',
    points: 15,
    tier: 'silver',
    status: 'active',
    note: '',
  });

  // Adjust Points Modal State
  const [selectedUserForPoints, setSelectedUserForPoints] = useState<CustomerUser | null>(null);
  const [pointDelta, setPointDelta] = useState<number>(10);
  const [pointReason, setPointReason] = useState('');
  const [adjustingPoints, setAdjustingPoints] = useState(false);

  // Toggle sound setting
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('lumimei_admin_sound_enabled', String(next));
    if (next) {
      playChimeSound();
    }
  };

  // Normalize Firestore Doc to CustomerUser
  const parseFirestoreUserDoc = (docId: string, rawData: any): CustomerUser => {
    const rawCreatedAt = rawData.createdAt;
    let formattedCreatedAt = '';
    if (rawCreatedAt?.toDate) {
      formattedCreatedAt = rawCreatedAt.toDate().toISOString();
    } else if (typeof rawCreatedAt === 'string') {
      formattedCreatedAt = rawCreatedAt;
    } else if (rawCreatedAt instanceof Date) {
      formattedCreatedAt = rawCreatedAt.toISOString();
    } else {
      formattedCreatedAt = new Date().toISOString();
    }

    const skinConcernsArr: string[] = Array.isArray(rawData.skinConcerns)
      ? rawData.skinConcerns
      : rawData.skinConcern
      ? [rawData.skinConcern]
      : [];

    return {
      id: docId,
      uid: rawData.uid || docId,
      fullName: (rawData.fullName || rawData.displayName || 'អតិថិជន').trim(),
      displayName: rawData.displayName,
      phoneNumber: rawData.phoneNumber || '',
      telegram: rawData.telegram || '',
      gender: rawData.gender || '',
      ageRange: rawData.ageRange || '',
      email: rawData.email || '',
      skinConcerns: skinConcernsArr,
      skinConcern: skinConcernsArr.join(', '),
      acneDetails: rawData.acneDetails || '',
      cityProvince: rawData.cityProvince || '',
      points: typeof rawData.points === 'number' ? rawData.points : 0,
      tier: rawData.tier || 'normal',
      role: rawData.role || 'user',
      status: rawData.status || 'active',
      totalOrders: typeof rawData.totalOrders === 'number' ? rawData.totalOrders : 0,
      totalSpentUsd: typeof rawData.totalSpentUsd === 'number' ? rawData.totalSpentUsd : (rawData.totalSpent || 0),
      note: rawData.note || '',
      preferredLanguage: rawData.preferredLanguage || 'km',
      createdAt: formattedCreatedAt,
      updatedAt: rawData.updatedAt,
    };
  };

  // Helper to translate skin concerns for badges
  const getSkinConcernLabels = (customer: CustomerUser): string[] => {
    const labels: string[] = [];
    const list = customer.skinConcerns && customer.skinConcerns.length > 0
      ? customer.skinConcerns
      : customer.skinConcern
      ? [customer.skinConcern]
      : [];

    list.forEach((item) => {
      const c = item.toLowerCase();
      if (c === 'acne' || c.includes('មុន')) {
        labels.push(customer.acneDetails ? `មុខមុន (${customer.acneDetails})` : 'មុខមុន (Acne)');
      } else if (c === 'melasma' || c === 'pigmentation' || c.includes('ជាំ') || c.includes('អាចម៍រុយ')) {
        labels.push('ជាំ អាចម៍រុយ');
      } else if (c === 'dry' || c === 'dryness' || c.includes('ស្ងួត')) {
        labels.push('ស្បែកស្ងួត');
      } else if (c === 'sensitive' || c.includes('ប្រតិកម្ម')) {
        labels.push('ស្បែកប្រតិកម្ម');
      } else if (c === 'pores' || c.includes('រន្ធញើស')) {
        labels.push('រន្ធញើសធំ/ខ្លាញ់');
      } else if (c === 'aging' || c.includes('ជ្រីវជ្រួញ')) {
        labels.push('ស្បែកជ្រីវជ្រួញ');
      } else if (c === 'dull' || c.includes('ស្រអាប់')) {
        labels.push('ស្បែកស្រអាប់');
      } else if (item.trim()) {
        labels.push(item);
      }
    });

    return labels;
  };

  // Helper to load all users directly from localStorage('app_users')
  const loadCustomersFromLocalStorage = (): CustomerUser[] => {
    const mockList = getMockUsers();
    if (!mockList || mockList.length === 0) return [];
    const parsed = mockList.map((m: any) => parseFirestoreUserDoc(m.uid || m.id, m));
    parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return parsed;
  };

  // Load all customers directly from Firestore users collection and backend API
  useEffect(() => {
    setLoading(true);
    setIsLiveConnected(true);
    setLastSyncTime(new Date());

    // 1. First load any cached data
    const initial = loadCustomersFromLocalStorage();
    if (initial.length > 0) {
      setCustomers(initial);
      setLoading(false);
    }

    // 2. Subscribe to Firestore users collection in real-time
    let unsubscribeFirestore: (() => void) | null = null;
    try {
      const usersColRef = collection(db, 'users');
      unsubscribeFirestore = onSnapshot(
        usersColRef,
        (snapshot) => {
          const fsUsers: CustomerUser[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const customer = parseFirestoreUserDoc(docSnap.id, data);
            fsUsers.push(customer);
            saveMockUser(customer as any, false);
          });
          fsUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          if (fsUsers.length > 0) {
            setCustomers(fsUsers);
          }
          setLoading(false);
          setLastSyncTime(new Date());
        },
        (err) => {
          console.warn('Firestore users onSnapshot subscription warning:', err);
          fetchCustomersFromApi();
        }
      );
    } catch (err) {
      console.warn('Could not initialize Firestore onSnapshot listener:', err);
      fetchCustomersFromApi();
    }

    // 3. Also fetch from backend API
    fetchCustomersFromApi();

    // Listen to local app_users updates across windows or in-app registration
    const handleUsersUpdated = (e: any) => {
      const updated = loadCustomersFromLocalStorage();
      if (updated.length > 0) {
        setCustomers(updated);
      }
      setLastSyncTime(new Date());

      if (e?.detail) {
        const newCust = parseFirestoreUserDoc(e.detail.uid || e.detail.id, e.detail);
        if (soundEnabled) {
          playChimeSound();
        }
        setNewCustomerAlert(newCust);
        setTimeout(() => {
          setNewCustomerAlert((prev) => (prev?.id === newCust.id ? null : prev));
        }, 7000);
      }
    };

    window.addEventListener('app_users_updated', handleUsersUpdated);
    window.addEventListener('mock_users_updated', handleUsersUpdated);
    window.addEventListener('storage', handleUsersUpdated);

    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
      window.removeEventListener('app_users_updated', handleUsersUpdated);
      window.removeEventListener('mock_users_updated', handleUsersUpdated);
      window.removeEventListener('storage', handleUsersUpdated);
    };
  }, [soundEnabled]);

  // Fetch from backend API as manual refresh trigger or fallback
  const fetchCustomersFromApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/admin/users');
      if (response.data && response.data.success && Array.isArray(response.data.users)) {
        const parsed = response.data.users.map((u: any) => parseFirestoreUserDoc(u.id || u.uid, u));
        parsed.sort((a: CustomerUser, b: CustomerUser) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        // Save to cache as well
        parsed.forEach((u: any) => saveMockUser(u as any, false));
        setCustomers(parsed);
      } else {
        const cached = loadCustomersFromLocalStorage();
        if (cached.length > 0) setCustomers(cached);
      }
    } catch (err: any) {
      console.warn('Fetch customers API fallback to localStorage:', err);
      const cached = loadCustomersFromLocalStorage();
      if (cached.length > 0) setCustomers(cached);
    } finally {
      setLoading(false);
      setLastSyncTime(new Date());
    }
  };

  const fetchCustomers = () => {
    fetchCustomersFromApi();
  };

  // Quick simulation trigger for new customer registration testing
  const handleSimulateNewCustomer = async () => {
    const sampleNames = ['សុខណា រស្មី (Sokna)', 'កញ្ញា ម៉ាលីកា (Malika)', 'ចាន់ ដារ៉ា (Dara)', 'ស៊ិន សុភាព (Sopheap)', 'ហេង លីនដា (Linda)'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const randomPhone = `+855 12 ${randomDigits.toString().slice(0, 3)} ${randomDigits.toString().slice(3)}`;
    const randomTelegram = `@user_${randomDigits.toString().slice(-4)}`;
    const uid = `sim_user_${Date.now()}`;

    const newSimCustomer = {
      uid,
      id: uid,
      fullName: randomName,
      displayName: randomName,
      phoneNumber: randomPhone,
      telegram: randomTelegram,
      gender: 'ស្រី (Female)',
      ageRange: '18 - 24 ឆ្នាំ',
      skinConcerns: ['ស្បែកមុខមុន / Acne', 'ស្បែកស្រអាប់ ចង់ភ្លឺថ្លា'],
      skinConcern: 'ស្បែកមុខមុន / Acne',
      points: 15,
      tier: 'silver',
      role: 'user',
      status: 'active',
      totalOrders: 0,
      totalSpentUsd: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, newSimCustomer, { merge: true });
    } catch (e: any) {
      console.error('Simulation write failed:', e);
      // Fallback via API
      await axios.post('/api/admin/users', {
        phoneNumber: randomPhone,
        fullName: randomName,
        telegram: randomTelegram,
        points: 15,
        tier: 'silver',
      });
    }
  };

  // Handle Create Customer Submit
  const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormError(null);

    // Validation
    if (!formData.phoneNumber.trim() || !formData.fullName.trim()) {
      setCreateFormError(
        language === 'zh'
          ? '请填写手机号码和客户姓名'
          : 'សូមបញ្ចូលលេខទូរស័ព្ទ និងឈ្មោះពេញរបស់អតិថិជន'
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post('/api/admin/users', {
        phoneNumber: formData.phoneNumber.trim(),
        telegram: formData.telegram.trim(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        skinConcern: formData.skinConcern.trim(),
        gender: formData.gender,
        cityProvince: formData.cityProvince,
        points: Number(formData.points) || 15,
        tier: formData.tier,
        status: formData.status,
        note: formData.note.trim(),
      });

      if (response.data && response.data.success) {
        // Also save immediately to local app_users
        const newUserObj: any = {
          uid: response.data.user?.id || `user_${Date.now()}`,
          id: response.data.user?.id || `user_${Date.now()}`,
          fullName: formData.fullName.trim(),
          displayName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          telegram: formData.telegram.trim(),
          email: formData.email.trim(),
          skinConcerns: [formData.skinConcern.trim()].filter(Boolean),
          gender: formData.gender,
          points: Number(formData.points) || 15,
          tier: formData.tier,
          role: 'user',
          createdAt: new Date().toISOString(),
        };
        saveMockUser(newUserObj, false);

        setSuccessMsg(
          response.data.msg_km ||
            (language === 'zh'
              ? '客户账户创建成功！'
              : 'បានបង្កើតគណនីអតិថិជនថ្មីដោយជោគជ័យ!')
        );
        setIsCreateModalOpen(false);
        // Reset form
        setFormData({
          phoneNumber: '',
          telegram: '',
          fullName: '',
          email: '',
          skinConcern: '',
          gender: 'ស្រី (Female)',
          ageRange: '18 - 24 ឆ្នាំ',
          cityProvince: 'ភ្នំពេញ (Phnom Penh)',
          points: 15,
          tier: 'silver',
          status: 'active',
          note: '',
        });
      } else {
        throw new Error(response.data?.error || 'Failed to create user');
      }
    } catch (err: any) {
      console.error('Create user error:', err);
      const errMsg =
        err.response?.data?.msg_km ||
        err.response?.data?.error ||
        err.message ||
        'មិនអាចបង្កើតគណនីបានទេ។ សូមពិនិត្យលេខទូរស័ព្ទឡើងវិញ។';
      setCreateFormError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Adjust Points Submit
  const handleAdjustPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPoints) return;

    setAdjustingPoints(true);
    try {
      const response = await axios.post('/api/admin/users/adjust-points', {
        userId: selectedUserForPoints.id,
        phoneNumber: selectedUserForPoints.phoneNumber,
        pointsDelta: Number(pointDelta),
        reason: pointReason.trim() || 'Admin manual point adjustment',
      });

      if (response.data && response.data.success) {
        setSuccessMsg(
          response.data.message ||
            (language === 'zh'
              ? '积分已成功调整！'
              : 'ពិន្ទុត្រូវបានកែប្រែដោយជោគជ័យ!')
        );
        setSelectedUserForPoints(null);
        setPointReason('');
      }
    } catch (err: any) {
      console.error('Adjust points error:', err);
      alert(err.response?.data?.error || 'Failed to adjust points');
    } finally {
      setAdjustingPoints(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmDelete = window.confirm(
      language === 'zh'
        ? `确定要删除客户 "${userName}" 的账户吗？`
        : `តើអ្នកប្រាកដជាចង់លុបគណនីអតិថិជន "${userName}" នេះមែនទេ?`
    );
    if (!confirmDelete) return;

    try {
      const response = await axios.post('/api/admin/users/delete', { userId });
      if (response.data && response.data.success) {
        setSuccessMsg(
          language === 'zh'
            ? '客户账户已删除'
            : `បានលុបគណនីអតិថិជន "${userName}" ជោគជ័យ`
        );
      }
    } catch (err: any) {
      console.error('Delete user error:', err);
      alert(err.response?.data?.msg_km || 'មិនអាចលុបគណនីបានទេ');
    }

    // Clean up local app_users and mock_users if present
    try {
      const raw = localStorage.getItem('app_users') || localStorage.getItem('mock_users');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const filtered = list.filter((m: any) => m.uid !== userId && m.id !== userId);
          localStorage.setItem('app_users', JSON.stringify(filtered));
          localStorage.setItem('mock_users', JSON.stringify(filtered));
          window.dispatchEvent(new CustomEvent('app_users_updated'));
          window.dispatchEvent(new CustomEvent('mock_users_updated'));
        }
      }
    } catch {}

    setCustomers((prev) => prev.filter((c) => c.id !== userId));
  };

  // Filtered customers
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (c.fullName && c.fullName.toLowerCase().includes(q)) ||
      (c.phoneNumber && c.phoneNumber.includes(q)) ||
      (c.telegram && c.telegram.toLowerCase().includes(q)) ||
      (c.skinConcern && c.skinConcern.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.cityProvince && c.cityProvince.toLowerCase().includes(q));

    const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesTier && matchesStatus;
  });

  // Calculate quick stats
  const totalPoints = customers.reduce((sum, c) => sum + (c.points || 0), 0);
  const activeMembers = customers.filter((c) => c.status !== 'inactive').length;
  const vipMembers = customers.filter(
    (c) => c.tier === 'gold' || c.tier === 'platinum' || c.tier === 'diamond'
  ).length;

  return (
    <div className="space-y-6 font-battambang animate-in fade-in">
      {/* Real-time New Customer Alert Floating Notification / Popup */}
      {newCustomerAlert && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-emerald-500/30 flex items-start gap-3.5 animate-in slide-in-from-top-6 duration-300">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 animate-bounce">
            <Bell className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {language === 'zh' ? '🎉 新客户实时注册' : '🎉 អតិថិជនថ្មីទើបចុះឈ្មោះ'}
              </span>
              <span className="text-[10px] text-slate-400">
                {language === 'zh' ? '刚刚' : 'អម្បាញ់មិញ'}
              </span>
            </div>
            <h4 className="font-bold text-sm text-white mt-1 truncate">
              {newCustomerAlert.fullName}
            </h4>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5 font-mono">
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>{newCustomerAlert.phoneNumber || newCustomerAlert.telegram || 'Online User'}</span>
              {newCustomerAlert.telegram && (
                <span className="text-blue-300">({newCustomerAlert.telegram})</span>
              )}
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedUserForDetails(newCustomerAlert);
                  setNewCustomerAlert(null);
                }}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{language === 'zh' ? '查看客户' : 'មើលព័ត៌មាន'}</span>
              </button>
              <button
                type="button"
                onClick={() => setNewCustomerAlert(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                {language === 'zh' ? '关闭' : 'បិទ'}
              </button>
            </div>
          </div>
          <button
            onClick={() => setNewCustomerAlert(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-opensans flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-700" />
              <span>
                {language === 'zh'
                  ? 'Customers (客户管理)'
                  : 'Customers (គ្រប់គ្រងគណនីអតិថិជន)'}
              </span>
            </h1>

            {/* Live Sync Status Indicator */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                isLiveConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                  : 'bg-amber-50 text-amber-800 border-amber-200/80'
              }`}
              title={
                language === 'zh'
                  ? `实时监听 Firestore: ${lastSyncTime.toLocaleTimeString()}`
                  : `ភ្ជាប់ការផ្សាយបន្តផ្ទាល់: ${lastSyncTime.toLocaleTimeString()}`
              }
            >
              <span className="relative flex h-2 w-2">
                {isLiveConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isLiveConnected ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                ></span>
              </span>
              <span>
                {isLiveConnected
                  ? language === 'zh'
                    ? '实时同步中 (Live)'
                    : 'ផ្សាយផ្ទាល់ (Live Sync)'
                  : language === 'zh'
                  ? 'REST API 连接'
                  : 'ភ្ជាប់តាម API'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-battambang mt-1">
            {language === 'zh'
              ? '实时从 Firestore 自动同步新注册客户、皮肤问题、Telegram 联系与积分等级，无需手动刷新。'
              : 'ទិន្នន័យអតិថិជនថ្មីធ្វើសមកាលកម្មស្វ័យប្រវត្តិ (Real-time Live Sync) ដោយផ្ទាល់ពី Firebase រួមមាន ឈ្មោះ លេខទូរស័ព្ទ/Telegram បញ្ហាស្បែកមុខ & ពិន្ទុ។'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sound Notification Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
              soundEnabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
            title={
              soundEnabled
                ? language === 'zh'
                  ? '新客户提示音: 已开启'
                  : 'សំឡេងជូនដំណឹង: បើក'
                : language === 'zh'
                ? '新客户提示音: 已静音'
                : 'សំឡេងជូនដំណឹង: បិទ'
            }
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-700" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
            <span className="hidden md:inline">
              {soundEnabled
                ? language === 'zh'
                  ? '提示音开'
                  : 'សំឡេងបើក'
                : language === 'zh'
                ? '提示音关'
                : 'សំឡេងបិទ'}
            </span>
          </button>

          {/* Quick Simulation Test Button */}
          <button
            type="button"
            onClick={handleSimulateNewCustomer}
            className="p-2.5 rounded-2xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            title={language === 'zh' ? '模拟前端新客户注册以测试实时同步' : 'សាកល្បងចុះឈ្មោះអតិថិជនថ្មី'}
          >
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">
              {language === 'zh' ? '模拟新注册' : 'សាកល្បងថ្មី'}
            </span>
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={fetchCustomers}
            disabled={loading}
            className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50"
            title="ទាញយកទិន្នន័យឡើងវិញ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-700' : ''}`} />
            <span className="hidden sm:inline">
              {language === 'zh' ? '刷新' : 'ផ្ទុកឡើងវិញ'}
            </span>
          </button>

          {/* Add Customer Modal Button */}
          <button
            type="button"
            onClick={() => {
              setCreateFormError(null);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-900/10 active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>
              {language === 'zh' ? '+ 添加客户 (Add Customer)' : '+ បញ្ចូលអតិថិជនថ្មី'}
            </span>
          </button>
        </div>
      </div>

      {/* Success Feedback Toast */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">
              {language === 'zh' ? '总客户数' : 'អតិថិជនសរុប'}
            </p>
            <p className="text-lg sm:text-xl font-black text-slate-900 font-opensans">
              {customers.length} <span className="text-xs font-normal text-slate-400">នាក់</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">
              {language === 'zh' ? '总累计积分' : 'ពិន្ទុសន្សំបូកសរុប'}
            </p>
            <p className="text-lg sm:text-xl font-black text-amber-700 font-opensans">
              {totalPoints.toLocaleString()} <span className="text-xs font-normal text-amber-500">Pts</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">
              {language === 'zh' ? 'VIP会员数 (Gold+)' : 'សមាជិក VIP (Gold+)'}
            </p>
            <p className="text-lg sm:text-xl font-black text-indigo-900 font-opensans">
              {vipMembers} <span className="text-xs font-normal text-slate-400">នាក់</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">
              {language === 'zh' ? '活跃账户' : 'គណនីសកម្ម'}
            </p>
            <p className="text-lg sm:text-xl font-black text-blue-900 font-opensans">
              {activeMembers} <span className="text-xs font-normal text-slate-400">គណនី</span>
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'zh'
                ? '按姓名、手机号、省市或邮箱搜索客户...'
                : 'ស្វែងរកតាមឈ្មោះ លេខទូរស័ព្ទ ខេត្ត/ក្រុង ឬអ៊ីមែល...'
            }
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">{language === 'zh' ? '所有等级' : 'គ្រប់កម្រិត Tier'}</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
              <option value="diamond">Diamond</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">{language === 'zh' ? '所有状态' : 'គ្រប់ស្ថានភាព'}</option>
              <option value="active">{language === 'zh' ? '正常活跃' : 'សកម្ម (Active)'}</option>
              <option value="inactive">{language === 'zh' ? '已暂停' : 'ផ្អាក (Inactive)'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer List Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading && customers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-700" />
            <p className="text-xs">
              {language === 'zh'
                ? '正在通过 API 获取客户数据...'
                : 'កំពុងទាញយកទិន្នន័យគណនីអតិថិជនពីប្រព័ន្ធ...'}
            </p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              {language === 'zh' ? '未找到符合条件的客户' : 'មិនមានទិន្នន័យអតិថិជនត្រូវនឹងការស្វែងរកឡើយ'}
            </p>
            <p className="text-xs text-slate-400">
              {language === 'zh'
                ? '请尝试更换搜索关键字或创建新客户'
                : 'សូមព្យាយាមស្វែងរកជាមួយពាក្យផ្សេង ឬចុចបង្កើតគណនីអតិថិជនថ្មី'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3.5 px-4">ឈ្មោះ & ភេទ/អាយុ</th>
                  <th className="py-3.5 px-4">លេខទូរស័ព្ទ / Telegram</th>
                  <th className="py-3.5 px-4">បញ្ហាស្បែកមុខ</th>
                  <th className="py-3.5 px-4">ពិន្ទុសន្សំ & កម្រិត</th>
                  <th className="py-3.5 px-4">ការបញ្ជាទិញ</th>
                  <th className="py-3.5 px-4">កាលបរិច្ឆេទ</th>
                  <th className="py-3.5 px-4 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCustomers.map((customer) => {
                  const tierColor =
                    customer.tier === 'diamond'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : customer.tier === 'platinum'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : customer.tier === 'gold'
                      ? 'bg-amber-100 text-amber-900 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                  const skinLabels = getSkinConcernLabels(customer);

                  let createdDateStr = '';
                  if (customer.createdAt) {
                    try {
                      const d = new Date(customer.createdAt);
                      if (!isNaN(d.getTime())) {
                        createdDateStr = d.toLocaleDateString('km-KH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        });
                      }
                    } catch {
                      createdDateStr = '';
                    }
                  }

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50/60 transition group"
                    >
                      {/* Name, Gender, Age & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0 uppercase">
                            {customer.fullName ? customer.fullName.substring(0, 2) : 'LM'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm font-battambang flex items-center gap-1.5">
                              <span>{customer.fullName}</span>
                            </p>
                            
                            {/* Gender & Age Pill */}
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {customer.gender && (
                                <span className="inline-flex items-center text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200/50">
                                  {customer.gender}
                                </span>
                              )}
                              {customer.ageRange && (
                                <span className="inline-flex items-center text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200/60">
                                  {customer.ageRange}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 font-mono">
                              <span>UID: {customer.id.substring(0, 10)}...</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Telegram */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-mono text-emerald-950 font-bold">
                            <Phone className="w-3 h-3 text-emerald-700 shrink-0" />
                            <span>{customer.phoneNumber || 'គ្មានលេខ'}</span>
                          </div>
                          {customer.telegram ? (
                            <div className="flex items-center gap-1.5 text-blue-700 text-[11px] font-medium">
                              <span className="font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 flex items-center gap-1">
                                <span>✈</span> {customer.telegram}
                              </span>
                            </div>
                          ) : customer.email ? (
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[150px]">{customer.email}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">គ្មាន Telegram</span>
                          )}
                        </div>
                      </td>

                      {/* Skin Concern & Acne details */}
                      <td className="py-3.5 px-4">
                        {skinLabels.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {skinLabels.map((lbl, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200/70"
                              >
                                {lbl}
                              </span>
                            ))}
                          </div>
                        ) : customer.note ? (
                          <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {customer.note}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">ស្បែកធម្មតា / មិនទាន់កំណត់</span>
                        )}
                      </td>

                      {/* Points & Tier */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-800 font-opensans bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60 flex items-center gap-1 text-[11px]">
                            <Award className="w-3 h-3 text-amber-600" />
                            {customer.points || 0} Pts
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase ${tierColor}`}
                          >
                            {customer.tier || 'silver'}
                          </span>
                        </div>
                      </td>

                      {/* Orders & Total Spent */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <ShoppingBag className="w-3 h-3 text-slate-400" />
                            <span>{customer.totalOrders || 0} កុម្ម៉ង់</span>
                          </div>
                          {(customer.totalSpentUsd || customer.totalSpent) ? (
                            <p className="text-[10px] text-emerald-700 font-semibold font-opensans">
                              ${(customer.totalSpentUsd || customer.totalSpent || 0).toFixed(2)}
                            </p>
                          ) : null}
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {createdDateStr || 'ថ្មីៗនេះ'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedUserForDetails(customer)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                            title="មើលព័ត៌មានលម្អិត"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForPoints(customer);
                              setPointDelta(10);
                              setPointReason('ថែមពិន្ទុរង្វាន់');
                            }}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                            title="កែសម្រួលពិន្ទុ"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">ពិន្ទុ</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(customer.id, customer.fullName)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 transition cursor-pointer"
                            title="លុបគណនី"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================= */}
      {/* POPUP MODAL: CREATE NEW CUSTOMER FORM                   */}
      {/* ======================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-emerald-100 my-8 space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg font-opensans">
                    {language === 'zh'
                      ? '创建新客户账户'
                      : 'បង្កើតគណនីអតិថិជនថ្មី'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'zh'
                      ? '通过 REST API 实时将新客户信息写入数据库'
                      : 'បញ្ចូលទិន្នន័យអតិថិជនថ្មីទៅក្នុងប្រព័ន្ធទិន្នន័យ'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error in modal */}
            {createFormError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{createFormError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateCustomerSubmit} className="space-y-4 text-xs">
              {/* Phone & Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    លេខទូរស័ព្ទ (Phone Number) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="ឧ. 012 345 678 ឬ +855..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ឈ្មោះពេញ (Full Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="ឧ. សុខា ចាន់ (Sokha Chan)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Telegram & Skin Concern */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Telegram (លេខទូរស័ព្ទ ឬ @Username)
                  </label>
                  <input
                    type="text"
                    value={formData.telegram}
                    onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                    placeholder="ឧ. @username ឬ 012345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    បញ្ហាស្បែកមុខ (Skin Concern)
                  </label>
                  <select
                    value={formData.skinConcern}
                    onChange={(e) => setFormData({ ...formData, skinConcern: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- ជ្រើសរើសបញ្ហាស្បែក --</option>
                    <option value="ស្បែកមុខមុន / Acne">ស្បែកមុខមុន (Acne)</option>
                    <option value="ជាំ អាចម៍រុយ / Melasma">ជាំ អាចម៍រុយ (Melasma / Dark Spots)</option>
                    <option value="ស្បែកស្ងួត ខ្វះជាតិទឹក / Dry Skin">ស្បែកស្ងួត ខ្វះជាតិទឹក (Dry Skin)</option>
                    <option value="ស្បែកខ្លាញ់ រន្ធញើសធំ / Oily Skin">ស្បែកខ្លាញ់ រន្ធញើសធំ (Oily Skin)</option>
                    <option value="ស្បែកងាយប្រតិកម្ម / Sensitive">ស្បែកងាយប្រតិកម្ម (Sensitive)</option>
                    <option value="ជ្រីវជ្រួញ វ័យចំណាស់ / Anti-Aging">ជ្រីវជ្រួញ វ័យចំណាស់ (Anti-Aging)</option>
                    <option value="ស្បែកស្រអាប់ ចង់ភ្លឺថ្លា / Dull Skin">ស្បែកស្រអាប់ ចង់ភ្លឺថ្លា (Dull Skin)</option>
                    <option value="ស្បែកធម្មតា / Normal Skin">ស្បែកធម្មតា (Normal Skin)</option>
                  </select>
                </div>
              </div>

              {/* Email & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    អ៊ីមែល (Email - ស្រេចចិត្ត)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="customer@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ភេទ (Gender)
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none cursor-pointer"
                  >
                    <option value="female">ស្រី (Female)</option>
                    <option value="male">ប្រុស (Male)</option>
                    <option value="other">ផ្សេងៗ (Other)</option>
                  </select>
                </div>
              </div>

              {/* City/Province & Membership Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    រាជធានី / ខេត្ត (Location)
                  </label>
                  <select
                    value={formData.cityProvince}
                    onChange={(e) => setFormData({ ...formData, cityProvince: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none cursor-pointer"
                  >
                    <option value="ភ្នំពេញ (Phnom Penh)">ភ្នំពេញ (Phnom Penh)</option>
                    <option value="សៀមរាប (Siem Reap)">សៀមរាប (Siem Reap)</option>
                    <option value="បាត់ដំបង (Battambang)">បាត់ដំបង (Battambang)</option>
                    <option value="ព្រះសីហនុ (Preah Sihanouk)">ព្រះសីហនុ (Preah Sihanouk)</option>
                    <option value="កំពង់ចាម (Kampong Cham)">កំពង់ចាម (Kampong Cham)</option>
                    <option value="កណ្ដាល (Kandal)">កណ្ដាល (Kandal)</option>
                    <option value="កំពត (Kampot)">កំពត (Kampot)</option>
                    <option value="តាកែវ (Takeo)">តាកែវ (Takeo)</option>
                    <option value="បន្ទាយមានជ័យ (Banteay Meanchey)">បន្ទាយមានជ័យ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    កម្រិតសមាជិក (Tier)
                  </label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="silver">🥈 Silver Member</option>
                    <option value="gold">🥇 Gold VIP Member</option>
                    <option value="platinum">💎 Platinum VIP Member</option>
                    <option value="diamond">👑 Diamond Royalty</option>
                  </select>
                </div>
              </div>

              {/* Starting Points & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ពិន្ទុចាប់ផ្ដើម (Starting Points)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none font-bold text-amber-700 font-opensans"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ស្ថានភាពគណនី (Status)
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none cursor-pointer"
                  >
                    <option value="active">សកម្ម (Active)</option>
                    <option value="inactive">ផ្អាកបណ្ដោះអាសន្ន (Inactive)</option>
                  </select>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ចំណាំបន្ថែម (Admin Note - ស្រេចចិត្ត)
                </label>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="ចំណាំព័ត៌មានស្បែកមុខ ឬការបញ្ចុះតម្លៃពិសេស..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition cursor-pointer"
                >
                  {language === 'zh' ? '取消' : 'បោះបង់'}
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md shadow-emerald-900/10 transition flex items-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{language === 'zh' ? '正在创建...' : 'កំពុងរក្សាទុក...'}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>
                        {language === 'zh' ? '确认创建账户' : 'បង្កើតគណនីថ្មី'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* POPUP MODAL: ADJUST POINTS MODAL                        */}
      {/* ======================================================= */}
      {selectedUserForPoints && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-opensans">
                    កែប្រែពិន្ទុអតិថិជន (Adjust Points)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedUserForPoints.fullName} ({selectedUserForPoints.phoneNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForPoints(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/60 flex items-center justify-between text-xs">
              <span className="text-amber-900 font-semibold">ពិន្ទុបច្ចុប្បន្ន:</span>
              <span className="font-bold font-opensans text-amber-800 text-sm">
                {selectedUserForPoints.points || 0} Pts
              </span>
            </div>

            <form onSubmit={handleAdjustPointsSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ចំនួនពិន្ទុដែលត្រូវថែម ឬកាត់ (Points Delta)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    value={pointDelta}
                    onChange={(e) => setPointDelta(Number(e.target.value))}
                    placeholder="+10 ឬ -5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-opensans text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPointDelta(Math.abs(pointDelta))}
                      className={`px-2.5 py-2 rounded-xl font-bold text-xs border ${
                        pointDelta > 0
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      + បូក
                    </button>
                    <button
                      type="button"
                      onClick={() => setPointDelta(-Math.abs(pointDelta || 10))}
                      className={`px-2.5 py-2 rounded-xl font-bold text-xs border ${
                        pointDelta < 0
                          ? 'bg-rose-600 text-white border-rose-700'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      - កាត់
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  មូលហេតុ (Reason)
                </label>
                <input
                  type="text"
                  value={pointReason}
                  onChange={(e) => setPointReason(e.target.value)}
                  placeholder="ឧ. រង្វាន់ទិញលើស $50, ការកែតម្រូវ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedUserForPoints(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={adjustingPoints}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {adjustingPoints ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Award className="w-3.5 h-3.5" />
                  )}
                  <span>រក្សាទុកពិន្ទុ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* POPUP MODAL: VIEW CUSTOMER PROFILE DETAILS MODAL        */}
      {/* ======================================================= */}
      {selectedUserForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-emerald-100 space-y-5 animate-in zoom-in-95 my-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shadow-xs uppercase">
                  {selectedUserForDetails.fullName ? selectedUserForDetails.fullName.substring(0, 2) : 'LM'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg font-battambang">
                    {selectedUserForDetails.fullName}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Cloud Firestore UID: {selectedUserForDetails.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Grid */}
            <div className="space-y-4 text-xs">
              {/* Phone & Telegram */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    លេខទូរស័ព្ទ (Phone Number)
                  </span>
                  <div className="flex items-center gap-1.5 font-bold font-mono text-emerald-950">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{selectedUserForDetails.phoneNumber || 'មិនបានបញ្ចូល'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    Telegram
                  </span>
                  <div className="flex items-center gap-1.5 font-semibold text-blue-700">
                    <span>✈</span>
                    <span>{selectedUserForDetails.telegram || 'គ្មាន'}</span>
                  </div>
                </div>
              </div>

              {/* Gender, Age & City */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">ភេទ (Gender)</span>
                  <span className="font-bold text-slate-800">
                    {selectedUserForDetails.gender || 'មិនទាន់បញ្ជាក់'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">អាយុ (Age)</span>
                  <span className="font-bold text-slate-800">
                    {selectedUserForDetails.ageRange || 'មិនទាន់បញ្ជាក់'}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">ទីតាំង (City)</span>
                  <span className="font-bold text-slate-800">
                    {selectedUserForDetails.cityProvince || 'ភ្នំពេញ'}
                  </span>
                </div>
              </div>

              {/* Skin Concerns & Acne Details */}
              <div className="bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100 space-y-2">
                <span className="text-[10px] text-rose-800 font-bold block">
                  បញ្ហាស្បែកមុខ (Skin Concerns & Details)
                </span>
                {getSkinConcernLabels(selectedUserForDetails).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {getSkinConcernLabels(selectedUserForDetails).map((label, i) => (
                      <span
                        key={i}
                        className="bg-white text-rose-800 font-semibold px-2.5 py-1 rounded-xl border border-rose-200 text-[11px] shadow-2xs"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">មិនមានបញ្ជាក់បញ្ហាស្បែកមុខឡើយ</p>
                )}
                {selectedUserForDetails.acneDetails && (
                  <div className="mt-1.5 pt-1.5 border-t border-rose-100 text-[11px] text-rose-900 font-medium">
                    <span className="font-bold">ប្រភេទមុន៖ </span>
                    <span>{selectedUserForDetails.acneDetails}</span>
                  </div>
                )}
              </div>

              {/* Points & Tier & Orders */}
              <div className="grid grid-cols-3 gap-3 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100 text-center">
                <div>
                  <span className="text-[10px] text-amber-800 font-bold block mb-0.5">ពិន្ទុសន្សំ</span>
                  <span className="text-base font-extrabold text-amber-900 font-opensans">
                    {selectedUserForDetails.points || 0} Pts
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 font-bold block mb-0.5">កម្រិត Tier</span>
                  <span className="text-xs font-bold text-amber-900 uppercase bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                    {selectedUserForDetails.tier || 'Silver'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 font-bold block mb-0.5">ការបញ្ជាទិញ</span>
                  <span className="text-base font-extrabold text-slate-800 font-opensans">
                    {selectedUserForDetails.totalOrders || 0}
                  </span>
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between border-t border-slate-100">
                <span>កាលបរិច្ឆេទចុះឈ្មោះ៖</span>
                <span className="font-mono text-slate-600">
                  {selectedUserForDetails.createdAt ? new Date(selectedUserForDetails.createdAt).toLocaleString('km-KH') : 'N/A'}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedUserForPoints(selectedUserForDetails);
                  setSelectedUserForDetails(null);
                }}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Award className="w-3.5 h-3.5" />
                <span>កែប្រែពិន្ទុ</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedUserForDetails(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition cursor-pointer text-xs"
              >
                បិទ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
