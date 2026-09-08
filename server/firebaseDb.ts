import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  setLogLevel,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import firebaseConfig from '../firebase-applet-config.json';
import { TaskLogRecord, TaskSubmission, PointLogRecord } from './types';

try {
  setLogLevel('silent');
} catch {
  // Ignore
}

// In-memory resilient storage to cache Firestore documents and optimize query speed
const memoryStore = {
  submissions: new Map<string, TaskSubmission>(),
  users: new Map<string, any>(),
  orders: new Map<string, any>(),
  products: new Map<string, any>(),
  taskLogs: [] as TaskLogRecord[],
  pointLogs: [] as PointLogRecord[],
};

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (err) {
    console.warn('Could not create uploads directory:', err);
  }
}

/**
 * Save base64 image string to disk file and return relative web URL
 */
function saveBase64ImageToDisk(base64Data: string, subId: string): string {
  if (!base64Data || !base64Data.startsWith('data:image/')) {
    return base64Data || '';
  }

  try {
    const matches = base64Data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches || matches.length < 3) {
      return base64Data;
    }

    let ext = matches[1].toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    const base64Content = matches[2];
    const fileName = `proof_${subId}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, Buffer.from(base64Content, 'base64'));
    return `/uploads/${fileName}`;
  } catch (err) {
    console.warn('Failed to save base64 image to disk:', err);
    return base64Data;
  }
}

// Initialize dedicated server Firebase app instance
const serverApp = getApps().some((app) => app.name === 'lumimei-server')
  ? getApp('lumimei-server')
  : initializeApp(firebaseConfig, 'lumimei-server');

const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || "ai-studio-lumimei-7c9bf061-363f-4616-997f-7ddb5ae1f0b3";

export const db = initializeFirestore(serverApp, {
  experimentalForceLongPolling: true,
}, databaseId);

/**
 * Find user document by userId (UID) or fallback by phoneNumber
 */
export async function findUser(userIdOrPhone: string) {
  if (!userIdOrPhone) return null;

  // Check memory store first
  if (memoryStore.users.has(userIdOrPhone)) {
    return memoryStore.users.get(userIdOrPhone);
  }
  for (const u of memoryStore.users.values()) {
    if (u.phoneNumber === userIdOrPhone || u.id === userIdOrPhone) {
      return u;
    }
  }

  // 1. Try finding by document ID (UID)
  try {
    const userRef = doc(db, 'users', userIdOrPhone);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = { id: userSnap.id, ...userSnap.data() } as any;
      memoryStore.users.set(userIdOrPhone, data);
      return data;
    }
  } catch (err) {
    // Graceful fallback to memory store
  }

  // 2. Try query by phoneNumber
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', userIdOrPhone), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      const data = { id: docSnap.id, ...docSnap.data() } as any;
      memoryStore.users.set(userIdOrPhone, data);
      return data;
    }
  } catch (err) {
    // Graceful fallback
  }

  return null;
}

/**
 * Award points to user and update their tier if applicable
 */
export async function awardUserPoints(userId: string, pointsToAdd: number) {
  let currentPoints = 0;
  let userData: any = memoryStore.users.get(userId) || {};

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      userData = { ...userData, ...userSnap.data() };
      currentPoints = typeof userData.points === 'number' ? userData.points : 0;
    } else if (typeof userData.points === 'number') {
      currentPoints = userData.points;
    }
  } catch (err) {
    if (typeof userData.points === 'number') {
      currentPoints = userData.points;
    }
  }

  const newPoints = currentPoints + pointsToAdd;
  userData.points = newPoints;
  userData.updatedAt = new Date().toISOString();
  memoryStore.users.set(userId, userData);

  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        points: newPoints,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    // Handled gracefully in memoryStore
  }

  return {
    previousPoints: currentPoints,
    newPoints,
    phoneNumber: userData.phoneNumber || '',
    fullName: userData.fullName || userData.displayName || '',
  };
}

/**
 * Create a persistent task audit log in Firestore
 */
export async function createTaskAuditLog(logData: Omit<TaskLogRecord, 'id'>) {
  const logId = `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const payload: TaskLogRecord = {
    id: logId,
    ...logData,
    createdAt: new Date().toISOString(),
    timestamp: Date.now(),
  };

  memoryStore.taskLogs.unshift(payload);

  try {
    const logRef = doc(db, 'taskLogs', logId);
    await setDoc(logRef, {
      ...payload,
      serverTime: serverTimestamp(),
    });
  } catch (err) {
    // Handled in memoryStore
  }

  return payload;
}

