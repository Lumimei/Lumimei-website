import { Product } from '../types';
import { PRODUCTS, KHR_RATE } from '../data/products';
import { db } from '../lib/firebase';
import {
  FIRESTORE_DB_ID,
  FIREBASE_PROJECT_ID,
} from '../lib/firebaseConfig';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  deleteField,
} from 'firebase/firestore';

const STORAGE_KEY = 'lumimei_custom_products_catalog';
export const DATABASE_ID = FIRESTORE_DB_ID;
export const PROJECT_ID = FIREBASE_PROJECT_ID;

// In-memory cache for fast synchronous access
let inMemoryProductsCache: Product[] = [];
let isFirestoreListenerAttached = false;
let isSeedingInProgress = false;

/**
 * Sort products array according to explicit `order` index or ID
 */
function sortProducts(list: Product[]): Product[] {
  return [...list].sort((a, b) => {
    if (typeof a.order === 'number' && typeof b.order === 'number') {
      return a.order - b.order;
    }
    if (typeof a.order === 'number') return -1;
    if (typeof b.order === 'number') return 1;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Update local cache and notify app listeners
 */
function updateLocalCache(products: Product[]) {
  const sorted = sortProducts(products);
  inMemoryProductsCache = sorted;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  } catch (e) {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lumimei_products_updated', { detail: sorted }));
  }
}

/**
 * Synchronously retrieve all products from memory/localStorage cache
 */
export function getAllStoredProducts(): Product[] {
  if (inMemoryProductsCache.length > 0) {
    return inMemoryProductsCache;
  }

  try {
    const customJson = localStorage.getItem(STORAGE_KEY);
    if (customJson) {
      const parsed: Product[] = JSON.parse(customJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryProductsCache = sortProducts(parsed);
        return inMemoryProductsCache;
      }
    }
  } catch (err) {
    // ignore
  }

  // Fallback to baseline PRODUCTS
  inMemoryProductsCache = sortProducts(PRODUCTS);
  return inMemoryProductsCache;
}

/**
 * Seed initial baseline catalog to Firestore named database
 * (ai-studio-lumimei-7c9bf061-363f-4616-997f-7ddb5ae1f0b3)
 */
export async function seedInitialProductsToFirestore(force = false): Promise<void> {
  if (isSeedingInProgress) return;
  isSeedingInProgress = true;

  console.log('【Firestore Sync】正在初始化商品数据到 Firestore products 集合...');

  try {
    const productsToSeed = PRODUCTS.map((p, index) => ({
      ...p,
      order: index,
      priceKhr: p.priceKhr || Math.round((Number(p.priceUsd) || 0) * KHR_RATE),
    }));

    // Seed each product concurrently via Firestore SDK
    const promises = productsToSeed.map(async (prod) => {
      try {
        const docRef = doc(db, 'products', prod.id);
        await setDoc(docRef, prod, { merge: true });
        console.log(`【Firestore Product Seeded】${prod.id}: ${prod.name}`);
      } catch (err) {
        console.warn(`【Firestore Product Seed Warning】${prod.id}:`, err);
      }
    });

    await Promise.allSettled(promises);
    updateLocalCache(productsToSeed);
    console.log('【Firestore Sync】所有商品数据已成功同步至数据库！');
  } catch (error) {
    console.error('【Firestore Sync Error】初始化商品失败:', error);
  } finally {
    isSeedingInProgress = false;
  }
}

/**
 * Fetch latest products once from Firestore (SDK + REST fallback)
 */
export async function fetchProductsFromFirestore(): Promise<Product[]> {
  try {
    const colRef = collection(db, 'products');
    const q = query(colRef);
    const snapshotPromise = getDocs(q);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore getDocs timeout (4s)')), 4000)
    );

    const snapshot = await Promise.race([snapshotPromise, timeoutPromise]);

    if (!snapshot.empty) {
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        items.push({
          ...data,
          id: docSnap.id || data.id,
        });
      });

      const sorted = sortProducts(items);
      updateLocalCache(sorted);
      return sorted;
    } else {
      console.log('【Firestore Notice】商品集合为空，触发初始数据同步...');
      await seedInitialProductsToFirestore();
      return getAllStoredProducts();
    }
  } catch (err: any) {
    const isPerm = err?.code === 'permission-denied' || String(err?.message || '').toLowerCase().includes('permission');
    if (isPerm) {
      console.warn('【Firestore Products 403】商品权限受限(permission-denied)，使用本地缓存');
      return getAllStoredProducts();
    }
    console.warn('【Firestore Fetch Fallback】使用本地缓存:', err);
    return getAllStoredProducts();
  }
}

/**
 * Subscribe to real-time changes in products catalog from Firestore Cloud
 */
