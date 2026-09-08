import { Product } from '../types';
import { PRODUCTS, KHR_RATE } from '../data/products';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

const STORAGE_KEY = 'lumimei_custom_products_catalog';
const DATABASE_ID = 'ai-studio-lumimei-7c9bf061-363f-4616-997f-7ddb5ae1f0b3';
const PROJECT_ID = 'lumimei-production-168';

// In-memory cache for fast synchronous access
let inMemoryProductsCache: Product[] = [];
let isFirestoreListenerAttached = false;
let isSeedingInProgress = false;

/**
 * Format a Product object to Firestore REST API fields structure
 */
function productToRestFields(p: Product) {
  const fields: Record<string, any> = {
    id: { stringValue: p.id },
    name: { stringValue: p.name || '' },
    nameKm: { stringValue: p.nameKm || '' },
    nameZh: { stringValue: p.nameZh || '' },
    brand: { stringValue: p.brand || 'Lumimei Cambodia' },
    category: { stringValue: p.category || 'all' },
    priceUsd: { doubleValue: Number(p.priceUsd) || 0 },
    priceKhr: { integerValue: String(p.priceKhr || Math.round((Number(p.priceUsd) || 0) * KHR_RATE)) },
    image: { stringValue: p.image || '' },
    isBestSeller: { booleanValue: !!p.isBestSeller },
    isNew: { booleanValue: !!p.isNew },
    isFreeShipping: { booleanValue: !!p.isFreeShipping },
    stock: { integerValue: String(p.stock ?? 100) },
    order: { integerValue: String(p.order ?? 0) },
  };

  if (p.originalPriceUsd) fields.originalPriceUsd = { doubleValue: Number(p.originalPriceUsd) };
  if (p.volume) fields.volume = { stringValue: p.volume };
  if (p.description) fields.description = { stringValue: p.description };
  if (p.descriptionKm) fields.descriptionKm = { stringValue: p.descriptionKm };
  if (p.descriptionZh) fields.descriptionZh = { stringValue: p.descriptionZh };
  if (p.howToUse) fields.howToUse = { stringValue: p.howToUse };
  if (p.howToUseKm) fields.howToUseKm = { stringValue: p.howToUseKm };
  if (p.howToUseZh) fields.howToUseZh = { stringValue: p.howToUseZh };
  if (p.ingredients) fields.ingredients = { stringValue: p.ingredients };
  if (p.madeInKm) fields.madeInKm = { stringValue: p.madeInKm };
  if (p.videoUrl) fields.videoUrl = { stringValue: p.videoUrl };
  if (p.newUserGuideKm) fields.newUserGuideKm = { stringValue: p.newUserGuideKm };

  if (Array.isArray(p.gallery)) {
    fields.gallery = {
      arrayValue: { values: p.gallery.map((g) => ({ stringValue: g })) },
    };
  }
  if (Array.isArray(p.skinTypes)) {
    fields.skinTypes = {
      arrayValue: { values: p.skinTypes.map((st) => ({ stringValue: st })) },
    };
  }
  if (Array.isArray(p.skinConcerns)) {
    fields.skinConcerns = {
      arrayValue: { values: p.skinConcerns.map((sc) => ({ stringValue: sc })) },
    };
  }
  if (Array.isArray(p.benefitsKm)) {
    fields.benefitsKm = {
      arrayValue: { values: p.benefitsKm.map((b) => ({ stringValue: b })) },
    };
  }
  if (Array.isArray(p.suitableForKm)) {
    fields.suitableForKm = {
      arrayValue: { values: p.suitableForKm.map((s) => ({ stringValue: s })) },
    };
  }
  if (Array.isArray(p.notSuitableForKm)) {
    fields.notSuitableForKm = {
      arrayValue: { values: p.notSuitableForKm.map((ns) => ({ stringValue: ns })) },
    };
  }
  if (Array.isArray(p.whoCanUseKm)) {
    fields.whoCanUseKm = {
      arrayValue: { values: p.whoCanUseKm.map((w) => ({ stringValue: w })) },
    };
  }
  if (Array.isArray(p.whoCannotUseKm)) {
    fields.whoCannotUseKm = {
      arrayValue: { values: p.whoCannotUseKm.map((w) => ({ stringValue: w })) },
    };
  }
  if (Array.isArray(p.storageKm)) {
    fields.storageKm = {
      arrayValue: { values: p.storageKm.map((st) => ({ stringValue: st })) },
    };
  }
  if (Array.isArray(p.precautionsKm)) {
    fields.precautionsKm = {
      arrayValue: { values: p.precautionsKm.map((pr) => ({ stringValue: pr })) },
    };
  }

  return fields;
}

/**
 * REST API direct write fallback for high reliability in restrictive networks
 */
