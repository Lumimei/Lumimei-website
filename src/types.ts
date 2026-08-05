export type Language = 'km' | 'en' | 'zh';

export type SkinType = 'all' | 'oily' | 'dry' | 'combination' | 'sensitive' | 'normal' | 'acne';

export interface Category {
  id: string;
  name: string;
  nameKm: string;
  nameZh?: string;
  icon: string;
}

export interface SkinConcern {
  id: string;
  name: string;
  nameKm: string;
  nameZh?: string;
}

export interface Product {
  id: string;
  name: string;
  nameKm: string;
  nameZh?: string;
  brand: string;
  category: string;
  priceUsd: number;
  priceKhr: number;
  originalPriceUsd?: number;
  rating: number;
  reviewCount: number;
  image: string;
  gallery?: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  skinTypes: SkinType[];
  skinConcerns: string[];
  description: string;
  descriptionKm: string;
  descriptionZh?: string;
  howToUse: string;
  howToUseKm: string;
  howToUseZh?: string;
  ingredients: string;
  stock: number;
  volume: string;
  madeInKm?: string;
  benefitsKm?: string[];
  suitableForKm?: string[];
  notSuitableForKm?: string[];
  whoCanUseKm?: string[];
  whoCannotUseKm?: string[];
  storageKm?: string[];
  precautionsKm?: string[];
  videoUrl?: string;
  newUserGuideKm?: string;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'khqr' | 'aba_pay' | 'credit_card' | 'cod' | 'installment';

export interface OrderCustomerInfo {
  fullName: string;
  phone: string;
  telegramPhone?: string;
  cityProvince: string;
  districtSangkat: string;
  addressDetail: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotalUsd: number;
  discountUsd: number;
  shippingFeeUsd: number;
  totalUsd: number;
  totalKhr: number;
  customerInfo: OrderCustomerInfo;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'processing';
  orderStatus: 'pending' | 'confirmed' | 'packing' | 'shipping' | 'delivered';
  createdAt: string;
  estimatedDelivery: string;
  trackingCode: string;
}

export interface FilterState {
  category: string;
  skinConcern: string;
  skinType: SkinType;
  brand: string;
  priceRange: [number, number];
  searchQuery: string;
  sortBy: 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest';
}

export interface BeautyTip {
  id: string;
  title: string;
  titleKm: string;
  summary: string;
  summaryKm: string;
  category: string;
  categoryKm: string;
  readTime: string;
  image: string;
  contentKm: string[];
}