export function subscribeToProducts(callback: (products: Product[]) => void): () => void {
  // 1. Emit cached products immediately to prevent blank flashes
  const initial = getAllStoredProducts();
  callback(initial);

  // 2. Attach real-time Firestore listener
  let unsubscribeFirestore: (() => void) | null = null;

  try {
    const colRef = collection(db, 'products');
    unsubscribeFirestore = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: Product[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Product;
            items.push({
              ...data,
              id: docSnap.id || data.id,
            });
          });
          const sorted = sortProducts(items);
          updateLocalCache(sorted);
          callback(sorted);
        } else {
          console.log('【Firestore onSnapshot】商品列表为空，开始自动同步初始商品...');
          seedInitialProductsToFirestore();
        }
      },
      (error) => {
        const isPerm = error?.code === 'permission-denied' || String(error?.message || '').toLowerCase().includes('permission');
        if (isPerm) {
          console.warn('【Firestore Products 403】商品集合规则限制访问，已自动使用本地商品数据');
          callback(getAllStoredProducts());
          return;
        }
        console.warn('【Firestore onSnapshot Notice】:', error);
        fetchProductsFromFirestore().then(callback).catch(() => callback(getAllStoredProducts()));
      }
    );
  } catch (err) {
    console.warn('【Firestore Subscribe Error】:', err);
    callback(getAllStoredProducts());
  }

  // 3. Listen to window events for instant local sync
  const handleUpdate = () => {
    const updated = getAllStoredProducts();
    callback(updated);
  };

  window.addEventListener('lumimei_products_updated', handleUpdate);
  window.addEventListener('storage', handleUpdate);

  return () => {
    if (unsubscribeFirestore) {
      try {
        unsubscribeFirestore();
      } catch (e) {
        // ignore
      }
    }
    window.removeEventListener('lumimei_products_updated', handleUpdate);
    window.removeEventListener('storage', handleUpdate);
  };
}

/**
 * Save or update a product in Firestore Cloud & Local cache (Create / Update)
 */
export async function saveStoredProduct(product: Product): Promise<Product[]> {
  const prodId = product.id || `prod_${Date.now()}`;
  const fullProduct: Product = {
    ...product,
    id: prodId,
    priceKhr: product.priceKhr || Math.round((Number(product.priceUsd) || 0) * KHR_RATE),
  };
  if (!fullProduct.discountCode) {
    delete fullProduct.discountCode;
    delete fullProduct.discountPercent;
  }

  // 1. Instantly update local cache for smooth UI experience
  const current = getAllStoredProducts();
  const index = current.findIndex((p) => p.id === prodId);
  let updatedList: Product[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = fullProduct;
  } else {
    updatedList = [fullProduct, ...current];
  }
  updateLocalCache(updatedList);

  // 2. Persist to Firestore with Firestore SDK
  try {
    const docRef = doc(db, 'products', prodId);
    const firestoreData: any = { ...fullProduct };
    if (!fullProduct.discountCode) {
      firestoreData.discountCode = deleteField();
      firestoreData.discountPercent = deleteField();
    }
    await setDoc(docRef, firestoreData, { merge: true });
    console.log('【Firestore Save Product Success】', prodId);
  } catch (err) {
    console.warn('【Firestore Save Product Warning】:', err);
  }

  return updatedList;
}

/**
 * Delete a product from Firestore Cloud & Local cache (Delete)
 */
export async function deleteStoredProduct(productId: string): Promise<Product[]> {
  if (!productId) return getAllStoredProducts();

  // 1. Instantly update local cache
  const current = getAllStoredProducts();
  const updatedList = current.filter((p) => p.id !== productId);
  updateLocalCache(updatedList);

  // 2. Delete from Firestore with Firestore SDK
  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
    console.log('【Firestore Delete Product Success】', productId);
  } catch (err) {
    console.warn('【Firestore Delete Product Warning】:', err);
  }

  return updatedList;
}

/**
 * Save new order of products across Firestore Cloud & Local cache
 */
export async function saveProductsReorder(reorderedProducts: Product[]): Promise<Product[]> {
  if (!Array.isArray(reorderedProducts)) return getAllStoredProducts();

  const indexedList: Product[] = reorderedProducts.map((p, idx) => ({
    ...p,
    order: idx,
  }));

  // 1. Instantly update local cache
  updateLocalCache(indexedList);

  // 2. Batch update order in Firestore
  const updatePromises = indexedList.map(async (prod) => {
    try {
      const docRef = doc(db, 'products', prod.id);
      await setDoc(docRef, { order: prod.order }, { merge: true });
    } catch (e) {
      console.warn('【Firestore Reorder Product Notice】:', e);
    }
  });

  Promise.allSettled(updatePromises).catch((err) => {
    console.warn('【Firestore Reorder Notice】:', err);
  });

  return indexedList;
}

/**
 * Upload an image file to /api/upload
 */
export async function uploadImageFile(
  file: File
): Promise<{ success: boolean; url: string; relativeUrl?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const textResp = await res.text();
      throw new Error(`Server returned non-JSON response (${res.status}): ${textResp.slice(0, 100)}`);
    }

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.msg_km || data.msg_zh || data.error || 'Upload failed');
    }

    return {
      success: true,
      url: data.imageUrl || data.url || data.image_url,
      relativeUrl: data.relativeUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      url: '',
      error: err.message || 'Failed to upload image',
    };
  }
}

/**
 * Get only custom products
 */
export function getCustomStoredProducts(): Product[] {
  try {
    const customJson = localStorage.getItem(STORAGE_KEY);
    if (!customJson) return [];
    const list = JSON.parse(customJson);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Auto-trigger background hydration and sync check on module boot
if (typeof window !== 'undefined') {
  setTimeout(() => {
    fetchProductsFromFirestore().catch((err) => {
      console.warn('【ProductManager Background Sync Init】:', err);
    });
  }, 100);
}