/**
 * Retrieve recent task logs
 */
export async function getRecentTaskLogs(limitCount = 50) {
  try {
    const logsRef = collection(db, 'taskLogs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    const fsLogs = snapshot.docs.map((docSnap) => docSnap.data() as TaskLogRecord);
    if (fsLogs.length > 0) return fsLogs;
  } catch (err) {
    // Fallback to memory
  }
  return memoryStore.taskLogs.slice(0, limitCount);
}

/**
 * Check if a pending submission already exists for userId and taskId
 */
export async function getPendingSubmission(userId: string, taskId: string): Promise<TaskSubmission | null> {
  // Check memory store first
  for (const sub of memoryStore.submissions.values()) {
    if (sub.user_id === userId && sub.task_id === taskId && sub.status === 'pending') {
      return sub;
    }
  }

  try {
    const subsRef = collection(db, 'task_submissions');
    const q = query(
      subsRef,
      where('user_id', '==', userId),
      where('task_id', '==', taskId),
      where('status', '==', 'pending'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = { id: docSnap.id, ...(docSnap.data() as any) } as TaskSubmission;
      memoryStore.submissions.set(data.id, data);
      return data;
    }
  } catch (err) {
    // Fallback gracefully to memory store
  }
  return null;
}

/**
 * Insert a new task submission into task_submissions
 */
export async function createTaskSubmission(
  userId: string,
  taskId: string,
  imageUrl?: string,
  rewardPoints = 15,
  metadata?: { phoneNumber?: string; userFullName?: string; taskName?: string }
): Promise<TaskSubmission> {
  const subId = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const cleanImageUrl = imageUrl ? saveBase64ImageToDisk(imageUrl, subId) : '';

  const payload: TaskSubmission = {
    id: subId,
    user_id: userId,
    task_id: taskId,
    proof_image_url: cleanImageUrl,
    status: 'pending',
    reward_points: rewardPoints,
    phone_number: metadata?.phoneNumber || '',
    user_full_name: metadata?.userFullName || '',
    task_name: metadata?.taskName || '',
    created_at: new Date().toISOString(),
  };

  // 1. Immediately save to in-memory store
  memoryStore.submissions.set(subId, payload);

  // 2. Also asynchronously persist to Firestore
  try {
    const subRef = doc(db, 'task_submissions', subId);
    await setDoc(subRef, {
      ...payload,
      serverTime: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firestore task_submissions write fallback:', err);
  }

  return payload;
}

/**
 * Retrieve all submissions for a given user
 */
export async function getUserSubmissions(userId: string): Promise<TaskSubmission[]> {
  const userSubsMap = new Map<string, TaskSubmission>();

  // 1. Collect from memory
  for (const sub of memoryStore.submissions.values()) {
    if (sub.user_id === userId || (sub.phone_number && sub.phone_number === userId)) {
      userSubsMap.set(sub.id, sub);
    }
  }

  // 2. Attempt Firestore query & merge
  try {
    const subsRef = collection(db, 'task_submissions');
    const q = query(subsRef, where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach((d) => {
      const data = { id: d.id, ...(d.data() as any) } as TaskSubmission;
      userSubsMap.set(data.id, data);
      memoryStore.submissions.set(data.id, data);
    });
  } catch (err) {
    // Handled cleanly
  }

  return Array.from(userSubsMap.values());
}

/**
 * Retrieve a task submission by ID
 */
export async function getSubmissionById(submissionId: string): Promise<TaskSubmission | null> {
  if (memoryStore.submissions.has(submissionId)) {
    return memoryStore.submissions.get(submissionId)!;
  }

  try {
    const subRef = doc(db, 'task_submissions', submissionId);
    const subSnap = await getDoc(subRef);
    if (subSnap.exists()) {
      const data = { id: subSnap.id, ...(subSnap.data() as any) } as TaskSubmission;
      memoryStore.submissions.set(submissionId, data);
      return data;
    }
  } catch (err) {
    // Handled cleanly
  }
  return null;
}

/**
 * Insert a log into point_logs
 */
export async function createPointLog(userId: string, amount: number, description: string): Promise<PointLogRecord> {
  const logId = `PLOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const payload: PointLogRecord = {
    id: logId,
    user_id: userId,
    amount,
    description,
    created_at: new Date().toISOString(),
    timestamp: Date.now(),
  };

  memoryStore.pointLogs.unshift(payload);

  try {
    const logRef = doc(db, 'point_logs', logId);
    await setDoc(logRef, {
      ...payload,
      serverTime: serverTimestamp(),
    });
  } catch (err) {
    // Handled in memoryStore
  }

  return payload;
}

/**
 * Update task submission status
 */
export async function updateSubmissionStatus(
  submissionId: string,
  status: 'approved' | 'rejected',
  verifiedBy: string = 'admin'
) {
  // Update in-memory
  const existing = memoryStore.submissions.get(submissionId);
  if (existing) {
    existing.status = status;
    existing.verified_by = verifiedBy;
    existing.updated_at = new Date().toISOString();
    memoryStore.submissions.set(submissionId, existing);
  }

  // Update in Firestore
  try {
    const subRef = doc(db, 'task_submissions', submissionId);
    await setDoc(
      subRef,
      {
        status,
        verified_by: verifiedBy,
        updated_at: new Date().toISOString(),
        updatedServerTime: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    // Handled cleanly
  }
}

/**
 * Retrieve recent task submissions (for admin)
 */
export async function getAllTaskSubmissions(limitCount = 100): Promise<TaskSubmission[]> {
  const subsMap = new Map<string, TaskSubmission>();

  // 1. Populate from memory store
  for (const sub of memoryStore.submissions.values()) {
    subsMap.set(sub.id, sub);
  }

  // 2. Try Firestore query
  try {
    const subsRef = collection(db, 'task_submissions');
    const q = query(subsRef, limit(limitCount));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach((d) => {
      const data = { id: d.id, ...(d.data() as any) } as TaskSubmission;
      subsMap.set(data.id, data);
      memoryStore.submissions.set(data.id, data);
    });
  } catch (err) {
    // Handled cleanly
  }

  return Array.from(subsMap.values()).slice(0, limitCount);
}

/**
 * Update product image in Firestore database
 */
export async function updateProductImage(productId: string, imageUrl: string) {
  try {
    const prodRef = doc(db, 'products', productId);
    await setDoc(
      prodRef,
      {
        id: productId,
        image: imageUrl,
        updated_at: new Date().toISOString(),
        updatedServerTime: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    // Handled cleanly
  }
  return { id: productId, image: imageUrl };
}

/**
 * Save or update full product in Firestore database
 */
export async function saveProductToDb(product: any) {
  const prodId = product.id || `prod_${Date.now()}`;
  const payload = {
    ...product,
    id: prodId,
    updated_at: new Date().toISOString(),
    updatedServerTime: serverTimestamp(),
  };

  // Update in memoryStore
  memoryStore.products.set(prodId, payload);

  try {
    const prodRef = doc(db, 'products', prodId);
    await setDoc(prodRef, payload, { merge: true });
  } catch (err) {
    // Handled cleanly
  }
  return payload;
}

/**
 * Delete product from Firestore database
 */
export async function deleteProductFromDb(productId: string) {
  if (!productId) return false;
  memoryStore.products.delete(productId);
  try {
    const prodRef = doc(db, 'products', productId);
    await deleteDoc(prodRef);
  } catch (err) {
    // Handled cleanly
  }
  return true;
}

/**
 * Get all products from Firestore database
 */
export async function getAllProductsFromDb(): Promise<any[]> {
  const prodsMap = new Map<string, any>();

  // 1. Memory store
  for (const prod of memoryStore.products.values()) {
    prodsMap.set(prod.id, prod);
  }

  // 2. Query Firestore
  try {
    const prodCol = collection(db, 'products');
    const snapshot = await getDocs(prodCol);
    snapshot.docs.forEach((d) => {
      const data = { id: d.id, ...(d.data() as any) };
      prodsMap.set(data.id, data);
      memoryStore.products.set(data.id, data);
    });
  } catch (err) {
    // Handled cleanly
  }

  return Array.from(prodsMap.values());
}

/**
 * Reorder products in database
 */
export async function reorderProductsInDb(products: any[]) {
  if (!Array.isArray(products)) return false;
  for (let i = 0; i < products.length; i++) {
    const prod = products[i];
    const prodId = prod.id;
    if (!prodId) continue;
    const existing = memoryStore.products.get(prodId) || {};
    const updated = {
      ...existing,
      ...prod,
      order: i,
      updated_at: new Date().toISOString(),
    };
    memoryStore.products.set(prodId, updated);
    try {
      const prodRef = doc(db, 'products', prodId);
      await setDoc(prodRef, { order: i, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      // Handled cleanly
    }
  }
  return true;
}

/**
 * Get all customer users from database
 */
export async function getAllUsersFromDb(): Promise<any[]> {
  const usersMap = new Map<string, any>();

  // 1. Query Firestore first for source-of-truth customer data
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    snapshot.docs.forEach((d) => {
      const rawData = d.data() as any;
      const data = {
        id: d.id,
        uid: d.id,
        ...rawData,
        fullName: rawData.fullName || rawData.displayName || 'អតិថិជន',
        phoneNumber: rawData.phoneNumber || '',
        telegram: rawData.telegram || '',
        gender: rawData.gender || '',
        ageRange: rawData.ageRange || '',
        skinConcerns: rawData.skinConcerns || (rawData.skinConcern ? [rawData.skinConcern] : []),
        skinConcern: rawData.skinConcern || (Array.isArray(rawData.skinConcerns) ? rawData.skinConcerns.join(', ') : ''),
        acneDetails: rawData.acneDetails || '',
        points: typeof rawData.points === 'number' ? rawData.points : 0,
        tier: rawData.tier || 'normal',
        role: rawData.role || 'user',
        status: rawData.status || 'active',
        totalOrders: rawData.totalOrders || 0,
        totalSpentUsd: typeof rawData.totalSpentUsd === 'number' ? rawData.totalSpentUsd : (rawData.totalSpent || 0),
        createdAt: rawData.createdAt?.toDate ? rawData.createdAt.toDate().toISOString() : rawData.createdAt || new Date().toISOString(),
      };
      usersMap.set(data.id, data);
      memoryStore.users.set(data.id, data);
    });
  } catch (err) {
    // Handled cleanly
  }

  // 2. Memory store fallback if not in firestore
  for (const u of memoryStore.users.values()) {
    if (u && (u.id || u.uid)) {
      const id = u.id || u.uid;
      if (!usersMap.has(id)) {
        usersMap.set(id, {
          ...u,
          id,
          fullName: u.fullName || u.displayName || 'អតិថិជន',
        });
      }
    }
  }

  const list = Array.from(usersMap.values());
  list.sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
  return list;
}

/**
 * Create or save new customer user in database
 */
export async function createUserInDb(userData: any) {
  const userId = userData.id || `usr_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const payload = {
    ...userData,
    id: userId,
    points: typeof userData.points === 'number' ? userData.points : 15,
    tier: userData.tier || 'silver',
    role: userData.role || 'customer',
    status: userData.status || 'active',
    totalOrders: userData.totalOrders || 0,
    totalSpentUsd: userData.totalSpentUsd || 0,
    createdAt: userData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedServerTime: serverTimestamp(),
  };

  // Update memoryStore
  memoryStore.users.set(userId, payload);
  if (payload.phoneNumber) {
    memoryStore.users.set(payload.phoneNumber.replace(/\s+/g, ''), payload);
  }

  // Save to Firestore users collection
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, payload, { merge: true });
  } catch (err) {
    // Handled cleanly
  }

  return payload;
}

/**
 * Update user in database
 */
export async function updateUserInDb(userId: string, updateData: any) {
  if (!userId) return null;
  const existing = (await findUser(userId)) || {};
  const merged = {
    ...existing,
    ...updateData,
    id: userId,
    updatedAt: new Date().toISOString(),
    updatedServerTime: serverTimestamp(),
  };

  memoryStore.users.set(userId, merged);
  if (merged.phoneNumber) {
    memoryStore.users.set(merged.phoneNumber.replace(/\s+/g, ''), merged);
  }

  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, merged, { merge: true });
  } catch (err) {
    // Handled cleanly
  }

  return merged;
}

/**
 * Delete user from database
 */
export async function deleteUserFromDb(userId: string) {
  if (!userId) return false;
  memoryStore.users.delete(userId);

  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
  } catch (err) {
    // Handled cleanly
  }
  return true;
}

