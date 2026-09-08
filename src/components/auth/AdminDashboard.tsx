import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Phone,
  Lock,
  KeyRound,
  CheckCircle2,
  Check,
  Search,
  RefreshCw,
  LogOut,
  ExternalLink,
  AlertCircle,
  ImageIcon,
  X,
  Package,
  Plus,
  Edit,
  Trash2,
  UploadCloud,
  DollarSign,
  Tag,
  Sparkles,
  Layers,
  FileText,
  Save,
  CheckSquare,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  MoveHorizontal,
  ArrowLeftRight,
  Users,
  ShoppingBag,
  Settings,
  Power,
  Cpu,
  LayoutDashboard,
  Home,
  TrendingUp,
  Coins,
  Receipt,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Language, Product, SkinType, ProductDescriptionCard } from '../../types';
import { CATEGORIES, SKIN_CONCERNS, BRANDS, KHR_RATE } from '../../data/products';
import {
  getAllStoredProducts,
  saveStoredProduct,
  deleteStoredProduct,
  saveProductsReorder,
  uploadImageFile,
  subscribeToProducts,
} from '../../utils/productManager';
import { CustomerManagement } from '../admin/CustomerManagement';
import { OrderManagement, AdminOrder } from '../admin/OrderManagement';
import { VerifyManagement } from '../admin/VerifyManagement';
import { FinancialManagementModal } from '../admin/FinancialManagementModal';
import { subscribeToQuizSubmissions, QuizSubmission } from '../../lib/quizSubmissionService';
import { subscribeToExpenses, ExpenseRecord } from '../../lib/expenseService';
import { getMockUsers, db, collection, onSnapshot } from '../../lib/firebase';
import { isGeminiApiEnabled, setGeminiApiEnabled } from '../../config/appConfig';

interface AdminDashboardProps {
  language: Language;
  onNavigateHome: () => void;
}

const ensureNineMainImages = (primaryImage?: string, gallery?: string[]): string[] => {
  const list: string[] = [];
  if (primaryImage) {
    list.push(primaryImage);
  }
  if (gallery && Array.isArray(gallery)) {
    gallery.forEach((img) => {
      if (img && (img !== primaryImage || list.filter((x) => x === img).length < gallery.filter((x) => x === img).length)) {
        list.push(img);
      }
    });
  }
  while (list.length < 9) {
    list.push('');
  }
  return list.slice(0, 9);
};

const ensureTenCards = (existing?: ProductDescriptionCard[]): ProductDescriptionCard[] => {
  const list: ProductDescriptionCard[] = existing && existing.length > 0 ? existing.map((c) => ({ ...c })) : [];
  for (let i = list.length; i < 10; i++) {
    list.push({
      id: `card_${i + 1}`,
      image: '',
      caption: '',
    });
  }
  return list.slice(0, 10);
};

const ALL_SKIN_TYPES: { id: SkinType; labelKm: string; labelEn: string }[] = [
  { id: 'all', labelKm: 'គ្រប់ប្រភេទស្បែក (All)', labelEn: 'All Skin Types' },
  { id: 'acne', labelKm: 'ស្បែកមានមុន (Acne)', labelEn: 'Acne-Prone' },
  { id: 'oily', labelKm: 'ស្បែកខ្លាញ់ (Oily)', labelEn: 'Oily Skin' },
  { id: 'dry', labelKm: 'ស្បែកស្ងួត (Dry)', labelEn: 'Dry Skin' },
  { id: 'combination', labelKm: 'ស្បែកចំរុះ (Combination)', labelEn: 'Combination' },
  { id: 'sensitive', labelKm: 'ស្បែកងាយប្រតិកម្ម (Sensitive)', labelEn: 'Sensitive' },
  { id: 'normal', labelKm: 'ស្បែកធម្មតា (Normal)', labelEn: 'Normal' },
];