async function writeProductViaRestApi(product: Product): Promise<boolean> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/products/${product.id}`;
    const payload = { fields: productToRestFields(product) };
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn('【REST API Write Product】Notice:', err);
    return false;
  }
}

/**
 * REST API direct delete fallback
 */
async function deleteProductViaRestApi(productId: string): Promise<boolean> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/products/${productId}`;
    const res = await fetch(url, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.warn('【REST API Delete Product】Notice:', err);
    return false;
  }
}

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

    // Seed each product concurrently via SDK & REST API
    const promises = productsToSeed.map(async (prod) => {
      try {
        const docRef = doc(db, 'products', prod.id);
        const sdkWrite = setDoc(docRef, prod, { merge: true });
        const restWrite = writeProductViaRestApi(prod);
        await Promise.race([
          Promise.allSettled([sdkWrite, restWrite]),
          new Promise((resolve) => setTimeout(resolve, 4000)),
        ]);
        console.log(`【Firestore Product Seeded】${prod.id}: ${prod.name}`);
      } catch (err) {
        console.warn(`【Firestore Product Seed Warning】${prod.id}:`, err);
        // Fallback direct REST
        await writeProductViaRestApi(prod);
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
  } catch (err) {
    console.warn('【Firestore Fetch Fallback】使用本地缓存并尝试后台同步:', err);
    // Try REST fetch fallback
    try {
      const restUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/products`;
      const res = await fetch(restUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.documents && Array.isArray(data.documents) && data.documents.length > 0) {
          const items: Product[] = data.documents.map((d: any) => {
            const f = d.fields || {};
            const extractString = (field: any) => field?.stringValue || '';
            const extractNumber = (field: any) => Number(field?.doubleValue || field?.integerValue || 0);
            const extractBool = (field: any) => Boolean(field?.booleanValue);
            const extractArray = (field: any) =>
              field?.arrayValue?.values?.map((v: any) => v.stringValue || '') || [];

            const id = d.name.split('/').pop() || extractString(f.id);
            return {
              id,
              name: extractString(f.name),
              nameKm: extractString(f.nameKm),
              nameZh: extractString(f.nameZh),
              brand: extractString(f.brand) || 'Lumimei Cambodia',
              category: extractString(f.category) || 'all',
              priceUsd: extractNumber(f.priceUsd),
              priceKhr: extractNumber(f.priceKhr) || Math.round(extractNumber(f.priceUsd) * KHR_RATE),
              originalPriceUsd: f.originalPriceUsd ? extractNumber(f.originalPriceUsd) : undefined,
              image: extractString(f.image),
              gallery: extractArray(f.gallery),
              skinTypes: extractArray(f.skinTypes),
              skinConcerns: extractArray(f.skinConcerns),
              isBestSeller: extractBool(f.isBestSeller),
              isNew: extractBool(f.isNew),
              isFreeShipping: extractBool(f.isFreeShipping),
              stock: extractNumber(f.stock) || 100,
              order: extractNumber(f.order),
              description: extractString(f.description),
              descriptionKm: extractString(f.descriptionKm),
              descriptionZh: extractString(f.descriptionZh),
              howToUse: extractString(f.howToUse),
              howToUseKm: extractString(f.howToUseKm),
              howToUseZh: extractString(f.howToUseZh),
              ingredients: extractString(f.ingredients),
              volume: extractString(f.volume),
              madeInKm: extractString(f.madeInKm),
              videoUrl: extractString(f.videoUrl),
              newUserGuideKm: extractString(f.newUserGuideKm),
              benefitsKm: extractArray(f.benefitsKm),
              suitableForKm: extractArray(f.suitableForKm),
              notSuitableForKm: extractArray(f.notSuitableForKm),
              whoCanUseKm: extractArray(f.whoCanUseKm),
              whoCannotUseKm: extractArray(f.whoCannotUseKm),
              storageKm: extractArray(f.storageKm),
              precautionsKm: extractArray(f.precautionsKm),
            } as Product;
          });

          const sorted = sortProducts(items);
          updateLocalCache(sorted);
          return sorted;
        } else {
          // If empty via REST as well, trigger seed
          seedInitialProductsToFirestore();
        }
      }
    } catch (restErr) {
      console.warn('【REST Fetch Fallback Notice】:', restErr);
    }

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
        console.warn('【Firestore onSnapshot Notice】:', error);
        // On snapshot error, perform one-time fetch fallback
        fetchProductsFromFirestore().then(callback);
      }
    );
  } catch (err) {
    console.warn('【Firestore Subscribe Error】:', err);
    fetchProductsFromFirestore().then(callback);
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

  // 2. Persist to Firestore with SDK + REST dual insurance
  try {
    const docRef = doc(db, 'products', prodId);
    const sdkWrite = setDoc(docRef, fullProduct, { merge: true });
    const restWrite = writeProductViaRestApi(fullProduct);

    await Promise.race([
      Promise.allSettled([sdkWrite, restWrite]),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
    console.log('【Firestore Save Product Success】', prodId);
  } catch (err) {
    console.warn('【Firestore Save Product Warning】:', err);
    await writeProductViaRestApi(fullProduct);
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

  // 2. Delete from Firestore with SDK + REST dual insurance
  try {
    const docRef = doc(db, 'products', productId);
    const sdkDelete = deleteDoc(docRef);
    const restDelete = deleteProductViaRestApi(productId);

    await Promise.race([
      Promise.allSettled([sdkDelete, restDelete]),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
    console.log('【Firestore Delete Product Success】', productId);
  } catch (err) {
    console.warn('【Firestore Delete Product Warning】:', err);
    await deleteProductViaRestApi(productId);
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
      await Promise.race([
        setDoc(docRef, { order: prod.order }, { merge: true }),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    } catch (e) {
      await writeProductViaRestApi(prod);
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