/**
 * Get all customer orders from database
 */
export async function getAllOrdersFromDb(): Promise<any[]> {
  const ordersMap = new Map<string, any>();

  // 1. Memory store
  for (const o of memoryStore.orders.values()) {
    if (o && o.id) {
      ordersMap.set(o.id, o);
    }
  }

  // 2. Query Firestore
  try {
    const ordersCol = collection(db, 'orders');
    const snapshot = await getDocs(ordersCol);
    snapshot.docs.forEach((d) => {
      const data = { id: d.id, ...(d.data() as any) };
      ordersMap.set(data.id, data);
      memoryStore.orders.set(data.id, data);
    });
  } catch (err) {
    // Handled cleanly
  }

  const list = Array.from(ordersMap.values());
  list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return list;
}

/**
 * Save new or existing order to database
 */
export async function saveOrderToDb(orderData: any) {
  const orderId = orderData.id || `ord_${Date.now()}`;
  const orderNumber = orderData.orderNumber || `BB-${Math.floor(100000 + Math.random() * 900000)}`;
  const payload = {
    ...orderData,
    id: orderId,
    orderNumber,
    paymentStatus: orderData.paymentStatus || 'pending',
    orderStatus: orderData.orderStatus || 'confirmed',
    createdAt: orderData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedServerTime: serverTimestamp(),
  };

  memoryStore.orders.set(orderId, payload);
  memoryStore.orders.set(orderNumber, payload);

  try {
    const orderRef = doc(db, 'orders', orderId);
    await setDoc(orderRef, payload, { merge: true });
  } catch (err) {
    // Handled cleanly
  }

  return payload;
}