const INITIAL_FORM_STATE: Partial<Product> = {
  id: '',
  name: '',
  nameKm: '',
  nameZh: '',
  brand: 'Lumimei Cambodia',
  category: 'best-seller',
  priceUsd: 0,
  priceKhr: 0,
  originalPriceUsd: 0,
  pointsCost: 0,
  rating: 5,
  reviewCount: 0,
  image: '',
  gallery: [],
  descriptionCards: ensureTenCards([]),
  isNew: true,
  isBestSeller: false,
  isFreeShipping: true,
  skinTypes: ['all'],
  skinConcerns: ['all'],
  description: '',
  descriptionKm: '',
  descriptionZh: '',
  howToUse: '',
  howToUseKm: '',
  howToUseZh: '',
  ingredients: '',
  stock: 100,
  volume: '',
  madeInKm: 'ផលិតនៅប្រទេសកម្ពុជា 🇰🇭',
  benefitsKm: [],
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  language,
  onNavigateHome,
}) => {
  // Authentication State
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('lumimei_admin_jwt_token') || null;
  });
  const [adminUser, setAdminUser] = useState<any>(() => {
    const saved = localStorage.getItem('lumimei_admin_profile');
    return saved ? JSON.parse(saved) : null;
  });

  // Login Form Mode: 'phone' or 'credentials'
  const [loginMode, setLoginMode] = useState<'phone' | 'credentials'>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [phonePin, setPhonePin] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Admin Dashboard Tabs: 'home' | 'orders' | 'verify' | 'products' | 'users'
  const [activeAdminTab, setActiveAdminTab] = useState<'home' | 'orders' | 'verify' | 'products' | 'users'>('home');

  // Financial Management Modal State
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);

  // Live Statistics for the 5 Cards
  const [pendingVerifyCount, setPendingVerifyCount] = useState<number>(0);
  const [verifiedQuizCount, setVerifiedQuizCount] = useState<number>(0);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [totalRevenueUsd, setTotalRevenueUsd] = useState<number>(0);
  const [customersCount, setCustomersCount] = useState<number>(() => {
    try {
      const u = getMockUsers();
      return Array.isArray(u) ? u.length : 12;
    } catch {
      return 12;
    }
  });
  const [totalExpensesUsd, setTotalExpensesUsd] = useState<number>(0);

  // Gemini API Toggle State & Settings Modal State
  const [geminiApiActive, setGeminiApiActive] = useState<boolean>(() => isGeminiApiEnabled());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleStatusChanged = (e: any) => {
      setGeminiApiActive(Boolean(e.detail?.enabled));
    };
    window.addEventListener('gemini_api_status_changed', handleStatusChanged);
    return () => {
      window.removeEventListener('gemini_api_status_changed', handleStatusChanged);
    };
  }, []);

  // Real-time synchronization for Quiz Submissions (Verify card)
  useEffect(() => {
    const unsubscribeSubmissions = subscribeToQuizSubmissions((list) => {
      const pending = list.filter((item) => item.status === 'pending').length;
      const verified = list.filter((item) => item.status === 'verified').length;
      setPendingVerifyCount(pending);
      setVerifiedQuizCount(verified);
    });

    const unsubscribeExpenses = subscribeToExpenses((expenses) => {
      const sum = expenses.reduce((acc, exp) => acc + (Number(exp.amountUsd) || 0), 0);
      setTotalExpensesUsd(sum);
    });

    // Sync Orders for live order counts and revenue
    let unsubscribeOrders: (() => void) | null = null;
    try {
      const ordersCol = collection(db, 'orders');
      unsubscribeOrders = onSnapshot(ordersCol, (snapshot) => {
        let totalCount = 0;
        let pendingCount = 0;
        let rev = 0;
        snapshot.forEach((docSnap) => {
          totalCount++;
          const d = docSnap.data() as any;
          if (d.status === 'pending' || d.orderStatus === 'pending') {
            pendingCount++;
          }
          rev += Number(d.totalUsd || d.subtotalUsd || 0);
        });

        if (totalCount > 0) {
          setOrdersCount(totalCount);
          setPendingOrdersCount(pendingCount);
          setTotalRevenueUsd(rev);
        } else {
          // Fallback to local stored orders if cloud has none
          try {
            const localOrders = JSON.parse(localStorage.getItem('lumimei_guest_orders') || '[]');
            if (Array.isArray(localOrders) && localOrders.length > 0) {
              setOrdersCount(localOrders.length);
              setPendingOrdersCount(localOrders.filter((o: any) => o.status === 'pending').length);
              const sumLocal = localOrders.reduce((s: number, o: any) => s + (Number(o.totalUsd) || 0), 0);
              setTotalRevenueUsd(sumLocal);
            }
          } catch {}
        }
      });
    } catch {
      try {
        const localOrders = JSON.parse(localStorage.getItem('lumimei_guest_orders') || '[]');
        if (Array.isArray(localOrders)) {
          setOrdersCount(localOrders.length);
          setPendingOrdersCount(localOrders.filter((o: any) => o.status === 'pending').length);
          const sumLocal = localOrders.reduce((s: number, o: any) => s + (Number(o.totalUsd) || 0), 0);
          setTotalRevenueUsd(sumLocal);
        }
      } catch {}
    }

    // Sync Customer Count
    try {
      const users = getMockUsers();
      if (Array.isArray(users)) {
        setCustomersCount(users.length);
      }
    } catch {}

    return () => {
      unsubscribeSubmissions();
      unsubscribeExpenses();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, []);

  const handleToggleGemini = () => {
    const nextState = !geminiApiActive;
    setGeminiApiActive(nextState);
    setGeminiApiEnabled(nextState);
  };

  // ----------------------------------------------------
  // Products Management State
  // ----------------------------------------------------
  const [productsList, setProductsList] = useState<Product[]>(() => getAllStoredProducts());
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>(INITIAL_FORM_STATE);
  const [benefitInput, setBenefitInput] = useState('');
  const [productSavedFeedback, setProductSavedFeedback] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Direct Image Upload State
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync products in real-time from Firestore Cloud
  useEffect(() => {
    const unsubscribe = subscribeToProducts((list) => {
      if (list && list.length > 0) {
        setProductsList(list);
      }
    });

    const handleProductsUpdated = (e: any) => {
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setProductsList(e.detail);
      } else {
        setProductsList(getAllStoredProducts());
      }
    };
    window.addEventListener('lumimei_products_updated', handleProductsUpdated);

    return () => {
      unsubscribe();
      window.removeEventListener('lumimei_products_updated', handleProductsUpdated);
    };
  }, []);

  // Handle Admin Phone Login
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const res = await fetch('/api/admin/phone-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': language,
        },
        body: JSON.stringify({
          phoneNumber: phoneInput,
          pin: phonePin,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.message || 'Login failed');
      }

      setToken(data.token);
      setAdminUser(data.admin);
      localStorage.setItem('lumimei_admin_jwt_token', data.token);
      localStorage.setItem('lumimei_admin_profile', JSON.stringify(data.admin));
    } catch (err: any) {
      setAuthError(err.message || 'លេខទូរស័ព្ទ ឬ PIN Admin មិនត្រឹមត្រូវទេ។');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Username/Password Login
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': language,
        },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.message || 'Login failed');
      }

      setToken(data.token);
      setAdminUser(data.admin);
      localStorage.setItem('lumimei_admin_jwt_token', data.token);
      localStorage.setItem('lumimei_admin_profile', JSON.stringify(data.admin));
    } catch (err: any) {
      setAuthError(err.message || 'ឈ្មោះគណនី ឬលេខសម្ងាត់ Admin មិនត្រឹមត្រូវទេ។');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setAdminUser(null);
    localStorage.removeItem('lumimei_admin_jwt_token');
    localStorage.removeItem('lumimei_admin_profile');
  };

  // ----------------------------------------------------
  // Product Management Handlers
  // ----------------------------------------------------
  const [uploadingCardIdx, setUploadingCardIdx] = useState<number | null>(null);
  const cardFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleStartAddProduct = () => {
    setProductForm({
      ...INITIAL_FORM_STATE,
      id: `prod_${Date.now()}`,
      descriptionCards: ensureTenCards([]),
    });
    setEditingProductId(null);
    setIsEditingProduct(true);
    setBenefitInput('');
    setProductSavedFeedback(null);
  };

  const handleStartEditProduct = (prod: Product) => {
    setProductForm({
      ...prod,
      descriptionCards: ensureTenCards(prod.descriptionCards),
    });
    setEditingProductId(prod.id);
    setIsEditingProduct(true);
    setBenefitInput('');
    setProductSavedFeedback(null);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleCancelProductForm = () => {
    setIsEditingProduct(false);
    setEditingProductId(null);
    setProductForm({
      ...INITIAL_FORM_STATE,
      descriptionCards: ensureTenCards([]),
    });
  };

  const handlePriceUsdChange = (val: number) => {
    const usd = Number(val) || 0;
    setProductForm((prev) => ({
      ...prev,
      priceUsd: usd,
      priceKhr: Math.round(usd * KHR_RATE),
    }));
  };

  const handleCardPhotoUpload = async (cardIndex: number, file: File) => {
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type) && !/\.(png|jpg|jpeg|webp)$/i.test(file.name)) {
      alert('សូមជ្រើសរើសប្រភេទរូបភាព PNG, JPG, JPEG ឬ WEBP ប៉ុណ្ណោះ');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('ទំហំរូបភាពត្រូវតែតូចជាង 20MB');
      return;
    }

    setUploadingCardIdx(cardIndex);
    try {
      const uploadRes = await uploadImageFile(file);
      if (uploadRes.success && uploadRes.url) {
        updateCardField(cardIndex, 'image', uploadRes.url);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            updateCardField(cardIndex, 'image', reader.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('Card image upload error:', err);
    } finally {
      setUploadingCardIdx(null);
    }
  };

  const getMainImages = (): string[] => {
    return ensureNineMainImages(productForm.image, productForm.gallery);
  };

  const updateMainImageSlot = (index: number, url: string) => {
    setProductForm((prev) => {
      const currentList = ensureNineMainImages(prev.image, prev.gallery);
      currentList[index] = url;

      const validList = currentList.filter(Boolean);
      const newPrimary = currentList[0] || (validList.length > 0 ? validList[0] : '');
      const newGallery = currentList.filter(Boolean);

      return {
        ...prev,
        image: newPrimary,
        gallery: newGallery,
      };
    });
  };

  const handleClearMainImage = (index: number) => {
    updateMainImageSlot(index, '');
  };

  const handleMoveMainImage = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= 9) return;

    setProductForm((prev) => {
      const currentList = ensureNineMainImages(prev.image, prev.gallery);
      const temp = currentList[fromIndex];
      currentList[fromIndex] = currentList[toIndex];
      currentList[toIndex] = temp;

      const validList = currentList.filter(Boolean);
      const newPrimary = currentList[0] || (validList.length > 0 ? validList[0] : '');
      const newGallery = currentList.filter(Boolean);

      return {
        ...prev,
        image: newPrimary,
        gallery: newGallery,
      };
    });
  };

  const handleMoveCard = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= 10) return;

    setProductForm((prev) => {
      const cards = ensureTenCards(prev.descriptionCards);
      const temp = cards[fromIndex];
      cards[fromIndex] = cards[toIndex];
      cards[toIndex] = temp;
      return {
        ...prev,
        descriptionCards: cards,
      };
    });
  };

  const updateCardField = (index: number, field: 'image' | 'caption', value: string) => {
    setProductForm((prev) => {
      const cards = ensureTenCards(prev.descriptionCards);
      cards[index] = {
        ...cards[index],
        [field]: value,
      };
      return {
        ...prev,
        descriptionCards: cards,
      };
    });
  };

  const handleClearCardPhoto = (index: number) => {
    updateCardField(index, 'image', '');
  };

  const handleAddNewCardSlot = () => {
    const cards = ensureTenCards(productForm.descriptionCards);
    const emptyIndex = cards.findIndex((c) => !c.image);
    if (emptyIndex !== -1) {
      cardFileInputRefs.current[emptyIndex]?.click();
    } else {
      alert('អ្នកបានបញ្ចូលរូបភាពគ្រប់ចំនួន ១០ រួចហើយ!');
    }
  };

  const handleProcessFileUpload = async (file: File) => {
    if (!file) return;

    // Validate image format
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type) && !/\.(png|jpg|jpeg|webp)$/i.test(file.name)) {
      setUploadError('សូមជ្រើសរើសប្រភេទរូបភាព PNG, JPG, JPEG ឬ WEBP ប៉ុណ្ណោះ');
      return;
    }

    // Size limit check (20MB)
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('ទំហំរូបភាពត្រូវតែតូចជាង 20MB');
      return;
    }

    setUploadError(null);
    setIsUploadingImage(true);

    try {
      // 1. Upload file to backend POST /api/upload
      const uploadRes = await uploadImageFile(file);

      if (uploadRes.success && uploadRes.url) {
        setProductForm((prev) => ({
          ...prev,
          image: uploadRes.url,
          gallery: prev.gallery && prev.gallery.length > 0 ? [uploadRes.url, ...prev.gallery.slice(1)] : [uploadRes.url],
        }));

        // If currently editing an existing product, auto-sync image with backend
        if (editingProductId) {
          fetch('/api/admin/product/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: editingProductId,
              imageUrl: uploadRes.url,
            }),
          }).catch((err) => console.warn('Product image sync notice:', err));
        }
      } else {
        // Fallback: convert to base64 DataURL if server upload had network issues
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setProductForm((prev) => ({
              ...prev,
              image: reader.result as string,
            }));
          }
        };
        reader.readAsDataURL(file);
        if (uploadRes.error) {
          setUploadError(`ការអាប់ឡូតទៅ Server: ${uploadRes.error}`);
        }
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadError(err.message || 'ការអាប់ឡូតរូបភាពមិនបានជោគជ័យ');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFileUpload(file);
    }
    // Reset file input so same file can be re-selected if desired
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFileUpload(files[0]);
    }
  };

  const handleAddBenefit = () => {
    if (!benefitInput.trim()) return;
    setProductForm((prev) => ({
      ...prev,
      benefitsKm: [...(prev.benefitsKm || []), benefitInput.trim()],
    }));
    setBenefitInput('');
  };

  const handleRemoveBenefit = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      benefitsKm: (prev.benefitsKm || []).filter((_, i) => i !== index),
    }));
  };

  const handleToggleSkinType = (skinType: SkinType) => {
    setProductForm((prev) => {
      const current = prev.skinTypes || [];
      if (current.includes(skinType)) {
        return { ...prev, skinTypes: current.filter((t) => t !== skinType) };
      } else {
        return { ...prev, skinTypes: [...current, skinType] };
      }
    });
  };

  const handleToggleSkinConcern = (concernId: string) => {
    setProductForm((prev) => {
      const current = prev.skinConcerns || [];
      if (current.includes(concernId)) {
        return { ...prev, skinConcerns: current.filter((c) => c !== concernId) };
      } else {
        return { ...prev, skinConcerns: [...current, concernId] };
      }
    });
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productForm.nameKm?.trim() || !productForm.name?.trim()) {
      alert('សូមបញ្ចូលឈ្មោះផលិតផលជាភាសាខ្មែរ និងភាសាអង់គ្លេស!');
      return;
    }

    if (!productForm.priceUsd || productForm.priceUsd <= 0) {
      alert('សូមបញ្ចូលតម្លៃផលិតផលជា USD!');
      return;
    }

    const prodId = productForm.id || `prod_${Date.now()}`;
    const cards = ensureTenCards(productForm.descriptionCards).filter((c) => c.image || c.caption);
    const mainImagesList = ensureNineMainImages(productForm.image, productForm.gallery).filter(Boolean);
    const mainImage =
      mainImagesList[0] ||
      productForm.image ||
      (cards.length > 0 && cards[0].image
        ? cards[0].image
        : 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=600');
    const galleryImages =
      mainImagesList.length > 0
        ? mainImagesList
        : [mainImage, ...cards.map((c) => c.image).filter(Boolean)].filter((v, i, a) => v && a.indexOf(v) === i);

    const productToSave: Product = {
      id: prodId,
      name: productForm.name || '',
      nameKm: productForm.nameKm || '',
      nameZh: productForm.nameZh || productForm.name,
      brand: productForm.brand || 'Lumimei Cambodia',
      category: productForm.category || 'best-seller',
      priceUsd: Number(productForm.priceUsd) || 0,
      priceKhr: Number(productForm.priceKhr) || Math.round((Number(productForm.priceUsd) || 0) * KHR_RATE),
      originalPriceUsd: productForm.originalPriceUsd ? Number(productForm.originalPriceUsd) : undefined,
      pointsCost: productForm.pointsCost ? Number(productForm.pointsCost) : undefined,
      rating: productForm.rating || 5,
      reviewCount: productForm.reviewCount || 0,
      image: mainImage,
      gallery: galleryImages,
      descriptionCards: cards,
      isNew: !!productForm.isNew,
      isBestSeller: !!productForm.isBestSeller,
      isFreeShipping: !!productForm.isFreeShipping,
      skinTypes: ['all'],
      skinConcerns: ['all'],
      description: cards.map((c) => c.caption).filter(Boolean).join(' • ') || productForm.name || '',
      descriptionKm: cards.map((c) => c.caption).filter(Boolean).join(' • ') || productForm.nameKm || '',
      descriptionZh: productForm.nameZh || productForm.name,
      howToUse: '',
      howToUseKm: '',
      howToUseZh: '',
      ingredients: 'Natural Botanical Extracts',
      stock: Number(productForm.stock) || 100,
      volume: productForm.volume || '1 Unit',
      madeInKm: productForm.madeInKm || 'ផលិតនៅប្រទេសកម្ពុជា 🇰🇭',
      benefitsKm: cards.map((c) => c.caption).filter(Boolean).slice(0, 5),
    };

    const updated = await saveStoredProduct(productToSave);
    setProductsList(updated);
    setIsEditingProduct(false);
    setEditingProductId(null);
    setProductForm({
      ...INITIAL_FORM_STATE,
      descriptionCards: ensureTenCards([]),
    });

    setProductSavedFeedback(
      editingProductId
        ? '✓ បានកែប្រែព័ត៌មាន និងរក្សាទុកទៅកាន់ Cloud Firestore ជោគជ័យ!'
        : '✓ បានបញ្ចូលផលិតផលថ្មីទៅកាន់ Cloud Firestore ជោគជ័យ!'
    );

    setTimeout(() => {
      setProductSavedFeedback(null);
    }, 4000);
  };

  const handleDeleteProduct = async (id: string) => {
    const updated = await deleteStoredProduct(id);
    setProductsList(updated);
    setDeleteConfirmId(null);
    setProductSavedFeedback('✓ បានលុបផលិតផលចេញពី Cloud Firestore រួចរាល់');
    setTimeout(() => {
      setProductSavedFeedback(null);
    }, 3000);
  };

  const handleMoveProduct = async (
    productId: string,
    direction: 'up' | 'down' | 'first' | 'last'
  ) => {
    const currentIndex = productsList.findIndex((p) => p.id === productId);
    if (currentIndex === -1) return;

    const targetProduct = productsList[currentIndex];
    const newList = [...productsList];

    if (direction === 'up') {
      if (currentIndex === 0) return;
      const prev = newList[currentIndex - 1];
      newList[currentIndex - 1] = targetProduct;
      newList[currentIndex] = prev;
    } else if (direction === 'down') {
      if (currentIndex === newList.length - 1) return;
      const next = newList[currentIndex + 1];
      newList[currentIndex + 1] = targetProduct;
      newList[currentIndex] = next;
    } else if (direction === 'first') {
      if (currentIndex === 0) return;
      newList.splice(currentIndex, 1);
      newList.unshift(targetProduct);
    } else if (direction === 'last') {
      if (currentIndex === newList.length - 1) return;
      newList.splice(currentIndex, 1);
      newList.push(targetProduct);
    }

    const updated = await saveProductsReorder(newList);
    setProductsList(updated);

    const newIndex = updated.findIndex((p) => p.id === productId);
    const prodName = targetProduct.nameKm || targetProduct.name;
    setProductSavedFeedback(
      language === 'zh'
        ? `✓ 已调整「${prodName}」至第 #${newIndex + 1} 位`
        : `✓ បានផ្លាស់ប្តូរទីតាំង «${prodName}» ទៅកាន់លំដាប់លេខ #${newIndex + 1}`
    );
    setTimeout(() => {
      setProductSavedFeedback(null);
    }, 3000);
  };

  // Filtered Products
  const filteredProductsList = productsList.filter((prod) => {
    let matchesCat = true;
    if (productCategoryFilter !== 'all') {
      if (productCategoryFilter === 'promotion') {
        matchesCat =
          prod.category === 'promotion' ||
          (Boolean(prod.originalPriceUsd) && Number(prod.originalPriceUsd) > Number(prod.priceUsd)) ||
          Boolean(prod.isBestSeller) ||
          Boolean(prod.isFreeShipping);
      } else if (productCategoryFilter === 'best-seller' || productCategoryFilter === 'bestseller') {
        matchesCat =
          prod.category === 'best-seller' ||
          prod.category === 'bestseller' ||
          Boolean(prod.isBestSeller);
      } else {
        matchesCat = prod.category === productCategoryFilter;
      }
    }
    const q = productSearchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      (prod.nameKm ? String(prod.nameKm).toLowerCase().includes(q) : false) ||
      (prod.name ? String(prod.name).toLowerCase().includes(q) : false) ||
      (prod.brand ? String(prod.brand).toLowerCase().includes(q) : false) ||
      (prod.id ? String(prod.id).toLowerCase().includes(q) : false);
    return matchesCat && matchesQuery;
  });

  // ==========================================
  // UNLOGGED STATE: Admin Login View
  // ==========================================
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50/40 to-slate-50 text-slate-800 flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-200/80 shadow-xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl flex items-center justify-center mx-auto shadow-md border border-emerald-500/20 mb-3">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-opensans">
              Lumimei Admin Portal
            </h1>
            <p className="text-xs text-emerald-700 font-battambang mt-1 font-medium">
              {language === 'zh'
                ? '柬埔寨管理员控制台 - 任务审核与商品管理'
                : language === 'en'
                ? 'Cambodia Admin Panel - Task Review & Products'
                : 'ផ្ទាំងគ្រប់គ្រង Admin - ពិនិត្យសំណើ & បញ្ចូលផលិតផល'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setLoginMode('phone');
                setAuthError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                loginMode === 'phone'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{language === 'zh' ? '手机号快捷登录' : 'ចូលតាមលេខទូរស័ព្ទ'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('credentials');
                setAuthError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                loginMode === 'credentials'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{language === 'zh' ? '账号密码登录' : 'ឈ្មោះ & លេខសម្ងាត់'}</span>
            </button>
          </div>

          {/* Error Banner */}
          {authError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Phone Login Form */}
          {loginMode === 'phone' ? (
            <form onSubmit={handlePhoneLogin} className="space-y-4 font-battambang">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {language === 'zh' ? '管理员手机号码' : 'លេខទូរស័ព្ទ Admin'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs font-bold font-mono">
                    🇰🇭 +855
                  </div>
                  <input
                    type="text"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="012 345 678"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-20 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 font-mono transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {language === 'zh' ? '安全 PIN 码 (6位)' : 'លេខសម្ងាត់ PIN (៦ខ្ទង់)'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    maxLength={8}
                    required
                    value={phonePin}
                    onChange={(e) => setPhonePin(e.target.value)}
                    placeholder="••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 font-mono transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-md shadow-emerald-900/10 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
              >
                {authLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{language === 'zh' ? '安全登录 Admin' : 'ចូលប្រើប្រាស់ Admin'}</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Username/Password Form */
            <form onSubmit={handleCredentialsLogin} className="space-y-4 font-battambang">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {language === 'zh' ? '管理员用户名' : 'ឈ្មោះគណនី Admin'}
                </label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white font-mono transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {language === 'zh' ? '管理员密码' : 'លេខសម្ងាត់ Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white font-mono transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-md shadow-emerald-900/10 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
              >
                {authLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{language === 'zh' ? '登录 Admin 控制台' : 'ចូលប្រើប្រាស់ Admin'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Return Home */}
          <div className="text-center mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={onNavigateHome}
              className="text-xs text-slate-500 hover:text-emerald-700 font-battambang transition cursor-pointer font-medium"
            >
              ← {language === 'zh' ? '返回 Lumimei 商城首页' : 'ត្រឡប់ទៅទំព័រដើម'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // LOGGED-IN ADMIN VIEW
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Top Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-40 px-4 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 font-opensans tracking-wide">
                  Lumimei Admin
                </span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                  Verified Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-battambang">
                {adminUser?.name || adminUser?.username || 'Admin'} ({adminUser?.role || 'SuperAdmin'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Gemini API Toggle Button in Header */}
            <button
              type="button"
              onClick={handleToggleGemini}
              className={`text-xs px-3 py-1.5 rounded-xl border transition cursor-pointer font-battambang font-bold flex items-center gap-1.5 shadow-xs ${
                geminiApiActive
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
              }`}
              title="ចុចដើម្បី បើក / បិទ Gemini API"
            >
              <Power className={`w-3.5 h-3.5 ${geminiApiActive ? 'text-white' : 'text-rose-600'}`} />
              <span>{geminiApiActive ? 'Gemini API: ON' : 'Gemini API: OFF'}</span>
            </button>

            {/* Settings button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="ការកំណត់ (Settings)"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold px-2.5 py-1.5 rounded-xl hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
              title="ចាកចេញ (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ចាកចេញ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal (ការកំណត់) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-battambang animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'zh' ? '系统设置 (System Settings)' : 'ការកំណត់ប្រព័ន្ធ (Settings)'}
                  </h3>
                  <p className="text-xs text-slate-500">គ្រប់គ្រងមុខងារ និងសេវាកម្មប្រព័ន្ធ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Gemini API Switch Section */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-700" />
                    <span className="text-sm font-bold text-slate-900">Google Gemini API</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    បិទ / បើកដំណើរការសេវាកម្ម AI Assistant និង LLM
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleGemini}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs ${
                    geminiApiActive
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{geminiApiActive ? 'Gemini API: ON' : 'Gemini API: OFF'}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 flex items-start gap-1.5">
                <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${geminiApiActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span>
                  {geminiApiActive
                    ? 'ស្ថានភាពបច្ចុប្បន្ន៖ Gemini API កំពុងបើក (ON)។'
                    : 'ស្ថានភាពបច្ចុប្បន្ន៖ Gemini API ត្រូវបានបិទ (OFF)។ ប្រព័ន្ធដំណើរការដោយ Logic និង Database សុទ្ធសាធ គ្មានការហៅ AI API ឡើយ។'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                {language === 'zh' ? '确定关闭' : 'រួចរាល់'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Admin Navigation Menu: ទំព័រដើម | Orders | Verify */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/80 backdrop-blur-xs rounded-2xl border border-slate-300/70 shadow-xs font-battambang">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Tab 1: ទំព័រដើម */}
            <button
              type="button"
              onClick={() => setActiveAdminTab('home')}
              className={`flex flex-col items-center justify-center gap-1 px-4 sm:px-5 py-2 rounded-xl font-bold transition cursor-pointer min-w-[64px] sm:min-w-[76px] ${
                activeAdminTab === 'home'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Home className="w-4.5 h-4.5 text-emerald-700" />
              <span className="text-[11px] sm:text-xs leading-none">
                {language === 'km' ? 'ទំព័រដើម' : language === 'zh' ? '首页' : 'Home'}
              </span>
            </button>

            {/* Tab 2: Orders */}
            <button
              type="button"
              onClick={() => setActiveAdminTab('orders')}
              className={`flex flex-col items-center justify-center gap-1 px-4 sm:px-5 py-2 rounded-xl font-bold transition cursor-pointer relative min-w-[64px] sm:min-w-[76px] ${
                activeAdminTab === 'orders'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <div className="relative">
                <ShoppingBag className="w-4.5 h-4.5 text-emerald-700" />
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500 text-white leading-none shadow-xs">
                    {pendingOrdersCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] sm:text-xs leading-none">Orders</span>
            </button>

            {/* Tab 3: Verify */}
            <button
              type="button"
              onClick={() => setActiveAdminTab('verify')}
              className={`flex flex-col items-center justify-center gap-1 px-4 sm:px-5 py-2 rounded-xl font-bold transition cursor-pointer relative min-w-[64px] sm:min-w-[76px] ${
                activeAdminTab === 'verify'
                  ? 'bg-white text-purple-900 shadow-xs border border-purple-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <div className="relative">
                <ShieldCheck className="w-4.5 h-4.5 text-purple-700" />
                {pendingVerifyCount > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-600 text-white animate-pulse leading-none shadow-xs">
                    {pendingVerifyCount}
                  </span>
                ) : verifiedQuizCount > 0 ? (
                  <span className="absolute -top-1.5 -right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 leading-none">
                    {verifiedQuizCount}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] sm:text-xs leading-none">Verify</span>
            </button>
          </div>
        </div>

        {/* ==================================================== */}
        {/* VIEW: HOME (ទំព័រដើម) with 5 CARDS (2 per row on mobile) */}
        {/* ==================================================== */}
        {activeAdminTab === 'home' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs font-battambang">
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 font-opensans flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-emerald-700" />
                  <span>ទំព័រដើម Lumimei Admin</span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  ផ្ទាំងគ្រប់គ្រងចម្បង៖ បញ្ចូលផលិតផល អតិថិជន ការកុម្ម៉ង់ ការផ្ទៀងផ្ទាត់ Game និងចំណូលចំណាយ
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Cloud Sync</span>
                </span>
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>មើលទំព័រមុខ</span>
                </button>
              </div>
            </div>

            {/* 5 CARDS: Exactly 2 cards per row on mobile! */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider font-opensans flex items-center gap-1.5">
                  <span>ម៉ឺនុយទាំង ៥ (5 Cards)</span>
                </h2>
                <span className="text-[11px] text-slate-400 font-battambang hidden sm:inline">
                  ទម្រង់ទូរស័ព្ទដៃបង្ហាញជួរមាន ២ Card
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 font-battambang">
                {/* CARD 1: បញ្ចូលផលិតផល */}
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('products')}
                  className="bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-between text-left transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer group min-h-[145px]"
                >
                  <div className="flex items-center justify-between w-full mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                      Products
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition">
                      បញ្ចូលផលិតផល
                    </h3>
                    <p className="text-xs font-bold text-slate-500 mt-0.5 font-mono">
                      {productsList.length} មុខទំនិញ
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-emerald-700">
                    <span>+ បញ្ចូល / កែប្រែ</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* CARD 2: Customers */}
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('users')}
                  className="bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-between text-left transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer group min-h-[145px]"
                >
                  <div className="flex items-center justify-between w-full mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-mono">
                      Users
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-sky-700 transition">
                      Customers
                    </h3>
                    <p className="text-xs font-bold text-slate-500 mt-0.5 font-mono">
                      {customersCount} គណនី
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-sky-700">
                    <span>គណនី & ពិន្ទុ</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* CARD 3: Orders */}
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('orders')}
                  className="bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-between text-left transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer group min-h-[145px]"
                >
                  <div className="flex items-center justify-between w-full mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    {pendingOrdersCount > 0 ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                        {pendingOrdersCount} រង់ចាំ
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                        Sales
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-blue-700 transition">
                      Orders
                    </h3>
                    <p className="text-xs font-bold text-slate-500 mt-0.5 font-mono">
                      {ordersCount} ការកុម្ម៉ង់
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-blue-700">
                    <span>ពិនិត្យកុម្ម៉ង់</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* CARD 4: Verify */}
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('verify')}
                  className={`bg-white hover:bg-purple-50/50 border rounded-2xl p-4 sm:p-5 flex flex-col justify-between text-left transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer group min-h-[145px] relative overflow-hidden ${
                    pendingVerifyCount > 0
                      ? 'border-purple-300 ring-2 ring-purple-100'
                      : 'border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    {pendingVerifyCount > 0 ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500 text-white animate-pulse shadow-xs">
                        +{pendingVerifyCount} ថ្មី
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                        Quiz
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-purple-700 transition">
                      Verify
                    </h3>
                    <p className="text-xs font-bold text-slate-500 mt-0.5 font-mono">
                      {pendingVerifyCount > 0 ? (
                        <span className="text-amber-700 font-extrabold">{pendingVerifyCount} រង់ចាំ Verify</span>
                      ) : (
                        <span>{verifiedQuizCount} ផ្ទៀងផ្ទាត់រួច</span>
                      )}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-purple-700">
                    <span>ផ្ទៀងផ្ទាត់ Game</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* CARD 5: ចំណូល/ចំណាយ */}
                <button
                  type="button"
                  onClick={() => setIsFinancialModalOpen(true)}
                  className="bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-between text-left transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer group min-h-[145px] col-span-2 sm:col-span-1"
                >
                  <div className="flex items-center justify-between w-full mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                      Finance
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-amber-700 transition">
                      ចំណូល/ចំណាយ
                    </h3>
                    <p className="text-xs font-bold text-emerald-800 mt-0.5 font-mono">
                      ចំណូល: ${totalRevenueUsd.toFixed(2)}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-amber-800">
                    <span>របាយការណ៍ហិរញ្ញវត្ថុ</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>
            </div>

            {/* Pending Verify Notification Banner */}
            {pendingVerifyCount > 0 && (
              <div className="bg-gradient-to-r from-amber-50 via-purple-50 to-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in font-battambang">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      មាន {pendingVerifyCount} ចម្លើយ Game ឆ្លើយសំនួរ កំពុងរង់ចាំ Admin ផ្ទៀងផ្ទាត់ (Verify)!
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      អតិថិជនបាន Submit ចម្លើយរួចរាល់ហើយ សូមពិនិត្យផ្ទៀងផ្ទាត់ដើម្បីផ្ដល់ពិន្ទុជូនពួកគាត់។
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveAdminTab('verify')}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>ផ្ទៀងផ្ទាត់ឥឡូវនេះ (Go to Verify)</span>
                </button>
              </div>
            )}

            {/* Quick Shortcuts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 font-battambang">
              <button
                type="button"
                onClick={() => {
                  setActiveAdminTab('products');
                  handleStartAddProduct();
                }}
                className="bg-white border border-slate-200 hover:border-emerald-400 p-4 rounded-2xl flex items-center gap-3 text-left transition hover:shadow-xs cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">+ បន្ថែមផលិតផលថ្មី</h4>
                  <p className="text-[11px] text-slate-500">បញ្ចូលឈ្មោះ រូបភាព និងតម្លៃ</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveAdminTab('orders')}
                className="bg-white border border-slate-200 hover:border-blue-400 p-4 rounded-2xl flex items-center gap-3 text-left transition hover:shadow-xs cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">ពិនិត្យការកុម្ម៉ង់ទំនិញ</h4>
                  <p className="text-[11px] text-slate-500">{ordersCount} កុម្ម៉ង់សរុបក្នុងប្រព័ន្ធ</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsFinancialModalOpen(true)}
                className="bg-white border border-slate-200 hover:border-amber-400 p-4 rounded-2xl flex items-center gap-3 text-left transition hover:shadow-xs cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">គ្រប់គ្រងចំណូល/ចំណាយ</h4>
                  <p className="text-[11px] text-slate-500">កត់ត្រាចំណាយ និងពិនិត្យប្រាក់ចំណេញ</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* TAB: PRODUCT MANAGEMENT */}
        {activeAdminTab === 'products' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Return to Home button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveAdminTab('home')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition cursor-pointer px-3 py-1.5 rounded-xl hover:bg-slate-100 font-battambang"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ត្រឡប់ទៅទំព័រដើម (Back to Home)</span>
              </button>
            </div>
          {/* Header & Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-opensans flex items-center gap-2">
                  <Package className="w-6 h-6 text-emerald-700" />
                  <span>{language === 'zh' ? '商品录入与商城管理' : 'បញ្ចូលព័ត៌មានផលិតផល និងគ្រប់គ្រងស្តុក'}</span>
                </h1>
                <p className="text-xs text-slate-500 font-battambang mt-1">
                  {language === 'zh'
                    ? '录入新护肤品信息，设置价格、照片、多语言描述及库存，即时同步展示于商城中。'
                    : 'បញ្ចូលព័ត៌មានផលិតផលថ្មី កំណត់តម្លៃ រូបភាព ការពិពណ៌នា និងស្តុក ដែលនឹងបង្ហាញក្នុងហាងភ្លាមៗ។'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isEditingProduct && (
                  <button
                    type="button"
                    onClick={handleStartAddProduct}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-900/10 font-battambang active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{language === 'zh' ? '+ 录入新商品' : '+ បន្ថែមផលិតផលថ្មី'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Saved Feedback Toast */}
            {productSavedFeedback && (
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2 font-battambang">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{productSavedFeedback}</span>
                </div>
                <button
                  onClick={() => setProductSavedFeedback(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* PRODUCT ADD / EDIT FORM MODAL / PANEL */}
            {isEditingProduct && (
              <div className="bg-white border-2 border-emerald-600/30 rounded-3xl p-5 sm:p-7 shadow-lg space-y-6 animate-in fade-in font-battambang">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center text-white">
                      {editingProductId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 font-opensans">
                        {editingProductId
                          ? language === 'zh'
                            ? '编辑商品信息'
                            : 'កែប្រែព័ត៌មានផលិតផល'
                          : language === 'zh'
                          ? '录入新商品信息'
                          : 'បញ្ចូលព័ត៌មានផលិតផលថ្មី'}
                      </h2>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Product ID: {productForm.id}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelProductForm}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveProductSubmit} className="space-y-6">
                  {/* SECTION 1: BASIC INFO */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>១. ព័ត៌មានទូទៅនៃផលិតផល (Product Basic Info)</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Name in Khmer */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          ឈ្មោះផលិតផលជាភាសាខ្មែរ (Name Khmer) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={productForm.nameKm || ''}
                          onChange={(e) => setProductForm({ ...productForm, nameKm: e.target.value })}
                          placeholder="ឧទាហរណ៍: ឈុតលាងមុខ Lumimei"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                        />
                      </div>

                      {/* Name in English */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          ឈ្មោះផលិតផលជាភាសាអង់គ្លេស (Name English) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={productForm.name || ''}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          placeholder="Example: Lumimei Cleansing Set"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                        />
                      </div>

                      {/* Name in Chinese */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          ឈ្មោះជាភាសាចិន (Name Chinese)
                        </label>
                        <input
                          type="text"
                          value={productForm.nameZh || ''}
                          onChange={(e) => setProductForm({ ...productForm, nameZh: e.target.value })}
                          placeholder="例如: Lumimei 洁面修护套装"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                        />
                      </div>

                      {/* Category Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          ប្រភេទផលិតផល / ប្រូម៉ូសិន (Category & Promotion) <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={productForm.category || 'best-seller'}
                          onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                        >
                          {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.nameKm} ({cat.name})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Brand */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          ម៉ាកយីហោ (Brand)
                        </label>
                        <input
                          type="text"
                          value={productForm.brand || 'Lumimei Cambodia'}
                          onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                          placeholder="Lumimei Cambodia"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                        />
                      </div>

                      {/* Volume / Weight */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          ទំហំ / ចំណុះ (Volume / Weight)
                        </label>
                        <input
                          type="text"
                          value={productForm.volume || ''}
                          onChange={(e) => setProductForm({ ...productForm, volume: e.target.value })}
                          placeholder="ឧទាហរណ៍: 50ml, 100g, 1 Set"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: PRICING & STOCK */}
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>២. តម្លៃ និងស្តុកទំនិញ (Pricing & Inventory)</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Price USD */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          តម្លៃ USD ($) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold font-mono">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={productForm.priceUsd ?? ''}
                            onChange={(e) => handlePriceUsdChange(parseFloat(e.target.value) || 0)}
                            placeholder="33.00"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 font-mono focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                          />
                        </div>
                      </div>

                      {/* Price KHR */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          តម្លៃ KHR (៛) <span className="text-slate-400 text-[10px]">(គណនាស្វ័យប្រវត្តិ)</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold font-mono">
                            ៛
                          </span>
                          <input
                            type="number"
                            value={productForm.priceKhr ?? ''}
                            onChange={(e) => setProductForm({ ...productForm, priceKhr: parseInt(e.target.value) || 0 })}
                            placeholder="135300"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 font-mono focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                          />
                        </div>
                      </div>

                      {/* Original Price USD */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          តម្លៃដើម USD (សម្រាប់បញ្ចុះតម្លៃ)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold font-mono">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={productForm.originalPriceUsd ?? ''}
                            onChange={(e) => setProductForm({ ...productForm, originalPriceUsd: parseFloat(e.target.value) || undefined })}
                            placeholder="40.00"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 font-mono focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                          />
                        </div>
                      </div>

                      {/* Stock Quantity */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          ចំនួនក្នុងស្តុក (Stock Qty)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={productForm.stock ?? 100}
                          onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-mono focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    {/* Live Promotion & Discount Status Card */}
                    {productForm.originalPriceUsd && productForm.priceUsd && productForm.originalPriceUsd > productForm.priceUsd && (
                      <div className="p-3 bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-extrabold font-mono text-[11px] shadow-xs">
                            -{Math.round(((productForm.originalPriceUsd - productForm.priceUsd) / productForm.originalPriceUsd) * 100)}% OFF
                          </span>
                          <span className="font-bold text-rose-900">
                            {language === 'zh'
                              ? `特惠促销状态生效：优惠 $${(productForm.originalPriceUsd - productForm.priceUsd).toFixed(2)}`
                              : `ប្រូម៉ូសិនបញ្ចុះតម្លៃសកម្ម៖ អតិថិជនចំណេញបាន $${(productForm.originalPriceUsd - productForm.priceUsd).toFixed(2)}`}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          ${productForm.originalPriceUsd.toFixed(2)} → ${productForm.priceUsd.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* SECTION 3: PRODUCT IMAGE (9 CARDS, 2 PER ROW ON MOBILE, REORDERABLE) */}
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>៣. រូបភាពផលិតផលចម្បង (Main Product Images)</span>
                        </h3>
                        <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold">
                          ៩ រូបភាព • ផ្លាស់ប្តូរទីតាំងមុខក្រោយបាន
                        </span>
                      </div>
                    </div>

                    {uploadError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
                      {getMainImages().map((imgUrl, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === 8;
                        const hasImage = Boolean(imgUrl);

                        return (
                          <div
                            key={`main_img_${idx}`}
                            className={`bg-white border rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-xs transition duration-200 ${
                              isFirst
                                ? 'border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-emerald-950/5'
                                : 'border-slate-200 hover:border-emerald-400'
                            }`}
                          >
                            {/* Card Header & Reorder Controls */}
                            <div className="flex items-center justify-between mb-2 gap-1">
                              <span
                                className={`text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md font-mono flex items-center gap-1 shrink-0 ${
                                  isFirst
                                    ? 'text-emerald-900 bg-emerald-100/90 border border-emerald-300 font-black'
                                    : 'text-slate-700 bg-slate-100 border border-slate-200'
                                }`}
                              >
                                {isFirst ? '⭐ #1 Cover' : `#${idx + 1}`}
                              </span>

                              {/* Move Left / Right / Clear Actions */}
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  disabled={isFirst}
                                  onClick={() => handleMoveMainImage(idx, 'left')}
                                  className={`p-1 rounded-md transition ${
                                    isFirst
                                      ? 'text-slate-300 cursor-not-allowed opacity-40'
                                      : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer active:scale-90'
                                  }`}
                                  title="ផ្លាស់ប្តូរទៅមុខ (Move Left)"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  disabled={isLast}
                                  onClick={() => handleMoveMainImage(idx, 'right')}
                                  className={`p-1 rounded-md transition ${
                                    isLast
                                      ? 'text-slate-300 cursor-not-allowed opacity-40'
                                      : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer active:scale-90'
                                  }`}
                                  title="ផ្លាស់ប្តូរទៅក្រោយ (Move Right)"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>

                                {hasImage && (
                                  <button
                                    type="button"
                                    onClick={() => handleClearMainImage(idx)}
                                    className="text-slate-400 hover:text-rose-600 transition p-1 rounded-md hover:bg-rose-50 cursor-pointer"
                                    title="លុបរូបភាព"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Live Preview Box */}
                            <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50/80 flex items-center justify-center mb-2.5 group p-1.5">
                              {hasImage ? (
                                <>
                                  <img
                                    src={imgUrl}
                                    alt={`Product Image ${idx + 1}`}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800';
                                    }}
                                    className="w-full h-full object-contain group-hover:scale-105 transition duration-300 select-none"
                                  />
                                  <div className="absolute top-1.5 right-1.5 bg-slate-900/75 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1 opacity-90 shadow-xs">
                                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                                    <span>Live</span>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center p-2 text-slate-400 flex flex-col items-center justify-center">
                                  <ImageIcon className="w-6 h-6 mb-1 opacity-40 text-slate-400" />
                                  <span className="text-[10px] font-medium text-slate-500">
                                    {isFirst ? 'រូបភាព Cover' : `រូបភាព #${idx + 1}`}
                                  </span>
                                  <span className="text-[8px] text-slate-400">បញ្ចូល Link ខាងក្រោម</span>
                                </div>
                              )}
                            </div>

                            {/* Image URL Input */}
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-700">
                                {isFirst ? 'Link រូបភាពចម្បង (Cover)' : `Link រូបភាព #${idx + 1}`}
                              </label>
                              <div className="relative">
                                <input
                                  type="url"
                                  value={imgUrl}
                                  onChange={(e) => updateMainImageSlot(idx, e.target.value)}
                                  placeholder="https://... (Image URL)"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-900 placeholder-slate-400 font-mono focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                                />
                                {hasImage && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SECTION 4: BADGES */}
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>៤. ស្លាកសញ្ញាផលិតផល (Product Badges)</span>
                    </h3>

                    {/* Badges Checkboxes */}
                    <div className="flex flex-wrap gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={!!productForm.isBestSeller}
                          onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })}
                          className="rounded text-emerald-700 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>🔥 ផលិតផលលក់ដាច់ (Best Seller)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={!!productForm.isNew}
                          onChange={(e) => setProductForm({ ...productForm, isNew: e.target.checked })}
                          className="rounded text-emerald-700 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>✨ ផលិតផលថ្មី (New Arrival)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={!!productForm.isFreeShipping}
                          onChange={(e) => setProductForm({ ...productForm, isFreeShipping: e.target.checked })}
                          className="rounded text-emerald-700 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>🚚 ដឹកជញ្ជូនឥតគិតថ្លៃ (Free Shipping)</span>
                      </label>
                    </div>
                  </div>

                  {/* SECTION 5: PRODUCT DESCRIPTION CARDS (10 CARDS) */}
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>ការពិពណ៌នាផលិតផល (Product Description Cards)</span>
                        </h3>
                        <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold">
                          10 Cards • ផ្លាស់ប្តូរទីតាំងមុខក្រោយបាន
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
                      {ensureTenCards(productForm.descriptionCards).map((card, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === 9;
                        const hasImage = Boolean(card.image);

                        return (
                          <div
                            key={card.id || idx}
                            className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-xs transition duration-200"
                          >
                            {/* Card Header & Actions */}
                            <div className="flex items-center justify-between mb-2 gap-1">
                              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-md font-mono shrink-0">
                                #{idx + 1}
                              </span>

                              {/* Move Left / Right / Clear Actions */}
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  disabled={isFirst}
                                  onClick={() => handleMoveCard(idx, 'left')}
                                  className={`p-1 rounded-md transition ${
                                    isFirst
                                      ? 'text-slate-300 cursor-not-allowed opacity-40'
                                      : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer active:scale-90'
                                  }`}
                                  title="ផ្លាស់ប្តូរទៅមុខ (Move Left)"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  disabled={isLast}
                                  onClick={() => handleMoveCard(idx, 'right')}
                                  className={`p-1 rounded-md transition ${
                                    isLast
                                      ? 'text-slate-300 cursor-not-allowed opacity-40'
                                      : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer active:scale-90'
                                  }`}
                                  title="ផ្លាស់ប្តូរទៅក្រោយ (Move Right)"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>

                                {hasImage && (
                                  <button
                                    type="button"
                                    onClick={() => handleClearCardPhoto(idx)}
                                    className="text-slate-400 hover:text-rose-600 transition p-1 rounded-md hover:bg-rose-50 cursor-pointer"
                                    title="លុបរូបភាព"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Live Preview Box */}
                            <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50/80 flex items-center justify-center mb-2.5 group p-1.5">
                              {hasImage ? (
                                <>
                                  <img
                                    src={card.image}
                                    alt={`Preview ${idx + 1}`}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800';
                                    }}
                                    className="w-full h-full object-contain group-hover:scale-105 transition duration-300 select-none"
                                  />
                                  <div className="absolute top-1.5 right-1.5 bg-slate-900/75 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1 opacity-90 shadow-xs">
                                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                                    <span>Live</span>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center p-2 text-slate-400 flex flex-col items-center justify-center">
                                  <ImageIcon className="w-6 h-6 mb-1 opacity-40 text-slate-400" />
                                  <span className="text-[10px] font-medium text-slate-500">រូបភាព #{idx + 1}</span>
                                  <span className="text-[8px] text-slate-400">បញ្ចូល Link ខាងក្រោម</span>
                                </div>
                              )}
                            </div>

                            {/* Image URL Input */}
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-700">
                                Link រូបភាព #{idx + 1}
                              </label>
                              <div className="relative">
                                <input
                                  type="url"
                                  value={card.image || ''}
                                  onChange={(e) => updateCardField(idx, 'image', e.target.value)}
                                  placeholder="https://... (Image URL)"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-900 placeholder-slate-400 font-mono focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                                />
                                {hasImage && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* FORM ACTIONS */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleCancelProductForm}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      {language === 'zh' ? '取消' : 'បោះបង់'}
                    </button>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/10 transition cursor-pointer flex items-center gap-2 active:scale-98"
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        {editingProductId
                          ? language === 'zh'
                            ? '保存修改'
                            : 'រក្សាទុកការកែប្រែ'
                          : language === 'zh'
                          ? '立即录入发布'
                          : 'រក្សាទុកផលិតផល'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PRODUCT LIST CATALOG TABLE / CARDS */}
            <div className="bg-white border border-emerald-100 rounded-3xl overflow-hidden shadow-xs space-y-4 p-4 sm:p-6 font-battambang">
              {/* Search & Category Filter */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-xs text-slate-600 font-bold shrink-0">
                    {language === 'zh' ? '分类筛选:' : 'ប្រភេទ:'}
                  </span>
                  <button
                    onClick={() => setProductCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      productCategoryFilter === 'all'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'zh' ? '全部' : 'ទាំងអស់'} ({productsList.length})
                  </button>
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setProductCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        productCategoryFilter === cat.id
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat.nameKm}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder={language === 'zh' ? '搜索商品名称...' : 'ស្វែងរកឈ្មោះផលិតផល...'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white font-mono"
                  />
                  {productSearchQuery && (
                    <button
                      onClick={() => setProductSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Helpful Reordering Guide Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/50 border border-emerald-200/80 text-xs text-emerald-900 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-emerald-950 block sm:inline mr-1">
                      {language === 'zh' ? '💡 商品排序管理：' : '💡 ផ្លាស់ប្តូរទីតាំងផលិតផល (មុខ/ក្រោយ)៖'}
                    </span>
                    <span className="text-emerald-800 text-[11px] sm:text-xs">
                      {language === 'zh'
                        ? '点击每个商品卡片上的 ⬅️ 前移 或 ➡️ 后移 按钮，即可实时调整商城前台的展示顺序。'
                        : 'ចុចប៊ូតុង ⬅️ ទៅមុខ ឬ ➡️ ទៅក្រោយ នៅលើកាតផលិតផលនីមួយៗ ដើម្បីកំណត់លំដាប់បង្ហាញក្នុងហាងភ្លាមៗ។'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Table / Grid */}
              {filteredProductsList.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Package className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">មិនមានផលិតផលត្រូវនឹងការស្វែងរកទេ</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {filteredProductsList.map((prod) => {
                    const categoryObj = CATEGORIES.find((c) => c.id === prod.category);
                    const isDeleting = deleteConfirmId === prod.id;
                    const globalIndex = productsList.findIndex((p) => p.id === prod.id);
                    const isFirst = globalIndex === 0;
                    const isLast = globalIndex === productsList.length - 1;

                    return (
                      <div
                        key={prod.id}
                        className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 flex flex-col justify-between transition group shadow-xs hover:shadow-md relative"
                      >
                        {/* TOP BAR: ORDER POSITION & MOVE CONTROLS */}
                        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 bg-slate-50/70 -mx-4 -mt-4 px-4 pt-3 rounded-t-2xl">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-emerald-800 text-white font-mono shadow-2xs">
                              #{globalIndex + 1}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600">
                              {language === 'zh' ? '排序位' : 'លំដាប់ទី'}
                            </span>
                          </div>

                          {/* REORDER BUTTONS */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={isFirst}
                              onClick={() => handleMoveProduct(prod.id, 'first')}
                              className={`p-1 rounded-lg transition text-xs flex items-center justify-center ${
                                isFirst
                                  ? 'text-slate-300 cursor-not-allowed opacity-40'
                                  : 'bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 cursor-pointer shadow-2xs active:scale-95'
                              }`}
                              title={language === 'zh' ? '置顶（移到最前）' : 'ផ្លាស់ទៅលើគេបង្អស់ (Top #1)'}
                            >
                              <ChevronsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isFirst}
                              onClick={() => handleMoveProduct(prod.id, 'up')}
                              className={`px-1.5 py-1 rounded-lg transition text-xs flex items-center gap-1 ${
                                isFirst
                                  ? 'text-slate-300 cursor-not-allowed opacity-40'
                                  : 'bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 cursor-pointer shadow-2xs active:scale-95'
                              }`}
                              title={language === 'zh' ? '向前移动一位' : 'ផ្លាស់ទៅមុខ (Move Forward / Up)'}
                            >
                              <ArrowLeft className="w-3.5 h-3.5 text-emerald-700" />
                              <span className="text-[10px] font-bold hidden sm:inline">
                                {language === 'zh' ? '前移' : 'ទៅមុខ'}
                              </span>
                            </button>
                            <button
                              type="button"
                              disabled={isLast}
                              onClick={() => handleMoveProduct(prod.id, 'down')}
                              className={`px-1.5 py-1 rounded-lg transition text-xs flex items-center gap-1 ${
                                isLast
                                  ? 'text-slate-300 cursor-not-allowed opacity-40'
                                  : 'bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 cursor-pointer shadow-2xs active:scale-95'
                              }`}
                              title={language === 'zh' ? '向后移动一位' : 'ផ្លាស់ទៅក្រោយ (Move Backward / Down)'}
                            >
                              <span className="text-[10px] font-bold hidden sm:inline">
                                {language === 'zh' ? '后移' : 'ទៅក្រោយ'}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
                            </button>
                            <button
                              type="button"
                              disabled={isLast}
                              onClick={() => handleMoveProduct(prod.id, 'last')}
                              className={`p-1 rounded-lg transition text-xs flex items-center justify-center ${
                                isLast
                                  ? 'text-slate-300 cursor-not-allowed opacity-40'
                                  : 'bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 cursor-pointer shadow-2xs active:scale-95'
                              }`}
                              title={language === 'zh' ? '置底（移到最后）' : 'ផ្លាស់ទៅក្រោមគេបង្អស់ (Bottom)'}
                            >
                              <ChevronsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          {/* Image */}
                          <img
                            src={prod.image}
                            alt={prod.nameKm}
                            referrerPolicy="no-referrer"
                            className="w-20 h-20 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                          />

                          {/* Info */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                                {categoryObj?.nameKm || prod.category}
                              </span>
                              {prod.originalPriceUsd && prod.originalPriceUsd > prod.priceUsd && (
                                <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-md font-bold font-mono">
                                  -{Math.round(((prod.originalPriceUsd - prod.priceUsd) / prod.originalPriceUsd) * 100)}%
                                </span>
                              )}
                              {prod.isBestSeller && (
                                <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-md font-bold">
                                  Best Seller
                                </span>
                              )}
                              {prod.isFreeShipping && (
                                <span className="text-[10px] bg-sky-50 text-sky-800 px-1.5 py-0.5 rounded-md font-bold">
                                  Free Shipping
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-bold text-slate-900 truncate font-opensans">
                              {prod.nameKm}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate">{prod.name}</p>

                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              <span className="text-sm font-black text-emerald-700 font-mono">
                                ${prod.priceUsd.toFixed(2)}
                              </span>
                              {prod.originalPriceUsd && prod.originalPriceUsd > prod.priceUsd && (
                                <span className="text-xs text-slate-400 line-through font-mono">
                                  ${prod.originalPriceUsd.toFixed(2)}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400 font-mono">
                                ({prod.priceKhr.toLocaleString()} ៛)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stock & Action Bar */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                          <span className="text-[11px] text-slate-500 font-mono">
                            Stock: <strong className="text-slate-800">{prod.stock || 100}</strong>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isDeleting ? (
                              <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl border border-rose-200">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(prod.id)}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  លុប
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] cursor-pointer"
                                >
                                  ទេ
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditProduct(prod)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition cursor-pointer"
                                  title="កែប្រែព័ត៌មាន"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                 <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(prod.id)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 transition cursor-pointer"
                                  title="លុបផលិតផល"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMER ACCOUNTS MANAGEMENT */}
        {activeAdminTab === 'users' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveAdminTab('home')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition cursor-pointer px-3 py-1.5 rounded-xl hover:bg-slate-100 font-battambang"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ត្រឡប់ទៅទំព័រដើម (Back to Home)</span>
              </button>
            </div>
            <CustomerManagement language={language} />
          </div>
        )}

        {/* TAB 3: CUSTOMER ORDERS MANAGEMENT */}
        {activeAdminTab === 'orders' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveAdminTab('home')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition cursor-pointer px-3 py-1.5 rounded-xl hover:bg-slate-100 font-battambang"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ត្រឡប់ទៅទំព័រដើម (Back to Home)</span>
              </button>
            </div>
            <OrderManagement language={language} />
          </div>
        )}

        {/* TAB 4: VERIFY MANAGEMENT (GAME & QUIZ SUBMISSIONS) */}
        {activeAdminTab === 'verify' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveAdminTab('home')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition cursor-pointer px-3 py-1.5 rounded-xl hover:bg-slate-100 font-battambang"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ត្រឡប់ទៅទំព័រដើម (Back to Home)</span>
              </button>
            </div>
            <VerifyManagement language={language} />
          </div>
        )}

        {/* FINANCIAL MANAGEMENT MODAL (ចំណូល/ចំណាយ) */}
        <FinancialManagementModal
          isOpen={isFinancialModalOpen}
          onClose={() => setIsFinancialModalOpen(false)}
          language={language}
          totalRevenueUsd={totalRevenueUsd}
        />
      </main>
    </div>
  );
};
