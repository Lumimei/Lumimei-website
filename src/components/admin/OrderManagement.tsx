import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  db,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from '../../lib/firebase';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Truck,
  CheckCircle2,
  Clock,
  PackageCheck,
  AlertCircle,
  X,
  Eye,
  Trash2,
  Filter,
  CreditCard,
  QrCode,
  Banknote,
  Send,
  ExternalLink,
  Receipt,
} from 'lucide-react';
import { Language } from '../../types';

export interface AdminOrderItem {
  product: {
    id: string;
    nameKm: string;
    nameZh?: string;
    nameEn?: string;
    priceUsd: number;
    image?: string;
  };
  quantity: number;
  selectedOption?: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerInfo: {
    fullName: string;
    phone: string;
    address: string;
    cityProvince: string;
    note?: string;
  };
  items: AdminOrderItem[];
  subtotalUsd: number;
  discountUsd: number;
  shippingFeeUsd: number;
  totalUsd: number;
  totalKhr: number;
  paymentMethod: 'khqr' | 'aba_pay' | 'cod' | 'wing' | string;
  paymentStatus: 'paid' | 'pending' | 'failed' | string;
  orderStatus: 'pending' | 'confirmed' | 'packing' | 'shipping' | 'delivered' | 'cancelled' | string;
  trackingCode?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt?: string;
}