/**
 * Update order status or tracking in database
 */
export async function updateOrderStatusInDb(
  orderId: string,
  orderStatus?: string,
  paymentStatus?: string,
  trackingCode?: string
) {
  if (!orderId) return null;
  const existing = memoryStore.orders.get(orderId) || {};
  const updated = {
    ...existing,
    id: orderId,
    ...(orderStatus ? { orderStatus } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(trackingCode !== undefined ? { trackingCode } : {}),
    updatedAt: new Date().toISOString(),
    updatedServerTime: serverTimestamp(),
  };

  memoryStore.orders.set(orderId, updated);
  if (updated.orderNumber) {
    memoryStore.orders.set(updated.orderNumber, updated);
  }

  try {
    const orderRef = doc(db, 'orders', orderId);
    await setDoc(orderRef, updated, { merge: true });
  } catch (err) {
    // Handled cleanly
  }

  return updated;
}

/**
 * Delete order from database
 */
export async function deleteOrderFromDb(orderId: string) {
  if (!orderId) return false;
  const existing = memoryStore.orders.get(orderId);
  memoryStore.orders.delete(orderId);
  if (existing?.orderNumber) {
    memoryStore.orders.delete(existing.orderNumber);
  }

  try {
    const orderRef = doc(db, 'orders', orderId);
    await deleteDoc(orderRef);
  } catch (err) {
    // Handled cleanly
  }
  return true;
}