interface OrderManagementProps {
  language: Language;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ language }) => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // Status updating state
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');

  // Fetch all orders using Axios and real-time Firestore sync
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/admin/orders');
      if (response.data && response.data.success && Array.isArray(response.data.orders)) {
        setOrders(response.data.orders);
      }
    } catch (err: any) {
      console.warn('Axios fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Attach real-time Firestore onSnapshot listener to orders collection
    let unsubscribeFirestore: (() => void) | null = null;
    try {
      const ordersColRef = collection(db, 'orders');
      unsubscribeFirestore = onSnapshot(
        ordersColRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const fsOrders: AdminOrder[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as any;
              fsOrders.push({
                id: docSnap.id,
                orderNumber: data.orderNumber || docSnap.id,
                customerInfo: data.customerInfo || {
                  fullName: data.fullName || 'អតិថិជន',
                  phone: data.phoneNumber || data.phone || '',
                  address: data.address || '',
                  cityProvince: data.cityProvince || 'Phnom Penh',
                  note: data.note || '',
                },
                items: Array.isArray(data.items) ? data.items : [],
                subtotalUsd: Number(data.subtotalUsd) || 0,
                discountUsd: Number(data.discountUsd) || 0,
                shippingFeeUsd: Number(data.shippingFeeUsd) || 0,
                totalUsd: Number(data.totalUsd) || 0,
                totalKhr: Number(data.totalKhr) || 0,
                paymentMethod: data.paymentMethod || 'cod',
                paymentStatus: data.paymentStatus || 'pending',
                orderStatus: data.orderStatus || 'pending',
                trackingCode: data.trackingCode,
                estimatedDelivery: data.estimatedDelivery,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt,
              });
            });
            fsOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setOrders(fsOrders);
          }
          setLoading(false);
        },
        (err) => {
          console.warn('Firestore orders onSnapshot warning:', err);
          fetchOrders();
        }
      );
    } catch (err) {
      console.warn('Could not initialize orders onSnapshot:', err);
    }

    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  // Update order status via Axios & Firestore
  const handleUpdateOrderStatus = async (
    orderId: string,
    newOrderStatus: string,
    newPaymentStatus?: string
  ) => {
    setUpdatingOrderId(orderId);
    try {
      // Sync to Firestore directly
      try {
        const orderDocRef = doc(db, 'orders', orderId);
        const updatePayload: any = {
          orderStatus: newOrderStatus,
          updatedAt: new Date().toISOString(),
        };
        if (newPaymentStatus) updatePayload.paymentStatus = newPaymentStatus;
        await setDoc(orderDocRef, updatePayload, { merge: true });
      } catch (fsErr) {
        console.warn('Direct Firestore order update fallback to API:', fsErr);
      }

      const response = await axios.post('/api/admin/orders/update-status', {
        orderId,
        orderStatus: newOrderStatus,
        ...(newPaymentStatus ? { paymentStatus: newPaymentStatus } : {}),
      });

      if (response.data && response.data.success) {
        setSuccessMsg(
          response.data.msg_km ||
            (language === 'zh'
              ? '订单状态已更新！'
              : 'បានកែប្រែស្ថានភាពការកុម្ម៉ង់ទិញជោគជ័យ!')
        );
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) =>
            prev
              ? {
                  ...prev,
                  orderStatus: newOrderStatus,
                  ...(newPaymentStatus ? { paymentStatus: newPaymentStatus } : {}),
                }
              : null
          );
        }
      }
    } catch (err: any) {
      console.error('Update order status error:', err);
      alert(err.response?.data?.msg_km || 'មិនអាចកែប្រែស្ថានភាពការកុម្ម៉ង់បានទេ');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Save tracking code via Axios & Firestore
  const handleSaveTracking = async (orderId: string) => {
    try {
      try {
        const orderDocRef = doc(db, 'orders', orderId);
        await setDoc(orderDocRef, {
          trackingCode: trackingInput.trim(),
          orderStatus: 'shipping',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Direct Firestore tracking save warning:', fsErr);
      }

      const response = await axios.post('/api/admin/orders/update-status', {
        orderId,
        trackingCode: trackingInput.trim(),
        orderStatus: 'shipping',
      });

      if (response.data && response.data.success) {
        setSuccessMsg('បានរក្សាទុកលេខកូដដឹកជញ្ជូន (Tracking Code) ជោគជ័យ!');
        setEditingTrackingId(null);
        setTrackingInput('');
        fetchOrders();
      }
    } catch (err: any) {
      console.error('Save tracking code error:', err);
      alert('មិនអាចរក្សាទុកលេខកូដដឹកជញ្ជូនបានទេ');
    }
  };

  // Delete order via Axios & Firestore
  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    const confirmDelete = window.confirm(
      language === 'zh'
        ? `确定要删除订单 #${orderNumber} 吗？`
        : `តើអ្នកប្រាកដជាចង់លុបការកុម្ម៉ង់ #${orderNumber} នេះមែនទេ?`
    );
    if (!confirmDelete) return;

    try {
      try {
        const orderDocRef = doc(db, 'orders', orderId);
        await deleteDoc(orderDocRef);
      } catch (fsErr) {
        console.warn('Direct Firestore delete order warning:', fsErr);
      }

      const response = await axios.post('/api/admin/orders/delete', { orderId });
      if (response.data && response.data.success) {
        setSuccessMsg(
          language === 'zh'
            ? '订单已删除'
            : `បានលុបការកុម្ម៉ង់ #${orderNumber} ជោគជ័យ`
        );
        if (selectedOrder?.id === orderId) setSelectedOrder(null);
        fetchOrders();
      }
    } catch (err: any) {
      console.error('Delete order error:', err);
      alert('មិនអាចលុបការកុម្ម៉ង់បានទេ');
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      (o.customerInfo?.fullName && o.customerInfo.fullName.toLowerCase().includes(q)) ||
      (o.customerInfo?.phone && o.customerInfo.phone.includes(q)) ||
      (o.customerInfo?.telegramPhone && o.customerInfo.telegramPhone.toLowerCase().includes(q)) ||
      (o.customerInfo?.skinConcern && o.customerInfo.skinConcern.toLowerCase().includes(q)) ||
      (o.trackingCode && o.trackingCode.toLowerCase().includes(q)) ||
      (o.customerInfo?.cityProvince && o.customerInfo.cityProvince.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || o.orderStatus === statusFilter;
    const matchesPayment = paymentFilter === 'all' || o.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Calculate statistics
  const totalRevenueUsd = orders.reduce(
    (sum, o) => (o.paymentStatus === 'paid' ? sum + (o.totalUsd || 0) : sum),
    0
  );
  const pendingPackingCount = orders.filter(
    (o) => o.orderStatus === 'confirmed' || o.orderStatus === 'packing'
  ).length;
  const shippingCount = orders.filter((o) => o.orderStatus === 'shipping').length;
  const deliveredCount = orders.filter((o) => o.orderStatus === 'delivered').length;

  return (
    <div className="space-y-6 font-battambang animate-in fade-in">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-opensans flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-700" />
            <span>
              {language === 'zh'
                ? '客户订单管理 (Customer Orders)'
                : 'ព័ត៌មានការកុម្ម៉ង់ទិញរបស់អតិថិជន'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-battambang mt-1">
            {language === 'zh'
              ? '实时查看客户下的订单、处理打包、发货派送、更新支付与物流状态。'
              : 'ទាញយក និងពិនិត្យការកុម្ម៉ង់ទិញថ្មីៗ តាមដានការរៀបចំកញ្ចប់ ការដឹកជញ្ជូន និងស្ថានភាពទូទាត់ប្រាក់។'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-700' : ''}`} />
            <span>{language === 'zh' ? '刷新订单' : 'ទាញយកការកុម្ម៉ង់ឡើងវិញ'}</span>
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

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">
              {language === 'zh' ? '总订单数' : 'ការកុម្ម៉ង់សរុប'}
            </p>
            <p className="text-lg sm:text-xl font-black text-slate-900 font-opensans">
              {orders.length} <span className="text-xs font-normal text-slate-400">កញ្ចប់</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">
              {language === 'zh' ? '已收款总额 (Paid)' : 'ចំណូលទូទាត់រួច (Paid)'}
            </p>
            <p className="text-lg sm:text-xl font-black text-blue-900 font-opensans">
              ${totalRevenueUsd.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">
              {language === 'zh' ? '待打包/待发货' : 'រង់ចាំរៀបចំកញ្ចប់'}
            </p>
            <p className="text-lg sm:text-xl font-black text-amber-800 font-opensans">
              {pendingPackingCount} <span className="text-xs font-normal text-slate-400">កុម្ម៉ង់</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">
              {language === 'zh' ? '正在派送中' : 'កំពុងដឹកជញ្ជូន'}
            </p>
            <p className="text-lg sm:text-xl font-black text-indigo-900 font-opensans">
              {shippingCount} <span className="text-xs font-normal text-slate-400">កញ្ចប់</span>
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'zh'
                ? '搜索订单号 (BB-...)、客户姓名、手机号或快递单号...'
                : 'ស្វែងរកតាមលេខកូដកុម្ម៉ង់ (BB-...) ឈ្មោះអតិថិជន លេខទូរស័ព្ទ ឬលេខកូដដឹក...'
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
          {/* Order Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">{language === 'zh' ? '所有状态' : 'គ្រប់ស្ថានភាពដឹក'}</option>
              <option value="confirmed">{language === 'zh' ? '已确认' : 'បានបញ្ជាក់ (Confirmed)'}</option>
              <option value="packing">{language === 'zh' ? '正在打包' : 'កំពុងរៀបចំកញ្ចប់ (Packing)'}</option>
              <option value="shipping">{language === 'zh' ? '运输中' : 'កំពុងដឹក (Shipping)'}</option>
              <option value="delivered">{language === 'zh' ? '已送达' : 'បានប្រគល់រួច (Delivered)'}</option>
              <option value="cancelled">{language === 'zh' ? '已取消' : 'បានលុបចោល (Cancelled)'}</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">{language === 'zh' ? '支付状态: 全部' : 'ការទូទាត់: ទាំងអស់'}</option>
              <option value="paid">{language === 'zh' ? '已支付 (Paid)' : 'ទូទាត់រួចរាល់ (Paid)'}</option>
              <option value="pending">{language === 'zh' ? '待付款 (Pending)' : 'រង់ចាំទូទាត់ (Pending)'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-700" />
            <p className="text-xs">
              {language === 'zh'
                ? '正在获取最新订单数据...'
                : 'កំពុងទាញយកទិន្នន័យការកុម្ម៉ង់ទិញ...'}
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              {language === 'zh' ? '未找到相关订单' : 'មិនមានទិន្នន័យការកុម្ម៉ង់ត្រូវនឹងការស្វែងរកឡើយ'}
            </p>
            <p className="text-xs text-slate-400">
              {language === 'zh'
                ? '客户在商城下单后将即时在此列出'
                : 'នៅពេលអតិថិជនកុម្ម៉ង់ទិញតាមវេបសាយ ព័ត៌មាននឹងបង្ហាញនៅទីនេះភ្លាមៗ'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3.5 px-4">ឈ្មោះ</th>
                  <th className="py-3.5 px-4">លេខទូរស័ព្ទ / Telegram</th>
                  <th className="py-3.5 px-4">បញ្ហាស្បែកមុខ</th>
                  <th className="py-3.5 px-4">បានទិញផលិតផល</th>
                  <th className="py-3.5 px-4">ទឹកប្រាក់សរុប</th>
                  <th className="py-3.5 px-4">ស្ថានភាពដឹកជញ្ជូន</th>
                  <th className="py-3.5 px-4 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.map((order) => {
                  const paymentBadge =
                    order.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200';

                  const orderStatusBadge =
                    order.orderStatus === 'delivered'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : order.orderStatus === 'shipping'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : order.orderStatus === 'packing'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : order.orderStatus === 'cancelled'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                  const itemsCount = order.items
                    ? order.items.reduce((sum, i) => sum + (i.quantity || 1), 0)
                    : 0;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/60 transition group"
                    >
                      {/* Name & Order Number */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 font-battambang text-xs sm:text-sm">
                            {order.customerInfo?.fullName || 'អតិថិជន'}
                          </p>
                          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                            <span className="font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                              #{order.orderNumber}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-300" />
                              {new Date(order.createdAt).toLocaleDateString('km-KH')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Telegram */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 font-mono text-emerald-800 font-bold text-xs">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{order.customerInfo?.phone}</span>
                          </div>
                          {order.customerInfo?.telegramPhone ? (
                            <div className="flex items-center gap-1 text-blue-700 text-[11px] font-medium">
                              <span className="font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                                ✈ {order.customerInfo.telegramPhone}
                              </span>
                            </div>
                          ) : null}
                          {order.customerInfo?.cityProvince && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[140px]">{order.customerInfo.cityProvince}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Skin Concern / Note */}
                      <td className="py-3.5 px-4">
                        {order.customerInfo?.skinConcern ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            {order.customerInfo.skinConcern}
                          </span>
                        ) : (order.customerInfo?.notes || order.customerInfo?.note) ? (
                          <span className="text-[11px] text-slate-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            {order.customerInfo.notes || order.customerInfo.note}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">ស្បែកធម្មតា / មិនទាន់បញ្ជាក់</span>
                        )}
                      </td>

                      {/* Purchased Products */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <PackageCheck className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{itemsCount} មុខទំនិញ</span>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div className="space-y-0.5">
                              {order.items.slice(0, 2).map((item, idx) => (
                                <p key={idx} className="text-[11px] text-slate-600 truncate max-w-[190px]">
                                  • {item.product?.nameKm || 'Lumimei Product'} <span className="font-bold text-slate-800">x{item.quantity}</span>
                                </p>
                              ))}
                              {order.items.length > 2 && (
                                <p className="text-[10px] text-emerald-700 font-semibold">
                                  +{order.items.length - 2} មុខទំនិញទៀត...
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-slate-900 font-opensans text-sm">
                            ${(order.totalUsd || 0).toFixed(2)}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            ៛{(order.totalKhr || Math.round((order.totalUsd || 0) * 4100)).toLocaleString()}
                          </p>
                        </div>
                      </td>

                      {/* Shipping & Payment Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${orderStatusBadge}`}
                            >
                              {order.orderStatus === 'delivered'
                                ? 'ប្រគល់រួច'
                                : order.orderStatus === 'shipping'
                                ? 'កំពុងដឹក'
                                : order.orderStatus === 'packing'
                                ? 'កំពុងវេចខ្ចប់'
                                : order.orderStatus === 'cancelled'
                                ? 'បានលុបចោល'
                                : 'បានបញ្ជាក់'}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${paymentBadge}`}
                            >
                              {order.paymentStatus === 'paid' ? 'ទូទាត់រួច' : 'រង់ចាំទូទាត់'}
                            </span>
                          </div>

                          {/* Tracking code */}
                          {order.trackingCode && (
                            <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                              <Truck className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>{order.trackingCode}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                            title="មើលព័ត៌មានលម្អិត"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">លម្អិត</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 transition cursor-pointer"
                            title="លុបការកុម្ម៉ង់"
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
      {/* POPUP MODAL: ORDER DETAILS & STATUS WORKFLOW            */}
      {/* ======================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-emerald-100 my-8 space-y-6 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg font-opensans">
                      ការកុម្ម៉ង់ #{selectedOrder.orderNumber}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${
                        selectedOrder.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {selectedOrder.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    កាលបរិច្ឆេទ: {new Date(selectedOrder.createdAt).toLocaleString('km-KH')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Action Controls */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  ផ្លាស់ប្តូរស្ថានភាពកុម្ម៉ង់ទិញ (Order Workflow):
                </span>
                {updatingOrderId === selectedOrder.id && (
                  <RefreshCw className="w-4 h-4 text-emerald-700 animate-spin" />
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'confirmed')}
                  className={`py-2 px-3 rounded-xl border transition text-center cursor-pointer ${
                    selectedOrder.orderStatus === 'confirmed'
                      ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  ១. បានបញ្ជាក់
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'packing')}
                  className={`py-2 px-3 rounded-xl border transition text-center cursor-pointer ${
                    selectedOrder.orderStatus === 'packing'
                      ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-amber-50 border-slate-200'
                  }`}
                >
                  ២. វេចខ្ចប់ (Packing)
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'shipping')}
                  className={`py-2 px-3 rounded-xl border transition text-center cursor-pointer ${
                    selectedOrder.orderStatus === 'shipping'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-blue-50 border-slate-200'
                  }`}
                >
                  ៣. កំពុងដឹក (Shipping)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleUpdateOrderStatus(selectedOrder.id, 'delivered', 'paid')
                  }
                  className={`py-2 px-3 rounded-xl border transition text-center cursor-pointer ${
                    selectedOrder.orderStatus === 'delivered'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-emerald-50 border-slate-200'
                  }`}
                >
                  ៤. ប្រគល់រួច (Delivered)
                </button>
              </div>
            </div>

            {/* Customer & Delivery Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Customer Box */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ព័ត៌មានទំនាក់ទំនងអតិថិជន</span>
                </h4>
                <div className="space-y-1 text-slate-600">
                  <p>
                    <strong className="text-slate-900">ឈ្មោះ:</strong>{' '}
                    {selectedOrder.customerInfo?.fullName}
                  </p>
                  <p>
                    <strong className="text-slate-900">លេខទូរស័ព្ទ:</strong>{' '}
                    <span className="font-mono text-emerald-800 font-bold">
                      {selectedOrder.customerInfo?.phone}
                    </span>
                  </p>
                  {(selectedOrder.customerInfo?.notes || selectedOrder.customerInfo?.note) && (
                    <p className="bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 text-amber-950 text-xs mt-2">
                      <strong className="text-amber-900 block mb-0.5">📝 កំណត់សំគាល់អតិថិជន:</strong>
                      {selectedOrder.customerInfo.notes || selectedOrder.customerInfo.note}
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery Box */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ទីតាំង និងព័ត៌មានដឹកជញ្ជូន</span>
                </h4>
                <div className="space-y-1 text-slate-600">
                  <p>
                    <strong className="text-slate-900">ខេត្ត/ក្រុង:</strong>{' '}
                    {selectedOrder.customerInfo?.cityProvince}
                  </p>
                  <p>
                    <strong className="text-slate-900">អាសយដ្ឋាន:</strong>{' '}
                    {selectedOrder.customerInfo?.address}
                  </p>
                  <p>
                    <strong className="text-slate-900">ការប៉ាន់ស្មាន:</strong>{' '}
                    {selectedOrder.estimatedDelivery || '១ - ២ ថ្ងៃ'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tracking Code Input */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-700 shrink-0" />
                <div>
                  <span className="font-bold text-blue-950">លេខកូដតាមដានដឹកជញ្ជូន (Tracking Code): </span>
                  <span className="font-mono font-bold text-blue-800">
                    {selectedOrder.trackingCode || 'មិនទាន់កំណត់'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="ឧ. JT89234101KH..."
                  className="px-3 py-1.5 bg-white border border-blue-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono w-40"
                />
                <button
                  type="button"
                  onClick={() => handleSaveTracking(selectedOrder.id)}
                  disabled={!trackingInput.trim()}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold transition disabled:opacity-40 cursor-pointer"
                >
                  រក្សាទុក
                </button>
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                បញ្ជីទំនិញដែលបានកុម្ម៉ង់ (Ordered Items):
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs">
                {selectedOrder.items &&
                  selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {item.product?.image ? (
                          <img
                            src={item.product.image}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">
                            {item.product?.nameKm || 'Lumimei Product'}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            ${(item.product?.priceUsd || 0).toFixed(2)} x {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-extrabold text-slate-900 font-opensans">
                        ${((item.product?.priceUsd || 0) * (item.quantity || 1)).toFixed(2)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Price Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>តម្លៃទំនិញសរុប (Subtotal):</span>
                <span className="font-opensans">${(selectedOrder.subtotalUsd || 0).toFixed(2)}</span>
              </div>
              {selectedOrder.discountUsd > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>ការបញ្ចុះតម្លៃ (Discount):</span>
                  <span className="font-opensans">-${selectedOrder.discountUsd.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>ថ្លៃដឹកជញ្ជូន (Shipping):</span>
                <span className="font-opensans">
                  {selectedOrder.shippingFeeUsd > 0
                    ? `$${selectedOrder.shippingFeeUsd.toFixed(2)}`
                    : 'ឥតគិតថ្លៃ (Free)'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span>ទឹកប្រាក់ត្រូវទូទាត់សរុប (Grand Total):</span>
                <div className="text-right font-opensans text-emerald-800">
                  <span>${(selectedOrder.totalUsd || 0).toFixed(2)}</span>
                  <span className="text-xs text-slate-500 font-mono block font-normal">
                    (៛{(selectedOrder.totalKhr || Math.round((selectedOrder.totalUsd || 0) * 4100)).toLocaleString()})
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
              >
                បិទផ្ទាំង (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
